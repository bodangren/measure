// The measure_status text and the hand-built ToolDefinition (no defineTool
// import, design §2 consequence 1).
import test from 'node:test'
import assert from 'node:assert/strict'

import { ALLOW, PLAN, TRACK_ID, TRACKS } from './fixtures.js'
import { parseAllowList, parsePlan, parseTracks } from '../src/core/parse.ts'
import { measureStatusTool, statusText } from '../src/status.js'

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

test('statusText is the status lines plus the task note', () => {
  const text = statusText({ snapshot: snapshotOf(), guardsOff: null, mode: 'guard' })
  assert.match(text, /Tracks:/)
  assert.match(text, /\[~\] DSH measure guard \(tracks\/dsh_measure_guard_20261107\) · active/)
  assert.match(text, /Active plan: measure\/tracks\/dsh_measure_guard_20261107\/plan\.md/)
  assert.match(text, /Blocked tasks \(\[b\]\):/)
  assert.match(text, /Guards: on\n/)
  assert.match(text, /measure-guard \(Mode: guard\)/)
  assert.match(text, /Current task: \[~\] Task: Guard the edits/)
})

test('statusText names the bypass state', () => {
  const text = statusText({ snapshot: snapshotOf(), guardsOff: 'session', mode: 'guard' })
  assert.match(text, /Guards: off for this session/)
})

test('statusText handles no active track, no measure/, and a parse error', () => {
  const idleTracks = parseTracks(TRACKS.replace('- [~] **Track:', '- [ ] **Track:'))
  const idle = statusText({
    snapshot: snapshotOf(PLAN, { tracks: idleTracks, active: null, inProgressCount: 0 }),
    guardsOff: null,
    mode: 'guard',
  })
  assert.match(idle, /Tracks:/)
  assert.match(idle, /no track is in progress in measure\/tracks\.md/)

  const none = statusText({
    snapshot: snapshotOf(PLAN, { hasMeasure: false, tracks: [], active: null, inProgressCount: 0 }),
    guardsOff: null,
    mode: 'guard',
  })
  assert.equal(none, 'This project has no measure/ folder.\nGuards: on')

  const broken = statusText({
    snapshot: snapshotOf(PLAN, { active: null, parseError: '/repo/measure/tracks.md has track lines in no known format' }),
    guardsOff: 'repo',
    mode: 'advise',
  })
  assert.match(broken, /The Measure files cannot be read:/)
  assert.match(broken, /the Measure files could not be read/)
  assert.match(broken, /Guards: off for this repository/)
})

test('measureStatusTool is a complete hand-built ToolDefinition', () => {
  const tool = measureStatusTool({
    mode: 'guard',
    state: { bypass: { get: async () => null } },
    snapshots: { invalidate() {}, async get() {} },
    rootOf: async () => '/repo',
    refreshSnapshot: async () => snapshotOf(),
  })

  assert.equal(tool.name, 'measure_status')
  assert.match(tool.description, /\[b\] count/)
  assert.match(tool.description, /next action/)
  assert.match(tool.description, /Specification path/)
  assert.match(tool.description, /instead of reading the Measure files/)
  assert.deepEqual(tool.parameters, { type: 'object', properties: {}, additionalProperties: false })
  assert.deepEqual(tool.output.schema, { type: 'string' })
  assert.deepEqual(tool.output.render({}, 'the text'), [{ type: 'text', text: 'the text' }])
  assert.equal(typeof tool.execute, 'function')
})

test('measureStatusTool refreshes the snapshot and returns the status text', async () => {
  let refreshes = 0
  let rootOfArgs = null
  const tool = measureStatusTool({
    mode: 'guard',
    state: { bypass: { get: async () => 'session' } },
    snapshots: { invalidate() {}, async get() {} },
    rootOf: async agent => {
      rootOfArgs = agent
      return '/repo'
    },
    refreshSnapshot: async root => {
      assert.equal(root, '/repo')
      refreshes += 1
      return snapshotOf()
    },
  })

  const agent = { id: 'agent-1' }
  const value = await tool.execute({ ignored: true }, { agent })
  assert.equal(refreshes, 1)
  assert.equal(rootOfArgs, agent)
  assert.match(value, /Tracks:/)
  assert.match(value, /Guards: off for this session/)
})

test('measureStatusTool falls back to invalidate + get without a refresh dep', async () => {
  let invalidations = 0
  let reads = 0
  const tool = measureStatusTool({
    mode: 'guard',
    state: { bypass: { get: async () => null } },
    snapshots: {
      invalidate() {
        invalidations += 1
      },
      async get() {
        reads += 1
        return snapshotOf()
      },
    },
    rootOf: async () => '/repo',
  })

  const value = await tool.execute({}, { agent: { id: 'agent-1' } })
  assert.equal(invalidations, 1)
  assert.equal(reads, 1)
  assert.match(value, /Tracks:/)
})
