// FR-12, FR-13: the preview page renders the real board code from the
// invented fixtures. It has no host and reads no file. The build command
// bundles this file into `preview/preview.js`.
import fixtureJson from '../mockup/fixtures.json'
import type { Card, RepoBoard } from '../src/board'
import type { RosterRepo } from '../src/roster'
import { renderPage, sectionOpen, type UiState } from '../src/render'
import { BOARD_CSS } from '../src/styles'

type FixtureFile = {
  capturedAt: number
  repos: Array<{
    repo: string
    cards: Card[]
  }>
}

/** Every repo of the fixture is ready. */
type ReadyState = { status: 'ready'; repo: RosterRepo; board: RepoBoard }

const fixture = fixtureJson as unknown as FixtureFile

const query = new URLSearchParams(window.location.search)
const theme = query.get('theme') === 'dark' ? 'dark' : 'light'
document.documentElement.setAttribute('data-oc-theme', theme)

const root = document.querySelector('#root') as HTMLElement
const debug = document.querySelector('#debug')

/** FR-12: the board CSS goes into the page as one style element. */
const style = document.createElement('style')
style.textContent = BOARD_CSS
document.head.appendChild(style)

/** The capture time of the fixtures is the time of the board. */
const now = fixture.capturedAt

const states: ReadyState[] = fixture.repos.map(repo => ({
  status: 'ready',
  repo: { id: repo.repo, path: `~/Desktop/${repo.repo}` },
  board: { repo: repo.repo, cards: repo.cards },
}))

/** The open state that the user set. It wins over the default of FR-7. */
const userOpen: Record<string, boolean> = {}
const userDoneOpen: Record<string, boolean> = {}
const userDoneGroupOpen: Record<string, boolean> = {}
const userExpanded: Record<string, boolean> = {}
const userStaleOpen: Record<string, boolean> = {}

const openKey = query.get('open')
if (openKey !== null) userOpen[openKey] = true
if (query.get('done') === 'open') {
  for (const repo of fixture.repos) userDoneOpen[repo.repo] = true
}

/**
 * FR-15 C3: under 640 px only the first section with a Blocked or a Waiting
 * card starts open. Every other section starts closed.
 */
const openDefaults = (): Record<string, boolean> => {
  const out: Record<string, boolean> = {}
  if (window.innerWidth >= 640) return out
  let first = true
  for (const state of states) {
    const attention = state.board.cards.some(
      card => card.column === 'blocked' || card.column === 'waiting',
    )
    out[state.repo.id] = attention && first
    if (attention && first) first = false
  }
  return out
}

/** The open state of the page. */
const uiOf = (): UiState => ({
  open: { ...openDefaults(), ...userOpen },
  doneOpen: { ...userDoneOpen },
  expanded: { ...userExpanded },
  staleOpen: { ...userStaleOpen },
  doneGroupOpen: { ...userDoneGroupOpen },
})

/** The open state of one section. */
const openOf = (repo: string): boolean => {
  const state = states.find(one => one.repo.id === repo)
  if (state === undefined) return false
  return sectionOpen(state, uiOf())
}

/** Draws the board. */
const paint = (): void => {
  // Every text from a file passes through `escapeHtml` before it reaches this
  // string, so the assignment cannot add an element of the file text.
  root.innerHTML = renderPage({ states, ui: uiOf(), now, busy: false })
  bind()
}

// ----- The events of the board. Every button carries a `data-action`.

/**
 * Binds every button of the board. Each button keeps its own listener, so a
 * button that a repaint detached still works.
 */
const bind = (): void => {
  for (const button of root.querySelectorAll<HTMLElement>('[data-action]')) {
    button.addEventListener('click', onAction)
  }
}

const onAction = (event: Event): void => {
  const button = event.currentTarget
  if (!(button instanceof HTMLElement)) return
  const action = button.getAttribute('data-action')
  const repo = button.getAttribute('data-repo')
  const column = button.getAttribute('data-column')

  if (action === 'refresh') {
    paint()
    return
  }
  if (repo === null) return
  if (action === 'toggle-section') {
    userOpen[repo] = !openOf(repo)
    paint()
    return
  }
  if (action === 'toggle-done') {
    userDoneOpen[repo] = !(userDoneOpen[repo] ?? false)
    paint()
    return
  }
  if (action === 'toggle-done-group') {
    userDoneGroupOpen[repo] = !(userDoneGroupOpen[repo] ?? false)
    paint()
    return
  }
  if (column === null) return
  const key = `${repo}/${column}`
  if (action === 'show-more') {
    userExpanded[key] = true
    paint()
    return
  }
  if (action === 'toggle-stale') {
    const staleOpen = (uiOf().staleOpen ?? {})[key] ?? false
    userStaleOpen[key] = !staleOpen
    paint()
  }
}

paint()

if (query.get('debug') === '1' && debug !== null) {
  debug.textContent = `scrollWidth=${document.documentElement.scrollWidth} innerWidth=${window.innerWidth}`
}
