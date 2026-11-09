// The guard runtime: one per plugin instance (one project root). It owns the
// snapshot cache, the sessions, the bypass, and the hook handlers. index.ts
// wires the handlers to the OpenCode hooks; the tests call them directly.
import { dirname, joinPath, parsePlan, ruleSection } from './core/parse'
import {
  SETUP_DENY,
  applyEdit,
  closedTracks,
  commitDecision,
  commitReminder,
  editDecision,
  isInside,
  isTestCommand,
  isTestFile,
  parseCommitCommand,
  phaseStartNote,
  redFor,
  relative,
  taskKey,
  tddDecision,
  trackCloseDecision,
} from './core/guards'
import { gitStatus, loadSnapshot, planPathOf, readOrEmpty } from './snapshot'
import { endTurn, isFollowUp, startTurn } from './hooks/turn'
import type { IdleAction } from './hooks/turn'
import { writeStateFile } from './state'
import type { Bypass, SessionState, Sessions } from './state'
import { namedTrack, sessionNote, sessionNoteKey } from './track'
import type { SessionSnapshot } from './track'
import type { ClosingTrack, Decision, GuardContext, Mode } from './types'
import {
  SETUP_DENY_OPENCODE,
  appendResult,
  applyMultiEdit,
  callFailed,
  commandOf,
  commitFiles,
  commitShaOf,
  fileEditOf,
  isShellTool,
  resultText,
  writtenPaths,
} from './hooks/tools'
import type { CompactionEvent, ContextEvent, PromptEvent, ToolAfterEvent, ToolBeforeEvent } from './hooks/types'
import { readFile } from 'node:fs/promises'

/** The marker that starts every note the plugin appends to a prompt or a tool output. */
export const NOTE_MARK = 'measure-guard'

/** The agent whose prompt holds the rule itself (spec decision 1). */
export const RULE_AGENT = 'measure-orchestrator'

/** How long a prompt waits for the session title; then the title gives no clue. */
export const TITLE_WAIT_MS = 1000

/** The value of `promise`, or `fallback` when it fails or takes more than `ms`. */
const within = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
  new Promise(resolve => {
    const timer = setTimeout(() => resolve(fallback), ms)
    const done = (value: T): void => {
      clearTimeout(timer)
      resolve(value)
    }
    promise.then(done, () => done(fallback))
  })

export class Guard {
  private snapshot: SessionSnapshot | null = null
  /** Notes an allowed call earned in the before hook, by call id, for the after hook. */
  private readonly callNotes = new Map<string, string[]>()
  /** The ids of the allowed commit calls of a `[~]` task, which get the commit reminder. */
  private readonly commitCalls = new Set<string>()

  constructor(
    readonly root: string,
    readonly mode: Mode,
    readonly sessions: Sessions,
    readonly bypass: Bypass,
    /** The state file base folder; the default is under ~/.local/state. */
    readonly stateBase?: string,
    /** The title of a session, a track clue; index.ts reads it from the host. */
    readonly titleOf?: (sessionID: string) => Promise<string | null>,
  ) {}

  /** Reads the Measure files again and keeps the result. */
  async refresh(): Promise<SessionSnapshot> {
    this.snapshot = await loadSnapshot(this.root)
    return this.snapshot
  }

  /** The kept snapshot, read on first use. */
  async current(): Promise<SessionSnapshot> {
    return this.snapshot ?? this.refresh()
  }

  /** The session record. */
  session(sessionID: string): SessionState {
    return this.sessions.sessionOf(sessionID)
  }

  /** What the guards read: the snapshot, the mode, the setup answer, and the bypass. */
  async guardContext(sessionID: string): Promise<GuardContext> {
    const snapshot = await this.current()
    return {
      snapshot,
      mode: this.mode,
      setupChoice: this.session(sessionID).setupChoice,
      guardsOff: await this.bypass.get(this.root),
    }
  }

  /** Writes the state file for the terminal plugin. */
  async publish(problems: readonly string[]): Promise<void> {
    await writeStateFile(
      { root: this.root, mode: this.mode, guardsOff: await this.bypass.get(this.root), problems: [...problems], updatedAt: new Date().toISOString() },
      this.stateBase,
    )
  }

  /** Appends the fixed rule section to the system prompt of every agent but RULE_AGENT. */
  async onContext(event: ContextEvent): Promise<void> {
    this.session(event.sessionID).agent = event.agent
    if (event.agent === RULE_AGENT) return
    if (!(await this.current()).hasMeasure) return
    event.system.push({ type: 'text', text: ruleSection() })
  }

  /**
   * Starts the turn, and appends the reminder and the task note to the prompt
   * text. The title and then the prompt text can name the track of the session
   * first. The plugin's own follow-up prompt (strict mode) keeps the running
   * turn and its count, so the next idle sees the same problems.
   */
  async onPrompt(event: PromptEvent): Promise<void> {
    if (isFollowUp(event.prompt.text)) return
    const snapshot = await this.refresh()
    const session = this.session(event.sessionID)
    await this.noticeTitle(session, snapshot)
    this.notice(session, event.prompt.text, snapshot)
    session.turn = snapshot.hasMeasure ? startTurn(snapshot, await gitStatus(this.root)) : null
    const reminder = session.reminder
    session.reminder = null
    const notes = [reminder, await this.pendingNote(event.sessionID, snapshot)].filter((note): note is string => note !== null)
    if (notes.length === 0) return
    event.prompt.text = `${event.prompt.text}\n\n${notes.join('\n\n')}`
  }

  /**
   * The end-of-turn check on `session.idle`: the problems go to the state
   * file; the action says what index.ts sends to the session. A follow-up
   * counts on the turn; a reminder is kept for the next prompt and ends the turn.
   */
  async onIdle(sessionID: string): Promise<IdleAction> {
    const session = this.session(sessionID)
    if (session.turn === null) return { kind: 'none', problems: [] }
    const snapshot = await this.refresh()
    const guardsOff = (await this.bypass.get(this.root)) !== null
    const action = endTurn(this.mode, session.turn, snapshot, await gitStatus(this.root), guardsOff)
    session.problems = action.problems
    await this.publish(action.problems)
    if (action.kind === 'follow-up') session.turn = { ...session.turn, blocks: session.turn.blocks + 1 }
    else {
      session.turn = null
      if (action.kind === 'remind') session.reminder = action.text
    }
    return action
  }

  /** Adds the task note to the compaction request, and sends it again after the compaction. */
  async onCompaction(event: CompactionEvent): Promise<void> {
    const snapshot = await this.current()
    const note = sessionNote(snapshot, this.session(event.sessionID).track, this.mode)
    if (note !== null) event.system.push({ type: 'text', text: note })
    this.session(event.sessionID).notedKey = null
  }

  /**
   * The guards before a tool call: the edit guard, the closeout guard, and in
   * strict mode the TDD and commit guards. A deny throws an Error with the text
   * the agent reads; an allowed call may earn notes for the after hook.
   */
  async onToolBefore(event: ToolBeforeEvent): Promise<void> {
    const session = this.session(event.sessionID)
    session.agent = event.agent
    const paths = writtenPaths(event.tool, event.input, this.root)
    const command = isShellTool(event.tool) ? commandOf(event.input) : null
    const commit = command !== null && this.mode === 'strict' ? parseCommitCommand(command) : null
    if (paths.length === 0 && commit === null) return
    const context = await this.guardContext(event.sessionID)
    const notes: string[] = []
    for (const path of paths) {
      this.deny(this.editGuard(context, session, path))
      const closed = await this.closeout(context, event.tool, event.input, path)
      this.deny(closed.decision)
      if (closed.note !== null) notes.push(closed.note)
      this.deny(tddDecision(context, session.red, path))
    }
    if (commit !== null) {
      const check = commitDecision(context, commit, await commitFiles(this.root, commit.takesChanges))
      this.deny(check.decision)
      if (check.note !== null) notes.push(check.note)
      if (context.guardsOff === null && taskKey(context.snapshot) !== null) this.commitCalls.add(event.id)
    }
    if (notes.length > 0) this.callNotes.set(event.id, notes)
  }

  /**
   * After a tool call: the notes the before hook earned, and the task note when
   * the call could change the plan or a written path names a new track.
   */
  async onToolAfter(event: ToolAfterEvent): Promise<void> {
    const notes = this.callNotes.get(event.id) ?? []
    this.callNotes.delete(event.id)
    const commitDue = this.commitCalls.delete(event.id)
    const result = event.status === 'completed' ? event.result : null
    const failed = callFailed(event.status, result)
    const paths = writtenPaths(event.tool, event.input, this.root)
    await this.recordRed(event, paths, failed)
    if (result === null) return
    if (failed) notes.length = 0
    else if (commitDue) notes.push(commitReminder(commitShaOf(resultText(result))))
    const moved = !failed && (await this.noticePaths(event.sessionID, paths))
    const touchesPlan = isShellTool(event.tool) || paths.some(path => isInside(joinPath(this.root, 'measure'), path))
    if (touchesPlan || moved) {
      const note = await this.pendingNote(event.sessionID, await this.refresh())
      if (note !== null) notes.push(note)
    }
    appendResult(result, notes)
  }

  /** Keeps the Red phase of the `[~]` task: a test file edit that ran, and a test command that failed. */
  private async recordRed(event: ToolAfterEvent, paths: readonly string[], failed: boolean): Promise<void> {
    const command = isShellTool(event.tool) ? commandOf(event.input) : null
    const isTestEdit = !failed && paths.some(isTestFile)
    const isFailedTest = failed && command !== null && isTestCommand(command)
    if (!isTestEdit && !isFailedTest) return
    const session = this.session(event.sessionID)
    const red = redFor(session.red, taskKey(await this.current()))
    session.red = { ...red, testChanged: red.testChanged || isTestEdit, testFailed: red.testFailed || isFailedTest }
  }

  private deny(decision: Decision): void {
    if (decision !== null) throw new Error(decision.deny)
  }

  /** The edit guard; the setup deny of the mod becomes the OpenCode text and fires once per session. */
  private editGuard(context: GuardContext, session: SessionState, path: string): Decision {
    const decision = editDecision(context, path)
    if (decision === null || decision.deny !== SETUP_DENY) return decision
    session.setupChoice = 'off'
    return { deny: SETUP_DENY_OPENCODE }
  }

  /** The closeout guard for an edit of tracks.md or a plan.md: the decision, and the note of an allowed call (the [b] list, or the phase-start note). */
  private async closeout(context: GuardContext, tool: string, input: unknown, path: string): Promise<{ decision: Decision; note: string | null }> {
    const none = { decision: null, note: null }
    const { snapshot } = context
    if (snapshot === null || !snapshot.hasMeasure || !isInside(joinPath(snapshot.root, 'measure'), path)) return none
    const isRegistry = path === snapshot.tracksPath
    if (!isRegistry && !path.endsWith('/plan.md')) return none
    const before = await readOrEmpty(path)
    const edit = fileEditOf(tool, input)
    const after = edit !== null ? applyEdit(edit, before) : tool === 'multiedit' ? applyMultiEdit(input, before) : null
    if (after === null) return none
    if (!isRegistry) return { decision: null, note: phaseStartNote(context, before, after) }
    const closing: ClosingTrack[] = []
    for (const entry of closedTracks(before, after)) {
      const planPath = await planPathOf(joinPath(dirname(path), entry.folder))
      closing.push({ entry, plan: planPath === null ? null : parsePlan(await readFile(planPath, 'utf8')) })
    }
    return trackCloseDecision(context, closing)
  }

  /** Sets the track of the session when the clue names one `[~]` track; true when the track changed. */
  private notice(session: SessionState, clue: string, snapshot: SessionSnapshot): boolean {
    const id = namedTrack(clue, snapshot.tracks)
    if (id === null || id === session.track) return false
    session.track = id
    return true
  }

  /** The title clue: only while the session has no track, and at most TITLE_WAIT_MS. */
  private async noticeTitle(session: SessionState, snapshot: SessionSnapshot): Promise<void> {
    const { titleOf } = this
    if (titleOf === undefined || session.track !== null || !snapshot.hasMeasure) return
    const title = await within(Promise.resolve().then(() => titleOf(session.sessionID)), TITLE_WAIT_MS, null)
    if (title !== null) this.notice(session, title, snapshot)
  }

  /** The path clues of a completed call, relative to the root; true when the track changed. */
  private async noticePaths(sessionID: string, paths: readonly string[]): Promise<boolean> {
    if (paths.length === 0) return false
    const snapshot = await this.current()
    const session = this.session(sessionID)
    let moved = false
    for (const path of paths) moved = this.notice(session, relative(snapshot, path), snapshot) || moved
    return moved
  }

  /** The task note of the session when its track or task changed since its last note; null otherwise. */
  async pendingNote(sessionID: string, snapshot: SessionSnapshot): Promise<string | null> {
    const session = this.session(sessionID)
    const key = sessionNoteKey(snapshot, session.track)
    if (key === null || session.notedKey === key) return null
    session.notedKey = key
    return sessionNote(snapshot, session.track, this.mode)
  }
}
