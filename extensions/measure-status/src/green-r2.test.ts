// Review A F1-F3: separator tokens, regenerated fixture reasons, and the
// Next in line reason with a current task. Every fixture here is invented
// except the committed mockup snapshot.
import { describe, expect, test } from 'vitest'
import {
  classifyTrack,
  type Card,
  type CardState,
  type Column,
  type TrackInput,
} from './board'
import { ownerToken, parsePlan, taskLabel } from './parse'
import { cardKey, renderCard } from './render'
import raw from '../mockup/fixtures.json'

const NOW = 1_800_000_000_000

const inputOf = (planMd: string): TrackInput => ({
  repo: 'invented-repo',
  title: 'Invented track',
  registryMarker: ' ',
  folder: 'tracks/invented_1',
  plan: { kind: 'plan', plan: parsePlan(planMd) },
  lastChange: NOW,
  doneDate: null,
  doneSource: null,
  now: NOW,
})

const ownerCard = (owner: string): Card =>
  classifyTrack(
    inputOf(`## Phase 1: Work\n\n- [x] Task: Done\n- [b] Task: Gate deferred:${owner}\n`),
  )

describe('F1: separators parse into the card; only the four gates with a Task id make Daniel', () => {
  const cases: Array<[string, string, string]> = [
    ['a-deploy', 'deploy', '-'],
    ['Deploy_Now', 'deploy', '_'],
    ['a.deploy', 'deploy', '.'],
    ['a;deploy', 'deploy', ';'],
  ]
  const TASK_ID = 'NjBxVXEzVDVVQzJzZ0pKTg'
  for (const [owner, gate, separator] of cases) {
    test(`the ${separator} separator in ${owner} parses but stays Waits for PM`, () => {
      expect(ownerToken(`Task: Gate deferred:${owner}`)).toBe(owner)
      const card = ownerCard(owner)
      expect(card.state).toBe('waits-pm')
      expect(card.reason).toBe(`Waits for PM: ${taskLabel(`Task: Gate deferred:${owner}`)}`)
      expect(renderCard(card, NOW, undefined, cardKey(card, 0))).not.toContain('open-comment')
    })
  }

  test('proof;delete parses by the FR-10 priority order but stays Waits for PM', () => {
    expect(ownerToken('Task: Gate deferred:proof;delete')).toBe('proof;delete')
    const card = ownerCard('proof;delete')
    expect(card.state).toBe('waits-pm')
    expect(card.reason as string).not.toContain('Waits for Daniel')
    expect(renderCard(card, NOW, undefined, cardKey(card, 0))).not.toContain('open-comment')
  })

  test('spend with a Task id makes the Daniel card', () => {
    const card = ownerCard(`spend Task ${TASK_ID}`)
    expect(card.state).toBe('waits-daniel')
    expect(card.reason).toContain('Waits for Daniel: paid spend ')
    expect(renderCard(card, NOW, undefined, cardKey(card, 0))).toContain('open-comment')
  })
})

describe('F2: the mockup reasons follow the new rules', () => {
  const cards = (raw as { repos: Array<{ cards: Card[] }> }).repos.flatMap(repo => repo.cards)

  test('every open card holds a non-empty reason', () => {
    const empty = cards.filter(
      card => card.column !== 'done' && (card.reason === null || card.reason.trim() === '' || card.reason.endsWith(': ')),
    )
    expect(empty.map(card => card.trackId)).toEqual([])
  })

  test('each of the four gates has a fixture card with a Task id', () => {
    const reasons = cards.map(card => card.reason ?? '')
    for (const gate of ['deletion', 'paid spend', 'public date', 'Thai check']) {
      expect(
        reasons.some(reason => reason.startsWith(`Waits for Daniel: ${gate} \u2014 `)),
        `missing gate ${gate}`,
      ).toBe(true)
    }
  })

  test('a gate fixture card shows the Comment button', () => {
    const gate = cards.find(card => (card.reason ?? '').startsWith('Waits for Daniel: deletion '))
    expect(gate).toBeDefined()
    if (gate === undefined) throw new Error('the deletion gate fixture is missing')
    expect(renderCard(gate, NOW, undefined, cardKey(gate, 0))).toContain('open-comment')
  })

  test('no fixture card uses a Daniel reason the new rule cannot make', () => {
    const retired = cards.filter(card =>
      (card.reason ?? '').startsWith('Waits for Daniel: look ') ||
      (card.reason ?? '').startsWith('Waits for Daniel: deploy ') ||
      (card.reason ?? '').startsWith('Waits for Daniel: sudo or login ') ||
      (card.reason ?? '').startsWith('Waits for Daniel: proof '),
    )
    const fixed = retired.map(card => card.trackId)
    expect(fixed).toEqual([])
  })
})

describe('F4: the fixture column matches the classifier column for its state', () => {
  const cards = (raw as { repos: Array<{ cards: Card[] }> }).repos.flatMap(repo => repo.cards)

  /** The column the real classifier gives for a canonical card of one state. */
  const columnForState = (state: CardState): Column => {
    const base = {
      repo: 'invented-repo',
      title: 'Invented track',
      registryMarker: ' ' as const,
      folder: 'tracks/invented_1',
      lastChange: null,
      doneDate: null,
      doneSource: null,
      now: NOW,
    }
    if (state === 'done') {
      return classifyTrack({ ...base, registryMarker: 'x', plan: { kind: 'missing' } }).column
    }
    const plans: Record<Exclude<CardState, 'done'>, string> = {
      'waits-daniel': '## Phase 1: Work\n\n- [x] Task: Done `aaaaaaa`\n- [b] Task: Gate deferred:spend Task NjBxVXEzVDVVQzJzZ0pKTg\n',
      'waits-pm': '## Phase 1: Work\n\n- [x] Task: Done\n- [b] Task: Wait deferred:pm\n',
      running: '## Phase 1: Work\n\n- [~] Task: Work\n',
      next: '## Phase 1: Work\n\n- [ ] Task: Work\n',
    }
    const plan = plans[state as Exclude<CardState, 'done'>]
    if (plan === undefined) throw new Error(`no plan for state ${state}`)
    return classifyTrack({ ...base, plan: { kind: 'plan', plan: parsePlan(plan) } }).column
  }

  test('every card has a consistent column and a non-empty reason', () => {
    const faults: string[] = []
    for (const card of cards) {
      const state = card.state as CardState
      const expected = columnForState(state)
      if (state === 'next') {
        if (card.column !== 'planned' && card.column !== 'in-progress') {
          faults.push(`${card.trackId}: state next, column ${card.column}`)
        }
      } else if (card.column !== expected) {
        faults.push(`${card.trackId}: state ${state}, column ${card.column}, expected ${expected}`)
      }
      if (
        card.column !== 'done' &&
        (card.reason === null || card.reason.trim() === '' || card.reason.endsWith(': '))
      ) {
        faults.push(`${card.trackId}: empty reason`)
      }
    }
    expect(faults).toEqual([])
  })
})

describe('F3: Next in line names the current task, not the count note', () => {
  test('a Planned card with one open task names that task', () => {
    const card = classifyTrack(inputOf('## Phase 1: Work\n\n- [ ] Task: First\n'))
    expect(card.column).toBe('planned')
    expect(card.state).toBe('next')
    expect(card.reason).toBe('Next in line: Task: First')
    expect(card.reason).not.toContain('no current task')
    expect(card.position).not.toBeNull()
    expect(card.taskText).toBe('Task: First')
  })

  test('an In progress card with a current task names that task', () => {
    const card = classifyTrack(
      inputOf('## Phase 1: Work\n\n- [x] Task: Done\n- [ ] Task: First\n'),
    )
    expect(card.column).toBe('in-progress')
    expect(card.state).toBe('next')
    expect(card.reason).toBe('Next in line: Task: First')
    expect(card.reason).not.toContain('no current task')
  })

  test('a card with no current task keeps the count note', () => {
    const card = classifyTrack(
      inputOf('## Phase 1: Work\n\n- [ ] Task: One\n- [ ] Task: Two\n- [x] Task: Done\n'),
    )
    expect(card.state).toBe('next')
    expect(card.reason).toBe('Next in line: 2 open tasks, no current task.')
  })
})
