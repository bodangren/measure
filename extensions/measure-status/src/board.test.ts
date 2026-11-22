// FR-4, FR-5, FR-8: the column rules, the card, the column view, and the badge.
// Every fixture here is invented text.
import { describe, expect, test } from 'vitest'
import {
  COLUMN_CAP,
  COLUMN_LABELS,
  COLUMNS,
  DONE_SHOWN,
  DONE_WINDOW_DAYS,
  blockedTracks,
  buildBoard,
  cardLabel,
  classifyTrack,
  columnView,
  currentIndex,
  doneSummary,
  type TrackInput,
} from './board'
import { parsePlan, tasksOf } from './parse'
import type { Plan } from './types'

const NOW = 1_800_000_000_000
const DAY = 86_400_000

const plan = (md: string): Plan => parsePlan(md)
const tasks = (md: string) => tasksOf(parsePlan(md))

const input = (over: Partial<TrackInput> = {}): TrackInput => ({
  repo: 'invented-repo',
  title: 'Invented track',
  registryMarker: ' ',
  folder: 'tracks/invented_1',
  plan: { kind: 'plan', plan: plan('## Phase 1: Work\n\n- [ ] Task: One\n') },
  lastChange: NOW - 2 * DAY,
  doneDate: null,
  doneSource: null,
  now: NOW,
  ...over,
})

const card = (over: Partial<TrackInput> = {}) => classifyTrack(input(over))

describe('the column contract', () => {
  test('keeps the column order of FR-8', () => {
    expect(COLUMNS).toEqual(['planned', 'in-progress', 'blocked', 'waiting', 'done'])
  })

  test('gives each column its label', () => {
    expect(COLUMN_LABELS).toEqual({
      planned: 'Planned',
      'in-progress': 'In progress',
      blocked: 'Waits for PM',
      waiting: 'Waits for Daniel',
      done: 'Done',
    })
  })

  test('caps a column at 8 cards and the Done group at 5', () => {
    expect(COLUMN_CAP).toBe(8)
    expect(DONE_SHOWN).toBe(5)
  })
})

describe('currentIndex', () => {
  test('takes the first [~] task', () => {
    expect(currentIndex(tasks('## Phase 1: A\n\n- [x] Task: One\n- [~] Task: Two\n- [ ] Task: Three\n'))).toBe(1)
  })

  test('takes the first [~] task even when it sits before the last done task', () => {
    expect(currentIndex(tasks('## Phase 1: A\n\n- [~] Task: One\n- [x] Task: Two\n'))).toBe(0)
  })

  test('takes the first open task that is ahead when no task is [~]', () => {
    expect(currentIndex(tasks('## Phase 1: A\n\n- [x] Task: One\n- [ ] Task: Two\n- [ ] Task: Three\n'))).toBe(1)
  })

  test('never takes a skipped task', () => {
    const md = '## Phase 1: A\n\n- [ ] Task: One\n- [x] Task: Two\n- [ ] Task: Three\n'
    expect(currentIndex(tasks(md))).toBe(2)
    expect(currentIndex(tasks('## Phase 1: A\n\n- [ ] Task: One\n- [x] Task: Two\n'))).toBeNull()
  })

  test('is null when every task is closed', () => {
    expect(currentIndex(tasks('## Phase 1: A\n\n- [x] Task: One\n'))).toBeNull()
  })
})

describe('R1: a done track', () => {
  test('is Done from the registry marker x', () => {
    const done = card({ registryMarker: 'x', doneDate: '2026-03-04', doneSource: 'registry' })
    expect(done).toMatchObject({
      column: 'done',
      position: null,
      marker: null,
      taskText: null,
      note: null,
      line: null,
      doneDate: '2026-03-04',
      doneSource: 'registry',
    })
  })

  test('is Done from an archive folder', () => {
    const done = card({ folder: 'archive/invented_2', doneDate: '2026-03-03', doneSource: 'folder' })
    expect(done.column).toBe('done')
    expect(done.doneSource).toBe('folder')
  })
})

describe('R2: a track with no readable task', () => {
  test('is Planned with the note No plan.', () => {
    const track = card({ plan: { kind: 'missing' } })
    expect(track).toMatchObject({ column: 'planned', note: 'No plan.', line: null, position: null })
  })

  test('is In progress with the note No plan. when the marker is ~', () => {
    const track = card({ plan: { kind: 'missing' }, registryMarker: '~' })
    expect(track).toMatchObject({ column: 'in-progress', note: 'No plan.' })
  })

  test('is Blocked with the registry line when the marker is b', () => {
    const track = card({ plan: { kind: 'missing' }, registryMarker: 'b' })
    expect(track).toMatchObject({ column: 'blocked', note: 'No plan.', line: 'Registry marker [b].' })
  })

  test('is In progress with the note Plan unreadable when the read fails', () => {
    const track = card({ plan: { kind: 'unreadable' }, registryMarker: '~' })
    expect(track).toMatchObject({ column: 'in-progress', note: 'Plan unreadable', line: null })
  })

  test('is Planned for a plan with no task under a Phase heading', () => {
    const track = card({ plan: { kind: 'plan', plan: plan('# Plan: prose only\n\n- [x] Not a task\n') } })
    expect(track.column).toBe('planned')
    expect(track.position).toBeNull()
  })
})

describe('R3a: a gate task', () => {
  const gate = '## Phase 1: A\n\n- [x] Task: One\n- [ ] Task: End User Manual Verification\n'

  test('is Waiting on Daniel when the updated age is 14 days or less', () => {
    const track = card({ plan: { kind: 'plan', plan: plan(gate) }, lastChange: NOW - 14 * DAY })
    expect(track).toMatchObject({
      column: 'waiting',
      line: 'Task: End User Manual Verification',
      marker: ' ',
      note: null,
    })
    expect(track.position).toMatchObject({ phase: 1, phases: 1, task: 2, tasks: 2 })
    expect(cardLabel(track)).toBeNull()
  })

  test('is Waiting on Daniel for a GATE body', () => {
    const md = '## Phase 1: A\n\n- [x] Task: One\n- [ ] Task 1.5: GATE. PM look, then Daniel accepts the look.\n'
    const track = card({ plan: { kind: 'plan', plan: plan(md) } })
    expect(track.column).toBe('waiting')
    expect(cardLabel(track)).toBeNull()
  })

  test('gives no gate at 14 days plus one millisecond', () => {
    const track = card({ plan: { kind: 'plan', plan: plan(gate) }, lastChange: NOW - 14 * DAY - 1 })
    expect(track).toMatchObject({ column: 'in-progress', line: null })
  })

  test('gives no gate with an older or unknown age', () => {
    expect(card({ plan: { kind: 'plan', plan: plan(gate) }, lastChange: NOW - 20 * DAY }).column).toBe('in-progress')
    expect(card({ plan: { kind: 'plan', plan: plan(gate) }, lastChange: null }).column).toBe('in-progress')
  })

  test('wins over an open [b] task', () => {
    const md = [
      '## Phase 1: A',
      '',
      '- [x] Task: One',
      '- [b] Task: Two',
      '- [ ] Task: Three User Manual Verification',
      '',
    ].join('\n')
    expect(card({ plan: { kind: 'plan', plan: plan(md) } }).column).toBe('waiting')
  })

  test('does not apply to a skipped gate task', () => {
    const md = [
      '## Phase 1: A',
      '',
      '- [ ] Task: One User Manual Verification',
      '- [x] Task: Two',
      '- [ ] Task: Three',
      '',
    ].join('\n')
    const track = card({ plan: { kind: 'plan', plan: plan(md) } })
    expect(track.column).toBe('in-progress')
    expect(track.line).toBeNull()
  })
})

describe('R3b: an open [b] task', () => {
  test('gives Running when a [~] task follows a [b] task with no gate', () => {
    const md = '## Phase 1: A\n\n- [x] Task: One\n- [b] Task: Two\n- [~] Task: Three\n'
    const track = card({ plan: { kind: 'plan', plan: plan(md) } })
    expect(track).toMatchObject({
      column: 'in-progress',
      state: 'running',
      line: null,
      marker: '~',
      reason: 'Running: Task: Three',
    })
    expect(track.position).toMatchObject({ task: 3 })
  })

  test('is Blocked with no position when the [b] task is skipped', () => {
    const md = '## Phase 1: A\n\n- [b] Task: One\n- [x] Task: Two\n'
    const track = card({ plan: { kind: 'plan', plan: plan(md) } })
    expect(track).toMatchObject({
      column: 'blocked',
      line: 'Task: One',
      position: null,
      marker: null,
      taskText: null,
      note: '1 open task, no current task.',
    })
  })

  test('does not apply to a closed [b] task', () => {
    const md = '## Phase 1: A\n\n- [x] Task: One\n- [b] Task: Two deferred:later-track\n- [~] Task: Three\n'
    expect(card({ plan: { kind: 'plan', plan: plan(md) } }).column).toBe('in-progress')
  })
})

describe('R3c and R3d: the current task decides', () => {
  test('is In progress for a [~] current task', () => {
    const md = '## Phase 1: A\n\n- [x] Task: One\n- [~] Task: Two\n'
    const track = card({ plan: { kind: 'plan', plan: plan(md) } })
    expect(track).toMatchObject({ column: 'in-progress', marker: '~', line: null, note: null })
  })

  test('is Blocked with the registry line when the current task is [ ] and the marker is b', () => {
    const md = '## Phase 1: A\n\n- [ ] Task: One\n'
    expect(card({ plan: { kind: 'plan', plan: plan(md) }, registryMarker: 'b' })).toMatchObject({
      column: 'blocked',
      line: 'Registry marker [b].',
    })
  })

  test('is In progress when the current task is [ ] and the marker is ~', () => {
    const md = '## Phase 1: A\n\n- [ ] Task: One\n'
    expect(card({ plan: { kind: 'plan', plan: plan(md) }, registryMarker: '~' }).column).toBe('in-progress')
  })

  test('is In progress when the current task is [ ] and a task is [x]', () => {
    const md = '## Phase 1: A\n\n- [x] Task: One\n- [ ] Task: Two\n'
    expect(card({ plan: { kind: 'plan', plan: plan(md) } }).column).toBe('in-progress')
  })

  test('is Planned when the current task is [ ] and no task is [x]', () => {
    const md = '## Phase 1: A\n\n- [ ] Task: One\n- [ ] Task: Two\n'
    expect(card({ plan: { kind: 'plan', plan: plan(md) } }).column).toBe('planned')
  })
})

describe('R4: no current task', () => {
  const closed = (owner: string) => `## Phase 1: A\n\n- [x] Task: One\n- [b] Task: Two deferred:${owner}\n`

  test('is Waiting on Daniel for a closed [b] task with a Daniel token', () => {
    const track = card({ plan: { kind: 'plan', plan: plan(closed('owner-manual-verification')) } })
    expect(track).toMatchObject({
      column: 'waiting',
      line: 'Task: Two deferred:owner-manual-verification',
      position: null,
      note: 'All tasks closed.',
    })
  })

  test('is Waiting on Daniel for each gate owner token', () => {
    for (const owner of ['daniel-deploy', 'manual', 'paid', 'public-date', 'proof', 'sudo']) {
      expect(card({ plan: { kind: 'plan', plan: plan(closed(owner)) } }).column).toBe('waiting')
    }
  })

  test('is Blocked for a closed [b] task with another token', () => {
    for (const owner of ['pm', 'phikul', 'later-track', 'track-owner']) {
      const track = card({ plan: { kind: 'plan', plan: plan(closed(owner)) } })
      expect(track.column).toBe('blocked')
      expect(track.line).toBe(`Task: Two deferred:${owner}`)
    }
  })

  test('is Waits for PM with the note All tasks closed. when no task is open', () => {
    const track = card({ plan: { kind: 'plan', plan: plan('## Phase 1: A\n\n- [x] Task: One\n') } })
    expect(track).toMatchObject({
      column: 'blocked',
      state: 'waits-pm',
      reason: 'Waits for PM: All tasks closed.',
      position: null,
      note: 'All tasks closed.',
    })
  })
})

describe('the two real plan shapes', () => {
  const daily = [
    '## Phase 1: A',
    '',
    '- [x] Task: One',
    '',
    '## Phase 2: B',
    '',
    '- [x] Task: Two',
    '',
    '## Phase 3: C',
    '',
    '- [x] Task: Three',
    '',
    '## Phase 4: D',
    '',
    '- [x] Task: Four',
    '',
    '## Phase 5: E',
    '',
    '- [x] Task: Five',
    '',
    '## Phase 6: F',
    '',
    '- [x] Task: Six',
    '- [b] Task: Seven',
    '',
    '## Phase 7: G',
    '',
    '- [x] Task: Eight',
    '- [ ] Task: Nine',
    '',
    '## Phase 8: H',
    '',
    '- [x] Task: Ten',
    '- [ ] Task: Eleven',
    '- [x] Task: Twelve',
    '',
  ].join('\n')

  const mastery = [
    '## Phase 1: A',
    '',
    '- [x] Task: One',
    '- [ ] Task: End User Manual Verification one',
    '',
    '## Phase 2: B',
    '',
    '- [x] Task: Two',
    '- [ ] Task: End User Manual Verification two',
    '',
    '## Phase 3: C',
    '',
    '- [x] Task: Three',
    '- [ ] Task: End User Manual Verification three',
    '',
    '## Phase 4: D',
    '',
    '- [x] Task: Four',
    '- [ ] Task: End User Manual Verification four',
    '',
    '## Phase 5: E',
    '',
    '- [x] Task: Five',
    '- [ ] Task: End User Manual Verification five',
    '',
    '## Phase 6: F',
    '',
    '- [x] Task: Six',
    '',
  ].join('\n')

  test('an open [b] behind the last done task gives Blocked with no position', () => {
    const track = card({ plan: { kind: 'plan', plan: plan(daily) } })
    expect(track).toMatchObject({
      column: 'blocked',
      line: 'Task: Seven',
      position: null,
      marker: null,
      taskText: null,
      note: '3 open tasks, no current task.',
    })
  })

  test('five skipped verification tasks give In progress with the count note', () => {
    const track = card({ plan: { kind: 'plan', plan: plan(mastery) }, registryMarker: '~' })
    expect(track).toMatchObject({
      column: 'in-progress',
      position: null,
      line: null,
      note: '5 open tasks, no current task.',
    })
  })

  test('the same plan with the registry marker x is Done', () => {
    expect(card({ plan: { kind: 'plan', plan: plan(mastery) }, registryMarker: 'x' }).column).toBe('done')
  })
})

describe('a folder with no registry entry', () => {
  test('follows the plan and is not registered', () => {
    const md = '## Phase 1: A\n\n- [x] Task: One\n- [ ] Task: Two\n'
    const track = card({ plan: { kind: 'plan', plan: plan(md) }, registryMarker: null })
    expect(track).toMatchObject({ column: 'in-progress', registered: false, title: 'Invented track' })
  })

  test('is Planned for a plan with no task', () => {
    const track = card({ plan: { kind: 'plan', plan: plan('# Plan: prose only\n') }, registryMarker: null })
    expect(track.column).toBe('planned')
  })
})

describe('buildBoard', () => {
  test('keeps the input order and sets the repo', () => {
    const board = buildBoard('invented-repo', [
      input({ title: 'First' }),
      input({ title: 'Second', registryMarker: 'x' }),
    ])
    expect(board.repo).toBe('invented-repo')
    expect(board.cards.map(one => one.title)).toEqual(['First', 'Second'])
  })
})

describe('columnView', () => {
  const boardOf = (count: number, over: (index: number) => Partial<TrackInput> = () => ({})) =>
    buildBoard(
      'invented-repo',
      Array.from({ length: count }, (_value, index) =>
        input({ title: `Card ${index}`, lastChange: NOW - index * DAY, ...over(index) }),
      ),
    )

  test('caps the shown cards at 8 and counts the hidden ones', () => {
    const view = columnView(boardOf(10), 'planned', false, false, NOW)
    expect(view).toMatchObject({ column: 'planned', label: 'Planned', total: 10, hidden: 2 })
    expect(view.shown.length).toBe(8)
  })

  test('shows every card when expanded', () => {
    const view = columnView(boardOf(10), 'planned', true, false, NOW)
    expect(view).toMatchObject({ total: 10, hidden: 0 })
    expect(view.shown.length).toBe(10)
  })

  test('sorts the newest card first and an unknown change last', () => {
    const board = buildBoard('invented-repo', [
      input({ title: 'Old', lastChange: NOW - 5 * DAY }),
      input({ title: 'Unknown', lastChange: null }),
      input({ title: 'New', lastChange: NOW - DAY }),
      input({ title: 'Tie', lastChange: NOW - DAY }),
    ])
    const view = columnView(board, 'planned', true, false, NOW)
    expect(view.shown.map(one => one.title)).toEqual(['New', 'Tie', 'Old', 'Unknown'])
  })

  test('holds the stale cards of Planned and In progress in their own group', () => {
    const board = buildBoard('invented-repo', [
      ...Array.from({ length: 10 }, (_value, index) => input({ title: `Live ${index}`, lastChange: NOW - index * DAY })),
      input({ title: 'Stale one', lastChange: NOW - 31 * DAY }),
      input({ title: 'Stale two', lastChange: NOW - 40 * DAY }),
    ])
    const view = columnView(board, 'planned', false, true, NOW)
    expect(view.stale.map(one => one.title)).toEqual(['Stale one', 'Stale two'])
    expect(view.staleOpen).toBe(true)
    expect(view).toMatchObject({ total: 12, hidden: 2 })
    expect(view.shown.length).toBe(8)
  })

  test('keeps a card at exactly 30 days out of the stale group', () => {
    const board = buildBoard('invented-repo', [
      input({ title: 'At the line', lastChange: NOW - 30 * DAY }),
      input({ title: 'Just over', lastChange: NOW - 30 * DAY - 1 }),
    ])
    const view = columnView(board, 'planned', false, false, NOW)
    expect(view.stale.map(one => one.title)).toEqual(['Just over'])
  })

  test('gives an empty column no card', () => {
    const view = columnView(buildBoard('invented-repo', [input({ registryMarker: 'x' })]), 'planned', false, false, NOW)
    expect(view).toMatchObject({ total: 0, hidden: 0 })
    expect(view.shown).toEqual([])
    expect(view.stale).toEqual([])
  })

  test('keeps Done out of the stale group and ignores expanded', () => {
    const board = buildBoard('invented-repo', [
      input({ title: 'Done one', registryMarker: 'x', folder: 'archive/done_1', lastChange: null }),
      input({ title: 'Done two', registryMarker: 'x', folder: 'archive/done_2', lastChange: null }),
    ])
    const closed = columnView(board, 'done', false, false, NOW)
    const open = columnView(board, 'done', true, false, NOW)
    expect(closed.total).toBe(2)
    expect(closed.stale).toEqual([])
    expect(open.total).toBe(closed.total)
    expect(open.hidden).toBe(0)
  })
})

describe('blockedTracks', () => {
  test('counts the Waits for Daniel cards of every board', () => {
    const waiting = input({
      plan: {
        kind: 'plan',
        plan: plan('## Phase 1: A\n\n- [x] Task: One\n- [ ] Task 1.5: GATE look\n'),
      },
      lastChange: NOW,
    })
    const boards = [
      buildBoard('invented-a', [waiting, input({ registryMarker: 'x' })]),
      buildBoard('invented-b', [waiting, waiting]),
    ]
    expect(blockedTracks(boards)).toBe(3)
  })
})

describe('cardLabel', () => {
  test('gives no label to any card (FR-13)', () => {
    const blocked = card({ plan: { kind: 'missing' }, registryMarker: 'b' })
    const manual = card({
      plan: {
        kind: 'plan',
        plan: plan('## Phase 1: A\n\n- [x] Task: One\n- [ ] Task: Two User Manual Verification\n'),
      },
    })
    const gate = card({
      plan: { kind: 'plan', plan: plan('## Phase 1: A\n\n- [x] Task: One\n- [ ] Task 1.5: GATE. PM look\n') },
    })
    expect(cardLabel(blocked)).toBeNull()
    expect(cardLabel(manual)).toBeNull()
    expect(cardLabel(gate)).toBeNull()
    expect(cardLabel(card({ registryMarker: 'x' }))).toBeNull()
    expect(cardLabel(card())).toBeNull()
  })
})

describe('FR-16, D2: the Done group', () => {
  const utcDate = (ms: number) => new Date(ms).toISOString().slice(0, 10)

  const done = (title: string, days: number | null, over: Partial<TrackInput> = {}) =>
    input({
      title,
      registryMarker: 'x',
      folder: 'archive/done_1',
      lastChange: days === null ? null : NOW - days * DAY,
      ...over,
    })

  test('holds the window of 14 days', () => {
    expect(DONE_WINDOW_DAYS).toBe(14)
  })

  test('marks a Done track under tracks/ as not archived', () => {
    const kept = classifyTrack(input({ registryMarker: 'x', folder: 'tracks/kept_1' }))
    const moved = classifyTrack(input({ registryMarker: 'x', folder: 'archive/moved_2' }))
    expect(kept).toMatchObject({ column: 'done', archived: false })
    expect(moved).toMatchObject({ column: 'done', archived: true })
  })

  test('marks a Done card with no folder as not archived', () => {
    const none = classifyTrack(input({ registryMarker: 'x', folder: null }))
    expect(none).toMatchObject({ column: 'done', archived: false })
  })

  test('shows the 5 newest closed tracks, newest first', () => {
    const board = buildBoard(
      'invented-repo',
      [7, 1, 3, 5, 2, 4, 6].map(days => done(`Done ${days}`, days)),
    )
    const summary = doneSummary(board, NOW)
    expect(summary.shown.map(one => one.title)).toEqual(['Done 1', 'Done 2', 'Done 3', 'Done 4', 'Done 5'])
    expect(summary.more).toBe(2)
  })

  test('keeps a track closed exactly 14 days ago and drops one at 15 days', () => {
    const board = buildBoard('invented-repo', [done('Inside', 14), done('Outside', 15)])
    expect(doneSummary(board, NOW).shown.map(one => one.title)).toEqual(['Inside'])
  })

  test('keeps out a Done track with no closed date', () => {
    const board = buildBoard('invented-repo', [done('No date', null)])
    const summary = doneSummary(board, NOW)
    expect(summary.shown).toEqual([])
    expect(summary.more).toBe(1)
  })

  test('takes the closed date of the card from doneDate when no file time is known', () => {
    const board = buildBoard('invented-repo', [
      done('Recent', null, { doneDate: utcDate(NOW - 3 * DAY), doneSource: 'folder' }),
      done('Old', null, { doneDate: utcDate(NOW - 40 * DAY), doneSource: 'folder' }),
    ])
    expect(doneSummary(board, NOW).shown.map(one => one.title)).toEqual(['Recent'])
  })

  test('keeps card order for an equal closed time', () => {
    const board = buildBoard('invented-repo', [done('First', 2), done('Second', 2)])
    expect(doneSummary(board, NOW).shown.map(one => one.title)).toEqual(['First', 'Second'])
  })

  test('counts the archived and the not archived Done tracks', () => {
    const board = buildBoard('invented-repo', [
      done('Archive one', 1),
      done('Archive two', 2, { folder: 'archive/other_2' }),
      done('Kept', 3, { folder: 'tracks/kept_3' }),
    ])
    const summary = doneSummary(board, NOW)
    expect(summary.archived).toBe(2)
    expect(summary.notArchived).toBe(1)
    expect(summary.more).toBe(0)
  })

  test('counts only the Done cards', () => {
    const board = buildBoard('invented-repo', [done('Done', 1), input({ title: 'Planned' })])
    const summary = doneSummary(board, NOW)
    expect(summary.archived).toBe(1)
    expect(summary.notArchived).toBe(0)
    expect(summary.more).toBe(0)
  })
})
