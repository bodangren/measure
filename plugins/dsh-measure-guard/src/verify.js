// The on-demand verification command (Story S2): the same git-backed task
// problems the end-of-turn check reports, plus the active track's metadata
// verdict, in one read-only reply. Nothing here mutates state, nodes, plans, or
// metadata; a failure degrades to a "nothing to verify" reply.
import { dirname, joinPath, tasksOf } from './core/parse.ts'
import { planCompletedCount, shaProblems } from './git-verification.js'
import { readOrEmpty } from './snapshot.js'

/** The `<n> tasks checked` number: completed tasks that carry a SHA. */
const checkedCount = plan => tasksOf(plan).filter(task => task.marker === 'x' && task.sha !== null).length

/**
 * The text of `/measure-verify` (Story S2). Order: the git-backed problems,
 * then the metadata verdict, joined by newlines; a clean plan is one line.
 * Every failure path returns the `nothing to verify` form instead of throwing.
 */
export async function verifyReport(deps, agent) {
  try {
    const root = await deps.rootOf(agent)
    const snapshot = await deps.snapshots.get(root)
    if (snapshot === null || snapshot === undefined || !snapshot.hasMeasure) {
      return 'measure-guard: nothing to verify (no measure/ folder).'
    }
    const active = snapshot.active
    if (active === null || active === undefined) {
      return 'measure-guard: nothing to verify (no track in progress).'
    }

    const problems = await shaProblems(deps, snapshot)

    try {
      const metadataPath = joinPath(dirname(active.planPath), 'metadata.json')
      const text = await readOrEmpty(deps.io, metadataPath)
      if (typeof text === 'string' && text.trim() !== '') {
        let metadata
        try {
          metadata = JSON.parse(text)
        } catch {
          metadata = undefined
        }
        const completed = planCompletedCount(active.plan)
        if (metadata === undefined) {
          problems.push(
            `measure-guard: ${metadataPath} is not valid JSON, so the track "${active.entry.name}" cannot be closed. Fix metadata.json first.`,
          )
        } else if (metadata !== null && typeof metadata === 'object' && metadata.actual_tasks !== completed) {
          problems.push(
            `measure-guard: the track "${active.entry.name}" has metadata actual_tasks ${String(metadata.actual_tasks)} but its plan has ${completed} completed tasks. Fix metadata.json first.`,
          )
        }
      }
    } catch {
      // The metadata read is an aid; a failing read never breaks the report.
    }

    if (problems.length > 0) return problems.join('\n')
    return `measure-guard: verification clean (${checkedCount(active.plan)} tasks checked).`
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    return `measure-guard: nothing to verify (${reason}).`
  }
}

/** The `/measure-verify` command definition (read-only). */
export function measureVerifyCommand(deps) {
  return {
    name: 'measure-verify',
    description: 'Verify the active plan: real commits, git notes, and metadata actual_tasks (read-only)',
    handler: async invocation => ({ kind: 'success', text: await verifyReport(deps, invocation.agent) }),
  }
}
