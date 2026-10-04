// S7: the end-of-turn check.
import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import { changedDuringTurn, statusLinesOf, unshaTasks } from '../hooks/guards'
import { parsePlan } from '../hooks/parse'
import { BAND, ROOT, START, world } from './world'

const M = `${ROOT}/measure`
const PLAN = `${M}/tracks/work_1/plan.md`

const PLAN_MD = `## Phase 1: A

- [x] Task: Old done with no SHA
- [~] Task: Current
- [ ] Task: Next
`

const files = (): Record<string, string> => ({
  [`${M}/tracks.md`]: '- [~] **Track: Work**\n  *Link: [./tracks/work_1/](./tracks/work_1/)*\n',
  [PLAN]: PLAN_MD,
})

const submit = ($: Engine) => $.classic.UserPromptSubmit({ prompt: 'go on' })
const stop = ($: Engine) => $.classic.Stop({ stop_hook_active: false })

/** Marks the current task [x]: with a SHA, or with none. */
const finish = ($: Engine, sha: string | null) =>
  $.tool.call({
    tool: 'Edit',
    file_path: PLAN,
    old_string: '- [~] Task: Current',
    new_string: sha === null ? '- [x] Task: Current' : `- [x] Task: Current \`${sha}\``,
  })

const bandText = async ($: Engine) => {
  const ui = await $.ui.mount({ plugin: 'measure-guard', surface: 'terminal', ...BAND })
  const texts = (await ui.findAll({ type: 'Text' })).map(found => found.text).join('\n')
  await ui.unmount()
  return texts
}

test('advise: a task marked [x] with no SHA shows in the band only', { options: { mode: 'advise' } }, async ($, on) => {
  const w = world(on, files())
  await $.session.start(START)
  await submit($)
  await finish($, null)
  expect((await stop($)).block).toBeUndefined()
  const band = await bandText($)
  expect(band).toContain('Task: Current')
  expect(band).toContain('no commit SHA')
  expect(band).not.toContain('Old done with no SHA')
  expect(w.toasts).toEqual([])
  expect((await submit($)).additionalContext?.join('\n') ?? '').not.toContain('end of the last turn')
})

test('guard: changes with no [~] task give a band line, a toast, and a reminder', async ($, on) => {
  const w = world(on, files())
  await $.session.start(START)
  await submit($)
  w.git = ' M src/a.ts\n'
  await finish($, 'abcdef1')
  expect((await stop($)).block).toBeUndefined()
  expect(await bandText($)).toContain('src/a.ts')
  expect(w.toasts.join('\n')).toContain('src/a.ts')
  const reminder = (await submit($)).additionalContext?.join('\n') ?? ''
  expect(reminder).toContain('end of the last turn')
  expect(reminder).toContain('src/a.ts')
})

test('files that were dirty before the turn, and changes in measure/, are not problems', async ($, on) => {
  const w = world(on, files())
  w.git = ' M src/old.ts\n'
  await $.session.start(START)
  await submit($)
  w.git = ' M src/old.ts\n M measure/tracks.md\n'
  await finish($, 'abcdef1')
  await stop($)
  expect(w.toasts).toEqual([])
  expect(await bandText($)).not.toContain('End of turn')
})

test('strict: the turn stays open twice, then ends with a report', { options: { mode: 'strict' } }, async ($, on) => {
  const w = world(on, files())
  await $.session.start(START)
  await submit($)
  await finish($, null)
  expect((await stop($)).block).toContain('Task: Current')
  expect((await stop($)).block).toContain('Task: Current')
  expect((await stop($)).block).toBeUndefined()
  expect(w.toasts.join('\n')).toContain('Task: Current')
})

test('strict: a new prompt starts the block count again', { options: { mode: 'strict' } }, async ($, on) => {
  world(on, files())
  await $.session.start(START)
  await submit($)
  await finish($, null)
  await stop($)
  await stop($)
  await stop($)
  await submit($)
  await $.tool.call({ tool: 'Edit', file_path: PLAN, old_string: '- [ ] Task: Next', new_string: '- [x] Task: Next' })
  expect((await stop($)).block).toContain('Task: Next')
})

test('a clean turn has no problem and no block', { options: { mode: 'strict' } }, async ($, on) => {
  const w = world(on, files())
  await $.session.start(START)
  await submit($)
  await finish($, 'abcdef1')
  expect((await stop($)).block).toBeUndefined()
  expect(w.toasts).toEqual([])
})

describe('turn helpers', () => {
  test('read porcelain lines and the paths that changed in the turn', () => {
    expect(statusLinesOf(' M a.ts\n?? b.ts\n\n')).toEqual([' M a.ts', '?? b.ts'])
    const start = [' M a.ts']
    const end = [' M a.ts', 'M  c.ts', 'R  old.ts -> new.ts', '?? measure/x.md', ' M "sp ace.ts"']
    expect(changedDuringTurn(start, end)).toEqual(['c.ts', 'new.ts', 'sp ace.ts'])
  })

  test('list the [x] tasks with no SHA', () => {
    expect(unshaTasks(parsePlan(PLAN_MD))).toEqual(['Task: Old done with no SHA'])
  })
})
