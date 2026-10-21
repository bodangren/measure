// S7: the plugin commands, the status tool, and the markdown workflow commands.
import { describe, expect, test } from 'bun:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { argsOf, measureCommands, offText, onText, scopeOf } from '../src/commands'
import type { CommandRun } from '../src/commands'
import { offKey } from '../src/core/guards'
import { STATUS_TOOL_ID, STATUS_TOOL_INPUT, statusText } from '../src/tool'
import type { Guard } from '../src/guard'
import { makeGuard, tempProject, withMeasure } from './fake'

const COMMANDS_DIR = join(import.meta.dir, '..', 'commands')
const WORKFLOWS = ['setup', 'new-track', 'implement', 'review', 'status', 'revert', 'doctor', 'orchestrate']

/** Runs a plugin command by name against a Guard; returns the replies. */
const runCommand = async (guard: Guard, name: string, args = '', sessionID = 'ses_1'): Promise<string[]> => {
  const replies: string[] = []
  const command = measureCommands().find(one => one.name === name)
  if (command === undefined) throw new Error(`no command ${name}`)
  const run: CommandRun = { sessionID, args, guard, reply: async text => void replies.push(text) }
  await command.execute(run)
  return replies
}

describe('command helpers', () => {
  test('scopeOf, argsOf, and the reply texts', () => {
    expect(scopeOf('')).toBe('session')
    expect(scopeOf(' repo ')).toBe('repo')
    expect(scopeOf('repository')).toBe('session')
    expect(argsOf('measure-off', '/measure-off repo')).toBe('repo')
    expect(argsOf('measure-off', '/measure-off')).toBe('')
    expect(argsOf('measure-off', 'repo')).toBe('repo')
    expect(offText('session')).toContain('off for this session')
    expect(offText('repo')).toContain('off for this repository')
    expect(onText('session', true)).toContain('on again')
    expect(onText('repo', false)).toContain('were not off')
  })

  test('the three commands exist with descriptions', () => {
    const names = measureCommands().map(one => one.name)
    expect(names).toEqual(['measure-off', 'measure-on', 'measure-guard'])
    for (const one of measureCommands()) expect(one.description.length).toBeGreaterThan(10)
  })
})

describe('/measure-off and /measure-on', () => {
  test('off for the session sets the bypass in memory only; on clears it', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    expect((await runCommand(guard, 'measure-off'))[0]).toContain('off for this session')
    expect(await guard.bypass.get(root)).toBe('session')
    expect(guard.bypass.storage.map.has(offKey(root))).toBe(false)
    expect((await runCommand(guard, 'measure-on'))[0]).toContain('on again')
    expect(await guard.bypass.get(root)).toBeNull()
  })

  test('off for the repo keeps the choice in the storage; on repo removes it', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    await runCommand(guard, 'measure-off', 'repo')
    expect(guard.bypass.storage.map.get(offKey(root))).toBe(true)
    expect(await guard.bypass.get(root)).toBe('repo')
    await runCommand(guard, 'measure-on', 'repo')
    expect(guard.bypass.storage.map.has(offKey(root))).toBe(false)
    expect((await runCommand(guard, 'measure-on', 'repo'))[0]).toContain('were not off')
  })

  test('the bypass change is published to the state file', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    await runCommand(guard, 'measure-off')
    const { readStateFile } = await import('../src/state')
    expect((await readStateFile(root, guard.stateBase))?.guardsOff).toBe('session')
  })
})

describe('/measure-guard and the status tool', () => {
  test('/measure-guard replies with the status lines', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    const [reply] = await runCommand(guard, 'measure-guard')
    expect(reply).toContain('OpenCode plugin')
    expect(reply).toMatch(/\[~\]|in progress|Task/)
    await runCommand(guard, 'measure-off')
    expect((await runCommand(guard, 'measure-guard'))[0]).toContain('off for this session')
  })

  test('measure_status returns the status lines and the task note', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    expect(STATUS_TOOL_ID).toBe('measure_status')
    expect(STATUS_TOOL_INPUT.type).toBe('object')
    const text = await statusText(guard)
    expect(text).toContain('OpenCode plugin')
    expect(text).toContain('measure-guard (Mode: guard)')
    expect(text).toContain('Active track:')
  })

  test('measure_status in a project without measure/ says so', async () => {
    const guard = makeGuard(await tempProject())
    expect(await statusText(guard)).toContain('no measure/ folder')
  })
})

describe('the markdown commands', () => {
  test('all eight exist, with a YAML-safe description and a body that names the workflow and $ARGUMENTS', () => {
    const files = readdirSync(COMMANDS_DIR).filter(name => name.endsWith('.md')).sort()
    expect(files).toEqual(WORKFLOWS.map(name => `measure-${name}.md`).sort())
    for (const workflow of WORKFLOWS) {
      const text = readFileSync(join(COMMANDS_DIR, `measure-${workflow}.md`), 'utf8')
      const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text)
      expect(match).not.toBeNull()
      const [, front, body] = match as RegExpExecArray
      const description = /^description: (.*)$/m.exec(front)?.[1] ?? ''
      expect(description.length).toBeGreaterThan(10)
      // A plain YAML scalar must not hold ": "; a quoted one may.
      if (!description.startsWith('"')) expect(description).not.toContain(': ')
      expect(body).toContain('$ARGUMENTS')
      expect(body).toContain(workflow === 'orchestrate' ? 'measure-orchestrator' : `**${workflow}**`)
    }
    expect(readFileSync(join(COMMANDS_DIR, 'measure-orchestrate.md'), 'utf8')).toContain('agent: measure-orchestrator')
  })
})
