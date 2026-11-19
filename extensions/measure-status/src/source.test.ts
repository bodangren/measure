/// <reference types="vite/client" />
// NFR-3: the source holds no write call and no listDir outside the loader.
// NFR-2: the model modules hold no SDK import and no DOM access.
import { describe, expect, test } from 'vitest'

const sources = import.meta.glob(
  ['./*.ts', '!./*.test.ts', '!./fixtures.ts', '../panel/main.ts', '../service/main.ts'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const REQUIRED = [
  './roster.ts',
  './registry.ts',
  './parse.ts',
  './board.ts',
  './age.ts',
  './load.ts',
  './measure.ts',
  './band.ts',
  './types.ts',
  '../panel/main.ts',
]

const MODEL = [
  './roster.ts',
  './registry.ts',
  './parse.ts',
  './board.ts',
  './age.ts',
  './load.ts',
  './render.ts',
  './page-state.ts',
  './comment-box.ts',
  './comment.ts',
  './pm-target.ts',
]

const entries = () => Object.entries(sources)

describe('the source files', () => {
  test('hold every module of the board and the panel entry', () => {
    const missing = REQUIRED.filter(path => sources[path] === undefined)
    expect(missing, `missing modules: ${missing.join(', ')}`).toEqual([])
  })

  test('call no writeFile', () => {
    const writers = entries().filter(([, text]) => text.includes('writeFile')).map(([path]) => path)
    expect(writers).toEqual([])
  })

  test('call listDir only in the loader and the old snapshot loader', () => {
    const callers = entries()
      .filter(([, text]) => text.includes('listDir'))
      .map(([path]) => path)
      .sort()
    expect(callers).toEqual(['./load.ts', './measure.ts'])
  })
})

describe('the panel entry', () => {
  test('holds no writeFile, listDir, or fetch( call', () => {
    const text = sources['../panel/main.ts'] ?? ''
    expect(text, 'panel writeFile').not.toContain('writeFile')
    expect(text, 'panel listDir').not.toContain('listDir')
    expect(text, 'panel fetch(').not.toContain('fetch(')
  })
})

describe('the model modules', () => {
  test('import no SDK and touch no DOM', () => {
    const offending: string[] = []
    for (const path of MODEL) {
      const text = sources[path]
      if (text === undefined) {
        offending.push(`${path} is missing`)
        continue
      }
      if (text.includes('@openchamber/sdk')) offending.push(`${path} imports the SDK`)
      if (text.includes('document.')) offending.push(`${path} uses document`)
      if (text.includes('window.')) offending.push(`${path} uses window`)
    }
    expect(offending).toEqual([])
  })
})
