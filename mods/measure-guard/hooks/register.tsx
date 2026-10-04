import type { EngineInterface, Register, ToolCallInput } from 'claude-code'
import type { Mode, Plan, Snapshot } from '../types'
import {
  dirname,
  findLink,
  joinPath,
  noteKey,
  parseMode,
  parsePlan,
  parseTracks,
  ruleSection,
  selectActive,
  taskNote,
} from './parse'

const SNAPSHOT = { plugin: 'measure-guard', key: 'snapshot' } as const
const NOTED = { plugin: 'measure-guard', key: 'notedKey' } as const
const RULE_ID = 'measure-guard:rule'

/** The plan file of a track folder: the index's plan link, else plan.md. */
const planPathOf = async ($: EngineInterface, folder: string): Promise<string | null> => {
  const index = joinPath(folder, 'index.md')
  if (await $.fs.exists(index)) {
    const link = findLink(await $.fs.read(index), /\bplan\b/i)
    if (link !== null && (await $.fs.exists(joinPath(folder, link)))) return joinPath(folder, link)
  }
  const plan = joinPath(folder, 'plan.md')
  return (await $.fs.exists(plan)) ? plan : null
}

/** Reads index.md, tracks.md, and the plans of the `[~]` tracks. */
const loadSnapshot = async ($: EngineInterface): Promise<Snapshot> => {
  const root = await $.session.root()
  const base: Snapshot = {
    root,
    hasMeasure: false,
    isRepo: (await $.session.repo()) !== null,
    tracks: [],
    active: null,
    inProgressCount: 0,
    parseError: null,
  }
  const measure = joinPath(root, 'measure')
  if (!(await $.fs.exists(measure))) return base

  try {
    const index = joinPath(measure, 'index.md')
    const registry = (await $.fs.exists(index)) ? findLink(await $.fs.read(index), /Tracks Registry/i) : null
    const tracksPath = joinPath(measure, registry ?? 'tracks.md')
    if (!(await $.fs.exists(tracksPath))) return { ...base, hasMeasure: true }

    const tracksText = await $.fs.read(tracksPath)
    const tracks = parseTracks(tracksText)
    if (tracks.length === 0 && /^- \[[ ~xb]\] /m.test(tracksText)) {
      return { ...base, hasMeasure: true, parseError: `${tracksPath} has track lines in no known format` }
    }

    const plans = new Map<string, Plan>()
    const planPaths = new Map<string, string>()
    for (const track of tracks.filter(t => t.marker === '~')) {
      const path = await planPathOf($, joinPath(dirname(tracksPath), track.folder))
      if (path === null) continue
      plans.set(track.id, parsePlan(await $.fs.read(path)))
      planPaths.set(track.id, path)
    }

    const loaded = { ...base, hasMeasure: true, tracks, inProgressCount: tracks.filter(t => t.marker === '~').length }
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

/** Reads the Measure files again and keeps the result for the other hooks. */
const refresh = async ($: EngineInterface): Promise<Snapshot> => {
  const snapshot = await loadSnapshot($)
  await $.state.set(SNAPSHOT, snapshot)
  return snapshot
}

const current = async ($: EngineInterface): Promise<Snapshot> =>
  (await $.state.get(SNAPSHOT)).value ?? refresh($)

/** The task note when the track or the task changed since the last note. */
const pendingNote = async ($: EngineInterface, snapshot: Snapshot, mode: Mode): Promise<string | null> => {
  const key = noteKey(snapshot)
  if (key === null || (await $.state.get(NOTED)).value === key) return null
  await $.state.set(NOTED, key)
  return taskNote(snapshot, mode)
}

/** The file a tool call writes, for the tools that write one file. */
const writtenPath = (e: ToolCallInput): string | null => {
  if (e.tool === 'Edit' || e.tool === 'Write') return e.file_path
  if (e.tool === 'NotebookEdit') return e.notebook_path
  return null
}

const isInMeasure = (snapshot: Snapshot, path: string): boolean =>
  joinPath(path).startsWith(`${joinPath(snapshot.root, 'measure')}/`)

export const register: Register = (on, options) => {
  const mode = parseMode(options.mode)

  on('session.start', async ($, e, next) => {
    await refresh($)
    return next(e)
  })

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    if (!(await current($)).hasMeasure) return composed
    return { sections: [...composed.sections, { id: RULE_ID, text: ruleSection(), scope: 'session' }] }
  })

  on('classic.UserPromptSubmit', async ($, e, next) => {
    const result = await next(e)
    const note = await pendingNote($, await refresh($), mode)
    return note === null ? result : { ...result, additionalContext: [...(result.additionalContext ?? []), note] }
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    const path = writtenPath(e)
    const touchesPlan = e.tool === 'Bash' || (path !== null && isInMeasure(await current($), path))
    if (ran.deny !== undefined || !touchesPlan) return ran
    const note = await pendingNote($, await refresh($), mode)
    return note === null ? ran : { ...ran, context: [...(ran.context ?? []), note] }
  })

  on('session.compact', async ($, e, next) => {
    const compacted = await next(e)
    if (e.trigger !== 'precompute' && e.agentId === undefined && compacted.messages !== undefined) {
      await $.state.set(NOTED, null)
    }
    return compacted
  })
}
