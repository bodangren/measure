import type { EngineInterface, Register, ToolCallInput } from 'claude-code'
import type { ClosingTrack, Decision, GuardContext, Mode, Plan, Snapshot } from '../types'
import {
  bandLine,
  dirname,
  findLink,
  joinPath,
  noteKey,
  parseMode,
  parsePlan,
  parseTracks,
  ruleSection,
  selectActive,
  statusLines,
  taskNote,
} from './parse'
import {
  SETUP_PROMPT,
  applyEdit,
  closedTracks,
  editDecision,
  isInside,
  needsSetup,
  offKey,
  phaseStartDecision,
  setupBandText,
  trackCloseDecision,
} from './guards'

const SNAPSHOT = { plugin: 'measure-guard', key: 'snapshot' } as const
const NOTED = { plugin: 'measure-guard', key: 'notedKey' } as const
const SETUP = { plugin: 'measure-guard', key: 'setupChoice' } as const
const OFF = { plugin: 'measure-guard', key: 'guardsOff' } as const
const RULE_ID = 'measure-guard:rule'
const STATUS_PANE = 'measure-status'

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
    tracksPath: null,
    tracks: [],
    active: null,
    inProgressCount: 0,
    parseError: null,
  }
  const measure = joinPath(root, 'measure')
  if (!base.isRepo || !(await $.fs.exists(measure))) return base

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

    const loaded = { ...base, hasMeasure: true, tracksPath, tracks, inProgressCount: tracks.filter(t => t.marker === '~').length }
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

/** What the guards read: the snapshot, the mode, and the setup answer. */
const guardContext = async ($: EngineInterface, mode: Mode): Promise<GuardContext> => ({
  snapshot: await current($),
  mode,
  setupChoice: (await $.state.get(SETUP)).value ?? null,
  guardsOff: (await $.state.get(OFF)).value ?? null,
})

/** The text of a file; empty when it does not exist yet. */
const readOrEmpty = async ($: EngineInterface, path: string): Promise<string> =>
  (await $.fs.exists(path)) ? $.fs.read(path) : ''

/**
 * The closeout guard for an Edit or Write of tracks.md or a plan.md: the
 * decision, and the [b] note for an allowed track close.
 */
const closeout = async (
  $: EngineInterface,
  context: GuardContext,
  e: ToolCallInput,
): Promise<{ decision: Decision; note: string | null }> => {
  const none = { decision: null, note: null }
  const { snapshot } = context
  if (e.tool !== 'Edit' && e.tool !== 'Write') return none
  if (snapshot === null || !snapshot.hasMeasure || !isInside(joinPath(snapshot.root, 'measure'), e.file_path)) return none
  const path = joinPath(e.file_path)
  const isRegistry = path === snapshot.tracksPath
  if (!isRegistry && !path.endsWith('/plan.md')) return none

  const before = await readOrEmpty($, path)
  const after = applyEdit(e, before)
  if (after === null) return none
  if (!isRegistry) return { decision: phaseStartDecision(context, before, after), note: null }

  const closing: ClosingTrack[] = []
  for (const entry of closedTracks(before, after)) {
    const planPath = await planPathOf($, joinPath(dirname(path), entry.folder))
    closing.push({ entry, plan: planPath === null ? null : parsePlan(await $.fs.read(planPath)) })
  }
  return trackCloseDecision(context, closing)
}

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
    const snapshot = await refresh($)
    if ((await $.store.get(offKey(snapshot.root))) === true) await $.state.set(OFF, 'repo')
    await $.command.register({ name: 'measure-status', description: 'Show the Measure tracks and the plan progress in a pane' })
    await $.command.register({
      name: 'measure-off',
      description: 'Turn off the measure-guard guards for this session, or with "repo" for this repository',
      argumentHint: '[repo]',
    })
    await $.command.register({
      name: 'measure-on',
      description: 'Turn on the measure-guard guards again, or with "repo" for this repository',
      argumentHint: '[repo]',
    })
    return next(e)
  })

  on('command.run', { command: 'measure-status' }, async $ => {
    await refresh($)
    await $.ui.open({ id: STATUS_PANE, title: 'Measure status' })
    return { text: 'Opened the Measure status pane.' }
  })

  on('command.run', { command: 'measure-off' }, async ($, e) => {
    const isRepo = e.args.trim() === 'repo'
    await $.state.set(OFF, isRepo ? 'repo' : 'session')
    if (isRepo) await $.store.set(offKey((await current($)).root), true)
    return {
      text: isRepo
        ? 'measure-guard: the guards are off for this repository. /measure-on repo turns them on.'
        : 'measure-guard: the guards are off for this session. /measure-on turns them on.',
    }
  })

  on('command.run', { command: 'measure-on' }, async ($, e) => {
    const isRepo = e.args.trim() === 'repo'
    await $.state.set(OFF, null)
    if (isRepo) await $.store.delete(offKey((await current($)).root))
    return {
      text: isRepo
        ? 'measure-guard: the guards are on for this repository.'
        : 'measure-guard: the guards are on for this session.',
    }
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
    const path = writtenPath(e)
    let closeNote: string | null = null
    if (path !== null) {
      const context = await guardContext($, mode)
      const decision = editDecision(context, path)
      if (decision !== null) return decision
      const closed = await closeout($, context, e)
      if (closed.decision !== null) return closed.decision
      closeNote = closed.note
    }
    const ran = await next(e)
    const touchesPlan = e.tool === 'Bash' || (path !== null && isInMeasure(await current($), path))
    if (ran.deny !== undefined || !touchesPlan) return ran
    const done = ran.isError === true ? null : closeNote
    const notes = [done, await pendingNote($, await refresh($), mode)].filter(note => note !== null)
    return notes.length === 0 ? ran : { ...ran, context: [...(ran.context ?? []), ...notes] }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const snapshot = (await $.state.get(SNAPSHOT)).value ?? null
    const { Box, Button, Text } = $.ui.resolve(e)

    if (needsSetup(snapshot)) {
      const choice = (await $.state.get(SETUP)).value ?? 'pending'
      const text = setupBandText(choice)
      if (text === null) return next(e)
      return (
        <Box gap={1}>
          <Text>{text}</Text>
          {choice === 'pending' && (
            <Button
              key="setup"
              label="Set up Measure"
              variant="primary"
              onPress={async () => {
                await $.state.set(SETUP, 'setup')
                void $.prompt.submit({ text: SETUP_PROMPT })
              }}
            />
          )}
          {choice === 'pending' && (
            <Button key="off" label="Turn off for session" onPress={() => $.state.set(SETUP, 'off')} />
          )}
        </Box>
      )
    }

    const line = snapshot === null ? null : bandLine(snapshot, (await $.state.get(OFF)).value ?? null)
    if (line === null) return next(e)
    const isError = snapshot?.parseError !== null

    return (
      <Box>
        <Text dimColor={!isError} color={isError ? 'yellow' : undefined} wrap="truncate-end">
          {line}
        </Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: STATUS_PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const lines = statusLines((await $.state.get(SNAPSHOT)).value ?? null, (await $.state.get(OFF)).value ?? null)

    return (
      <Box flexDirection="column">
        {lines.map(line => (
          <Text wrap="truncate-end">{line}</Text>
        ))}
      </Box>
    )
  })

  on('session.compact', async ($, e, next) => {
    const compacted = await next(e)
    if (e.trigger !== 'precompute' && e.agentId === undefined && compacted.messages !== undefined) {
      await $.state.set(NOTED, null)
    }
    return compacted
  })
}
