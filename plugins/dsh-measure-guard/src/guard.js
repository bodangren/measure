// The guard runtime (FR-7..FR-9): the GuardContext builder, the edit guard,
// the closeout guard, and the end-of-turn check. Every decision is the shared
// core's; this module only normalizes the call, reads the texts the core needs,
// and maps a core deny to the deny text the model reads.
import {
  MAX_BLOCKS,
  SETUP_DENY,
  changedDuringTurn,
  closedTracks,
  editDecision,
  phaseStartDecision,
  isInside,
  relative,
  stopAction,
  trackCloseDecision,
  turnProblems,
} from './core/guards.ts'
import { dirname, joinPath, parsePlan } from './core/parse.ts'
import { planPathOf, readOrEmpty } from './snapshot.js'
import { newUserMessage } from './state.js'
import { normalizeMutation } from './hooks.js'
import { strictRed, tddDecision } from './strict.js'
import { commitCheck } from './commit.js'
import { goalOf, goalProblems } from './goal.js'
import { closeoutMetadataCheck, shaProblems } from './git-verification.js'
import { shellWritePaths } from './shell.js'

/**
 * What the guards read (design §7): the snapshot, the mode, the setup answer,
 * and the bypass. `agent.id` is the session id; the setup answer lives in the
 * per-agent state, the bypass in the state's Bypass store.
 */
export async function guardContext(deps, agent, root) {
  const snapshot = (await deps.snapshots.get(root)) ?? null
  return {
    snapshot,
    mode: deps.mode,
    setupChoice: deps.state.agents.sessionOf(agent.id).setupChoice,
    guardsOff: await deps.state.bypass.get(root),
  }
}

/**
 * The path the guard checks: realpathed through the io seam against the
 * canonical root. A resolve failure returns null, which makes the guard fail
 * open for that path (design §5).
 */
const resolveForGuard = async (io, path, root) => {
  try {
    if (io === undefined || io === null || typeof io.resolve !== 'function') return path
    const target = await io.resolve(path, { cwd: root })
    const value = typeof target === 'string' ? target : target?.displayPath
    return typeof value === 'string' && value !== '' ? value : path
  } catch {
    return null
  }
}

/** The deny text of one denied path: the core text plus the denied paths. */
const denyWithPaths = (context, first, denied) => {
  const listed = denied
    .slice(0, 5)
    .map(path => relative(context.snapshot, path))
    .join(', ')
  const more = denied.length > 5 ? `, and ${denied.length - 5} more` : ''
  return { deny: `${first.deny}\nDenied path${denied.length === 1 ? '' : 's'}: ${listed}${more}` }
}

/**
 * The edit guard (FR-7): every file path of the mutation goes through the
 * shared `editDecision`; all paths are checked and then the first denial wins,
 * listing every denied path (up to five, then "and N more"). The setup deny
 * keeps the shared core's text and records the `off` answer after its first
 * use (the OpenCode adapter's behaviour).
 */
export async function editGuardFor(deps, agent, root, mutation) {
  if (mutation === null || mutation === undefined || mutation.kind !== 'file') return null
  const context = await guardContext(deps, agent, root)
  if (context.snapshot === null) return null

  const denied = []
  let first = null
  for (const path of mutation.paths ?? []) {
    const resolved = await resolveForGuard(deps.io, path, root)
    if (resolved === null) continue
    const decision = editDecision(context, resolved)
    if (decision === null) continue
    if (decision.deny === SETUP_DENY) {
      const session = deps.state.agents.sessionOf(agent.id)
      if (session.setupChoice === null || session.setupChoice === 'pending') session.setupChoice = 'off'
      return { deny: SETUP_DENY }
    }
    if (first === null) first = decision
    if (!denied.includes(resolved)) denied.push(resolved)
  }
  if (first === null) return null
  return denyWithPaths(context, first, denied)
}

/** True for the plan file of a track; the closeout guard checks every one. */
const isPlanPath = path => path === 'plan.md' || path.endsWith('/plan.md')

/**
 * The closeout guard (FR-8): a `tracks.md` edit is checked against every track
 * it closes (`closedTracks` + each plan's `trackCloseDecision`); a `plan.md`
 * edit uses `phaseStartDecision`. Only `edit`/`write` carry an after-text, so
 * every other mutation returns allow (fail open, design §13.6). On an allow the
 * core's `[b]` note is returned for the post-execute append.
 */
export async function closeoutGuardFor(deps, agent, root, mutation) {
  const none = { decision: null, note: null }
  if (mutation === null || mutation === undefined || mutation.kind !== 'file') return none
  if (mutation.afterTexts === undefined || mutation.afterTexts.size === 0) return none

  const context = await guardContext(deps, agent, root)
  const { snapshot } = context
  if (snapshot === null || !snapshot.hasMeasure || snapshot.parseError !== null) return none
  // `advise` allows every guard, and a bypass silences it; the shared core
  // already decides that way, and the metadata check must not outrun it.
  if (context.mode === 'advise' || context.guardsOff !== null) return none

  const registry = snapshot.tracksPath ?? joinPath(root, 'measure', 'tracks.md')
  const notes = []
  for (const [path, after] of mutation.afterTexts) {
    if (after === null || after === undefined) continue
    const before = await readOrEmpty(deps.io, path)
    if (path === registry) {
      const closing = []
      for (const entry of closedTracks(before, after)) {
        const planPath = await planPathOf(deps.io, joinPath(dirname(path), entry.folder))
        closing.push({ entry, plan: planPath === null ? null : parsePlan(await readOrEmpty(deps.io, planPath)) })
      }
      const result = trackCloseDecision(context, closing)
      if (result.decision !== null) return { decision: result.decision, note: null }
      const metadata = await closeoutMetadataCheck(deps, path, closing)
      if (metadata !== null) return { decision: metadata.decision, note: null }
      if (result.note !== null) notes.push(result.note)
    } else if (isPlanPath(path) && isInside(joinPath(root, 'measure'), path)) {
      const decision = phaseStartDecision(context, before, after)
      if (decision !== null) return { decision, note: null }
    }
  }
  return { decision: null, note: notes.length === 0 ? null : notes.join('\n\n') }
}

/**
 * The strict-mode TDD guard (FR-13): every file path of the mutation goes
 * through the shared `tddDecision` with the agent's kept Red record. The core
 * decides whether the write is a source file of the `[~]` task that still
 * needs a failing test; a non-strict mode, a bypass, no Measure project, or a
 * parse error leaves the shared decision null. The first denial wins.
 */
export async function tddGuardFor(deps, agent, root, mutation) {
  if (deps.mode !== 'strict') return null
  if (mutation === null || mutation === undefined || mutation.kind !== 'file') return null
  const context = await guardContext(deps, agent, root)
  if (context.snapshot === null || !context.snapshot.hasMeasure || context.snapshot.parseError !== null) return null
  const red = strictRed(deps.state, agent.id, context.snapshot)
  for (const path of mutation.paths ?? []) {
    const resolved = await resolveForGuard(deps.io, path, root)
    if (resolved === null) continue
    const decision = tddDecision(context, red, resolved)
    if (decision !== null) return decision
  }
  return null
}

/**
 * The strict-mode commit guard (FR-13): a shell command that makes a commit is
 * parsed by the shared core, checked against the files it takes, and returned
 * with the core's deny or note. `commitDue` marks an allowed commit of a `[~]`
 * task for the post-execute reminder. Outside strict mode, in a bypass, or
 * with no Measure project the shared decision is null.
 */
export async function commitGuardFor(deps, agent, root, mutation) {
  const none = { denial: undefined, note: null, commitDue: false }
  if (deps.mode !== 'strict') return none
  if (mutation === null || mutation === undefined || mutation.kind !== 'shell') return none
  const context = await guardContext(deps, agent, root)
  if (context.snapshot === null || !context.snapshot.hasMeasure || context.snapshot.parseError !== null) return none
  const check = await commitCheck(deps, context, mutation.command)
  return { denial: check.decision?.deny, note: check.note, commitDue: check.commitDue }
}

/**
 * The `agent/turn-stopping` check (FR-9, design §7): recompute the snapshot and
 * the git status, turn them into the core's `turnProblems`, and keep them for
 * the agent. A bypass silences everything; `advise` records only; `guard` lets
 * the context layer arm the next-step reminder; `strict` holds the turn open by
 * steering `newUserMessage(stopAction(...).block)` while `turn.blocks` is below
 * `MAX_BLOCKS`, and after the limit leaves the problems for the reminder.
 */
export async function onTurnStopping(deps, { agent, root, payload }) {
  if (agent === undefined || agent === null) return undefined
  const turnNumber = payload?.turn
  if (turnNumber === undefined || turnNumber === null) return undefined
  const turn = deps.state.turns.turnOf(agent.id, turnNumber)
  if (turn === undefined) return undefined
  const session = deps.state.agents.sessionOf(agent.id)

  let bypass
  try {
    bypass = await deps.state.bypass.get(root)
  } catch {
    session.problems = []
    return []
  }

  let snapshot = null
  let status = []
  try {
    snapshot = await deps.refreshSnapshot(root)
  } catch {
    snapshot = null
  }
  try {
    status = await deps.gitStatusOf(root)
  } catch {
    status = []
  }

  let problems = []
  if (bypass === null && snapshot !== null) {
    try {
      problems = turnProblems(snapshot, changedDuringTurn(turn.status, status), turn.unsha)
    } catch {
      problems = []
    }
    // The goal/track mismatches (Story S4) are reported, never mutated.
    try {
      problems = [...problems, ...goalProblems(goalOf(deps, agent), snapshot)]
    } catch {
      // The goal check is an aid; a goal-service failure never breaks the turn check.
    }
    // The git-backed verification (Story S2): real commits and git notes.
    try {
      problems = [...problems, ...(await shaProblems(deps, snapshot))]
    } catch {
      // git verification is an aid; a failing probe fails open.
    }
  }
  session.problems = [...problems]

  if (deps.mode !== 'strict' || problems.length === 0) return problems
  const action = stopAction('strict', problems, turn.blocks)
  if (action.block === null || turn.blocks >= MAX_BLOCKS) return problems
  if (typeof agent.steer !== 'function') return problems

  deps.state.turns.setTurn(agent.id, turnNumber, { ...turn, blocks: turn.blocks + 1 })
  agent.steer(
    newUserMessage({
      content: [{ type: 'text', text: action.block }],
      source: { kind: 'measure-guard', form: 'notice', summary: 'end-of-turn problems' },
    }),
  )
  return problems
}

/** The two exact deny texts of the unreadable registry writes (Story S3). */
export const REGISTRY_AFTER_TEXT_DENY =
  'measure-guard: the closeout guard cannot read the after-text of apply_patch (or str_replace_editor). Use edit or write for measure/tracks.md and measure/**/plan.md. If this block is wrong, the user can run /measure-off.'
export const REGISTRY_SHELL_DENY =
  'measure-guard: the closeout guard cannot read the after-text of a shell write. Use edit or write for measure/tracks.md and measure/**/plan.md. If this block is wrong, the user can run /measure-off.'

/** The tools whose mutations carry no reconstructable after-text. */
const AFTER_TEXT_TOOLS = new Set(['apply_patch', 'str_replace_editor'])

/** True for a path the closeout guard must be able to read after a close. */
const isRegistryPath = (snapshot, path) =>
  path === snapshot.tracksPath || (isInside(joinPath(snapshot.root, 'measure'), path) && path.endsWith('/plan.md'))

/**
 * The fail-closed case of Story S3: `apply_patch` and `str_replace_editor` carry
 * no after-text, so a registry or plan write through them cannot be checked and
 * is denied with the "use edit or write" text. Every other path keeps the old
 * fail-open behavior. Returns a decision or null.
 */
const afterTextToolDeny = (tool, context, mutation) => {
  if (!AFTER_TEXT_TOOLS.has(tool)) return null
  if (context.guardsOff !== null) return null
  if (mutation.afterTexts !== undefined && mutation.afterTexts.size > 0) return null
  const { snapshot } = context
  if (snapshot === null || !snapshot.hasMeasure) return null
  for (const path of mutation.paths ?? []) {
    if (isRegistryPath(snapshot, path)) return { deny: REGISTRY_AFTER_TEXT_DENY }
  }
  return null
}

/**
 * The shell-write guard of Story S3: every target the bounded grammar extracts
 * inside the project goes through the shared `editDecision` and, in strict mode,
 * `tddDecision`; a registry/plan target is denied with the shell text. A shell
 * call with no recognised target is allowed here (the end-of-turn check is the
 * backstop).
 */
export async function shellGuardFor(deps, agent, root, mutation) {
  const none = { denial: undefined, note: null, commitDue: false }
  const context = await guardContext(deps, agent, root)
  if (context.snapshot === null || context.guardsOff !== null) return none
  const paths = shellWritePaths(mutation.command)
  if (paths.length === 0) return none
  const dir = typeof deps.dirOf === 'function' ? deps.dirOf(agent) : root
  const red = strictRed(deps.state, agent.id, context.snapshot)
  for (const target of paths) {
    const resolved = await resolveForGuard(deps.io, target, dir)
    if (resolved === null || !isInside(context.snapshot.root, resolved)) continue
    if (isRegistryPath(context.snapshot, resolved)) return { denial: REGISTRY_SHELL_DENY, note: null }
    if (isInside(joinPath(context.snapshot.root, 'measure'), resolved)) continue
    const edit = editDecision(context, resolved)
    if (edit !== null) return { denial: edit.deny, note: null }
    const tdd = tddDecision(context, red, resolved)
    if (tdd !== null) return { denial: tdd.deny, note: null }
  }
  return none
}

/** The tools whose call the guard layer inspects at all. */
const MUTATION_TOOLS = new Set(['edit', 'write', 'apply_patch', 'str_replace_editor', 'bash', 'pwsh'])

/**
 * The whole pre-execute preparation for one call (FR-5): normalize the
 * mutation against the Session-effective directory, run the edit guard, then
 * the closeout guard. Returns `{denial, note}`; a deny wins over a note, and a
 * call the guard does not inspect is allowed. The listener wraps this call in
 * try/catch, so any throw fails open.
 */
export async function prepareDecision(deps, exec) {
  const none = { denial: undefined, note: null }
  if (exec === undefined || exec === null) return none
  // Mode `advise` allows every guard; the new Story S3/S2 denies obey that too.
  if (deps.mode === 'advise') return none
  const { agent } = exec
  if (agent === undefined || agent === null) return none
  if (!MUTATION_TOOLS.has(exec.name)) return none

  const root = await deps.rootOf(agent)
  const dir = typeof deps.dirOf === 'function' ? deps.dirOf(agent) : root
  if (dir === undefined || dir === null) return none

  const mutation = await normalizeMutation(exec.name, exec.arguments, dir, deps.io)
  if (mutation.kind === 'shell') {
    const shell = await shellGuardFor(deps, agent, root, mutation)
    if (shell.denial !== undefined) return shell
    return commitGuardFor(deps, agent, root, mutation)
  }
  if (mutation.kind !== 'file') return none

  const edit = await editGuardFor(deps, agent, root, mutation)
  if (edit !== null) return { denial: edit.deny, note: null }
  const afterText = afterTextToolDeny(exec.name, await guardContext(deps, agent, root), mutation)
  if (afterText !== null) return { denial: afterText.deny, note: null }
  const closeout = await closeoutGuardFor(deps, agent, root, mutation)
  if (closeout.decision !== null && closeout.decision !== undefined) return { denial: closeout.decision.deny, note: null }
  const tdd = await tddGuardFor(deps, agent, root, mutation)
  if (tdd !== null) return { denial: tdd.deny, note: null }
  return { denial: undefined, note: closeout.note ?? null }
}
