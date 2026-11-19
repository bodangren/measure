// FR-16, D1: the rules of the comment box. One closed card shows one
// `Comment` button. One box opens at a time. The Escape key and a finished
// Send close the box. The `sent HH:MM` or error line stays visible while the
// box is closed. Every fixture here is invented text.
import { describe, expect, test } from 'vitest'
import { classifyTrack, type Card } from './board'
import {
  emptyCommentBox,
  escapeCommentBox,
  finishCommentSend,
  openCommentBox,
} from './comment-box'
import { idleComment, renderCard } from './render'
import { formatSentLine } from './send'

const NOW = 1_800_000_000_000

const blockedCard = (): Card =>
  classifyTrack({
    repo: 'invented-repo',
    title: 'Invented track',
    registryMarker: 'b',
    folder: 'tracks/invented_1',
    plan: { kind: 'missing' },
    lastChange: NOW,
    doneDate: null,
    doneSource: null,
    now: NOW,
  })

const opens = (html: string): number =>
  (html.match(/data-action="open-comment"/g) ?? []).length

describe('one box at a time', () => {
  test('a closed card shows one Comment button and no box', () => {
    const html = renderCard(blockedCard(), NOW, idleComment(), 'invented-repo/invented_1')
    expect(opens(html)).toBe(1)
    expect(html).not.toContain('<textarea')
  })

  test('opening one box closes the other', () => {
    let state = emptyCommentBox()
    state = openCommentBox(state, 'invented-repo/first')
    expect(state.openKey).toBe('invented-repo/first')
    state = openCommentBox(state, 'invented-repo/second')
    expect(state.openKey).toBe('invented-repo/second')
  })

  test('opening the open box closes it', () => {
    let state = emptyCommentBox()
    state = openCommentBox(state, 'invented-repo/first')
    state = openCommentBox(state, 'invented-repo/first')
    expect(state.openKey).toBeNull()
  })

  test('the Escape key closes the box and keeps the text', () => {
    let state = emptyCommentBox()
    state = openCommentBox(state, 'invented-repo/first')
    state = { ...state, texts: { ...state.texts, 'invented-repo/first': 'Please look' } }
    state = escapeCommentBox(state)
    expect(state.openKey).toBeNull()
    expect(state.texts['invented-repo/first']).toBe('Please look')
  })
})

describe('a finished Send', () => {
  test('a finished Send closes the box and keeps the sent line', () => {
    let state = emptyCommentBox()
    state = openCommentBox(state, 'invented-repo/first')
    state = finishCommentSend(state, 'invented-repo/first', { ok: true, sentAt: NOW })
    expect(state.openKey).toBeNull()
    expect(state.status['invented-repo/first']?.status).toBe('sent')
    const html = renderCard(blockedCard(), NOW, {
      status: 'sent',
      sentAt: NOW,
      error: null,
      open: false,
      disabled: false,
    }, 'invented-repo/first')
    expect(html).toContain(formatSentLine(NOW))
    expect(html).not.toContain('<textarea')
  })

  test('the error line stays visible while the box is closed', () => {
    let state = emptyCommentBox()
    state = openCommentBox(state, 'invented-repo/first')
    state = finishCommentSend(state, 'invented-repo/first', {
      ok: false,
      error: 'NOT_GRANTED: Access denied',
    })
    expect(state.openKey).toBeNull()
    expect(state.status['invented-repo/first']?.status).toBe('error')
    const html = renderCard(blockedCard(), NOW, {
      status: 'error',
      sentAt: null,
      error: 'NOT_GRANTED: Access denied',
      open: false,
      disabled: false,
    }, 'invented-repo/first')
    expect(html).toContain('NOT_GRANTED')
    expect(html).not.toContain('<textarea')
  })
})
