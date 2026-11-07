// Story S2: git-backed verification. An [x] task's SHA must be a real commit
// with its git note; a closed track's metadata actual_tasks must match its
// plan. The probe's `error` state (git unavailable) fails open.
import test from 'node:test'
import assert from 'node:assert/strict'

import { PLAN, TRACK_ID } from './fixtures.js'
import { parsePlan } from '../src/core/parse.ts'
import { closeoutMetadataCheck, planCompletedCount, shaProblems } from '../src/git-verification.js'

const ROOT = '/repo'
const TRACK_ID_OK = TRACK_ID

/** A plan whose tasks carry the given SHAs and markers. */
const planOf = tasks =>
  parsePlan(`# Implementation Plan

## Phase 1: Work

${tasks.map(task => `- [${task.marker}] Task: ${task.text}${task.sha === undefined ? '' : ` \`${task.sha}\``}`).join('\n')}
`)

/** A fake tri-state probe driven by an answers map: args.join(' ') -> state. */
const depsOf = ({ answers = {}, files = {} } = {}) => ({
  async gitProbe(args) {
    const key = args.join(' ')
    if (Object.hasOwn(answers, key)) return answers[key]
    return 'ok'
  },
  io: {
    async exists(path) {
      return Object.hasOwn(files, path)
    },
    async readText(path) {
      return files[path] ?? ''
    },
  },
})

const snapshotOf = plan => ({ root: ROOT, active: { entry: { id: TRACK_ID_OK, name: 'Track', folder: `tracks/${TRACK_ID_OK}` }, planPath: `${ROOT}/measure/tracks/${TRACK_ID_OK}/plan.md`, plan } })

test('planCompletedCount counts only [x] tasks', () => {
  const plan = parsePlan(PLAN)
  assert.equal(planCompletedCount(plan), 1)
})

test('a bad SHA and a missing note each produce one problem naming the task', async () => {
  const plan = planOf([
    { marker: 'x', text: 'Good', sha: 'abcdef0' },
    { marker: 'x', text: 'Bad sha', sha: 'deadbee' },
    { marker: 'x', text: 'No note', sha: 'abcdef1' },
  ])
  const deps = depsOf({ answers: { 'rev-parse --verify --quiet deadbee^{commit}': 'missing', 'notes show abcdef1': 'missing' } })
  const problems = await shaProblems(deps, snapshotOf(plan))

  assert.equal(problems.length, 2)
  assert.match(problems[0], /the task "Task: Bad sha" cites SHA deadbee, which no commit in this repository owns/)
  assert.match(problems[1], /the task "Task: No note" has no git note on its commit abcdef1/)
})

test('a verified task is silent and a probe error fails open', async () => {
  const plan = planOf([
    { marker: 'x', text: 'Good', sha: 'abcdef0' },
    { marker: 'x', text: 'Unavailable', sha: 'abcdef2' },
  ])
  const deps = depsOf({ answers: { 'rev-parse --verify --quiet abcdef2^{commit}': 'error' } })
  assert.deepEqual(await shaProblems(deps, snapshotOf(plan)), [])
})

test('a plan with no verified SHA has no problems', async () => {
  assert.deepEqual(await shaProblems(depsOf(), snapshotOf(parsePlan(PLAN))), [])
})

// ---- the closeout metadata check ------------------------------------------

const closingOf = (tasks, metadataText) => {
  const plan = planOf(tasks)
  return {
    plan,
    tracksPath: `${ROOT}/measure/tracks.md`,
    metadataPath: `${ROOT}/measure/tracks/${TRACK_ID_OK}/metadata.json`,
    closing: [{ entry: { name: 'Track', folder: `tracks/${TRACK_ID_OK}` }, plan }],
    files: metadataText === undefined ? {} : { [`${ROOT}/measure/tracks/${TRACK_ID_OK}/metadata.json`]: metadataText },
  }
}

test('metadata actual_tasks must equal the completed count', async () => {
  const one = closingOf([{ marker: 'x', text: 'Done', sha: 'abcdef0' }], JSON.stringify({ actual_tasks: 1 }))
  assert.equal(await closeoutMetadataCheck(depsOf({ files: one.files }), one.tracksPath, one.closing), null)

  const mismatch = closingOf([{ marker: 'x', text: 'Done', sha: 'abcdef0' }], JSON.stringify({ actual_tasks: 4 }))
  const decision = await closeoutMetadataCheck(depsOf({ files: mismatch.files }), mismatch.tracksPath, mismatch.closing)
  assert.match(decision.decision.deny, /actual_tasks 4 but its plan has 1 completed tasks/)
})

test('missing or malformed metadata denies the close', async () => {
  const missing = closingOf([{ marker: 'x', text: 'Done', sha: 'abcdef0' }])
  const noFile = await closeoutMetadataCheck(depsOf({ files: missing.files }), missing.tracksPath, missing.closing)
  assert.match(noFile.decision.deny, /has no metadata\.json/)

  const malformed = closingOf([{ marker: 'x', text: 'Done', sha: 'abcdef0' }], '{not json')
  const bad = await closeoutMetadataCheck(depsOf({ files: malformed.files }), malformed.tracksPath, malformed.closing)
  assert.match(bad.decision.deny, /is not valid JSON/)
})

test('a close with no plan is left to the shared core', async () => {
  const deps = depsOf()
  assert.equal(await closeoutMetadataCheck(deps, `${ROOT}/measure/tracks.md`, [{ entry: { name: 'T', folder: 'tracks/t' }, plan: null }]), null)
})
