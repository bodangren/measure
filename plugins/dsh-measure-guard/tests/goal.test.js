// Story S4: goal binding. The DSH goal is read as an optional capability; the
// /measure-goal command seeds it from the active track, the state route and the
// status text carry phase and round, and the end-of-turn check reports the two
// goal/track mismatches without ever mutating the goal.
import test from 'node:test'
import assert from 'node:assert/strict'

import { ALLOW, PLAN, TRACK_ID, TRACKS } from './fixtures.js'
import { parseAllowList, parsePlan, parseTracks } from '../src/core/parse.ts'
import { Agents, Turns } from '../src/state.js'
import { goalLine, goalOf, goalProblems, goalSummary, measureGoalCommand, seedObjective } from '../src/goal.js'
import { statusText } from '../src/status.js'
import { onTurnStopping } from '../src/guard.js'

const tracks = parseTracks(TRACKS)
const AGENT = { id: 'agent-1', session: { id: 'agent-1' } }

/** The plan with no task in progress. */
const NO_TASK_PLAN = `# Implementation Plan: DSH measure guard

## Phase 2: Adapter

- [ ] Task: Guard the writes
`

const snapshotOf = (planText = PLAN) => ({
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
})

/** A fake goal service: one current goal, a create call log, optional refusal. */
const goalsOf = ({ current = null, refuse = false } = {}) => {
  const created = []
  const service = {
    created,
    get: () => current,
    create(agent, request) {
      if (refuse) throw new Error('a paused goal must be cleared first')
      created.push({ agent, request })
      current = {
        id: 'goal-1',
        revision: 1,
        objective: request.objective,
        phase: 'active',
        maxGoalRounds: request.maxGoalRounds ?? 256,
        roundsStarted: 0,
        activation: 'armed',
      }
      return current
    },
  }
  return service
}

const commandDeps = ({ snapshot = snapshotOf(), goals } = {}) => ({
  mode: 'guard',
  goals,
  async rootOf() {
    return '/repo'
  },
  snapshots: { async get() { return snapshot } },
  state: { agents: new Agents(), turns: new Turns(), bypass: { async get() { return null } } },
})

const runCommand = async (deps, rawInput = '') => {
  const command = measureGoalCommand(deps)
  assert.equal(command.name, 'measure-goal')
  return command.handler({ agent: AGENT, rawInput })
}

// ---- summaries and the seed objective --------------------------------------

test('goalSummary and goalLine carry the phase and the round position', () => {
  const goal = { objective: 'Measure track "X" (x_1).', phase: 'active', roundsStarted: 2, maxGoalRounds: 256 }
  assert.deepEqual(goalSummary(goal), { objective: 'Measure track "X" (x_1).', phase: 'active', round: 2, maxRounds: 256 })
  assert.equal(goalLine(goal), 'Goal active · round 2/256 · Measure track "X" (x_1).')
  assert.equal(goalSummary(null), null)
  assert.equal(goalLine(null), null)
})

test('seedObjective names the active track, and is null without one', () => {
  assert.equal(seedObjective(snapshotOf()), `Measure track "DSH measure guard" (${TRACK_ID}).`)
  const noTrack = snapshotOf()
  noTrack.tracks = []
  noTrack.active = null
  assert.equal(seedObjective(noTrack), null)
})

test('goalOf fails open when the host or the service is missing', () => {
  assert.equal(goalOf({}, AGENT), null)
  assert.equal(goalOf({ goals: { get() { throw new Error('boom') } } }, AGENT), null)
  const goal = { objective: 'x', phase: 'active' }
  assert.equal(goalOf({ goals: { get: () => goal } }, AGENT), goal)
})

// ---- the consistency problems ----------------------------------------------

test('goalProblems flags a complete goal while a task is [~]', () => {
  const goal = { objective: 'Measure track "X" (x_1).', phase: 'complete' }
  const problems = goalProblems(goal, snapshotOf())
  assert.equal(problems.length, 1)
  assert.match(problems[0], /is complete but the task "Task: Guard the edits" is still \[~\]/)
})

test('goalProblems flags a current goal while no track is in progress', () => {
  const goal = { objective: 'Measure track "X" (x_1).', phase: 'active' }
  const problems = goalProblems(goal, snapshotOf(NO_TASK_PLAN))
  assert.equal(problems.length, 1)
  assert.match(problems[0], /is active but no Measure track is in progress/)
})

test('goalProblems is silent without a goal or without tracks', () => {
  assert.deepEqual(goalProblems(null, snapshotOf()), [])
  const noTracks = snapshotOf()
  noTracks.tracks = []
  noTracks.active = null
  assert.deepEqual(goalProblems({ objective: 'x', phase: 'active' }, noTracks), [])
})

// ---- the /measure-goal command ---------------------------------------------

test('/measure-goal creates a goal from the active track', async () => {
  const goals = goalsOf()
  const reply = await runCommand(commandDeps({ goals }))
  assert.equal(reply.kind, 'success')
  assert.match(reply.text, /^measure-guard: created the goal "Measure track "DSH measure guard" \(dsh_measure_guard_20261107\)\." \(round 0\/256\)\.$/)
  assert.equal(goals.created.length, 1)
  assert.equal(goals.created[0].request.objective, `Measure track "DSH measure guard" (${TRACK_ID}).`)
})

test('/measure-goal reports an existing goal instead of overwriting it', async () => {
  for (const phase of ['active', 'paused', 'blocked']) {
    const goals = goalsOf({ current: { objective: 'The current goal.', phase, roundsStarted: 3, maxGoalRounds: 256 } })
    const reply = await runCommand(commandDeps({ goals }))
    assert.match(reply.text, new RegExp(`the goal "The current goal\\.` + '" is ' + phase + ` \\(round 3/256\\)`))
    assert.equal(goals.created.length, 0)
  }
})

test('/measure-goal replaces a complete goal', async () => {
  const complete = { objective: 'Old goal.', phase: 'complete', roundsStarted: 4, maxGoalRounds: 256 }
  const goals = goalsOf({ current: complete })
  const reply = await runCommand(commandDeps({ goals }))
  assert.match(reply.text, /^measure-guard: created the goal "Measure track "DSH measure guard"/)
  assert.equal(goals.created.length, 1)
})

test('/measure-goal without a goal service reports it', async () => {
  const deps = commandDeps({ goals: goalsOf() })
  deps.goals = undefined
  const reply = await runCommand(deps)
  assert.match(reply.text, /has no goal service/)
})

test('/measure-goal with no [~] track does not create a goal', async () => {
  const none = snapshotOf(NO_TASK_PLAN)
  none.tracks = tracks.map(track => ({ ...track, marker: 'x' }))
  none.active = null
  const goals = goalsOf()
  const reply = await runCommand(commandDeps({ snapshot: none, goals }))
  assert.match(reply.text, /no Measure track is in progress/)
  assert.equal(goals.created.length, 0)
})

test('/measure-goal reports a goal-service refusal', async () => {
  const goals = goalsOf({ refuse: true })
  const reply = await runCommand(commandDeps({ goals }))
  assert.match(reply.text, /the goal service refused: a paused goal must be cleared first/)
  assert.equal(goals.created.length, 0)
})

// ---- the surfaces ----------------------------------------------------------

test('statusText appends the goal line', () => {
  const text = statusText({ snapshot: snapshotOf(), guardsOff: null, mode: 'guard', goal: { objective: 'G.', phase: 'active', roundsStarted: 1, maxGoalRounds: 9 } })
  assert.match(text, /Goal active · round 1\/9 · G\./)
})

test('the end-of-turn check appends the goal/track mismatch', async () => {
  const state = { agents: new Agents(), turns: new Turns(), bypass: { async get() { return null } } }
  state.turns.setTurn(AGENT.id, 1, { status: [], unsha: [], blocks: 0 })
  const deps = {
    mode: 'guard',
    state,
    goals: { get: () => ({ objective: 'Measure track "X" (x_1).', phase: 'complete' }) },
    async refreshSnapshot() {
      return snapshotOf()
    },
    async gitStatusOf() {
      return []
    },
  }
  await onTurnStopping(deps, { agent: AGENT, root: '/repo', payload: { turn: 1 } })
  const problems = state.agents.sessionOf(AGENT.id).problems
  assert.equal(problems.length, 1)
  assert.match(problems[0], /is complete but the task "Task: Guard the edits" is still \[~\]/)
})
