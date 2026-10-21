// Test helpers: a temporary git project with this repository's Measure files,
// and a fake plugin storage.
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Storage } from '../src/state'

export const REPO = join(import.meta.dir, '..', '..', '..')
export const TRACK = 'opencode_plugin_20261021'

/** A new git repository in a temp folder. */
export const tempProject = async (): Promise<string> => {
  const root = mkdtempSync(join(tmpdir(), 'measure-guard-'))
  execFileSync('git', ['init', '-q', root])
  return root
}

export type MeasureOptions = {
  /** Replaces tracks.md. */
  tracks?: string
  /** Replaces the active track's plan.md. */
  plan?: string
  /** Leaves the active track without a plan file. */
  dropPlan?: boolean
}

/** Copies measure/index.md, tracks.md, and the active track's plan into the project. */
export const withMeasure = async (root: string, options: MeasureOptions = {}): Promise<string> => {
  mkdirSync(join(root, 'measure', 'tracks', TRACK), { recursive: true })
  copyFileSync(join(REPO, 'measure/index.md'), join(root, 'measure/index.md'))
  writeFileSync(join(root, 'measure/tracks.md'), options.tracks ?? readFileSync(join(REPO, 'measure/tracks.md'), 'utf8'))
  if (!options.dropPlan) {
    writeFileSync(
      join(root, 'measure/tracks', TRACK, 'plan.md'),
      options.plan ?? readFileSync(join(REPO, 'measure/tracks', TRACK, 'plan.md'), 'utf8'),
    )
  }
  return root
}

/** The plugin storage as a map. */
export const fakeStorage = (): Storage & { map: Map<string, unknown> } => {
  const map = new Map<string, unknown>()
  return {
    map,
    get: async key => map.get(key),
    set: async (key, value) => {
      map.set(key, value)
    },
    remove: async key => {
      map.delete(key)
    },
  }
}
