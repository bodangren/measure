// S5: the commit guard (strict mode) and the commit reminder.
import { describe, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { commitFiles, commitShaOf, resultText } from '../src/hooks/tools'
import type { ToolAfterEvent, ToolBeforeEvent } from '../src/hooks/types'
import { TRACK, makeGuard, tempProject, withMeasure } from './fake'

const shell = (command: string, id = 'call_1'): ToolBeforeEvent => ({
  tool: 'shell',
  sessionID: 'ses_1',
  agent: 'build',
  messageID: 'msg_1',
  id,
  input: { command },
})

type Completed = ToolAfterEvent & { status: 'completed' }

const completed = (event: ToolBeforeEvent, text: string, exit = 0): Completed => ({
  tool: event.tool,
  sessionID: event.sessionID,
  agent: event.agent,
  messageID: event.messageID,
  id: event.id,
  input: event.input,
  status: 'completed',
  result: { output: undefined, content: [{ type: 'text', text }], metadata: { status: 'completed', truncated: false, exit } },
})

const git = (root: string, ...args: string[]): string => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' })

/** A project with a [~] task (or none), a source file, and the user set for git. */
const project = async (task: '~' | 'x'): Promise<string> => {
  const root = await withMeasure(await tempProject())
  git(root, 'config', 'user.email', 'test@example.com')
  git(root, 'config', 'user.name', 'Test')
  mkdirSync(join(root, 'src'), { recursive: true })
  writeFileSync(join(root, 'src/a.ts'), 'a')
  if (task === 'x') {
    const plan = join(root, 'measure/tracks', TRACK, 'plan.md')
    writeFileSync(plan, readFileSync(plan, 'utf8').replace('- [~] Task', '- [ ] Task'))
  }
  return root
}

describe('commit helpers', () => {
  test('commitShaOf reads [<branch> <sha>] from the git output', () => {
    expect(commitShaOf('[main 1234abc] feat(x): Add\n 1 file changed')).toBe('1234abc')
    expect(commitShaOf('[main (root-commit) 9abcdef] first')).toBe('9abcdef')
    expect(commitShaOf('nothing to commit')).toBeNull()
  })

  test('commitFiles lists the staged paths, and the changed paths when the commit takes changes', async () => {
    const root = await project('~')
    git(root, 'add', 'src/a.ts')
    writeFileSync(join(root, 'b.txt'), 'b')
    expect(await commitFiles(root, false)).toEqual(['src/a.ts'])
    expect((await commitFiles(root, true)).sort()).toEqual(['b.txt', 'measure/index.md', 'measure/tracks.md', `measure/tracks/${TRACK}/plan.md`, 'src/a.ts'].sort())
  })
})

describe('commit guard', () => {
  test('strict: a message not in the format is denied', async () => {
    const root = await project('~')
    git(root, 'add', 'src/a.ts')
    await expect(makeGuard(root, 'strict').onToolBefore(shell('git commit -m "update stuff"'))).rejects.toThrow(/<type>\(<scope>\): <description>/)
  })

  test('strict: a commit of source files with no [~] task is denied', async () => {
    const root = await project('x')
    git(root, 'add', 'src/a.ts', 'measure')
    const reason = await makeGuard(root, 'strict')
      .onToolBefore(shell('git commit -m "feat(core): Add the parser"'))
      .catch((error: Error) => error.message)
    expect(reason).toContain('no task is in progress')
    expect(reason).toContain('src/a.ts')
  })

  test('strict: a commit of measure/ files only passes with no [~] task', async () => {
    const root = await project('x')
    git(root, 'add', 'measure')
    await expect(makeGuard(root, 'strict').onToolBefore(shell("git commit -m \"measure(plan): Mark task 'First' as complete\""))).resolves.toBeUndefined()
  })

  test('strict: git add in the same command counts the changed files', async () => {
    const root = await project('x')
    await expect(makeGuard(root, 'strict').onToolBefore(shell('git add -A && git commit -m "feat(core): Add"'))).rejects.toThrow(/src\/a.ts/)
  })

  test('strict: an allowed commit for a [~] task gets the reminder with the SHA on the output', async () => {
    const root = await project('~')
    git(root, 'add', 'src/a.ts')
    const guard = makeGuard(root, 'strict')
    const commit = shell('git commit -m "feat(core): Add the parser"')
    await guard.onToolBefore(commit)
    const done = completed(commit, '[main 1234abc] feat(core): Add the parser\n 1 file changed')
    await guard.onToolAfter(done)
    const text = resultText(done.result)
    expect(text).toContain('the commit 1234abc is done')
    expect(text).toContain('git notes add')
  })

  test('strict: a failed commit gets no reminder; guard mode never checks', async () => {
    const root = await project('~')
    git(root, 'add', 'src/a.ts')
    const guard = makeGuard(root, 'strict')
    const commit = shell('git commit -m "feat(core): Add"')
    await guard.onToolBefore(commit)
    const failed = completed(commit, 'error: something', 1)
    await guard.onToolAfter(failed)
    expect(resultText(failed.result)).not.toContain('is done')
    await expect(makeGuard(root, 'guard').onToolBefore(shell('git commit -m "update stuff"'))).resolves.toBeUndefined()
  })
})
