// Story S5: the in-band setup answer. The band posts `{ sessionId, choice }`
// to the exact `/measure-guard/setup` route; the Host records the answer in
// agent state and, for `setup`, delivers the shared core's setup prompt once.
import test from 'node:test'
import assert from 'node:assert/strict'

import { Agents } from '../src/state.js'
import { SETUP_PATH, setupResponse } from '../src/client-state.js'
import { SETUP_PROMPT } from '../src/core/guards.ts'

const AGENT = { id: 'session-1', session: { id: 'session-1' } }

const depsOf = () => {
  const injected = []
  return {
    injected,
    agentOf: id => (id === AGENT.id ? AGENT : undefined),
    async rootOf() {
      return '/repo'
    },
    state: { agents: new Agents() },
    injectSetup: agent => injected.push(agent),
  }
}

const requestOf = (body, { method = 'POST' } = {}) =>
  new Request(`http://127.0.0.1:3080${SETUP_PATH}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  })

const post = async (deps, body) => {
  const response = await setupResponse(deps, requestOf(body))
  return { status: response.status, body: await response.json() }
}

test('the route is the documented exact path', () => {
  assert.equal(SETUP_PATH, '/measure-guard/setup')
})

test('POST off records the answer and the edit guard stops asking', async () => {
  const deps = depsOf()
  const { status, body } = await post(deps, { sessionId: AGENT.id, choice: 'off' })
  assert.equal(status, 200)
  assert.deepEqual(body, { choice: 'off' })
  assert.equal(deps.state.agents.sessionOf(AGENT.id).setupChoice, 'off')
  assert.equal(deps.injected.length, 0)
})

test('POST setup records the answer and delivers the setup prompt exactly once', async () => {
  const deps = depsOf()
  const first = await post(deps, { sessionId: AGENT.id, choice: 'setup' })
  assert.equal(first.status, 200)
  assert.equal(deps.state.agents.sessionOf(AGENT.id).setupChoice, 'setup')
  assert.deepEqual(deps.injected, [AGENT])

  const second = await post(deps, { sessionId: AGENT.id, choice: 'setup' })
  assert.equal(second.status, 200)
  assert.equal(deps.injected.length, 1)
})

test('an unknown session is 404 and records nothing', async () => {
  const deps = depsOf()
  const { status } = await post(deps, { sessionId: 'nobody', choice: 'off' })
  assert.equal(status, 404)
  assert.equal(deps.state.agents.sessionOf('nobody').setupChoice, null)
})

test('a malformed body, a missing session, and an unknown choice are 400', async () => {
  const deps = depsOf()
  assert.equal((await post(deps, '{not json')).status, 400)
  assert.equal((await post(deps, { choice: 'off' })).status, 400)
  assert.equal((await post(deps, { sessionId: AGENT.id, choice: 'maybe' })).status, 400)
  assert.equal(deps.state.agents.sessionOf(AGENT.id).setupChoice, null)
})

test('a non-POST method on the route is 405', async () => {
  const deps = depsOf()
  const response = await setupResponse(deps, requestOf(null, { method: 'GET' }))
  assert.equal(response.status, 405)
})

test('the setup prompt is the shared core text', () => {
  assert.match(SETUP_PROMPT, /Set up Measure/)
})
