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

/** The D2 note of guard_phase_start_20261109: phase `next` starts while phase `previous` has no checkpoint. */
const phaseNote = (next: string, previous: string): string =>
  `measure-guard: "${next}" starts while the heading of "${previous}" has no [checkpoint: <sha>]. This is correct when the two phases run at the same time. When "${previous}" is complete, run the Phase Completion Verification and Checkpointing Protocol in measure/workflow.md for it.`

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
  test('AC-2: a task of the next phase starts with a note while the previous phase has no checkpoint', async () => {
    const root = await withMeasure(await tempProject())
    const planPath = join(root, 'measure/tracks', TRACK, 'plan.md')
    // No checkpoints and no task started: starting Task 2.1 needs the Phase S1 checkpoint.
    const plan = readFileSync(planPath, 'utf8')
      .replace(/ \[checkpoint: [0-9a-f]+\]/g, '')
      .split('\n')
      .map(l => (/^- \[[x~]\] Task \d/.test(l) ? `- [ ] ${l.slice(6).replace(/ `[0-9a-f]{7}`$/, '')}` : l))
      .join('\n')
    writeFileSync(planPath, plan)
    const guard = makeGuard(root)
    const line = plan.split('\n').find(l => l.startsWith('- [ ] Task 2.1:'))
    expect(line).toBeDefined()
    const start = before(planPath, line as string, (line as string).replace('[ ]', '[~]'))
    await expect(guard.onToolBefore(start)).resolves.toBeUndefined()
    const started = after(start)
    await guard.onToolAfter(started)
    expect(String(started.result.output)).toContain(phaseNote('Phase S2: Project snapshot and plugin state', 'Phase S1: Package skeleton and shared core'))
    const close = before(planPath, line as string, (line as string).replace('[ ]', '[x]'), 'call_2')
    await expect(guard.onToolBefore(close)).resolves.toBeUndefined()
    const closed = after(close)
    await guard.onToolAfter(closed)
    expect(String(closed.result.output)).not.toContain('measure-guard: "')
  })

  // The PM case of 2026-11-09: Workbooks storytime_l2_unit2_20261106 starts Task 6.1 while Phase 5 has no checkpoint.
  const OVERLAP_PLAN = [
    '# Implementation Plan: Overlap',
    '',
    '## Phase 4: Unit scope [checkpoint: 1234567]',
    '',
    '- [x] Task 4.1: Unit scope `1234567`',
    '',
    '## Phase 5: Print build',
    '',
    '- [ ] Task 5.1: Proof build',
    '',
    '## Phase 6: Hand-offs',
    '',
    '- [ ] Task 6.1: Song audio',
    '',
  ].join('\n')

  for (const mode of ['guard', 'strict'] as const) {
    test(`AC-1: Task 6.1 starts while Phase 5 has no checkpoint (${mode} mode)`, async () => {
      const root = await withMeasure(await tempProject(), { plan: OVERLAP_PLAN })
      const guard = makeGuard(root, mode)
      const planPath = join(root, 'measure/tracks', TRACK, 'plan.md')
      const start = before(planPath, '- [ ] Task 6.1: Song audio', '- [~] Task 6.1: Song audio')
      await expect(guard.onToolBefore(start)).resolves.toBeUndefined()
      const started = after(start)
      await guard.onToolAfter(started)
      expect(String(started.result.output)).toContain(phaseNote('Phase 6: Hand-offs', 'Phase 5: Print build'))
    })
  }
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
