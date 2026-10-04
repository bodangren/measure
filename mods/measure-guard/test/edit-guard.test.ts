// S3: the edit guard.
import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { ToolCallResult } from 'claude-code'
import { editDecision } from '../hooks/guards'
import { ROOT, START, realFiles, world } from './world'

const GUARD_PLAN = `${ROOT}/measure/tracks/measure_guard_20261004/plan.md`
const TRACKS = `${ROOT}/measure/tracks.md`
const SOURCE = `${ROOT}/src/a.ts`

/** The real files with no [~] task in any plan. */
const noTaskFiles = () => {
  const files: Record<string, string> = { ...realFiles(), [SOURCE]: 'a' }
  files[GUARD_PLAN] = (files[GUARD_PLAN] as string).replace('- [~] Task 1.4:', '- [x] Task 1.4:')
  return files
}

/** The real files with no [~] track. */
const noTrackFiles = () => {
  const files: Record<string, string> = { ...realFiles(), [SOURCE]: 'a' }
  files[TRACKS] = (files[TRACKS] as string).replaceAll('- [~] **Track', '- [x] **Track')
  return files
}

const denied = (ran: ToolCallResult): string | undefined =>
  ran.deny ?? (ran.isError === true ? ran.text : undefined)

const edit = ($: Engine, path: string) =>
  $.tool.call({ tool: 'Edit', file_path: path, old_string: 'a', new_string: 'b' })

test('an edit outside measure/ with a [~] task passes', async ($, on) => {
  world(on, { ...realFiles(), [SOURCE]: 'a' })
  await $.session.start(START)
  expect(denied(await edit($, SOURCE))).toBeUndefined()
})

test('an edit outside measure/ with no [~] task is denied with the next action', async ($, on) => {
  world(on, noTaskFiles())
  await $.session.start(START)
  const reason = denied(await edit($, SOURCE)) ?? ''
  expect(reason).toContain('Mark the next task `[~]`')
  expect(reason).toContain('measure/tracks/agent_performance_benchmarking_20260527/plan.md')
  expect(reason).toContain('/measure-off')
})

test('Write and NotebookEdit are guarded too', async ($, on) => {
  world(on, noTaskFiles())
  await $.session.start(START)
  expect(denied(await $.tool.call({ tool: 'Write', file_path: SOURCE, content: 'b' }))).toBeDefined()
  const notebook = await $.tool.call({ tool: 'NotebookEdit', notebook_path: `${ROOT}/n.ipynb`, new_source: 'x' })
  expect(denied(notebook)).toBeDefined()
})

test('an edit with no track in progress is denied and asks for a track', async ($, on) => {
  world(on, noTrackFiles())
  await $.session.start(START)
  expect(denied(await edit($, SOURCE))).toContain('Create a track')
})

test('an edit inside measure/ always passes', async ($, on) => {
  world(on, noTrackFiles())
  await $.session.start(START)
  expect(denied(await $.tool.call({ tool: 'Write', file_path: `${ROOT}/measure/notes.md`, content: 'x' }))).toBeUndefined()
})

test('advise mode lets the edit pass', { options: { mode: 'advise' } }, async ($, on) => {
  world(on, noTaskFiles())
  await $.session.start(START)
  expect(denied(await edit($, SOURCE))).toBeUndefined()
})

test('the guard follows the plan: marking a task [~] opens the edits', async ($, on) => {
  const w = world(on, noTaskFiles())
  await $.session.start(START)
  expect(denied(await edit($, SOURCE))).toBeDefined()
  await $.tool.call({ tool: 'Edit', file_path: GUARD_PLAN, old_string: '- [ ] Task 1.5:', new_string: '- [~] Task 1.5:' })
  expect(w.files[GUARD_PLAN]).toContain('- [~] Task 1.5:')
  expect(denied(await edit($, SOURCE))).toBeUndefined()
})

describe('editDecision', () => {
  const base = { mode: 'guard' as const, setupChoice: null, guardsOff: null }
  test('allows a path outside the project root', () => {
    const snapshot = {
      root: ROOT, hasMeasure: true, isRepo: true, tracks: [], active: null, inProgressCount: 0, parseError: null,
    }
    expect(editDecision({ ...base, snapshot }, '/tmp/scratch/a.ts')).toBeNull()
    expect(editDecision({ ...base, snapshot }, `${ROOT}/src/a.ts`)).not.toBeNull()
  })

  test('allows on a parse error and before the first read', () => {
    const snapshot = {
      root: ROOT, hasMeasure: true, isRepo: true, tracks: [], active: null, inProgressCount: 0, parseError: 'bad',
    }
    expect(editDecision({ ...base, snapshot }, `${ROOT}/src/a.ts`)).toBeNull()
    expect(editDecision({ ...base, snapshot: null }, `${ROOT}/src/a.ts`)).toBeNull()
  })
})
