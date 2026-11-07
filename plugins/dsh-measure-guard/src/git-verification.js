// Git-backed verification of the task ceremony (Story S2). Markers alone cannot
// prove that an [x] task's SHA is a real commit with the mandated git note, and
// a closed track's metadata cannot prove its counts. This module asks git
// through the tri-state probe seam and reports what it finds; it never mutates
// the plan, the repository, or the metadata.
import { dirname, joinPath, tasksOf } from './core/parse.ts'
import { readOrEmpty } from './snapshot.js'

/** The task text without its trailing SHA, for the problem messages. */
const labelOf = task => task.text.replace(/\s*`?[0-9a-f]{7}`?\s*$/, '').trim()

/** The number of completed (`[x]`) top-level tasks in a plan. */
export const planCompletedCount = plan => tasksOf(plan).filter(task => task.marker === 'x').length

/**
 * The problems of the active plan's `[x]` tasks (Story S2): a cited SHA that no
 * commit owns, or a commit with no git note. A probe `error` (git unavailable,
 * a fatal exit code, a timeout) reports nothing and fails open.
 */
export async function shaProblems(deps, snapshot) {
  const plan = snapshot?.active?.plan
  if (plan === undefined || plan === null || typeof deps.gitProbe !== 'function') return []
  const root = snapshot.root
  const problems = []
  for (const task of tasksOf(plan)) {
    if (task.marker !== 'x' || task.sha === null) continue
    const commit = await deps.gitProbe(['cat-file', '-e', `${task.sha}^{commit}`], root)
    if (commit === 'error') continue
    if (commit === 'missing') {
      problems.push(`the task "${labelOf(task)}" cites SHA ${task.sha}, which no commit in this repository owns.`)
      continue
    }
    const note = await deps.gitProbe(['notes', 'show', task.sha], root)
    if (note === 'missing') {
      problems.push(`the task "${labelOf(task)}" has no git note on its commit ${task.sha}.`)
    }
  }
  return problems
}

/** The deny of one closed track whose metadata does not match its plan; null when it matches. */
const metadataProblem = async (deps, tracksPath, closing) => {
  const plan = closing.plan
  const completed = plan === null || plan === undefined ? 0 : planCompletedCount(plan)
  const entry = closing.entry
  const path = joinPath(dirname(tracksPath), entry.folder, 'metadata.json')
  const text = await readOrEmpty(deps.io, path)
  if (text.trim() === '') {
    return {
      deny: `measure-guard: the track "${entry.name}" has no metadata.json. Write it (actual_tasks: ${completed}) before the close. If this block is wrong, the user can run /measure-off.`,
    }
  }
  let metadata
  try {
    metadata = JSON.parse(text)
  } catch {
    return {
      deny: `measure-guard: ${path} is not valid JSON, so the track "${entry.name}" cannot be closed. Fix metadata.json first. If this block is wrong, the user can run /measure-off.`,
    }
  }
  const actual = metadata !== null && typeof metadata === 'object' ? metadata.actual_tasks : undefined
  if (actual !== completed) {
    return {
      deny: `measure-guard: the track "${entry.name}" is closed with metadata actual_tasks ${String(actual)} but its plan has ${completed} completed tasks. Fix metadata.json first. If this block is wrong, the user can run /measure-off.`,
    }
  }
  return null
}

/**
 * The closeout metadata check (Story S2): every track closed by a `tracks.md`
 * edit must have a `metadata.json` whose `actual_tasks` equals the number of
 * `[x]` tasks in its plan. Returns `{ decision }` for the first mismatch, else
 * null. A missing plan is left to the shared core (it reports the open tasks).
 */
export async function closeoutMetadataCheck(deps, tracksPath, closing) {
  if (typeof deps.io?.readText !== 'function') return null
  for (const one of closing) {
    if (one.plan === null || one.plan === undefined) continue
    const problem = await metadataProblem(deps, tracksPath, one)
    if (problem !== null) return { decision: problem }
  }
  return null
}
