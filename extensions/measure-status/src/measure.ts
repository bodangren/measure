// The snapshot loader: reads the Measure files through the host file API and
// builds a Snapshot. The file-resolution algorithm mirrors
// mods/measure-guard/hooks/register.tsx lines 55-118, with the mod file system
// replaced by host calls and absolute paths replaced by project-relative paths.
import { HostRequestError } from '@openchamber/sdk'
import type { FileStatResult } from '@openchamber/sdk'
import { dirname, findLink, joinPath, parsePlan, parseTracks, selectActive } from './parse'
import type { Plan, Snapshot, TrackEntry } from './types'

/** The host file API the loader needs. Subset of `connectHost()`. */
export type MeasureHost = {
  readFile(path: string): Promise<{ content: string }>
  stat(path: string): Promise<FileStatResult>
  listDir(path: string): Promise<{ entries: Array<{ name: string; kind: string }> }>
}

/** The plan file of a track folder: the index's plan link, else plan.md. */
const planPathOf = async (host: MeasureHost, folder: string): Promise<string | null> => {
  const index = joinPath(folder, 'index.md')
  if ((await host.stat(index)).kind === 'file') {
    const link = findLink((await host.readFile(index)).content, /\bplan\b/i)
    if (link !== null && (await host.stat(joinPath(folder, link))).kind === 'file') return joinPath(folder, link)
  }
  const plan = joinPath(folder, 'plan.md')
  return (await host.stat(plan)).kind === 'file' ? plan : null
}

const empty = (directory: string | null): Snapshot => ({
  directory,
  hasMeasure: false,
  tracksPath: null,
  tracks: [],
  active: null,
  inProgressCount: 0,
  parseError: null,
})

/**
 * True when the error means the project was closed (no directory), not a
 * parse error. The UI shows the "no project" empty state for this case.
 */
const isNoDirectory = (error: unknown): boolean => error instanceof HostRequestError && error.code === 'NO_DIRECTORY'

/**
 * Reads index.md, tracks.md, and the plans of the `[~]` tracks. Returns a
 * Snapshot; never throws. File errors fall through to `parseError`, except
 * `NO_DIRECTORY`, which clears the directory so the UI shows the empty state.
 */
export const loadSnapshot = async (host: MeasureHost, directory: string | null): Promise<Snapshot> => {
  if (directory === null) return empty(null)

  let measureKind: FileStatResult['kind']
  try {
    measureKind = (await host.stat('measure')).kind
  } catch (error) {
    if (isNoDirectory(error)) return empty(null)
    return { ...empty(directory), parseError: errorMessage(error) }
  }
  if (measureKind !== 'directory') return empty(directory)

  let indexText: string | null
  try {
    if ((await host.stat('measure/index.md')).kind !== 'file') return { ...empty(directory), hasMeasure: true }
    indexText = (await host.readFile('measure/index.md')).content
  } catch (error) {
    if (isNoDirectory(error)) return empty(null)
    return { ...empty(directory), hasMeasure: true, parseError: errorMessage(error) }
  }

  const registryLink = indexText === null ? null : findLink(indexText, /Tracks Registry/i)
  const tracksPath = joinPath('measure', registryLink ?? 'tracks.md')
  let tracksText: string
  try {
    const tracksStat = await host.stat(tracksPath)
    if (tracksStat.kind !== 'file') {
      return {
        ...empty(directory),
        hasMeasure: true,
        tracksPath,
        parseError: `${tracksPath} is not a file`,
      }
    }
    tracksText = (await host.readFile(tracksPath)).content
  } catch (error) {
    if (isNoDirectory(error)) return empty(null)
    return { ...empty(directory), hasMeasure: true, tracksPath, parseError: errorMessage(error) }
  }

  const tracks = parseTracks(tracksText)
  if (tracks.length === 0 && /^- \[[ ~xb]\] /m.test(tracksText)) {
    return {
      ...empty(directory),
      hasMeasure: true,
      tracksPath,
      parseError: `${tracksPath} has track lines in no known format`,
    }
  }

  const plans = new Map<string, Plan>()
  const planPaths = new Map<string, string>()
  for (const track of tracks.filter((t: TrackEntry) => t.marker === '~')) {
    try {
      const path = await planPathOf(host, joinPath(dirname(tracksPath), track.folder))
      if (path === null) continue
      plans.set(track.id, parsePlan((await host.readFile(path)).content))
      planPaths.set(track.id, path)
    } catch (error) {
      if (isNoDirectory(error)) return empty(null)
      continue
    }
  }

  const inProgressCount = tracks.filter((t: TrackEntry) => t.marker === '~').length
  const base = {
    directory,
    hasMeasure: true,
    tracksPath,
    tracks,
    inProgressCount,
    parseError: null as string | null,
    active: null as Snapshot['active'],
  }
  const entry = selectActive(tracks, plans)
  if (entry === null) return base
  const plan = plans.get(entry.id)
  const planPath = planPaths.get(entry.id)
  if (plan === undefined || planPath === undefined) {
    return { ...base, parseError: `no plan.md for the active track ${entry.id}` }
  }
  if (plan.phases.length === 0) {
    return { ...base, parseError: `${planPath} has no "## Phase" heading` }
  }
  return { ...base, active: { entry, planPath, plan } }
}

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error)