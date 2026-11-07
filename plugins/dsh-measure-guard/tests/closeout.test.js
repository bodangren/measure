// The closeout guard (FR-8): a track may change to [x] only when its plan has
// no open task, and a task may start in phase N+1 only when phase N's heading
// has a checkpoint. The after-text exists only for edit/write; every other
// mutation fails open here and is caught by the end-of-turn check. On an allow
// the core's [b] note rides on the tool result through the post-execute append.
import test from 'node:test'
import assert from 'node:assert/strict'

import { PLAN, TRACK_ID, TRACKS } from './fixtures.js'
import { parseAllowList, parsePlan, parseTracks } from '../src/core/parse.ts'
import { Agents, Turns } from '../src/state.js'
import { closeoutGuardFor, prepareDecision } from '../src/guard.js'
import { postExecuteListener } from '../src/hooks.js'

const tracks = parseTracks(TRACKS)
const agent = { id: 'agent-1', session: { id: 'agent-1' } }
const ROOT = '/repo'
const REGISTRY = `${ROOT}/measure/tracks.md`
const PLAN_PATH = `${ROOT}/measure/tracks/${TRACK_ID}/plan.md`

const CLOSED_TRACKS = TRACKS.replace('- [~] **Track: DSH measure guard**', '- [x] **Track: DSH measure guard**')

/** The snapshot the adapter builds from the fixture texts. */
const snapshotOf = (overrides = {}) => ({
  root: ROOT,
  hasMeasure: true,
  isRepo: true,
  tracksPath: REGISTRY,
  tracks,
  active: {
    entry: tracks[0],
    planPath: PLAN_PATH,
    plan: parsePlan(PLAN),
  },
  inProgressCount: 1,
  parseError: null,
  allow: parseAllowList(''),
  ...overrides,
})

/** An in-memory io for the closeout reads. */
const ioOf = (files = {}) => ({
  async resolve(path) {
    return path
  },
  async exists(path) {
    return Object.hasOwn(files, path)
  },
  async readText(path) {
    return files[path] ?? ''
  },
})

const depsOf = ({ mode = 'guard', snapshot = snapshotOf(), bypass = null, files = {} } = {}) => {
  const state = { agents: new Agents(), turns: new Turns(), bypass: { async get() { return bypass } } }
  return {
    mode,
    state,
    io: ioOf(files),
    snapshots: {
      async get() {
        return snapshot
      },
      invalidate() {},
    },
    async rootOf() {
      return ROOT
    },
    async refreshSnapshot() {
      return snapshot
    },
  }
}

const mutationOf = (path, after, kind = 'file') =>
  kind === 'file'
    ? { kind, paths: [path], afterTexts: new Map([[path, after]]), edit: null }
    : { kind, paths: [path], afterTexts: new Map(), edit: null }

test('closing a track with open tasks is denied and lists them', async () => {
  const deps = depsOf({ files: { [REGISTRY]: TRACKS, [PLAN_PATH]: PLAN } })
  const { decision, note } = await closeoutGuardFor(deps, agent, ROOT, mutationOf(REGISTRY, CLOSED_TRACKS))
  assert.notEqual(decision, null)
  assert.match(decision.deny, /a track can change to \[x\] only when its plan has no open task/)
  assert.match(decision.deny, /\[~\] Task: Guard the edits/)
  assert.match(decision.deny, /\[ \] Task: Ship the docs/)
  assert.match(decision.deny, /\[b\] Task: Human review/)
  assert.match(decision.deny, /deferred:<owner>/)
  assert.equal(note, null)
})

test('closing a track with a deferred [b] task is allowed with the [b] note', async () => {
  const closedPlan = `# Implementation Plan

## Phase 2: Adapter

- [x] Task: Guard the edits \`abcdef0\`
- [b] Task: Human review deferred:alice
`
  const deps = depsOf({ files: { [REGISTRY]: TRACKS, [PLAN_PATH]: closedPlan } })
  const { decision, note } = await closeoutGuardFor(deps, agent, ROOT, mutationOf(REGISTRY, CLOSED_TRACKS))
  assert.equal(decision, null)
  assert.match(note, /\[b\] Task: Human review/)
  assert.match(note, /List them for the user/)
})

test('starting a task in phase N+1 without a checkpoint is denied naming the phase', async () => {
  const before = `# Plan

## Phase 1: Skeleton

- [x] Task: First \`abcdef0\`

## Phase 2: Adapter

- [ ] Task: Second
`
  const after = before.replace('- [ ] Task: Second', '- [~] Task: Second')
  const deps = depsOf({ files: { [PLAN_PATH]: before } })
  const { decision } = await closeoutGuardFor(deps, agent, ROOT, mutationOf(PLAN_PATH, after))
  assert.notEqual(decision, null)
  assert.match(decision.deny, /"Phase 2: Adapter" cannot start/)
  assert.match(decision.deny, /heading of "Phase 1: Skeleton" has no \[checkpoint: <sha>\]/)
})

test('starting a task in phase N+1 with a checkpoint passes', async () => {
  const before = `# Plan

## Phase 1: Skeleton [checkpoint: abcdef0]

- [x] Task: First \`abcdef0\`

## Phase 2: Adapter

- [ ] Task: Second
`
  const after = before.replace('- [ ] Task: Second', '- [~] Task: Second')
  const deps = depsOf({ files: { [PLAN_PATH]: before } })
  assert.deepEqual(await closeoutGuardFor(deps, agent, ROOT, mutationOf(PLAN_PATH, after)), { decision: null, note: null })
})

test('a plan edit that starts no new phase passes', async () => {
  const before = `# Plan

## Phase 1: Skeleton

- [x] Task: First \`abcdef0\`

## Phase 2: Adapter

- [ ] Task: Second
`
  const after = before.replace('Task: First', 'Task: First renamed')
  const deps = depsOf({ files: { [PLAN_PATH]: before } })
  assert.deepEqual(await closeoutGuardFor(deps, agent, ROOT, mutationOf(PLAN_PATH, after)), { decision: null, note: null })
})

test('an unreadable or missing plan fails open on a track close', async () => {
  const deps = depsOf({ files: { [REGISTRY]: TRACKS } })
  const result = await closeoutGuardFor(deps, agent, ROOT, mutationOf(REGISTRY, CLOSED_TRACKS))
  assert.deepEqual(result, { decision: null, note: null })
})

test('apply_patch, str_replace_editor, and shell calls fail open', async () => {
  const deps = depsOf({ files: { [REGISTRY]: TRACKS, [PLAN_PATH]: PLAN } })
  assert.deepEqual(await closeoutGuardFor(deps, agent, ROOT, mutationOf(REGISTRY, null, 'file')), {
    decision: null,
    note: null,
  })
  assert.deepEqual(await closeoutGuardFor(deps, agent, ROOT, { kind: 'shell', command: 'git add -A' }), {
    decision: null,
    note: null,
  })
  assert.deepEqual(await closeoutGuardFor(deps, agent, ROOT, { kind: 'other' }), { decision: null, note: null })
})

test('a bypass, advise mode, and a parse error all fail open', async () => {
  const mutation = mutationOf(REGISTRY, CLOSED_TRACKS)
  assert.equal((await closeoutGuardFor(depsOf({ bypass: 'repo', files: {} }), agent, ROOT, mutation)).decision, null)
  assert.equal((await closeoutGuardFor(depsOf({ mode: 'advise', files: {} }), agent, ROOT, mutation)).decision, null)
  assert.equal(
    (await closeoutGuardFor(depsOf({ snapshot: snapshotOf({ parseError: 'broken' }), files: {} }), agent, ROOT, mutation)).decision,
    null,
  )
})

test('the post-execute append adds the closeout note to the tool result content', async () => {
  const notes = new Map()
  const token = Symbol('token')
  const exec = { token, name: 'edit' }
  notes.set(token, 'measure-guard: the closed track has these [b] tasks.')
  const listener = postExecuteListener(notes)
  const result = { content: [{ type: 'text', text: 'ok' }], isError: false }
  const decision = await listener(exec, result, async () => ({ kind: 'accept' }))
  assert.equal(decision.kind, 'accept')
  assert.equal(decision.content.length, 2)
  assert.deepEqual(decision.content[1], { type: 'text', text: 'measure-guard: the closed track has these [b] tasks.' })
  assert.equal(result.content.length, 1)
})

test('the post-execute append leaves a call without a note, or a failure, untouched', async () => {
  const listener = postExecuteListener(new Map())
  const result = { content: [], isError: false }
  const accept = { kind: 'accept' }
  assert.equal(await listener({ token: Symbol('t') }, result, async () => accept), accept)

  const notes = new Map()
  const token = Symbol('n')
  notes.set(token, 'note')
  const failed = await postExecuteListener(notes)({ token }, { content: [], isError: true }, async () => ({ kind: 'accept' }))
  assert.deepEqual(failed, { kind: 'accept' })
})

test('prepareDecision carries the closeout note to the post-execute append', async () => {
  const closedPlan = `# Implementation Plan

## Phase 2: Adapter

- [x] Task: Guard the edits \`abcdef0\`
- [b] Task: Human review deferred:alice
`
  const deps = depsOf({ files: { [REGISTRY]: TRACKS, [PLAN_PATH]: closedPlan } })
  deps.dirOf = () => ROOT
  const exec = {
    token: Symbol('note'),
    name: 'edit',
    agent,
    arguments: {
      file_path: REGISTRY,
      old_string: '- [~] **Track: DSH measure guard**',
      new_string: '- [x] **Track: DSH measure guard**',
    },
  }
  const outcome = await prepareDecision(deps, exec)
  assert.equal(outcome.denial, undefined)
  assert.match(outcome.note, /\[b\] Task: Human review/)

  const notes = new Map([[exec.token, outcome.note]])
  const decision = await postExecuteListener(notes)(exec, { content: [{ type: 'text', text: 'ok' }] }, async () => ({ kind: 'accept' }))
  assert.equal(decision.content.at(-1).text, outcome.note)
})
