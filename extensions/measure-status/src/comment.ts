// FR-16, D1: the text of the comment message and the send rule. Pure
// functions; every value stays plain text.
export type CommentInput = {
  repo: string
  trackId: string
  taskLine: string
  blockerLine: string
  text: string
}

/** D1: a longer text is refused with an error text. */
export const COMMENT_TEXT_MAX = 2000

const field = (label: string, value: string): string[] =>
  value === '' ? [] : [`${label}: ${value}`]

/**
 * D1: the message layout. The first line is the header. A line with no value
 * stays out. No value becomes markup.
 */
export const formatComment = (input: CommentInput): string =>
  [
    'Measure board comment',
    ...field('Repo', input.repo),
    ...field('Track', input.trackId),
    ...field('Task', input.taskLine),
    ...field('Reason', input.blockerLine),
    ...field('Daniel', input.text),
  ].join('\n')

/**
 * D1: the characters that no user can see. A control character gives no
 * visible character. A zero-width mark, a bidi mark, and white space give no
 * visible character.
 */
const INVISIBLE = /[\p{Cc}\p{Cf}\s]/u

/** D1: true when the text holds at least one character that the user sees. */
export const hasVisibleCharacter = (text: string): boolean => {
  for (const char of text) {
    if (!INVISIBLE.test(char)) return true
  }
  return false
}

/**
 * D1: a text with no visible character gives no send. A long text gives no
 * send.
 */
export const canSendComment = (text: string): boolean =>
  hasVisibleCharacter(text) && text.length <= COMMENT_TEXT_MAX
