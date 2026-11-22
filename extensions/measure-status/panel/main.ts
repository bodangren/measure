// The Measure board panel and page, and the Work Status section. The panel
// and the page read the Measure files of the roster through the host file API
// and draw the board of FR-5 to FR-8. The status surface keeps the band.
import { connectHost, type GuestRequest, type GuestRequestResult, type HostReadyContext } from '@openchamber/sdk'
import { applyHostReady } from '@openchamber/sdk/ui'
import { bandLine, markerClassName } from '../src/band'
import { blockedTracks, type Card } from '../src/board'
import {
  emptyCommentBox,
  escapeCommentBox,
  finishCommentSend,
  focusAfter,
  focusAfterToggle,
  openCommentBox,
  setCommentText,
  startCommentSend,
  type CommentBoxState,
  type FocusAction,
  type ToggleAction,
} from '../src/comment-box'
import { loadSnapshot, type MeasureHost } from '../src/measure'
import { loadRoster, RELOAD_MS, shouldReload, type RepoState } from '../src/load'
import { applyRepoResult, startLoad } from '../src/page-state'
import { captureComment, createPainter, holdComment, restoreComment } from '../src/painter'
import { cardKey, renderPage, sectionOpen, type CommentUi, type UiState } from '../src/render'
import { ROSTER } from '../src/roster'
import {
  createCommentSender,
  isSendDisabled,
  SEND_METHOD,
  SEND_SERVICE,
  type SendHost,
} from '../src/send'
import { BOARD_CSS } from '../src/styles'
import type { Snapshot } from '../src/types'

type Surface = 'panel' | 'page' | 'status' | 'dialog' | 'background' | 'file' | 'popover' | 'block'

const host = connectHost() as MeasureHost & {
  onReady: (listener: (ctx: HostReadyContext) => void) => () => void
  onDirectory: (listener: (directory: string | null) => void) => () => void
  setBadge: (count: number | null) => Promise<void>
  setHeight: (px: number) => Promise<void>
  serviceRequest: (request: GuestRequest) => Promise<GuestRequestResult>
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

// ----- FR-16, D1: the comment of a card. The state lives in the page only.

/** The state of the comment boxes of the page. */
let commentState: CommentBoxState = emptyCommentBox()

/**
 * D1: the focus that the next repaint sets. A repaint removes the old
 * element, so the focus moves only after the new element exists.
 */
let focusNext: { action: FocusAction; key: string } | null = null

/**
 * D1: the focus that the next repaint sets for a toggle button. A repaint
 * removes the old button, so the focus moves only after the new one exists.
 */
let focusToggleNext: { action: ToggleAction; repo: string; column?: string } | null = null

/** The answer of the service. The service names the code of a failure. */
type ServiceAnswer = { ok: boolean; code?: string; message?: string }

/** Reads the answer of the service. A body that is no JSON gives no answer. */
const parseAnswer = (text: string): ServiceAnswer => {
  try {
    const value = JSON.parse(text) as { ok?: unknown; code?: unknown; message?: unknown }
    const answer: ServiceAnswer = { ok: value.ok === true }
    if (typeof value.code === 'string') answer.code = value.code
    if (typeof value.message === 'string') answer.message = value.message
    return answer
  } catch {
    return { ok: false }
  }
}

/**
 * D1: the panel asks the local service to send the message. The service
 * calls `sessions.send` with the constant session id.
 */
const sendHost: SendHost = {
  serviceRequest: async (service, method, params) => {
    if (service !== SEND_SERVICE) {
      throw Object.assign(new Error(`The service ${service} is not known.`), {
        code: 'NO_SERVICE',
      })
    }
    const result = await host.serviceRequest({
      method: 'POST',
      path: `/${method}`,
      body: JSON.stringify(params),
    })
    const answer = parseAnswer(result.body)
    if (result.status >= 400 || answer.ok !== true) {
      throw Object.assign(
        new Error(answer.message ?? `The service answered HTTP ${result.status}.`),
        { code: answer.code ?? 'SERVICE_FAILED' },
      )
    }
    return answer
  },
}

/** D1: the sender of the comment. One send runs at a time. */
const sender = createCommentSender(sendHost)

/** D1: the comment state of every card of the board. */
const commentsOf = (): Record<string, CommentUi> => {
  const out: Record<string, CommentUi> = {}
  for (const state of states) {
    if (state.status !== 'ready') continue
    state.board.cards.forEach((card, index) => {
      if (card.column !== 'blocked' && card.column !== 'waiting') return
      const key = cardKey(card, index)
      const status = commentState.status[key]
      const text = commentState.texts[key] ?? ''
      out[key] = {
        status: status?.status ?? 'idle',
        sentAt: status?.sentAt ?? null,
        error: status?.error ?? null,
        open: commentState.openKey === key,
        disabled: isSendDisabled(text, sender.sending),
      }
    })
  }
  return out
}

/** D1: the card of a comment key. */
const cardOf = (key: string): Card | null => {
  for (const state of states) {
    if (state.status !== 'ready') continue
    const cards = state.board.cards
    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index]
      if (card === undefined) continue
      if (cardKey(card, index) === key) return card
    }
  }
  return null
}

/** D1: the Send button is off with no visible character, over 2000 characters, or while a send runs. */
const setSendState = (area: HTMLTextAreaElement, text: string): void => {
  const button = area.parentElement?.querySelector<HTMLButtonElement>('button.comment-send')
  if (button === null || button === undefined) return
  if (isSendDisabled(text, sender.sending)) button.setAttribute('disabled', 'disabled')
  else button.removeAttribute('disabled')
}

/** D1: the text of the box follows the user. */
const onCommentInput = (event: Event): void => {
  const area = event.currentTarget
  if (!(area instanceof HTMLTextAreaElement)) return
  const key = area.getAttribute('data-key')
  if (key === null) return
  commentState = setCommentText(commentState, key, area.value)
  setSendState(area, area.value)
}

/** D1: one click sends one message. The box closes when the send ends. */
const sendComment = async (key: string): Promise<void> => {
  const card = cardOf(key)
  if (card === null) return
  const pending = sender.send({
    repo: card.repo,
    trackId: card.trackId,
    taskLine: card.taskText ?? card.note ?? '',
    blockerLine: card.reason ?? '',
    text: commentState.texts[key] ?? '',
  })
  commentState = startCommentSend(commentState, key)
  painter.user()
  const result = await pending
  const ownBoxOpen = commentState.openKey === key
  commentState = finishCommentSend(
    commentState,
    key,
    result.ok ? { ok: true, sentAt: result.sentAt } : { ok: false, error: result.line },
  )
  if (ownBoxOpen) focusNext = { action: 'send-done', key }
  painter.user()
  painter.flush()
}

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

/** FR-15: the rail badge shows the Waits for Daniel cards of all loaded repos. */
const refreshBadge = async (): Promise<void> => {
  const boards = states.flatMap(state =>
    state.status === 'ready' ? [state.board] : [],
  )
  const count = blockedTracks(boards)
  await host.setBadge(count > 0 ? count : null)
}

/** D1: moves the focus to the element that `focusAfter` names. */
const focusOn = (action: FocusAction, key: string): void => {
  const element = root.querySelector<HTMLElement>(focusAfter(action, key).selector)
  if (element === null) return
  element.focus()
}

/** D1: moves the focus to the toggle button that `focusAfterToggle` names. */
const focusToggleOn = (
  action: ToggleAction,
  repo: string,
  column?: string,
): void => {
  const element = root.querySelector<HTMLElement>(
    focusAfterToggle(action, repo, column).selector,
  )
  if (element === null) return
  element.focus()
}

/** Draws the board of the panel and the page. */
const paint = (): void => {
  if (surface === 'status') {
    paintStatus()
    return
  }
  const snapshot = captureComment(root)
  // Every text from a file passes through `escapeHtml` before it reaches this
  // string, so the assignment cannot add an element of the file text.
  root.innerHTML = renderPage({
    states,
    ui: uiOf(),
    now: Date.now(),
    busy,
    comments: commentsOf(),
  })
  bind()
  restoreComment(root, snapshot, commentState.texts)
  const next = focusNext
  focusNext = null
  if (next !== null) focusOn(next.action, next.key)
  const nextToggle = focusToggleNext
  focusToggleNext = null
  if (nextToggle !== null) focusToggleOn(nextToggle.action, nextToggle.repo, nextToggle.column)
}

/** FR-1 and FR-2: data paints wait; user paints draw at once. */
const painter = createPainter({
  paintNow: paint,
  hold: () => holdComment(root, commentState.texts, surface),
})

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
  states = startLoad(states)
  painter.data()
  await loadRoster(host, ROSTER, (state) => {
    states = applyRepoResult(states, state.repo.id, state)
    painter.data()
    void refreshBadge()
  })
  busy = false
  painter.data()
  await refreshBadge()
}

/** Reads the Measure files of the open project for the band. */
const loadBand = async (directory: string | null): Promise<void> => {
  current = await loadSnapshot(host, directory)
  painter.data()
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
  for (const area of root.querySelectorAll<HTMLTextAreaElement>('textarea.comment-input')) {
    area.addEventListener('input', onCommentInput)
    area.addEventListener('blur', () => painter.flush())
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
  if (action === 'open-comment') {
    const key = button.getAttribute('data-key')
    if (key === null) return
    commentState = openCommentBox(commentState, key)
    focusNext = commentState.openKey === key
      ? { action: 'open', key }
      : { action: 'escape', key }
    painter.user()
    return
  }
  if (action === 'send-comment') {
    const key = button.getAttribute('data-key')
    if (key === null) return
    void sendComment(key)
    return
  }
  if (repo === null) return
  if (action === 'toggle-section') {
    userOpen[repo] = !openOf(repo)
    focusToggleNext = { action: 'toggle-section', repo }
    painter.user()
    return
  }
  if (action === 'toggle-done') {
    userDoneOpen[repo] = !(userDoneOpen[repo] ?? false)
    focusToggleNext = { action: 'toggle-done', repo }
    painter.user()
    return
  }
  if (action === 'toggle-done-group') {
    userDoneGroupOpen[repo] = !(userDoneGroupOpen[repo] ?? false)
    focusToggleNext = { action: 'toggle-done-group', repo }
    painter.user()
    return
  }
  if (column === null) return
  const key = `${repo}/${column}`
  if (action === 'show-more') {
    userExpanded[key] = true
    painter.user()
    return
  }
  if (action === 'toggle-stale') {
    const staleOpen = (uiOf().staleOpen ?? {})[key] ?? false
    userStaleOpen[key] = !staleOpen
    focusToggleNext = { action: 'toggle-stale', repo, column }
    painter.user()
  }
}

// ----- The mount hook. The surface decides what the frame shows.

let mountedOnce = false

/** True when the directory listener of the band is registered. */
let directoryBound = false

host.onReady((ctx) => {
  applyHostReady(ctx, document.documentElement)
  surface = ctx.surface
  if (!mountedOnce) {
    mountedOnce = true
    if (surface === 'status') {
      void loadBand(ctx.directory)
    } else {
      startTimer()
      void loadBoard()
    }
  }
  // The band follows the open project. Only the status surface reads it.
  if (surface === 'status') {
    if (!directoryBound) {
      directoryBound = true
      host.onDirectory((directory) => {
        void loadBand(directory)
      })
    }
  }
  painter.data()
})

// D1: the Escape key closes the open comment box.
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || commentState.openKey === null) return
  const key = commentState.openKey
  commentState = escapeCommentBox(commentState)
  focusNext = { action: 'escape', key }
  painter.user()
  painter.flush()
})
