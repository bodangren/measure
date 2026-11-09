// The closeout guard (FR-8): a track may change to [x] only when its plan has
// no open task, and a task may start in phase N+1 only when phase N's heading
// has a checkpoint. The after-text exists for edit, write, apply_patch, and
// str_replace_editor; the shell calls fail open here and are caught by the
// end-of-turn check. On an allow the core's [b] note rides on the tool result
// through the post-execute append.
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
const METADATA = `${ROOT}/measure/tracks/${TRACK_ID}/metadata.json`

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
  const deps = depsOf({ files: { [REGISTRY]: TRACKS, [PLAN_PATH]: closedPlan, [METADATA]: JSON.stringify({ actual_tasks: 1 }) } })
  const { decision, note } = await closeoutGuardFor(deps, agent, ROOT, mutationOf(REGISTRY, CLOSED_TRACKS))
  assert.equal(decision, null)
  assert.match(note, /\[b\] Task: Human review/)
  assert.match(note, /List them for the user/)
})

test('starting a task in phase N+1 without a checkpoint passes with a note', async () => {
  const before = `# Plan

## Phase 1: Skeleton

- [x] Task: First \`abcdef0\`

## Phase 2: Adapter

- [ ] Task: Second
`
  const after = before.replace('- [ ] Task: Second', '- [~] Task: Second')
  const deps = depsOf({ files: { [PLAN_PATH]: before } })
  assert.deepEqual(await closeoutGuardFor(deps, agent, ROOT, mutationOf(PLAN_PATH, after)), {
    decision: null,
    note: 'measure-guard: "Phase 2: Adapter" starts while the heading of "Phase 1: Skeleton" has no [checkpoint: <sha>]. This is correct when the two phases run at the same time. When "Phase 1: Skeleton" is complete, run the Phase Completion Verification and Checkpointing Protocol in measure/workflow.md for it.',
  })
  const closed = before.replace('- [ ] Task: Second', '- [x] Task: Second')
  assert.deepEqual(await closeoutGuardFor(deps, agent, ROOT, mutationOf(PLAN_PATH, closed)), { decision: null, note: null })
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
  const deps = depsOf({ files: { [REGISTRY]: TRACKS, [PLAN_PATH]: closedPlan, [METADATA]: JSON.stringify({ actual_tasks: 1 }) } })
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

test('closing a track whose metadata actual_tasks disagrees is denied with both numbers', async () => {
  const closedPlan = `# Implementation Plan

## Phase 2: Adapter

- [x] Task: Guard the edits \`abcdef0\`
- [x] Task: Ship the docs \`abcdef1\`
`
  const deps = depsOf({ files: { [REGISTRY]: TRACKS, [PLAN_PATH]: closedPlan, [METADATA]: JSON.stringify({ actual_tasks: 1 }) } })
  const { decision } = await closeoutGuardFor(deps, agent, ROOT, mutationOf(REGISTRY, CLOSED_TRACKS))
  assert.notEqual(decision, null)
  assert.match(decision.deny, /actual_tasks 1 but its plan has 2 completed tasks/)
})

test('closing a track without metadata.json is denied', async () => {
  const closedPlan = `# Implementation Plan

## Phase 2: Adapter

- [x] Task: Guard the edits \`abcdef0\`
`
  const deps = depsOf({ files: { [REGISTRY]: TRACKS, [PLAN_PATH]: closedPlan } })
  const { decision } = await closeoutGuardFor(deps, agent, ROOT, mutationOf(REGISTRY, CLOSED_TRACKS))
  assert.notEqual(decision, null)
  assert.match(decision.deny, /has no metadata\.json/)
  assert.match(decision.deny, /actual_tasks: 1/)
})


// ---- the unreadable-tool registry deny (Story S3) --------------------------

const patchOf = path => `*** Begin Patch\n*** Update File: ${path}\n@@\n-a\n+b\n*** End Patch\n`
const editorOf = path => ({ command: 'str_replace', path, old_str: 'a', new_str: 'b' })
const closingPatch = () =>
  [
    '*** Begin Patch',
    `*** Update File: ${REGISTRY}`,
    '@@',
    ' # Project Tracks',
    ' ',
    '-- [~] **Track: DSH measure guard**',
    '+- [x] **Track: DSH measure guard**',
    '*** End Patch',
  ].join('\n')

test('an apply_patch on a registry file is checked by the closeout guard when it is readable', async () => {
  const deps = depsOf({ files: { [REGISTRY]: TRACKS, [PLAN_PATH]: PLAN } })
  const decision = await prepareDecision(deps, { name: 'apply_patch', agent, arguments: { input: closingPatch() } })
  assert.match(decision.denial ?? '', /a track can change to \[x\] only when its plan has no open task/)
  assert.match(decision.denial ?? '', /\[~\] Task: Guard the edits/)
})

test('an unreadable apply_patch hunk on a registry file still fails closed', async () => {
  const deps = depsOf({ files: { [REGISTRY]: TRACKS, [PLAN_PATH]: PLAN } })
  const decision = await prepareDecision(deps, { name: 'apply_patch', agent, arguments: { input: patchOf(REGISTRY) } })
  assert.match(decision.denial ?? '', /cannot read the after-text/)
  assert.match(decision.denial ?? '', /Use edit or write/)
})

test('a str_replace_editor on a plan is checked, and a valid replacement is allowed', async () => {
  const deps = depsOf({ files: { [REGISTRY]: TRACKS, [PLAN_PATH]: PLAN } })
  const allowed = await prepareDecision(deps, {
    name: 'str_replace_editor',
    agent,
    arguments: { command: 'str_replace', path: PLAN_PATH, old_str: 'Guard the edits', new_str: 'Guard the shell edits' },
  })
  assert.equal(allowed.denial, undefined)
  const closing = await prepareDecision(deps, {
    name: 'str_replace_editor',
    agent,
    arguments: {
      command: 'str_replace',
      path: REGISTRY,
      old_str: '- [~] **Track: DSH measure guard**',
      new_str: '- [x] **Track: DSH measure guard**',
    },
  })
  assert.match(closing.denial ?? '', /a track can change to \[x\] only when its plan has no open task/)
})

test('advise mode allows the registry deny and the metadata closeout check', async () => {
  const deps = depsOf({ mode: 'advise', files: { [REGISTRY]: TRACKS, [PLAN_PATH]: PLAN } })
  const tool = await prepareDecision(deps, { name: 'apply_patch', agent, arguments: { input: '*** Update File: /repo/measure/tracks.md' } })
  assert.equal(tool.denial, undefined)

  const mismatch = await closeoutGuardFor(
    { ...deps, mode: 'advise' },
    agent,
    ROOT,
    mutationOf(REGISTRY, CLOSED_TRACKS),
  )
  assert.deepEqual(mismatch, { decision: null, note: null })
})

test('the same tools on other files keep the fail-open closeout behavior', async () => {
  const deps = depsOf({ files: { [REGISTRY]: TRACKS, [PLAN_PATH]: PLAN } })
  for (const [tool, args] of [['apply_patch', { input: patchOf('/repo/src/app.js') }], ['str_replace_editor', editorOf('/repo/src/app.js')]]) {
    const decision = await prepareDecision(deps, { name: tool, agent, arguments: args })
    assert.equal(decision.denial, undefined, String(tool))
  }
})
