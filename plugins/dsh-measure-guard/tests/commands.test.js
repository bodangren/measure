// The three host commands: measure-off, measure-on, measure-status. The handler
// returns { kind: 'success', text } and the scope grammar is the OpenCode one.
import test from 'node:test'
import assert from 'node:assert/strict'

import { ALLOW, PLAN, TRACK_ID, TRACKS } from './fixtures.js'
import { parseAllowList, parsePlan, parseTracks } from '../src/core/parse.ts'
import { Agents, Bypass, Turns } from '../src/state.js'
import { measureCommands, offText, onText, scopeOf } from '../src/commands.js'

const tracks = parseTracks(TRACKS)

const snapshotOf = (overrides = {}) => ({
  root: '/repo',
  hasMeasure: true,
  isRepo: true,
  tracksPath: '/repo/measure/tracks.md',
  tracks,
  active: {
    entry: tracks[0],
    planPath: `/repo/measure/tracks/${TRACK_ID}/plan.md`,
    plan: parsePlan(PLAN),
  },
  inProgressCount: 1,
  parseError: null,
  allow: parseAllowList(ALLOW),
  ...overrides,
})

/** A repository config fake: no disk writes, the same async API. */
const memoryRepos = () => {
  const off = new Set()
  const modes = new Map()
  return {
    async modeOf(root) {
      return modes.get(root) ?? null
    },
    async setMode(root, mode) {
      if (mode === null) modes.delete(root)
      else modes.set(root, mode)
    },
    async isOff(root) {
      return off.has(root)
    },
    async setOff(root, on) {
      if (on) off.add(root)
      else off.delete(root)
    },
  }
}

const depsOf = ({ mode = 'guard', snapshot = snapshotOf() } = {}) => {
  const repos = memoryRepos()
  const state = { repos, agents: new Agents(), turns: new Turns(), bypass: new Bypass(repos) }
  let refreshes = 0
  const deps = {
    mode,
    state,
    snapshots: { invalidate() {}, async get() {} },
    async rootOf() {
      return '/repo'
    },
    async refreshSnapshot() {
      refreshes += 1
      return snapshot
    },
    refreshes: () => refreshes,
  }
  return deps
}

const invocationOf = (rawInput = '', agent = { id: 'agent-1' }) => ({
  commandId: 'command-1',
  agent,
  rawInput,
  attachments: [],
  signal: new AbortController().signal,
})

const commandOf = (commands, name) => commands.find(command => command.name === name)

test('the host commands have the expected names and descriptions', () => {
  const commands = measureCommands(depsOf())
  assert.deepEqual(commands.map(command => command.name), ['measure-off', 'measure-on', 'measure-status', 'measure-goal', 'measure-mode'])
  for (const command of commands) assert.equal(typeof command.handler, 'function')
  assert.equal(typeof commandOf(commands, 'measure-off').description, 'string')
  assert.match(commandOf(commands, 'measure-off').description, /this session/)
  assert.match(commandOf(commands, 'measure-off').description, /repo/)
  assert.match(commandOf(commands, 'measure-status').description, /Measure position/)
})

test('scopeOf reads repo from the first token and defaults to session', () => {
  assert.equal(scopeOf(''), 'session')
  assert.equal(scopeOf('repo'), 'repo')
  assert.equal(scopeOf('  repo  '), 'repo')
  assert.equal(scopeOf('repo extra words'), 'repo')
  assert.equal(scopeOf('something'), 'session')
  assert.equal(scopeOf('session'), 'session')
})

test('/measure-off turns the guards off for the session, and /measure-on turns them on again', async () => {
  const deps = depsOf()
  const off = commandOf(measureCommands(deps), 'measure-off')
  const on = commandOf(measureCommands(deps), 'measure-on')

  const offResult = await off.handler(invocationOf(''))
  assert.deepEqual(offResult, { kind: 'success', text: offText('session') })
  assert.equal(offResult.text, 'measure-guard: the guards are off for this session. /measure-on turns them on.')
  assert.equal(await deps.state.bypass.get('/repo'), 'session')

  const onResult = await on.handler(invocationOf(''))
  assert.deepEqual(onResult, { kind: 'success', text: onText('session', true) })
  assert.equal(onResult.text, 'measure-guard: the guards are on again for this session.')
  assert.equal(await deps.state.bypass.get('/repo'), null)

  const again = await on.handler(invocationOf(''))
  assert.equal(again.text, 'measure-guard: the guards were not off for this session; nothing changed.')
})

test('/measure-off repo and /measure-on repo use the repository scope', async () => {
  const deps = depsOf()
  const off = commandOf(measureCommands(deps), 'measure-off')
  const on = commandOf(measureCommands(deps), 'measure-on')

  const offResult = await off.handler(invocationOf(' repo'))
  assert.equal(offResult.text, 'measure-guard: the guards are off for this repository. /measure-on repo turns them on.')
  assert.equal(await deps.state.bypass.get('/repo'), 'repo')
  assert.equal(await deps.state.repos.isOff('/repo'), true)

  const onResult = await on.handler(invocationOf('repo'))
  assert.equal(onResult.text, 'measure-guard: the guards are on again for this repository.')
  assert.equal(await deps.state.repos.isOff('/repo'), false)

  // The repository bypass wins over the session bypass.
  await deps.state.bypass.set('/repo', 'session')
  await deps.state.bypass.set('/repo', 'repo')
  assert.equal(await deps.state.bypass.get('/repo'), 'repo')
})

test('an unknown argument defaults to the session scope', async () => {
  const deps = depsOf()
  const off = commandOf(measureCommands(deps), 'measure-off')
  const result = await off.handler(invocationOf('please'))
  assert.equal(result.text, offText('session'))
  assert.equal(await deps.state.repos.isOff('/repo'), false)
  assert.equal(await deps.state.bypass.get('/repo'), 'session')
})

test('/measure-status refreshes the snapshot and returns the status text', async () => {
  const deps = depsOf()
  const status = commandOf(measureCommands(deps), 'measure-status')
  const result = await status.handler(invocationOf(''))

  assert.equal(result.kind, 'success')
  assert.equal(deps.refreshes(), 1)
  assert.match(result.text, /Tracks:/)
  assert.match(result.text, /Active plan: measure\/tracks\/dsh_measure_guard_20261107\/plan\.md/)
  assert.match(result.text, /\[b\] Task: Human review/)
  assert.match(result.text, /Guards: on/)
  assert.match(result.text, /measure-guard \(Mode: guard\)/)
})

test('/measure-status shows the bypass state', async () => {
  const deps = depsOf()
  await deps.state.bypass.set('/repo', 'repo')
  const status = commandOf(measureCommands(deps), 'measure-status')
  const result = await status.handler(invocationOf(''))
  assert.match(result.text, /Guards: off for this repository/)
})

test('offText and onText cover both scopes', () => {
  assert.match(offText('repo'), /this repository/)
  assert.match(offText('session'), /this session/)
  assert.match(onText('repo', true), /on again for this repository/)
  assert.match(onText('session', true), /on again for this session/)
  assert.match(onText('repo', false), /were not off for this repository/)
  assert.match(onText('session', false), /were not off for this session/)
})
