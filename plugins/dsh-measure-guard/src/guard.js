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
      if (result.note !== null) notes.push(result.note)
    } else if (isPlanPath(path) && isInside(joinPath(root, 'measure'), path)) {
      const decision = phaseStartDecision(context, before, after)
      if (decision !== null) return { decision, note: null }
    }
  }
  return { decision: null, note: notes.length === 0 ? null : notes.join('\n\n') }
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
  const { agent } = exec
  if (agent === undefined || agent === null) return none
  if (!MUTATION_TOOLS.has(exec.name)) return none

  const root = await deps.rootOf(agent)
  const dir = typeof deps.dirOf === 'function' ? deps.dirOf(agent) : root
  if (dir === undefined || dir === null) return none

  const mutation = await normalizeMutation(exec.name, exec.arguments, dir, deps.io)
  if (mutation.kind !== 'file') return none

  const edit = await editGuardFor(deps, agent, root, mutation)
  if (edit !== null) return { denial: edit.deny, note: null }
  const closeout = await closeoutGuardFor(deps, agent, root, mutation)
  return { denial: closeout.decision?.deny, note: closeout.note ?? null }
}
