/// <reference types="vite/client" />
// Closeout nits r2 (PM 2026-11-19): failing pins for Review A F1 (the preview
// length rule) and F2 (the send-done focus wiring). Every fixture here is
// invented text. Each test below fails at the Red HEAD.
import { describe, expect, test } from 'vitest'
import { COMMENT_TEXT_MAX, canSendComment } from './comment'
import { focusAfter } from './comment-box'
import { isSendDisabled } from './send'

const sources = import.meta.glob(
  ['../preview/preview.ts', '../panel/main.ts'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const previewText = (): string => sources['../preview/preview.ts'] ?? ''
const panelText = (): string => sources['../panel/main.ts'] ?? ''

const KEY = 'invented-repo/invented_1'
const LIMIT = 'x'.repeat(COMMENT_TEXT_MAX)
const LONG = 'x'.repeat(COMMENT_TEXT_MAX + 1)

describe('the preview length rule', () => {
  test('the send gate refuses 2001 visible characters', () => {
    expect(canSendComment(LIMIT), 'limit text sends').toBe(true)
    expect(isSendDisabled(LIMIT, false), 'limit text enables Send').toBe(false)
    expect(isSendDisabled(LONG, false), 'long text disables Send').toBe(true)
  })

  test('the preview checks the length before its fake send', () => {
    const text = previewText()
    const fakeAt = text.indexOf('const fakeSend')
    expect(fakeAt, 'preview fakeSend exists').toBeGreaterThan(-1)
    const sendAt = text.indexOf('const sendComment')
    expect(sendAt, 'preview sendComment exists').toBeGreaterThan(-1)
    const block = text.slice(fakeAt, sendAt + 900)
    expect(block, 'preview send path names the length limit').toContain('COMMENT_TEXT_MAX')
  })
})

describe('the send-done focus wiring', () => {
  test('a finished Send returns the focus to the Comment button of its own open card', () => {
    const target = focusAfter('send-done', KEY)
    expect(target.selector, 'send-done selector names the Comment button').toContain('open-comment')
    expect(target.selector, 'send-done selector names the card key').toContain(KEY)
    const entries: Array<[string, string]> = [
      ['preview', previewText()],
      ['panel', panelText()],
    ]
    for (const [name, text] of entries) {
      const at = text.indexOf("'send-done'")
      expect(at, `${name} sets the send-done focus`).toBeGreaterThan(-1)
      const window = text.slice(Math.max(0, at - 400), at + 200)
      expect(window, `${name} scopes send-done to its own open box`).toContain('openKey')
    }
  })
})
