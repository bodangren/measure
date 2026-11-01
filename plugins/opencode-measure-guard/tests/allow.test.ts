// P1: the allow list of measure/guard-allow.
// The new functions use a namespace import, so a missing export fails one case at a time.
import { describe, expect, test } from 'bun:test'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as parse from '../src/core/parse'
import * as guards from '../src/core/guards'
import { loadSnapshot } from '../src/snapshot'
import type { ToolBeforeEvent } from '../src/hooks/types'
import { fixturePlan, fixtureTracks, makeGuard, tempProject, withMeasure } from './fake'
import type { MeasureOptions } from './fake'

const ALLOW_TEXT = 'scripts/daily-report/work/\n'

/** The folder that the list allows, with a direct child and a sub-folder. */
const ALLOWED = ['scripts/daily-report/work/report.md', 'scripts/daily-report/work/sub/x.json']

/** The near misses of acceptance criterion 2. */
const DENIED = [
  'scripts/daily-report/collect.py',
  'scripts/daily-report/work.md',
  'scripts/daily-report/work-old/a.md',
  'scripts/daily-report/workx/a.md',
  'scripts/daily-report/work/../collect.py',
  'Scripts/daily-report/work/a.md',
]

/** The fixture plan with no [~] task. */
const noTaskPlan = (): string => fixturePlan().replace('- [~] Task', '- [ ] Task')

/** The fixture tracks.md with no [~] track. */
const noTrackTracks = (): string => fixtureTracks().replaceAll('- [~] **Track', '- [x] **Track')

/** A temp project with measure/ and the allow list file. */
const projectWithList = async (options: MeasureOptions = {}, list = ALLOW_TEXT): Promise<string> => {
  const root = await withMeasure(await tempProject(), options)
  writeFileSync(join(root, 'measure/guard-allow'), list)
  return root
}

let callID = 0

/** A write call of the OpenCode tool. */
const write = (path: string): ToolBeforeEvent => ({
  tool: 'write',
  sessionID: 'ses_1',
  agent: 'build',
  messageID: 'msg_1',
  id: `call_${++callID}`,
  input: { path, content: 'x' },
})

/** The deny text of a call; '' when the call resolves. */
const denyOf = async (call: Promise<void>): Promise<string> => {
  try {
    await call
    return ''
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

/** A snapshot for the pure cases, with the allow list under test. */
const snapshotOf = (root: string, allow: { folders: string[]; ignored: { line: number; text: string; reason: string }[] }) => ({
  root,
  hasMeasure: true,
  isRepo: true,
  tracksPath: null,
  tracks: [],
  active: null,
  inProgressCount: 0,
  parseError: null,
  allow,
})

/** The guard context of a loaded project. */
const contextOf = async (root: string, mode: 'guard' | 'strict' = 'guard') => ({
  snapshot: await loadSnapshot(root),
  mode,
  setupChoice: null,
  guardsOff: null,
})

describe('parseAllowList', () => {
  test('A1 keeps the valid folders once, in order, with no ignored line', () => {
    const text = [
      '# A comment counts as a line.',
      '',
      '  scripts/daily-report/work/  ',
      './assets/videos/',
      'a//b/',
      '.drafts/\r',
      'assets/videos/',
    ].join('\n')
    const list = parse.parseAllowList(text)
    expect(list.folders).toEqual(['scripts/daily-report/work', 'assets/videos', 'a/b', '.drafts'])
    expect(list.ignored).toEqual([])
  })

  test('A2 ignores each invalid entry with its line, text, and exact reason', () => {
    const text = [
      '# A comment counts as a line.',
      '',
      '/etc/',
      '/',
      'scripts/../src/',
      '..',
      'src/*/',
      'src/?/',
      'src/[ab]/',
      'src/{a,b}/',
      'scripts/daily-report/work',
      './',
    ].join('\n')
    const list = parse.parseAllowList(text)
    expect(list.folders).toEqual([])
    expect(list.ignored).toEqual([
      { line: 3, text: '/etc/', reason: 'absolute path' },
      { line: 4, text: '/', reason: 'absolute path' },
      { line: 5, text: 'scripts/../src/', reason: 'has a .. segment' },
      { line: 6, text: '..', reason: 'has a .. segment' },
      { line: 7, text: 'src/*/', reason: 'has a wildcard' },
      { line: 8, text: 'src/?/', reason: 'has a wildcard' },
      { line: 9, text: 'src/[ab]/', reason: 'has a wildcard' },
      { line: 10, text: 'src/{a,b}/', reason: 'has a wildcard' },
      { line: 11, text: 'scripts/daily-report/work', reason: 'not a folder (an entry ends with /)' },
      { line: 12, text: './', reason: 'names the project root' },
    ])
  })

  test('A2b applies the entry rules in order', () => {
    const list = parse.parseAllowList(['/../x/', '/*/', '../*/', 'src/*', '../', '.'].join('\n'))
    expect(list.ignored).toEqual([
      { line: 1, text: '/../x/', reason: 'absolute path' },
      { line: 2, text: '/*/', reason: 'absolute path' },
      { line: 3, text: '../*/', reason: 'has a .. segment' },
      { line: 4, text: 'src/*', reason: 'has a wildcard' },
      { line: 5, text: '../', reason: 'has a .. segment' },
      { line: 6, text: '.', reason: 'not a folder (an entry ends with /)' },
    ])
  })

  test('A3 keeps # inside an entry and gives the empty list for empty text', () => {
    expect(parse.parseAllowList('a#b/\n').folders).toEqual(['a#b'])
    expect(parse.parseAllowList('')).toEqual({ folders: [], ignored: [] })
  })
})

describe('edit guard', () => {
  test('B1 the allowed folder and a sub-folder resolve with no [~] task', async () => {
    const root = await projectWithList({ plan: noTaskPlan() })
    const guard = makeGuard(root)
    for (const path of ALLOWED) {
      await expect(guard.onToolBefore(write(join(root, path)))).resolves.toBeUndefined()
    }
    await expect(guard.onToolBefore(write(join(root, 'scripts/daily-report/collect.py')))).rejects.toThrow(/measure-guard/)
  })

  test('B2 each near miss is denied with the text of the same call without a list', async () => {
    const withList = await projectWithList({ plan: noTaskPlan() })
    const control = await withMeasure(await tempProject(), { plan: noTaskPlan() })
    const guarded = makeGuard(withList)
    const plain = makeGuard(control)
    for (const path of DENIED) {
      const denied = await denyOf(guarded.onToolBefore(write(join(withList, path))))
      const expected = await denyOf(plain.onToolBefore(write(join(control, path))))
      expect(denied).toContain('measure-guard: no task in the track')
      expect(denied).toBe(expected)
      expect(denied).not.toContain('guard-allow')
    }
  })

  test('B3 an allowed path resolves with no [~] track', async () => {
    const root = await projectWithList({ tracks: noTrackTracks() })
    await expect(makeGuard(root).onToolBefore(write(join(root, 'scripts/daily-report/work/report.md')))).resolves.toBeUndefined()
  })

  test('B3 src/a.ts keeps the no-track deny with and without the list', async () => {
    const withList = await projectWithList({ tracks: noTrackTracks() })
    const control = await withMeasure(await tempProject(), { tracks: noTrackTracks() })
    const denied = await denyOf(makeGuard(withList).onToolBefore(write(join(withList, 'src/a.ts'))))
    const expected = await denyOf(makeGuard(control).onToolBefore(write(join(control, 'src/a.ts'))))
    expect(denied).toContain('measure-guard: no track is in progress')
    expect(denied).toBe(expected)
    expect(denied).not.toContain('guard-allow')
  })

  test('B4 a [~] task keeps every path open', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    for (const path of [...ALLOWED, ...DENIED]) {
      await expect(guard.onToolBefore(write(join(root, path)))).resolves.toBeUndefined()
    }
  })

  test('B4 an ignored entry opens nothing, and one denied path denies a patch', async () => {
    const ignored = await projectWithList({ plan: noTaskPlan() }, 'src/*/\n')
    await expect(makeGuard(ignored).onToolBefore(write(join(ignored, 'src/a/x.ts')))).rejects.toThrow(/measure-guard/)

    const root = await projectWithList({ plan: noTaskPlan() })
    const patchText = '*** Begin Patch\n*** Add File: scripts/daily-report/work/a.md\n+x\n*** Add File: src/a.ts\n+y\n*** End Patch\n'
    const patch: ToolBeforeEvent = {
      tool: 'apply_patch',
      sessionID: 'ses_1',
      agent: 'build',
      messageID: 'msg_1',
      id: `call_${++callID}`,
      input: { patchText },
    }
    await expect(makeGuard(root).onToolBefore(patch)).rejects.toThrow(/measure-guard/)
  })

  test('B5 isAllowed matches both path forms by whole segments', async () => {
    const root = await tempProject()
    const snapshot = snapshotOf(root, { folders: ['scripts/daily-report/work'], ignored: [] })
    expect(guards.isAllowed(snapshot, join(root, 'scripts/daily-report/work/a.md'))).toBe(true)
    expect(guards.isAllowed(snapshot, 'scripts/daily-report/work/a.md')).toBe(true)
    expect(guards.isAllowed(snapshot, join(root, 'scripts/daily-report/work/../collect.py'))).toBe(false)
    expect(guards.isAllowed(snapshot, 'scripts/daily-report/work/../collect.py')).toBe(false)
    expect(guards.isAllowed(snapshot, join(root, 'scripts/daily-report/work-old/a.md'))).toBe(false)
    expect(guards.isAllowed(snapshot, `${root}2/scripts/daily-report/work/a.md`)).toBe(false)
    expect(guards.isAllowed(snapshot, join(root, 'scripts/daily-report/work'))).toBe(true)
  })
})

describe('end of turn', () => {
  test('C1 turnProblems drops the allowed path and keeps the denied one', async () => {
    const root = await projectWithList({ plan: noTaskPlan() })
    const snapshot = await loadSnapshot(root)
    const both = guards.turnProblems(snapshot, ['scripts/daily-report/work/r.md', 'src/a.ts'], [])
    expect(both.join('\n')).toContain('src/a.ts')
    expect(both.join('\n')).not.toContain('scripts/daily-report/work/r.md')
    expect(guards.turnProblems(snapshot, ['scripts/daily-report/work/r.md'], [])).toEqual([])
  })
})

describe('commit guard', () => {
  test('D1 a commit of allowed and measure/ paths passes with no [~] task', async () => {
    const root = await projectWithList({ plan: noTaskPlan() })
    const check = guards.commitDecision(
      await contextOf(root, 'strict'),
      { message: 'chore(jobs): Add the report', takesChanges: false },
      ['measure/tracks.md', 'scripts/daily-report/work/r.md'],
    )
    expect(check.decision).toBeNull()
  })

  test('D1 a commit that adds a denied path is denied and lists it', async () => {
    const root = await projectWithList({ plan: noTaskPlan() })
    const check = guards.commitDecision(
      await contextOf(root, 'strict'),
      { message: 'chore(jobs): Add the report', takesChanges: false },
      ['measure/tracks.md', 'scripts/daily-report/work/r.md', 'src/a.ts'],
    )
    expect(check.decision?.deny).toContain('src/a.ts')
  })

  test('D1 the deny does not name the allowed path', async () => {
    const root = await projectWithList({ plan: noTaskPlan() })
    const check = guards.commitDecision(
      await contextOf(root, 'strict'),
      { message: 'chore(jobs): Add the report', takesChanges: false },
      ['measure/tracks.md', 'scripts/daily-report/work/r.md', 'src/a.ts'],
    )
    expect(check.decision?.deny ?? '').not.toContain('scripts/daily-report/work/r.md')
  })

  test('D1 the message format check stays for an allowed path', async () => {
    const root = await projectWithList({ plan: noTaskPlan() })
    const check = guards.commitDecision(await contextOf(root, 'strict'), { message: 'add report', takesChanges: false }, [
      'scripts/daily-report/work/r.md',
    ])
    expect(check.decision?.deny).toContain('is not in the format')
  })
})

describe('TDD guard', () => {
  test('E1 tddDecision allows an allowed source file', async () => {
    const root = await projectWithList()
    expect(guards.tddDecision(await contextOf(root, 'strict'), null, join(root, 'scripts/daily-report/work/x.py'))).toBeNull()
  })

  test('E1 tddDecision still denies src/a.ts', async () => {
    const root = await projectWithList()
    const decision = guards.tddDecision(await contextOf(root, 'strict'), null, join(root, 'src/a.ts'))
    expect(decision?.deny).toContain('write a failing test first')
  })
})

describe('loadSnapshot', () => {
  test('F1 reads the folders of measure/guard-allow', async () => {
    const root = await projectWithList()
    expect((await loadSnapshot(root)).allow).toEqual({ folders: ['scripts/daily-report/work'], ignored: [] })
  })

  test('F1 gives the empty list when the file is absent', async () => {
    const root = await withMeasure(await tempProject())
    expect((await loadSnapshot(root)).allow).toEqual({ folders: [], ignored: [] })
  })

  test('F1 gives the empty list and no parse error for a folder at the path', async () => {
    const root = await withMeasure(await tempProject())
    mkdirSync(join(root, 'measure/guard-allow'))
    const snapshot = await loadSnapshot(root)
    expect(snapshot.allow).toEqual({ folders: [], ignored: [] })
    expect(snapshot.parseError).toBeNull()
  })

  test('F1 keeps the list when tracks.md is absent', async () => {
    const root = await projectWithList()
    rmSync(join(root, 'measure/tracks.md'))
    expect((await loadSnapshot(root)).allow).toEqual({ folders: ['scripts/daily-report/work'], ignored: [] })
  })

  test('F1 gives the empty list without measure/', async () => {
    expect((await loadSnapshot(await tempProject())).allow).toEqual({ folders: [], ignored: [] })
  })

  test('F1 keeps the list on a parseError', async () => {
    const root = await projectWithList({ tracks: '# Project Tracks\n\n- [~] Track one\n' })
    const snapshot = await loadSnapshot(root)
    expect(snapshot.parseError).not.toBeNull()
    expect(snapshot.allow).toEqual({ folders: ['scripts/daily-report/work'], ignored: [] })
  })
})

describe('statusLines', () => {
  test('G1 puts the list and the ignored lines directly before Guards', () => {
    const snapshot = snapshotOf('/repo', {
      folders: ['scripts/daily-report/work', 'assets/videos'],
      ignored: [{ line: 3, text: 'src/*/', reason: 'has a wildcard' }],
    })
    const lines = parse.statusLines(snapshot, null)
    const at = lines.indexOf('Guards: on')
    expect(at).toBeGreaterThan(1)
    expect(lines.slice(at - 2, at)).toEqual([
      'Allow list (measure/guard-allow): scripts/daily-report/work/, assets/videos/',
      '  ignored line 3: src/*/ (has a wildcard)',
    ])
  })

  test('G1 says no folders when only ignored lines exist', () => {
    const snapshot = snapshotOf('/repo', { folders: [], ignored: [{ line: 3, text: 'src/*/', reason: 'has a wildcard' }] })
    const lines = parse.statusLines(snapshot, null)
    const at = lines.indexOf('Guards: on')
    expect(lines[at - 2]).toBe('Allow list (measure/guard-allow): no folders')
    expect(lines[at - 1]).toBe('  ignored line 3: src/*/ (has a wildcard)')
  })

  test('G1 prints no list line for the empty list', () => {
    const lines = parse.statusLines(snapshotOf('/repo', { folders: [], ignored: [] }), null)
    expect(lines.some(line => line.startsWith('Allow list'))).toBe(false)
  })
})
