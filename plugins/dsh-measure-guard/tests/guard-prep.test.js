// Decision preparation (FR-5): the decision map keyed by exec.token, the async
// pre-execute listener that prepares the denial, and the synchronous tool guard
// that reads it. A throwing preparation, a standalone call, and a non-allow
// gate all leave the call allowed.
import test from 'node:test'
import assert from 'node:assert/strict'

import { createDecisions, installToolGuard, preExecuteListener } from '../src/hooks.js'

const agent = { id: 'agent-1', session: { id: 'agent-1' } }

const execOf = (overrides = {}) => ({
  token: Symbol('token'),
  name: 'edit',
  arguments: {},
  agent,
  signal: new AbortController().signal,
  ...overrides,
})

const depsOf = decide => ({ mode: 'guard', decide })

/** A fake host ctx with the tool guard registry and the event listeners. */
const ctxOf = () => {
  const guards = []
  const listeners = new Map()
  return {
    guards,
    listeners,
    tools: {
      guard(guard) {
        guards.push(guard)
        return () => {
          const at = guards.indexOf(guard)
          if (at !== -1) guards.splice(at, 1)
        }
      },
    },
    effect(create) {
      return create()
    },
    on(name, handler) {
      listeners.set(name, handler)
      return () => listeners.delete(name)
    },
  }
}

const run = (deps, decisions, exec, gate = { kind: 'allow' }, notes) =>
  preExecuteListener(deps, decisions, notes)(exec, async () => gate)

test('createDecisions stores, reads, deletes, and counts by token', () => {
  const decisions = createDecisions()
  const token = Symbol('one')
  assert.equal(decisions.size, 0)
  decisions.set(token, 'denied')
  assert.equal(decisions.get(token), 'denied')
  assert.equal(decisions.size, 1)
  assert.equal(decisions.delete(token), true)
  assert.equal(decisions.get(token), undefined)
  assert.equal(decisions.size, 0)
})

test('a non-allow gate is passed through untouched and stores nothing', async () => {
  let calls = 0
  const decisions = createDecisions()
  const gate = { kind: 'deny', reason: 'another policy' }
  const exec = execOf()
  const returned = await run(depsOf(() => (calls += 1)), decisions, exec, gate)
  assert.equal(returned, gate)
  assert.equal(calls, 0)
  assert.equal(decisions.size, 0)
})

test('an allow call stores the denial and the synchronous guard returns it', async () => {
  const decisions = createDecisions()
  const exec = execOf()
  const gate = await run(depsOf(async () => 'measure-guard: no task is in progress'), decisions, exec)
  assert.deepEqual(gate, { kind: 'allow' })
  assert.equal(decisions.get(exec.token), 'measure-guard: no task is in progress')

  const ctx = ctxOf()
  installToolGuard(ctx, decisions)
  assert.equal(ctx.guards.length, 1)
  const reason = ctx.guards[0](exec)
  assert.equal(reason, 'measure-guard: no task is in progress')
  assert.equal(typeof reason, 'string')
  assert.equal(typeof reason?.then, 'undefined')
})

test('tools/result clears the stored decision', async () => {
  const decisions = createDecisions()
  const exec = execOf()
  await run(depsOf(async () => 'denied'), decisions, exec)

  const ctx = ctxOf()
  installToolGuard(ctx, decisions)
  assert.equal(typeof ctx.listeners.get('tools/result'), 'function')
  ctx.listeners.get('tools/result')(exec)
  assert.equal(decisions.get(exec.token), undefined)
  assert.equal(decisions.size, 0)
  assert.equal(ctx.guards[0](exec), undefined)
})

test('a throwing preparation allows the call (fail open)', async () => {
  const decisions = createDecisions()
  const exec = execOf()
  const gate = await run(
    depsOf(async () => {
      throw new Error('no fs')
    }),
    decisions,
    exec,
  )
  assert.deepEqual(gate, { kind: 'allow' })
  assert.equal(decisions.size, 1)
  assert.equal(decisions.get(exec.token), undefined)

  const ctx = ctxOf()
  installToolGuard(ctx, decisions)
  assert.equal(ctx.guards[0](exec), undefined)
})

test('a call with no agent is allowed without preparing anything', async () => {
  const decisions = createDecisions()
  let calls = 0
  const exec = execOf({ agent: undefined })
  const gate = await run(depsOf(() => (calls += 1)), decisions, exec)
  assert.deepEqual(gate, { kind: 'allow' })
  assert.equal(calls, 0)
  assert.equal(decisions.size, 1)
  assert.equal(decisions.get(exec.token), undefined)
})

test('an allowed call may carry a note for the post-execute append', async () => {
  const decisions = createDecisions()
  const notes = new Map()
  const exec = execOf()
  await run(depsOf(async () => ({ denial: undefined, note: 'measure-guard: [b] note' })), decisions, exec, { kind: 'allow' }, notes)
  assert.equal(decisions.get(exec.token), undefined)
  assert.equal(notes.get(exec.token), 'measure-guard: [b] note')
})
