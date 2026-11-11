// The parse rules, on real data and on the edge-case fixtures.
import { describe, expect, test } from 'vitest'
import {
  currentTask,
  findLink,
  isOpen,
  joinPath,
  parsePlan,
  parseTracks,
  position,
  selectActive,
} from './parse'
import type { Plan } from './types'
import {
  EDGE_PLAN,
  GUARD_INDEX,
  GUARD_PLAN,
  INDEX,
  NO_PHASE_PLAN,
  PLAN_ACTIVE_TASK,
  PLAN_NO_ACTIVE_TASK,
  TRACKS,
  TWO_ACTIVE_TRACKS,
} from './fixtures'

const allTasks = (plan: Plan) => plan.phases.flatMap(phase => phase.tasks)

describe('joinPath', () => {
  test('resolves . and .. segments', () => {
    expect(joinPath('measure', './tracks/a_1/')).toBe('measure/tracks/a_1')
    expect(joinPath('measure/tracks/a_1', '../../workflow.md')).toBe('measure/workflow.md')
  })
})

describe('findLink', () => {
  test('returns the first link on a line that matches the label regex', () => {
    expect(findLink(INDEX, /Tracks Registry/i)).toBe('./tracks.md')
  })

  test('returns the plan link from an archived track index', () => {
    expect(findLink(GUARD_INDEX, /\bplan\b/i)).toBe('./plan.md')
  })

  test('is null when no line matches', () => {
    expect(findLink(INDEX, /Nothing here/i)).toBeNull()
  })
})

describe('parseTracks', () => {
  test('reads both entry formats in the real tracks.md', () => {
    const tracks = parseTracks(TRACKS)
    expect(tracks.map(t => t.id)).toEqual([
      'lessons_learned_20260307',
      'visual_refresh_20260425',
      'scrum_tracks_20260525',
      'graph_integration_20260525',
      'track_sets_20261009',
      'measure_guard_20261004',
      'skill_distribution_repair_20261005',
    ])
    const visual = tracks.find(t => t.id === 'visual_refresh_20260425')
    expect(visual).toMatchObject({
      marker: 'x',
      name: 'Visual Refresh: Define Unique Identity',
      folder: 'archive/visual_refresh_20260425',
    })
    const guard = tracks.find(t => t.id === 'measure_guard_20261004')
    expect(guard).toMatchObject({ marker: 'x', folder: 'archive/measure_guard_20261004' })
  })

  test('skips cancelled-track entries that have no status marker', () => {
    const tracks = parseTracks(TRACKS)
    const ids = tracks.map(t => t.id)
    expect(ids).not.toContain('daily_automation_dashboard_20260527')
    expect(ids).not.toContain('agent_performance_benchmarking_20260527')
  })

  test('keeps track order with bold entries and linked entries mixed', () => {
    const tracks = parseTracks(TWO_ACTIVE_TRACKS)
    expect(tracks.map(t => t.id)).toEqual(['first_1', 'second_2', 'old_0'])
    expect(tracks.map(t => t.marker)).toEqual(['~', '~', 'x'])
    expect(tracks.map(t => t.folder)).toEqual(['tracks/first_1', 'tracks/second_2', 'archive/old_0'])
  })
})

describe('parsePlan', () => {
  test('counts only top-level lines under Phase headings in the real guard plan', () => {
    const plan = parsePlan(GUARD_PLAN)
    expect(plan.phases.map(p => p.title)).toEqual([
      'Phase S1: Plan context for the agent',
      'Phase S2: Progress band above the prompt',
      'Phase S3: Edit guard',
    ])
    expect(plan.phases[0]?.tasks.length).toBe(6)
    expect(plan.phases[0]?.checkpoint).toBe('ea3ed16')
    expect(currentTask(plan)?.text).toBe(
      'Task 1.5: Implement (Green) — parser, session start, rule section, task note `4f02889`',
    )
  })

  test('reads SHAs, checkpoints, and [b] owners in the edge plan', () => {
    const plan = parsePlan(EDGE_PLAN)
    expect(plan.phases.map(p => p.tasks.length)).toEqual([4, 2])
    expect(plan.phases[0]?.checkpoint).toBe('8e8d3fc')
    expect(plan.phases[1]?.checkpoint).toBeNull()
    const tasks = allTasks(plan)
    expect(tasks.map(t => t.sha)).toEqual(['aa591f4', '82b9e67', null, null, null, null])
    expect(tasks[2]?.deferredOwner).toBe('user')
    expect(tasks[3]?.deferredOwner).toBeNull()
    expect(currentTask(plan)?.text).toBe('Task: Write the parser')
  })

  test('a [b] task is open until it has a deferred:<owner> field', () => {
    const tasks = allTasks(parsePlan(EDGE_PLAN))
    expect(tasks.map(isOpen)).toEqual([false, false, false, true, true, true])
  })

  test('returns a plan with no phases for a plan that has no Phase heading', () => {
    const plan = parsePlan(NO_PHASE_PLAN)
    expect(plan.phases).toEqual([])
  })
})

describe('selectActive', () => {
  test('is null when no track has [~]', () => {
    const tracks = parseTracks(TWO_ACTIVE_TRACKS).map(t => ({ ...t, marker: 'x' as const }))
    expect(selectActive(tracks, new Map())).toBeNull()
  })

  test('selects the second track when only its plan has a [~] task', () => {
    const plans = new Map([
      ['first_1', parsePlan(PLAN_NO_ACTIVE_TASK)],
      ['second_2', parsePlan(PLAN_ACTIVE_TASK)],
    ])
    expect(selectActive(parseTracks(TWO_ACTIVE_TRACKS), plans)?.id).toBe('second_2')
  })

  test('falls back to the first [~] track when no plan has a [~] task', () => {
    const plans = new Map([
      ['first_1', parsePlan(PLAN_NO_ACTIVE_TASK)],
      ['second_2', parsePlan(PLAN_NO_ACTIVE_TASK)],
    ])
    expect(selectActive(parseTracks(TWO_ACTIVE_TRACKS), plans)?.id).toBe('first_1')
  })

  test('uses the real TRACKS when only archived tracks are present (no active)', () => {
    const tracks = parseTracks(TRACKS)
    expect(selectActive(tracks, new Map())).toBeNull()
  })
})

describe('position', () => {
  test('gives the [~] task of a 4-phase plan with a checkpoint', () => {
    const plan = parsePlan(EDGE_PLAN)
    const pos = position(plan)
    expect(pos.phase).toBe(2)
    expect(pos.phases).toBe(2)
    expect(pos.task).toBe(1)
    expect(pos.tasks).toBe(2)
    expect(pos.current?.marker).toBe('~')
  })

  test('is null when every task is closed', () => {
    const plan = parsePlan('## Phase 1: A\n\n- [x] Task: Done `1234567`\n')
    const pos = position(plan)
    expect(pos.current).toBeNull()
  })
})