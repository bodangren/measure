// S4: the edit guard on the tool hooks.
import { describe, expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SETUP_DENY_OPENCODE, applyMultiEdit, commandOf, fileEditOf, writtenPaths } from '../src/hooks/tools'
import type { ToolBeforeEvent } from '../src/hooks/types'
import { TRACK, makeGuard, tempProject, withMeasure } from './fake'

const edit = (filePath: string, sessionID = 'ses_1', tool = 'edit'): ToolBeforeEvent => ({
  tool,
  sessionID,
  agent: 'build',
  messageID: 'msg_1',
  id: 'call_1',
  input: tool === 'write' ? { filePath, content: 'b' } : { filePath, oldString: 'a', newString: 'b' },
})

const noTask = (root: string): void => {
  const plan = join(root, 'measure/tracks', TRACK, 'plan.md')
  writeFileSync(plan, readFileSync(plan, 'utf8').replace('- [~] Task', '- [ ] Task'))
}

describe('writtenPaths', () => {
  test('edit, write, and multiedit name filePath; relative paths resolve against the root', () => {
    expect(writtenPaths('edit', { filePath: '/r/a.ts', oldString: 'a', newString: 'b' }, '/r')).toEqual(['/r/a.ts'])
    expect(writtenPaths('write', { filePath: 'src/a.ts', content: '' }, '/r')).toEqual(['/r/src/a.ts'])
    expect(writtenPaths('multiedit', { filePath: '/r/a.ts', edits: [] }, '/r')).toEqual(['/r/a.ts'])
    expect(writtenPaths('write', { path: 'b.txt', content: '' }, '/r')).toEqual(['/r/b.txt'])
    expect(writtenPaths('read', { filePath: '/r/a.ts' }, '/r')).toEqual([])
    expect(writtenPaths('edit', { nope: 1 }, '/r')).toEqual([])
  })

  test('apply_patch names every file of the patch', () => {
    const patchText = '*** Begin Patch\n*** Update File: src/a.ts\n@@\n-a\n+b\n*** Add File: /r/new.ts\n+x\n*** Delete File: old.ts\n*** End Patch\n'
    expect(writtenPaths('apply_patch', { patchText }, '/r')).toEqual(['/r/src/a.ts', '/r/new.ts', '/r/old.ts'])
  })
})

describe('fileEditOf, applyMultiEdit, commandOf', () => {
  test('maps the OpenCode inputs to the core edits', () => {
    expect(fileEditOf('edit', { filePath: 'x', oldString: 'a', newString: 'b', replaceAll: true })).toEqual({ tool: 'Edit', old_string: 'a', new_string: 'b', replace_all: true })
    expect(fileEditOf('write', { filePath: 'x', content: 'c' })).toEqual({ tool: 'Write', content: 'c' })
    expect(fileEditOf('multiedit', { filePath: 'x', edits: [] })).toBeNull()
    expect(applyMultiEdit({ edits: [{ oldString: 'a', newString: 'b' }, { oldString: 'b', newString: 'c' }] }, 'a')).toBe('c')
    expect(applyMultiEdit({ edits: [{ oldString: 'z', newString: 'b' }] }, 'a')).toBeNull()
    expect(commandOf({ command: 'git status' })).toBe('git status')
    expect(commandOf({})).toBeNull()
  })
})

describe('edit guard', () => {
  test('an edit outside measure/ with a [~] task passes', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    await expect(guard.onToolBefore(edit(join(root, 'src/a.ts')))).resolves.toBeUndefined()
  })

  test('an edit outside measure/ with no [~] task is denied with the next action', async () => {
    const root = await withMeasure(await tempProject())
    noTask(root)
    const guard = makeGuard(root)
    await expect(guard.onToolBefore(edit(join(root, 'src/a.ts')))).rejects.toThrow(/Mark the next task `\[~\]`/)
    await expect(guard.onToolBefore(edit(join(root, 'src/a.ts'), 'ses_1', 'write'))).rejects.toThrow(/measure-guard/)
  })

  test('edits inside measure/, in advise mode, and with the bypass pass', async () => {
    const root = await withMeasure(await tempProject())
    noTask(root)
    await expect(makeGuard(root).onToolBefore(edit(join(root, 'measure/tracks.md')))).resolves.toBeUndefined()
    await expect(makeGuard(root, 'advise').onToolBefore(edit(join(root, 'src/a.ts')))).resolves.toBeUndefined()
    const guard = makeGuard(root)
    await guard.bypass.set(root, 'session')
    await expect(guard.onToolBefore(edit(join(root, 'src/a.ts')))).resolves.toBeUndefined()
  })

  test('a repository without measure/ gets the setup deny once per session', async () => {
    const root = await tempProject()
    const guard = makeGuard(root)
    await expect(guard.onToolBefore(edit(join(root, 'a.ts')))).rejects.toThrow(SETUP_DENY_OPENCODE)
    await expect(guard.onToolBefore(edit(join(root, 'a.ts')))).resolves.toBeUndefined()
    await expect(guard.onToolBefore(edit(join(root, 'a.ts'), 'ses_2'))).rejects.toThrow(/no measure\/ folder/)
  })

  test('an apply_patch that touches a file outside measure/ is guarded too', async () => {
    const root = await withMeasure(await tempProject())
    noTask(root)
    const guard = makeGuard(root)
    const patch: ToolBeforeEvent = { ...edit('x'), tool: 'apply_patch', input: { patchText: `*** Begin Patch\n*** Update File: ${root}/a.ts\n@@\n-a\n+b\n*** End Patch\n` } }
    await expect(guard.onToolBefore(patch)).rejects.toThrow(/measure-guard/)
  })
})
