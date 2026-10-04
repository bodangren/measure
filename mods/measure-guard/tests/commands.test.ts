// S5: /measure-status, /measure-off, and /measure-on.
import { describe, expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { ToolCallResult } from 'claude-code'
import { offKey } from '../hooks/guards'
import { parsePlan, statusLines } from '../hooks/parse'
import type { Snapshot, TrackEntry } from '../types'
import { BAND_PLAN } from './fixtures/plans'
import { BAND, ROOT, RUN, START, STATUS_PANE, realFiles, world } from './world'

const GUARD_PLAN = `${ROOT}/measure/tracks/measure_guard_20261004/plan.md`
const SOURCE = `${ROOT}/src/a.ts`
const KEY = offKey(ROOT)

/** The real files with no [~] task, so the edit guard denies. */
const noTaskFiles = (): Record<string, string> => {
  const files: Record<string, string> = { ...realFiles(), [SOURCE]: 'a' }
  files[GUARD_PLAN] = (files[GUARD_PLAN] as string).replace('- [~] Task 1.4:', '- [x] Task 1.4:')
  return files
}

const denied = (ran: ToolCallResult): string | undefined =>
  ran.deny ?? (ran.isError === true ? ran.text : undefined)

const edit = ($: Engine) => $.tool.call({ tool: 'Edit', file_path: SOURCE, old_string: 'a', new_string: 'b' })

const bandText = async ($: Engine) => {
  const ui = await $.ui.mount({ plugin: 'measure-guard', surface: 'terminal', ...BAND })
  const text = (await ui.find({ type: 'Text', text: 'Measure' }))?.text
  await ui.unmount()
  return text ?? ''
}

test('/measure-off lets every call pass for the session and shows it in the band', async ($, on) => {
  const w = world(on, noTaskFiles())
  await $.session.start(START)
  expect(denied(await edit($))).toBeDefined()
  await $.command.run(RUN('measure-off'))
  expect(denied(await edit($))).toBeUndefined()
  expect(await bandText($)).toContain('guards off for this session')
  expect(w.store[KEY]).toBeUndefined()
})

test('/measure-on turns the guards on again', async ($, on) => {
  world(on, noTaskFiles())
  await $.session.start(START)
  await $.command.run(RUN('measure-off'))
  await $.command.run(RUN('measure-on'))
  expect(denied(await edit($))).toBeDefined()
})

test('/measure-off repo keeps the choice in the store', async ($, on) => {
  const w = world(on, noTaskFiles())
  await $.session.start(START)
  await $.command.run(RUN('measure-off', 'repo'))
  expect(w.store[KEY]).toBe(true)
  expect(denied(await edit($))).toBeUndefined()
})

test('a new session in a repository turned off keeps the guards off', async ($, on) => {
  world(on, noTaskFiles(), { store: { [KEY]: true } })
  await $.session.start(START)
  expect(denied(await edit($))).toBeUndefined()
  expect(await bandText($)).toContain('guards off for this repository')
})

test('a new session after a session-only /measure-off has the guards on', async ($, on) => {
  world(on, noTaskFiles())
  await $.session.start(START)
  expect(denied(await edit($))).toBeDefined()
})

test('/measure-on repo removes the choice from the store', async ($, on) => {
  const w = world(on, noTaskFiles(), { store: { [KEY]: true } })
  await $.session.start(START)
  await $.command.run(RUN('measure-on', 'repo'))
  expect(w.store[KEY]).toBeUndefined()
  expect(denied(await edit($))).toBeDefined()
})

test('/measure-status opens a pane with the tracks, the progress, and the [b] tasks', async ($, on) => {
  const w = world(on, realFiles())
  await $.session.start(START)
  await $.command.run(RUN('measure-status'))
  expect(w.opened).toEqual(['measure-status'])
  const ui = await $.ui.mount({ plugin: 'measure-guard', surface: 'terminal', ...STATUS_PANE })
  expect(await ui.find({ type: 'Text', text: '[~] measure-guard: Claude Code mod' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '[x] Visual Refresh: Define Unique Identity' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Phase S1: Plan context in every prompt · 3/7 closed' })).toBeDefined()
  await ui.unmount()
})

test('/measure-status opens the pane so that Escape closes it', async ($, on) => {
  const w = world(on, realFiles())
  await $.session.start(START)
  expect(await $.command.run(RUN('measure-status'))).toMatchObject({ text: 'Opened the Measure status pane.' })
  expect(w.openArgs).toEqual([{ id: 'measure-status', title: 'Measure status', closeOnEscape: true }])
})

test('/measure-status closes the pane when it is open', async ($, on) => {
  const w = world(on, realFiles())
  await $.session.start(START)
  await $.command.run(RUN('measure-status'))
  expect(await $.command.run(RUN('measure-status'))).toMatchObject({ text: 'Closed the Measure status pane.' })
  expect(w.closed).toEqual(['measure-status'])
  expect(w.panes).toEqual([])
  expect(w.opened).toEqual(['measure-status'])
})

describe('statusLines', () => {
  const entry: TrackEntry = { line: 0, marker: '~', name: 'Band work', id: 'band_1', folder: 'tracks/band_1' }
  const snapshot: Snapshot = {
    root: ROOT,
    hasMeasure: true,
    isRepo: true,
  tracksPath: null,
    tracks: [entry],
    active: { entry, planPath: `${ROOT}/measure/tracks/band_1/plan.md`, plan: parsePlan(BAND_PLAN) },
    inProgressCount: 1,
    parseError: null,
  }

  test('lists the phases with closed counts and checkpoints, the [b] tasks, and the guards', () => {
    const lines = statusLines(snapshot, null)
    expect(lines).toContain('  [~] Band work (tracks/band_1) · active')
    expect(lines).toContain('  Phase 1: One · 1/1 closed · checkpoint 1111111')
    expect(lines).toContain('  Phase 2: Two · 2/7 closed')
    expect(lines).toContain('  [b] Task: Second deferred:user')
    expect(lines).toContain('  [b] Task: Sixth (open: no deferred:<owner>)')
    expect(lines).toContain('Guards: on')
    expect(statusLines(snapshot, 'repo')).toContain('Guards: off for this repository (/measure-on repo turns them on)')
  })
})
