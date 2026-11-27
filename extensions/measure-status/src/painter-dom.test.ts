// @vitest-environment happy-dom
/// <reference types="vite/client" />
// FR-1 to FR-7 (Task 1.1 Red): DOM rules for held data paints, focus, caret,
// and draft text. Every fixture text here is invented. This suite fails until
// src/painter.ts exists. Green must not change this file.
import { beforeEach, describe, expect, test } from 'vitest'
import { buildBoard, type TrackInput } from './board'
import { captureComment, createPainter, holdComment, restoreComment } from './painter'
import { parsePlan } from './parse'
import { cardKey, renderPage, type UiState } from './render'
import type { RepoState } from './load'

const NOW = 1_800_000_000_000

const ui: UiState = { open: {}, doneOpen: {}, expanded: {} }

const trackInput = (title: string): TrackInput => ({
  repo: 'invented-repo',
  title,
  registryMarker: ' ',
  folder: 'tracks/invented_1',
  plan: { kind: 'plan', plan: parsePlan('## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Pay the bill deferred:spend Task NjBxVXEzVDVVQzJzZ0pKTg\n') },
  lastChange: NOW,
  doneDate: null,
  doneSource: null,
  now: NOW,
})

type ReadyState = Extract<RepoState, { status: 'ready' }>

const readyState = (title: string): ReadyState => ({
  status: 'ready',
  repo: { id: 'invented-repo', path: '~/Desktop/invented-repo' },
  board: buildBoard('invented-repo', [trackInput(title)]),
})

const firstCardKey = (state: ReadyState): string => {
  const card = state.board.cards[0]
  if (card === undefined) throw new Error('The fixture has no card.')
  return cardKey(card, 0)
}

const openComments = (key: string) => ({
  [key]: {
    status: 'idle' as const,
    sentAt: null,
    error: null,
    open: true,
    disabled: false,
  },
})

const findArea = (root: HTMLElement): HTMLTextAreaElement => {
  const area = root.querySelector<HTMLTextAreaElement>('textarea.comment-input')
  if (area === null) throw new Error('The board has no open comment box.')
  return area
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('held data paints keep focus, caret, and draft text', () => {
  test('a data paint changes no DOM node while the open box has focus and text', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const state = readyState('Invented track one')
    const key = firstCardKey(state)
    const texts: Record<string, string> = { [key]: 'draft for the PM' }
    root.innerHTML = renderPage({ states: [state], ui, now: NOW, busy: false, comments: openComments(key) })
    const before = findArea(root)
    restoreComment(root, captureComment(root), texts)
    before.focus()
    before.setSelectionRange(5, 9)
    const snapshot = captureComment(root)
    expect(snapshot.key).toBe(key)

    let paints = 0
    const painter = createPainter({
      paintNow: () => {
        paints += 1
        root.innerHTML = renderPage({
          states: [readyState('Invented track two')],
          ui,
          now: NOW,
          busy: false,
          comments: openComments(key),
        })
      },
      hold: () => true,
    })
    painter.data()
    expect(paints).toBe(0)
    expect(painter.pending()).toBe(true)
    const after = findArea(root)
    expect(after).toBe(before)
    expect(document.activeElement).toBe(before)
    expect(after.value).toBe('draft for the PM')
    expect(after.selectionStart).toBe(5)
    expect(after.selectionEnd).toBe(9)
  })

  test('a host-ready data paint also holds while the box has text', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const state = readyState('Invented track one')
    const key = firstCardKey(state)
    const texts: Record<string, string> = { [key]: 'second draft' }
    root.innerHTML = renderPage({ states: [state], ui, now: NOW, busy: false, comments: openComments(key) })
    const before = findArea(root)
    restoreComment(root, captureComment(root), texts)
    before.focus()
    before.setSelectionRange(1, 3)

    let paints = 0
    const painter = createPainter({
      paintNow: () => {
        paints += 1
        root.innerHTML = renderPage({
          states: [readyState('Invented track two')],
          ui,
          now: NOW,
          busy: false,
          comments: openComments(key),
        })
      },
      hold: () => true,
    })
    painter.data()
    painter.data()
    expect(paints).toBe(0)
    expect(painter.pending()).toBe(true)
    expect(findArea(root)).toBe(before)
    expect(document.activeElement).toBe(before)
    expect(before.value).toBe('second draft')
  })

  test('whitespace-only text still holds a data paint', () => {
    let paints = 0
    const painter = createPainter({
      paintNow: () => {
        paints += 1
      },
      hold: () => '   '.length > 0,
    })
    painter.data()
    expect(paints).toBe(0)
    expect(painter.pending()).toBe(true)
  })

  test('restoreComment puts the text back and returns focus with selection', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const state = readyState('Invented track one')
    const key = firstCardKey(state)
    const texts: Record<string, string> = { [key]: 'keep this draft' }
    root.innerHTML = renderPage({ states: [state], ui, now: NOW, busy: false, comments: openComments(key) })
    const area = findArea(root)
    restoreComment(root, captureComment(root), texts)
    area.focus()
    area.setSelectionRange(2, 6)
    const snapshot = captureComment(root)
    root.innerHTML = renderPage({ states: [state], ui, now: NOW, busy: false, comments: openComments(key) })
    restoreComment(root, snapshot, texts)
    const after = findArea(root)
    expect(after.value).toBe('keep this draft')
    expect(document.activeElement).toBe(after)
    expect(after.selectionStart).toBe(2)
    expect(after.selectionEnd).toBe(6)
  })

  test('Escape closes the box and the pending paint shows the new data', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const key = firstCardKey(readyState('Invented track one'))
    const texts: Record<string, string> = { [key]: 'draft kept per key' }
    let latest: ReadyState = readyState('Invented track one')
    let paints = 0
    let boxOpen = true
    const painter = createPainter({
      paintNow: () => {
        paints += 1
        root.innerHTML = renderPage({
          states: [latest],
          ui,
          now: NOW,
          busy: false,
          comments: boxOpen ? openComments(key) : {},
        })
        if (boxOpen) restoreComment(root, captureComment(root), texts)
      },
      hold: () => boxOpen,
    })
    root.innerHTML = renderPage({
      states: [latest],
      ui,
      now: NOW,
      busy: false,
      comments: openComments(key),
    })
    restoreComment(root, captureComment(root), texts)
    findArea(root).focus()

    latest = readyState('Invented track two')
    painter.data()
    expect(paints).toBe(0)
    expect(painter.pending()).toBe(true)
    boxOpen = false
    painter.flush()
    expect(paints).toBe(1)
    expect(painter.pending()).toBe(false)
    expect(root.innerHTML).toContain('Invented track two')
    expect(texts[key]).toBe('draft kept per key')
  })
})

describe('holdComment decides the hold from the box, the texts, and the surface', () => {
  test('no box holds nothing', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    expect(holdComment(root, {}, 'panel')).toBe(false)
  })

  test('an open empty box with focus holds', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const state = readyState('Invented track one')
    const key = firstCardKey(state)
    root.innerHTML = renderPage({ states: [state], ui, now: NOW, busy: false, comments: openComments(key) })
    findArea(root).focus()
    expect(holdComment(root, {}, 'panel')).toBe(true)
  })

  test('an open empty box without focus holds nothing', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const state = readyState('Invented track one')
    const key = firstCardKey(state)
    root.innerHTML = renderPage({ states: [state], ui, now: NOW, busy: false, comments: openComments(key) })
    expect(document.activeElement).not.toBe(findArea(root))
    expect(holdComment(root, {}, 'panel')).toBe(false)
  })

  test('whitespace-only text in texts holds without focus', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const state = readyState('Invented track one')
    const key = firstCardKey(state)
    root.innerHTML = renderPage({ states: [state], ui, now: NOW, busy: false, comments: openComments(key) })
    expect(holdComment(root, { [key]: '   ' }, 'panel')).toBe(true)
  })

  test('an invisible character in the box value holds', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const state = readyState('Invented track one')
    const key = firstCardKey(state)
    root.innerHTML = renderPage({ states: [state], ui, now: NOW, busy: false, comments: openComments(key) })
    findArea(root).value = '\u200B'
    expect(holdComment(root, {}, 'panel')).toBe(true)
  })

  test('the status surface never holds, even with text and focus', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const state = readyState('Invented track one')
    const key = firstCardKey(state)
    const texts: Record<string, string> = { [key]: 'status draft' }
    root.innerHTML = renderPage({ states: [state], ui, now: NOW, busy: false, comments: openComments(key) })
    restoreComment(root, captureComment(root), texts)
    findArea(root).focus()
    expect(holdComment(root, texts, 'status')).toBe(false)
  })
})

describe('the holdComment controller keeps the node and spends the pending paint', () => {
  test('a held box survives data() and a real Escape close paints the new data', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const key = firstCardKey(readyState('Invented track one'))
    const texts: Record<string, string> = { [key]: 'held draft' }
    let latest: ReadyState = readyState('Invented track one')
    let paints = 0
    let boxOpen = true
    const painter = createPainter({
      paintNow: () => {
        paints += 1
        root.innerHTML = renderPage({
          states: [latest],
          ui,
          now: NOW,
          busy: false,
          comments: boxOpen ? openComments(key) : {},
        })
        if (boxOpen) restoreComment(root, captureComment(root), texts)
      },
      hold: () => holdComment(root, texts, 'panel'),
    })
    root.innerHTML = renderPage({
      states: [latest],
      ui,
      now: NOW,
      busy: false,
      comments: openComments(key),
    })
    restoreComment(root, captureComment(root), texts)
    findArea(root).focus()
    const before = findArea(root)

    latest = readyState('Invented track two')
    painter.data()
    expect(paints).toBe(0)
    expect(painter.pending()).toBe(true)
    expect(findArea(root)).toBe(before)
    expect(document.activeElement).toBe(before)

    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      boxOpen = false
      painter.user()
      painter.flush()
    }
    document.addEventListener('keydown', onKey)
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    } finally {
      document.removeEventListener('keydown', onKey)
    }
    expect(boxOpen).toBe(false)
    expect(paints).toBe(1)
    expect(painter.pending()).toBe(false)
    expect(root.innerHTML).toContain('Invented track two')
    expect(root.querySelector('textarea.comment-input')).toBe(null)
    expect(texts[key]).toBe('held draft')
  })

  test('an empty blurred box releases the hold so flush paints', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const key = firstCardKey(readyState('Invented track one'))
    const texts: Record<string, string> = {}
    let latest: ReadyState = readyState('Invented track one')
    let paints = 0
    const painter = createPainter({
      paintNow: () => {
        paints += 1
        root.innerHTML = renderPage({
          states: [latest],
          ui,
          now: NOW,
          busy: false,
          comments: openComments(key),
        })
      },
      hold: () => holdComment(root, texts, 'panel'),
    })
    root.innerHTML = renderPage({
      states: [latest],
      ui,
      now: NOW,
      busy: false,
      comments: openComments(key),
    })
    findArea(root).focus()
    expect(holdComment(root, texts, 'panel')).toBe(true)

    latest = readyState('Invented track two')
    painter.data()
    expect(paints).toBe(0)
    expect(painter.pending()).toBe(true)

    const area = findArea(root)
    area.dispatchEvent(new Event('blur'))
    area.blur()
    expect(holdComment(root, texts, 'panel')).toBe(false)
    painter.flush()
    expect(paints).toBe(1)
    expect(painter.pending()).toBe(false)
    expect(root.innerHTML).toContain('Invented track two')
  })
})
