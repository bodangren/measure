// Test helpers: a temporary git project with this repository's Measure files,
// and a fake plugin storage.
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Guard } from '../src/guard'
import { Bypass, Sessions } from '../src/state'
import type { Storage } from '../src/state'
import type { Mode } from '../src/types'

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

/** A Guard over a project root with a fresh storage, sessions, and a temp state folder. */
export const makeGuard = (root: string, mode: Mode = 'guard'): Guard =>
  new Guard(root, mode, new Sessions(), new Bypass(fakeStorage()), mkdtempSync(join(tmpdir(), 'measure-guard-state-')))

/** A Guard with its fake storage in reach (for the repo-level bypass tests). */
export const makeGuardWithStorage = (root: string, mode: Mode = 'guard'): { guard: Guard; storage: Storage & { map: Map<string, unknown> } } => {
  const storage = fakeStorage()
  return { guard: new Guard(root, mode, new Sessions(), new Bypass(storage), mkdtempSync(join(tmpdir(), 'measure-guard-state-'))), storage }
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
