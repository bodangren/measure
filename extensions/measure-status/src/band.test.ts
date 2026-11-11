// The band line and status view model, plus the snapshot loader against an
// in-memory fake host.
import { describe, expect, test } from 'vitest'
import type { FileStatResult } from '@openchamber/sdk'
import {
  activeId,
  bandLine,
  blockedCountOfActivePlan,
  copyText,
  markerClassName,
  markerText,
  markerTone,
  needsCurrentTaskBanner,
  nextPendingText,
  statusView,
} from './band'
import {
  EDGE_PLAN,
  DONE_PLAN,
  GUARD_INDEX,
  GUARD_PLAN,
  PLAN_ACTIVE_TASK,
  PLAN_NO_ACTIVE_TASK,
  TWO_ACTIVE_TRACKS,
} from './fixtures'
import { parsePlan, parseTracks, selectActive } from './parse'
import { loadSnapshot } from './measure'
import type { MeasureHost } from './measure'
import type { Snapshot } from './types'

const fileOf = (content: string): FileStatResult => ({ kind: 'file', size: content.length, mtime: 0 })
const dirOf = (): FileStatResult => ({ kind: 'directory', size: 0, mtime: 0 })
const missing = (): FileStatResult => ({ kind: 'missing', size: 0, mtime: 0 })

/** A tiny in-memory file system: a `readFile` map and a `stat` map. */
const fakeHost = (files: Record<string, string>, directories: string[] = []): MeasureHost => {
  const fileContent = (path: string): Promise<{ content: string }> => {
    const content = files[path]
    if (content === undefined) throw new Error(`NOT_FOUND: ${path}`)
    return Promise.resolve({ content })
  }
  const stat = (path: string): Promise<FileStatResult> => {
    if (files[path] !== undefined) return Promise.resolve(fileOf(files[path]))
    if (directories.includes(path) || path === '' || path === '.') return Promise.resolve(dirOf())
    return Promise.resolve(missing())
  }
  return {
    readFile: fileContent,
    stat,
    listDir: () => Promise.resolve({ entries: [] }),
  }
}

const activeSnapshot = (overrides: Partial<Snapshot> = {}): Snapshot => {
  const tracks = parseTracks(TWO_ACTIVE_TRACKS)
  const plans = new Map([
    ['first_1', parsePlan(PLAN_NO_ACTIVE_TASK)],
    ['second_2', parsePlan(PLAN_ACTIVE_TASK)],
  ])
  const entry = selectActive(tracks, plans)
  if (entry === null) throw new Error('expected an active track')
  return {
    directory: '/repo',
    hasMeasure: true,
    tracksPath: 'measure/tracks.md',
    tracks,
    active: { entry, planPath: 'measure/tracks/second_2/plan.md', plan: plans.get(entry.id) ?? parsePlan('') },
    inProgressCount: 2,
    parseError: null,
    ...overrides,
  }
}

describe('bandLine', () => {
  test('null when the project has no measure/ folder', () => {
    expect(bandLine({ directory: '/repo', hasMeasure: false, tracksPath: null, tracks: [], active: null, inProgressCount: 0, parseError: null })).toBeNull()
  })

  test('shows the parse error when reading fails', () => {
    const line = bandLine({
      directory: '/repo',
      hasMeasure: true,
      tracksPath: 'measure/tracks.md',
      tracks: [],
      active: null,
      inProgressCount: 0,
      parseError: 'measure/tracks.md has track lines in no known format',
    })
    expect(line).toContain('cannot read the Measure files')
    // The full error text lives on the second line of the status section.
  })

  test('includes the [b] count, the phase, the task, and the 2-tracks warning', () => {
    const line = bandLine(activeSnapshot())
    expect(line).toContain('Second')
    expect(line).toContain('Phase 1/1')
    expect(line).toContain('Task 1/1')
    expect(line).toContain('[~]')
    expect(line).toContain('2 tracks in progress')
  })

  test('adds no task in progress when the active task is not [~]', () => {
    const tracks = parseTracks(TWO_ACTIVE_TRACKS)
    const plans = new Map([
      ['first_1', parsePlan(EDGE_PLAN)],
      ['second_2', parsePlan(EDGE_PLAN)],
    ])
    const entry = selectActive(tracks, plans)
    if (entry === null) throw new Error('expected an active track')
    // Build a plan that has an open task but no [~] task, so position() falls
    // back to the open task. selectActive requires a [~] task in the plan, so
    // we override the plan after selection.
    const planNoActive = parsePlan(PLAN_NO_ACTIVE_TASK)
    const line = bandLine({
      directory: '/repo',
      hasMeasure: true,
      tracksPath: 'measure/tracks.md',
      tracks,
      active: { entry, planPath: 'measure/tracks/second_2/plan.md', plan: planNoActive },
      inProgressCount: 2,
      parseError: null,
    })
    expect(line).toContain('no task in progress')
  })

  test('says all tasks closed when the active plan has no open task', () => {
    const tracks = parseTracks(TWO_ACTIVE_TRACKS)
    const plans = new Map([
      ['first_1', parsePlan(PLAN_ACTIVE_TASK)],
      ['second_2', parsePlan(PLAN_ACTIVE_TASK)],
    ])
    const entry = selectActive(tracks, plans)
    if (entry === null) throw new Error('expected an active track')
    const line = bandLine({
      directory: '/repo',
      hasMeasure: true,
      tracksPath: 'measure/tracks.md',
      tracks,
      active: { entry, planPath: 'measure/tracks/second_2/plan.md', plan: parsePlan(DONE_PLAN) },
      inProgressCount: 2,
      parseError: null,
    })
    expect(line).toContain('all tasks closed')
  })

  test('says no track in progress when there is no active track', () => {
    const line = bandLine({ directory: '/repo', hasMeasure: true, tracksPath: 'measure/tracks.md', tracks: parseTracks(TWO_ACTIVE_TRACKS).map(t => ({ ...t, marker: 'x' as const })), active: null, inProgressCount: 0, parseError: null })
    expect(line).toContain('no track in progress')
  })
})

describe('marker helpers', () => {
  test('markerText renders the bracket for every marker', () => {
    expect(markerText(' ')).toBe('[ ]')
    expect(markerText('~')).toBe('[~]')
    expect(markerText('x')).toBe('[x]')
    expect(markerText('b')).toBe('[b]')
  })

  test('markerTone maps the markers to UI tones', () => {
    expect(markerTone('~')).toBe('primary')
    expect(markerTone('x')).toBe('success')
    expect(markerTone('b')).toBe('warning')
    expect(markerTone(' ')).toBe('neutral')
  })

  test('markerClassName returns the CSS class matching markerTone', () => {
    expect(markerClassName('~')).toBe('marker-primary')
    expect(markerClassName('x')).toBe('marker-success')
    expect(markerClassName('b')).toBe('marker-warning')
    expect(markerClassName(' ')).toBe('marker-neutral')
  })

  test('markerClassName agrees with markerTone for every marker', () => {
    const markers: Array<' ' | '~' | 'x' | 'b'> = [' ', '~', 'x', 'b']
    for (const m of markers) {
      expect(markerClassName(m)).toBe(`marker-${markerTone(m)}`)
    }
  })
})

describe('statusView and copyText', () => {
  test('lists every track with the active one marked', () => {
    const view = statusView(activeSnapshot())
    expect(view.tracks.map(t => t.id)).toEqual(['first_1', 'second_2', 'old_0'])
    expect(view.tracks.find(t => t.active)?.id).toBe('second_2')
    expect(view.activePlanPath).toBe('measure/tracks/second_2/plan.md')
  })

  test('lists the blocked tasks with their owner and the open marker flag', () => {
    const snapshot = activeSnapshot()
    snapshot.active = {
      entry: snapshot.tracks[0]!,
      planPath: 'measure/tracks/first_1/plan.md',
      plan: parsePlan(EDGE_PLAN),
    }
    const view = statusView(snapshot)
    expect(view.blockedTasks).toHaveLength(2)
    expect(view.blockedTasks.find(t => t.deferredOwner === null)).toBeDefined()
  })

  test('copyText includes the band line, the tracks, the phases, and the [b] tasks', () => {
    const text = copyText(activeSnapshot())
    expect(text).toContain('Measure')
    expect(text).toContain('Tracks:')
    expect(text).toContain('Active plan: measure/tracks/second_2/plan.md')
    expect(text).toContain('Phase 1: A')
  })
})

describe('helpers', () => {
  test('activeId returns the active track id or null', () => {
    expect(activeId(activeSnapshot())).toBe('second_2')
    expect(activeId({ ...activeSnapshot(), active: null })).toBeNull()
  })

  test('blockedCountOfActivePlan counts the [b] tasks of the active plan', () => {
    const snapshot = activeSnapshot()
    snapshot.active = {
      entry: snapshot.tracks[0]!,
      planPath: 'measure/tracks/first_1/plan.md',
      plan: parsePlan(EDGE_PLAN),
    }
    expect(blockedCountOfActivePlan(snapshot)).toBe(2)
  })

  test('needsCurrentTaskBanner is true only when there is an active plan but no [~] task', () => {
    expect(needsCurrentTaskBanner(activeSnapshot())).toBe(false)
    expect(needsCurrentTaskBanner({ ...activeSnapshot(), active: { ...activeSnapshot().active!, plan: parsePlan(PLAN_NO_ACTIVE_TASK) } })).toBe(true)
    expect(needsCurrentTaskBanner({ ...activeSnapshot(), active: null })).toBe(false)
  })

  test('nextPendingText returns the first [ ] task or null', () => {
    expect(nextPendingText(activeSnapshot())).toBeNull()
    expect(nextPendingText({ ...activeSnapshot(), active: { ...activeSnapshot().active!, plan: parsePlan(PLAN_NO_ACTIVE_TASK) } })).toBe('Task: Next')
  })
})

describe('loadSnapshot', () => {
  test('null directory returns the empty snapshot', async () => {
    const snap = await loadSnapshot(fakeHost({}), null)
    expect(snap.directory).toBeNull()
    expect(snap.hasMeasure).toBe(false)
  })

  test('project without a measure/ folder is hasMeasure false', async () => {
    const snap = await loadSnapshot(fakeHost({}), '/repo')
    expect(snap.hasMeasure).toBe(false)
    expect(snap.parseError).toBeNull()
  })

  test('project with a measure/ folder but no index.md returns hasMeasure true with no error', async () => {
    const snap = await loadSnapshot(fakeHost({}, ['measure']), '/repo')
    expect(snap.hasMeasure).toBe(true)
    expect(snap.tracksPath).toBeNull()
    expect(snap.parseError).toBeNull()
  })

  test('default paths resolve to measure/tracks.md when the index has no registry link', async () => {
    const snap = await loadSnapshot(
      fakeHost({
        'measure/index.md': '# Index\n\nNo link here.\n',
        'measure/tracks.md': '- [~] **Track: One**\n  *Link: [./tracks/one_1/](./tracks/one_1/)*\n',
        'measure/tracks/one_1/index.md': GUARD_INDEX,
        'measure/tracks/one_1/plan.md': PLAN_ACTIVE_TASK,
      }, ['measure', 'measure/tracks', 'measure/tracks/one_1']),
      '/repo',
    )
    expect(snap.tracksPath).toBe('measure/tracks.md')
    expect(snap.tracks).toHaveLength(1)
    expect(snap.active?.entry.id).toBe('one_1')
    expect(snap.active?.planPath).toBe('measure/tracks/one_1/plan.md')
  })

  test('uses the registry link override in measure/index.md', async () => {
    const customIndex = '# Index\n\n- **Tracks Registry**: [./registry.md](./registry.md)\n'
    const snap = await loadSnapshot(
      fakeHost({
        'measure/index.md': customIndex,
        'measure/registry.md': '- [~] **Track: One**\n  *Link: [./tracks/one_1/](./tracks/one_1/)*\n',
        'measure/tracks/one_1/index.md': GUARD_INDEX,
        'measure/tracks/one_1/plan.md': PLAN_ACTIVE_TASK,
      }, ['measure', 'measure/tracks', 'measure/tracks/one_1']),
      '/repo',
    )
    expect(snap.tracksPath).toBe('measure/registry.md')
  })

  test('an active track without a plan gives the no plan parse error', async () => {
    const snap = await loadSnapshot(
      fakeHost({
        'measure/index.md': '# Index\n',
        'measure/tracks.md': '- [~] **Track: One**\n  *Link: [./tracks/one_1/](./tracks/one_1/)*\n',
      }, ['measure', 'measure/tracks', 'measure/tracks/one_1']),
      '/repo',
    )
    expect(snap.active).toBeNull()
    expect(snap.parseError).toContain('no plan.md for the active track one_1')
  })

  test('a plan without Phase headings gives the no-phase parse error', async () => {
    const snap = await loadSnapshot(
      fakeHost({
        'measure/index.md': '# Index\n',
        'measure/tracks.md': '- [~] **Track: One**\n  *Link: [./tracks/one_1/](./tracks/one_1/)*\n',
        'measure/tracks/one_1/plan.md': '# Plan: no phases\n\nJust prose.\n',
      }, ['measure', 'measure/tracks', 'measure/tracks/one_1']),
      '/repo',
    )
    expect(snap.active).toBeNull()
    expect(snap.parseError).toContain('no "## Phase" heading')
  })

  test('a tracks.md with unparseable track lines gives the format parse error', async () => {
    const snap = await loadSnapshot(
      fakeHost({
        'measure/index.md': '# Index\n',
        'measure/tracks.md': '- [~] No name and no link follows\n',
      }, ['measure']),
      '/repo',
    )
    expect(snap.parseError).toBe('measure/tracks.md has track lines in no known format')
  })

  test('reads the archived index link for the plan when the link exists', async () => {
    const snap = await loadSnapshot(
      fakeHost({
        'measure/index.md': '# Index\n',
        'measure/tracks.md': '- [~] **Track: Guard**\n  *Link: [./archive/measure_guard_20261004/](./archive/measure_guard_20261004/)*\n',
        'measure/archive/measure_guard_20261004/index.md': GUARD_INDEX,
        'measure/archive/measure_guard_20261004/plan.md': GUARD_PLAN,
      }, ['measure', 'measure/archive', 'measure/archive/measure_guard_20261004']),
      '/repo',
    )
    expect(snap.active?.entry.id).toBe('measure_guard_20261004')
    expect(snap.active?.planPath).toBe('measure/archive/measure_guard_20261004/plan.md')
  })
})