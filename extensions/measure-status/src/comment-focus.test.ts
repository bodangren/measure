/// <reference types="vite/client" />
// FR-16, D1 focus remediation (Task 3.5 F1 [Blocker]): a click on `Comment`
// opens the box, but the focus does not move into the textarea, and Escape
// does not return the focus to the `Comment` button. The accepted mockup
// moves the focus on both steps (mockup render(focusKey); look-notes D1).
// This suite pins the pure rule `focusAfter` of `src/comment-box.ts` and pins
// that `preview/preview.ts` and `panel/main.ts` both call the rule and call
// `focus()` after each repaint. Every fixture text here is invented.
import { describe, expect, test } from 'vitest'
import { focusAfter } from './comment-box'

const KEY = 'invented-repo/invented_1'

const sources = import.meta.glob(
  ['../preview/preview.ts', '../panel/main.ts'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const previewText = (): string => sources['../preview/preview.ts'] ?? ''
const panelText = (): string => sources['../panel/main.ts'] ?? ''

describe('the comment box focus rule', () => {
  test('opening the box focuses the textarea of that card', () => {
    const target = focusAfter('open', KEY)
    expect(target.selector, 'open selector names the textarea').toContain('textarea')
    expect(target.selector, 'open selector names the card key').toContain(KEY)
  })

  test('Escape returns the focus to the Comment button of that card', () => {
    const target = focusAfter('escape', KEY)
    expect(target.selector, 'escape selector names the Comment button').toContain('open-comment')
    expect(target.selector, 'escape selector names the card key').toContain(KEY)
  })

  test('a finished Send returns the focus to the Comment button of that card', () => {
    const target = focusAfter('send-done', KEY)
    expect(target.selector, 'send-done selector names the Comment button').toContain('open-comment')
    expect(target.selector, 'send-done selector names the card key').toContain(KEY)
  })
})

describe('the preview and panel focus wiring', () => {
  test('the preview calls the focus rule and focuses after repaint', () => {
    expect(previewText(), 'preview focus rule').toContain('focusAfter')
    expect(previewText(), 'preview focus call').toContain('.focus()')
  })

  test('the panel calls the focus rule and focuses after repaint', () => {
    expect(panelText(), 'panel focus rule').toContain('focusAfter')
    expect(panelText(), 'panel focus call').toContain('.focus()')
  })
})
