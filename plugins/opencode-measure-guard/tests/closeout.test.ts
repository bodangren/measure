// S4: the closeout guard (tracks.md and plan.md edits) and the notes on the tool output.
import { describe, expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ToolAfterEvent, ToolBeforeEvent } from '../src/hooks/types'

/** A completed call, so the tests can read `result`. */
type CompletedEvent = ToolAfterEvent & { status: 'completed' }
import { TRACK, makeGuard, tempProject, withMeasure } from './fake'

const before = (filePath: string, oldString: string, newString: string, id = 'call_1'): ToolBeforeEvent => ({
  tool: 'edit',
  sessionID: 'ses_1',
  agent: 'build',
  messageID: 'msg_1',
  id,
  input: { filePath, oldString, newString },
})

const after = (event: ToolBeforeEvent, output = 'done'): CompletedEvent => ({
  tool: event.tool,
  sessionID: event.sessionID,
  agent: event.agent,
  messageID: event.messageID,
  id: event.id,
  input: event.input,
  status: 'completed',
  result: { output },
})

const TRACK_LINE = '- [~] **Track: OpenCode plugin: measure-guard'

describe('track close', () => {
  test('a track with open tasks cannot change to [x]', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    const tracks = join(root, 'measure/tracks.md')
    await expect(guard.onToolBefore(before(tracks, TRACK_LINE, TRACK_LINE.replace('[~]', '[x]')))).rejects.toThrow(/open task/)
  })

  test('a track with only closed and owner-deferred tasks closes, and the [b] list rides on the output', async () => {
    const root = await withMeasure(await tempProject())
    const planPath = join(root, 'measure/tracks', TRACK, 'plan.md')
    const closed = readFileSync(planPath, 'utf8')
      .replace(/^- \[~\] /gm, '- [x] ')
      .replace(/^- \[ \] (Task[^\n]*)$/gm, '- [x] $1 `abc1234`')
    writeFileSync(planPath, closed)
    const guard = makeGuard(root)
    const tracks = join(root, 'measure/tracks.md')
    const event = before(tracks, TRACK_LINE, TRACK_LINE.replace('[~]', '[x]'))
    await expect(guard.onToolBefore(event)).resolves.toBeUndefined()
    const done = after(event)
    await guard.onToolAfter(done)
    expect(String(done.status === 'completed' ? done.result.output : '')).toContain('[b] tasks')
  })
})

describe('phase start', () => {
  test('a task of the next phase cannot start while the previous phase has no checkpoint', async () => {
    const root = await withMeasure(await tempProject())
    const planPath = join(root, 'measure/tracks', TRACK, 'plan.md')
    const plan = readFileSync(planPath, 'utf8').replace(/ \[checkpoint: [0-9a-f]+\]/g, '')
    writeFileSync(planPath, plan)
    const guard = makeGuard(root)
    const line = plan.split('\n').find(l => l.startsWith('- [ ] Task 9.1:'))
    expect(line).toBeDefined()
    await expect(guard.onToolBefore(before(planPath, line as string, (line as string).replace('[ ]', '[~]')))).rejects.toThrow(/checkpoint/)
  })
})

describe('notes after a call', () => {
  test('a plan edit that changes the task sends the task note on the output', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    await guard.pendingNote('ses_1', await guard.current())
    const planPath = join(root, 'measure/tracks', TRACK, 'plan.md')
    const text = readFileSync(planPath, 'utf8')
    const line = text.split('\n').find(l => l.startsWith('- [~] Task')) as string
    const event = before(planPath, line, line.replace('[~]', '[x]'))
    await guard.onToolBefore(event)
    writeFileSync(planPath, text.replace(line, line.replace('[~]', '[x]')))
    const done = after(event)
    await guard.onToolAfter(done)
    expect(String(done.result.output)).toContain('measure-guard')
    expect(String(done.result.output)).toContain('No task is in progress')
  })

  test('a failed call gets no note', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    const event = before(join(root, 'measure/tracks.md'), 'x', 'y')
    const failed: ToolAfterEvent = { ...after(event), status: 'error', error: { message: 'no' } } as ToolAfterEvent
    await expect(guard.onToolAfter(failed)).resolves.toBeUndefined()
  })
})
