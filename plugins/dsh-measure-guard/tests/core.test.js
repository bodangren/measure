// The shared core on the fixture project, plus the package entry smoke test.
// parse.ts and guards.ts are copies of the Claude Code mod's pure modules; the
// parity gate is scripts/check-parity.sh, run by `node --run test`.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ALLOW, PLAN, TRACKS, TRACK_ID, cleanupRepo, makeRepo } from './fixtures.js'
import {
  bandLine,
  blockedCount,
  currentTask,
  nextTask,
  parseAllowList,
  parsePlan,
  parseTracks,
  position,
  statusLines,
} from '../src/core/parse.ts'
import { editDecision, isTestCommand, isTestFile } from '../src/core/guards.ts'

const ROOT = '/repo'

/** The snapshot the adapter builds from the fixture texts. */
const snapshotOf = (planText = PLAN) => {
  const tracks = parseTracks(TRACKS)
  const plan = parsePlan(planText)
  const entry = tracks[0]
  return {
    root: ROOT,
    hasMeasure: true,
    isRepo: true,
    tracksPath: `${ROOT}/measure/tracks.md`,
    tracks,
    active: {
      entry,
      planPath: `${ROOT}/measure/tracks/${entry.id}/plan.md`,
      plan,
    },
    inProgressCount: 1,
    parseError: null,
    allow: parseAllowList(ALLOW),
  }
}

const contextOf = (planText = PLAN, mode = 'guard') => ({
  snapshot: snapshotOf(planText),
  mode,
  setupChoice: null,
  guardsOff: null,
})

test('parseTracks reads the bold-with-link and the linked entry formats', () => {
  const tracks = parseTracks(TRACKS)
  assert.equal(tracks.length, 2)
  assert.deepEqual(tracks.map(track => track.id), [TRACK_ID, 'old_linked_20260101'])
  assert.deepEqual(tracks.map(track => track.marker), ['~', 'x'])
  assert.equal(tracks[0].folder, `tracks/${TRACK_ID}`)
})

test('parsePlan finds two phases, the checkpoint, and every task', () => {
  const plan = parsePlan(PLAN)
  assert.equal(plan.phases.length, 2)
  const [first, second] = plan.phases
  assert.equal(first.title, 'Phase 1: Skeleton')
  assert.equal(first.checkpoint, 'abcdef0')
  assert.equal(first.tasks.length, 1)
  assert.equal(first.tasks[0].marker, 'x')
  assert.equal(first.tasks[0].sha, 'abcdef0')
  assert.deepEqual(second.tasks.map(task => task.marker), ['~', ' ', 'b'])
  assert.equal(second.checkpoint, null)
})

test('currentTask, nextTask, and position follow the markers', () => {
  const plan = parsePlan(PLAN)
  assert.equal(currentTask(plan).text, 'Task: Guard the edits')
  assert.equal(nextTask(plan).text, 'Task: Ship the docs')
  const at = position(plan)
  assert.equal(at.phase, 2)
  assert.equal(at.phases, 2)
  assert.equal(at.task, 1)
  assert.equal(at.tasks, 3)
  assert.equal(at.current.text, 'Task: Guard the edits')
  assert.equal(blockedCount(plan), 1)
})

test('bandLine names the active track, the position, and the [b] count', () => {
  assert.equal(
    bandLine(snapshotOf(), null),
    'Measure · DSH measure guard · Phase 2/2 · Task 1/3 [~] Task: Guard the edits · [b] 1',
  )
})

test('statusLines lists the tracks, the plan, the blocked task, and the allow list', () => {
  const text = statusLines(snapshotOf(), null).join('\n')
  assert.match(text, /Tracks:/)
  assert.match(text, /\[~\] DSH measure guard \(tracks\/dsh_measure_guard_20261107\) · active/)
  assert.match(text, /Active plan: measure\/tracks\/dsh_measure_guard_20261107\/plan\.md/)
  assert.match(text, /Phase 1: Skeleton · 1\/1 closed · checkpoint abcdef0/)
  assert.match(text, /Phase 2: Adapter · 0\/3 closed/)
  assert.match(text, /Blocked tasks \(\[b\]\):/)
  assert.match(text, /\[b\] Task: Human review \(open: no deferred:<owner>\)/)
  assert.match(text, /Allow list \(measure\/guard-allow\): docs\//)
  assert.match(text, /ignored line 3: \.\.\/outside\/ \(has a \.\. segment\)/)
  assert.match(text, /Guards: on/)
})

test('editDecision denies a write outside measure/ when no task is [~]', () => {
  const idle = PLAN.replace('- [~] Task: Guard the edits', '- [ ] Task: Guard the edits')
  const decision = editDecision(contextOf(idle), `${ROOT}/src/app.js`)
  assert.ok(decision !== null, 'the write must be denied')
  assert.match(decision.deny, /no task in the track "DSH measure guard" is in progress/)
  assert.match(decision.deny, /Task: Guard the edits/)
})

test('editDecision allows the same write while a task is [~]', () => {
  assert.equal(editDecision(contextOf(), `${ROOT}/src/app.js`), null)
})

test('editDecision always allows a write inside measure/', () => {
  const idle = PLAN.replace('- [~] Task: Guard the edits', '- [ ] Task: Guard the edits')
  assert.equal(editDecision(contextOf(idle), `${ROOT}/measure/tracks.md`), null)
})

test('parseAllowList keeps one folder and reports the ignored entry', () => {
  const allow = parseAllowList(ALLOW)
  assert.deepEqual(allow.folders, ['docs'])
  assert.deepEqual(allow.ignored, [{ line: 3, text: '../outside/', reason: 'has a .. segment' }])
})

test('parseAllowList dedupes in linear time and keeps first-seen order', () => {
  const allow = parseAllowList('src/\nsrc/\n./src/\ndocs/\nsrc/')
  assert.deepEqual(allow.folders, ['src', 'docs'])
  assert.deepEqual(allow.ignored, [])
})

test('parseAllowList ignores an entry with a control character', () => {
  const allow = parseAllowList('docs/\nbi\u0000nary/')
  assert.deepEqual(allow.folders, ['docs'])
  assert.equal(allow.ignored.length, 1)
  assert.equal(allow.ignored[0].reason, 'has a control character')
})

test('parseAllowList keeps every folder of a wide list', () => {
  const text = Array.from({ length: 2000 }, (_, i) => `dir${i}/`).join('\n')
  assert.equal(parseAllowList(text).folders.length, 2000)
})

test('the package entry exposes name, inject, and apply', async () => {
  const plugin = await import('../index.js')
  assert.equal(plugin.name, 'measure-guard')
  assert.deepEqual(plugin.inject, [
    'tools',
    'agents',
    'commands',
    'systemPrompt',
    'workingDirectory',
    'fs',
    'subprocess',
    'sessions',
    'webServer',
  ])
  assert.equal(typeof plugin.apply, 'function')
})

test('the TDD name rules cover nested test directories and the node --test runner', () => {
  for (const path of [
    'tests/x.py',
    'tests/unit/x.py',
    'src/__tests__/deep/x.ts',
    'plugins/a/tests/deep/y.js',
    'src/app.test.ts',
  ]) {
    assert.equal(isTestFile(path), true, path)
  }
  for (const path of ['tests/README.md', 'src/app.js', 'docs/spec/guide.md']) {
    assert.equal(isTestFile(path), false, path)
  }
  for (const command of [
    'node --test tests/*.test.js',
    'node --experimental-strip-types --test x.ts',
    'node --test-only x.ts',
    'npm test',
    'pytest -q',
  ]) {
    assert.equal(isTestCommand(command), true, command)
  }
  for (const command of ['node -e "run()"', 'node script.js', 'git status --short']) {
    assert.equal(isTestCommand(command), false, command)
  }
})

test('makeRepo writes the fixture into a temporary measure/ tree', async () => {
  const root = await makeRepo()
  try {
    const tracks = await readFile(join(root, 'measure/tracks.md'), 'utf8')
    const plan = await readFile(join(root, `measure/tracks/${TRACK_ID}/plan.md`), 'utf8')
    assert.equal(tracks, TRACKS)
    assert.equal(plan, PLAN)
  } finally {
    await cleanupRepo(root)
    await assert.rejects(readFile(join(root, 'measure/tracks.md'), 'utf8'))
  }
})
