// FR-1 to FR-5: the paint gate of the board and the comment snapshot. A data
// paint waits while the open box holds the focus or any character. A user
// paint runs at once. The module holds no host call and reads no file.
/** The paint gate of a surface. */
export type Painter = {
  /** Draws at once when nothing holds it; else sets the pending flag. */
  data: () => void
  /** Clears the pending flag and draws the latest state at once. */
  user: () => void
  /** Draws a pending paint once the hold is gone. */
  flush: () => void
  /** True while a data paint waits. */
  pending: () => boolean
}

/** The two rules that a painter needs from its caller. */
export type PainterOptions = {
  /** Draws the latest state. */
  paintNow: () => void
  /** True while a data paint must wait. */
  hold: () => boolean
}

/** FR-1: gates data paints on the hold rule. User paints never wait. */
export const createPainter = ({ paintNow, hold }: PainterOptions): Painter => {
  let waiting = false
  return {
    data: () => {
      if (hold()) {
        waiting = true
        return
      }
      waiting = false
      paintNow()
    },
    user: () => {
      waiting = false
      paintNow()
    },
    flush: () => {
      if (!waiting || hold()) return
      waiting = false
      paintNow()
    },
    pending: () => waiting,
  }
}

/** FR-1: the focus and the caret of the open comment box. */
export type CommentSnapshot = {
  key: string | null
  focused: boolean
  selectionStart: number
  selectionEnd: number
}

/** FR-1: records the key, the focus, and the selection of the open box. */
export const captureComment = (root: ParentNode): CommentSnapshot => {
  const area = root.querySelector<HTMLTextAreaElement>('textarea.comment-input')
  if (area === null) {
    return { key: null, focused: false, selectionStart: 0, selectionEnd: 0 }
  }
  return {
    key: area.getAttribute('data-key'),
    focused: area.ownerDocument.activeElement === area,
    selectionStart: area.selectionStart,
    selectionEnd: area.selectionEnd,
  }
}

/**
 * FR-5 and FR-6: puts the text of the open box back. The box gets its focus
 * back with preventScroll and its selection only when it had focus before.
 */
export const restoreComment = (
  root: ParentNode,
  snapshot: CommentSnapshot,
  texts: Readonly<Record<string, string>>,
): void => {
  const area = root.querySelector<HTMLTextAreaElement>('textarea.comment-input')
  if (area === null) return
  const key = area.getAttribute('data-key')
  area.value = key === null ? '' : (texts[key] ?? '')
  if (!snapshot.focused || snapshot.key !== key) return
  area.focus({ preventScroll: true })
  area.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd)
}
