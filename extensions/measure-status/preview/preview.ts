// FR-12, FR-13: the preview page renders the real board code from the
// invented fixtures. It has no host and reads no file. The build command
// bundles this file into `preview/preview.js`.
import fixtureJson from '../mockup/fixtures.json'
import type { Card, RepoBoard } from '../src/board'
import {
  emptyCommentBox,
  escapeCommentBox,
  finishCommentSend,
  focusAfter,
  openCommentBox,
  setCommentText,
  startCommentSend,
  type CommentBoxState,
  type CommentOutcome,
  type FocusAction,
} from '../src/comment-box'
import type { RosterRepo } from '../src/roster'
import { cardKey, renderPage, sectionOpen, type CommentUi, type UiState } from '../src/render'
import { isSendDisabled } from '../src/send'
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

// ----- FR-16, D1: the comment of a card. The preview has no host.

/** The state of the comment boxes of the page. */
let commentState: CommentBoxState = emptyCommentBox()

/** True while a send runs. */
let sending = false

/**
 * D1: the focus that the next repaint sets. A repaint removes the old
 * element, so the focus moves only after the new element exists.
 */
let focusNext: { action: FocusAction; key: string } | null = null

/**
 * D1: the local fake sender of the preview. The preview has no host and no
 * service. The send resolves with the send time. The card then shows the
 * local sent HH:MM line of the shared renderer.
 */
const fakeSend = async (text: string): Promise<CommentOutcome> => {
  if (text.trim() === '') return { ok: false, error: 'Write a comment first.' }
  await new Promise<void>(resolve => {
    window.setTimeout(resolve, 0)
  })
  return { ok: true, sentAt: Date.now() }
}

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
        disabled: isSendDisabled(text, sending),
      }
    })
  }
  return out
}

/** D1: the Send button is off while the text is empty or a send runs. */
const setSendState = (area: HTMLTextAreaElement, text: string): void => {
  const button = area.parentElement?.querySelector<HTMLButtonElement>('button.comment-send')
  if (button === null || button === undefined) return
  if (isSendDisabled(text, sending)) button.setAttribute('disabled', 'disabled')
  else button.removeAttribute('disabled')
}

/** D1: the open box keeps its text after a repaint. */
const restoreComment = (): void => {
  const area = root.querySelector<HTMLTextAreaElement>('textarea.comment-input')
  if (area === null) return
  const key = area.getAttribute('data-key')
  const text = key === null ? '' : (commentState.texts[key] ?? '')
  area.value = text
  setSendState(area, text)
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

/** D1: one click sends one comment. The box closes when the send ends. */
const sendComment = async (key: string): Promise<void> => {
  const pending = fakeSend(commentState.texts[key] ?? '')
  commentState = startCommentSend(commentState, key)
  sending = true
  paint()
  const outcome = await pending
  sending = false
  commentState = finishCommentSend(commentState, key, outcome)
  focusNext = { action: 'send-done', key }
  paint()
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

/** D1: moves the focus to the element that `focusAfter` names. */
const focusOn = (action: FocusAction, key: string): void => {
  const element = root.querySelector<HTMLElement>(focusAfter(action, key).selector)
  if (element === null) return
  element.focus()
}

/** Draws the board. */
const paint = (): void => {
  // Every text from a file passes through `escapeHtml` before it reaches this
  // string, so the assignment cannot add an element of the file text.
  root.innerHTML = renderPage({ states, ui: uiOf(), now, busy: false, comments: commentsOf() })
  bind()
  restoreComment()
  const next = focusNext
  focusNext = null
  if (next !== null) focusOn(next.action, next.key)
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
  if (action === 'open-comment') {
    const key = button.getAttribute('data-key')
    if (key === null) return
    commentState = openCommentBox(commentState, key)
    focusNext = commentState.openKey === key
      ? { action: 'open', key }
      : { action: 'escape', key }
    paint()
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

// D1: the Escape key closes the open comment box.
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || commentState.openKey === null) return
  const key = commentState.openKey
  commentState = escapeCommentBox(commentState)
  focusNext = { action: 'escape', key }
  paint()
})

paint()

if (query.get('debug') === '1' && debug !== null) {
  debug.textContent = `scrollWidth=${document.documentElement.scrollWidth} innerWidth=${window.innerWidth}`
}
