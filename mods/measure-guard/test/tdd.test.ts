// S8: the TDD guard (strict mode).
import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { ToolCallResult } from 'claude-code'
import { isSourceFile, isTestCommand, isTestFile } from '../hooks/guards'
import { ROOT, START, world } from './world'

const M = `${ROOT}/measure`
const PLAN = `${M}/tracks/work_1/plan.md`
const SOURCE = `${ROOT}/src/a.ts`
const TEST = `${ROOT}/src/a.test.ts`

const files = (): Record<string, string> => ({
  [`${M}/tracks.md`]: '- [~] **Track: Work**\n  *Link: [./tracks/work_1/](./tracks/work_1/)*\n',
  [PLAN]: '## Phase 1: A\n\n- [~] Task: First\n- [ ] Task: Second\n',
  [SOURCE]: 'a',
  [TEST]: 'a',
})

const STRICT = { options: { mode: 'strict' } } as const

const denied = (ran: ToolCallResult): string | undefined =>
  ran.deny ?? (ran.isError === true ? ran.text : undefined)

const edit = ($: Engine, path: string) => $.tool.call({ tool: 'Edit', file_path: path, old_string: 'a', new_string: 'b' })
const bash = ($: Engine, command: string) => $.tool.call({ tool: 'Bash', command })

test('strict: a source edit before the Red phase is denied', STRICT, async ($, on) => {
  world(on, files())
  await $.session.start(START)
  const reason = denied(await edit($, SOURCE)) ?? ''
  expect(reason).toContain('write a failing test first')
  expect(reason).toContain('Task: First')
})

test('strict: a test file edit passes', STRICT, async ($, on) => {
  world(on, files())
  await $.session.start(START)
  expect(denied(await edit($, TEST))).toBeUndefined()
})

test('strict: a test change alone, or a failed command that is no test, is not enough', STRICT, async ($, on) => {
  const w = world(on, files())
  w.failing.push('ls nothing')
  await $.session.start(START)
  await edit($, TEST)
  await bash($, 'ls nothing')
  expect(denied(await edit($, SOURCE))).toContain('write a failing test first')
})

test('strict: a test change and a failed test command open the source edits', STRICT, async ($, on) => {
  const w = world(on, files())
  w.failing.push('npm test')
  await $.session.start(START)
  await edit($, TEST)
  await bash($, 'npm test')
  expect(denied(await edit($, SOURCE))).toBeUndefined()
})

test('strict: Markdown and JSON files pass', STRICT, async ($, on) => {
  world(on, { ...files(), [`${ROOT}/README.md`]: 'a', [`${ROOT}/package.json`]: 'a' })
  await $.session.start(START)
  expect(denied(await edit($, `${ROOT}/README.md`))).toBeUndefined()
  expect(denied(await edit($, `${ROOT}/package.json`))).toBeUndefined()
})

test('strict: the next task starts the Red phase again', STRICT, async ($, on) => {
  const w = world(on, files())
  w.failing.push('npm test')
  await $.session.start(START)
  await edit($, TEST)
  await bash($, 'npm test')
  expect(denied(await edit($, SOURCE))).toBeUndefined()
  await $.tool.call({
    tool: 'Edit',
    file_path: PLAN,
    old_string: '- [~] Task: First\n- [ ] Task: Second',
    new_string: '- [x] Task: First `abcdef1`\n- [~] Task: Second',
  })
  expect(denied(await edit($, SOURCE))).toContain('Task: Second')
})

test('guard mode has no TDD guard', async ($, on) => {
  world(on, files())
  await $.session.start(START)
  expect(denied(await edit($, SOURCE))).toBeUndefined()
})

describe('name rules', () => {
  test('test files', () => {
    for (const path of ['src/a.test.ts', 'src/a.spec.tsx', 'test_a.py', 'a_test.py', 'a_test.go', 'tests/a.rs', 'scripts/test-cli.sh', 'spec/a_spec.rb']) {
      expect(isTestFile(path), path).toBe(true)
    }
    for (const path of ['src/a.ts', 'testing.py', 'latest.go']) expect(isTestFile(path), path).toBe(false)
  })

  test('source files', () => {
    for (const path of ['src/a.ts', 'a.py', 'b.go', 'c.rs', 'd.tsx', 'run.sh']) expect(isSourceFile(path), path).toBe(true)
    for (const path of ['README.md', 'package.json', 'a.test.ts', 'notes.txt', 'config.yaml']) {
      expect(isSourceFile(path), path).toBe(false)
    }
  })

  test('test commands', () => {
    for (const command of ['npm test', 'pnpm run test', 'npx vitest run', 'pytest -q', 'python -m pytest', 'go test ./...', 'cargo test', 'claude plugin test mods/x', 'bash scripts/test-cli.sh']) {
      expect(isTestCommand(command), command).toBe(true)
    }
    for (const command of ['ls', 'git status', 'npm install', 'cat test.txt']) expect(isTestCommand(command), command).toBe(false)
  })
})
