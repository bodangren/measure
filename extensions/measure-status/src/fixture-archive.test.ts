// FR-16, D2: the fixture Done counts match the card flags and the capture
// record. The capture of 2026-11-18 (capture.log) gives the monorepo
// done=236 with done_archived=230 and done_not_archived=5; the Done entry
// with no folder stays out of both counts, and the model (src/board.ts)
// counts that entry as not archived, so the fixture must hold archived=230
// and notArchived=6. A Done card with an empty trackId or no folder has
// archived false.
import { describe, expect, test } from 'vitest'
import raw from '../mockup/fixtures.json'

type FixtureCard = {
  column: unknown
  trackId?: unknown
  archived?: unknown
}

type FixtureRepo = {
  repo: string
  cards: FixtureCard[]
  doneArchive: { archived: number; notArchived: number }
}

const repos = (raw as { repos: FixtureRepo[] }).repos

const doneCards = (repo: FixtureRepo): FixtureCard[] =>
  repo.cards.filter(card => card.column === 'done')

describe('the doneArchive counts of the fixture', () => {
  test('each repo counts its Done cards from the archived flags', () => {
    for (const repo of repos) {
      const done = doneCards(repo)
      expect(
        repo.doneArchive.archived,
        `${repo.repo} archived count`,
      ).toBe(done.filter(card => card.archived === true).length)
      expect(
        repo.doneArchive.notArchived,
        `${repo.repo} notArchived count`,
      ).toBe(done.filter(card => card.archived === false).length)
    }
  })

  test('the monorepo holds the capture counts with the no-folder entry not archived', () => {
    const mono = repos.find(repo => repo.repo === 'reading-advantage-monorepo')
    expect(mono, 'the monorepo entry exists').toBeDefined()
    if (mono === undefined) throw new Error('the monorepo entry is missing')
    expect(doneCards(mono).length).toBe(236)
    expect(mono.doneArchive.archived).toBe(230)
    expect(mono.doneArchive.notArchived).toBe(6)
  })

  test('a Done card with an empty trackId or no folder is not archived', () => {
    for (const repo of repos) {
      for (const card of doneCards(repo)) {
        if (card.trackId === '' || card.trackId === undefined) {
          expect(card.archived, `${repo.repo} no-folder Done card`).toBe(false)
        }
      }
    }
  })
})
