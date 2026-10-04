// S4: a git repository with no measure/ folder.
import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { ToolCallResult } from 'claude-code'
import { SETUP_PROMPT } from '../hooks/guards'
import { BAND, ROOT, START, SURFACES, realFiles, world } from './world'

const SOURCE = `${ROOT}/src/a.ts`

const denied = (ran: ToolCallResult): string | undefined =>
  ran.deny ?? (ran.isError === true ? ran.text : undefined)

const edit = ($: Engine) => $.tool.call({ tool: 'Edit', file_path: SOURCE, old_string: 'a', new_string: 'b' })

const band = ($: Engine, surface: (typeof SURFACES)[number] = 'terminal') =>
  $.ui.mount({ plugin: 'measure-guard', surface, ...BAND })

test('the band asks the setup question with 2 buttons', async ($, on) => {
  world(on, { [SOURCE]: 'a' })
  await $.session.start(START)
  for (const surface of SURFACES) {
    const ui = await band($, surface)
    expect(await ui.find({ type: 'Text', text: 'no measure/ folder' })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'setup', text: 'Set up Measure' })).toBeDefined()
    expect(await ui.find({ type: 'Button', key: 'off', text: 'Turn off for session' })).toBeDefined()
    await ui.unmount()
  }
})

test('before an answer, an edit is denied and the agent must ask the user', async ($, on) => {
  world(on, { [SOURCE]: 'a' })
  await $.session.start(START)
  const reason = denied(await edit($)) ?? ''
  expect(reason).toContain('Ask the user')
  expect(reason).toContain('Set up Measure')
  expect(reason).toContain('Turn off for session')
})

test('advise mode shows the question and denies nothing', { options: { mode: 'advise' } }, async ($, on) => {
  world(on, { [SOURCE]: 'a' })
  await $.session.start(START)
  const ui = await band($)
  expect(await ui.find({ type: 'Button', key: 'setup' })).toBeDefined()
  await ui.unmount()
  expect(denied(await edit($))).toBeUndefined()
})

test('[ Turn off for session ] lets the edits pass and hides the band', async ($, on) => {
  world(on, { [SOURCE]: 'a' })
  await $.session.start(START)
  const ui = await band($)
  await ui.press({ key: 'off' })
  await ui.unmount()
  expect(denied(await edit($))).toBeUndefined()
  const after = await band($)
  expect(await after.find({ type: 'Button', key: 'setup' })).toBeUndefined()
  await after.unmount()
})

test('[ Set up Measure ] sends the setup prompt and lets the edits pass', async ($, on) => {
  const w = world(on, { [SOURCE]: 'a' })
  await $.session.start(START)
  const ui = await band($)
  await ui.press({ key: 'setup' })
  await ui.unmount()
  expect(w.submitted).toEqual([SETUP_PROMPT])
  expect(denied(await edit($))).toBeUndefined()
})

test('outside a git repository the mod does nothing', async ($, on) => {
  world(on, { ...realFiles(), [SOURCE]: 'a' }, { isRepo: false })
  await $.session.start(START)
  const ui = await band($)
  expect(await ui.find({ type: 'Text', text: 'Measure' })).toBeUndefined()
  await ui.unmount()
  const noted = await $.classic.UserPromptSubmit({ prompt: 'hi' })
  expect(noted.additionalContext).toBeUndefined()
})
