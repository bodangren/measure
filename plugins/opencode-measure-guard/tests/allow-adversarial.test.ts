// P1 adversarial: attacks on the allow list of measure/guard-allow.
// Every case probes spec.md Decision 3 to 11 with a near miss, a boundary,
// or a malformed input. The reference cases live in allow.test.ts.
import { describe, expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as guards from '../src/core/guards'
import * as parse from '../src/core/parse'
import { loadSnapshot } from '../src/snapshot'
import type { ToolBeforeEvent } from '../src/hooks/types'
import type { Snapshot } from '../src/types'
import { fixturePlan, fixtureTracks, makeGuard, tempProject, withMeasure } from './fake'
import type { MeasureOptions } from './fake'

const ALLOW = 'scripts/daily-report/work/\n'

/** The fixture plan with no [~] task. */
const noTaskPlan = (): string => fixturePlan().replace('- [~] Task', '- [ ] Task')

/** The fixture tracks.md with no [~] track. */
const noTrackTracks = (): string => fixtureTracks().replaceAll('- [~] **Track', '- [x] **Track')

/** A temp project with measure/ and a chosen allow list text. */
const project = async (options: MeasureOptions = {}, list = ALLOW): Promise<string> => {
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

/** An apply_patch call for the given patch text. */
const patch = (patchText: string): ToolBeforeEvent => ({
  tool: 'apply_patch',
  sessionID: 'ses_1',
  agent: 'build',
  messageID: 'msg_1',
  id: `call_${++callID}`,
  input: { patchText },
})

/** A multiedit call for one file. */
const multi = (filePath: string, edits: { oldString: string; newString: string }[]): ToolBeforeEvent => ({
  tool: 'multiedit',
  sessionID: 'ses_1',
  agent: 'build',
  messageID: 'msg_1',
  id: `call_${++callID}`,
  input: { filePath, edits },
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

/** A snapshot for the pure cases. */
const snapshotOf = (root: string, folders: string[], ignored: Snapshot['allow']['ignored'] = []): Snapshot => ({
  root,
  hasMeasure: true,
  isRepo: true,
  tracksPath: null,
  tracks: [],
  active: null,
  inProgressCount: 0,
  parseError: null,
  allow: { folders, ignored },
})

describe('prefix and look-alike tricks', () => {
  test('V1 the guard denies every near miss of the allowed folder', async () => {
    const withList = await project({ plan: noTaskPlan() })
    const control = await withMeasure(await tempProject(), { plan: noTaskPlan() })
    const guarded = makeGuard(withList)
    const plain = makeGuard(control)
    const nearMisses = [
      'scripts/daily-report/work-old/a.md',
      'scripts/daily-report/workx/a.md',
      'scripts/daily-report/work.md',
      'scripts/daily-report/Work/a.md',
      'scripts/daily-report/work\u2215a.md',
      'scripts/daily-report/\uff57ork/a.md',
      'scripts/daily-report/work\u0000x/a.md',
    ]
    for (const path of nearMisses) {
      const denied = await denyOf(guarded.onToolBefore(write(join(withList, path))))
      const expected = await denyOf(plain.onToolBefore(write(join(control, path))))
      expect(denied).toContain('measure-guard')
      expect(denied).toBe(expected)
      expect(denied).not.toContain('guard-allow')
    }
  })

  test('V2 the guard allows the folder itself, also with a trailing slash or /.', async () => {
    const root = await project({ plan: noTaskPlan() })
    const guarded = makeGuard(root)
    for (const path of [
      `${root}/scripts/daily-report/work`,
      `${root}/scripts/daily-report/work/`,
      `${root}/scripts/daily-report/work/.`,
      `${root}/scripts/daily-report/work/a.md/`,
    ]) {
      await expect(guarded.onToolBefore(write(path))).resolves.toBeUndefined()
    }
  })
})

describe('entries that could widen the match', () => {
  test('V3 the root-shaped entries are ignored with exact reasons and lines', () => {
    const list = parse.parseAllowList('/\n//\n.\n./\n./.\nmeasure/\n')
    expect(list.folders).toEqual(['measure'])
    expect(list.ignored).toEqual([
      { line: 1, text: '/', reason: 'absolute path' },
      { line: 2, text: '//', reason: 'absolute path' },
      { line: 3, text: '.', reason: 'not a folder (an entry ends with /)' },
      { line: 4, text: './', reason: 'names the project root' },
      { line: 5, text: './.', reason: 'not a folder (an entry ends with /)' },
    ])
  })

  test('V4 a measure/ entry opens measure/ only, not a look-alike', () => {
    const snapshot = snapshotOf('/repo', ['measure'])
    expect(guards.isAllowed(snapshot, '/repo/measure/tracks.md')).toBe(true)
    expect(guards.isAllowed(snapshot, '/repo/measurex/a.md')).toBe(false)
    expect(guards.isAllowed(snapshot, '/repo/measure.md')).toBe(false)
  })

  test('V5 a BOM at the start does not hide the first entry', () => {
    expect(parse.parseAllowList('\uFEFFwork/\n').folders).toEqual(['work'])
    expect(parse.parseAllowList('\uFEFF# comment\nwork/\n').folders).toEqual(['work'])
  })

  test('V6 CR-only line ends are not a separator', () => {
    const list = parse.parseAllowList('work/\rassets/\r')
    expect(list.folders).toEqual(['work/\rassets'])
    expect(list.ignored).toEqual([])
    const snapshot = snapshotOf('/repo', list.folders)
    expect(guards.isAllowed(snapshot, '/repo/work/a.md')).toBe(false)
    expect(guards.isAllowed(snapshot, '/repo/assets/a.md')).toBe(false)
  })

  test('V7 a NUL byte in an entry stays in the folder name', () => {
    const list = parse.parseAllowList('work\u0000x/\n')
    expect(list.folders).toEqual(['work\u0000x'])
    expect(guards.isAllowed(snapshotOf('/repo', list.folders), '/repo/work/a.md')).toBe(false)
  })

  test('V8 a 10 000-character entry is kept without a crash', () => {
    const entry = `${'a'.repeat(9999)}/`
    expect(parse.parseAllowList(entry).folders).toEqual([entry.slice(0, -1)])
  })

  test('V9 a 10 000-line file counts lines from 1 and keeps a folder once', () => {
    const lines = Array.from({ length: 10000 }, (_, i) => (i === 9999 ? 'src/*' : i % 2 === 0 ? '# c' : 'work/'))
    const list = parse.parseAllowList(lines.join('\n'))
    expect(list.folders).toEqual(['work'])
    expect(list.ignored).toEqual([{ line: 10000, text: 'src/*', reason: 'has a wildcard' }])
  })

  test('V10 a # after the entry is data, not a comment', () => {
    const list = parse.parseAllowList('work/#x/\n')
    expect(list.folders).toEqual(['work/#x'])
    expect(guards.isAllowed(snapshotOf('/repo', list.folders), '/repo/work/a.md')).toBe(false)
  })
})

describe('.. and path forms', () => {
  test('V11 .. in the path resolves before the match, in both forms', () => {
    const snapshot = snapshotOf('/repo', ['scripts/daily-report/work'])
    expect(guards.isAllowed(snapshot, '/repo/scripts/daily-report/work/../collect.py')).toBe(false)
    expect(guards.isAllowed(snapshot, 'scripts/daily-report/work/../collect.py')).toBe(false)
    expect(guards.isAllowed(snapshot, '/repo/scripts/daily-report/work/../../src/a.ts')).toBe(false)
    expect(guards.isAllowed(snapshot, '../src/a.ts')).toBe(false)
    expect(guards.isAllowed(snapshot, '/repo/scripts/daily-report/work/./a.md')).toBe(true)
    expect(guards.isAllowed(snapshot, '/repo/scripts/daily-report/work//a.md')).toBe(true)
  })

  test('V12 a sibling root and the root itself do not match', () => {
    const snapshot = snapshotOf('/repo', ['scripts/daily-report/work'])
    expect(guards.isAllowed(snapshot, '/repo2/scripts/daily-report/work/a.md')).toBe(false)
    expect(guards.isAllowed(snapshot, '/repo')).toBe(false)
    expect(guards.isAllowed(snapshot, '/repos/scripts/daily-report/work/a.md')).toBe(false)
  })

  test('V13 the guard denies a .. escape through a real tool call', async () => {
    const root = await project({ plan: noTaskPlan() })
    await expect(
      makeGuard(root).onToolBefore(write(join(root, 'scripts/daily-report/work/../collect.py'))),
    ).rejects.toThrow(/measure-guard/)
    const text = `*** Begin Patch\n*** Add File: ${root}/scripts/daily-report/work/../../src/a.ts\n+x\n*** End Patch\n`
    await expect(makeGuard(root).onToolBefore(patch(text))).rejects.toThrow(/measure-guard/)
  })
})

describe('multi-file calls', () => {
  test('V14 a patch with one allowed and one denied path is denied', async () => {
    const root = await project({ plan: noTaskPlan() })
    const allowedFirst = '*** Begin Patch\n*** Add File: scripts/daily-report/work/a.md\n+x\n*** Add File: src/a.ts\n+y\n*** End Patch\n'
    const deniedFirst = '*** Begin Patch\n*** Add File: src/a.ts\n+y\n*** Add File: scripts/daily-report/work/a.md\n+x\n*** End Patch\n'
    await expect(makeGuard(root).onToolBefore(patch(allowedFirst))).rejects.toThrow(/measure-guard/)
    await expect(makeGuard(root).onToolBefore(patch(deniedFirst))).rejects.toThrow(/measure-guard/)
  })

  test('V15 a patch with allowed and measure/ paths resolves', async () => {
    const root = await project({ plan: noTaskPlan() })
    const text = '*** Begin Patch\n*** Add File: scripts/daily-report/work/a.md\n+x\n*** Add File: measure/tracks.md\n+y\n*** End Patch\n'
    await expect(makeGuard(root).onToolBefore(patch(text))).resolves.toBeUndefined()
  })

  test('V16 a multiedit on a denied path is denied even when its text names the allowed path', async () => {
    const root = await project({ plan: noTaskPlan() })
    const edits = [{ oldString: 'a', newString: 'scripts/daily-report/work/a.md' }]
    await expect(makeGuard(root).onToolBefore(multi(join(root, 'src/a.ts'), edits))).rejects.toThrow(/measure-guard/)
    await expect(
      makeGuard(root).onToolBefore(multi(join(root, 'scripts/daily-report/work/a.md'), edits)),
    ).resolves.toBeUndefined()
  })
})

describe('loader with a hostile file', () => {
  test('V17 an ignored entry of a hostile file opens nothing', async () => {
    const root = await project({ plan: noTaskPlan() }, '/\n./\nscripts/daily-report/work/../\nscripts/*/\n')
    const snapshot = await loadSnapshot(root)
    expect(snapshot.allow.folders).toEqual([])
    expect(snapshot.allow.ignored.map(line => line.reason)).toEqual([
      'absolute path',
      'names the project root',
      'has a .. segment',
      'has a wildcard',
    ])
    await expect(
      makeGuard(root).onToolBefore(write(join(root, 'scripts/daily-report/work/a.md'))),
    ).rejects.toThrow(/measure-guard/)
  })

  test('V18 a CR-only file loads one folder and opens no real path', async () => {
    const root = await project({ plan: noTaskPlan() }, 'scripts/daily-report/work/\rsrc/\r')
    const snapshot = await loadSnapshot(root)
    expect(snapshot.allow.folders).toEqual(['scripts/daily-report/work/\rsrc'])
    expect(guards.isAllowed(snapshot, join(root, 'src/a.ts'))).toBe(false)
    expect(guards.isAllowed(snapshot, join(root, 'scripts/daily-report/work/a.md'))).toBe(false)
  })

  test('V19 a no-track project denies a near miss and allows the folder', async () => {
    const root = await project({ tracks: noTrackTracks() })
    const guarded = makeGuard(root)
    await expect(guarded.onToolBefore(write(join(root, 'scripts/daily-report/workx/a.md')))).rejects.toThrow(
      /no track is in progress/,
    )
    await expect(guarded.onToolBefore(write(join(root, 'scripts/daily-report/work/a.md')))).resolves.toBeUndefined()
  })
})
