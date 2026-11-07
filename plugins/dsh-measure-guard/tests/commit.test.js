// Story S2: the strict commit guard and the post-commit reminder. The shared
// core decides the message format and the no-task rule; this adapter reads the
// staged files through its git seam and appends the reminder from the finished
// commit's result (the SHA exists only there).
import test from 'node:test'
import assert from 'node:assert/strict'

import { ALLOW, PLAN, TRACK_ID, TRACKS } from './fixtures.js'
import { parseAllowList, parsePlan, parseTracks } from '../src/core/parse.ts'
import { Agents, Turns } from '../src/state.js'
import { addedPaths, commitCheck, commitShaOf, stagedFiles } from '../src/commit.js'
import { prepareDecision } from '../src/guard.js'
import { postCommitListener, preExecuteListener } from '../src/hooks.js'
import { commitReminder } from '../src/core/guards.ts'

const tracks = parseTracks(TRACKS)
const AGENT = { id: 'agent-1', session: { id: 'agent-1' } }

/** The plan with no task in progress. */
const NO_TASK_PLAN = `# Implementation Plan: DSH measure guard

## Phase 2: Adapter

- [ ] Task: Guard the writes
- [ ] Task: Ship the docs
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

/** An io whose git seam answers the staged list and the status lines. */
const ioOf = ({ staged = [], status = [] } = {}) => ({
  async resolve(path, options = {}) {
    return path.startsWith('/') ? path : `${options.cwd ?? '/repo'}/${path}`
  },
  async exists() {
    return false
  },
  async readText() {
    return ''
  },
  async gitLines(args) {
    if (args[0] === 'diff') return staged
    if (args[0] === 'status') return status
    return []
  },
})

const depsOf = ({ mode = 'strict', plan = PLAN, io = ioOf(), guardsOff = null } = {}) => {
  const snapshot = snapshotOf(plan)
  const state = { agents: new Agents(), turns: new Turns(), bypass: { async get() { return guardsOff } } }
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
    dirOf() {
      return '/repo'
    },
    async refreshSnapshot() {
      return snapshot
    },
  }
}

/** The guard context the commit seam reads. */
const contextOf = (deps, plan = PLAN) => ({
  snapshot: snapshotOf(plan),
  mode: deps.mode,
  setupChoice: null,
  guardsOff: null,
})

const shellMutation = command => ({ kind: 'shell', command })

const execOf = (command, token = 't1') => ({ name: 'bash', agent: AGENT, arguments: { command }, token })

// ---- the seam --------------------------------------------------------------

test('commitShaOf reads the short SHA of a commit line', () => {
  assert.equal(commitShaOf('[main 1baeb84] feat(dsh): Enforce Red'), '1baeb84')
  assert.equal(commitShaOf('some output\n[feat/x abcdef0] message'), 'abcdef0')
  assert.equal(commitShaOf('no commit here'), null)
})

test('stagedFiles adds the tracked changes for -a, and added paths exactly', async () => {
  const deps = depsOf({ io: ioOf({ staged: ['src/app.js'], status: [' M measure/tracks.md', '?? notes.md'] }) })
  assert.deepEqual(await stagedFiles(deps, '/repo', false), ['src/app.js', ...[]])
  assert.deepEqual(await stagedFiles(deps, '/repo', true), ['src/app.js', 'measure/tracks.md'])
  assert.deepEqual(await stagedFiles(deps, '/repo', false, { all: false, paths: ['notes.md'] }), ['src/app.js', 'notes.md'])
  assert.deepEqual(await stagedFiles(deps, '/repo', false, { all: true, paths: [] }), ['src/app.js', 'measure/tracks.md', 'notes.md'])
})

// ---- the strict decision ---------------------------------------------------

test('a commit message off the format is denied with the core text', async () => {
  const deps = depsOf()
  const check = await commitCheck(deps, contextOf(deps), 'git commit -m "fix stuff"')
  assert.notEqual(check.decision, null)
  assert.match(check.decision.deny, /is not in the format <type>\(<scope>\): <description>/)
  assert.equal(check.commitDue, false)
})

test('an unreadable commit message is allowed with a format note', async () => {
  const deps = depsOf()
  const check = await commitCheck(deps, contextOf(deps), 'git commit -F msg.txt')
  assert.equal(check.decision, null)
  assert.match(check.note, /could not read the commit message/)
  assert.equal(check.commitDue, true)
})

test('a no-task commit of files outside measure/ is denied and names them', async () => {
  const deps = depsOf({ plan: NO_TASK_PLAN, io: ioOf({ staged: ['src/app.js', 'README.md'] }) })
  const check = await commitCheck(deps, contextOf(deps, NO_TASK_PLAN), 'git commit -m "feat(app): Add the app"')
  assert.notEqual(check.decision, null)
  assert.match(check.decision.deny, /no task is in progress/)
  assert.match(check.decision.deny, /src\/app\.js/)
})

test('a no-task commit of only measure/ files is allowed with no reminder', async () => {
  const deps = depsOf({ plan: NO_TASK_PLAN, io: ioOf({ staged: ['measure/tracks.md'] }) })
  const check = await commitCheck(deps, contextOf(deps, NO_TASK_PLAN), 'git commit -m "measure(plan): Mark the task"')
  assert.equal(check.decision, null)
  assert.equal(check.commitDue, false)
})

test('a commit with -a takes the modified tracked paths and not untracked files', async () => {
  const deps = depsOf({ plan: NO_TASK_PLAN, io: ioOf({ staged: [], status: [' M src/app.js', '?? notes.md'] }) })
  const check = await commitCheck(deps, contextOf(deps, NO_TASK_PLAN), 'git commit -am "feat(app): Add the app"')
  assert.notEqual(check.decision, null)
  assert.match(check.decision.deny, /src\/app\.js/)
  assert.doesNotMatch(check.decision.deny, /notes\.md/)

  const onlyUntracked = depsOf({ plan: NO_TASK_PLAN, io: ioOf({ staged: [], status: ['?? notes.md'] }) })
  const allowed = await commitCheck(onlyUntracked, contextOf(onlyUntracked, NO_TASK_PLAN), 'git commit -am "measure(plan): Mark"')
  assert.equal(allowed.decision, null)
})

test('an in-command git add contributes exactly its paths', async () => {
  const io = ioOf({ staged: [], status: [' M src/app.js', '?? notes.md'] })
  const deps = depsOf({ plan: NO_TASK_PLAN, io })
  const check = await commitCheck(deps, contextOf(deps, NO_TASK_PLAN), 'git add src/app.js && git commit -m "feat(app): Add the app"')
  assert.notEqual(check.decision, null)
  assert.match(check.decision.deny, /src\/app\.js/)
  assert.doesNotMatch(check.decision.deny, /notes\.md/)

  const others = depsOf({ plan: NO_TASK_PLAN, io })
  const allowed = await commitCheck(others, contextOf(others, NO_TASK_PLAN), 'git add measure/tracks.md && git commit -m "measure(plan): Mark"')
  assert.equal(allowed.decision, null)
})

test('addedPaths reads every git add segment', async () => {
  assert.deepEqual(addedPaths('git add src/app.js && git commit -m "feat(app): X"'), { all: false, trackedOnly: false, paths: ['src/app.js'] })
  assert.deepEqual(addedPaths('git add . && git commit -m "x"'), { all: true, trackedOnly: false, paths: [] })
  assert.deepEqual(addedPaths('git add -A && git commit -m "x"'), { all: true, trackedOnly: false, paths: [] })
  assert.deepEqual(addedPaths('git add -u && git commit -m "x"'), { all: false, trackedOnly: true, paths: [] })
  assert.deepEqual(addedPaths('git commit -m "x"'), { all: false, trackedOnly: false, paths: [] })
})

test('the commit guard is inert outside strict mode', async () => {
  const deps = depsOf({ mode: 'guard' })
  const decision = await prepareDecision(deps, { name: 'bash', agent: AGENT, arguments: { command: 'git commit -m "fix stuff"' } })
  assert.equal(decision.denial, undefined)
})

test('prepareDecision denies a bad commit and marks a good commit for the reminder', async () => {
  const bad = depsOf()
  const denied = await prepareDecision(bad, { name: 'bash', agent: AGENT, arguments: { command: 'git commit -m "fix stuff"' } })
  assert.match(denied.denial ?? '', /not in the format/)

  const good = depsOf({ io: ioOf({ staged: ['measure/tracks.md'] }) })
  const allowed = await prepareDecision(good, { name: 'bash', agent: AGENT, arguments: { command: 'git commit -m "measure(plan): Mark the task"' } })
  assert.equal(allowed.denial, undefined)
  assert.equal(allowed.commitDue, true)
})

// ---- the pre/post wiring ---------------------------------------------------

/** A minimal waterfall exec for the two listeners. */
const waterfallOf = { async next() { return { kind: 'accept', content: [{ type: 'text', text: '[main 1baeb84] feat(dsh): Done' }] } } }

test('preExecuteListener records the commit-due token only for an allowed commit', async () => {
  const decisions = new Map()
  const notes = new Map()
  const commitDue = new Set()
  const listener = preExecuteListener({ decide: async () => ({ denial: undefined, note: null, commitDue: true }) }, decisions, notes, commitDue)
  await listener({ token: 'allow-1', agent: AGENT }, async () => ({ kind: 'allow' }))
  assert.equal(commitDue.has('allow-1'), true)

  const denied = preExecuteListener({ decide: async () => ({ denial: 'nope', note: null, commitDue: true }) }, decisions, notes, commitDue)
  await denied({ token: 'deny-1', agent: AGENT }, async () => ({ kind: 'allow' }))
  assert.equal(commitDue.has('deny-1'), false)
})

test('postCommitListener appends the reminder from the result and drops the token', async () => {
  const commitDue = new Set(['t1'])
  const listener = postCommitListener(commitDue)
  const decision = await listener({ token: 't1' }, { isError: false, content: [{ type: 'text', text: '[main 1baeb84] feat(dsh): Done' }] }, waterfallOf.next)
  const text = decision.content.map(part => part.text).join('\n')
  assert.match(text, /git notes add/)
  assert.match(text, /1baeb84/)
  assert.equal(commitDue.has('t1'), false)
})

test('postCommitListener leaves a failed commit alone and drops its token', async () => {
  const commitDue = new Set(['t1'])
  const listener = postCommitListener(commitDue)
  const decision = await listener({ token: 't1' }, { isError: true, content: [] }, waterfallOf.next)
  assert.deepEqual(decision.content, [{ type: 'text', text: '[main 1baeb84] feat(dsh): Done' }])
  assert.equal(commitDue.has('t1'), false)
})

test('the reminder text is the shared core commitment', () => {
  assert.match(commitReminder('1baeb84'), /git notes add/)
})

test('git add -A contributes every status path and -u only the tracked ones', async () => {
  const io = ioOf({ staged: [], status: [' M src/app.js', '?? notes.md'] })
  const allDeps = depsOf({ plan: NO_TASK_PLAN, io })
  const all = await commitCheck(allDeps, contextOf(allDeps, NO_TASK_PLAN), 'git add -A && git commit -m "feat(app): Add"')
  assert.match(all.decision.deny, /notes\.md/)

  const trackedDeps = depsOf({ plan: NO_TASK_PLAN, io })
  const tracked = await commitCheck(trackedDeps, contextOf(trackedDeps, NO_TASK_PLAN), 'git add -u && git commit -m "feat(app): Add"')
  assert.match(tracked.decision.deny, /src\/app\.js/)
  assert.doesNotMatch(tracked.decision.deny, /notes\.md/)
})

// ---- quoted and escaped git add arguments (dsh_measure_add_quoting_20261107)

test('addedPaths keeps a quoted path with spaces exact', () => {
  assert.deepEqual(addedPaths('git add "src/a b.ts" && git commit -m "feat(a): B"'), {
    all: false,
    trackedOnly: false,
    paths: ['src/a b.ts'],
  })
  assert.deepEqual(addedPaths("git add 'docs/x y.md' && git commit -m 'docs: Y'"), {
    all: false,
    trackedOnly: false,
    paths: ['docs/x y.md'],
  })
})

test('addedPaths treats words after -- as paths even when they start with -', () => {
  assert.deepEqual(addedPaths('git add -- -x.ts && git commit -m "fix(X): Z"'), {
    all: false,
    trackedOnly: false,
    paths: ['-x.ts'],
  })
  assert.deepEqual(addedPaths('git add -u "src/a b.ts" && git commit -m "fix: Y"'), {
    all: false,
    trackedOnly: true,
    paths: ['src/a b.ts'],
  })
})

test('addedPaths ignores a trailing comment and fails closed on an unterminated quote', () => {
  assert.deepEqual(addedPaths('git add src/a.ts # not a path && git commit -m "x"'), {
    all: false,
    trackedOnly: false,
    paths: ['src/a.ts'],
  })
  assert.deepEqual(addedPaths('git add "src/half.ts && git commit -m "x"'), {
    all: true,
    trackedOnly: false,
    paths: [],
  })
})

// ---- whole-command token scan (dsh_measure_add_quoting_followup_20261107)

test('addedPaths follows a backslash-newline continuation', () => {
  const command = 'git add measure/a.ts \\\nsrc/new.ts && git commit -m "fix(a): A"'
  assert.deepEqual(addedPaths(command), {
    all: false,
    trackedOnly: false,
    paths: ['measure/a.ts', 'src/new.ts'],
  })
})

test('addedPaths keeps a quoted separator inside one path', () => {
  assert.deepEqual(addedPaths('git add "a;b.ts" && git commit -m "fix(a): A"'), {
    all: false,
    trackedOnly: false,
    paths: ['a;b.ts'],
  })
})

test('addedPaths handles a real trailing comment and a quoted wildcard', () => {
  assert.deepEqual(addedPaths('git add src/a.ts # note'), {
    all: false,
    trackedOnly: false,
    paths: ['src/a.ts'],
  })
  assert.deepEqual(addedPaths('git add "a*b.ts" && git commit -m "fix(a): A"'), {
    all: true,
    trackedOnly: false,
    paths: [],
  })
})
