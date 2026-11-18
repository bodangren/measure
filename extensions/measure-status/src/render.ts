// FR-5, FR-7, FR-8, FR-12: the board renderer. Pure functions that return
// escaped HTML for the board. The module has no host call and no DOM access.
import { formatAge } from './age'
import {
  COLUMNS,
  COLUMN_LABELS,
  blockedTracks,
  cardLabel,
  columnView,
  doneSummary,
  type Card,
  type Column,
  type RepoBoard,
} from './board'
import type { RepoState } from './load'

/**
 * The open state of the page. The user's choice wins over the default of
 * FR-7. The last two fields are optional, so a caller can hold a state with
 * only the three fields of FR-13.
 */
export type UiState = {
  /** Repo id: the section is open or closed. */
  open: Readonly<Record<string, boolean>>
  /** Repo id: the Done column is open. */
  doneOpen: Readonly<Record<string, boolean>>
  /** `<repo id>/<column>`: the column shows every card. */
  expanded: Readonly<Record<string, boolean>>
  /** `<repo id>/<column>`: the stale group is open. */
  staleOpen?: Readonly<Record<string, boolean>>
  /** Repo id: the closed Done group is open. */
  doneGroupOpen?: Readonly<Record<string, boolean>>
}

/** The comment state of one card. The send path of FR-16 sets it. */
export type CommentUi = {
  status: 'idle' | 'sending' | 'sent' | 'error'
  sentAt: number | null
  error: string | null
}

/** The whole page: the states of the repos, the open state, and the time. */
export type PageView = {
  states: readonly RepoState[]
  ui: UiState
  now: number
  busy: boolean
}

/** FR-10: the banner that a repo needs the file grant of the host. */
export const GRANT_BANNER =
  'Allow file access outside the project in Settings → Extensions.'

const ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** FR-12: every text from a file passes through this function. */
export const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, char => ESCAPES[char] ?? char)

/** FR-6: the tooltip of the age label. */
const AGE_TIP =
  'Time of the last change to plan.md or metadata.json (file time, not a commit time).'

/** The `HH:MM` time of a comment, in UTC. */
const clockOf = (time: number): string => {
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return '--:--'
  return date.toISOString().slice(11, 16)
}

/** The chevron of a toggle button. */
const CHEV = '<span class="chev" aria-hidden="true">▸</span>'

/** FR-7: a section opens when the user opens it, else when it needs attention. */
export const sectionOpen = (state: RepoState, ui: UiState): boolean => {
  const choice = ui.open[state.repo.id]
  if (choice !== undefined) return choice
  if (state.status !== 'ready') return false
  return state.board.cards.some(
    card => card.column === 'blocked' || card.column === 'waiting',
  )
}

/** FR-5: one card of a column. */
export const renderCard = (card: Card, now: number, comment?: CommentUi): string => {
  const parts: string[] = []
  const title = escapeHtml(card.title)
  parts.push(`<div class="card-title" title="${title}">${title}</div>`)

  if (card.column !== 'done') {
    if (card.position !== null) {
      const position = card.position
      parts.push(
        `<div class="card-pos">Phase ${position.phase}/${position.phases} · Task ${position.task}/${position.tasks}</div>`,
      )
      const task = escapeHtml(card.taskText ?? '')
      parts.push(
        `<div class="card-task" title="${task}"><span class="marker">[${card.marker ?? ' '}]</span> ${task}</div>`,
      )
    } else if (card.note !== null) {
      parts.push(`<div class="card-note">${escapeHtml(card.note)}</div>`)
    }
    if (card.line !== null) {
      const label = cardLabel(card) ?? ''
      parts.push(
        `<div class="card-line"><span class="line-label">${label}</span>${escapeHtml(card.line)}</div>`,
      )
    }
  }

  if (!card.registered) parts.push('<div class="card-flag">Not in the registry</div>')
  if (card.column === 'done' && card.archived === false) {
    parts.push('<div class="card-warn">Not archived</div>')
  }

  if (card.column === 'done') {
    const foot =
      card.doneDate === null
        ? 'No date'
        : `${card.doneSource === 'folder' ? 'From' : 'Done'} ${card.doneDate}`
    parts.push(`<div class="card-foot">${foot}</div>`)
  } else {
    const age =
      card.lastChange === null ? 'Updated unknown' : `Updated ${formatAge(now, card.lastChange)}`
    parts.push(`<div class="card-foot" title="${AGE_TIP}">${age}</div>`)
  }

  if (comment !== undefined) {
    if (comment.status === 'sent' && comment.sentAt !== null) {
      parts.push(
        `<div class="comment-state" data-tone="sent">sent ${clockOf(comment.sentAt)}</div>`,
      )
    } else if (comment.status === 'error' && comment.error !== null) {
      parts.push(
        `<div class="comment-state" data-tone="error">${escapeHtml(comment.error)}</div>`,
      )
    }
  }

  const tone = card.column === 'blocked' || card.column === 'waiting' ? card.column : 'none'
  return `<li class="card" data-card data-tone="${tone}">${parts.join('')}</li>`
}

/** FR-7 and FR-16: the counts and the badges of the section header. */
const chipsOf = (board: RepoBoard): string => {
  const counts: Record<string, number> = {}
  for (const column of COLUMNS) counts[column] = 0
  for (const card of board.cards) {
    counts[card.column] = (counts[card.column] ?? 0) + 1
  }
  const notArchived = board.cards.filter(
    card => card.column === 'done' && card.archived === false,
  ).length
  const parts: string[] = []
  for (const column of COLUMNS) {
    const count = counts[column] ?? 0
    const label = COLUMN_LABELS[column]
    if ((column === 'blocked' || column === 'waiting') && count > 0) {
      parts.push(`<span class="badge" data-tone="${column}">${count} ${label}</span>`)
    } else {
      parts.push(
        `<span class="count" data-zero="${count === 0}"><b>${count}</b> ${label}</span>`,
      )
    }
    if (column === 'blocked' && notArchived > 0) {
      parts.push(
        `<span class="badge" data-tone="not-archived">${notArchived} Not archived</span>`,
      )
    }
  }
  return parts.join('')
}

/** FR-7: the header button of one section. */
const headerOf = (repoId: string, open: boolean, chips: string): string =>
  `<h2 class="repo-head"><button type="button" class="repo-toggle" data-action="toggle-section" data-repo="${escapeHtml(repoId)}" aria-expanded="${open}"><span class="repo-id">${CHEV}<span class="repo-name">${escapeHtml(repoId)}</span></span><span class="counts">${chips}</span></button></h2>`

/** FR-8: one column of the board. */
const columnOf = (
  board: RepoBoard,
  repoId: string,
  column: Column,
  ui: UiState,
  now: number,
): string => {
  const key = `${repoId}/${column}`
  const expanded = ui.expanded[key] === true
  const staleOpen = (ui.staleOpen ?? {})[key] === true
  const view = columnView(board, column, expanded, staleOpen, now)
  const parts: string[] = []

  if (column === 'done') {
    const summary = doneSummary(board, now)
    const open = ui.doneOpen[repoId] === true
    parts.push(
      `<button type="button" class="col-toggle" data-action="toggle-done" data-repo="${escapeHtml(repoId)}" aria-expanded="${open}"><span class="col-name">${CHEV}${view.label}</span><span class="col-count">${view.total}</span></button>`,
    )
    if (open) {
      if (view.total === 0) {
        parts.push('<p class="empty">None</p>')
      } else if (summary.shown.length === 0) {
        parts.push('<p class="empty">No track closed in the last 14 days</p>')
      } else {
        const groupOpen = (ui.doneGroupOpen ?? {})[repoId] === true
        parts.push(
          `<button type="button" class="col-toggle" data-action="toggle-done-group" data-repo="${escapeHtml(repoId)}" aria-expanded="${groupOpen}"><span class="col-name">${CHEV}Closed in the last 14 days</span><span class="col-count">${summary.shown.length}</span></button>`,
        )
        if (groupOpen) {
          const cards = summary.shown.map(card => renderCard(card, now)).join('')
          parts.push(`<ul class="cards">${cards}</ul>`)
        }
      }
      parts.push(
        `<p class="col-note">${summary.more} more done, ${summary.archived} archived</p>`,
      )
    }
    return `<div class="column" data-column="${column}">${parts.join('')}</div>`
  }

  parts.push(
    `<div class="col-head"><span class="col-name">${view.label}</span><span class="col-count">${view.total}</span></div>`,
  )
  if (view.total === 0) {
    parts.push('<p class="empty">None</p>')
  } else if (view.shown.length > 0) {
    const cards = view.shown.map(card => renderCard(card, now)).join('')
    parts.push(`<ul class="cards">${cards}</ul>`)
  }
  if (view.hidden > 0) {
    parts.push(
      `<button type="button" class="more" data-action="show-more" data-repo="${escapeHtml(repoId)}" data-column="${column}">Show ${view.hidden} more</button>`,
    )
  }
  if (view.stale.length > 0) {
    parts.push(
      `<button type="button" class="more stale-toggle" data-action="toggle-stale" data-repo="${escapeHtml(repoId)}" data-column="${column}" aria-expanded="${staleOpen}" title="No change to plan.md or metadata.json in 30 days">${CHEV} Stale (${view.stale.length})</button>`,
    )
    if (staleOpen) {
      const cards = view.stale.map(card => renderCard(card, now)).join('')
      parts.push(`<ul class="cards stale-cards">${cards}</ul>`)
    }
  }
  return `<div class="column" data-column="${column}">${parts.join('')}</div>`
}

/** FR-7: one section of the accordion, with its header and its board. */
export const renderSection = (state: RepoState, ui: UiState, now: number): string => {
  const repoId = state.repo.id

  if (state.status === 'loading') {
    const chips = '<span class="count" data-zero="true"><b>0</b> Loading</span>'
    return `<section class="repo" data-repo="${escapeHtml(repoId)}">${headerOf(repoId, false, chips)}</section>`
  }

  if (state.status === 'error') {
    const line = `<p class="empty">${escapeHtml(state.line)}</p>`
    return `<section class="repo" data-repo="${escapeHtml(repoId)}">${headerOf(repoId, false, '')}${line}</section>`
  }

  const open = sectionOpen(state, ui)
  const columns = COLUMNS.map(column => columnOf(state.board, repoId, column, ui, now)).join('')
  const board = `<div class="board"${open ? '' : ' hidden'}>${columns}</div>`
  return `<section class="repo" data-repo="${escapeHtml(repoId)}">${headerOf(repoId, open, chipsOf(state.board))}${board}</section>`
}

/** FR-9: the Blocked tracks of the loaded repos. */
const blockedOf = (view: PageView): number =>
  blockedTracks(view.states.flatMap(state => (state.status === 'ready' ? [state.board] : [])))

/** The Waiting on Daniel tracks of the loaded repos. */
const waitingOf = (view: PageView): number =>
  view.states.flatMap(state => (state.status === 'ready' ? [state.board] : [])).reduce(
    (sum, board) => sum + board.cards.filter(card => card.column === 'waiting').length,
    0,
  )

/** FR-7 and FR-10: the whole page, with the header, the banner, and the sections. */
export const renderPage = (view: PageView): string => {
  const blocked = blockedOf(view)
  const waiting = waitingOf(view)
  const summary: string[] = []
  if (blocked > 0) {
    summary.push(`<span class="badge" data-tone="blocked">${blocked} Blocked</span>`)
  }
  if (waiting > 0) {
    summary.push(
      `<span class="badge" data-tone="waiting">${waiting} Waiting on Daniel</span>`,
    )
  }

  const needsGrant = view.states.some(
    state => state.status === 'error' && state.code === 'NOT_GRANTED',
  )
  const banner = needsGrant
    ? `<div class="grant-banner" role="status">${escapeHtml(GRANT_BANNER)}</div>`
    : ''

  const label = view.busy ? 'Refreshing' : 'Refresh'
  const busy = view.busy ? ' disabled="disabled"' : ''
  const head =
    `<header class="page-head"><h1 class="page-title">Measure board</h1>` +
    `<div class="page-summary">${summary.join('')}</div>` +
    `<button type="button" class="btn" data-action="refresh"${busy}>${label}</button></header>`

  const sections = view.states.map(state => renderSection(state, view.ui, view.now)).join('')

  return `<div class="mb"><div class="page">${banner}${head}<main>${sections}</main></div></div>`
}
