/// <reference types="vite/client" />
// FR-1, FR-2, FR-7 (Task 1.1 Red): pure painter rules and the raw-source
// wiring pin of panel/main.ts. Every fixture text here is invented.
// This suite fails until src/painter.ts exists and the panel and preview
// route through it. Green must not change this file.
import { describe, expect, test } from 'vitest'
import { captureComment, createPainter, holdComment, restoreComment } from './painter'

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

  test('the module exports the holdComment rule', () => {
    expect(typeof holdComment).toBe('function')
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

describe('the panel holdComment wiring', () => {
  test('the panel imports holdComment from the painter module', () => {
    expect(panelText(), 'panel holdComment import').toMatch(
      /import \{[^}]*holdComment[^}]*\} from '\.\.\/src\/painter'/,
    )
  })

  test('the panel holds data paints with the shared rule, texts, and surface', () => {
    expect(panelText(), 'panel hold wiring').toContain(
      'hold: () => holdComment(root, commentState.texts, surface)',
    )
  })

  test('the textarea blur listener calls flush', () => {
    const text = panelText()
    const at = text.indexOf("addEventListener('blur'")
    expect(at, 'panel blur listener').toBeGreaterThanOrEqual(0)
    expect(text.slice(at, at + 120), 'panel blur flush').toContain('flush')
  })
})

/** FR-7: one onAction handler slice, from its guard to the next action guard. */
const actionSlice = (text: string, name: string): string => {
  const guard = `if (action === '${name}')`
  const start = text.indexOf(guard)
  if (start < 0) return ''
  const after = text.slice(start + guard.length)
  const nextGuard = after.indexOf('if (action ===')
  const endOfAction =
    after.indexOf('\n}\n\n// ----- The mount hook') >= 0
      ? after.indexOf('\n}\n\n// ----- The mount hook')
      : after.length
  const end = nextGuard >= 0 ? Math.min(nextGuard, endOfAction) : endOfAction
  return after.slice(0, end)
}

/** FR-7: the source from one top-level marker to the next one. */
const bodySlice = (text: string, from: string, to: string): string => {
  const start = text.indexOf(from)
  if (start < 0) return ''
  const end = text.indexOf(to, start + from.length)
  return end < 0 ? text.slice(start) : text.slice(start, end)
}

describe('the panel data paint callers', () => {
  test('loadBoard draws data paints and never a user paint', () => {
    const body = bodySlice(panelText(), 'const loadBoard', 'const loadBand')
    expect(body, 'loadBoard body exists').not.toBe('')
    expect(body, 'loadBoard data paint').toContain('painter.data()')
    expect(body, 'loadBoard has no user paint').not.toContain('painter.user()')
  })

  test('the repo-result callback draws a data paint and the badge outside the gate', () => {
    const body = bodySlice(panelText(), 'const loadBoard', 'const loadBand')
    expect(body, 'repo-result data paint').toMatch(
      /applyRepoResult\(states, state\.repo\.id, state\)[\s\S]{0,120}painter\.data\(\)/,
    )
    expect(body, 'repo-result badge outside the gate').toMatch(
      /painter\.data\(\)\n    void refreshBadge\(\)/,
    )
  })

  test('loadBand draws a data paint and never a user paint', () => {
    const body = bodySlice(panelText(), 'const loadBand', 'const startTimer')
    expect(body, 'loadBand body exists').not.toBe('')
    expect(body, 'loadBand data paint').toContain('painter.data()')
    expect(body, 'loadBand has no user paint').not.toContain('painter.user()')
  })

  test('host.onReady draws a data paint and never a user paint', () => {
    const body = bodySlice(panelText(), 'host.onReady((ctx) => {', "document.addEventListener('keydown'")
    expect(body, 'host.onReady body exists').not.toBe('')
    expect(body, 'host.onReady data paint').toContain('painter.data()')
    expect(body, 'host.onReady has no user paint').not.toContain('painter.user()')
  })
})

describe('the panel user paint callers', () => {
  test('the Refresh action reaches loadBoard and never a paint call', () => {
    const slice = actionSlice(panelText(), 'refresh')
    expect(slice, 'refresh slice exists').not.toBe('')
    expect(slice, 'refresh reaches loadBoard').toContain('loadBoard()')
    expect(slice, 'refresh has no user paint').not.toContain('painter.user()')
    expect(slice, 'refresh has no data paint').not.toContain('painter.data()')
  })

  test('open-comment draws a user paint and never a data paint', () => {
    const slice = actionSlice(panelText(), 'open-comment')
    expect(slice, 'open-comment slice exists').not.toBe('')
    expect(slice, 'open-comment user paint').toContain('painter.user()')
    expect(slice, 'open-comment has no data paint').not.toContain('painter.data()')
  })

  test('send-comment reaches the sender and never a direct paint call', () => {
    const slice = actionSlice(panelText(), 'send-comment')
    expect(slice, 'send-comment slice exists').not.toBe('')
    expect(slice, 'send-comment reaches sendComment').toContain('void sendComment(key)')
    expect(slice, 'send-comment has no user paint').not.toContain('painter.user()')
    expect(slice, 'send-comment has no data paint').not.toContain('painter.data()')
  })

  test('sendComment draws user paints, spends the pending paint, and never a data paint', () => {
    const body = bodySlice(panelText(), 'const sendComment', '/** True while a load runs')
    expect(body, 'sendComment body exists').not.toBe('')
    expect(body, 'sendComment user paint').toContain('painter.user()')
    expect(body, 'sendComment flush').toContain('painter.flush()')
    expect(body, 'sendComment has no data paint').not.toContain('painter.data()')
  })

  test('toggle-section draws a user paint and never a data paint', () => {
    const slice = actionSlice(panelText(), 'toggle-section')
    expect(slice, 'toggle-section slice exists').not.toBe('')
    expect(slice, 'toggle-section user paint').toContain('painter.user()')
    expect(slice, 'toggle-section has no data paint').not.toContain('painter.data()')
  })

  test('toggle-done draws a user paint and never a data paint', () => {
    const slice = actionSlice(panelText(), 'toggle-done')
    expect(slice, 'toggle-done slice exists').not.toBe('')
    expect(slice, 'toggle-done user paint').toContain('painter.user()')
    expect(slice, 'toggle-done has no data paint').not.toContain('painter.data()')
  })

  test('toggle-done-group draws a user paint and never a data paint', () => {
    const slice = actionSlice(panelText(), 'toggle-done-group')
    expect(slice, 'toggle-done-group slice exists').not.toBe('')
    expect(slice, 'toggle-done-group user paint').toContain('painter.user()')
    expect(slice, 'toggle-done-group has no data paint').not.toContain('painter.data()')
  })

  test('show-more draws a user paint and never a data paint', () => {
    const slice = actionSlice(panelText(), 'show-more')
    expect(slice, 'show-more slice exists').not.toBe('')
    expect(slice, 'show-more user paint').toContain('painter.user()')
    expect(slice, 'show-more has no data paint').not.toContain('painter.data()')
  })

  test('toggle-stale draws a user paint and never a data paint', () => {
    const slice = actionSlice(panelText(), 'toggle-stale')
    expect(slice, 'toggle-stale slice exists').not.toBe('')
    expect(slice, 'toggle-stale user paint').toContain('painter.user()')
    expect(slice, 'toggle-stale has no data paint').not.toContain('painter.data()')
  })

  test('the Escape key draws a user paint, spends the pending paint, and never a data paint', () => {
    const body = bodySlice(panelText(), "document.addEventListener('keydown'", 'END_OF_PANEL_SOURCE')
    expect(body, 'Escape body exists').not.toBe('')
    expect(body, 'Escape user paint').toContain('painter.user()')
    expect(body, 'Escape flush').toContain('painter.flush()')
    expect(body, 'Escape has no data paint').not.toContain('painter.data()')
  })
})
