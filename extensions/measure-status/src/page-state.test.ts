// FR-10: the reload keeps the old cards until the new data of that repo
// arrives. The panel must set `loading` only for repos with no prior state.
// Every fixture here is invented text.
import { describe, expect, test } from 'vitest'
import { buildBoard, type TrackInput } from './board'
import type { RepoState } from './load'
import { applyRepoResult, startLoad } from './page-state'
import { parsePlan } from './parse'
import { ROSTER, type RosterRepo } from './roster'

const NOW = 1_800_000_000_000

const repo = (id: string): RosterRepo => ({ id, path: `~/Desktop/${id}` })

const ready = (id: string, title: string): RepoState => ({
  status: 'ready',
  repo: repo(id),
  board: buildBoard(id, [
    {
      repo: id,
      title,
      registryMarker: ' ',
      folder: `tracks/${id}_1`,
      plan: {
        kind: 'plan',
        plan: parsePlan('## Phase 1: Work\n\n- [~] Task: Do the work\n'),
      },
      lastChange: NOW,
      doneDate: null,
      doneSource: null,
      now: NOW,
    } satisfies TrackInput,
  ]),
})

describe('startLoad', () => {
  test('sets loading for every repo when no prior state exists', () => {
    const next = startLoad([])
    expect(next.length).toBe(ROSTER.length)
    for (const state of next) {
      expect(state.status).toBe('loading')
    }
  })

  test('keeps the old ready board of a repo instead of blanking it', () => {
    const prior: RepoState[] = [ready('invented-a', 'Invented track')]
    const next = startLoad(prior)
    const kept = next.find(one => one.repo.id === 'invented-a')
    expect(kept?.status).toBe('ready')
    if (kept?.status !== 'ready') throw new Error('the prior board must stay')
    expect(kept.board.cards.map(card => card.title)).toEqual(['Invented track'])
  })

  test('sets loading only for repos with no prior state', () => {
    const prior: RepoState[] = [ready('invented-a', 'Invented track')]
    const next = startLoad(prior)
    const others = next.filter(one => one.repo.id !== 'invented-a')
    expect(others.length).toBeGreaterThan(0)
    for (const state of others) {
      expect(state.status).toBe('loading')
    }
  })
})

describe('applyRepoResult', () => {
  test('swaps in the new state of that repo and keeps the others', () => {
    const prior: RepoState[] = [
      ready('invented-a', 'Old track'),
      { status: 'loading', repo: repo('invented-b') },
    ]
    const fresh: RepoState = ready('invented-b', 'New track')
    const next = applyRepoResult(prior, 'invented-b', fresh)
    const kept = next.find(one => one.repo.id === 'invented-a')
    expect(kept?.status).toBe('ready')
    if (kept?.status !== 'ready') throw new Error('the other board must stay')
    expect(kept.board.cards.map(card => card.title)).toEqual(['Old track'])
    const swapped = next.find(one => one.repo.id === 'invented-b')
    expect(swapped?.status).toBe('ready')
    if (swapped?.status !== 'ready') throw new Error('the new board must land')
    expect(swapped.board.cards.map(card => card.title)).toEqual(['New track'])
  })
})
