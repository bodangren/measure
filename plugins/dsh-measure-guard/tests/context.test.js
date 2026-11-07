// The context layer: the rule section, the exactly-once task note, the
// reminder delivery, the compaction re-note, the rejected pre-step pass-through,
// and the agent-scoped session/event filter.
import test from 'node:test'
import assert from 'node:assert/strict'

import { ALLOW, PLAN, TRACK_ID, TRACKS } from './fixtures.js'
import { parseAllowList, parsePlan, parseTracks, ruleSection } from '../src/core/parse.ts'
import { Agents, Turns } from '../src/state.js'
import { RootWriters } from '../src/roots.js'
import {
  attachAgent,
  compactionHandler,
  preStepHook,
  ruleSectionRegistration,
  sessionEventHandler,
} from '../src/context.js'

const tracks = parseTracks(TRACKS)

/** The snapshot the adapter builds from the fixture texts. */
const snapshotOf = (planText = PLAN, overrides = {}) => ({
  root: '/repo',
  hasMeasure: true,
  isRepo: true,
  tracksPath: '/repo/measure/tracks.md',
  tracks,
  active: {
    entry: tracks[0],
    planPath: `/repo/measure/tracks/${TRACK_ID}/plan.md`,
    plan: parsePlan(planText),
  },
  inProgressCount: 1,
  parseError: null,
  allow: parseAllowList(ALLOW),
  ...overrides,
})

/** A cache fake that counts invalidations and can be pointed at a new snapshot. */
const cacheOf = snapshot => ({
  value: snapshot,
  invalidations: 0,
  async get() {
    return this.value
  },
  invalidate() {
    this.invalidations += 1
  },
  invalidateAll() {
    this.invalidations += 1
  },
})

/** The dependencies of the context layer without any DSH runtime. */
const depsOf = ({ mode = 'guard', snapshot = snapshotOf(), status = [] } = {}) => {
  const state = { agents: new Agents(), turns: new Turns() }
  const snapshots = cacheOf(snapshot)
  const deps = {
    mode,
    state,
    snapshots,
    roots: new RootWriters(),
    status,
    async rootOf() {
      return '/repo'
    },
    async gitStatusOf() {
      return deps.status
    },
  }
  return deps
}

/** A fake agent with an agent-scoped ctx, the section registry, and inject. */
const agentOf = (id = 'agent-1') => {
  const sections = []
  const disposed = []
  const listeners = new Map()
  const injected = []
  return {
    id,
    session: { id },
    sections,
    disposed,
    listeners,
    injected,
    ctx: {
      systemPrompt: {
        section(section) {
          sections.push(section)
          return () => disposed.push(section)
        },
      },
      on(name, handler) {
        listeners.set(name, handler)
        return () => listeners.delete(name)
      },
    },
    inject(message) {
      injected.push(message)
    },
  }
}

const payloadOf = ({ agent, turn = 1, step = 1, messages = [] }) => ({
  agent,
  turn,
  step,
  messages,
  signal: new AbortController().signal,
})

const enterNext = payload => async () => ({ kind: 'enter', messages: payload.messages })

const noteTexts = (decision, baseLength) =>
  decision.messages.slice(baseLength).map(message => message.content[0].text)

test('the rule section is present with measure/ and absent without it', () => {
  const agent = agentOf()
  assert.deepEqual(ruleSectionRegistration(agent, snapshotOf()), {
    name: 'measure:rule',
    order: 5000,
    text: ruleSection(),
  })
  assert.equal(ruleSectionRegistration(agent, snapshotOf(PLAN, { hasMeasure: false })), null)
  assert.equal(ruleSectionRegistration(agent, null), null)
})

test('attachAgent registers the section and the three agent-scoped listeners, and disposes them', async () => {
  const agent = agentOf()
  const deps = depsOf()
  const dispose = await attachAgent({}, agent, deps)

  assert.equal(agent.sections.length, 1)
  assert.deepEqual(agent.sections[0], ruleSectionRegistration(agent, deps.snapshots.value))
  assert.ok(agent.listeners.has('agent/pre-step'))
  assert.ok(agent.listeners.has('agent/turn-stopping'))
  assert.ok(agent.listeners.has('session/event'))

  dispose()
  assert.equal(agent.listeners.size, 0)
  assert.equal(agent.disposed.length, 1)

  // A project without measure/ gets no section but still gets the listeners.
  const bare = agentOf('agent-2')
  await attachAgent({}, bare, depsOf({ snapshot: snapshotOf(PLAN, { hasMeasure: false }) }))
  assert.equal(bare.sections.length, 0)
  assert.ok(bare.listeners.has('agent/pre-step'))
})

test('the task note appears exactly once per task change and never on the next step', async () => {
  const agent = agentOf()
  const deps = depsOf()
  const hook = preStepHook(agent, '/repo', deps)
  const baseMessages = [{ role: 'user', content: [{ type: 'text', text: 'do the work' }] }]

  const first = await hook(payloadOf({ agent, turn: 1, step: 1, messages: baseMessages }), enterNext({ messages: baseMessages }))
  const firstNotes = noteTexts(first, baseMessages.length)
  assert.equal(firstNotes.length, 1)
  assert.match(firstNotes[0], /Active track: DSH measure guard/)
  assert.match(firstNotes[0], /Current task: \[~\] Task: Guard the edits/)
  assert.equal(first.messages[0], baseMessages[0])

  const second = await hook(payloadOf({ agent, turn: 1, step: 2, messages: baseMessages }), enterNext({ messages: baseMessages }))
  assert.equal(second.messages.length, baseMessages.length)

  // An external edit changes the plan: the refreshed snapshot changes the key.
  deps.snapshots.value = snapshotOf(PLAN.replace('Task: Guard the edits', 'Task: Guard the writes'))
  const third = await hook(payloadOf({ agent, turn: 2, step: 1, messages: baseMessages }), enterNext({ messages: baseMessages }))
  const thirdNotes = noteTexts(third, baseMessages.length)
  assert.equal(thirdNotes.length, 1)
  assert.match(thirdNotes[0], /Guard the writes/)

  const fourth = await hook(payloadOf({ agent, turn: 2, step: 2, messages: baseMessages }), enterNext({ messages: baseMessages }))
  assert.equal(fourth.messages.length, baseMessages.length)
  assert.ok(deps.snapshots.invalidations >= 4)
})

test('compaction/end without an error sends the note again; an errored compaction does not', async () => {
  const agent = agentOf()
  const deps = depsOf()
  const hook = preStepHook(agent, '/repo', deps)
  const baseMessages = []

  await hook(payloadOf({ agent, turn: 1, step: 1, messages: baseMessages }), enterNext({ messages: baseMessages }))
  const state = deps.state.agents.sessionOf(agent.id)
  assert.notEqual(state.notedKey, null)

  sessionEventHandler(agent.id, { type: 'compaction/end', data: {} }, deps, '/repo')
  assert.equal(state.notedKey, null)
  const afterCompaction = await hook(payloadOf({ agent, turn: 1, step: 2, messages: baseMessages }), enterNext({ messages: baseMessages }))
  assert.match(noteTexts(afterCompaction, 0)[0], /Current task: \[~\]/)

  sessionEventHandler(agent.id, { type: 'compaction/end', data: { error: 'boom' } }, deps, '/repo')
  assert.notEqual(state.notedKey, null)
  const afterError = await hook(payloadOf({ agent, turn: 1, step: 3, messages: baseMessages }), enterNext({ messages: baseMessages }))
  assert.equal(afterError.messages.length, 0)
})

test('the pending reminder is delivered first and cleared', async () => {
  const agent = agentOf()
  const deps = depsOf()
  const hook = preStepHook(agent, '/repo', deps)
  const state = deps.state.agents.sessionOf(agent.id)
  state.reminder = 'measure-guard: at the end of the last turn, these problems were open:\n- [x] no SHA'

  const first = await hook(payloadOf({ agent, messages: [] }), enterNext({ messages: [] }))
  const texts = noteTexts(first, 0)
  assert.equal(texts[0], 'measure-guard: at the end of the last turn, these problems were open:\n- [x] no SHA')
  assert.match(texts[1], /Active track: DSH measure guard/)
  assert.equal(state.reminder, null)

  const second = await hook(payloadOf({ agent, turn: 1, step: 2, messages: [] }), enterNext({ messages: [] }))
  assert.equal(second.messages.length, 0)
})

test('a rejected pre-step is passed through untouched', async () => {
  const agent = agentOf()
  const deps = depsOf()
  const hook = preStepHook(agent, '/repo', deps)
  const state = deps.state.agents.sessionOf(agent.id)
  state.reminder = 'keep me'
  const rejection = { kind: 'reject' }

  const decision = await hook(payloadOf({ agent }), async () => rejection)
  assert.equal(decision, rejection)
  assert.equal(state.reminder, 'keep me')
  assert.equal(state.notedKey, null)
  assert.equal(deps.state.turns.turnOf(agent.id, 1), undefined)
})

test('the first step of a turn captures the baseline once', async () => {
  const agent = agentOf()
  const deps = depsOf({
    snapshot: snapshotOf(PLAN.replace('Task: Copy the shared core `abcdef0`', 'Task: Copy the shared core')),
  })
  const hook = preStepHook(agent, '/repo', deps)

  await hook(payloadOf({ agent, turn: 1, step: 1, messages: [] }), enterNext({ messages: [] }))
  const baseline = deps.state.turns.turnOf(agent.id, 1)
  assert.deepEqual(baseline.status, [])
  assert.deepEqual(baseline.unsha, ['Task: Copy the shared core'])
  assert.equal(baseline.blocks, 0)

  deps.status = [' M src/app.js']
  await hook(payloadOf({ agent, turn: 1, step: 2, messages: [] }), enterNext({ messages: [] }))
  assert.deepEqual(deps.state.turns.turnOf(agent.id, 1).status, [])

  // turn/end ends the turn state.
  sessionEventHandler(agent.id, { type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } }, deps, '/repo')
  assert.equal(deps.state.turns.turnOf(agent.id, 1), undefined)
})

test('the agent-scoped session/event listener only handles its own session', async () => {
  const agent = agentOf()
  const deps = depsOf()
  await attachAgent({}, agent, deps)
  const sessionEvent = agent.listeners.get('session/event')
  const state = deps.state.agents.sessionOf(agent.id)
  state.notedKey = 'track|task'

  await sessionEvent({ id: 'another-session' }, { type: 'compaction/end', data: {} })
  assert.equal(state.notedKey, 'track|task')
  assert.equal(deps.snapshots.invalidations, 0)

  await sessionEvent({ id: agent.id }, { type: 'compaction/end', data: {} })
  assert.equal(state.notedKey, null)
  assert.equal(deps.snapshots.invalidations, 1)
})

test('the second writer gets one injected warning and the first one gets none', async () => {
  const first = agentOf('agent-1')
  const second = agentOf('agent-2')
  const deps = depsOf()
  await attachAgent({}, first, deps)
  await attachAgent({}, second, deps)

  assert.equal(first.injected.length, 0)
  assert.equal(second.injected.length, 1)
  assert.match(second.injected[0].content[0].text, /2 sessions are working/)
  assert.equal(deps.roots.countOf('/repo'), 2)
})

test('compactionHandler only arms a re-note for a successful compaction', () => {
  const state = { agents: new Agents() }
  state.agents.sessionOf('agent-1').notedKey = 'key'
  assert.equal(compactionHandler(state, 'agent-1', { type: 'compaction/end', data: { error: 'x' } }), false)
  assert.equal(state.agents.sessionOf('agent-1').notedKey, 'key')
  assert.equal(compactionHandler(state, 'agent-1', { type: 'compaction/end', data: {} }), true)
  assert.equal(state.agents.sessionOf('agent-1').notedKey, null)
  assert.equal(compactionHandler(state, 'agent-1', { type: 'turn/end', data: {} }), false)
})
