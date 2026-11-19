/// <reference types="vite/client" />
// Review C F1 [Major] remediation (Task 3.3): the preview renders the D1
// Comment button on every Blocked and Waiting card, so it must wire the
// same comment actions as the panel. Every fixture text here is invented.
import { describe, expect, test } from 'vitest'

const sources = import.meta.glob(
  ['./render.ts', '../preview/preview.ts', '../panel/main.ts'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const renderText = (): string => sources['./render.ts'] ?? ''
const previewText = (): string => sources['../preview/preview.ts'] ?? ''
const panelText = (): string => sources['../panel/main.ts'] ?? ''

/** Every `data-action="value"` that src/render.ts emits. */
const renderActions = (): string[] => {
  const found = new Set<string>()
  const re = /data-action="([^"]+)"/g
  let match: RegExpExecArray | null
  const text = renderText()
  while ((match = re.exec(text)) !== null) {
    const value = match[1]
    if (value !== undefined) found.add(value)
  }
  return [...found].sort()
}

describe('the preview comment wiring', () => {
  test('renders the same comment actions as the panel', () => {
    const actions = renderActions()
    expect(actions).toContain('open-comment')
    expect(actions).toContain('send-comment')
    const missing = actions.filter(action => !previewText().includes(`'${action}'`))
    expect(missing, `preview handles no action for: ${missing.join(', ')}`).toEqual([])
  })

  test('closes the comment box with the Escape key', () => {
    expect(previewText(), 'preview Escape handler').toContain('Escape')
    expect(previewText(), 'preview keydown handler').toContain('keydown')
  })

  test('sends through a local fake sender with a sent time', () => {
    expect(previewText(), 'preview fake sent time').toContain('sentAt')
    expect(previewText(), 'preview sent line').toContain('sent ')
  })

  test('calls no OpenChamber SDK from the preview', () => {
    const text = previewText()
    expect(text, 'preview SDK import').not.toContain('@openchamber/sdk')
    expect(text, 'preview connectHost').not.toContain('connectHost')
    expect(text, 'preview sessions.send').not.toContain('sessions.send')
  })

  test('the panel wires every render action and the Escape key', () => {
    const actions = renderActions()
    const missing = actions.filter(action => !panelText().includes(`'${action}'`))
    expect(missing, `panel handles no action for: ${missing.join(', ')}`).toEqual([])
    expect(panelText(), 'panel Escape handler').toContain('Escape')
  })
})
