// The FR-15 client data channel: the JSON view the band and the panel poll,
// the exact web-server route that serves it, and the 404/500 edges. No real
// filesystem: the snapshot and the state store are fakes, exactly as the Host
// wires them (design §8).
import test from 'node:test'
import assert from 'node:assert/strict'

import { ALLOW, PLAN, TRACK_ID, TRACKS } from './fixtures.js'
import { bandLine, parseAllowList, parsePlan, parseTracks, statusLines } from '../src/core/parse.ts'
import { clientStateResponse, clientView, registerClientState } from '../src/client-state.js'

const tracks = parseTracks(TRACKS)

/** The snapshot the Host builds from the fixture texts. */
const snapshotOf = (overrides = {}) => ({
  root: '/repo',
  hasMeasure: true,
  isRepo: true,
  tracksPath: '/repo/measure/tracks.md',
  tracks,
  active: {
    entry: tracks[0],
    planPath: `/repo/measure/tracks/${TRACK_ID}/plan.md`,
    plan: parsePlan(PLAN),
  },
  inProgressCount: 1,
  parseError: null,
  allow: parseAllowList(ALLOW),
  ...overrides,
})

const AGENT = { id: 'session-1' }

/** The deps the Lead wires: agentOf = id => ctx.agents.get(id). */
const depsOf = (overrides = {}) => {
  const problems = overrides.problems ?? ['"Ship the docs" is [x] but has no commit SHA.']
  const deps = {
    mode: 'guard',
    agentOf: id => (id === AGENT.id ? AGENT : undefined),
    rootOf: async () => '/repo',
    snapshots: { get: async () => snapshotOf(overrides.snapshot) },
    state: {
      bypass: { get: async () => overrides.guardsOff ?? null },
      agents: { sessionOf: () => ({ problems }) },
    },
    ...overrides,
  }
  // The overrides that configure the fakes must not leak into the client.
  for (const key of ['snapshot', 'problems', 'guardsOff', 'throwOnSnapshot', 'throwOnRoot']) delete deps[key]
  return deps
}

const requestOf = query => new Request(`http://localhost/measure-guard/state${query}`)

/** A Cordis-shaped ctx: effect() runs the registration, register() returns a disposer. */
const ctxOf = () => {
  const ctx = {
    effects: 0,
    registrations: [],
    disposed: 0,
    webServer: {
      register(route) {
        ctx.registrations.push(route)
        return () => {
          ctx.disposed += 1
        }
      },
    },
    effect(register) {
      ctx.effects += 1
      return register()
    },
  }
  return ctx
}

test('clientView returns the FR-15 shape from the shared core', () => {
  const snapshot = snapshotOf()
  const problems = ['one', 'two']
  const updatedAt = '2026-11-07T03:00:00.000Z'
  const view = clientView({ snapshot, guardsOff: 'session', problems, mode: 'guard', updatedAt })

  assert.deepEqual(Object.keys(view), ['band', 'status', 'guardsOff', 'problems', 'updatedAt'])
  assert.equal(view.band, bandLine(snapshot, 'session'))
  assert.match(view.band, /guards off for this session/)
  assert.equal(view.status, statusLines(snapshot, 'session').join('\n'))
  assert.equal(view.guardsOff, 'session')
  assert.deepEqual(view.problems, problems)
  assert.notEqual(view.problems, problems)
  assert.equal(view.updatedAt, updatedAt)
})

test('clientView handles a project with no measure/ folder', () => {
  const snapshot = snapshotOf({ hasMeasure: false, tracks: [], active: null, inProgressCount: 0 })
  const view = clientView({ snapshot, guardsOff: null, problems: [], mode: 'guard', updatedAt: 1 })
  assert.equal(view.band, null)
  assert.match(view.status, /This project has no measure\/ folder\./)
  assert.match(view.status, /Guards: on/)
  assert.deepEqual(view.problems, [])
})

test('clientStateResponse serves the JSON body of a known session', async () => {
  const deps = depsOf()
  const response = await clientStateResponse(deps, requestOf('?sessionId=session-1'))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'application/json')

  const body = await response.json()
  assert.equal(body.band, bandLine(snapshotOf(), null))
  assert.match(body.status, /Tracks:/)
  assert.match(body.status, /Guards: on/)
  assert.equal(body.guardsOff, null)
  assert.deepEqual(body.problems, ['"Ship the docs" is [x] but has no commit SHA.'])
  assert.match(body.updatedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
})

test('clientStateResponse names the repository bypass in the body', async () => {
  const deps = depsOf({ guardsOff: 'repo' })
  const body = await (await clientStateResponse(deps, requestOf('?sessionId=session-1'))).json()
  assert.equal(body.guardsOff, 'repo')
  assert.match(body.band, /guards off for this repository/)
  assert.match(body.status, /Guards: off for this repository/)
})

test('clientStateResponse answers 404 for an unknown session and for no session id', async () => {
  const deps = depsOf()
  const unknown = await clientStateResponse(deps, requestOf('?sessionId=somebody-else'))
  assert.equal(unknown.status, 404)
  assert.equal(await unknown.text(), 'not found')

  const missing = await clientStateResponse(deps, requestOf(''))
  assert.equal(missing.status, 404)
  assert.equal(await missing.text(), 'not found')
})

test('clientStateResponse answers 404 before touching rootOf for an unknown session', async () => {
  let asked = false
  const deps = depsOf({
    rootOf: async () => {
      asked = true
      return '/repo'
    },
  })
  const response = await clientStateResponse(deps, requestOf('?sessionId=nobody'))
  assert.equal(response.status, 404)
  assert.equal(asked, false)
})

test('clientStateResponse returns a 500 JSON error when snapshot I/O throws', async () => {
  const deps = depsOf({
    snapshots: {
      get: async () => {
        throw new Error('cannot read measure/')
      },
    },
  })
  const response = await clientStateResponse(deps, requestOf('?sessionId=session-1'))
  assert.equal(response.status, 500)
  assert.equal(response.headers.get('content-type'), 'application/json')
  assert.deepEqual(await response.json(), { error: 'cannot read measure/' })
})

test('clientStateResponse returns a 500 JSON error when the root lookup throws', async () => {
  const deps = depsOf({
    rootOf: async () => {
      throw 'no root'
    },
  })
  const response = await clientStateResponse(deps, requestOf('?sessionId=session-1'))
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { error: 'no root' })
})

test('registerClientState registers the exact state route and returns the disposer', async () => {
  const ctx = ctxOf()
  const deps = depsOf()
  const dispose = registerClientState(ctx, deps)

  assert.equal(ctx.effects, 1)
  assert.equal(ctx.registrations.length, 1)
  const route = ctx.registrations[0]
  assert.equal(route.kind, 'exact')
  assert.equal(route.path, '/measure-guard/state')
  assert.equal(typeof route.resource, 'function')
  assert.equal(Object.hasOwn(route, 'handler'), false)

  const response = await route.resource(requestOf('?sessionId=session-1'))
  assert.equal(response.status, 200)
  assert.match((await response.json()).status, /Tracks:/)

  assert.equal(typeof dispose, 'function')
  dispose()
  assert.equal(ctx.disposed, 1)
})
