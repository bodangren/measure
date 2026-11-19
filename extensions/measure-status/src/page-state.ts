// FR-10: the states of the repos while a load runs. A reload keeps the old
// cards on the page until the new data of that repo arrives. The module holds
// no host call and no DOM access.
import type { RepoState } from './load'
import { ROSTER } from './roster'

/**
 * FR-10: the states of the next load. A repo with a ready board keeps that
 * board. A repo without a board waits in the loading state.
 */
export const startLoad = (states: readonly RepoState[]): RepoState[] => {
  const ready = new Map(
    states
      .filter(one => one.status === 'ready')
      .map(one => [one.repo.id, one] as const),
  )
  const next: RepoState[] = ROSTER.map(repo => ready.get(repo.id) ?? { status: 'loading', repo })
  for (const one of states) {
    if (one.status !== 'ready') continue
    if (ROSTER.some(repo => repo.id === one.repo.id)) continue
    next.push(one)
  }
  return next
}

/**
 * FR-10: the state of one repo lands in the list. The other repos keep their
 * boards.
 */
export const applyRepoResult = (
  states: readonly RepoState[],
  repoId: string,
  result: RepoState,
): RepoState[] => {
  const index = states.findIndex(one => one.repo.id === repoId)
  if (index < 0) return [...states, result]
  const next = [...states]
  next[index] = result
  return next
}
