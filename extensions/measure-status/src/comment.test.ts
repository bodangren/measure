// FR-16, D1: the text of the comment message and the send rule.
import { describe, expect, test } from 'vitest'
import { COMMENT_TEXT_MAX, canSendComment, formatComment, type CommentInput } from './comment'

const input = (over: Partial<CommentInput> = {}): CommentInput => ({
  repo: 'invented-repo',
  trackId: 'invented_track_1',
  taskLine: '[~] Task: Write the loader',
  blockerLine: 'Task: Wait for the copy',
  text: 'Please look at column two',
  ...over,
})

describe('formatComment', () => {
  test('gives the layout of FR-16, D1', () => {
    expect(formatComment(input())).toBe(
      [
        'Measure board comment',
        'Repo: invented-repo',
        'Track: invented_track_1',
        'Task: [~] Task: Write the loader',
        'Reason: Task: Wait for the copy',
        'Daniel: Please look at column two',
      ].join('\n'),
    )
  })

  test('leaves out a line with no value', () => {
    const out = formatComment(input({ repo: '', blockerLine: '', text: '' }))
    expect(out).toBe(
      ['Measure board comment', 'Track: invented_track_1', 'Task: [~] Task: Write the loader'].join('\n'),
    )
  })

  test('keeps a card value as plain text', () => {
    const out = formatComment(
      input({
        trackId: '"><script>',
        taskLine: '<img src=x onerror=alert(1)>',
        blockerLine: 'javascript:alert(1)',
      }),
    )
    expect(out).toContain('Track: "><script>')
    expect(out).toContain('Task: <img src=x onerror=alert(1)>')
    expect(out).toContain('Reason: javascript:alert(1)')
    expect(out).not.toContain('&lt;')
    expect(out).not.toContain('&gt;')
  })

  test('keeps a text of 2000 characters whole', () => {
    const text = 'x'.repeat(2000)
    const out = formatComment(input({ text }))
    expect(out.endsWith(`Daniel: ${text}`)).toBe(true)
  })
})

describe('canSendComment', () => {
  test('refuses an empty text and a text of only white space', () => {
    expect(canSendComment('')).toBe(false)
    expect(canSendComment('   ')).toBe(false)
    expect(canSendComment(' \n\t ')).toBe(false)
  })

  test('accepts a text with a value', () => {
    expect(canSendComment('x')).toBe(true)
    expect(canSendComment('  x  ')).toBe(true)
  })

  test('accepts 2000 characters and refuses 2001', () => {
    expect(canSendComment('x'.repeat(COMMENT_TEXT_MAX))).toBe(true)
    expect(canSendComment('x'.repeat(COMMENT_TEXT_MAX + 1))).toBe(false)
  })

  test('holds the limit of 2000 characters', () => {
    expect(COMMENT_TEXT_MAX).toBe(2000)
  })
})
