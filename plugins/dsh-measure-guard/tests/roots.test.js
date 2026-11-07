// The second-writer detection: one writer agent per canonical root, one
// warning per additional agent, and a release that frees the root again.
import test from 'node:test'
import assert from 'node:assert/strict'

import { RootWriters } from '../src/roots.js'

test('one writer gets no notice', () => {
  const writers = new RootWriters()
  assert.equal(writers.claim('agent-1', '/repo'), false)
  assert.equal(writers.countOf('/repo'), 1)
  assert.equal(writers.rootOf('agent-1'), '/repo')
})

test('the second distinct writer gets one notice', () => {
  const writers = new RootWriters()
  assert.equal(writers.claim('agent-1', '/repo'), false)
  assert.equal(writers.claim('agent-2', '/repo'), true)
  assert.equal(writers.countOf('/repo'), 2)
})

test('the same agent claiming twice gets no second notice', () => {
  const writers = new RootWriters()
  assert.equal(writers.claim('agent-1', '/repo'), false)
  assert.equal(writers.claim('agent-2', '/repo'), true)
  assert.equal(writers.claim('agent-2', '/repo'), false)
  assert.equal(writers.claim('agent-2', '/repo'), false)
  assert.equal(writers.countOf('/repo'), 2)
})

test('a different root gets no notice', () => {
  const writers = new RootWriters()
  assert.equal(writers.claim('agent-1', '/repo-a'), false)
  assert.equal(writers.claim('agent-2', '/repo-b'), false)
  assert.equal(writers.countOf('/repo-a'), 1)
  assert.equal(writers.countOf('/repo-b'), 1)
  assert.equal(writers.countOf('/unknown'), 0)
})

test('release frees the root and lets a later writer claim it', () => {
  const writers = new RootWriters()
  writers.claim('agent-1', '/repo')
  assert.equal(writers.claim('agent-2', '/repo'), true)

  writers.release('agent-1')
  assert.equal(writers.rootOf('agent-1'), null)
  assert.equal(writers.countOf('/repo'), 1)

  // agent-3 is now the second distinct writer and gets the one notice.
  assert.equal(writers.claim('agent-3', '/repo'), true)

  writers.release('agent-2')
  writers.release('agent-3')
  assert.equal(writers.countOf('/repo'), 0)

  // The root is free again: the next writer is the only one.
  assert.equal(writers.claim('agent-4', '/repo'), false)
  assert.equal(writers.countOf('/repo'), 1)
})

test('release of an unknown agent is a no-op', () => {
  const writers = new RootWriters()
  writers.claim('agent-1', '/repo')
  writers.release('nobody')
  assert.equal(writers.countOf('/repo'), 1)
})
