// Pure parse functions over the text of the Measure files. No `$` here, so
// the tests call them directly.
import type { Mode, Plan, Snapshot, Task, TrackEntry } from '../types'

const todo = (name: string): never => {
  throw new Error(`${name}: not implemented`)
}

/** The `mode` option as a Mode; `guard` when unset or unknown. */
export const parseMode = (value: unknown): Mode => todo('parseMode')

/** Joins path parts and resolves `.` and `..` segments. */
export const joinPath = (...parts: string[]): string => todo('joinPath')

/** The target of the first markdown link on a line that matches `label`. */
export const findLink = (md: string, label: RegExp): string | null => todo('findLink')

/** All entries of tracks.md, in both entry formats, in file order. */
export const parseTracks = (md: string): TrackEntry[] => todo('parseTracks')

/** The phases of plan.md with their top-level tasks. */
export const parsePlan = (md: string): Plan => todo('parsePlan')

/** True for `[ ]`, `[~]`, and a `[b]` task with no `deferred:<owner>` field. */
export const isOpen = (task: Task): boolean => todo('isOpen')

/** The first `[~]` task of the plan. */
export const currentTask = (plan: Plan): Task | null => todo('currentTask')

/**
 * The active track: the first `[~]` track whose plan has a `[~]` task, else
 * the first `[~]` track. `plans` maps a track id to its parsed plan.
 */
export const selectActive = (
  tracks: readonly TrackEntry[],
  plans: ReadonlyMap<string, Plan>,
): TrackEntry | null => todo('selectActive')

/** The system prompt section; null when the project has no measure/ folder. */
export const contextSection = (snapshot: Snapshot): string | null => todo('contextSection')
