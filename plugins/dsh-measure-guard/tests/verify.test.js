// Story S2: /measure-verify is read-only. It reports the same git-backed
// problems the end-of-turn check uses plus the active track's metadata verdict,
// and every failure path degrades to a "nothing to verify" reply.
import test from 'node:test'
import assert from 'node:assert/strict'

import { ALLOW, PLAN, TRACK_ID, TRACKS } from './fixtures.js'
import { parseAllowList, parsePlan, parseTracks } from '../src/core/parse.ts'
import { measureVerifyCommand, measureVerifyTool, verifyReport } from '../src/verify.js'

const tracks = parseTracks(TRACKS)
const ROOT = '/repo'
const AGENT = { id: 'agent-1', session: { id: 'agent-1' } }
const METADATA_PATH = `${ROOT}/measure/tracks/${TRACK_ID}/metadata.json`

const snapshotOf = (planText = PLAN) => ({
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
  allow: parseAllowList(ALLOW),
})

const depsOf = ({ snapshot = snapshotOf(), answers = {}, files = {}, throwProbe = false } = {}) => ({
  snapshots: {
    invalidate() {},
    async get() { return snapshot },
  },
  async rootOf() { return ROOT },
  async gitProbe(args) {
    if (throwProbe) throw new Error('git exploded')
    const key = args.join(' ')
    return Object.hasOwn(answers, key) ? answers[key] : 'ok'
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

const NO_TASK_PLAN = `# Implementation Plan

- [x] Task: Done \`abcdef0\`
`

test('the measure_verify tool carries the read-only report for the agent', async () => {
  const tool = measureVerifyTool(depsOf())
  assert.equal(tool.name, 'measure_verify')
  assert.equal(typeof tool.execute, 'function')
  assert.deepEqual(tool.parameters, { type: 'object', properties: {}, additionalProperties: false })
  assert.equal(tool.output.schema.type, 'string')
  const clean = await tool.execute({}, { agent: AGENT })
  assert.equal(clean, 'measure-guard: verification clean (1 tasks checked).')
  const missingNote = depsOf({ answers: { 'notes show abcdef0': 'missing' } })
  const problems = await measureVerifyTool(missingNote).execute({}, { agent: AGENT })
  assert.match(problems, /has no git note/)
})

test('a clean plan reports the checked task count', async () => {
  const reply = await verifyReport(depsOf(), AGENT)
  assert.equal(reply, 'measure-guard: verification clean (1 tasks checked).')
})

test('a fake SHA and a missing note are reported with the end-of-turn texts', async () => {
  const plan = `# Implementation Plan

## Phase 1: Work

- [x] Task: Bad sha \`deadbee\`
- [x] Task: No note \`abcdef1\`
`
  const reply = await verifyReport(
    depsOf({
      snapshot: snapshotOf(plan),
      answers: {
        'rev-parse --verify --quiet deadbee^{commit}': 'missing',
        'rev-parse --verify --quiet abcdef1^{commit}': 'ok',
        'notes show abcdef1': 'missing',
      },
    }),
    AGENT,
  )
  assert.match(reply, /cites SHA deadbee, which no commit in this repository owns/)
  assert.match(reply, /has no git note on its commit abcdef1/)
  assert.equal(reply.split('\n').length, 2)
})

test('a metadata actual_tasks mismatch is reported with both numbers', async () => {
  const reply = await verifyReport(
    depsOf({ files: { [METADATA_PATH]: JSON.stringify({ actual_tasks: 7 }) } }),
    AGENT,
  )
  assert.match(reply, /metadata actual_tasks 7 but its plan has 1 completed tasks/)
})

test('malformed metadata is reported with its path', async () => {
  const reply = await verifyReport(depsOf({ files: { [METADATA_PATH]: '{not json' } }), AGENT)
  assert.match(reply, /is not valid JSON/)
  assert.match(reply, new RegExp(METADATA_PATH.replace(/[/.]/g, m => `\\${m}`)))
})

test('matching metadata keeps the report clean', async () => {
  const reply = await verifyReport(depsOf({ files: { [METADATA_PATH]: JSON.stringify({ actual_tasks: 1 }) } }), AGENT)
  assert.match(reply, /verification clean/)
})

test('a missing project, no active track, and a failing probe degrade to nothing-to-verify', async () => {
  const noProject = depsOf({ snapshot: { ...snapshotOf(), hasMeasure: false } })
  assert.equal(await verifyReport(noProject, AGENT), 'measure-guard: nothing to verify (no measure/ folder).')

  const idle = depsOf({ snapshot: { ...snapshotOf(), active: null } })
  assert.equal(await verifyReport(idle, AGENT), 'measure-guard: nothing to verify (no track in progress).')

  const broken = depsOf({ throwProbe: true })
  assert.match(await verifyReport(broken, AGENT), /nothing to verify \(git exploded\)/)
})

test('the command is registered read-only with a handler', async () => {
  const command = measureVerifyCommand(depsOf())
  assert.equal(command.name, 'measure-verify')
  assert.match(command.description, /Verify the active plan/)
  const reply = await command.handler({ agent: AGENT, rawInput: '' })
  assert.equal(reply.kind, 'success')
  assert.match(reply.text, /verification clean/)
})

test('an open track with actual_tasks null keeps the report clean', async () => {
  const reply = await verifyReport(depsOf({ files: { [METADATA_PATH]: JSON.stringify({ actual_tasks: null }) } }), AGENT)
  assert.match(reply, /verification clean/)
})

test('git cannot answer and a non-work-tree are nothing-to-verify, not clean', async () => {
  const errored = depsOf({ answers: { 'rev-parse --verify --quiet HEAD^{commit}': 'error' } })
  assert.equal(await verifyReport(errored, AGENT), 'measure-guard: nothing to verify (git could not answer).')

  const notRepo = depsOf({ answers: { 'rev-parse --verify --quiet HEAD^{commit}': 'missing' } })
  assert.equal(await verifyReport(notRepo, AGENT), 'measure-guard: nothing to verify (not a git work tree).')
})

test('the report refreshes the snapshot before verifying', async () => {
  let invalidations = 0
  const deps = depsOf()
  deps.snapshots = {
    invalidate() {
      invalidations += 1
    },
    async get() {
      return snapshotOf()
    },
  }
  await verifyReport(deps, AGENT)
  assert.equal(invalidations, 1)
})

test('the command is read-only: it never writes and never mutates the repository state', async () => {
  let mutations = 0
  const deps = depsOf({ files: { [METADATA_PATH]: JSON.stringify({ actual_tasks: 7 }) } })
  deps.io.writeText = async () => {
    mutations += 1
  }
  deps.io.writeFile = async () => {
    mutations += 1
  }
  deps.state = {
    repos: {
      async modeOf() {
        return null
      },
      async setMode() {
        mutations += 1
      },
    },
  }
  const fileBefore = await deps.io.readText(METADATA_PATH)

  const reply = await verifyReport(deps, AGENT)
  assert.match(reply, /actual_tasks 7/)
  assert.equal(mutations, 0)
  assert.equal(await deps.io.readText(METADATA_PATH), fileBefore)
})

test('a non-numeric actual_tasks adds no verdict', async () => {
  const reply = await verifyReport(depsOf({ files: { [METADATA_PATH]: JSON.stringify({ actual_tasks: '3' }) } }), AGENT)
  assert.match(reply, /verification clean/)
})
