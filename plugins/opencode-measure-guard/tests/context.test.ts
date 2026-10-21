// S3: the rule in the system prompt, the task note on prompts, and the note after a compaction.
import { describe, expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Guard, RULE_AGENT } from '../src/guard'
import { ruleSection } from '../src/core/parse'
import type { ContextEvent, PromptEvent } from '../src/hooks/types'
import { REPO, TRACK, makeGuard, tempProject, withMeasure } from './fake'

const context = (agent: string, sessionID = 'ses_1'): ContextEvent => ({ sessionID, agent, system: [{ type: 'text', text: 'base' }], messages: [] })
const prompt = (text: string, sessionID = 'ses_1'): PromptEvent => ({ sessionID, messageID: 'msg_1', prompt: { text } })

describe('rule section', () => {
  test('the measure-orchestrator agent file carries the rule text', () => {
    const agent = readFileSync(join(REPO, 'agents/measure-orchestrator.md'), 'utf8')
    for (const line of ruleSection().split('\n').filter(line => line !== '')) expect(agent).toContain(line)
  })

  test('the context hook appends the rule for other agents and skips the orchestrator', async () => {
    const guard = makeGuard(await withMeasure(await tempProject()))
    const build = context('build')
    await guard.onContext(build)
    expect(build.system.length).toBe(2)
    expect(build.system[1]?.text).toBe(ruleSection())
    const orchestrator = context(RULE_AGENT)
    await guard.onContext(orchestrator)
    expect(orchestrator.system.length).toBe(1)
  })

  test('no rule without measure/', async () => {
    const guard = makeGuard(await tempProject())
    const build = context('build')
    await guard.onContext(build)
    expect(build.system.length).toBe(1)
  })
})

describe('task note', () => {
  test('the first prompt gets the note; the next one does not; a task change sends it again', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    const first = prompt('hello')
    await guard.onPrompt(first)
    expect(first.prompt.text).toContain('hello')
    expect(first.prompt.text).toContain('measure-guard (Mode: guard)')
    expect(first.prompt.text).toContain('Current task: [~]')

    const second = prompt('again')
    await guard.onPrompt(second)
    expect(second.prompt.text).toBe('again')

    const planPath = join(root, 'measure/tracks', TRACK, 'plan.md')
    writeFileSync(planPath, readFileSync(planPath, 'utf8').replace('- [~] Task', '- [ ] Task'))
    const third = prompt('later')
    await guard.onPrompt(third)
    expect(third.prompt.text).toContain('No task is in progress.')
  })

  test('each session gets its own note', async () => {
    const guard = makeGuard(await withMeasure(await tempProject()))
    const a = prompt('a', 'ses_a')
    const b = prompt('b', 'ses_b')
    await guard.onPrompt(a)
    await guard.onPrompt(b)
    expect(a.prompt.text).toContain('measure-guard')
    expect(b.prompt.text).toContain('measure-guard')
  })

  test('no note without measure/', async () => {
    const guard = makeGuard(await tempProject())
    const first = prompt('hello')
    await guard.onPrompt(first)
    expect(first.prompt.text).toBe('hello')
  })

  test('a compaction carries the note and the next prompt gets it again', async () => {
    const guard = makeGuard(await withMeasure(await tempProject()))
    await guard.onPrompt(prompt('hello'))
    const compaction = { ...context('build'), result: undefined }
    await guard.onCompaction(compaction)
    expect(compaction.system.some(part => part.text.includes('Current task: [~]'))).toBe(true)
    const next = prompt('after')
    await guard.onPrompt(next)
    expect(next.prompt.text).toContain('Current task: [~]')
  })
})

describe('pendingNote', () => {
  test('returns the note once per key', async () => {
    const guard = makeGuard(await withMeasure(await tempProject()))
    const snapshot = await guard.current()
    expect(await guard.pendingNote('ses_1', snapshot)).toContain('measure-guard')
    expect(await guard.pendingNote('ses_1', snapshot)).toBeNull()
  })
})

describe('Guard', () => {
  test('exposes the mode and the root', async () => {
    const root = await tempProject()
    const guard = makeGuard(root, 'strict')
    expect(guard.mode).toBe('strict')
    expect(guard.root).toBe(root)
  })
})
