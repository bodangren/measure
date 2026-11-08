// The FR-15 client data channel: the JSON view the band and the panel poll,
// the exact web-server route that serves it, and the 404/500 edges. No real
// filesystem: the snapshot and the state store are fakes, exactly as the Host
// wires them (design §8).
import test from 'node:test'
import assert from 'node:assert/strict'

import { ALLOW, PLAN, TRACK_ID, TRACKS } from './fixtures.js'
import { bandLine, parseAllowList, parsePlan, parseTracks, statusLines } from '../src/core/parse.ts'
import { BAND_MAX, clientStateResponse, clientView, compactBand, registerClientState, setupResponse } from '../src/client-state.js'

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

  assert.deepEqual(Object.keys(view), ['band', 'bandFull', 'status', 'guardsOff', 'problems', 'updatedAt', 'goal', 'mode', 'setup'])
  assert.equal(view.band, bandLine(snapshot, 'session'))
  assert.match(view.band, /guards off for this session/)
  assert.equal(view.status, statusLines(snapshot, 'session').join('\n'))
  assert.equal(view.guardsOff, 'session')
  assert.deepEqual(view.problems, problems)
  assert.notEqual(view.problems, problems)
  assert.equal(view.updatedAt, updatedAt)
  assert.equal(view.goal, null)
  assert.deepEqual(view.setup, { choice: null, text: null })
  assert.deepEqual(view.mode, { value: 'guard', source: 'config' })
})

test('the setup view is offered only without a measure/ folder', () => {
  const noMeasure = snapshotOf({ hasMeasure: false, tracks: [], active: null, inProgressCount: 0 })
  const offer = clientView({ snapshot: noMeasure, guardsOff: null, problems: [], mode: 'guard', updatedAt: 1 })
  assert.deepEqual(offer.setup, { choice: null, text: 'Measure · this repository has no measure/ folder.' })

  const off = clientView({ snapshot: noMeasure, guardsOff: null, problems: [], mode: 'guard', updatedAt: 1, setupChoice: 'off' })
  assert.deepEqual(off.setup, { choice: 'off', text: null })

  const requested = clientView({ snapshot: noMeasure, guardsOff: null, problems: [], mode: 'guard', updatedAt: 1, setupChoice: 'setup' })
  assert.deepEqual(requested.setup, { choice: 'setup', text: 'Measure · setup requested.' })
})

test('clientView carries the goal summary and its line', () => {
  const snapshot = snapshotOf()
  const goal = { objective: 'Measure track "X" (x_1).', phase: 'active', roundsStarted: 2, maxGoalRounds: 256 }
  const view = clientView({ snapshot, guardsOff: null, problems: [], mode: 'guard', updatedAt: 'now', goal })

  assert.deepEqual(view.goal, { objective: 'Measure track "X" (x_1).', phase: 'active', round: 2, maxRounds: 256 })
  assert.match(view.status, /Goal active · round 2\/256 · Measure track "X" \(x_1\)\./)
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
  assert.equal(ctx.registrations.length, 2)
  const [route, setup] = ctx.registrations
  assert.equal(route.kind, 'exact')
  assert.equal(route.path, '/measure-guard/state')
  assert.equal(typeof route.resource, 'function')
  assert.equal(Object.hasOwn(route, 'handler'), false)
  assert.equal(setup.kind, 'exact')
  assert.equal(setup.path, '/measure-guard/setup')
  assert.equal(typeof setup.resource, 'function')

  const response = await route.resource(requestOf('?sessionId=session-1'))
  assert.equal(response.status, 200)
  assert.match((await response.json()).status, /Tracks:/)

  assert.equal(typeof dispose, 'function')
  dispose()
  assert.equal(ctx.disposed, 2)
})

test('clientView names a second writer in the band, and only then', () => {
  const snapshot = snapshotOf()
  const one = clientView({ snapshot, guardsOff: null, problems: [], mode: 'guard', updatedAt: 1, sessionCount: 1 })
  assert.equal(one.band, bandLine(snapshot, null))
  const two = clientView({ snapshot, guardsOff: null, problems: [], mode: 'guard', updatedAt: 1, sessionCount: 2 })
  assert.equal(two.band, `${bandLine(snapshot, null)} · 2 sessions`)
  const none = clientView({ snapshot: { ...snapshot, hasMeasure: false }, guardsOff: null, problems: [], mode: 'guard', updatedAt: 1, sessionCount: 3 })
  assert.equal(none.band, null)
})

test('clientStateResponse carries the writer count from deps.roots', async () => {
  const deps = depsOf({ roots: { countOf: () => 2 } })
  const body = await (await clientStateResponse(deps, requestOf('?sessionId=session-1'))).json()
  assert.equal(body.band, `${bandLine(snapshotOf(), null)} · 2 sessions`)
})

test('clientStateResponse identifies the loaded Host module', async () => {
  const deps = depsOf({ moduleUrl: 'file:///opt/dsh/plugins/dsh-measure-guard/index.js' })
  const response = await clientStateResponse(deps, requestOf('?sessionId=session-1'))
  assert.equal(response.headers.get('x-measure-guard-module'), 'file:///opt/dsh/plugins/dsh-measure-guard/index.js')
})

test('clientStateResponse carries the loaded digest when the entry has one', async () => {
  const deps = depsOf({ digest: 'sha256:abc123' })
  const response = await clientStateResponse(deps, requestOf('?sessionId=session-1'))
  assert.equal(response.headers.get('x-measure-guard-digest'), 'sha256:abc123')
})

test('clientStateResponse omits the digest header when the entry has none', async () => {
  const deps = depsOf()
  const response = await clientStateResponse(deps, requestOf('?sessionId=session-1'))
  assert.equal(response.headers.get('x-measure-guard-digest'), null)
})

test('clientStateResponse omits the module header when the entry passes no moduleUrl', async () => {
  const response = await clientStateResponse(depsOf(), requestOf('?sessionId=session-1'))
  assert.equal(response.headers.get('x-measure-guard-module'), null)
})

test('the state route carries the identity on its error responses too', async () => {
  const identity = { moduleUrl: 'file:///opt/dsh/plugins/dsh-measure-guard/index.js', digest: 'sha256:abc123' }
  const notFound = await clientStateResponse(depsOf(identity), requestOf('?sessionId=nobody'))
  assert.equal(notFound.status, 404)
  assert.equal(notFound.headers.get('x-measure-guard-module'), identity.moduleUrl)
  assert.equal(notFound.headers.get('x-measure-guard-digest'), 'sha256:abc123')
  assert.equal(await notFound.text(), 'not found')
  const failed = await clientStateResponse(
    depsOf({
      ...identity,
      snapshots: {
        get: async () => {
          throw new Error('boom')
        },
      },
    }),
    requestOf('?sessionId=session-1'),
  )
  assert.equal(failed.status, 500)
  assert.equal(failed.headers.get('x-measure-guard-digest'), 'sha256:abc123')
  assert.deepEqual(await failed.json(), { error: 'boom' })
})

test('the setup route carries the identity on every error response', async () => {
  const identity = { moduleUrl: 'file:///opt/x/index.js', digest: 'sha256:abc123' }
  const deps = depsOf(identity)
  const request = (method, body) =>
    new Request('http://localhost/measure-guard/setup', {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body }),
    })
  const method = await setupResponse(deps, request('GET'))
  assert.equal(method.status, 405)
  assert.equal(method.headers.get('x-measure-guard-digest'), 'sha256:abc123')
  const malformed = await setupResponse(deps, request('POST', 'not json'))
  assert.equal(malformed.status, 400)
  assert.equal(malformed.headers.get('x-measure-guard-digest'), 'sha256:abc123')
  const invalid = await setupResponse(deps, request('POST', JSON.stringify({ sessionId: 'session-1', choice: 'nope' })))
  assert.equal(invalid.status, 400)
  assert.equal(invalid.headers.get('x-measure-guard-digest'), 'sha256:abc123')
  const unknown = await setupResponse(deps, request('POST', JSON.stringify({ sessionId: 'nobody', choice: 'off' })))
  assert.equal(unknown.status, 404)
  assert.equal(unknown.headers.get('x-measure-guard-digest'), 'sha256:abc123')
})

// ---- the compact band (Story S1 of the band track) ------------------------

test('compactBand caps a long line on a word boundary and keeps a short one', () => {
  const short = 'Measure · Track · Task 1/2 [~] Do it'
  assert.equal(compactBand(short), short)
  assert.equal(compactBand(null), null)
  assert.equal(compactBand(42), null)

  const words = Array.from({ length: 60 }, (_, index) => `word${index}`).join(' ')
  const compact = compactBand(words)
  assert.ok(compact.length <= BAND_MAX, `length ${compact.length}`)
  assert.ok(compact.endsWith('…'))
  assert.ok(words.startsWith(compact.slice(0, -1).trimEnd()))
  assert.ok(!compact.slice(0, -1).includes('  '))
})

test('a long task line keeps the band to one capped line and bandFull complete', () => {
  const longTask = `Task: ${'validate the very long release acceptance flow '.repeat(15)}done`
  const plan = parsePlan(`# Plan\n\n## Phase 1: Work\n\n- [~] ${longTask}\n`)
  const snapshot = snapshotOf({ active: { entry: tracks[0], planPath: '/x', plan } })
  const view = clientView({ snapshot, guardsOff: null, problems: [], mode: 'guard', updatedAt: 1 })

  assert.ok(view.band.length <= BAND_MAX, `band length ${view.band.length}`)
  assert.ok(view.band.endsWith('…'))
  assert.ok(view.bandFull.length > BAND_MAX)
  assert.ok(view.bandFull.includes('validate the very long release acceptance flow'))
})

test('the sessions suffix is part of the compacted band', () => {
  const longTask = `Task: ${'long '.repeat(80)}end`
  const plan = parsePlan(`# Plan\n\n## Phase 1: Work\n\n- [~] ${longTask}\n`)
  const snapshot = snapshotOf({ active: { entry: tracks[0], planPath: '/x', plan } })
  const view = clientView({ snapshot, guardsOff: null, problems: [], mode: 'guard', updatedAt: 1, sessionCount: 2 })
  assert.ok(view.band.length <= BAND_MAX)
  assert.ok(view.band.endsWith('…'))
  assert.ok(view.bandFull.endsWith('· 2 sessions'))
})

test('a project without measure/ keeps both band fields null', () => {
  const snapshot = snapshotOf({ hasMeasure: false, tracks: [], active: null, inProgressCount: 0 })
  const view = clientView({ snapshot, guardsOff: null, problems: [], mode: 'guard', updatedAt: 1 })
  assert.equal(view.band, null)
  assert.equal(view.bandFull, null)
})

test('compactBand drops the space at the cut and strips a trailing separator', () => {
  const line = `${'x'.repeat(157)} · tail of the line`
  const compact = compactBand(line)
  assert.equal(compact, `${'x'.repeat(157)}…`)
})

test('compactBand pins the 160/161 boundary', () => {
  assert.equal(compactBand('a'.repeat(160)), 'a'.repeat(160))
  const over = compactBand('a'.repeat(161))
  assert.equal(over, `${'a'.repeat(159)}…`)
  assert.equal(over.length, 160)
})

test('compactBand keeps the first max - 1 characters when there is no space', () => {
  const token = 'y'.repeat(200)
  const compact = compactBand(token)
  assert.equal(compact, `${'y'.repeat(159)}…`)
  assert.equal(compact.length, 160)
})

test('a space at index 0 is a cut and the kept prefix is trimmed', () => {
  assert.equal(compactBand(` ${'x'.repeat(200)}`), '…')
  assert.equal(compactBand(`${'z'.repeat(150)}   ${'x'.repeat(20)}`), `${'z'.repeat(150)}…`)
})
