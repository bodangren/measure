// FR-1: the roster of the active Reading Advantage repos, their measure globs,
// and the path of a file under the measure folder of a repo. Pure data.
export type RosterRepo = { id: string; path: string }

const rosterRepo = (id: string): RosterRepo => ({ id, path: `~/Desktop/${id}` })

/** The active repos in the order of the PM assignment. */
export const ROSTER: readonly RosterRepo[] = [
  rosterRepo('reading-advantage-monorepo'),
  rosterRepo('Workbooks'),
  rosterRepo('advantage-pr'),
  rosterRepo('advantage-forge'),
  rosterRepo('mastery-advantage'),
  // ra-math-advantage: parked by Daniel 2026-11-27; add back when he unparks it.
  rosterRepo('lending-desk-bench'),
  rosterRepo('advantage-mmorpg'),
  rosterRepo('measure'),
]

/** One `filesystem` glob for each repo: `<path>/measure/**`. */
export const rosterGlobs = (): string[] => ROSTER.map(repo => `${repo.path}/measure/**`)

/** The path of a file under the measure folder of a repo. */
export const measureFile = (repo: RosterRepo, relative: string): string =>
  `${repo.path}/measure/${relative}`
