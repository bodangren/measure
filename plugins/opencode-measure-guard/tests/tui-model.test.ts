// S8: the terminal model (band, sidebar, refresh rule).
import { describe, expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadSnapshot } from '../src/snapshot'
import type { StateFile } from '../src/state'
import { REFRESH_EVENTS, bandModel, needsRefresh, sidebarLines, watchedPaths } from '../src/tui/model'
import { TRACK, tempProject, withMeasure } from './fake'

const stateOf = (root: string, over: Partial<StateFile> = {}): StateFile => ({
  root,
  mode: 'guard',
  guardsOff: null,
  problems: [],
  updatedAt: '2026-10-21T00:00:00.000Z',
  ...over,
})

describe('bandModel', () => {
  test('shows the band line dim, with the track and the [~] task', async () => {
    const root = await withMeasure(await tempProject())
    const band = bandModel(await loadSnapshot(root), stateOf(root))
    expect(band).not.toBeNull()
    const [line] = band?.lines ?? []
    expect(line?.tone).toBe('dim')
    expect(line?.text).toContain('Measure · OpenCode plugin')
    expect(line?.text).toMatch(/Phase \d+\/\d+ · Task \d+\/\d+ \[~\]/)
  })

  test('adds a warn line with the end-of-turn problems, and the bypass in the band line', async () => {
    const root = await withMeasure(await tempProject())
    const band = bandModel(await loadSnapshot(root), stateOf(root, { guardsOff: 'session', problems: ['p1', 'p2'] }))
    expect(band?.lines.length).toBe(2)
    expect(band?.lines[0]?.text).toContain('guards off for this session')
    expect(band?.lines[1]).toEqual({ text: 'End of turn: p1 · p2', tone: 'warn' })
  })

  test('a parse error turns the band line to warn', async () => {
    const root = await withMeasure(await tempProject(), { tracks: 'no track lines here\n' })
    const band = bandModel(await loadSnapshot(root), null)
    expect(band?.lines[0]?.tone).toBe('warn')
    expect(band?.lines[0]?.text).toContain('cannot read the Measure files')
  })

  test('a git repository without measure/ shows the setup text and the command hints', async () => {
    const root = await tempProject()
    const band = bandModel(await loadSnapshot(root), null)
    expect(band?.lines.length).toBe(1)
    expect(band?.lines[0]?.text).toContain('measure/')
    expect(band?.lines[0]?.text).toContain('/measure-setup')
    expect(band?.lines[0]?.text).toContain('/measure-off')
  })

  test('outside a git repository, and with no snapshot yet, the band stays hidden', async () => {
    const root = mkdtempSync(join(tmpdir(), 'measure-guard-norepo-'))
    expect(bandModel(await loadSnapshot(root), null)).toBeNull()
    expect(bandModel(null, null)).toBeNull()
  })

  test('the state file of another root is ignored', async () => {
    const root = await withMeasure(await tempProject())
    const band = bandModel(await loadSnapshot(root), stateOf('/elsewhere', { problems: ['p1'] }))
    expect(band?.lines.length).toBe(1)
  })
})

describe('sidebarLines', () => {
  test('starts with the Measure title and holds the status lines with the bypass', async () => {
    const root = await withMeasure(await tempProject())
    const lines = sidebarLines(await loadSnapshot(root), stateOf(root, { guardsOff: 'repo' }))
    expect(lines[0]).toBe('Measure')
    expect(lines.join('\n')).toContain('OpenCode plugin')
    expect(lines.join('\n')).toContain('off for this repository')
  })

  test('says so without measure/', async () => {
    expect(sidebarLines(await loadSnapshot(await tempProject()), null).join('\n')).toContain('no measure/ folder')
  })
})

describe('refresh rule', () => {
  test('watchedPaths names the Measure files of the snapshot and the state file', async () => {
    const root = await withMeasure(await tempProject())
    const paths = watchedPaths(root, await loadSnapshot(root), '/state/x.json')
    expect(paths).toContain(join(root, 'measure/index.md'))
    expect(paths).toContain(join(root, 'measure/tracks.md'))
    expect(paths).toContain(join(root, 'measure/tracks', TRACK, 'plan.md'))
    expect(paths).toContain('/state/x.json')
    expect(watchedPaths(root, null, '/state/x.json')).toEqual([join(root, 'measure/index.md'), join(root, 'measure/tracks.md'), '/state/x.json'])
  })

  test('needsRefresh sees a changed, a new, and a removed file', () => {
    expect(needsRefresh({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(false)
    expect(needsRefresh({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(true)
    expect(needsRefresh({ a: 1 }, { a: 1, b: 0 })).toBe(true)
    expect(needsRefresh({ a: 1, b: 2 }, { a: 1 })).toBe(true)
  })

  test('the refresh events include file edits and the turn end', () => {
    expect(REFRESH_EVENTS.has('file.edited')).toBe(true)
    expect(REFRESH_EVENTS.has('session.execution.succeeded')).toBe(true)
    expect(REFRESH_EVENTS.has('session.text.delta')).toBe(false)
  })
})
