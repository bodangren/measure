// The terminal plugin's model: pure functions from the snapshot and the state
// file to the lines of the band and the sidebar, and the refresh rule. The
// terminal plugin (src/tui.tsx) reads the files and renders; the tests call
// these functions directly.
import type { Snapshot } from '../types'
import type { StateFile } from '../state'

/** How a band line is drawn. */
export type Tone = 'dim' | 'plain' | 'warn'

/** One line of the band above the prompt. */
export type BandLine = { text: string; tone: Tone }

/** The band: its lines; null when the band stays hidden (no git repository, or the setup question was answered with off). */
export type BandModel = { lines: BandLine[] } | null

/**
 * The band above the prompt: `bandLine()` (dim; warn on a parse error) and the
 * end-of-turn problems of the state file (warn) when there are any. In a git
 * repository without `measure/`, the setup text with the command hints; null
 * outside a repository.
 */
export const bandModel = (snapshot: Snapshot | null, state: StateFile | null): BandModel => {
  throw new Error(`not implemented: bandModel(${snapshot === null}, ${state === null})`)
}

/** The lines of the sidebar block: a "Measure" title and `statusLines()` with the bypass from the state file. */
export const sidebarLines = (snapshot: Snapshot | null, state: StateFile | null): string[] => {
  throw new Error(`not implemented: sidebarLines(${snapshot === null}, ${state === null})`)
}

/** The files whose mtime drives a refresh: the Measure files of the snapshot and the state file. */
export const watchedPaths = (root: string, snapshot: Snapshot | null, statePath: string): string[] => {
  throw new Error(`not implemented: watchedPaths(${root}, ${snapshot === null}, ${statePath})`)
}

/** A map of path to mtime (ms); a missing file is 0. */
export type Mtimes = Record<string, number>

/** True when a watched file changed, appeared, or disappeared since the last read. */
export const needsRefresh = (seen: Mtimes, now: Mtimes): boolean => {
  throw new Error(`not implemented: needsRefresh(${Object.keys(seen).length}, ${Object.keys(now).length})`)
}

/** The event types of the OpenCode stream after which the band reads the files again. */
export const REFRESH_EVENTS: ReadonlySet<string> = new Set([
  'file.edited',
  'session.idle',
  'session.execution.succeeded',
  'session.execution.failed',
  'session.execution.interrupted',
  'session.tool.success',
])

/** The timer period of the refresh, in ms. */
export const REFRESH_PERIOD_MS = 5000
