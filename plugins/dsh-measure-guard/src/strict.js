// The strict-mode Red-phase seam (FR-13). The rules and the deny texts are the
// shared core's (`tddDecision`, `redFor`, `taskKey`, `isTestFile`,
// `isTestCommand`); this module keeps the per-agent Red record and the adapter
// step that records it from a finished tool call.
import { isTestCommand, isTestFile, redFor, tddDecision, taskKey } from './core/guards.ts'
import { normalizeMutation } from './hooks.js'

export { isTestCommand, isTestFile, redFor, tddDecision, taskKey }

/** The kept Red phase of an agent; null before the first Red step. */
export const redOf = (state, agentId) => state.agents.sessionOf(agentId).red ?? null

/**
 * The Red record of the `[~]` task: the kept one when the task is unchanged,
 * an empty record for a new task (`redFor` resets on the task key).
 */
export const strictRed = (state, agentId, snapshot) => redFor(redOf(state, agentId), taskKey(snapshot))

/** The snapshot of one agent's canonical root; null when the root cannot be read. */
const snapshotOf = async (deps, agent) => {
  const root = await deps.rootOf(agent)
  return (await deps.snapshots.get(root)) ?? null
}

/**
 * Keeps a successful test-file write as `testChanged` for the `[~]` task.
 * Returns true only when the paths name a test file.
 */
export function noteRedEdit(state, agentId, snapshot, paths) {
  const list = Array.isArray(paths) ? paths : [paths]
  if (!list.some(path => typeof path === 'string' && isTestFile(path))) return false
  const red = redFor(redOf(state, agentId), taskKey(snapshot))
  state.agents.sessionOf(agentId).red = { ...red, testChanged: true }
  return true
}

/**
 * Keeps a failed test command as `testFailed` for the `[~]` task. Returns true
 * only when the command runs tests.
 */
export function noteRedFailure(state, agentId, snapshot, command) {
  if (typeof command !== 'string' || !isTestCommand(command)) return false
  const red = redFor(redOf(state, agentId), taskKey(snapshot))
  state.agents.sessionOf(agentId).red = { ...red, testFailed: true }
  return true
}

/**
 * Records the Red steps of one finished tool call in strict mode only: a
 * successful `edit`/`write` of a test file, or a failed `bash` test command.
 * The call's mutation is normalized again against the Session-effective
 * directory exactly as `prepareDecision` does. Every failure is swallowed: the
 * Red record is an aid and must never break a finished tool call.
 */
export async function recordRed(deps, exec, result) {
  if (deps.mode !== 'strict') return
  const agent = exec?.agent
  if (agent === undefined || agent === null) return
  try {
    const dir = typeof deps.dirOf === 'function' ? deps.dirOf(agent) : null
    if (dir === undefined || dir === null) return
    const mutation = await normalizeMutation(exec.name, exec.arguments, dir, deps.io)
    const exitCode = result?.value?.exitCode
    const failed = result?.isError === true || (typeof exitCode === 'number' && exitCode !== 0)
    if (mutation.kind === 'shell') {
      if (!failed) return
      noteRedFailure(deps.state, agent.id, await snapshotOf(deps, agent), mutation.command)
      return
    }
    if (mutation.kind !== 'file' || failed) return
    noteRedEdit(deps.state, agent.id, await snapshotOf(deps, agent), mutation.paths)
  } catch {
    // The Red record is an aid; the next edit or test run records again.
  }
}
