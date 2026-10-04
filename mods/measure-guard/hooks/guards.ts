// Pure guard decisions. Each takes a GuardContext and the call, and returns
// null to allow it or { deny } with the text the agent reads.
import type { ClosingTrack, Decision, GuardContext, SetupChoice, Snapshot, TrackClose, TrackEntry } from '../types'
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
  if (mode === 'advise' || snapshot === null || context.guardsOff !== null) return null
  if (needsSetup(snapshot)) {
    const isAsking = context.setupChoice === null || context.setupChoice === 'pending'
    return isAsking && isInside(snapshot.root, path) ? { deny: SETUP_DENY } : null
  }
  if (!snapshot.hasMeasure || snapshot.parseError !== null) return null
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
export const needsSetup = (snapshot: Snapshot | null): boolean =>
  snapshot !== null && snapshot.isRepo && !snapshot.hasMeasure

/**
 * The band text for a repository with no measure/ folder, by the answer;
 * null when the band shows nothing (no question, or turned off).
 */
export const setupBandText = (choice: SetupChoice | null): string | null => {
  if (choice === null || choice === 'pending') return 'Measure · this repository has no measure/ folder.'
  if (choice === 'setup') return 'Measure · setup requested.'
  return null
}

/** The deny text while the setup question has no answer. */
export const SETUP_DENY = `measure-guard: this git repository has no measure/ folder. Ask the user: "Do you want to set up Measure, or turn off measure-guard for this session?" The user answers with the buttons [ Set up Measure ] or [ Turn off for session ] above the prompt. Do the edit after the user answers. ${BYPASS}`

/** The $.store key that keeps /measure-off repo for a repository root. */
export const offKey = (root: string): string => `off:${root}`

/** The tool inputs that write a whole file or replace a part of one. */
export type FileEdit =
  | { tool: 'Edit'; old_string: string; new_string: string; replace_all?: boolean }
  | { tool: 'Write'; content: string }

/** The file text after the edit; null when the edit does not apply. */
export const applyEdit = (edit: FileEdit, text: string): string | null => {
  throw new Error('applyEdit: not implemented')
}

/** The tracks that are not `[x]` in `before` and are `[x]` in `after`. */
export const closedTracks = (before: string, after: string): TrackEntry[] => {
  throw new Error('closedTracks: not implemented')
}

/**
 * The closeout guard for tracks.md (guard and strict): denies a track change
 * to `[x]` while its plan has an open task (`[ ]`, `[~]`, or `[b]` with no
 * owner). On an allow, the note lists all `[b]` tasks of the closed plans.
 */
export const trackCloseDecision = (context: GuardContext, closing: readonly ClosingTrack[]): TrackClose => {
  throw new Error('trackCloseDecision: not implemented')
}

/**
 * The closeout guard for plan.md (guard and strict): denies a task change to
 * `[~]` in phase N+1 while the heading of phase N has no `[checkpoint: <sha>]`.
 */
export const phaseStartDecision = (context: GuardContext, before: string, after: string): Decision => {
  throw new Error('phaseStartDecision: not implemented')
}
