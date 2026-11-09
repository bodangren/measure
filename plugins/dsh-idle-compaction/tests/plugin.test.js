// Wiring tests for the dsh-idle-compaction Host plugin: a fake Cordis context
// proves the watcher binds live and created agents, ticks the idle gate, calls
// the preset's backend once per idle window, contains busy/no-op/failure
// outcomes, and drains on disposal.
import assert from 'node:assert/strict'
import test from 'node:test'

import { apply, inject, name } from '../index.js'

const IDLE = { idleMinutes: 0.05, checkSeconds: 1 } // 3 s idle window, 1 s tick

/** One committed-event fixture; `time` is Unix epoch milliseconds. */
const event = (type, seq, time, data = {}, extra = {}) => ({ type, seq, time, data, ...extra })
const user = (seq, time) => event('user/message', seq, time, {}, { surfaceOp: 'append' })
const assistant = (seq, time) => event('assistant/message', seq, time, {}, { surfaceOp: 'append' })

/** A live-agent fixture with its fake session log and mutable status. */
const makeAgent = (id, events, status = 'idle') => {
  const session = { id, snapshotEvents: () => events }
  return { id, session, status }
}

const result = (endSeq = 3) => ({ endSeq, shadowedSeqs: [1, 2], shadowedTokenCount: 42 })

/** Build a fake Cordis context: listeners, one effect, captured timer, fake registry. */
function createFakeContext({ live = [], roots = live, compactNow, logger = () => {} } = {}) {
  const warnings = []
  const listeners = new Map()
  const disposers = []
  const timers = []
  const register = name => {
    if (!listeners.has(name)) listeners.set(name, [])
    return listeners.get(name)
  }
  const ctx = {
    agents: {
      list: () => [...live],
      roots: () => [...roots],
    },
    compaction: { compactNow: compactNow ?? (async () => result()) },
    logger: { warn: text => warnings.push(text) },
    on(name, handler) {
      const bucket = register(name)
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
      // The runtime announces a freshly created agent in the registry first;
      // mirror that for the creation-edge case. A disposed agent leaves both.
      if (eventName === 'agent/created' && args[0]?.agent !== undefined) {
        const created = args[0].agent
        if (!live.some(one => one === created)) live.push(created)
        if (!roots.some(one => one === created)) roots.push(created)
      }
      if (eventName === 'agent/disposed' && args[0]?.agent !== undefined) {
        const gone = args[0].agent
        for (const list of [live, roots]) {
          const index = list.indexOf(gone)
          if (index >= 0) list.splice(index, 1)
        }
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

const settle = () => new Promise(resolve => setTimeout(resolve, 0))

const freshActivity = () => [user(1, Date.now() - 10_000)]

test('exports the loader metadata', () => {
  assert.equal(name, 'idle-compaction')
  assert.deepEqual(inject, ['compaction', 'agents', 'timer'])
})

test('binds live root agents at apply and compacts on an idle tick', async () => {
  const root = makeAgent('root-a', freshActivity())
  const calls = []
  const fake = createFakeContext({
    live: [root],
    compactNow: async (agent, signal) => {
      calls.push({ agent, signal })
      return result()
    },
  })
  apply(fake.ctx, IDLE)
  assert.equal(fake.timers.length, 1)
  assert.equal(fake.timers[0].ms, 1_000)
  fake.runTick()
  await settle()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].agent, root)
  assert.ok(calls[0].signal instanceof AbortSignal)
  assert.ok(fake.warnings.some(text => text.includes('armed for session root-a')))
  assert.ok(fake.warnings.some(text => text.includes('compacted idle session root-a')))
  await fake.dispose()
})

test('a child agent is skipped by default and watched with includeSubagents', async () => {
  const parent = makeAgent('root-parent', freshActivity())
  const child = makeAgent('child-a', freshActivity())
  let calls = 0
  const fake = createFakeContext({
    live: [child],
    roots: [parent],
    compactNow: async () => {
      calls += 1
      return result()
    },
  })
  apply(fake.ctx, IDLE)
  fake.runTick()
  await settle()
  assert.equal(calls, 0)

  const childFake = createFakeContext({
    live: [child],
    roots: [parent],
    compactNow: async () => {
      calls += 1
      return result()
    },
  })
  apply(childFake.ctx, { ...IDLE, includeSubagents: true })
  childFake.runTick()
  await settle()
  assert.equal(calls, 1)
  await fake.dispose()
  await childFake.dispose()
})

test('binds an agent from the creation edge', async () => {
  const root = makeAgent('root-created', freshActivity())
  const calls = []
  const fake = createFakeContext({
    live: [],
    roots: [],
    compactNow: async agent => {
      calls.push(agent)
      return result()
    },
  })
  apply(fake.ctx, IDLE)
  fake.emit('agent/created', { agent: root })
  assert.equal(fake.listenerCount('agent/created'), 1)
  fake.runTick()
  await settle()
  assert.equal(calls.length, 1)
  assert.equal(calls[0], root)
  await fake.dispose()
})

test('compacts once per idle window and re-arms only after new activity', async () => {
  const root = makeAgent('root-b', freshActivity())
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    compactNow: async () => {
      calls += 1
      return result()
    },
  })
  apply(fake.ctx, IDLE)
  fake.runTick()
  await settle()
  assert.equal(calls, 1)

  // Still idle with no new event: the recorded end seq closes the window.
  fake.runTick()
  await settle()
  assert.equal(calls, 1)

  // One new activity, old enough to satisfy the idle window again.
  const newActivity = assistant(4, Date.now() - 5_000)
  fake.emit('session/event', root.session, newActivity)
  fake.runTick()
  await settle()
  assert.equal(calls, 2)
  await fake.dispose()
})

test('an active agent is not compacted until it is idle', async () => {
  const root = makeAgent('root-running', freshActivity(), 'running')
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    compactNow: async () => {
      calls += 1
      return result()
    },
  })
  apply(fake.ctx, IDLE)
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
    compactNow: async () => {
      calls += 1
      return null
    },
  })
  apply(fake.ctx, { idleMinutes: 0.001, checkSeconds: 1 }) // 60 ms window
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
  const root = makeAgent('root-fail', freshActivity())
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    compactNow: async () => {
      calls += 1
      throw new Error('summary model unavailable')
    },
  })
  apply(fake.ctx, IDLE)
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
  const root = makeAgent('root-busy', freshActivity())
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    compactNow: async () => {
      calls += 1
      const error = new Error('manual compaction requires an idle agent')
      error.code = 'busy'
      throw error
    },
  })
  apply(fake.ctx, IDLE)
  fake.runTick()
  await settle()
  assert.equal(calls, 1)
  fake.runTick()
  await settle()
  assert.equal(calls, 2, 'busy leaves the gate open for the next tick')
  await fake.dispose()
})

test('disposal aborts an in-flight compaction, clears the timer, and resolves', async () => {
  const root = makeAgent('root-slow', freshActivity())
  let seenSignal
  const fake = createFakeContext({
    live: [root],
    compactNow: (_agent, signal) => {
      seenSignal = signal
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')))
      })
    },
  })
  apply(fake.ctx, IDLE)
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
  const root = makeAgent('root-gone', freshActivity())
  let calls = 0
  const fake = createFakeContext({
    live: [root],
    compactNow: async () => {
      calls += 1
      return result()
    },
  })
  apply(fake.ctx, IDLE)
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

  const disabled = createFakeContext()
  apply(disabled.ctx, { enabled: false })
  assert.equal(disabled.timers.length, 0)
  assert.equal(disabled.listenerCount('agent/created'), 0)
  assert.equal(disabled.listenerCount('session/event'), 0)
})
