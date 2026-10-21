// S2: the snapshot loader reads a project's Measure files with Node APIs.
import { describe, expect, test } from 'bun:test'
import { gitStatus, isGitRepo, loadSnapshot, planPathOf } from '../src/snapshot'
import { tempProject, withMeasure } from './fake'

describe('loadSnapshot', () => {
  test('reads the tracks, the active plan, and the counts of a real project', async () => {
    const root = await withMeasure(await tempProject())
    const snapshot = await loadSnapshot(root)
    expect(snapshot.root).toBe(root)
    expect(snapshot.hasMeasure).toBe(true)
    expect(snapshot.isRepo).toBe(true)
    expect(snapshot.tracksPath).toBe(`${root}/measure/tracks.md`)
    expect(snapshot.tracks.length).toBeGreaterThan(3)
    expect(snapshot.inProgressCount).toBe(1)
    expect(snapshot.active?.entry.id).toBe('opencode_plugin_20261021')
    expect(snapshot.active?.planPath).toBe(`${root}/measure/tracks/opencode_plugin_20261021/plan.md`)
    expect(snapshot.active?.plan.phases.length).toBe(9)
    expect(snapshot.parseError).toBeNull()
  })

  test('a project without measure/ has no Measure and no error', async () => {
    const root = await tempProject()
    const snapshot = await loadSnapshot(root)
    expect(snapshot.hasMeasure).toBe(false)
    expect(snapshot.isRepo).toBe(true)
    expect(snapshot.active).toBeNull()
    expect(snapshot.parseError).toBeNull()
  })

  test('a tracks.md with lines in no known format is a parse error', async () => {
    const root = await withMeasure(await tempProject(), { tracks: '# Tracks\n\n- [~] Track with no link\n' })
    const snapshot = await loadSnapshot(root)
    expect(snapshot.hasMeasure).toBe(true)
    expect(snapshot.parseError).toContain('no known format')
  })

  test('an active track without a plan is a parse error', async () => {
    const root = await withMeasure(await tempProject(), { dropPlan: true })
    const snapshot = await loadSnapshot(root)
    expect(snapshot.parseError).toContain('no plan.md')
  })

  test('planPathOf follows the index link, else plan.md, else null', async () => {
    const root = await withMeasure(await tempProject())
    expect(await planPathOf(`${root}/measure/tracks/opencode_plugin_20261021`)).toBe(
      `${root}/measure/tracks/opencode_plugin_20261021/plan.md`,
    )
    expect(await planPathOf(`${root}/measure/tracks/none`)).toBeNull()
  })
})

describe('git', () => {
  test('isGitRepo and gitStatus see the temp repository', async () => {
    const root = await withMeasure(await tempProject())
    expect(await isGitRepo(root)).toBe(true)
    const lines = await gitStatus(root)
    expect(lines.some(line => line.endsWith('measure/tracks.md'))).toBe(true)
    expect(await isGitRepo('/')).toBe(false)
    expect(await gitStatus('/')).toEqual([])
  })
})
