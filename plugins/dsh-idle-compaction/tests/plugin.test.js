// Wiring tests for the dsh-idle-compaction Host plugin: a fake Cordis context
// proves the watcher binds live and created agents, waits for the one-time
// history scan, ticks the idle gate, calls the preset's backend once per idle
// window, contains busy/no-op/failure outcomes, and drains on disposal.
import assert from 'node:assert/strict'
import test from 'node:test'

import { apply, inject, name } from '../index.js'

const IDLE = { idleMinutes: 0.05, checkSeconds: 1 } // 3 s idle window, 1 s tick

/** One committed-event fixture; `time` is Unix epoch milliseconds. */
const event = (type, seq, time, data = {}, extra = {}) => ({ type, seq, time, data, ...extra })
const user = (seq, time) => event('user/message', seq, time, {}, { surfaceOp: 'append' })
const assistant = (seq, time) => event('assistant/message', seq, time, {}, { surfaceOp: 'append' })
const compactionEnd = (seq, time, error) =>
  event('compaction/end', seq, time, error === undefined ? { compactionId: 'c1', turn: null } : { compactionId: 'c1', turn: null, error })

/** A live-agent fixture with its fake session log and mutable status. */
const makeAgent = (id, events, status = 'idle') => {
  const session = { id, snapshotEvents: () => events }
  return { id, session, status, events }
}

const result = (endSeq = 3) => ({ endSeq, shadowedSeqs: [1, 2], shadowedTokenCount: 42 })

const settle = () => new Promise(resolve => setTimeout(resolve, 0))

/** Build a fake Cordis context: listeners, one effect, captured timer, fake registry and query seam. */
function createFakeContext({ live = [], roots = live, events = {}, sessionQuery, compactNow } = {}) {
  const warnings = []
  const listeners = new Map()
  const disposers = []
  const timers = []
  const eventsById = new Map(Object.entries(events))
  for (const agent of live) eventsById.set(agent.id, agent.events ?? [])
  const register = eventName => {
    if (!listeners.has(eventName)) listeners.set(eventName, [])
    return listeners.get(eventName)
  }
  const ctx = {
    agents: {
      list: () => [...live],
      roots: () => [...roots],
    },
    compaction: { compactNow: compactNow ?? (async () => result()) },
    sessionQuery: { listEvents: sessionQuery ?? (async id => eventsById.get(id) ?? []) },
    logger: { warn: text => warnings.push(text) },
    on(eventName, handler) {
      const bucket = register(eventName)
      bucket.push(handler)
      return () => {
        const index = bucket.indexOf(handler)
        if (index >= 0) bucket.splice(index, 1)
      }
    },
    effect(callback) {
      disposers.push(callback())
      return () => {}
    },
    interval(callback, ms) {
      const timer = { callback, ms, cleared: false }
      timers.push(timer)
      return () => {
        timer.cleared = true
      }
    },
  }
  return {
    ctx,
    warnings,
    timers,
    listeners,
    emit(eventName, ...args) {
      if (eventName === 'agent/created' && args[0]?.agent !== undefined) {
        const created = args[0].agent
        if (!live.some(one => one === created)) live.push(created)
        eventsById.set(created.id, created.events ?? [])
      }
      if (eventName === 'agent/disposed' && args[0]?.agent !== undefined) {
        const gone = args[0].agent
        for (const list of [live, roots]) {
          const index = list.indexOf(gone)
          if (index >= 0) list.splice(index, 1)
        }
        eventsById.delete(gone.id)
      }
      for (const handler of listeners.get(eventName) ?? []) handler(...args)
    },
    listenerCount(eventName) {
      return (listeners.get(eventName) ?? []).length
    },
    runTick(index = 0) {
      timers[index].callback()
    },
    async dispose() {
      for (const disposer of disposers) await disposer()
    },
  }
}

test('exports the loader metadata', () => {
  assert.equal(name, 'idle-compaction')
  assert.deepEqual(inject, ['compaction', 'agents', 'sessionQuery', 'timer'])
})

test('binds live root agents, waits for the history scan, and compacts on an idle tick', async () => {
  const root = makeAgent('root-a', [user(1, Date.now() - 10_000)])
  const calls = []
  const fake = createFakeContext({
    live: [root],
    events: { 'root-a': [user(1, Date.now() - 10_000)] },
    compactNow: async (agent, signal) => {
      calls.push({ agent, signal })
      return result()
    },
  })
  apply(fake.ctx, IDLE)
  assert.equal(fake.timers.length, 1)
  assert.equal(fake.timers[0].ms, 1_000)
  fake.runTick() // scan has not settled yet: nothing may run
  await settle()
  assert.equal(calls.length, 0)
  fake.runTick()
  await settle()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].agent, root)
  assert.ok(calls[0].signal instanceof AbortSignal)
  assert.ok(fake.warnings.some(text => text.includes('watching session root-a')))
  assert.ok(fake.warnings.some(text => text.includes('compacted idle session root-a')))
  await fake.dispose()
})

test('a tick before the one-time scan settles never compacts', async () => {
  const root = makeAgent('root-scan', [user(1, Date.now() - 10_000)])
  let release
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    sessionQuery: () =>
      new Promise(resolve => {
        release = resolve
      }),
    compactNow: async () => {
      calls += 1
      return result()
    },
  })
  apply(fake.ctx, IDLE)
  fake.runTick()
  await settle()
  assert.equal(calls, 0)
  release([user(1, Date.now() - 10_000)])
  await settle()
  fake.runTick()
  await settle()
  assert.equal(calls, 1)
  await fake.dispose()
})

test('a history read failure is reported and does not compact', async () => {
  const root = makeAgent('root-scan-fail', [])
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    sessionQuery: async () => {
      throw new Error('query backend unavailable')
    },
    compactNow: async () => {
      calls += 1
      return result()
    },
  })
  apply(fake.ctx, IDLE)
  await settle()
  fake.runTick()
  await settle()
  assert.equal(calls, 0)
  assert.ok(fake.warnings.some(text => text.includes('cannot read the history of session root-scan-fail')))
  await fake.dispose()
})

test('a child agent is never bound, listed, or created', async () => {
  const parent = makeAgent('root-parent', [user(1, Date.now() - 10_000)])
  const child = makeAgent('child-a', [user(1, Date.now() - 10_000)])
  let calls = 0
  const fake = createFakeContext({
    live: [child],
    roots: [parent],
    events: { 'child-a': [user(1, Date.now() - 10_000)] },
    compactNow: async () => {
      calls += 1
      return result()
    },
  })
  apply(fake.ctx, IDLE)
  fake.emit('agent/created', { agent: child })
  await settle()
  fake.runTick()
  await settle()
  assert.equal(calls, 0)
  await fake.dispose()
})

test('binds an agent from the creation edge', async () => {
  const root = makeAgent('root-created', [user(1, Date.now() - 10_000)])
  const calls = []
  const fake = createFakeContext({
    live: [],
    compactNow: async agent => {
      calls.push(agent)
      return result()
    },
  })
  apply(fake.ctx, IDLE)
  fake.emit('agent/created', { agent: root })
  assert.equal(fake.listenerCount('agent/created'), 1)
  await settle()
  fake.runTick()
  await settle()
  assert.equal(calls.length, 1)
  assert.equal(calls[0], root)
  await fake.dispose()
})

test('compacts once per idle window and re-arms only after new activity', async () => {
  const root = makeAgent('root-b', [user(1, Date.now() - 10_000)])
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    events: { 'root-b': [user(1, Date.now() - 10_000)] },
    compactNow: async () => {
      calls += 1
      return result()
    },
  })
  apply(fake.ctx, IDLE)
  await settle()
  fake.runTick()
  await settle()
  assert.equal(calls, 1)

  // Still idle with no new event: the recorded end seq closes the window.
  fake.runTick()
  await settle()
  assert.equal(calls, 1)

  // One new activity, old enough to satisfy the idle window again.
  fake.emit('session/event', root.session, assistant(4, Date.now() - 5_000))
  fake.runTick()
  await settle()
  assert.equal(calls, 2)
  await fake.dispose()
})

test('a live event during the scan is not lost and an older scan event cannot move the clock back', async () => {
  const root = makeAgent('root-merge', [])
  let release
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    sessionQuery: () =>
      new Promise(resolve => {
        release = resolve
      }),
    compactNow: async () => {
      calls += 1
      return result(5)
    },
  })
  apply(fake.ctx, IDLE)
  // The live feed sees seq 7 before the scan returns events 2 and a compaction end 6.
  fake.emit('session/event', root.session, user(7, Date.now() - 10_000))
  release([user(2, Date.now() - 100_000), compactionEnd(6, Date.now() - 50_000)])
  await settle()
  fake.runTick()
  await settle()
  assert.equal(calls, 1)
  await fake.dispose()
})

test('an active agent is not compacted until it is idle', async () => {
  const root = makeAgent('root-running', [user(1, Date.now() - 10_000)], 'running')
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    events: { 'root-running': [user(1, Date.now() - 10_000)] },
    compactNow: async () => {
      calls += 1
      return result()
    },
  })
  apply(fake.ctx, IDLE)
  await settle()
  fake.runTick()
  await settle()
  assert.equal(calls, 0)
  root.status = 'idle'
  fake.runTick()
  await settle()
  assert.equal(calls, 1)
  await fake.dispose()
})

test('a no-op attempt backs off one idle window instead of retrying every tick', async () => {
  const root = makeAgent('root-noop', [user(1, Date.now() - 10_000)])
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    events: { 'root-noop': [user(1, Date.now() - 10_000)] },
    compactNow: async () => {
      calls += 1
      return null
    },
  })
  apply(fake.ctx, { idleMinutes: 0.001, checkSeconds: 1 }) // 60 ms window
  await settle()
  fake.runTick()
  await settle()
  assert.equal(calls, 1)
  fake.runTick()
  await settle()
  assert.equal(calls, 1, 'a recorded attempt closes the window')
  assert.ok(fake.warnings.some(text => text.includes('no compactable history')))
  await new Promise(resolve => setTimeout(resolve, 80))
  fake.runTick()
  await settle()
  assert.equal(calls, 2, 'another full window retries')
  await fake.dispose()
})

test('a failed attempt backs off and is reported once', async () => {
  const root = makeAgent('root-fail', [user(1, Date.now() - 10_000)])
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    events: { 'root-fail': [user(1, Date.now() - 10_000)] },
    compactNow: async () => {
      calls += 1
      throw new Error('summary model unavailable')
    },
  })
  apply(fake.ctx, IDLE)
  await settle()
  fake.runTick()
  await settle()
  assert.equal(calls, 1)
  fake.runTick()
  await settle()
  assert.equal(calls, 1)
  assert.ok(fake.warnings.some(text => text.includes('idle compaction failed for session root-fail')))
  assert.ok(fake.warnings.some(text => text.includes('summary model unavailable')))
  await fake.dispose()
})

test('busy is retried on a later tick without an attempt backoff', async () => {
  const root = makeAgent('root-busy', [user(1, Date.now() - 10_000)])
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    events: { 'root-busy': [user(1, Date.now() - 10_000)] },
    compactNow: async () => {
      calls += 1
      const error = new Error('manual compaction requires an idle agent')
      error.code = 'busy'
      throw error
    },
  })
  apply(fake.ctx, IDLE)
  await settle()
  fake.runTick()
  await settle()
  assert.equal(calls, 1)
  fake.runTick()
  await settle()
  assert.equal(calls, 2, 'busy leaves the gate open for the next tick')
  await fake.dispose()
})

test('disposal aborts an in-flight compaction, clears the timer, and resolves', async () => {
  const root = makeAgent('root-slow', [user(1, Date.now() - 10_000)])
  let seenSignal
  const fake = createFakeContext({
    live: [root],
    events: { 'root-slow': [user(1, Date.now() - 10_000)] },
    compactNow: (_agent, signal) => {
      seenSignal = signal
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')))
      })
    },
  })
  apply(fake.ctx, IDLE)
  await settle()
  fake.runTick()
  await settle()
  assert.ok(seenSignal instanceof AbortSignal)
  assert.equal(seenSignal.aborted, false)
  await fake.dispose()
  assert.equal(seenSignal.aborted, true)
  assert.equal(fake.timers[0].cleared, true)
  assert.equal(fake.listenerCount('session/event'), 0)
})

test('agent disposal drops the session state', async () => {
  const root = makeAgent('root-gone', [user(1, Date.now() - 10_000)])
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    events: { 'root-gone': [user(1, Date.now() - 10_000)] },
    compactNow: async () => {
      calls += 1
      return result()
    },
  })
  apply(fake.ctx, IDLE)
  await settle()
  fake.emit('agent/disposed', { agent: root })
  fake.runTick()
  await settle()
  assert.equal(calls, 0)
  await fake.dispose()
})

test('an invalid config fails the load and a disabled config registers nothing', () => {
  const fake = createFakeContext()
  assert.throws(() => apply(fake.ctx, { idleMinute: 55 }), /unknown setting 'idleMinute'/)
  assert.throws(() => apply(fake.ctx, { idleMinutes: -1 }), /idleMinutes/)
  assert.throws(() => apply(fake.ctx, { includeSubagents: true }), /unknown setting 'includeSubagents'/)

  const disabled = createFakeContext()
  apply(disabled.ctx, { enabled: false })
  assert.equal(disabled.timers.length, 0)
  assert.equal(disabled.listenerCount('agent/created'), 0)
  assert.equal(disabled.listenerCount('session/event'), 0)
})
