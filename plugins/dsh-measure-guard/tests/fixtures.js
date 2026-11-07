// An in-memory Measure project for the DSH adapter tests. The strings are the
// source of truth; makeRepo() writes the same files into a fresh temporary
// directory for the tests of the later phases.
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

export const TRACK_ID = 'dsh_measure_guard_20261107'

export const INDEX = `# Measure Index

This file is the root of the Universal File Resolution Protocol. All Measure
commands resolve project files by name using the links below.

## Tracks

- **Tracks Registry**: [./tracks.md](./tracks.md)
- **Tracks Directory**: [./tracks/](./tracks/)
`

export const TRACKS = `# Project Tracks

- [~] **Track: DSH measure guard**
  *Link: [./tracks/dsh_measure_guard_20261107/](./tracks/dsh_measure_guard_20261107/)*

- [x] [Old linked work](archive/old_linked_20260101/index.md)
`

export const PLAN = `# Implementation Plan: DSH measure guard

## Phase 1: Skeleton [checkpoint: abcdef0]

- [x] Task: Copy the shared core \`abcdef0\`

## Phase 2: Adapter

- [~] Task: Guard the edits
- [ ] Task: Ship the docs
- [b] Task: Human review
`

export const ALLOW = `# Folders treated as Measure work.
docs/
../outside/
`

/** The fixture project, keyed by its path relative to the project root. */
export const FILES = {
  'measure/index.md': INDEX,
  'measure/tracks.md': TRACKS,
  [`measure/tracks/${TRACK_ID}/plan.md`]: PLAN,
  'measure/guard-allow': ALLOW,
}

/** Writes the fixture into a fresh temp directory and returns its path. */
export async function makeRepo() {
  const root = await mkdtemp(join(tmpdir(), 'dsh-measure-guard-'))
  for (const [relative, text] of Object.entries(FILES)) {
    const path = join(root, relative)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, text, 'utf8')
  }
  return root
}

/** Removes a directory returned by makeRepo(). */
export async function cleanupRepo(root) {
  if (root) await rm(root, { recursive: true, force: true })
}
