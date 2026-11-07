// The snapshot service: the testable I/O seam over ctx.fs and ctx.subprocess,
// the canonical root, the loader that reads the Measure files, the git status,
// and the per-root cache. Parsing stays in the shared core (src/core/parse.ts).
import { ALLOW_FILE, dirname, findLink, joinPath, parseAllowList, parsePlan, parseTracks, selectActive } from './core/parse.ts'

/** The byte caps and the grace period of the git calls (design §4). */
const GIT_STDOUT_MAX = 64 * 1024
const GIT_STDERR_MAX = 8 * 1024
const GIT_GRACE_MS = 5000

/**
 * The I/O seam the snapshot code uses. Every method resolves to a safe value on
 * failure (`resolve` falls back to the input path, `readText` to '', `exists`
 * to false, `gitLines` to []) so no snapshot call can throw.
 */
export function makeIo(ctx) {
  const resolve = async (path, cwd, signal) => {
    try {
      const target = await ctx.fs.resolve(path, { cwd, signal })
      return target.displayPath
    } catch {
      return path
    }
  }

  const readText = async (path, signal) => {
    try {
      const target = await ctx.fs.resolve(path, { signal })
      return await ctx.fs.readText(target, signal)
    } catch {
      return ''
    }
  }

  const exists = async (path, signal) => {
    try {
      const target = await ctx.fs.resolve(path, { signal })
      const info = await ctx.fs.stat(target, signal)
      return info !== undefined && info !== null
    } catch {
      return false
    }
  }

  const gitLines = async (args, cwd, signal) => {
    try {
      const executable = await ctx.subprocess.resolveExecutable('git', undefined, signal)
      const handle = ctx.subprocess.spawn({
        argv: [executable, ...args],
        cwd,
        stdio: {
          stdin: 'ignore',
          stdout: { maxBytes: GIT_STDOUT_MAX },
          stderr: { maxBytes: GIT_STDERR_MAX },
        },
        graceMs: GIT_GRACE_MS,
        signal,
      })
      const { exitCode } = await handle.done
      if (exitCode !== 0) return []
      const output = handle.collected?.stdout?.readFrom?.(0)
      const text = typeof output === 'string' ? output : output?.text ?? ''
      return String(text)
        .split('\n')
        .filter(line => line.trim() !== '')
    } catch {
      return []
    }
  }

  return { resolve, readText, exists, gitLines }
}

const safeExists = async (io, path, signal) => {
  try {
    return await io.exists(path, signal)
  } catch {
    return false
  }
}

const safeRead = async (io, path, signal) => {
  try {
    return await io.readText(path, signal)
  } catch {
    return ''
  }
}

const safeGit = async (io, args, cwd, signal) => {
  try {
    return await io.gitLines(args, cwd, signal)
  } catch {
    return []
  }
}

/**
 * The plan file of a track folder: the index's plan link, else plan.md; null
 * when neither exists (the same rule as the OpenCode adapter).
 */
export async function planPathOf(io, folder, signal) {
  const index = joinPath(folder, 'index.md')
  if (await safeExists(io, index, signal)) {
    const link = findLink(await safeRead(io, index, signal), /\bplan\b/i)
    if (link !== null && (await safeExists(io, joinPath(folder, link), signal))) return joinPath(folder, link)
  }
  const plan = joinPath(folder, 'plan.md')
  return (await safeExists(io, plan, signal)) ? plan : null
}

/** True when `root` is inside a git work tree. */
export async function isGitRepo(io, root, signal) {
  const lines = await safeGit(io, ['rev-parse', '--is-inside-work-tree'], root, signal)
  return lines[0]?.trim() === 'true'
}

/**
 * The canonical root of a directory: the realpathed directory, then git's
 * work-tree top level, realpathed again; the realpathed directory when git
 * fails or the directory is not a work tree (design §4).
 */
export async function canonicalRoot(io, dir, signal) {
  let resolved
  try {
    resolved = await io.resolve(dir, undefined, signal)
  } catch {
    return dir
  }
  const top = await safeGit(io, ['rev-parse', '--show-toplevel'], resolved, signal)
  if (top.length === 0 || top[0] === undefined) return resolved
  try {
    return await io.resolve(top[0], resolved, signal)
  } catch {
    return top[0]
  }
}

/** The allow list file; the empty list when it does not exist or cannot be read. */
const readAllow = async (io, path, signal) => {
  if (!(await safeExists(io, path, signal))) return { folders: [], ignored: [] }
  try {
    return parseAllowList(await safeRead(io, path, signal))
  } catch {
    return { folders: [], ignored: [] }
  }
}

/**
 * Reads index.md, tracks.md, and the plans of the `[~]` tracks under
 * `<root>/measure/`, and selects the active track. A tracks file in no known
 * format, an active track without a plan, and a plan without a `## Phase`
 * heading become `parseError` (the guards fail open on it).
 */
export async function loadSnapshot(io, root, signal) {
  const base = {
    root,
    hasMeasure: false,
    isRepo: false,
    tracksPath: null,
    tracks: [],
    active: null,
    inProgressCount: 0,
    parseError: null,
    allow: { folders: [], ignored: [] },
  }
  const withRepo = { ...base, isRepo: await isGitRepo(io, root, signal) }
  const measure = joinPath(root, 'measure')
  if (!withRepo.isRepo || !(await safeExists(io, measure, signal))) return withRepo

  const allow = await readAllow(io, joinPath(measure, ALLOW_FILE), signal)
  try {
    const index = joinPath(measure, 'index.md')
    const registry = (await safeExists(io, index, signal)) ? findLink(await safeRead(io, index, signal), /Tracks Registry/i) : null
    const tracksPath = joinPath(measure, registry ?? 'tracks.md')
    if (!(await safeExists(io, tracksPath, signal))) return { ...withRepo, allow, hasMeasure: true }

    const tracksText = await safeRead(io, tracksPath, signal)
    const tracks = parseTracks(tracksText)
    if (tracks.length === 0 && /^(?:\d+\.\s+)?- \[[ ~xb]\] /m.test(tracksText)) {
      return { ...withRepo, allow, hasMeasure: true, parseError: `${tracksPath} has track lines in no known format` }
    }

    const plans = new Map()
    const planPaths = new Map()
    for (const track of tracks.filter(one => one.marker === '~')) {
      const path = await planPathOf(io, joinPath(dirname(tracksPath), track.folder), signal)
      if (path === null) continue
      plans.set(track.id, parsePlan(await safeRead(io, path, signal)))
      planPaths.set(track.id, path)
    }

    const loaded = {
      ...withRepo,
      allow,
      hasMeasure: true,
      tracksPath,
      tracks,
      inProgressCount: tracks.filter(track => track.marker === '~').length,
    }
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
    return { ...withRepo, allow, hasMeasure: true, parseError: error instanceof Error ? error.message : String(error) }
  }
}

/** The `git status --porcelain --untracked-files=all` lines of the project; none when git fails. */
export async function gitStatus(io, root, signal) {
  const lines = await safeGit(io, ['status', '--porcelain', '--untracked-files=all'], root, signal)
  return lines.filter(line => line.trim() !== '')
}

/** The text of a file; empty when it does not exist yet (the Phase 3 closeout reads). */
export const readOrEmpty = async (io, path, signal) => ((await safeExists(io, path, signal)) ? safeRead(io, path, signal) : '')

/** One snapshot per canonical root, read on first use and invalidated explicitly. */
export class Snapshots {
  #cache = new Map()

  constructor(io) {
    this.io = io
  }

  /** The cached snapshot of a root; concurrent callers share one read. */
  get(root, signal) {
    const found = this.#cache.get(root)
    if (found !== undefined) return found
    const loading = loadSnapshot(this.io, root, signal)
    this.#cache.set(root, loading)
    loading.catch(() => {
      if (this.#cache.get(root) === loading) this.#cache.delete(root)
    })
    return loading
  }

  /** Drops the snapshot of one root (the next get() reads again). */
  invalidate(root) {
    this.#cache.delete(root)
  }

  /** Drops every snapshot. */
  invalidateAll() {
    this.#cache.clear()
  }
}
