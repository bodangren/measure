// The Measure board panel and page, and the Work Status section. The panel
// and the page read the Measure files of the roster through the host file API
// and draw the board of FR-5 to FR-8. The status surface keeps the band.
import { connectHost, type HostReadyContext } from '@openchamber/sdk'
import { applyHostReady } from '@openchamber/sdk/ui'
import { bandLine, markerClassName } from '../src/band'
import { blockedTracks } from '../src/board'
import { loadSnapshot, type MeasureHost } from '../src/measure'
import { loadRoster, RELOAD_MS, shouldReload, type RepoState } from '../src/load'
import { renderPage, sectionOpen, type UiState } from '../src/render'
import { ROSTER } from '../src/roster'
import { BOARD_CSS } from '../src/styles'
import type { Snapshot } from '../src/types'

type Surface = 'panel' | 'page' | 'status' | 'dialog' | 'background' | 'file' | 'popover'

const host = connectHost() as MeasureHost & {
  onReady: (listener: (ctx: HostReadyContext) => void) => () => void
  onDirectory: (listener: (directory: string | null) => void) => () => void
  setBadge: (count: number | null) => Promise<void>
  setHeight: (px: number) => Promise<void>
}

const root = document.querySelector('#root') as HTMLElement

/** FR-12: the board CSS goes into the page as one style element. */
const style = document.createElement('style')
style.textContent = BOARD_CSS
document.head.appendChild(style)

/** The state of every roster repo. One entry per repo, in roster order. */
let states: RepoState[] = []

/** The open state that the user set. It wins over the default of FR-7. */
const userOpen: Record<string, boolean> = {}
const userDoneOpen: Record<string, boolean> = {}
const userDoneGroupOpen: Record<string, boolean> = {}
const userExpanded: Record<string, boolean> = {}
const userStaleOpen: Record<string, boolean> = {}

/** True while a load runs. A second load starts no work. */
let busy = false

/** The band snapshot of the open project. The status surface shows it. */
let current: Snapshot | null = null

/** The surface of this frame. */
let surface: Surface = 'panel'

/** The timer of the full reload of FR-10. */
let timer: number | null = null

/**
 * FR-15 C3: under 640 px only the first section with a Blocked or a Waiting
 * card starts open. Every other section starts closed.
 */
const openDefaults = (): Record<string, boolean> => {
  const out: Record<string, boolean> = {}
  if (window.innerWidth >= 640) return out
  let first = true
  for (const state of states) {
    if (state.status !== 'ready') continue
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

/** FR-9: the rail badge shows the Blocked tracks of all loaded repos. */
const refreshBadge = async (): Promise<void> => {
  const boards = states.flatMap(state =>
    state.status === 'ready' ? [state.board] : [],
  )
  const count = blockedTracks(boards)
  await host.setBadge(count > 0 ? count : null)
}

/** Draws the board of the panel and the page. */
const paint = (): void => {
  if (surface === 'status') {
    paintStatus()
    return
  }
  // Every text from a file passes through `escapeHtml` before it reaches this
  // string, so the assignment cannot add an element of the file text.
  root.innerHTML = renderPage({ states, ui: uiOf(), now: Date.now(), busy })
  bind()
}

/** Draws the band of the Work Status section. */
const paintStatus = (): void => {
  root.textContent = ''
  if (current === null) {
    root.appendChild(plainLine('Measure: no project open'))
  } else {
    const line = bandLine(current)
    if (line === null) {
      root.appendChild(plainLine('Measure: project has no measure/ folder'))
    } else {
      root.appendChild(bandElement(line, current.parseError !== null))
    }
  }
  void host.setHeight(48)
}

/** The band element: plain styled text with the first `[X]` marker colored. */
const bandElement = (line: string, error: boolean): HTMLElement => {
  const element = document.createElement('div')
  element.className = error ? 'band band-error' : 'band'
  const marker = /\[([ ~xb])\]/.exec(line)
  if (marker === null) {
    element.textContent = line
    return element
  }
  const value = marker[1] ?? ' '
  const before = line.slice(0, marker.index)
  const after = line.slice(marker.index + 3)
  const span = document.createElement('span')
  span.className = markerClassName(value as ' ' | '~' | 'x' | 'b')
  span.textContent = `[${value}]`
  element.append(before, span, after)
  return element
}

const plainLine = (text: string): HTMLElement => {
  const element = document.createElement('div')
  element.className = 'band'
  element.textContent = text
  return element
}

/** FR-10: a full load of the roster. One repo loads on its own. */
const loadBoard = async (): Promise<void> => {
  if (busy) return
  busy = true
  states = ROSTER.map((repo): RepoState => ({ status: 'loading', repo }))
  paint()
  await loadRoster(host, ROSTER, (state) => {
    states = states.map(one => (one.repo.id === state.repo.id ? state : one))
    paint()
    void refreshBadge()
  })
  busy = false
  paint()
  await refreshBadge()
}

/** Reads the Measure files of the open project for the band. */
const loadBand = async (directory: string | null): Promise<void> => {
  current = await loadSnapshot(host, directory)
  paint()
}

/** FR-10: a full reload every 60 seconds while the page is visible. */
const startTimer = (): void => {
  if (timer !== null) return
  timer = window.setInterval(() => {
    if (!shouldReload(document.visibilityState === 'visible', busy)) return
    void loadBoard()
  }, RELOAD_MS)
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
    void loadBoard()
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

// ----- The mount hook. The surface decides what the frame shows.

let mountedOnce = false

host.onReady((ctx) => {
  applyHostReady(ctx, document.documentElement)
  surface = ctx.surface
  if (!mountedOnce) {
    mountedOnce = true
    host.onDirectory((directory) => {
      void loadBand(directory)
    })
    if (surface === 'status') {
      void loadBand(ctx.directory)
    } else {
      startTimer()
      void loadBoard()
    }
  }
  paint()
})
