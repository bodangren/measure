// The guard runtime: one per plugin instance (one project root). It owns the
// snapshot cache, the sessions, the bypass, and the hook handlers. index.ts
// wires the handlers to the OpenCode hooks; the tests call them directly.
import { noteKey, ruleSection, taskNote } from './core/parse'
import { loadSnapshot } from './snapshot'
import { writeStateFile } from './state'
import type { Bypass, SessionState, Sessions } from './state'
import type { GuardContext, Mode, Snapshot } from './types'
import type { CompactionEvent, ContextEvent, PromptEvent } from './hooks/types'

/** The marker that starts every note the plugin appends to a prompt or a tool output. */
export const NOTE_MARK = 'measure-guard'

/** The agent whose prompt holds the rule itself (spec decision 1). */
export const RULE_AGENT = 'measure-orchestrator'

export class Guard {
  private snapshot: Snapshot | null = null

  constructor(
    readonly root: string,
    readonly mode: Mode,
    readonly sessions: Sessions,
    readonly bypass: Bypass,
    /** The state file base folder; the default is under ~/.local/state. */
    readonly stateBase?: string,
  ) {}

  /** Reads the Measure files again and keeps the result. */
  async refresh(): Promise<Snapshot> {
    this.snapshot = await loadSnapshot(this.root)
    return this.snapshot
  }

  /** The kept snapshot, read on first use. */
  async current(): Promise<Snapshot> {
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

  /** Appends the task note to the prompt text when the track or the task changed. */
  async onPrompt(event: PromptEvent): Promise<void> {
    const snapshot = await this.refresh()
    const session = this.session(event.sessionID)
    const reminder = session.reminder
    session.reminder = null
    const notes = [reminder, await this.pendingNote(event.sessionID, snapshot)].filter((note): note is string => note !== null)
    if (notes.length === 0) return
    event.prompt.text = `${event.prompt.text}\n\n${notes.join('\n\n')}`
  }

  /** Adds the task note to the compaction request, and sends it again after the compaction. */
  async onCompaction(event: CompactionEvent): Promise<void> {
    const snapshot = await this.current()
    const note = taskNote(snapshot, this.mode)
    if (note !== null) event.system.push({ type: 'text', text: note })
    this.session(event.sessionID).notedKey = null
  }

  /** The task note when the track or the task changed since the last note of the session; null otherwise. */
  async pendingNote(sessionID: string, snapshot: Snapshot): Promise<string | null> {
    const key = noteKey(snapshot)
    const session = this.session(sessionID)
    if (key === null || session.notedKey === key) return null
    session.notedKey = key
    return taskNote(snapshot, this.mode)
  }
}
