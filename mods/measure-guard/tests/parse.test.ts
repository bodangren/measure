// S1: the parse rules, on real data and on the edge-case fixtures.
import { describe, expect, test } from 'claude-code/testing'
import {
  currentTask,
  isOpen,
  joinPath,
  parseMode,
  parsePlan,
  parseTracks,
  selectActive,
} from '../hooks/parse'
import type { Plan } from '../types'
import { EDGE_PLAN, PLAN_ACTIVE_TASK, PLAN_NO_ACTIVE_TASK, TWO_ACTIVE_TRACKS } from './fixtures/plans'
import { BENCHMARK_PLAN, GUARD_PLAN, TRACKS } from './fixtures/real'

const allTasks = (plan: Plan) => plan.phases.flatMap(phase => phase.tasks)

describe('parseMode', () => {
  test('is guard when unset or unknown', () => {
    expect(parseMode(undefined)).toBe('guard')
    expect(parseMode('bogus')).toBe('guard')
    expect(parseMode('advise')).toBe('advise')
    expect(parseMode('strict')).toBe('strict')
  })
})

describe('joinPath', () => {
  test('resolves . and .. segments', () => {
    expect(joinPath('/repo/measure', './tracks/a_1/')).toBe('/repo/measure/tracks/a_1')
    expect(joinPath('/repo/measure/tracks/a_1', '../../workflow.md')).toBe('/repo/measure/workflow.md')
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
      'daily_automation_dashboard_20260527',
      'track_dependency_graph_20260527',
      'multi_project_portfolio_view_20260527',
      'agent_performance_benchmarking_20260527',
      'measure_guard_20261004',
    ])
    const visual = tracks.find(t => t.id === 'visual_refresh_20260425')
    expect(visual).toMatchObject({ marker: 'x', name: 'Visual Refresh: Define Unique Identity', folder: 'archive/visual_refresh_20260425' })
    const guard = tracks.find(t => t.id === 'measure_guard_20261004')
    expect(guard).toMatchObject({ marker: '~', folder: 'tracks/measure_guard_20261004' })
    expect(guard?.name).toStartWith('measure-guard')
  })
})

describe('parsePlan', () => {
  test('counts only top-level lines under Phase headings in the real benchmarking plan', () => {
    const plan = parsePlan(BENCHMARK_PLAN)
    expect(plan.phases.map(p => p.title)).toEqual([
      'Phase 1: Harness',
      'Phase 2: Scoring',
      'Phase 3: Reporting',
      'Phase 4: Verification',
    ])
    expect(plan.phases.map(p => p.tasks.length)).toEqual([3, 3, 3, 3])
    expect(plan.phases[0]?.tasks[0]?.sha).toBe('82b9e67')
    expect(currentTask(plan)).toBeNull()
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
})

describe('selectActive', () => {
  test('prefers the [~] track whose plan has a [~] task (real data)', () => {
    const plans = new Map([
      ['agent_performance_benchmarking_20260527', parsePlan(BENCHMARK_PLAN)],
      ['measure_guard_20261004', parsePlan(GUARD_PLAN)],
    ])
    expect(selectActive(parseTracks(TRACKS), plans)?.id).toBe('measure_guard_20261004')
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

  test('is null when no track has [~]', () => {
    const tracks = parseTracks(TWO_ACTIVE_TRACKS).map(t => ({ ...t, marker: 'x' as const }))
    expect(selectActive(tracks, new Map())).toBeNull()
  })
})
