// Goal binding (Story S4): read the DeepSeek Harness goal as an optional
// capability, keep a status summary for the band/panel/state route, and report
// the two shape mismatches with the Measure track. The goal is read-only here
// except in the one /measure-goal command that seeds it from a track.
import { currentTask } from './core/parse.ts'

/** The goal service, or undefined on a host without it (read, never inject). */
export const goalService = ctx => {
  try {
    return typeof ctx?.get === 'function' ? ctx.get('goals') : undefined
  } catch {
    return undefined
  }
}

/** The current goal of one agent; null when none or when the host has no goals. */
export function goalOf(deps, agent) {
  const goals = deps.goals
  if (goals === undefined || goals === null || agent === undefined || agent === null) return null
  if (typeof goals.get !== 'function') return null
  try {
    return goals.get(agent) ?? null
  } catch {
    return null
  }
}

/** The state-route summary of a goal: null when there is no goal. */
export const goalSummary = goal =>
  goal === null || goal === undefined
    ? null
    : {
        objective: goal.objective,
        phase: goal.phase,
        round: goal.roundsStarted ?? 0,
        maxRounds: goal.maxGoalRounds ?? 0,
      }

/** The English status line of a goal: `<phase> · round <n>/<max> · <objective>`. */
export const goalLine = goal =>
  goal === null || goal === undefined
    ? null
    : `Goal ${goal.phase} · round ${goal.roundsStarted ?? 0}/${goal.maxGoalRounds ?? 0} · ${goal.objective}`

/** The seed objective of the active track; null when no track is in progress. */
export const seedObjective = snapshot => {
  const entry = snapshot?.tracks?.find(track => track.marker === '~') ?? null
  return entry === null || entry === undefined ? null : `Measure track "${entry.name}" (${entry.id}).`
}

/** The `[~]` task of the active track; null when there is none. */
const inProgressTask = snapshot => {
  const plan = snapshot?.active?.plan
  return plan === undefined || plan === null ? null : currentTask(plan)
}

/**
 * The two goal/track mismatches the end-of-turn check reports (Story S4): a
 * complete goal while a `[~]` task is open, and any current goal while no track
 * is in progress. The guard never mutates the goal.
 */
export function goalProblems(goal, snapshot) {
  if (goal === null || goal === undefined) return []
  const problems = []
  const task = inProgressTask(snapshot)
  if (goal.phase === 'complete' && task !== null) {
    problems.push(`the DSH goal "${goal.objective}" is complete but the task "${task.text}" is still [~].`)
  }
  const hasTracks = Array.isArray(snapshot?.tracks) && snapshot.tracks.length > 0
  if (goal.phase !== 'complete' && task === null && hasTracks) {
    problems.push(`the DSH goal "${goal.objective}" is ${goal.phase} but no Measure track is in progress.`)
  }
  return problems
}

/** The guidance the existing-goal reply adds, by phase. */
const guidanceOf = phase => {
  if (phase === 'paused') return 'resume or clear it first.'
  if (phase === 'blocked') return 'clear it before creating another goal.'
  return 'use the goal controls to edit or clear it.'
}

/**
 * The `/measure-goal` command (Story S4): with no current goal, seed one from
 * the active track; with a complete goal the goal service allows a replacement;
 * otherwise report the current goal without mutating it.
 */
export function measureGoalCommand(deps) {
  return {
    name: 'measure-goal',
    description: 'Create a DeepSeek Harness goal from the active Measure track, or report the current goal',
    handler: async invocation => {
      const agent = invocation.agent
      if (deps.goals === undefined || deps.goals === null || typeof deps.goals.create !== 'function') {
        return { kind: 'success', text: 'measure-guard: this DeepSeek Harness has no goal service.' }
      }
      const root = await deps.rootOf(agent)
      const snapshot = await deps.snapshots.get(root)
      const objective = seedObjective(snapshot)
      if (objective === null) {
        return { kind: 'success', text: 'measure-guard: no Measure track is in progress, so there is no track to seed a goal from.' }
      }
      const current = goalOf(deps, agent)
      if (current !== null && current.phase !== 'complete') {
        return {
          kind: 'success',
          text: `measure-guard: the goal "${current.objective}" is ${current.phase} (round ${current.roundsStarted ?? 0}/${current.maxGoalRounds ?? 0}); ${guidanceOf(current.phase)}`,
        }
      }
      try {
        const created = deps.goals.create(agent, { objective })
        return {
          kind: 'success',
          text: `measure-guard: created the goal "${created.objective}" (round ${created.roundsStarted ?? 0}/${created.maxGoalRounds ?? 0}).`,
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        return { kind: 'success', text: `measure-guard: the goal service refused: ${reason}` }
      }
    },
  }
}
