// FR-10: the loader over `readFile`, `stat`, and `listDir`. One repo loads on
// its own, at most 8 calls at one time, and a failure never stops the others.
import { latestChange } from './age'
import { buildBoard, type PlanState, type RepoBoard, type TrackInput } from './board'
import { parsePlan } from './parse'
import { folderDate, parseRegistry, type DoneSource } from './registry'
import { measureFile, type RosterRepo } from './roster'
import type { Marker } from './types'

/** The host file API the loader needs. The band host has the same members. */
export type BoardHost = {
  readFile(path: string): Promise<{ content: string }>
  stat(path: string): Promise<{ kind: string; size: number; mtime: number }>
  listDir(path: string): Promise<{ entries: Array<{ name: string; kind: string }> }>
}

export const MAX_IN_FLIGHT = 8
export const RELOAD_MS = 60_000

export type RepoState =
  | { status: 'loading'; repo: RosterRepo }
  | { status: 'ready'; repo: RosterRepo; board: RepoBoard }
  | { status: 'error'; repo: RosterRepo; code: string; line: string }

export type Limiter = <T>(job: () => Promise<T>) => Promise<T>

/** A limiter that runs at most `max` jobs at one time. */
export const limiter = (max: number): Limiter => {
  let active = 0
  const waiting: Array<() => void> = []
  const release = (): void => {
    const next = waiting.shift()
    if (next !== undefined) next()
  }
  return async <T>(job: () => Promise<T>): Promise<T> => {
    if (active >= max) await new Promise<void>(resolve => waiting.push(resolve))
    active += 1
    try {
      return await job()
    } finally {
      active -= 1
      release()
    }
  }
}

/** The `code` property of a failure, else `UNKNOWN`. */
export const errorCode = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string') return code
  }
  return 'UNKNOWN'
}

/** The section line of a failed registry read. */
export const errorLine = (repo: RosterRepo, code: string): string =>
  code === 'NOT_FOUND'
    ? `No Measure tracks file at ${measureFile(repo, 'tracks.md')}.`
    : `Cannot read ${repo.id}: ${code}.`

const statTime = async (host: BoardHost, path: string, run: Limiter): Promise<number | null> => {
  try {
    const result = await run(() => host.stat(path))
    return result.kind === 'missing' ? null : result.mtime
  } catch {
    return null
  }
}

const lastChangeOf = async (
  host: BoardHost,
  repo: RosterRepo,
  folder: string,
  run: Limiter,
): Promise<number | null> => {
  const [plan, metadata] = await Promise.all([
    statTime(host, measureFile(repo, `${folder}/plan.md`), run),
    statTime(host, measureFile(repo, `${folder}/metadata.json`), run),
  ])
  return latestChange([plan, metadata])
}

const directoryNames = (entries: ReadonlyArray<{ name: string; kind: string }>): string[] =>
  entries
    .filter(entry => entry.kind === 'directory')
    .map(entry => entry.name)
    .sort((one, two) => (one < two ? -1 : one > two ? 1 : 0))

const doneByEntry = (marker: Marker, folder: string | null): boolean =>
  marker === 'x' || (folder !== null && folder.startsWith('archive/'))

/** Loads one repo into a board; never throws. */
export const loadRepo = async (
  host: BoardHost,
  repo: RosterRepo,
  run: Limiter,
): Promise<RepoState> => {
  const now = Date.now()

  const readText = async (path: string): Promise<string> => (await run(() => host.readFile(path))).content

  const list = async (path: string): Promise<Array<{ name: string; kind: string }>> => {
    try {
      return (await run(() => host.listDir(path))).entries
    } catch (error) {
      if (errorCode(error) === 'NOT_FOUND') return []
      throw error
    }
  }

  let registryText: string
  try {
    registryText = await readText(measureFile(repo, 'tracks.md'))
  } catch (error) {
    const code = errorCode(error)
    return { status: 'error', repo, code, line: errorLine(repo, code) }
  }

  let tracks: Array<{ name: string; kind: string }>
  let archive: Array<{ name: string; kind: string }>
  try {
    ;[tracks, archive] = await Promise.all([
      list(measureFile(repo, 'tracks')),
      list(measureFile(repo, 'archive')),
    ])
  } catch (error) {
    const code = errorCode(error)
    return { status: 'error', repo, code, line: errorLine(repo, code) }
  }

  const inputs: TrackInput[] = []
  const namedTracks = new Set<string>()
  const namedArchive = new Set<string>()

  for (const entry of parseRegistry(registryText)) {
    const folder = entry.folder
    if (folder !== null) {
      if (folder.startsWith('tracks/')) namedTracks.add(folder.slice('tracks/'.length))
      if (folder.startsWith('archive/')) namedArchive.add(folder.slice('archive/'.length))
    }
    let plan: PlanState = { kind: 'missing' }
    let lastChange: number | null = null
    if (folder !== null) {
      if (!doneByEntry(entry.marker, folder)) {
        try {
          const text = await readText(measureFile(repo, `${folder}/plan.md`))
          plan = { kind: 'plan', plan: parsePlan(text) }
        } catch (error) {
          plan = { kind: errorCode(error) === 'NOT_FOUND' ? 'missing' : 'unreadable' }
        }
      }
      lastChange = await lastChangeOf(host, repo, folder, run)
    }
    inputs.push({
      repo: repo.id,
      title: entry.title,
      registryMarker: entry.marker,
      folder,
      plan,
      lastChange,
      doneDate: entry.doneDate,
      doneSource: entry.doneSource,
      now,
    })
  }

  for (const name of directoryNames(tracks)) {
    if (namedTracks.has(name)) continue
    const folder = `tracks/${name}`
    let plan: PlanState
    try {
      const text = await readText(measureFile(repo, `${folder}/plan.md`))
      plan = { kind: 'plan', plan: parsePlan(text) }
    } catch (error) {
      if (errorCode(error) === 'NOT_FOUND') continue
      plan = { kind: 'unreadable' }
    }
    inputs.push({
      repo: repo.id,
      title: name,
      registryMarker: null,
      folder,
      plan,
      lastChange: await lastChangeOf(host, repo, folder, run),
      doneDate: null,
      doneSource: null,
      now,
    })
  }

  for (const name of directoryNames(archive)) {
    if (namedArchive.has(name)) continue
    const folder = `archive/${name}`
    const date = folderDate(folder)
    const doneSource: DoneSource | null = date === null ? null : 'folder'
    inputs.push({
      repo: repo.id,
      title: name,
      registryMarker: null,
      folder,
      plan: { kind: 'missing' },
      lastChange: await lastChangeOf(host, repo, folder, run),
      doneDate: date,
      doneSource,
      now,
    })
  }

  return { status: 'ready', repo, board: buildBoard(repo.id, inputs) }
}

/** Loads each repo in roster order and reports its final state. */
export const loadRoster = async (
  host: BoardHost,
  roster: readonly RosterRepo[],
  onState: (state: RepoState) => void,
): Promise<void> => {
  const run = limiter(MAX_IN_FLIGHT)
  for (const repo of roster) {
    onState(await loadRepo(host, repo, run))
  }
}

/** FR-10: a reload runs only while the page is visible and no load runs. */
export const shouldReload = (visible: boolean, loading: boolean): boolean => visible && !loading
