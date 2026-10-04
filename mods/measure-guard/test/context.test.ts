// S1: the fixed rule section and the task note, through the engine.
import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import { COMPOSE, ROOT, START, SUMMARY, realFiles, world } from './world'

const PLAN = `${ROOT}/measure/tracks/measure_guard_20261004/plan.md`
const RULE_ID = 'measure-guard:rule'

const ruleText = async ($: Engine) => {
  const { sections } = await $.prompt.compose(COMPOSE)
  return sections.find(s => s.id === RULE_ID)?.text
}

const submit = ($: Engine) =>
  $.classic.UserPromptSubmit({ prompt: 'go on' })

test('the rule section names the workflow and stays the same when the task changes', async ($, on) => {
  const w = world(on, realFiles())
  await $.session.start(START)

  const before = await ruleText($)
  expect(before).toContain('follow the Task Workflow in `measure/workflow.md`')

  const plan = w.files[PLAN] as string
  await $.tool.call({
    tool: 'Edit',
    file_path: PLAN,
    old_string: '- [~] Task 1.4:',
    new_string: '- [x] Task 1.4:',
  })
  expect(w.files[PLAN]).not.toBe(plan)
  expect(await ruleText($)).toBe(before)
})

test('no rule section and no note without a measure/ folder', async ($, on) => {
  world(on, {})
  await $.session.start(START)
  expect(await ruleText($)).toBeUndefined()
  expect((await submit($)).additionalContext).toBeUndefined()
})

test('the first prompt gets a note with the track, the task, and the mode', async ($, on) => {
  world(on, realFiles())
  await $.session.start(START)
  const { additionalContext } = await submit($)
  const note = additionalContext?.join('\n') ?? ''
  expect(note).toContain('measure-guard: Claude Code mod that guards the Measure workflow')
  expect(note).toContain('Task 1.4: Test (Red)')
  expect(note).toContain('Mode: guard')
})

test('the mode in the note follows the userConfig value', { options: { mode: 'strict' } }, async ($, on) => {
  world(on, realFiles())
  await $.session.start(START)
  const note = (await submit($)).additionalContext?.join('\n') ?? ''
  expect(note).toContain('Mode: strict')
})

test('no second note while the task stays the same', async ($, on) => {
  world(on, realFiles())
  await $.session.start(START)
  expect((await submit($)).additionalContext?.length).toBe(1)
  expect((await submit($)).additionalContext).toBeUndefined()
})

test('an edit that changes the task gets the new note in its result', async ($, on) => {
  world(on, realFiles())
  await $.session.start(START)
  await submit($)

  const done = await $.tool.call({
    tool: 'Edit',
    file_path: PLAN,
    old_string: '- [~] Task 1.4:',
    new_string: '- [x] Task 1.4:',
  })
  const note = done.context?.join('\n') ?? ''
  expect(note).toContain('No task is in progress')

  const started = await $.tool.call({
    tool: 'Edit',
    file_path: PLAN,
    old_string: '- [ ] Task 1.5:',
    new_string: '- [~] Task 1.5:',
  })
  expect(started.context?.join('\n')).toContain('Task 1.5: Implement (Green)')
  expect((await submit($)).additionalContext).toBeUndefined()
})

test('an edit outside measure/ gets no note', async ($, on) => {
  world(on, { ...realFiles(), [`${ROOT}/src/a.ts`]: 'a' })
  await $.session.start(START)
  await submit($)
  const ran = await $.tool.call({ tool: 'Edit', file_path: `${ROOT}/src/a.ts`, old_string: 'a', new_string: 'b' })
  expect(ran.context).toBeUndefined()
})

test('a compaction sends the note again at the next prompt', async ($, on) => {
  world(on, realFiles())
  await $.session.start(START)
  await submit($)
  await $.session.compact({ trigger: 'manual', messages: [...SUMMARY] })
  expect((await submit($)).additionalContext?.join('\n')).toContain('Task 1.4: Test (Red)')
})
