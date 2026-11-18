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
    ...field('Blocker', input.blockerLine),
    ...field('Daniel', input.text),
  ].join('\n')

/** D1: an empty text or a text of only white space gives no send. */
export const canSendComment = (text: string): boolean =>
  text.trim() !== '' && text.length <= COMMENT_TEXT_MAX
