// Reads the Measure files of a project into a Snapshot (the same shape as the
// mod's $.state snapshot), with Node file APIs and git. Pure parsing is in core/.
import { execFile } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { dirname, findLink, joinPath, parsePlan, parseTracks, selectActive } from './core/parse'
import { statusLinesOf } from './core/guards'
import type { Plan, Snapshot } from './types'

const exists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

const read = (path: string): Promise<string> => readFile(path, 'utf8')

/** Runs git in `cwd`; null exit code when git cannot run. */
const git = (args: string[], cwd: string): Promise<{ code: number | null; stdout: string }> =>
  new Promise(resolve => {
    execFile('git', args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }, (error, stdout) => {
      const code = error === null ? 0 : typeof (error as { code?: unknown }).code === 'number' ? ((error as { code: number }).code) : null
      resolve({ code, stdout: typeof stdout === 'string' ? stdout : '' })
    })
  })

/** The plan file of a track folder: the index's plan link, else plan.md; null when neither exists. */
export const planPathOf = async (folder: string): Promise<string | null> => {
  const index = joinPath(folder, 'index.md')
  if (await exists(index)) {
    const link = findLink(await read(index), /\bplan\b/i)
    if (link !== null && (await exists(joinPath(folder, link)))) return joinPath(folder, link)
  }
  const plan = joinPath(folder, 'plan.md')
  return (await exists(plan)) ? plan : null
}

/** True when `root` is inside a git work tree. */
export const isGitRepo = async (root: string): Promise<boolean> => {
  if (!(await exists(root))) return false
  const ran = await git(['rev-parse', '--is-inside-work-tree'], root)
  return ran.code === 0 && ran.stdout.trim() === 'true'
}

/** The `git status --porcelain --untracked-files=all` lines of the project; none when git fails. */
export const gitStatus = async (root: string): Promise<string[]> => {
  if (!(await exists(root))) return []
  const ran = await git(['status', '--porcelain', '--untracked-files=all'], root)
  return ran.code === 0 ? statusLinesOf(ran.stdout) : []
}

/** The non-empty output lines of a git command in `root`; none when git fails. */
export const gitLines = async (args: string[], root: string): Promise<string[]> => {
  if (!(await exists(root))) return []
  const ran = await git(args, root)
  return ran.code === 0 ? ran.stdout.split('\n').filter(line => line.trim() !== '') : []
}

/** Reads index.md, tracks.md, and the plans of the `[~]` tracks under `<root>/measure/`. */
export const loadSnapshot = async (root: string): Promise<Snapshot> => {
  const base: Snapshot = {
    root,
    hasMeasure: false,
    isRepo: await isGitRepo(root),
    tracksPath: null,
    tracks: [],
    active: null,
    inProgressCount: 0,
    parseError: null,
  }
  const measure = joinPath(root, 'measure')
  if (!base.isRepo || !(await exists(measure))) return base

  try {
    const index = joinPath(measure, 'index.md')
    const registry = (await exists(index)) ? findLink(await read(index), /Tracks Registry/i) : null
    const tracksPath = joinPath(measure, registry ?? 'tracks.md')
    if (!(await exists(tracksPath))) return { ...base, hasMeasure: true }

    const tracksText = await read(tracksPath)
    const tracks = parseTracks(tracksText)
    if (tracks.length === 0 && /^- \[[ ~xb]\] /m.test(tracksText)) {
      return { ...base, hasMeasure: true, parseError: `${tracksPath} has track lines in no known format` }
    }

    const plans = new Map<string, Plan>()
    const planPaths = new Map<string, string>()
    for (const track of tracks.filter(t => t.marker === '~')) {
      const path = await planPathOf(joinPath(dirname(tracksPath), track.folder))
      if (path === null) continue
      plans.set(track.id, parsePlan(await read(path)))
      planPaths.set(track.id, path)
    }

    const loaded: Snapshot = { ...base, hasMeasure: true, tracksPath, tracks, inProgressCount: tracks.filter(t => t.marker === '~').length }
    const entry = selectActive(tracks, plans)
    if (entry === null) return loaded
    const plan = plans.get(entry.id)
    const planPath = planPaths.get(entry.id)
    if (plan === undefined || planPath === undefined) {
      return { ...loaded, parseError: `no plan.md for the active track ${entry.id}` }
    }
    if (plan.phases.length === 0) {
      return { ...loaded, parseError: `${planPath} has no "## Phase" heading` }
    }
    return { ...loaded, active: { entry, planPath, plan } }
  } catch (error) {
    return { ...base, hasMeasure: true, parseError: error instanceof Error ? error.message : String(error) }
  }
}

/** The text of a file; empty when it does not exist yet. */
export const readOrEmpty = async (path: string): Promise<string> => ((await exists(path)) ? read(path) : '')
