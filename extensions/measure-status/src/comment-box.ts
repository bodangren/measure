// FR-16, D1: the rules of the comment box. One box opens at a time. The
// Escape key and a finished Send close the box. The sent line or the error
// line stays visible while the box is closed. The module holds no host call
// and no DOM access.

/** The state of the last send of one card. */
export type CommentStatus = {
  status: 'idle' | 'sending' | 'sent' | 'error'
  sentAt: number | null
  error: string | null
}

/** The state of the comment boxes of the page. */
export type CommentBoxState = {
  /** The key of the card whose box is open. One box opens at a time. */
  openKey: string | null
  /** The text of the comment of each card. */
  texts: Readonly<Record<string, string>>
  /** The state of the last send of each card. */
  status: Readonly<Record<string, CommentStatus>>
}

/** The outcome of one send. A failure names the error line. */
export type CommentOutcome =
  | { ok: true; sentAt: number }
  | { ok: false; error: string }

/** The state of a page with no comment box. */
export const emptyCommentBox = (): CommentBoxState => ({
  openKey: null,
  texts: {},
  status: {},
})

/** D1: opens the box of one card. The open box closes when it opens again. */
export const openCommentBox = (
  state: CommentBoxState,
  key: string,
): CommentBoxState => ({
  ...state,
  openKey: state.openKey === key ? null : key,
})

/** D1: the Escape key closes the open box and keeps its text. */
export const escapeCommentBox = (state: CommentBoxState): CommentBoxState => ({
  ...state,
  openKey: null,
})

/** D1: the action after which the focus moves. */
export type FocusAction = 'open' | 'escape' | 'send-done'

/** D1: the element that takes the focus after a repaint. */
export type FocusTarget = { selector: string }

/**
 * D1: the focus rule of the comment box. A repaint removes the old element,
 * so the page asks for the selector of the new one. Open gives the text area
 * of the card. Escape and a finished Send give the Comment button of the card.
 * The key sits in a quoted attribute value. Only the quote and the backslash
 * need an escape there.
 */
export const focusAfter = (action: FocusAction, key: string): FocusTarget => {
  const escaped = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const card = `[data-key="${escaped}"]`
  if (action === 'open') return { selector: `textarea.comment-input${card}` }
  return { selector: `button[data-action="open-comment"]${card}` }
}

/** D1: keeps the text of one card. */
export const setCommentText = (
  state: CommentBoxState,
  key: string,
  text: string,
): CommentBoxState => ({
  ...state,
  texts: { ...state.texts, [key]: text },
})

/** D1: the send of one card runs. */
export const startCommentSend = (
  state: CommentBoxState,
  key: string,
): CommentBoxState => ({
  ...state,
  status: {
    ...state.status,
    [key]: { status: 'sending', sentAt: null, error: null },
  },
})

/** D1: a finished Send closes the box and keeps the sent line or the error line. */
export const finishCommentSend = (
  state: CommentBoxState,
  key: string,
  outcome: CommentOutcome,
): CommentBoxState => ({
  ...state,
  openKey: null,
  status: {
    ...state.status,
    [key]: outcome.ok
      ? { status: 'sent', sentAt: outcome.sentAt, error: null }
      : { status: 'error', sentAt: null, error: outcome.error },
  },
})
