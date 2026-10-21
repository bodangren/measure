// The terminal plugin's model: pure functions from the snapshot and the state
// file to the lines of the band and the sidebar, and the refresh rule. The
// terminal plugin (src/tui.tsx) reads the files and renders; the tests call
// these functions directly.
import { bandLine, joinPath, statusLines } from '../core/parse'
import { needsSetup, setupBandText } from '../core/guards'
import type { Snapshot } from '../types'
import type { StateFile } from '../state'

/** The state file counts only when it belongs to the snapshot's root. */
const stateFor = (snapshot: Snapshot | null, state: StateFile | null): StateFile | null =>
  snapshot !== null && state !== null && state.root === snapshot.root ? state : null

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
  if (snapshot === null) return null
  if (needsSetup(snapshot)) {
    const text = setupBandText('pending')
    return text === null ? null : { lines: [{ text: `${text} /measure-setup sets it up; /measure-off turns the guards off for this session.`, tone: 'plain' }] }
  }
  const own = stateFor(snapshot, state)
  const line = bandLine(snapshot, own?.guardsOff ?? null)
  if (line === null) return null
  const lines: BandLine[] = [{ text: line, tone: snapshot.parseError !== null ? 'warn' : 'dim' }]
  const problems = own?.problems ?? []
  if (problems.length > 0) lines.push({ text: `End of turn: ${problems.join(' · ')}`, tone: 'warn' })
  return { lines }
}

/** The lines of the sidebar block: a "Measure" title and `statusLines()` with the bypass from the state file. */
export const sidebarLines = (snapshot: Snapshot | null, state: StateFile | null): string[] => [
  'Measure',
  ...statusLines(snapshot, stateFor(snapshot, state)?.guardsOff ?? null),
]

/** The files whose mtime drives a refresh: the Measure files of the snapshot and the state file. */
export const watchedPaths = (root: string, snapshot: Snapshot | null, statePath: string): string[] => {
  const paths = [joinPath(root, 'measure', 'index.md'), snapshot?.tracksPath ?? joinPath(root, 'measure', 'tracks.md')]
  if (snapshot?.active !== null && snapshot?.active !== undefined) paths.push(snapshot.active.planPath)
  paths.push(statePath)
  return paths
}

/** A map of path to mtime (ms); a missing file is 0. */
export type Mtimes = Record<string, number>

/** True when a watched file changed, appeared, or disappeared since the last read. */
export const needsRefresh = (seen: Mtimes, now: Mtimes): boolean => {
  const keys = new Set([...Object.keys(seen), ...Object.keys(now)])
  for (const key of keys) if (seen[key] !== now[key]) return true
  return false
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
