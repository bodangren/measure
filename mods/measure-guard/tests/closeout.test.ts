// S6: the closeout guard.
import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { ToolCallResult } from 'claude-code'
import { applyEdit, closedTracks, supersededTarget } from '../hooks/guards'
import { BAND_PLAN, DONE_PLAN } from './fixtures/plans'
import { ROOT, START, world } from './world'

const M = `${ROOT}/measure`
const TRACKS = `${M}/tracks.md`

const TRACKS_MD = `# Project Tracks

- [~] **Track: Done work**
  *Link: [./tracks/done_1/](./tracks/done_1/)*

- [~] **Track: Open work**
  *Link: [./tracks/open_2/](./tracks/open_2/)*

- [~] **Track: Owner missing**
  *Link: [./tracks/owner_3/](./tracks/owner_3/)*

- [~] **Track: Phase work**
  *Link: [./tracks/phase_4/](./tracks/phase_4/)*
`

const OWNER_PLAN = `## Phase 1: A [checkpoint: 1234567]

- [x] Task: Done \`1234567\`
- [b] Task: Waiting on a person
`

const PHASE_PLAN = `## Phase 1: A

- [x] Task: One \`1111111\`

## Phase 2: B

- [ ] Task: Two
`

const files = (): Record<string, string> => ({
  [TRACKS]: TRACKS_MD,
  [`${M}/tracks/done_1/plan.md`]: DONE_PLAN,
  [`${M}/tracks/open_2/plan.md`]: BAND_PLAN,
  [`${M}/tracks/owner_3/plan.md`]: OWNER_PLAN,
  [`${M}/tracks/phase_4/plan.md`]: PHASE_PLAN,
})

/** The D2 note of guard_phase_start_20261109: phase `next` starts while phase `previous` has no checkpoint. */
const phaseNote = (next: string, previous: string): string =>
  `measure-guard: "${next}" starts while the heading of "${previous}" has no [checkpoint: <sha>]. This is correct when the two phases run at the same time. When "${previous}" is complete, run the Phase Completion Verification and Checkpointing Protocol in measure/workflow.md for it.`

const denied = (ran: ToolCallResult): string | undefined =>
  ran.deny ?? (ran.isError === true ? ran.text : undefined)

const close = ($: Engine, name: string) =>
  $.tool.call({
    tool: 'Edit',
    file_path: TRACKS,
    old_string: `- [~] **Track: ${name}**`,
    new_string: `- [x] **Track: ${name}**`,
  })

test('a track with all tasks closed can change to [x], and the agent gets the [b] list', async ($, on) => {
  const w = world(on, files())
  await $.session.start(START)
  const ran = await close($, 'Done work')
  expect(denied(ran)).toBeUndefined()
  expect(w.files[TRACKS]).toContain('- [x] **Track: Done work**')
  expect(ran.context?.join('\n')).toContain('[b] Task: Human check deferred:user')
})

test('a track with open tasks cannot change to [x], and the deny lists them', async ($, on) => {
  const w = world(on, files())
  await $.session.start(START)
  const reason = denied(await close($, 'Open work')) ?? ''
  expect(reason).toContain('Open work')
  expect(reason).toContain('Task: Third')
  expect(reason).toContain('Task: Fourth')
  expect(reason).toContain('/measure-off')
  expect(w.files[TRACKS]).toContain('- [~] **Track: Open work**')
})

test('a [b] task with no owner keeps the track open', async ($, on) => {
  world(on, files())
  await $.session.start(START)
  const reason = denied(await close($, 'Owner missing')) ?? ''
  expect(reason).toContain('Task: Waiting on a person')
  expect(reason).toContain('deferred:<owner>')
})

test('a Write of the whole tracks.md is checked too', async ($, on) => {
  world(on, files())
  await $.session.start(START)
  const content = TRACKS_MD.replace('- [~] **Track: Open work**', '- [x] **Track: Open work**')
  expect(denied(await $.tool.call({ tool: 'Write', file_path: TRACKS, content }))).toContain('Task: Third')
})

test('advise mode lets the close pass', { options: { mode: 'advise' } }, async ($, on) => {
  world(on, files())
  await $.session.start(START)
  expect(denied(await close($, 'Open work'))).toBeUndefined()
})

test('a task in phase N+1 can start before phase N has a checkpoint, with a note', async ($, on) => {
  const w = world(on, files())
  await $.session.start(START)
  const plan = `${M}/tracks/phase_4/plan.md`
  const change = (marker: string) =>
    $.tool.call({ tool: 'Edit', file_path: plan, old_string: '- [ ] Task: Two', new_string: `- [${marker}] Task: Two` })

  const started = await change('~')
  expect(denied(started)).toBeUndefined()
  expect(started.context?.join('\n')).toContain(phaseNote('Phase 2: B', 'Phase 1: A'))

  w.files[plan] = PHASE_PLAN
  const closed = await change('x')
  expect(denied(closed)).toBeUndefined()
  expect(closed.context?.join('\n') ?? '').not.toContain('measure-guard: "')

  w.files[plan] = PHASE_PLAN.replace('## Phase 1: A', '## Phase 1: A [checkpoint: 1111111]')
  const checked = await change('~')
  expect(denied(checked)).toBeUndefined()
  expect(checked.context?.join('\n') ?? '').not.toContain('measure-guard: "')
})

test('a task in the first phase can start with no checkpoint', async ($, on) => {
  world(on, files())
  await $.session.start(START)
  const ran = await $.tool.call({
    tool: 'Edit',
    file_path: `${M}/tracks/open_2/plan.md`,
    old_string: '- [ ] Task: Fourth',
    new_string: '- [~] Task: Fourth',
  })
  expect(denied(ran)).toBeUndefined()
})

describe('applyEdit and closedTracks', () => {
  test('apply an Edit and a Write', () => {
    expect(applyEdit({ tool: 'Edit', old_string: 'a', new_string: 'b' }, 'a a')).toBe('b a')
    expect(applyEdit({ tool: 'Edit', old_string: 'a', new_string: 'b', replace_all: true }, 'a a')).toBe('b b')
    expect(applyEdit({ tool: 'Edit', old_string: 'z', new_string: 'b' }, 'a a')).toBeNull()
    expect(applyEdit({ tool: 'Write', content: 'new' }, 'old')).toBe('new')
  })

  test('find the tracks that change to [x]', () => {
    const after = TRACKS_MD.replace('- [~] **Track: Open work**', '- [x] **Track: Open work**')
    expect(closedTracks(TRACKS_MD, after).map(t => t.id)).toEqual(['open_2'])
    expect(closedTracks(TRACKS_MD, TRACKS_MD)).toEqual([])
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

const supersededFiles = (options: { line?: string; task?: string; metadata?: string | null } = {}): Record<string, string> => ({
  [TRACKS]: SUPERSEDED_TRACKS,
  [`${M}/tracks/superseded_1/plan.md`]: supersededPlan(options.line, options.task),
  [`${M}/tracks/open_2/plan.md`]: openWorkPlan,
  [`${M}/tracks/mixed_3/plan.md`]: supersededPlan(options.line, options.task),
  ...(options.metadata === null ? {} : { [`${M}/tracks/superseded_1/metadata.json`]: options.metadata ?? '{"status":"superseded"}' }),
  [`${M}/tracks/mixed_3/metadata.json`]: '{"status":"done"}',
})

const closeTrack = ($: Engine, name: string) =>
  $.tool.call({
    tool: 'Edit',
    file_path: TRACKS,
    old_string: `- [~] **Track: ${name}**`,
    new_string: `- [x] **Track: ${name}**`,
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

  test('a superseded track with open tasks closes, and the note names the target', async ($, on) => {
    world(on, supersededFiles())
    await $.session.start(START)
    const ran = await closeTrack($, 'Superseded work')
    expect(denied(ran)).toBeUndefined()
    const text = ran.context?.join('\n') ?? ''
    expect(text).toContain('Superseded tracks:')
    expect(text).toContain('"Superseded work" closes as superseded by target_work_20261116; its open tasks stay open.')
  })

  test('a superseded track with no open task still gets the note item', async ($, on) => {
    world(on, supersededFiles({ task: '- [x] Task: Done' }))
    await $.session.start(START)
    const ran = await closeTrack($, 'Superseded work')
    expect(denied(ran)).toBeUndefined()
    expect(ran.context?.join('\n') ?? '').toContain('closes as superseded by target_work_20261116')
  })

  test('open tasks without the line are denied as today', async ($, on) => {
    world(on, supersededFiles({ line: 'No superseded line here.' }))
    await $.session.start(START)
    expect(denied(await closeTrack($, 'Superseded work'))).toContain('Task: Left open')
  })

  test('a plan line with metadata status done is denied', async ($, on) => {
    world(on, supersededFiles({ metadata: '{"status":"done"}' }))
    await $.session.start(START)
    expect(denied(await closeTrack($, 'Superseded work'))).toContain('Task: Left open')
  })

  test('near-miss plan lines are denied', async ($, on) => {
    const w = world(on, supersededFiles())
    await $.session.start(START)
    const bad = [
      'superseded by target_work_20261116, PM 2026-11-16.',
      ' Superseded by target_work_20261116, PM 2026-11-16.',
      '> Superseded by target_work_20261116, PM 2026-11-16.',
      '## Superseded by target_work_20261116',
      '- [ ] Superseded by target_work_20261116',
      'Superseded by',
    ]
    for (const line of bad) {
      w.files[`${M}/tracks/superseded_1/plan.md`] = supersededPlan(line)
      expect(denied(await closeTrack($, 'Superseded work'))).toBeDefined()
    }
  })

  test('a mixed close is denied, and the deny names only the open track', async ($, on) => {
    const w = world(on, supersededFiles())
    await $.session.start(START)
    const both = SUPERSEDED_TRACKS
      .replace('- [~] **Track: Superseded work**', '- [x] **Track: Superseded work**')
      .replace('- [~] **Track: Open work**', '- [x] **Track: Open work**')
    const reason = denied(await $.tool.call({ tool: 'Write', file_path: TRACKS, content: both })) ?? ''
    expect(reason).toContain('Open work')
    expect(reason).toContain('Still open')
    expect(reason).not.toContain('Superseded work')
    expect(w.files[TRACKS]).toBe(SUPERSEDED_TRACKS)
  })

  test('a superseded line with its own metadata done is denied beside a good superseded track', async ($, on) => {
    world(on, supersededFiles())
    await $.session.start(START)
    const both = SUPERSEDED_TRACKS
      .replace('- [~] **Track: Superseded work**', '- [x] **Track: Superseded work**')
      .replace('- [~] **Track: Mixed work**', '- [x] **Track: Mixed work**')
    const reason = denied(await $.tool.call({ tool: 'Write', file_path: TRACKS, content: both })) ?? ''
    expect(reason).toContain('Mixed work')
    expect(reason).not.toContain('"Superseded work" has')
  })
})
