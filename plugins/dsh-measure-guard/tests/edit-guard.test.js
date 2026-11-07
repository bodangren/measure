// The edit guard (FR-7): every normalized path goes through the shared core's
// editDecision; the first denial wins after all paths are checked and the deny
// text names the denied paths. Inside measure/, on the allow list, outside the
// root, in advise mode, with a bypass, and on a parse error the edit passes.
import test from 'node:test'
import assert from 'node:assert/strict'

import { ALLOW, PLAN, TRACK_ID, TRACKS } from './fixtures.js'
import { SETUP_DENY } from '../src/core/guards.ts'
import { parseAllowList, parsePlan, parseTracks } from '../src/core/parse.ts'
import { Agents, Turns } from '../src/state.js'
import { editGuardFor, guardContext, prepareDecision } from '../src/guard.js'
import { createDecisions, preExecuteListener } from '../src/hooks.js'

const tracks = parseTracks(TRACKS)
const agent = { id: 'agent-1', session: { id: 'agent-1' } }

const NO_TASK_PLAN = `# Implementation Plan: DSH measure guard

## Phase 2: Adapter

- [ ] Task: Guard the writes
- [ ] Task: Ship the docs
`

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

/** An io that resolves paths unchanged unless `fail` matches. */
const ioOf = (fail = []) => ({
  async resolve(path, options = {}) {
    const joined = path.startsWith('/') ? path : `${options.cwd ?? '/repo'}/${path}`
    if (fail.some(pattern => joined === pattern || joined.endsWith(pattern))) throw new Error(`cannot resolve ${path}`)
    return joined
  },
  async exists() {
    return false
  },
  async readText() {
    return ''
  },
})

/** The guard dependencies without the DSH runtime. */
const depsOf = ({ mode = 'guard', snapshot = snapshotOf(), bypass = null, io = ioOf() } = {}) => {
  const state = { agents: new Agents(), turns: new Turns(), bypass: { async get() { return bypass } } }
  return {
    mode,
    state,
    io,
    snapshots: {
      async get() {
        return snapshot
      },
      invalidate() {},
    },
    async rootOf() {
      return '/repo'
    },
    async refreshSnapshot() {
      return snapshot
    },
  }
}

const mutationOf = (paths) => ({ kind: 'file', paths, afterTexts: new Map(), edit: null })

test('a write outside measure/ without a [~] task is denied and names the next task', async () => {
  const deps = depsOf({ snapshot: snapshotOf(NO_TASK_PLAN) })
  const decision = await editGuardFor(deps, agent, '/repo', mutationOf(['/repo/src/app.js']))
  assert.notEqual(decision, null)
  assert.match(decision.deny, /no task in the track "DSH measure guard" is in progress/)
  assert.match(decision.deny, /Task: Guard the writes/)
  assert.match(decision.deny, /src\/app\.js/)
  assert.match(decision.deny, /\/measure-off/)
})

test('a write with a [~] task passes', async () => {
  const decision = await editGuardFor(depsOf(), agent, '/repo', mutationOf(['/repo/src/app.js']))
  assert.equal(decision, null)
})

test('writes inside measure/ and on the allow list pass', async () => {
  const deps = depsOf({ snapshot: snapshotOf(NO_TASK_PLAN) })
  assert.equal(await editGuardFor(deps, agent, '/repo', mutationOf(['/repo/measure/tracks.md'])), null)
  assert.equal(await editGuardFor(deps, agent, '/repo', mutationOf(['/repo/docs/guide.md'])), null)
  assert.equal(await editGuardFor(deps, agent, '/repo', mutationOf(['/repo/docs/nested/x.md'])), null)
})

test('a path outside the project root is not Measure work and passes', async () => {
  const deps = depsOf({ snapshot: snapshotOf(NO_TASK_PLAN) })
  assert.equal(await editGuardFor(deps, agent, '/repo', mutationOf(['/elsewhere/app.js'])), null)
})

test('session and repository bypass pass every path', async () => {
  for (const bypass of ['session', 'repo']) {
    const deps = depsOf({ snapshot: snapshotOf(NO_TASK_PLAN), bypass })
    assert.equal(await editGuardFor(deps, agent, '/repo', mutationOf(['/repo/src/app.js'])), null)
  }
})

test('advise mode allows even without a [~] task', async () => {
  const deps = depsOf({ mode: 'advise', snapshot: snapshotOf(NO_TASK_PLAN) })
  assert.equal(await editGuardFor(deps, agent, '/repo', mutationOf(['/repo/src/app.js'])), null)
})

test('a parse error allows everything', async () => {
  const deps = depsOf({ snapshot: snapshotOf(NO_TASK_PLAN, { parseError: 'tracks.md is broken' }) })
  assert.equal(await editGuardFor(deps, agent, '/repo', mutationOf(['/repo/src/app.js'])), null)
})

test('a multi-path call is denied and lists the denied path', async () => {
  const deps = depsOf({ snapshot: snapshotOf(NO_TASK_PLAN) })
  const decision = await editGuardFor(deps, agent, '/repo', mutationOf(['/repo/measure/tracks.md', '/repo/src/app.js']))
  assert.notEqual(decision, null)
  assert.match(decision.deny, /src\/app\.js/)
  assert.doesNotMatch(decision.deny, /measure\/tracks\.md/)
})

test('a multi-path call lists every denied path, up to five and then the rest', async () => {
  const deps = depsOf({ snapshot: snapshotOf(NO_TASK_PLAN) })
  const paths = ['/repo/a.js', '/repo/b.js', '/repo/c.js', '/repo/d.js', '/repo/e.js', '/repo/f.js', '/repo/g.js']
  const decision = await editGuardFor(deps, agent, '/repo', mutationOf(paths))
  assert.notEqual(decision, null)
  assert.match(decision.deny, /a\.js, b\.js, c\.js, d\.js, e\.js, and 2 more/)
})

test('a path that cannot resolve allows (fail open)', async () => {
  const deps = depsOf({ snapshot: snapshotOf(NO_TASK_PLAN), io: ioOf(['src/app.js']) })
  assert.equal(await editGuardFor(deps, agent, '/repo', mutationOf(['/repo/src/app.js'])), null)
})

test('setup: the shared deny fires once, then the answer off makes edits pass', async () => {
  const snapshot = snapshotOf(NO_TASK_PLAN, { hasMeasure: false, isRepo: true, tracks: [], active: null, tracksPath: null })
  const deps = depsOf({ snapshot })
  const first = await editGuardFor(deps, agent, '/repo', mutationOf(['/repo/src/app.js']))
  assert.deepEqual(first, { deny: SETUP_DENY })
  assert.equal(deps.state.agents.sessionOf(agent.id).setupChoice, 'off')
  assert.equal(await editGuardFor(deps, agent, '/repo', mutationOf(['/repo/src/app.js'])), null)
})

test('guardContext reads the snapshot, mode, setup answer, and bypass', async () => {
  const deps = depsOf({ mode: 'strict', bypass: 'repo' })
  deps.state.agents.sessionOf(agent.id).setupChoice = 'setup'
  const context = await guardContext(deps, agent, '/repo')
  assert.equal(context.mode, 'strict')
  assert.equal(context.setupChoice, 'setup')
  assert.equal(context.guardsOff, 'repo')
  assert.equal(context.snapshot.root, '/repo')
})

test('shell and other mutations are not path-checked by the edit guard', async () => {
  const deps = depsOf({ snapshot: snapshotOf(NO_TASK_PLAN) })
  assert.equal(await editGuardFor(deps, agent, '/repo', { kind: 'shell', command: 'rm -rf src' }), null)
  assert.equal(await editGuardFor(deps, agent, '/repo', { kind: 'other' }), null)
})

test('prepareDecision denies through the pre-execute listener and the decision map', async () => {
  const deps = depsOf({ snapshot: snapshotOf(NO_TASK_PLAN) })
  deps.dirOf = () => '/repo'
  const decisions = createDecisions()
  const exec = {
    token: Symbol('wire'),
    name: 'edit',
    arguments: { file_path: 'src/app.js', old_string: 'a', new_string: 'b' },
    agent,
  }
  const listener = preExecuteListener({ ...deps, decide: one => prepareDecision(deps, one) }, decisions)
  const gate = await listener(exec, async () => ({ kind: 'allow' }))
  assert.deepEqual(gate, { kind: 'allow' })
  assert.match(decisions.get(exec.token), /no task in the track/)
  assert.match(decisions.get(exec.token), /src\/app\.js/)
})

// ---- the bounded shell-write guard (Story S3) ------------------------------

const shellExec = command => ({ name: 'bash', agent, arguments: { command } })

test('a shell redirect outside measure/ without a task is denied with the core edit text', async () => {
  const deps = depsOf({ snapshot: snapshotOf(NO_TASK_PLAN) })
  const decision = await prepareDecision(deps, shellExec('echo hi > /repo/src/app.js'))
  assert.match(decision.denial ?? '', /is in progress/)
})

test('a shell redirect with a [~] task is allowed', async () => {
  const deps = depsOf()
  const decision = await prepareDecision(deps, shellExec('echo hi > /repo/src/app.js'))
  assert.equal(decision.denial, undefined)
})

test('a shell write to the registry or a plan is denied with the after-text text', async () => {
  const deps = depsOf()
  for (const command of ['echo hi > /repo/measure/tracks.md', "sed -i 's/a/b/' /repo/measure/tracks/x/plan.md"]) {
    const decision = await prepareDecision(deps, shellExec(command))
    assert.match(decision.denial ?? '', /cannot read the after-text of a shell write/)
    assert.match(decision.denial ?? '', /Use edit or write/)
  }
})

test('a shell write to another measure/ file, an outside path, or /dev/null is allowed', async () => {
  const deps = depsOf()
  for (const command of ['echo hi > /repo/measure/guard-allow', 'echo hi > /tmp/out.txt', 'echo hi 2>/dev/null']) {
    const decision = await prepareDecision(deps, shellExec(command))
    assert.equal(decision.denial, undefined, command)
  }
})

test('strict mode denies a source shell target without a Red phase', async () => {
  const deps = depsOf({ mode: 'strict' })
  const decision = await prepareDecision(deps, shellExec('echo hi > /repo/src/app.js'))
  assert.match(decision.denial ?? '', /write a failing test first/)
})

test('advise mode and the bypass allow the shell and registry denies', async () => {
  for (const options of [{ mode: 'advise' }, { bypass: 'session' }]) {
    const deps = depsOf(options)
    for (const command of ['echo hi > /repo/measure/tracks.md', 'echo hi > /repo/src/app.js']) {
      assert.equal((await prepareDecision(deps, shellExec(command))).denial, undefined, `${JSON.stringify(options)} ${command}`)
    }
  }
})

test('a relative shell target resolves against the session directory', async () => {
  const deps = depsOf({ snapshot: snapshotOf(NO_TASK_PLAN) })
  deps.dirOf = () => '/repo'
  const decision = await prepareDecision(deps, shellExec('echo hi > out.txt'))
  assert.match(decision.denial ?? '', /is in progress/)
})
