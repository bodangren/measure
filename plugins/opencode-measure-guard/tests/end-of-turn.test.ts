// S6: the end-of-turn check from the prompt hook to the idle event.
import { describe, expect, test } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { MAX_BLOCKS } from '../src/core/guards'
import { endTurn, followUpText, reminderText, startTurn } from '../src/hooks/turn'
import type { PromptEvent } from '../src/hooks/types'
import { readStateFile } from '../src/state'
import { TRACK, makeGuard, tempProject, withMeasure } from './fake'
import type { Guard } from '../src/guard'

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
    expect(followUpText(['p1'])).toContain('do not end the turn yet')
    expect(followUpText(['p1'])).toContain('- p1')
    expect(reminderText(['p1', 'p2'])).toContain('at the end of the last turn')
    expect(reminderText(['p1', 'p2'])).toContain('- p2')
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

  test('strict: a follow-up twice, then a reminder; a new prompt starts the count again', async () => {
    const root = await project('none')
    const guard = makeGuard(root, 'strict')
    expect((await turnWithChange(guard, root)).kind).toBe('follow-up')
    expect((await guard.onIdle('ses_1')).kind).toBe('follow-up')
    expect((await guard.onIdle('ses_1')).kind).toBe('remind')
    expect((await guard.onIdle('ses_1')).kind).toBe('none')
    await guard.onPrompt(prompt())
    expect((await guard.onIdle('ses_1')).kind).toBe('follow-up')
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
