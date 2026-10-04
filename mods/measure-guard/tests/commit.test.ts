// S9: the commit guard (strict mode).
import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { ToolCallResult } from 'claude-code'
import { parseCommitCommand } from '../hooks/guards'
import { ROOT, START, world } from './world'

const M = `${ROOT}/measure`
const PLAN = `${M}/tracks/work_1/plan.md`

const files = (task: '~' | 'x'): Record<string, string> => ({
  [`${M}/tracks.md`]: '- [~] **Track: Work**\n  *Link: [./tracks/work_1/](./tracks/work_1/)*\n',
  [PLAN]: `## Phase 1: A\n\n- [${task}] Task: First${task === 'x' ? ' `1234567`' : ''}\n- [ ] Task: Second\n`,
})

const STRICT = { options: { mode: 'strict' } } as const

const denied = (ran: ToolCallResult): string | undefined =>
  ran.deny ?? (ran.isError === true ? ran.text : undefined)

const bash = ($: Engine, command: string) => $.tool.call({ tool: 'Bash', command })

const HEREDOC = (first: string) => `git commit -m "$(cat <<'EOF'\n${first}\n\nBody line.\nEOF\n)"`

test('strict: a message not in the format is denied', STRICT, async ($, on) => {
  const w = world(on, files('~'))
  w.staged = ['src/a.ts']
  await $.session.start(START)
  expect(denied(await bash($, 'git commit -m "update stuff"'))).toContain('<type>(<scope>): <description>')
})

test('strict: a commit of source files with no [~] task is denied', STRICT, async ($, on) => {
  const w = world(on, files('x'))
  w.staged = ['src/a.ts', 'measure/tracks/work_1/plan.md']
  await $.session.start(START)
  const reason = denied(await bash($, 'git commit -m "feat(core): Add the parser"')) ?? ''
  expect(reason).toContain('no task is in progress')
  expect(reason).toContain('src/a.ts')
})

test('strict: a commit of measure/ files only passes with no [~] task', STRICT, async ($, on) => {
  const w = world(on, files('x'))
  w.staged = ['measure/tracks/work_1/plan.md']
  await $.session.start(START)
  expect(denied(await bash($, "git commit -m \"measure(plan): Mark task 'First' as complete\""))).toBeUndefined()
})

test('strict: git add in the same command counts the changed files', STRICT, async ($, on) => {
  const w = world(on, files('x'))
  w.git = ' M src/a.ts\n'
  await $.session.start(START)
  expect(denied(await bash($, 'git add -A && git commit -m "feat(core): Add it"'))).toContain('src/a.ts')
})

test('strict: a commit for a [~] task passes and reminds the agent of the note and the SHA', STRICT, async ($, on) => {
  const w = world(on, files('~'))
  w.staged = ['src/a.ts']
  await $.session.start(START)
  const ran = await bash($, HEREDOC('feat(core): Add the parser'))
  expect(denied(ran)).toBeUndefined()
  const reminder = ran.context?.join('\n') ?? ''
  expect(reminder).toContain('git notes add')
  expect(reminder).toContain('abc1234')
  expect(reminder).toContain('plan.md')
})

test('strict: a heredoc message not in the format is denied', STRICT, async ($, on) => {
  const w = world(on, files('~'))
  w.staged = ['src/a.ts']
  await $.session.start(START)
  expect(denied(await bash($, HEREDOC('Add the parser')))).toContain('<type>(<scope>): <description>')
})

test('strict: a message from a file passes with a note', STRICT, async ($, on) => {
  const w = world(on, files('~'))
  w.staged = ['src/a.ts']
  await $.session.start(START)
  const ran = await bash($, 'git commit -F msg.txt')
  expect(denied(ran)).toBeUndefined()
  expect(ran.context?.join('\n')).toContain('could not read the commit message')
})

test('guard mode has no commit guard', async ($, on) => {
  const w = world(on, files('x'))
  w.staged = ['src/a.ts']
  await $.session.start(START)
  expect(denied(await bash($, 'git commit -m "update stuff"'))).toBeUndefined()
})

describe('parseCommitCommand', () => {
  test('reads the message forms and the flags', () => {
    expect(parseCommitCommand('ls -la')).toBeNull()
    expect(parseCommitCommand('git commit -m "feat(a): b"')).toEqual({ message: 'feat(a): b', takesChanges: false })
    expect(parseCommitCommand("git commit -am 'fix(a): b'")).toEqual({ message: 'fix(a): b', takesChanges: true })
    expect(parseCommitCommand('git commit --message=chore(x):y')).toEqual({ message: 'chore(x):y', takesChanges: false })
    expect(parseCommitCommand(HEREDOC('docs(r): c'))).toEqual({ message: 'docs(r): c', takesChanges: false })
    expect(parseCommitCommand('git add a.ts && git commit -m "x(y): z"')).toEqual({ message: 'x(y): z', takesChanges: true })
    expect(parseCommitCommand('git -C /repo commit -F m.txt')).toEqual({ message: null, takesChanges: false })
    expect(parseCommitCommand('git commit')).toEqual({ message: null, takesChanges: false })
  })
})
