// S5: the TDD guard (strict mode) and the Red state from the after hook.
import { describe, expect, test } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { callFailed, exitCodeOf, resultText } from '../src/hooks/tools'
import type { ToolAfterEvent, ToolBeforeEvent } from '../src/hooks/types'
import { makeGuard, tempProject, withMeasure } from './fake'

const edit = (filePath: string, id = 'call_1'): ToolBeforeEvent => ({
  tool: 'edit',
  sessionID: 'ses_1',
  agent: 'build',
  messageID: 'msg_1',
  id,
  input: { path: filePath, oldString: 'a', newString: 'b' },
})

const shell = (command: string, id = 'call_2'): ToolBeforeEvent => ({ ...edit('x', id), tool: 'shell', input: { command } })

const completed = (event: ToolBeforeEvent, exit = 0): ToolAfterEvent => ({
  tool: event.tool,
  sessionID: event.sessionID,
  agent: event.agent,
  messageID: event.messageID,
  id: event.id,
  input: event.input,
  status: 'completed',
  result: { output: undefined, content: [{ type: 'text', text: 'ran' }], metadata: { status: 'completed', truncated: false, exit } },
})

/** A project with a [~] task, a source file, and a test file. */
const project = async (): Promise<{ root: string; source: string; testFile: string }> => {
  const root = await withMeasure(await tempProject())
  mkdirSync(join(root, 'src'), { recursive: true })
  const source = join(root, 'src/a.ts')
  const testFile = join(root, 'src/a.test.ts')
  writeFileSync(source, 'a')
  writeFileSync(testFile, 'a')
  return { root, source, testFile }
}

describe('shell result helpers', () => {
  test('exitCodeOf reads metadata.exit or metadata.exitCode', () => {
    expect(exitCodeOf({ metadata: { exit: 2 } })).toBe(2)
    expect(exitCodeOf({ metadata: { exitCode: 1 } })).toBe(1)
    expect(exitCodeOf({ metadata: { exit: 'x' } })).toBeNull()
    expect(exitCodeOf({})).toBeNull()
    expect(exitCodeOf(null)).toBeNull()
  })

  test('callFailed: an error status, or an exit code that is not 0', () => {
    expect(callFailed('error', null)).toBe(true)
    expect(callFailed('completed', { metadata: { exit: 1 } })).toBe(true)
    expect(callFailed('completed', { metadata: { exit: 0 } })).toBe(false)
    expect(callFailed('completed', { output: 'ok' })).toBe(false)
  })

  test('resultText: the output string, else the text parts of content', () => {
    expect(resultText({ output: 'out' })).toBe('out')
    expect(resultText({ content: [{ type: 'text', text: 'a' }, { type: 'image' }, { type: 'text', text: 'b' }] })).toBe('a\nb')
    expect(resultText({ content: 'plain' })).toBe('plain')
    expect(resultText(null)).toBe('')
  })
})

describe('TDD guard', () => {
  test('strict: a source edit before the Red phase is denied; a test file edit passes', async () => {
    const { root, source, testFile } = await project()
    const guard = makeGuard(root, 'strict')
    await expect(guard.onToolBefore(edit(source))).rejects.toThrow(/write a failing test first/)
    await expect(guard.onToolBefore(edit(testFile))).resolves.toBeUndefined()
  })

  test('strict: the deny names the [~] task and what is still to do', async () => {
    const { root, source } = await project()
    const guard = makeGuard(root, 'strict')
    const reason = await guard.onToolBefore(edit(source)).catch((error: Error) => error.message)
    expect(reason).toContain('Task 5.2')
    expect(reason).toContain('change a test file')
    expect(reason).toContain('run the tests and see them fail')
  })

  test('strict: a test change alone, or a failed command that is no test, is not enough', async () => {
    const { root, source, testFile } = await project()
    const guard = makeGuard(root, 'strict')
    const testEdit = edit(testFile)
    await guard.onToolBefore(testEdit)
    await guard.onToolAfter(completed(testEdit))
    const ls = shell('ls nothing')
    await guard.onToolBefore(ls)
    await guard.onToolAfter(completed(ls, 2))
    await expect(guard.onToolBefore(edit(source))).rejects.toThrow(/run the tests and see them fail/)
  })

  test('strict: a test change and a failed test command open the source edits', async () => {
    const { root, source, testFile } = await project()
    const guard = makeGuard(root, 'strict')
    const testEdit = edit(testFile)
    await guard.onToolBefore(testEdit)
    await guard.onToolAfter(completed(testEdit))
    const run = shell('bun test')
    await guard.onToolBefore(run)
    await guard.onToolAfter(completed(run, 1))
    await expect(guard.onToolBefore(edit(source))).resolves.toBeUndefined()
  })

  test('strict: a failed test command with an error status counts too', async () => {
    const { root, source, testFile } = await project()
    const guard = makeGuard(root, 'strict')
    const testEdit = edit(testFile)
    await guard.onToolBefore(testEdit)
    await guard.onToolAfter(completed(testEdit))
    const run = shell('npm test')
    await guard.onToolBefore(run)
    await guard.onToolAfter({ ...completed(run), status: 'error', error: { message: 'exit 1' } } as ToolAfterEvent)
    await expect(guard.onToolBefore(edit(source))).resolves.toBeUndefined()
  })

  test('strict: Markdown files and files inside measure/ pass; guard mode never checks', async () => {
    const { root, source } = await project()
    const strict = makeGuard(root, 'strict')
    await expect(strict.onToolBefore(edit(join(root, 'README.md')))).resolves.toBeUndefined()
    await expect(strict.onToolBefore(edit(join(root, 'measure/tracks.md')))).resolves.toBeUndefined()
    await expect(makeGuard(root, 'guard').onToolBefore(edit(source))).resolves.toBeUndefined()
  })
})
