// S4: the closeout guard (tracks.md and plan.md edits) and the notes on the tool output.
import { describe, expect, test } from 'bun:test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ToolAfterEvent, ToolBeforeEvent } from '../src/hooks/types'
import { supersededTarget } from '../src/core/guards'

/** A completed call, so the tests can read `result`. */
type CompletedEvent = ToolAfterEvent & { status: 'completed' }
import { TRACK, makeGuard, tempProject, withMeasure } from './fake'

const before = (filePath: string, oldString: string, newString: string, id = 'call_1'): ToolBeforeEvent => ({
  tool: 'edit',
  sessionID: 'ses_1',
  agent: 'build',
  messageID: 'msg_1',
  id,
  input: { filePath, oldString, newString },
})

const after = (event: ToolBeforeEvent, output = 'done'): CompletedEvent => ({
  tool: event.tool,
  sessionID: event.sessionID,
  agent: event.agent,
  messageID: event.messageID,
  id: event.id,
  input: event.input,
  status: 'completed',
  result: { output },
})

const TRACK_LINE = '- [~] **Track: OpenCode plugin: measure-guard'

/** The D2 note of guard_phase_start_20261109: phase `next` starts while phase `previous` has no checkpoint. */
const phaseNote = (next: string, previous: string): string =>
  `measure-guard: "${next}" starts while the heading of "${previous}" has no [checkpoint: <sha>]. This is correct when the two phases run at the same time. When "${previous}" is complete, run the Phase Completion Verification and Checkpointing Protocol in measure/workflow.md for it.`

describe('track close', () => {
  test('a track with open tasks cannot change to [x]', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    const tracks = join(root, 'measure/tracks.md')
    await expect(guard.onToolBefore(before(tracks, TRACK_LINE, TRACK_LINE.replace('[~]', '[x]')))).rejects.toThrow(/open task/)
  })

  test('a track with only closed and owner-deferred tasks closes, and the [b] list rides on the output', async () => {
    const root = await withMeasure(await tempProject())
    const planPath = join(root, 'measure/tracks', TRACK, 'plan.md')
    const closed = readFileSync(planPath, 'utf8')
      .replace(/^- \[~\] /gm, '- [x] ')
      .replace(/^- \[ \] (Task[^\n]*)$/gm, '- [x] $1 `abc1234`')
    writeFileSync(planPath, closed)
    const guard = makeGuard(root)
    const tracks = join(root, 'measure/tracks.md')
    const event = before(tracks, TRACK_LINE, TRACK_LINE.replace('[~]', '[x]'))
    await expect(guard.onToolBefore(event)).resolves.toBeUndefined()
    const done = after(event)
    await guard.onToolAfter(done)
    expect(String(done.status === 'completed' ? done.result.output : '')).toContain('[b] tasks')
  })
})

describe('phase start', () => {
  test('AC-2: a task of the next phase starts with a note while the previous phase has no checkpoint', async () => {
    const root = await withMeasure(await tempProject())
    const planPath = join(root, 'measure/tracks', TRACK, 'plan.md')
    // No checkpoints and no task started: starting Task 2.1 needs the Phase S1 checkpoint.
    const plan = readFileSync(planPath, 'utf8')
      .replace(/ \[checkpoint: [0-9a-f]+\]/g, '')
      .split('\n')
      .map(l => (/^- \[[x~]\] Task \d/.test(l) ? `- [ ] ${l.slice(6).replace(/ `[0-9a-f]{7}`$/, '')}` : l))
      .join('\n')
    writeFileSync(planPath, plan)
    const guard = makeGuard(root)
    const line = plan.split('\n').find(l => l.startsWith('- [ ] Task 2.1:'))
    expect(line).toBeDefined()
    const start = before(planPath, line as string, (line as string).replace('[ ]', '[~]'))
    await expect(guard.onToolBefore(start)).resolves.toBeUndefined()
    const started = after(start)
    await guard.onToolAfter(started)
    expect(String(started.result.output)).toContain(phaseNote('Phase S2: Project snapshot and plugin state', 'Phase S1: Package skeleton and shared core'))
    const close = before(planPath, line as string, (line as string).replace('[ ]', '[x]'), 'call_2')
    await expect(guard.onToolBefore(close)).resolves.toBeUndefined()
    const closed = after(close)
    await guard.onToolAfter(closed)
    expect(String(closed.result.output)).not.toContain('measure-guard: "')
  })

  // The PM case of 2026-11-09: Workbooks storytime_l2_unit2_20261106 starts Task 6.1 while Phase 5 has no checkpoint.
  const OVERLAP_PLAN = [
    '# Implementation Plan: Overlap',
    '',
    '## Phase 4: Unit scope [checkpoint: 1234567]',
    '',
    '- [x] Task 4.1: Unit scope `1234567`',
    '',
    '## Phase 5: Print build',
    '',
    '- [ ] Task 5.1: Proof build',
    '',
    '## Phase 6: Hand-offs',
    '',
    '- [ ] Task 6.1: Song audio',
    '',
  ].join('\n')

  for (const mode of ['guard', 'strict'] as const) {
    test(`AC-1: Task 6.1 starts while Phase 5 has no checkpoint (${mode} mode)`, async () => {
      const root = await withMeasure(await tempProject(), { plan: OVERLAP_PLAN })
      const guard = makeGuard(root, mode)
      const planPath = join(root, 'measure/tracks', TRACK, 'plan.md')
      const start = before(planPath, '- [ ] Task 6.1: Song audio', '- [~] Task 6.1: Song audio')
      await expect(guard.onToolBefore(start)).resolves.toBeUndefined()
      const started = after(start)
      await guard.onToolAfter(started)
      expect(String(started.result.output)).toContain(phaseNote('Phase 6: Hand-offs', 'Phase 5: Print build'))
    })
  }
})

describe('notes after a call', () => {
  test('a plan edit that changes the task sends the task note on the output', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    await guard.pendingNote('ses_1', await guard.current())
    const planPath = join(root, 'measure/tracks', TRACK, 'plan.md')
    const text = readFileSync(planPath, 'utf8')
    const line = text.split('\n').find(l => l.startsWith('- [~] Task')) as string
    const event = before(planPath, line, line.replace('[~]', '[x]'))
    await guard.onToolBefore(event)
    writeFileSync(planPath, text.replace(line, line.replace('[~]', '[x]')))
    const done = after(event)
    await guard.onToolAfter(done)
    expect(String(done.result.output)).toContain('measure-guard')
    expect(String(done.result.output)).toContain('No task is in progress')
  })

  test('a failed call gets no note', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    const event = before(join(root, 'measure/tracks.md'), 'x', 'y')
    const failed: ToolAfterEvent = { ...after(event), status: 'error', error: { message: 'no' } } as ToolAfterEvent
    await expect(guard.onToolAfter(failed)).resolves.toBeUndefined()
  })
})

const SUPERSEDED_LINE = 'Superseded by target_work_20261116, PM 2026-11-16.'

const SUPERSEDED_TRACKS = `# Project Tracks

- [~] **Track: Superseded work**
  *Link: [./tracks/superseded_1/](./tracks/superseded_1/)*

- [~] **Track: Open work**
  *Link: [./tracks/open_2/](./tracks/open_2/)*

- [~] **Track: Mixed work**
  *Link: [./tracks/mixed_3/](./tracks/mixed_3/)*
`

const supersededPlan = (line = SUPERSEDED_LINE, task = '- [~] Task: Left open'): string =>
  `# Implementation Plan: Superseded work\n\n${line}\n\n## Phase 1: Work\n\n${task}\n- [ ] Task: Also open\n`

const openWorkPlan = `# Implementation Plan: Open work

## Phase 1: Work

- [ ] Task: Still open
`

const supersededProject = async (options: { line?: string; task?: string; metadata?: string | null } = {}): Promise<string> => {
  const root = await withMeasure(await tempProject(), { tracks: SUPERSEDED_TRACKS })
  mkdirSync(join(root, 'measure/tracks/superseded_1'), { recursive: true })
  mkdirSync(join(root, 'measure/tracks/open_2'), { recursive: true })
  mkdirSync(join(root, 'measure/tracks/mixed_3'), { recursive: true })
  writeFileSync(join(root, 'measure/tracks/superseded_1/plan.md'), supersededPlan(options.line, options.task))
  writeFileSync(join(root, 'measure/tracks/open_2/plan.md'), openWorkPlan)
  writeFileSync(join(root, 'measure/tracks/mixed_3/plan.md'), supersededPlan(options.line, options.task))
  if (options.metadata !== null) {
    writeFileSync(join(root, 'measure/tracks/superseded_1/metadata.json'), options.metadata ?? '{"status":"superseded","actual_tasks":0}')
    writeFileSync(join(root, 'measure/tracks/mixed_3/metadata.json'), '{"status":"done","actual_tasks":0}')
  }
  return root
}

const closeTrack = (guard: ReturnType<typeof makeGuard>, root: string, name: string): Promise<void> =>
  guard.onToolBefore(before(join(root, 'measure/tracks.md'), `- [~] **Track: ${name}**`, `- [x] **Track: ${name}**`))

const writeRegistry = (guard: ReturnType<typeof makeGuard>, root: string, content: string): Promise<void> =>
  guard.onToolBefore({
    tool: 'write',
    sessionID: 'ses_1',
    agent: 'build',
    messageID: 'msg_1',
    id: 'call_write',
    input: { filePath: join(root, 'measure/tracks.md'), content },
  })

describe('superseded closeout', () => {
  test('supersededTarget reads the target and gates on the metadata status', () => {
    const plan = '# Plan\n\nSuperseded by foo_20261116, PM 2026-11-16.\n'
    expect(supersededTarget(plan, '{"status":"superseded"}')).toBe('foo_20261116')
    expect(supersededTarget(plan, '{bad json')).toBeNull()
    expect(supersededTarget(plan, null)).toBeNull()
    expect(supersededTarget(plan, '{"status":"done"}')).toBeNull()
    expect(supersededTarget(plan, '{"status":"Superseded"}')).toBeNull()
    expect(supersededTarget(plan, '{"status":"superseded "}')).toBeNull()
    expect(supersededTarget('# Plan\n\nNo line.\n', '{"status":"superseded"}')).toBeNull()
  })

  test('a superseded track with open tasks closes, and the note names the target', async () => {
    const root = await supersededProject()
    const guard = makeGuard(root)
    const event = before(join(root, 'measure/tracks.md'), '- [~] **Track: Superseded work**', '- [x] **Track: Superseded work**')
    await expect(guard.onToolBefore(event)).resolves.toBeUndefined()
    const done = after(event)
    await guard.onToolAfter(done)
    const text = String(done.status === 'completed' ? done.result.output : '')
    expect(text).toContain('Superseded tracks:')
    expect(text).toContain('"Superseded work" closes as superseded by target_work_20261116; its open tasks stay open.')
  })

  test('a superseded track with no open task still gets the note item', async () => {
    const root = await supersededProject({ task: '- [x] Task: Done' })
    const guard = makeGuard(root)
    const event = before(join(root, 'measure/tracks.md'), '- [~] **Track: Superseded work**', '- [x] **Track: Superseded work**')
    await expect(guard.onToolBefore(event)).resolves.toBeUndefined()
    const done = after(event)
    await guard.onToolAfter(done)
    expect(String(done.status === 'completed' ? done.result.output : '')).toContain('closes as superseded by target_work_20261116')
  })

  test('open tasks without the line are denied as today', async () => {
    const root = await supersededProject({ line: 'No superseded line here.' })
    await expect(closeTrack(makeGuard(root), root, 'Superseded work')).rejects.toThrow(/open task/)
  })

  test('a plan line with metadata status done is denied', async () => {
    const root = await supersededProject({ metadata: '{"status":"done"}' })
    await expect(closeTrack(makeGuard(root), root, 'Superseded work')).rejects.toThrow(/open task/)
  })

  test('near-miss plan lines are denied', async () => {
    const bad = [
      'superseded by target_work_20261116, PM 2026-11-16.',
      ' Superseded by target_work_20261116, PM 2026-11-16.',
      '> Superseded by target_work_20261116, PM 2026-11-16.',
      '## Superseded by target_work_20261116',
      '- [ ] Superseded by target_work_20261116',
      'Superseded by',
    ]
    for (const line of bad) {
      const root = await supersededProject({ line })
      await expect(closeTrack(makeGuard(root), root, 'Superseded work')).rejects.toThrow(/open task/)
    }
  })

  test('a mixed close is denied, and the deny names only the open track', async () => {
    const root = await supersededProject()
    const guard = makeGuard(root)
    const both = SUPERSEDED_TRACKS
      .replace('- [~] **Track: Superseded work**', '- [x] **Track: Superseded work**')
      .replace('- [~] **Track: Open work**', '- [x] **Track: Open work**')
    const deny = await writeRegistry(guard, root, both).then(() => '', (error: Error) => error.message)
    expect(deny).toContain('Open work')
    expect(deny).toContain('Still open')
    expect(deny).not.toContain('Superseded work')
  })

  test('a superseded line with its own metadata done is denied beside a good superseded track', async () => {
    const root = await supersededProject()
    const guard = makeGuard(root)
    const both = SUPERSEDED_TRACKS
      .replace('- [~] **Track: Superseded work**', '- [x] **Track: Superseded work**')
      .replace('- [~] **Track: Mixed work**', '- [x] **Track: Mixed work**')
    const deny = await writeRegistry(guard, root, both).then(() => '', (error: Error) => error.message)
    expect(deny).toContain('Mixed work')
    expect(deny).not.toContain('"Superseded work" has')
  })
})
