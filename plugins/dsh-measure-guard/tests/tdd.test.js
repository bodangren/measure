// Story S1: the strict TDD guard. The shared core's `tddDecision`, `redFor`,
// and `taskKey` are exercised through the adapter's Red-phase seam: a source
// edit is denied until the `[~]` task has both a test-file change and a failed
// test command, and the record resets when the task changes.
import test from 'node:test'
import assert from 'node:assert/strict'

import { ALLOW, PLAN, TRACK_ID, TRACKS } from './fixtures.js'
import { parseAllowList, parsePlan, parseTracks } from '../src/core/parse.ts'
import { Agents, Turns } from '../src/state.js'
import { noteRedEdit, noteRedFailure, recordRed, redOf, strictRed } from '../src/strict.js'
import { prepareDecision, tddGuardFor } from '../src/guard.js'

const tracks = parseTracks(TRACKS)
const AGENT = { id: 'agent-1', session: { id: 'agent-1' } }

/** A second `[~]` task, so the Red-key reset can be observed. */
const OTHER_PLAN = `# Implementation Plan: DSH measure guard

## Phase 3: Another task

- [~] Task: Different work
`

/** The snapshot the adapter builds from the fixture texts. */
const snapshotOf = (planText = PLAN) => {
  const plan = parsePlan(planText)
  return {
    root: '/repo',
    hasMeasure: true,
    isRepo: true,
    tracksPath: '/repo/measure/tracks.md',
    tracks,
    active: {
      entry: tracks[0],
      planPath: `/repo/measure/tracks/${TRACK_ID}/plan.md`,
      plan,
    },
    inProgressCount: 1,
    parseError: null,
    allow: parseAllowList(ALLOW),
  }
}

/** An io that resolves paths unchanged (absolute or relative to the root). */
const ioOf = () => ({
  async resolve(path, options = {}) {
    return path.startsWith('/') ? path : `${options.cwd ?? '/repo'}/${path}`
  },
  async exists() {
    return false
  },
  async readText() {
    return ''
  },
})

/** The guard dependencies without the DSH runtime. */
const depsOf = ({ mode = 'strict', snapshot = snapshotOf(), guardsOff = null, bypass = null } = {}) => {
  const state = { agents: new Agents(), turns: new Turns(), bypass: { async get() { return bypass ?? guardsOff } } }
  return {
    mode,
    state,
    io: ioOf(),
    snapshots: {
      async get() {
        return snapshot
      },
      invalidate() {},
    },
    async rootOf() {
      return '/repo'
    },
    dirOf() {
      return '/repo'
    },
    async refreshSnapshot() {
      return snapshot
    },
  }
}

const mutationOf = paths => ({ kind: 'file', paths, afterTexts: new Map(), edit: null })

// ---- the Red record --------------------------------------------------------

test('noteRedEdit keeps a successful test-file write and ignores a source write', () => {
  const deps = depsOf()
  const snapshot = snapshotOf()

  assert.equal(noteRedEdit(deps.state, AGENT.id, snapshot, ['/repo/src/app.js']), false)
  assert.equal(redOf(deps.state, AGENT.id), null)

  assert.equal(noteRedEdit(deps.state, AGENT.id, snapshot, ['/repo/tests/app.test.js']), true)
  assert.deepEqual(redOf(deps.state, AGENT.id), { taskKey: strictRed(deps.state, AGENT.id, snapshot).taskKey, testChanged: true, testFailed: false })
})

test('noteRedFailure keeps a failed test command only', () => {
  const deps = depsOf()
  const snapshot = snapshotOf()

  assert.equal(noteRedFailure(deps.state, AGENT.id, snapshot, 'npm run build'), false)
  assert.equal(redOf(deps.state, AGENT.id), null)

  assert.equal(noteRedFailure(deps.state, AGENT.id, snapshot, 'npm test'), true)
  assert.equal(strictRed(deps.state, AGENT.id, snapshot).testFailed, true)
})

test('a new [~] task resets the Red record', () => {
  const deps = depsOf()
  noteRedEdit(deps.state, AGENT.id, snapshotOf(), ['/repo/tests/app.test.js'])
  noteRedFailure(deps.state, AGENT.id, snapshotOf(), 'npm test')
  assert.equal(strictRed(deps.state, AGENT.id, snapshotOf()).testChanged, true)

  const next = strictRed(deps.state, AGENT.id, snapshotOf(OTHER_PLAN))
  assert.equal(next.testChanged, false)
  assert.equal(next.testFailed, false)
})

// ---- the guard decision ----------------------------------------------------

test('strict mode denies a source edit until the task has a failing test', async () => {
  const deps = depsOf()
  const decision = await tddGuardFor(deps, AGENT, '/repo', mutationOf(['/repo/src/app.js']))

  assert.notEqual(decision, null)
  assert.match(decision.deny, /write a failing test first/)
  assert.match(decision.deny, /Task: Guard the edits/)
  assert.match(decision.deny, /\/measure-off/)
})

test('strict mode allows the source edit after a test edit and a failed test command', async () => {
  const deps = depsOf()
  const snapshot = snapshotOf()
  noteRedEdit(deps.state, AGENT.id, snapshot, ['/repo/tests/app.test.js'])
  noteRedFailure(deps.state, AGENT.id, snapshot, 'npm test')

  assert.equal(await tddGuardFor(deps, AGENT, '/repo', mutationOf(['/repo/src/app.js'])), null)
})

test('the TDD guard is inert outside strict mode and with a bypass', async () => {
  for (const mode of ['advise', 'guard']) {
    const deps = depsOf({ mode })
    assert.equal(await tddGuardFor(deps, AGENT, '/repo', mutationOf(['/repo/src/app.js'])), null)
  }
  const bypassed = depsOf({ bypass: 'session' })
  assert.equal(await tddGuardFor(bypassed, AGENT, '/repo', mutationOf(['/repo/src/app.js'])), null)
})

test('the TDD guard ignores test files, measure/ files, and files outside the root', async () => {
  const deps = depsOf()
  assert.equal(await tddGuardFor(deps, AGENT, '/repo', mutationOf(['/repo/tests/app.test.js'])), null)
  assert.equal(await tddGuardFor(deps, AGENT, '/repo', mutationOf(['/repo/measure/tracks.md'])), null)
  assert.equal(await tddGuardFor(deps, AGENT, '/repo', mutationOf(['/other/src/app.js'])), null)
})

test('prepareDecision denies a source edit in strict mode', async () => {
  const deps = depsOf()
  const decision = await prepareDecision(
    deps,
    { name: 'edit', agent: AGENT, arguments: { file_path: '/repo/src/app.js', old_string: 'a', new_string: 'b' } },
  )
  assert.match(decision.denial ?? '', /write a failing test first/)
})

// ---- the Red record from finished tool calls -------------------------------

test('recordRed keeps a successful test-file edit and a failed test command', async () => {
  const deps = depsOf()
  await recordRed(deps, { name: 'edit', agent: AGENT, arguments: { file_path: '/repo/tests/app.test.js' } }, { isError: false })
  assert.equal(strictRed(deps.state, AGENT.id, snapshotOf()).testChanged, true)

  await recordRed(deps, { name: 'bash', agent: AGENT, arguments: { command: 'npm test' } }, { isError: false, value: { exitCode: 1 } })
  assert.equal(strictRed(deps.state, AGENT.id, snapshotOf()).testFailed, true)
})

test('recordRed ignores a passing test run, a failing non-test command, and a non-strict mode', async () => {
  const deps = depsOf()
  await recordRed(deps, { name: 'bash', agent: AGENT, arguments: { command: 'npm test' } }, { isError: false, value: { exitCode: 0 } })
  await recordRed(deps, { name: 'bash', agent: AGENT, arguments: { command: 'npm run build' } }, { isError: false, value: { exitCode: 1 } })
  assert.equal(redOf(deps.state, AGENT.id), null)

  const relaxed = depsOf({ mode: 'guard' })
  await recordRed(relaxed, { name: 'edit', agent: AGENT, arguments: { file_path: '/repo/tests/app.test.js' } }, { isError: false })
  assert.equal(redOf(relaxed.state, AGENT.id), null)
})

test('recordRed never throws on a malformed call', async () => {
  const deps = depsOf()
  await recordRed(deps, { name: 'bash', agent: AGENT, arguments: { command: 42 } }, { isError: false, value: { exitCode: 1 } })
  await recordRed(deps, { name: 'edit', agent: null, arguments: {} }, { isError: false })
  assert.equal(redOf(deps.state, AGENT.id), null)
})
