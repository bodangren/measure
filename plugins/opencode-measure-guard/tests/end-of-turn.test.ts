// S6: the end-of-turn check from the prompt hook to the idle event.
import { describe, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { MAX_BLOCKS, REPORT_ONLY, stopAction, turnProblems } from '../src/core/guards'
import { FOLLOW_UP_HEAD, endTurn, followUpText, isFollowUp, reminderText, startTurn } from '../src/hooks/turn'
import type { PromptEvent } from '../src/hooks/types'
import { readStateFile } from '../src/state'
import { TRACK, makeGuard, tempProject, withMeasure } from './fake'
import type { Guard } from '../src/guard'

/** The report-only line, as a literal. */
const REPORT_ONLY_TEXT = 'Do not edit, commit, or push because of this message. Write these problems in your reply to your orchestrator or the user, and act on them only when they tell you to.'

/** The words that no report-only text may use as an order. */
const ORDER_WORDS = [/\bfix (these|them)\b/i, /\bcommit the\b/i, /\bpush\b(?! because)/i, /\brevert the\b/i, /\bmark the task\b/i]

/** A report text holds the report line and no order word. */
const assertReportOnly = (text: string): void => {
  expect(text).toContain(REPORT_ONLY_TEXT)
  for (const word of ORDER_WORDS) expect(text).not.toMatch(word)
}

/** The host package is not installed, so the case stubs it before it loads `src/index.ts`. */
Bun.plugin({
  name: 'measure-guard-host-stub',
  setup(build) {
    build.module('@opencode/plugin', () => ({
      contents: 'export const Plugin = { define: (x) => x };',
      loader: 'js',
    }))
  },
})

const prompt = (sessionID = 'ses_1', text = 'hi'): PromptEvent => ({ sessionID, messageID: 'msg_1', prompt: { text } })

/** A committed project with a [~] task (or none). */
const project = async (task: '~' | 'none'): Promise<string> => {
  const root = await withMeasure(await tempProject())
  if (task === 'none') {
    const plan = join(root, 'measure/tracks', TRACK, 'plan.md')
    writeFileSync(plan, readFileSync(plan, 'utf8').replace('- [~] Task', '- [ ] Task'))
  }
  execFileSync('git', ['-C', root, 'add', '-A'])
  execFileSync('git', ['-C', root, '-c', 'user.email=t@e.com', '-c', 'user.name=T', 'commit', '-q', '-m', 'chore(test): Start'])
  return root
}

/** A turn: the prompt, a change outside measure/, and the idle event. */
const turnWithChange = async (guard: Guard, root: string, sessionID = 'ses_1') => {
  await guard.onPrompt(prompt(sessionID))
  writeFileSync(join(root, 'stray.ts'), 'x')
  return guard.onIdle(sessionID)
}

/** The real problems of a turn: a [x] task with no SHA, and a file outside measure/. */
const realProblems = async (): Promise<string[]> => {
  const root = await project('~')
  const plan = join(root, 'measure/tracks', TRACK, 'plan.md')
  writeFileSync(plan, readFileSync(plan, 'utf8').replace('- [~] Task', '- [x] Task'))
  const snapshot = await makeGuard(root).current()
  return turnProblems(snapshot, ['stray.ts'], [])
}

describe('turn helpers', () => {
  test('startTurn keeps the status lines and the [x] tasks without SHA', async () => {
    const root = await project('~')
    const guard = makeGuard(root)
    const turn = startTurn(await guard.current(), ['?? a.txt'])
    expect(turn).toEqual({ status: ['?? a.txt'], unsha: [], blocks: 0 })
  })

  test('endTurn: no turn, no problems, advise, or the bypass give none', async () => {
    const root = await project('none')
    const snapshot = await makeGuard(root).current()
    const turn = startTurn(snapshot, [])
    expect(endTurn('guard', null, snapshot, ['?? stray.ts'], false).kind).toBe('none')
    expect(endTurn('guard', turn, snapshot, [], false)).toEqual({ kind: 'none', problems: [] })
    expect(endTurn('advise', turn, snapshot, ['?? stray.ts'], false).kind).toBe('none')
    expect(endTurn('guard', turn, snapshot, ['?? stray.ts'], true).kind).toBe('none')
  })

  test('endTurn: guard reminds; strict follows up MAX_BLOCKS times, then reminds', async () => {
    const root = await project('none')
    const snapshot = await makeGuard(root).current()
    const turn = startTurn(snapshot, [])
    const guard = endTurn('guard', turn, snapshot, ['?? stray.ts'], false)
    expect(guard.kind).toBe('remind')
    expect(guard.problems[0]).toContain('stray.ts')
    expect(endTurn('strict', turn, snapshot, ['?? stray.ts'], false).kind).toBe('follow-up')
    expect(endTurn('strict', { ...turn, blocks: MAX_BLOCKS - 1 }, snapshot, ['?? stray.ts'], false).kind).toBe('follow-up')
    expect(endTurn('strict', { ...turn, blocks: MAX_BLOCKS }, snapshot, ['?? stray.ts'], false).kind).toBe('remind')
  })

  test('the texts name the problems', () => {
    expect(followUpText(['p1'])).toContain('report these problems before you end the turn')
    expect(followUpText(['p1'])).toContain('- p1')
    expect(reminderText(['p1', 'p2'])).toContain('at the end of the last turn')
    expect(reminderText(['p1', 'p2'])).toContain('- p2')
  })
})

describe('the report-only text', () => {
  test('the report line is the export', () => {
    expect(REPORT_ONLY).toBe(REPORT_ONLY_TEXT)
  })

  test('the follow-up text and the reminder text are report-only', () => {
    assertReportOnly(followUpText(['p1']))
    assertReportOnly(reminderText(['p1', 'p2']))
  })

  test('the texts of the real problems are report-only', async () => {
    const problems = await realProblems()
    expect(problems.length).toBe(2)
    assertReportOnly(followUpText(problems))
    assertReportOnly(reminderText(problems))
  })

  test('the core stop block starts with the plugin head', () => {
    const block = stopAction('strict', ['p1'], 0).block
    expect(block).not.toBeNull()
    expect(block?.startsWith(FOLLOW_UP_HEAD)).toBe(true)
  })
})

describe('end of turn on the guard', () => {
  test('advise: nothing happens, the state file lists the problems', async () => {
    const root = await project('none')
    const guard = makeGuard(root, 'advise')
    const action = await turnWithChange(guard, root)
    expect(action.kind).toBe('none')
    const state = await readStateFile(root, guard.stateBase)
    expect(state?.problems[0]).toContain('stray.ts')
  })

  test('guard: a reminder action, and the reminder rides on the next prompt', async () => {
    const root = await project('none')
    const guard = makeGuard(root, 'guard')
    const action = await turnWithChange(guard, root)
    expect(action.kind).toBe('remind')
    const next = prompt()
    await guard.onPrompt(next)
    expect(next.prompt.text).toContain('at the end of the last turn')
    expect(next.prompt.text).toContain('stray.ts')
  })

  test('guard: the turn end sends no synthetic message and no prompt', async () => {
    const root = await project('none')
    const guard = makeGuard(root, 'guard')
    await guard.onPrompt(prompt('ses_1'))
    writeFileSync(join(root, 'stray.ts'), 'x')
    const calls = { synthetic: 0, prompt: 0 }
    const ctx = {
      event: {
        subscribe: async function* () {
          yield { type: 'session.execution.succeeded', data: { sessionID: 'ses_1' } }
        },
      },
      session: {
        synthetic: async () => {
          calls.synthetic += 1
        },
        prompt: async () => {
          calls.prompt += 1
        },
      },
    } as unknown as Parameters<typeof import('../src/index').watchIdle>[0]
    const { watchIdle } = await import('../src/index')
    await watchIdle(ctx, guard)
    expect(calls.synthetic).toBe(0)
    expect(calls.prompt).toBe(0)
    const reminder = guard.session('ses_1').reminder
    expect(reminder).not.toBeNull()
    assertReportOnly(reminder ?? '')
    const next = prompt('ses_1')
    await guard.onPrompt(next)
    expect(next.prompt.text).toContain('at the end of the last turn')
    assertReportOnly(next.prompt.text)
  })

  test('strict: a follow-up twice, then a reminder; a new prompt starts the count again', async () => {
    const root = await project('none')
    const guard = makeGuard(root, 'strict')
    expect((await turnWithChange(guard, root)).kind).toBe('follow-up')
    expect((await guard.onIdle('ses_1')).kind).toBe('follow-up')
    expect((await guard.onIdle('ses_1')).kind).toBe('remind')
    expect((await guard.onIdle('ses_1')).kind).toBe('none')
    // The next prompt starts from the current status: stray.ts is known, a new file is a new problem.
    await guard.onPrompt(prompt())
    expect((await guard.onIdle('ses_1')).kind).toBe('none')
    await guard.onPrompt(prompt())
    writeFileSync(join(root, 'stray2.ts'), 'x')
    expect((await guard.onIdle('ses_1')).kind).toBe('follow-up')
  })

  test('strict: the follow-up prompt itself keeps the turn, so the count and the problems stay', async () => {
    const root = await project('none')
    const guard = makeGuard(root, 'strict')
    const first = await turnWithChange(guard, root)
    expect(first.kind).toBe('follow-up')
    expect(isFollowUp(first.kind === 'follow-up' ? first.text : '')).toBe(true)
    // OpenCode runs the prompt hook for the follow-up prompt too.
    await guard.onPrompt(prompt('ses_1', first.kind === 'follow-up' ? first.text : ''))
    expect((await guard.onIdle('ses_1')).kind).toBe('follow-up')
    await guard.onPrompt(prompt('ses_1', followUpText(['p'])))
    const third = await guard.onIdle('ses_1')
    expect(third.kind).toBe('remind')
    expect(third.problems[0]).toContain('stray.ts')
  })

  test('an idle without a prompt, the bypass, or a session of another project does nothing', async () => {
    const root = await project('none')
    const guard = makeGuard(root, 'guard')
    expect((await guard.onIdle('ses_9')).kind).toBe('none')
    await guard.bypass.set(root, 'session')
    expect((await turnWithChange(guard, root)).kind).toBe('none')
  })

  test('no problems: the state file has an empty problems list', async () => {
    const root = await project('~')
    const guard = makeGuard(root, 'strict')
    await guard.onPrompt(prompt())
    writeFileSync(join(root, 'stray.ts'), 'x')
    expect((await guard.onIdle('ses_1')).kind).toBe('none')
    expect((await readStateFile(root, guard.stateBase))?.problems).toEqual([])
  })

  test('a [x] task without a SHA that appeared during the turn is a problem; an old one is not', async () => {
    const root = await project('~')
    const plan = join(root, 'measure/tracks', TRACK, 'plan.md')
    const guard = makeGuard(root, 'guard')
    await guard.onPrompt(prompt())
    writeFileSync(plan, readFileSync(plan, 'utf8').replace('- [~] Task', '- [x] Task'))
    const action = await guard.onIdle('ses_1')
    expect(action.kind).toBe('remind')
    expect(action.problems[0]).toContain('has no commit SHA')
    await guard.onPrompt(prompt())
    expect((await guard.onIdle('ses_1')).kind).toBe('none')
  })
})
