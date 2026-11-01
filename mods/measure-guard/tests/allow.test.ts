// P1: the allow list of measure/guard-allow in the Claude Code mod.
import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { ToolCallResult } from 'claude-code'
import { ROOT, RUN, START, STATUS_PANE, realFiles, world } from './world'

const GUARD_PLAN = `${ROOT}/measure/tracks/measure_guard_20261004/plan.md`
const TRACKS = `${ROOT}/measure/tracks.md`
const ALLOW = `${ROOT}/measure/guard-allow`
const LIST = 'scripts/daily-report/work/\n'

/** The real files with no [~] task in any plan. */
const noTaskFiles = (): Record<string, string> => {
  const files: Record<string, string> = { ...realFiles() }
  files[GUARD_PLAN] = (files[GUARD_PLAN] as string).replace('- [~] Task 1.4:', '- [x] Task 1.4:')
  return files
}

/** The real files with the allow list and no [~] task. */
const listFiles = (list = LIST): Record<string, string> => ({ ...noTaskFiles(), [ALLOW]: list })

/** The real files with a folder at measure/guard-allow and no [~] task. */
const folderFiles = (): Record<string, string> => ({ ...noTaskFiles(), [`${ALLOW}/x`]: 'x' })

const denied = (ran: ToolCallResult): string | undefined =>
  ran.deny ?? (ran.isError === true ? ran.text : undefined)

const write = ($: Engine, path: string) => $.tool.call({ tool: 'Write', file_path: path, content: 'x' })

/** The text lines of the status pane. */
const paneLines = async ($: Engine): Promise<string[]> => {
  const ui = await $.ui.mount({ plugin: 'measure-guard', surface: 'terminal', ...STATUS_PANE })
  const lines = (await ui.findAll({ type: 'Text' })).map(found => found.text)
  await ui.unmount()
  return lines
}

describe('allow list in the mod', () => {
  test('M1 the tool hook allows the list and denies the near misses', async ($, on) => {
    world(on, listFiles())
    await $.session.start(START)
    expect(denied(await write($, `${ROOT}/scripts/daily-report/work/report.md`))).toBeUndefined()
    expect(denied(await write($, `${ROOT}/scripts/daily-report/collect.py`))).toContain('measure-guard: no task in the track')
    expect(denied(await write($, `${ROOT}/scripts/daily-report/work-old/a.md`))).toContain('measure-guard: no task in the track')
  })

  test('M2 /measure-status shows the list line', async ($, on) => {
    world(on, listFiles())
    await $.session.start(START)
    await $.command.run(RUN('measure-status'))
    const ui = await $.ui.mount({ plugin: 'measure-guard', surface: 'terminal', ...STATUS_PANE })
    expect(await ui.find({ type: 'Text', text: 'Allow list (measure/guard-allow): scripts/daily-report/work/' })).toBeDefined()
    await ui.unmount()
  })

  test('M3 a folder at measure/guard-allow gives no list and no crash', async ($, on) => {
    world(on, folderFiles())
    await $.session.start(START)
    await $.command.run(RUN('measure-status'))
    expect((await paneLines($)).some(line => line.startsWith('Allow list'))).toBe(false)
    expect(denied(await write($, `${ROOT}/scripts/daily-report/work/report.md`))).toContain('measure-guard: no task in the track')
  })

  test('M4 the list survives a parseError', async ($, on) => {
    world(on, { ...listFiles(), [TRACKS]: '# Project Tracks\n\n- [~] Track one\n' })
    await $.session.start(START)
    await $.command.run(RUN('measure-status'))
    const ui = await $.ui.mount({ plugin: 'measure-guard', surface: 'terminal', ...STATUS_PANE })
    expect(await ui.find({ type: 'Text', text: 'The Measure files cannot be read: ' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Allow list (measure/guard-allow): scripts/daily-report/work/' })).toBeDefined()
    await ui.unmount()
  })
})
