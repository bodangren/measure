// The end-of-turn check (FR-9): at agent/turn-stopping the plugin compares the
// current git status with the turn baseline, reports a `[x]` task without a SHA
// and files changed outside measure/ with no `[~]` task, records the problems,
// and in strict mode holds the turn open by steering, at most MAX_BLOCKS times.
import test from 'node:test'
import assert from 'node:assert/strict'

import { ALLOW, PLAN, TRACK_ID, TRACKS } from './fixtures.js'
import { parseAllowList, parsePlan, parseTracks } from '../src/core/parse.ts'
import { Agents, Turns } from '../src/state.js'
import { onTurnStopping } from '../src/guard.js'
import { endTurnHandler } from '../src/context.js'
import { MAX_BLOCKS } from '../src/core/guards.ts'

const tracks = parseTracks(TRACKS)
const ROOT = '/repo'

const NO_TASK_PLAN = `# Implementation Plan: DSH measure guard

## Phase 2: Adapter

- [ ] Task: Guard the writes
- [ ] Task: Ship the docs
`

const UNSHA_PLAN = `# Implementation Plan: DSH measure guard

## Phase 2: Adapter

- [~] Task: Working
- [x] Task: Done no sha
`

const snapshotOf = (planText = PLAN, overrides = {}) => ({
  root: ROOT,
  hasMeasure: true,
  isRepo: true,
  tracksPath: `${ROOT}/measure/tracks.md`,
  tracks,
  active: {
    entry: tracks[0],
    planPath: `${ROOT}/measure/tracks/${TRACK_ID}/plan.md`,
    plan: parsePlan(planText),
  },
  inProgressCount: 1,
  parseError: null,
  allow: parseAllowList(''),
  ...overrides,
})

const agentOf = (id = 'agent-1') => ({
  id,
  session: { id },
  steered: [],
  steer(message) {
    this.steered.push(message)
  },
})

const payloadOf = (turn = 1) => ({ turn })

/**
 * The turn-stopping dependencies: the turn record is planted, the snapshot and
 * the status are supplied fresh, and the state classes are the real ones.
 */
const depsOf = ({ mode = 'guard', plan = PLAN, status = [], baseline = [], unsha = [], blocks = 0, bypass = null, gitAnswers = {} } = {}) => {
  const state = { agents: new Agents(), turns: new Turns(), bypass: { async get() { return bypass } } }
  const snapshot = snapshotOf(plan)
  const deps = {
    mode,
    state,
    snapshots: {
      async get() {
        return snapshot
      },
      invalidate() {},
    },
    async refreshSnapshot() {
      return snapshot
    },
    async gitStatusOf() {
      return status
    },
    async rootOf() {
      return ROOT
    },
    async gitProbe(args) {
      const key = args.join(' ')
      return Object.hasOwn(gitAnswers, key) ? gitAnswers[key] : 'ok'
    },
  }
  deps.computeProblems = ({ agentId }) => [...deps.state.agents.sessionOf(agentId).problems]
  state.turns.setTurn('agent-1', 1, { status: baseline, unsha, blocks })
  return deps
}

test('changed files outside measure/ with no [~] task are reported', async () => {
  const agent = agentOf()
  const deps = depsOf({ plan: NO_TASK_PLAN, status: [' M src/app.js'] })
  const problems = await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() })
  assert.equal(problems.length, 1)
  assert.match(problems[0], /Files changed outside measure\/ while no task is in progress: src\/app\.js/)
  assert.deepEqual(deps.state.agents.sessionOf(agent.id).problems, problems)
})

test('changed files are not reported while a [~] task is in progress', async () => {
  const agent = agentOf()
  const deps = depsOf({ status: [' M src/app.js'] })
  assert.deepEqual(await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() }), [])
})

test('changed files inside measure/ are not reported', async () => {
  const agent = agentOf()
  const deps = depsOf({ plan: NO_TASK_PLAN, status: [' M measure/tracks/x/plan.md'] })
  assert.deepEqual(await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() }), [])
})

test('an [x] task without a SHA is reported', async () => {
  const agent = agentOf()
  const deps = depsOf({ plan: UNSHA_PLAN })
  const problems = await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() })
  assert.equal(problems.length, 1)
  assert.match(problems[0], /"Task: Done no sha" is \[x\] but has no commit SHA/)
})

test('an [x] task that already had no SHA at the turn start is not reported', async () => {
  const agent = agentOf()
  const deps = depsOf({ plan: UNSHA_PLAN, unsha: ['Task: Done no sha'] })
  assert.deepEqual(await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() }), [])
})

test('advise records the problems but does not escalate', async () => {
  const agent = agentOf()
  const deps = depsOf({ mode: 'advise', plan: NO_TASK_PLAN, status: [' M src/app.js'] })
  const problems = await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() })
  assert.equal(problems.length, 1)
  assert.deepEqual(deps.state.agents.sessionOf(agent.id).problems, problems)
  assert.equal(agent.steered.length, 0)
  assert.equal(deps.state.agents.sessionOf(agent.id).reminder, null)
})

test('guard records the problems and arms the reminder through endTurnHandler', async () => {
  const agent = agentOf()
  const deps = depsOf({ plan: NO_TASK_PLAN, status: [' M src/app.js'] })
  await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() })
  assert.equal(agent.steered.length, 0)
  assert.equal(deps.state.agents.sessionOf(agent.id).reminder, null)

  endTurnHandler(agent.id, ROOT, { type: 'turn/end', data: { turn: 1 } }, deps)
  const reminder = deps.state.agents.sessionOf(agent.id).reminder
  assert.match(reminder, /at the end of the last turn, these problems were open/)
  assert.match(reminder, /src\/app\.js/)
})

test('strict steers once and twice, and the third turn-stopping does not steer', async () => {
  const agent = agentOf()
  const deps = depsOf({ mode: 'strict', plan: NO_TASK_PLAN, status: [' M src/app.js'] })

  await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() })
  assert.equal(agent.steered.length, 1)
  assert.equal(deps.state.turns.turnOf(agent.id, 1).blocks, 1)
  assert.match(agent.steered[0].content[0].text, /do not end the turn yet/)
  assert.match(agent.steered[0].content[0].text, /src\/app\.js/)
  assert.equal(agent.steered[0].role, 'user')

  await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() })
  assert.equal(agent.steered.length, 2)
  assert.equal(deps.state.turns.turnOf(agent.id, 1).blocks, 2)

  const problems = await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() })
  assert.equal(agent.steered.length, MAX_BLOCKS)
  assert.equal(deps.state.turns.turnOf(agent.id, 1).blocks, 2)
  assert.equal(problems.length, 1)
  assert.deepEqual(deps.state.agents.sessionOf(agent.id).problems, problems)

  // After the block limit the reminder carries strict's final report.
  endTurnHandler(agent.id, ROOT, { type: 'turn/end', data: { turn: 1 } }, deps)
  assert.match(deps.state.agents.sessionOf(agent.id).reminder, /src\/app\.js/)
})

test('strict arms no reminder while it still holds the turn open', async () => {
  const agent = agentOf()
  const deps = depsOf({ mode: 'strict', plan: NO_TASK_PLAN, status: [' M src/app.js'] })
  await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() })
  assert.equal(deps.state.agents.sessionOf(agent.id).reminder, null)
})

test('a bypass silences every problem and never steers', async () => {
  const agent = agentOf()
  const deps = depsOf({ mode: 'strict', plan: NO_TASK_PLAN, status: [' M src/app.js'], bypass: 'session' })
  assert.deepEqual(await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() }), [])
  assert.deepEqual(deps.state.agents.sessionOf(agent.id).problems, [])
  assert.equal(agent.steered.length, 0)
})

test('an allow-list folder is not a changed file outside measure/', async () => {
  const agent = agentOf()
  const deps = depsOf({ plan: NO_TASK_PLAN, status: [' M docs/guide.md'] })
  deps.snapshots.get = async () => snapshotOf(NO_TASK_PLAN, { allow: parseAllowList(ALLOW) })
  deps.refreshSnapshot = async () => snapshotOf(NO_TASK_PLAN, { allow: parseAllowList(ALLOW) })
  assert.deepEqual(await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() }), [])
})

test('git-backed verification reports a missing commit at turn end', async () => {
  const agent = agentOf()
  const deps = depsOf({ gitAnswers: { 'rev-parse --verify --quiet abcdef0^{commit}': 'missing' } })
  const problems = await onTurnStopping(deps, { agent, root: ROOT, payload: payloadOf() })
  assert.equal(problems.length, 1)
  assert.match(problems[0], /cites SHA abcdef0, which no commit in this repository owns/)
})

test('a probe error reports nothing and a bypass silences the git checks', async () => {
  const agent = agentOf()
  const errored = depsOf({ gitAnswers: { 'rev-parse --verify --quiet abcdef0^{commit}': 'error' } })
  assert.deepEqual(await onTurnStopping(errored, { agent, root: ROOT, payload: payloadOf() }), [])

  const bypassed = depsOf({ bypass: 'session', gitAnswers: { 'rev-parse --verify --quiet abcdef0^{commit}': 'missing' } })
  assert.deepEqual(await onTurnStopping(bypassed, { agent: agentOf(), root: ROOT, payload: payloadOf() }), [])
})
