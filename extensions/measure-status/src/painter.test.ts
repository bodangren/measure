/// <reference types="vite/client" />
// FR-1, FR-2, FR-7 (Task 1.1 Red): pure painter rules and the raw-source
// wiring pin of panel/main.ts. Every fixture text here is invented.
// This suite fails until src/painter.ts exists and the panel and preview
// route through it. Green must not change this file.
import { describe, expect, test } from 'vitest'
import { captureComment, createPainter, restoreComment } from './painter'

const sources = import.meta.glob(['../panel/main.ts', '../preview/preview.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const panelText = (): string => sources['../panel/main.ts'] ?? ''
const previewText = (): string => sources['../preview/preview.ts'] ?? ''

const rig = (held: boolean) => {
  let calls = 0
  let currentHold = held
  const painter = createPainter({
    paintNow: () => {
      calls += 1
    },
    hold: () => currentHold,
  })
  return {
    painter,
    calls: () => calls,
    setHold: (value: boolean) => {
      currentHold = value
    },
  }
}

describe('createPainter data and user paints', () => {
  test('data draws at once when nothing holds it', () => {
    const { painter, calls } = rig(false)
    painter.data()
    expect(calls()).toBe(1)
    expect(painter.pending()).toBe(false)
  })

  test('data holds while hold is true and draws nothing', () => {
    const { painter, calls } = rig(true)
    painter.data()
    expect(calls()).toBe(0)
    expect(painter.pending()).toBe(true)
  })

  test('a user paint clears a pending data paint and draws the latest data once', () => {
    const { painter, calls } = rig(true)
    painter.data()
    expect(painter.pending()).toBe(true)
    painter.user()
    expect(calls()).toBe(1)
    expect(painter.pending()).toBe(false)
    painter.flush()
    expect(calls()).toBe(1)
  })

  test('flush draws the pending paint once hold is false', () => {
    const { painter, calls, setHold } = rig(true)
    painter.data()
    painter.data()
    expect(calls()).toBe(0)
    expect(painter.pending()).toBe(true)
    setHold(false)
    painter.flush()
    expect(calls()).toBe(1)
    expect(painter.pending()).toBe(false)
  })

  test('flush draws nothing while hold stays true', () => {
    const { painter, calls } = rig(true)
    painter.data()
    painter.flush()
    expect(calls()).toBe(0)
    expect(painter.pending()).toBe(true)
  })

  test('flush draws nothing when no paint is pending', () => {
    const { painter, calls } = rig(false)
    painter.flush()
    expect(calls()).toBe(0)
    expect(painter.pending()).toBe(false)
  })

  test('user draws at once even while hold is true', () => {
    const { painter, calls } = rig(true)
    painter.user()
    expect(calls()).toBe(1)
    expect(painter.pending()).toBe(false)
  })
})

describe('captureComment and restoreComment exports', () => {
  test('the module exports both helpers', () => {
    expect(typeof captureComment).toBe('function')
    expect(typeof restoreComment).toBe('function')
  })
})

describe('the panel and preview painter wiring', () => {
  test('the panel routes loadBoard results and host ready through data()', () => {
    const text = panelText()
    expect(text, 'panel creates a painter').toContain('createPainter')
    expect(text, 'panel data paint').toContain('.data()')
  })

  test('the panel routes comment and toggle actions through user()', () => {
    const text = panelText()
    expect(text, 'panel user paint').toContain('.user()')
  })

  test('the panel paint keeps the status branch and serves as paintNow', () => {
    const text = panelText()
    expect(text, 'panel status branch').toContain("surface === 'status'")
    expect(text, 'panel paintNow').toContain('paintNow')
  })

  test('the preview uses createPainter with user() only', () => {
    const text = previewText()
    expect(text, 'preview creates a painter').toContain('createPainter')
    expect(text, 'preview user paint').toContain('.user()')
    expect(text, 'preview has no data paint').not.toContain('.data()')
  })
})
