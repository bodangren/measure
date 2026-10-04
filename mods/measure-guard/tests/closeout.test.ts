// S6: the closeout guard.
import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { ToolCallResult } from 'claude-code'
import { applyEdit, closedTracks } from '../hooks/guards'
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

test('a task in phase N+1 cannot start before phase N has a checkpoint', async ($, on) => {
  const w = world(on, files())
  await $.session.start(START)
  const plan = `${M}/tracks/phase_4/plan.md`
  const start = () =>
    $.tool.call({ tool: 'Edit', file_path: plan, old_string: '- [ ] Task: Two', new_string: '- [~] Task: Two' })

  const reason = denied(await start()) ?? ''
  expect(reason).toContain('Phase 2: B')
  expect(reason).toContain('[checkpoint: <sha>]')

  w.files[plan] = PHASE_PLAN.replace('## Phase 1: A', '## Phase 1: A [checkpoint: 1111111]')
  expect(denied(await start())).toBeUndefined()
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
