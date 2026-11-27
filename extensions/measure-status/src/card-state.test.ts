// FR-9 to FR-17 (Task 2.1 Red): one state and one reason per card.
// Every fixture text here is invented, except the two User Manual
// Verification rows, which quote spec.md FR-16 verbatim. This suite fails
// until the board, parse, and render modules implement the Phase 2 rules.
// Green must not weaken these assertions.
import { describe, expect, test } from 'vitest'
import {
  blockedTracks,
  buildBoard,
  cardLabel,
  COLUMN_LABELS,
  gateForOwner,
  type Card,
  type CardState,
  type TrackInput,
} from './board'
import { formatComment } from './comment'
import { parsePlan, taskLabel, tasksOf } from './parse'
import { cardKey, renderCard, renderPage, type UiState } from './render'

const NOW = 1_800_000_000_000

const ui: UiState = { open: {}, doneOpen: {}, expanded: {} }

const input = (planMd: string, over: Partial<TrackInput> = {}): TrackInput => ({
  repo: 'invented-repo',
  title: 'Invented track',
  registryMarker: ' ',
  folder: 'tracks/invented_1',
  plan: { kind: 'plan', plan: parsePlan(planMd) },
  lastChange: NOW,
  doneDate: null,
  doneSource: null,
  now: NOW,
  ...over,
})

const card = (planMd: string, over: Partial<TrackInput> = {}): Card =>
  buildBoard('invented-repo', [input(planMd, over)]).cards[0] as Card

const DASH = ' \u2014 '

describe('the gate word map (FR-10)', () => {
  const gates: Array<[string | null, string | null]> = [
    ['deploy', 'deploy'],
    ['traffic', 'deploy'],
    ['paid', 'paid spend'],
    ['spend', 'paid spend'],
    ['delete', 'deletion'],
    ['deletion', 'deletion'],
    ['public-date', 'public date'],
    ['look', 'look'],
    ['manual', 'look'],
    ['thai', 'Thai check'],
    ['proof', 'proof'],
    ['sudo', 'sudo or login'],
    ['login', 'sudo or login'],
    ['daniel-deploy', 'deploy'],
    ['paid-deploy', 'paid spend'],
    ['deploy-deletion', 'deletion'],
    ['manual-deploy-word', 'deploy'],
    ['sudo-proof', 'sudo or login'],
    ['proof-thai', 'proof'],
    ['thai-look', 'Thai check'],
    ['login-public', 'public date'],
    ['spend-sudo', 'paid spend'],
    ['nodeploy', null],
    ['unpaid', null],
    ['Deploy_Now', 'deploy'],
    ['a.deploy', 'deploy'],
    ['a;deploy', 'deploy'],
    ['DEPLOY', 'deploy'],
    [null, null],
    ['', null],
    ['pm', null],
    ['mid-red', null],
    ['later-track', null],
    ['daniel', null],
    ['daniel-word', null],
  ]
  for (const [owner, gate] of gates) {
    test(`owner ${JSON.stringify(owner)} gives gate ${JSON.stringify(gate)}`, () => {
      expect(gateForOwner(owner)).toBe(gate)
    })
  }
})

describe('the continuation-line deferred tag (FR-9)', () => {
  test('the first-line tag still counts', () => {
    const tasks = tasksOf(parsePlan('## Phase 1: Work\n\n- [b] Task: Wait deferred:copy\n'))
    expect(tasks[0]?.deferredOwner).toBe('copy')
  })

  test('the tag counts on a wrapped continuation line', () => {
    const tasks = tasksOf(
      parsePlan('## Phase 1: Work\n\n- [b] Task: Wait\n  deferred:copy-owner\n'),
    )
    expect(tasks[0]?.deferredOwner).toBe('copy-owner')
  })

  test('the tag counts after wrapped words', () => {
    const tasks = tasksOf(
      parsePlan('## Phase 1: Work\n\n- [b] Task: Wait\n  wrapped words here\n  deferred:copy-owner\n'),
    )
    expect(tasks[0]?.deferredOwner).toBe('copy-owner')
  })

  test('the tag counts after an em dash', () => {
    const tasks = tasksOf(
      parsePlan('## Phase 1: Work\n\n- [b] Task: Wait\n  \u2014 deferred:mid-red\n'),
    )
    expect(tasks[0]?.deferredOwner).toBe('mid-red')
  })

  test('the search stops at the first sub-bullet', () => {
    const tasks = tasksOf(
      parsePlan('## Phase 1: Work\n\n- [b] Task: Wait\n    - [x] Sub done\n  deferred:late-owner\n'),
    )
    expect(tasks[0]?.deferredOwner).toBe(null)
  })

  test('the search stops at the next task', () => {
    const tasks = tasksOf(
      parsePlan(
        '## Phase 1: Work\n\n- [b] Task: Wait\n- [b] Task: Other deferred:other-owner\n',
      ),
    )
    expect(tasks[0]?.deferredOwner).toBe(null)
    expect(tasks[1]?.deferredOwner).toBe('other-owner')
  })
})

describe('one state and one reason per card (FR-11)', () => {
  test('a four-gate owner with a Task id gives Waits for Daniel with the exact reason line', () => {
    const label = taskLabel('Task: Pay the bill deferred:spend Task NjBxVXEzVDVVQzJzZ0pKTg')
    const found = card(
      '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Pay the bill deferred:spend Task NjBxVXEzVDVVQzJzZ0pKTg\n',
    )
    expect(found.column).toBe('waiting')
    expect(found.state as CardState).toBe('waits-daniel')
    expect(found.reason).toBe(`Waits for Daniel: paid spend${DASH}${label}`)
  })

  test('a four-gate owner without a Task id is Waits for PM with the gate reason', () => {
    const found = card(
      '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Pay the bill deferred:spend\n',
    )
    expect(found.column).toBe('blocked')
    expect(found.state as CardState).toBe('waits-pm')
    expect(found.reason).toBe('Waits for PM: gate without a Task: open the Task or decide it')
  })

  test('a wrapped gate tag without a Task id gives Waits for PM', () => {
    const found = card(
      '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Deploy the thing\n  \u2014 deferred:daniel-deploy-word\n',
    )
    expect(found.column).toBe('blocked')
    expect(found.state as CardState).toBe('waits-pm')
    expect(found.reason as string).not.toContain('Daniel')
  })

  test('a gate-text current task is an ordinary next task', () => {
    const label = taskLabel('GATE check the deploy list')
    const found = card('## Phase 1: Work\n\n- [~] GATE check the deploy list\n')
    expect(found.column).toBe('in-progress')
    expect(found.state as CardState).toBe('running')
    expect(found.reason).toBe(`Running: ${label}`)
  })

  test('a manual gate word without verification text is an ordinary Waits for PM task', () => {
    const found = card(
      '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Manual verify deferred:manual\n',
    )
    expect(found.column).toBe('blocked')
    expect(found.state as CardState).toBe('waits-pm')
    expect(found.reason as string).not.toContain('Daniel')
  })

  test('a tilde task gives Running with the exact reason line', () => {
    const label = taskLabel('Task: Do the work')
    const found = card('## Phase 1: Work\n\n- [~] Task: Do the work\n')
    expect(found.column).toBe('in-progress')
    expect(found.state as CardState).toBe('running')
    expect(found.reason).toBe(`Running: ${label}`)
  })

  test('deferred:pm first not-done gives Waits for PM', () => {
    const label = taskLabel('Task: Wait for the copy deferred:pm')
    const found = card(
      '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Wait for the copy deferred:pm\n',
    )
    expect(found.column).toBe('blocked')
    expect(found.state as CardState).toBe('waits-pm')
    expect(found.reason).toBe(`Waits for PM: ${label}`)
  })

  test('deferred:mid-red first not-done gives Waits for PM', () => {
    const label = taskLabel('Task: Wait for the bench deferred:mid-red')
    const found = card(
      '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Wait for the bench deferred:mid-red\n',
    )
    expect(found.state as CardState).toBe('waits-pm')
    expect(found.reason).toBe(`Waits for PM: ${label}`)
  })

  test('the lending-desk-bench shape gives Running', () => {
    const label = taskLabel('Task: Doing the work')
    const found = card(
      '## Phase 1: Trust\n\n- [~] Task: Doing the work\n## Phase 2: Checks\n\n- [b] Task: Test file\n  \u2014 deferred:mid-red\n',
    )
    expect(found.column).toBe('in-progress')
    expect(found.state as CardState).toBe('running')
    expect(found.reason).toBe(`Running: ${label}`)
  })

  test('all tasks closed gives Waits for PM with the exact line', () => {
    const found = card('## Phase 1: Work\n\n- [x] Task: Done `aaaaaaa`\n')
    expect(found.state as CardState).toBe('waits-pm')
    expect(found.reason).toBe('Waits for PM: All tasks closed.')
  })

  test('registry marker [b] with no plan reason gives the exact line', () => {
    const found = card('## Phase 1: Work\n\n- [x] Task: Done `aaaaaaa`\n', {
      plan: { kind: 'missing' },
      registryMarker: 'b',
    })
    expect(found.column).toBe('blocked')
    expect(found.state as CardState).toBe('waits-pm')
    expect(found.reason).toBe('Waits for PM: registry marker [b]')
  })

  test('no plan gives Next in line with the exact line', () => {
    const found = card('## Phase 1: Work\n\n- [x] Task: Done `aaaaaaa`\n', {
      plan: { kind: 'missing' },
      registryMarker: ' ',
    })
    expect(found.column).toBe('planned')
    expect(found.state as CardState).toBe('next')
    expect(found.reason).toBe('Next in line: No plan.')
  })

  test('an unreadable plan gives Next in line with the exact line', () => {
    const found = card('## Phase 1: Work\n\n- [x] Task: Done `aaaaaaa`\n', {
      plan: { kind: 'unreadable' },
      registryMarker: ' ',
    })
    expect(found.state as CardState).toBe('next')
    expect(found.reason).toBe('Next in line: Plan unreadable.')
  })

  test('a Next in line card with a done task goes to In progress', () => {
    const found = card('## Phase 1: Work\n\n- [ ] Task: Wait\n- [x] Task: Done `aaaaaaa`\n')
    expect(found.column).toBe('in-progress')
    expect(found.state as CardState).toBe('next')
    expect(found.reason).toBe('Next in line: 1 open task, no current task.')
  })

  test('a Next in line card with two open tasks keeps the count', () => {
    const found = card(
      '## Phase 1: Work\n\n- [ ] Task: Wait\n- [x] Task: Done `aaaaaaa`\n- [b] Task: Later\n',
    )
    expect(found.state as CardState).toBe('next')
    expect(found.reason).toBe('Next in line: 2 open tasks, no current task.')
  })

  test('a Next in line card with registry [~] goes to In progress', () => {
    const found = card('## Phase 1: Work\n\n- [x] Task: Done `aaaaaaa`\n', {
      plan: { kind: 'missing' },
      registryMarker: '~',
    })
    expect(found.column).toBe('in-progress')
    expect(found.state as CardState).toBe('next')
    expect(found.reason).toBe('Next in line: No plan.')
  })
})

/** FR-16 row 1: the open deferred verification row. FR-16 row 2: the closed D1 row. */
const ROW1_BODY =
  "Task: Measure - User Manual Verification 'Phase D3: the rest of the updates and the moderate/low list' (Protocol in workflow.md). This task is deferred to track close: no visible change. Phase acceptance checks the audit counts and the gate exits; the orchestrator states them to the PM."
const ROW2_BODY =
  "Task: Measure - User Manual Verification 'Phase D1: dashboard critical and high' (Protocol in workflow.md). Closed at the D1 checkpoint: no visible change; replaced by the print-path comparison with round 11 and the phase acceptance (phase-acceptance-d1-a274e5e4.json). Acceptance at `a274e5e4`."

describe('the User Manual Verification rows (FR-11 a0, FR-16)', () => {
  for (const marker of [' ', '~', 'b'] as const) {
    test(`the open deferred row with [${marker}] gives Waits for PM`, () => {
      const found = card(`## Phase 1: D3\n\n- [${marker}] ${ROW1_BODY}\n`)
      expect(found.state as CardState).toBe('waits-pm')
      expect(found.reason).toBe(`Waits for PM: ${taskLabel(ROW1_BODY)}`)
      expect(found.reason as string).not.toContain('Daniel')
    })
  }

  test('the open deferred row shows no Comment button and adds no badge count', () => {
    const found = card(`## Phase 1: D3\n\n- [ ] ${ROW1_BODY}\n`)
    const html = renderCard(found, NOW, undefined, cardKey(found, 0))
    expect(html).not.toContain('open-comment')
    expect(blockedTracks([buildBoard('invented-repo', [input(`## Phase 1: D3\n\n- [ ] ${ROW1_BODY}\n`)])])).toBe(0)
  })

  test('the closed D1 row creates no Daniel item', () => {
    const found = card(`## Phase 1: D1\n\n- [x] ${ROW2_BODY}\n`)
    expect(found.state as CardState).not.toBe('waits-daniel')
    expect(found.reason).toBe('Waits for PM: All tasks closed.')
    expect(found.reason as string).not.toContain('Daniel')
  })
})

describe('columns, labels, buttons, badge, and the Reason field (FR-12 to FR-15)', () => {
  test('the column names follow FR-12', () => {
    expect(COLUMN_LABELS.blocked).toBe('Waits for PM')
    expect(COLUMN_LABELS.waiting).toBe('Waits for Daniel')
    expect(COLUMN_LABELS.planned).toBe('Planned')
    expect(COLUMN_LABELS['in-progress']).toBe('In progress')
    expect(COLUMN_LABELS.done).toBe('Done')
  })

  test('BLOCKER, GATE, and MANUAL CHECK labels are gone', () => {
    const pm = card(
      '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Wait for the copy deferred:pm\n',
    )
    const daniel = card(
      '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Pay the bill deferred:spend Task NjBxVXEzVDVVQzJzZ0pKTg\n',
    )
    const running = card('## Phase 1: Work\n\n- [~] Task: Do the work\n')
    expect(cardLabel(pm)).toBe(null)
    expect(cardLabel(daniel)).toBe(null)
    expect(cardLabel(running)).toBe(null)
  })

  test('the Waits for Daniel card shows its reason and only it shows Comment', () => {
    const daniel = card(
      '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Pay the bill deferred:spend Task NjBxVXEzVDVVQzJzZ0pKTg\n',
    )
    const html = renderCard(daniel, NOW, undefined, cardKey(daniel, 0))
    expect(html).toContain(daniel.reason as string)
    expect(html).toContain('data-action="open-comment"')
    expect(html).not.toContain('BLOCKER')
    expect(html).not.toContain('GATE')
    expect(html).not.toContain('MANUAL CHECK')
  })

  test('Waits for PM, Running, and Next cards show no Comment button', () => {
    const pm = card(
      '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Wait for the copy deferred:pm\n',
    )
    const running = card('## Phase 1: Work\n\n- [~] Task: Do the work\n')
    const next = card('## Phase 1: Work\n\n- [x] Task: Done `aaaaaaa`\n', {
      plan: { kind: 'missing' },
      registryMarker: ' ',
    })
    for (const one of [pm, running, next]) {
      expect(renderCard(one, NOW, undefined, cardKey(one, 0))).not.toContain('open-comment')
    }
    expect(renderCard(pm, NOW, undefined, cardKey(pm, 0))).toContain(pm.reason as string)
  })

  test('the board names the new columns', () => {
    const board = buildBoard('invented-repo', [
      input(
        '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Pay the bill deferred:spend Task NjBxVXEzVDVVQzJzZ0pKTg\n',
      ),
      input(
        '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Wait for the copy deferred:pm\n',
        { folder: 'tracks/invented_2' },
      ),
    ])
    const html = renderPage({ states: [{ status: 'ready', repo: { id: 'invented-repo', path: '' }, board }], ui, now: NOW, busy: false })
    expect(html).toContain('Waits for Daniel')
    expect(html).toContain('Waits for PM')
    expect(html).not.toContain('Blocked')
    expect(html).not.toContain('Waiting on Daniel')
  })

  test('the rail badge counts Waits for Daniel cards', () => {
    const board = buildBoard('invented-repo', [
      input(
        '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Pay the bill deferred:spend Task NjBxVXEzVDVVQzJzZ0pKTg\n',
      ),
      input(
        '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Wait for the copy deferred:pm\n',
        { folder: 'tracks/invented_2' },
      ),
      input('## Phase 1: Work\n\n- [~] Task: Do the work\n', { folder: 'tracks/invented_3' }),
    ])
    expect(blockedTracks([board])).toBe(1)
    const pmOnly = buildBoard('invented-repo', [
      input(
        '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Wait for the copy deferred:pm\n',
      ),
    ])
    expect(blockedTracks([pmOnly])).toBe(0)
  })

  test('the message field Reason carries the reason line', () => {
    const line = formatComment({
      repo: 'invented-repo',
      trackId: 'invented_1',
      taskLine: 'Running: Task: Do the work',
      blockerLine: 'Running: Task: Do the work',
      text: 'Please look at column two',
    })
    expect(line).toContain('Reason: Running: Task: Do the work')
    expect(line).not.toContain('Blocker:')
  })
})
