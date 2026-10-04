// S2: the progress band above the prompt.
import { describe, expect, test } from 'claude-code/testing'
import { bandLine, blockedCount, parsePlan, position } from '../hooks/parse'
import type { Snapshot, TrackEntry } from '../types'
import { BAND_PLAN, DONE_PLAN, PLAN_NO_ACTIVE_TASK } from './fixtures/plans'
import { BAND, ROOT, START, SURFACES, realFiles, world } from './world'

const ENTRY: TrackEntry = { line: 0, marker: '~', name: 'Band work', id: 'band_1', folder: 'tracks/band_1' }

const snapshotOf = (planMd: string, over: Partial<Snapshot> = {}): Snapshot => ({
  root: ROOT,
  hasMeasure: true,
  isRepo: true,
  tracks: [ENTRY],
  active: { entry: ENTRY, planPath: `${ROOT}/measure/tracks/band_1/plan.md`, plan: parsePlan(planMd) },
  inProgressCount: 1,
  parseError: null,
  ...over,
})

describe('bandLine', () => {
  test('shows the phase, the task, and the [b] count', () => {
    expect(position(parsePlan(BAND_PLAN))).toMatchObject({ phase: 2, phases: 4, task: 3, tasks: 7 })
    expect(blockedCount(parsePlan(BAND_PLAN))).toBe(2)
    expect(bandLine(snapshotOf(BAND_PLAN))).toBe(
      'Measure · Band work · Phase 2/4 · Task 3/7 [~] Task: Third · [b] 2',
    )
  })

  test('warns when 2 or more tracks have [~]', () => {
    expect(bandLine(snapshotOf(BAND_PLAN, { inProgressCount: 2 }))).toContain('2 tracks in progress')
  })

  test('shows the next task when no task has [~]', () => {
    expect(bandLine(snapshotOf(PLAN_NO_ACTIVE_TASK))).toBe(
      'Measure · Band work · Phase 1/1 · Task 2/2 [ ] Task: Next · no task in progress',
    )
  })

  test('says so when all tasks are closed', () => {
    expect(bandLine(snapshotOf(DONE_PLAN))).toBe('Measure · Band work · all tasks closed · [b] 1')
  })

  test('shows a parse error and that the guards allow all calls', () => {
    const line = bandLine(snapshotOf(BAND_PLAN, { active: null, parseError: 'bad plan' }))
    expect(line).toContain('cannot read the Measure files: bad plan')
    expect(line).toContain('guards allow all calls')
  })

  test('shows no track in progress, and nothing without measure/', () => {
    expect(bandLine(snapshotOf(BAND_PLAN, { active: null, tracks: [] }))).toBe('Measure · no track in progress')
    expect(bandLine(snapshotOf(BAND_PLAN, { hasMeasure: false }))).toBeNull()
  })
})

const PLAN = `${ROOT}/measure/tracks/measure_guard_20261004/plan.md`

test('the band shows the real plan and follows an edit of plan.md', async ($, on) => {
  world(on, realFiles())
  await $.session.start(START)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ plugin: 'measure-guard', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: 'Phase 1/9 · Task 4/7 [~] Task 1.4' })).toBeDefined()
    await ui.unmount()
  }

  await $.tool.call({ tool: 'Edit', file_path: PLAN, old_string: '- [~] Task 1.4:', new_string: '- [x] Task 1.4:' })
  await $.tool.call({ tool: 'Edit', file_path: PLAN, old_string: '- [ ] Task 1.5:', new_string: '- [~] Task 1.5:' })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ plugin: 'measure-guard', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: 'Phase 1/9 · Task 5/7 [~] Task 1.5' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '2 tracks in progress' })).toBeDefined()
    await ui.unmount()
  }
})

test('no band outside a Measure project', async ($, on) => {
  world(on, {}, { isRepo: false })
  await $.session.start(START)
  const ui = await $.ui.mount({ plugin: 'measure-guard', surface: 'terminal', ...BAND })
  expect(await ui.find({ type: 'Text', text: 'Measure' })).toBeUndefined()
  await ui.unmount()
})
