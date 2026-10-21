// S1: the shared core parses this repository's Measure files and decides like the mod.
import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { bandLine, parsePlan, parseTracks, position, selectActive, statusLines, taskNote } from '../src/core/parse'
import { editDecision } from '../src/core/guards'
import type { GuardContext, Plan, Snapshot } from '../src/types'

const REPO = join(import.meta.dir, '..', '..', '..')
const TRACKS = readFileSync(join(REPO, 'measure/tracks.md'), 'utf8')
const PLAN = readFileSync(join(REPO, 'measure/tracks/opencode_plugin_20261021/plan.md'), 'utf8')

const snapshotOf = (plan: Plan): Snapshot => {
  const tracks = parseTracks(TRACKS)
  const plans = new Map<string, Plan>([['opencode_plugin_20261021', plan]])
  const entry = selectActive(tracks, plans)
  if (entry === null) throw new Error('no active track')
  return {
    root: REPO,
    hasMeasure: true,
    isRepo: true,
    tracksPath: join(REPO, 'measure/tracks.md'),
    tracks,
    active: { entry, planPath: join(REPO, 'measure/tracks/opencode_plugin_20261021/plan.md'), plan },
    inProgressCount: tracks.filter(t => t.marker === '~').length,
    parseError: null,
  }
}

describe('parse', () => {
  test('tracks.md lists the OpenCode plugin track as in progress', () => {
    const track = parseTracks(TRACKS).find(t => t.id === 'opencode_plugin_20261021')
    expect(track?.marker).toBe('~')
    expect(track?.folder).toBe('tracks/opencode_plugin_20261021')
  })

  test('plan.md has nine story phases and a [~] task', () => {
    const plan = parsePlan(PLAN)
    expect(plan.phases.length).toBe(9)
    expect(plan.phases[0]?.title).toContain('Phase S1')
    const pos = position(plan)
    expect(pos.phases).toBe(9)
    expect(pos.current?.marker).toBe('~')
  })

  test('the band and the note name the active track and task', () => {
    const snapshot = snapshotOf(parsePlan(PLAN))
    const band = bandLine(snapshot, null)
    expect(band).toContain('opencode_plugin_20261021')
    expect(band).toContain('Phase ')
    expect(taskNote(snapshot, 'guard')).toContain('[~]')
    expect(statusLines(snapshot, null).length).toBeGreaterThan(2)
  })
})

describe('guards', () => {
  test('an edit outside measure/ passes with a [~] task and is denied without one', () => {
    const withTask: GuardContext = { snapshot: snapshotOf(parsePlan(PLAN)), mode: 'guard', setupChoice: null, guardsOff: null }
    expect(editDecision(withTask, join(REPO, 'plugins/x.ts'))).toBeNull()
    const noTask = parsePlan(PLAN.replace('- [~] Task', '- [ ] Task'))
    const without: GuardContext = { ...withTask, snapshot: snapshotOf(noTask) }
    const decision = editDecision(without, join(REPO, 'plugins/x.ts'))
    expect(decision?.deny).toContain('[~]')
    expect(editDecision({ ...without, mode: 'advise' }, join(REPO, 'plugins/x.ts'))).toBeNull()
  })
})
