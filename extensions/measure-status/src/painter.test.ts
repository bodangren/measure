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

describe('the panel data paint callers', () => {
  test('loadBoard start draws a data paint', () => {
    expect(panelText(), 'loadBoard start').toMatch(
      /states = startLoad\(states\)[\s\S]{0,60}painter\.data\(\)/,
    )
  })

  test('the repo-result callback draws a data paint and the badge outside the gate', () => {
    expect(panelText(), 'repo-result data paint').toMatch(
      /applyRepoResult\(states, state\.repo\.id, state\)[\s\S]{0,120}painter\.data\(\)/,
    )
    expect(panelText(), 'repo-result badge outside the gate').toMatch(
      /painter\.data\(\)\n    void refreshBadge\(\)/,
    )
  })

  test('loadBoard end draws a data paint', () => {
    expect(panelText(), 'loadBoard end').toMatch(/busy = false\n  painter\.data\(\)/)
  })

  test('loadBand draws a data paint', () => {
    expect(panelText(), 'loadBand').toMatch(
      /loadSnapshot\(host, directory\)[\s\S]{0,80}painter\.data\(\)/,
    )
  })

  test('host.onReady draws a data paint', () => {
    expect(panelText(), 'host.onReady').toMatch(/host\.onReady\([\s\S]*painter\.data\(\)/)
  })
})

describe('the panel user paint callers', () => {
  test('the Refresh action reaches loadBoard and never a user paint', () => {
    const text = panelText()
    const refresh = /if \(action === 'refresh'\) \{[^}]*\}/.exec(text)?.[0] ?? ''
    expect(refresh, 'refresh reaches loadBoard').toContain('loadBoard()')
    expect(refresh, 'refresh has no user paint').not.toContain('.user()')
  })

  test('open-comment draws a user paint', () => {
    expect(panelText(), 'open-comment').toMatch(
      /if \(action === 'open-comment'\) \{[\s\S]*?painter\.user\(\)/,
    )
  })

  test('send start draws a user paint', () => {
    expect(panelText(), 'send start').toMatch(
      /startCommentSend\(commentState, key\)[\s\S]{0,40}painter\.user\(\)/,
    )
  })

  test('send end draws a user paint and spends the pending paint', () => {
    const matches = panelText().match(/painter\.user\(\)\n  painter\.flush\(\)/g) ?? []
    expect(matches.length, 'send end and Escape flush pairs').toBe(2)
  })

  test('toggle-section draws a user paint', () => {
    expect(panelText(), 'toggle-section').toMatch(
      /if \(action === 'toggle-section'\) \{[\s\S]*?painter\.user\(\)/,
    )
  })

  test('toggle-done draws a user paint', () => {
    expect(panelText(), 'toggle-done').toMatch(
      /if \(action === 'toggle-done'\) \{[\s\S]*?painter\.user\(\)/,
    )
  })

  test('toggle-done-group draws a user paint', () => {
    expect(panelText(), 'toggle-done-group').toMatch(
      /if \(action === 'toggle-done-group'\) \{[\s\S]*?painter\.user\(\)/,
    )
  })

  test('show-more draws a user paint', () => {
    expect(panelText(), 'show-more').toMatch(
      /if \(action === 'show-more'\) \{[\s\S]*?painter\.user\(\)/,
    )
  })

  test('toggle-stale draws a user paint', () => {
    expect(panelText(), 'toggle-stale').toMatch(
      /if \(action === 'toggle-stale'\) \{[\s\S]*?painter\.user\(\)/,
    )
  })

  test('the Escape key draws a user paint', () => {
    expect(panelText(), 'Escape').toMatch(/event\.key !== 'Escape'[\s\S]*?painter\.user\(\)/)
  })
})
