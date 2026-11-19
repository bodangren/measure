// FR-1: the roster, the manifest globs, and the measure file path.
import { describe, expect, test } from 'vitest'
import pkg from '../package.json'
import { ROSTER, measureFile, rosterGlobs } from './roster'

const IDS = [
  'reading-advantage-monorepo',
  'Workbooks',
  'advantage-pr',
  'advantage-forge',
  'mastery-advantage',
  'ra-math-advantage',
  'lending-desk-bench',
  'measure',
]

describe('ROSTER', () => {
  test('lists the eight repos in the assignment order', () => {
    expect(ROSTER.map(repo => repo.id)).toEqual(IDS)
  })

  test('gives every repo the main checkout path under ~/Desktop', () => {
    for (const repo of ROSTER) {
      expect(repo.path).toBe(`~/Desktop/${repo.id}`)
    }
  })
})

describe('rosterGlobs', () => {
  test('declares one measure glob for each repo', () => {
    expect(rosterGlobs()).toEqual(IDS.map(id => `~/Desktop/${id}/measure/**`))
  })

  test('stays inside the host limits of 1 to 16 globs of 1 to 256 characters', () => {
    const globs = rosterGlobs()
    expect(globs.length).toBeGreaterThanOrEqual(1)
    expect(globs.length).toBeLessThanOrEqual(16)
    for (const glob of globs) {
      expect(glob.length).toBeGreaterThanOrEqual(1)
      expect(glob.length).toBeLessThanOrEqual(256)
    }
  })
})

describe('the manifest', () => {
  test('declares exactly the roster globs in contributes.filesystem', () => {
    expect(pkg.openchamber.contributes.filesystem).toEqual(rosterGlobs())
  })

  test('keeps the files capability of the band', () => {
    expect(pkg.openchamber.contributes.capabilities).toContain('files')
  })
})

describe('measureFile', () => {
  test('joins a relative path under the measure folder of the repo', () => {
    const repo = { id: 'invented-repo', path: '~/Desktop/invented-repo' }
    expect(measureFile(repo, 'tracks.md')).toBe('~/Desktop/invented-repo/measure/tracks.md')
    expect(measureFile(repo, 'tracks/invented_1/plan.md')).toBe(
      '~/Desktop/invented-repo/measure/tracks/invented_1/plan.md',
    )
  })
})
