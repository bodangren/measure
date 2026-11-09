// Contract tests for the pure policy of dsh-idle-compaction (Story FR-4..FR-9).
// The module has no Harness dependency, so every decision is pinned here without
// a Cordis context: classification, the initial scan, live observation, the idle
// gate, and config validation.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  COMPACTION_EVENT_TYPES,
  compactGate,
  createState,
  isActivityEvent,
  isSuccessfulCompactionEnd,
  observe,
  parseSettings,
} from '../src/policy.js'

const agent = { id: 'session-a', session: { id: 'session-a' } }

/** One committed-event fixture; `time` is Unix epoch milliseconds. */
const event = (type, seq, time, data = {}, extra = {}) => ({ type, seq, time, data, ...extra })

const user = (seq, time) => event('user/message', seq, time, {}, { surfaceOp: 'append' })
const assistant = (seq, time) => event('assistant/message', seq, time, {}, { surfaceOp: 'append' })
const toolResult = (seq, time) => event('tool/result', seq, time, {}, { surfaceOp: 'append' })
const turn = (name, seq, time) => event(name, seq, time, { turn: 1 })
const checkpoint = (seq, time) =>
  event('user/message', seq, time, {}, { surfaceOp: { op: 'replace', startSeq: seq - 2, endSeq: seq - 1 } })
const compactionEnd = (seq, time, error) =>
  event('compaction/end', seq, time, error === undefined ? { compactionId: 'c1', turn: null } : { compactionId: 'c1', turn: null, error })
const seedBoundary = (seq, time) => event('session/end-seed', seq, time)
const record = (seq, time) => ({ type: 'plugin:example/state', seq, time, data: {}, ignorable: true })

test('activity classification: conversation work is activity', () => {
  assert.equal(isActivityEvent(user(1, 1_000)), true)
  assert.equal(isActivityEvent(assistant(2, 2_000)), true)
  assert.equal(isActivityEvent(toolResult(3, 3_000)), true)
  assert.equal(isActivityEvent(turn('turn/start', 4, 4_000)), true)
  assert.equal(isActivityEvent(turn('turn/end', 5, 5_000)), true)
  assert.equal(isActivityEvent(event('assistant/attempt', 6, 6_000, {})), true)
  assert.equal(isActivityEvent(event('request/header', 7, 7_000, { header: {}, reason: 'initial' })), true)
})

test('activity classification: the compaction transaction is not activity', () => {
  for (const type of COMPACTION_EVENT_TYPES) {
    assert.equal(isActivityEvent(event(type, 1, 1_000, {})), false, type)
  }
  assert.equal(isActivityEvent(checkpoint(5, 5_000)), false)
})

test('activity classification: seed boundaries and ignorable records are not activity', () => {
  assert.equal(isActivityEvent(seedBoundary(1, 1_000)), false)
  assert.equal(isActivityEvent(record(2, 2_000)), false)
  // A required (non-ignorable) log-only event still counts as session work.
  assert.equal(isActivityEvent(event('model/selection', 3, 3_000, { provider: 'p', model: 'm' })), true)
})

test('successful compaction end ignores a failed attempt', () => {
  assert.equal(isSuccessfulCompactionEnd(compactionEnd(1, 1_000)), true)
  assert.equal(isSuccessfulCompactionEnd(compactionEnd(1, 1_000, 'summary failed')), false)
  assert.equal(isSuccessfulCompactionEnd(event('compaction/start', 2, 2_000, {})), false)
  assert.equal(isSuccessfulCompactionEnd(user(3, 3_000)), false)
})

test('createState scans an empty log', () => {
  const state = createState(agent, [])
  assert.equal(state.agent, agent)
  assert.equal(state.lastActivitySeq, -1)
  assert.equal(state.lastActivityAt, null)
  assert.equal(state.lastCompactionEndSeq, -1)
  assert.equal(state.lastAttemptAt, 0)
  assert.equal(state.controller, null)
})

test('createState keeps the newest activity and the last successful compaction', () => {
  const state = createState(agent, [
    event('system/message', 0, 500),
    user(1, 1_000),
    assistant(2, 2_000),
    event('compaction/start', 3, 3_000, { compactionId: 'c1', turn: 4 }),
    event('compaction/summary', 4, 3_100, { compactionId: 'c1', summary: [] }),
    checkpoint(5, 3_200),
    compactionEnd(6, 3_300),
    turn('turn/end', 7, 3_400),
  ])
  assert.equal(state.lastActivitySeq, 7)
  assert.equal(state.lastActivityAt, 3_400)
  assert.equal(state.lastCompactionEndSeq, 6)
})

test('createState: a failed compaction end never counts as the last compaction', () => {
  const state = createState(agent, [user(1, 1_000), compactionEnd(2, 2_000, 'commit failed'), assistant(3, 3_000)])
  assert.equal(state.lastCompactionEndSeq, -1)
  assert.equal(state.lastActivitySeq, 3)
})

test('createState: activity and checkpoint interleaving keeps the right order', () => {
  const state = createState(agent, [user(1, 1_000), compactionEnd(2, 2_000), assistant(3, 3_000)])
  assert.equal(state.lastActivitySeq, 3)
  assert.equal(state.lastCompactionEndSeq, 2)
})

test('observe folds live events into the same clock', () => {
  const state = createState(agent, [user(1, 1_000)])
  observe(state, assistant(2, 5_000))
  assert.equal(state.lastActivitySeq, 2)
  assert.equal(state.lastActivityAt, 5_000)
  observe(state, event('compaction/start', 3, 6_000, {}))
  assert.equal(state.lastActivitySeq, 2)
  observe(state, checkpoint(4, 6_100))
  assert.equal(state.lastActivitySeq, 2)
  observe(state, compactionEnd(5, 6_200))
  assert.equal(state.lastCompactionEndSeq, 5)
  observe(state, compactionEnd(6, 6_300, 'boom'))
  assert.equal(state.lastCompactionEndSeq, 5)
})

test('compactGate waits for the idle window', () => {
  const state = createState(agent, [user(1, 10_000)])
  const idleMs = 55 * 60_000
  assert.equal(compactGate(state, { idleMs, now: 10_000, status: 'idle' }), false)
  assert.equal(compactGate(state, { idleMs, now: 10_000 + idleMs - 1, status: 'idle' }), false)
  assert.equal(compactGate(state, { idleMs, now: 10_000 + idleMs, status: 'idle' }), true)
})

test('compactGate requires a new activity after the last successful compaction', () => {
  const idleMs = 1_000
  const compacted = createState(agent, [user(1, 1_000), checkpoint(2, 1_100), compactionEnd(3, 1_200)])
  assert.equal(compactGate(compacted, { idleMs, now: 100_000, status: 'idle' }), false)
  const again = createState(agent, [user(1, 1_000), checkpoint(2, 1_100), compactionEnd(3, 1_200), assistant(4, 2_000)])
  assert.equal(compactGate(again, { idleMs, now: 100_000, status: 'idle' }), true)
})

test('compactGate is closed for a running agent, an in-flight compaction, or no activity', () => {
  const idleMs = 1_000
  const state = createState(agent, [user(1, 1_000)])
  assert.equal(compactGate(state, { idleMs, now: 100_000, status: 'running' }), false)
  const inFlight = { ...state, controller: { abort() {} } }
  assert.equal(compactGate(inFlight, { idleMs, now: 100_000, status: 'idle' }), false)
  const empty = createState(agent, [])
  assert.equal(compactGate(empty, { idleMs, now: 100_000, status: 'idle' }), false)
})

test('compactGate: the attempt time starts a new idle window after a no-op or failure', () => {
  const idleMs = 1_000
  const state = createState(agent, [user(1, 1_000)])
  state.lastAttemptAt = 50_000
  assert.equal(compactGate(state, { idleMs, now: 50_999, status: 'idle' }), false)
  assert.equal(compactGate(state, { idleMs, now: 51_000, status: 'idle' }), true)
})

test('parseSettings applies the defaults', () => {
  const settings = parseSettings(undefined)
  assert.deepEqual(settings, {
    enabled: true,
    idleMinutes: 55,
    checkSeconds: 60,
    idleMs: 55 * 60_000,
    pollMs: 60_000,
  })
})

test('parseSettings accepts overrides, including a fractional idle window', () => {
  const settings = parseSettings({ idleMinutes: 0.05, checkSeconds: 2, enabled: true })
  assert.equal(settings.idleMinutes, 0.05)
  assert.equal(settings.idleMs, 3_000)
  assert.equal(settings.checkSeconds, 2)
  assert.equal(settings.pollMs, 2_000)
  assert.equal(settings.enabled, true)
})

test('parseSettings: enabled false is accepted and registers nothing', () => {
  assert.equal(parseSettings({ enabled: false }).enabled, false)
})

test('parseSettings rejects unknown keys and invalid values', () => {
  assert.throws(() => parseSettings({ idleMinute: 55 }), /unknown setting 'idleMinute'/)
  assert.throws(() => parseSettings({ enabled: 'yes' }), /enabled/)
  assert.throws(() => parseSettings({ idleMinutes: 0 }), /idleMinutes/)
  assert.throws(() => parseSettings({ idleMinutes: -1 }), /idleMinutes/)
  assert.throws(() => parseSettings({ idleMinutes: '55' }), /idleMinutes/)
  assert.throws(() => parseSettings({ idleMinutes: Number.NaN }), /idleMinutes/)
  assert.throws(() => parseSettings({ checkSeconds: 0 }), /checkSeconds/)
  assert.throws(() => parseSettings({ checkSeconds: Infinity }), /checkSeconds/)
  assert.throws(() => parseSettings('nope'), /config/)
})
