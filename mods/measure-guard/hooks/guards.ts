// Pure guard decisions. Each takes a GuardContext and the call, and returns
// null to allow it or { deny } with the text the agent reads.
import type { Decision, GuardContext, SetupChoice, Snapshot } from '../types'
import { currentTask, joinPath, nextTask } from './parse'

/** The text every deny ends with: the bypass. */
export const BYPASS = 'If this block is wrong, the user can run /measure-off.'

/** True when `path` is `folder` or lies under it. */
export const isInside = (folder: string, path: string): boolean => {
  const f = joinPath(folder)
  const p = joinPath(path)
  return p === f || p.startsWith(`${f}/`)
}

/** A path relative to the project root, for the texts the agent reads. */
export const relative = (snapshot: Snapshot, path: string): string =>
  isInside(snapshot.root, path) ? joinPath(path).slice(joinPath(snapshot.root).length + 1) : path

/**
 * The edit guard (guard and strict modes): denies a write to a file inside
 * the project root and outside measure/ while no task in the active plan has
 * `[~]`. Allows on a parse error, outside the project, and in advise mode.
 */
export const editDecision = (context: GuardContext, path: string): Decision => {
  const { snapshot, mode } = context
  if (mode === 'advise' || snapshot === null || !snapshot.hasMeasure || snapshot.parseError !== null) return null
  if (!isInside(snapshot.root, path) || isInside(joinPath(snapshot.root, 'measure'), path)) return null

  const { active } = snapshot
  if (active === null) {
    return {
      deny: `measure-guard: no track is in progress, so this edit belongs to no task. Create a track (Measure new-track), or mark a track \`[~]\` in measure/tracks.md. Then do the edit again. ${BYPASS}`,
    }
  }
  if (currentTask(active.plan) !== null) return null
  const next = nextTask(active.plan)
  return {
    deny: `measure-guard: no task in the track "${active.entry.name}" is in progress. Mark the next task \`[~]\` in ${relative(snapshot, active.planPath)}${next === null ? '' : ` (${next.text})`}. Then do the edit again. ${BYPASS}`,
  }
}

/** The prompt the `[ Set up Measure ]` button sends to the agent. */
export const SETUP_PROMPT =
  'Set up Measure in this project: run the Measure setup workflow (the measure skill, "setup").'

/** True for a git repository with no measure/ folder: the mod asks the user. */
export const needsSetup = (snapshot: Snapshot | null): boolean => {
  throw new Error('needsSetup: not implemented')
}

/**
 * The band text for a repository with no measure/ folder, by the answer;
 * null when the band shows nothing (no question, or turned off).
 */
export const setupBandText = (choice: SetupChoice | null): string | null => {
  throw new Error('setupBandText: not implemented')
}
