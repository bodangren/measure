// The package entry: apply() registers the context layer with no DSH runtime
// behind it (fake ctx services), and attaches the existing agents.
import test from 'node:test'
import assert from 'node:assert/strict'

import { apply, inject, name } from '../index.js'

/** A fake agent with an agent-scoped ctx. */
const agentOf = id => {
  const listeners = new Map()
  const sections = []
  return {
    id,
    session: { id },
    listeners,
    sections,
    injected: [],
    ctx: {
      systemPrompt: {
        section(section) {
          sections.push(section)
          return () => {}
        },
      },
      on(listenerName, handler) {
        listeners.set(listenerName, handler)
        return () => listeners.delete(listenerName)
      },
    },
    inject(message) {
      this.injected.push(message)
    },
  }
}

/** The fake host services apply() touches in Phase 2. */
const ctxOf = ({ agents = [], roots = agents } = {}) => {
  const tools = []
  const commands = []
  const listeners = new Map()
  return {
    tools: { register: definition => (tools.push(definition), () => {}) },
    commands: { register: definition => (commands.push(definition), () => {}) },
    agents: { list: () => agents, get: id => agents.find(agent => agent.id === id), roots: () => roots },
    workingDirectory: { get: () => '/repo' },
    fs: {
      resolve: async path => ({ targetKey: path, displayPath: path }),
      readText: async () => '',
      stat: async () => undefined,
    },
    webServer: { register: () => () => {} },
    subprocess: {
      resolveExecutable: async () => '/usr/bin/git',
      spawn: () => ({
        done: Promise.resolve({ exitCode: 1 }),
        collected: { stdout: { readFrom: () => ({ text: '' }) } },
      }),
    },
    effect(create) {
      return create()
    },
    on(eventName, handler) {
      listeners.set(eventName, handler)
      return () => {}
    },
    toolsList: tools,
    commandsList: commands,
    listeners,
  }
}

const settle = () => new Promise(resolve => setTimeout(resolve, 25))

/** The text of a user message the plugin injected or steered. */
const textOf = message => (message?.content ?? []).map(part => part?.text ?? '').join('')

test('apply registers measure_status, measure_verify, measure_mode, the eleven commands, and the lifecycle listeners', async () => {
  const plugin = await import('../index.js')
  assert.equal(plugin.name, 'measure-guard')
  assert.equal(plugin.inject.includes('tools'), true)
  assert.equal(plugin.inject.includes('agents'), true)
  assert.equal(plugin.inject.includes('commands'), true)

  const ctx = ctxOf()
  apply(ctx, { mode: 'strict' })
  await settle()

  assert.deepEqual(
    ctx.toolsList.map(tool => tool.name),
    ['measure_status', 'measure_verify', 'measure_mode'],
  )
  // The agent tool surface is read-only: no tool takes a parameter, so an agent cannot
  // set the guard mode (the accepted-risk row records why a mode setter is not given to
  // the guarded party). Adding one turns this gate red and needs a design decision.
  for (const tool of ctx.toolsList) {
    assert.deepEqual(Object.keys(tool.parameters?.properties ?? {}), [], `${tool.name} takes no parameter`)
  }
  const names = ctx.commandsList.map(command => command.name)
  assert.deepEqual(names, [
    'measure-off',
    'measure-on',
    'measure-status',
    'measure-goal',
    'measure-mode',
    'measure-verify',
    'measure-setup',
    'measure-new-track',
    'measure-new-track-set',
    'measure-implement',
    'measure-review',
    'measure-revert',
    'measure-doctor',
    'measure-orchestrate',
  ])
  assert.equal(new Set(names).size, names.length)
  for (const command of ctx.commandsList) {
    assert.equal(typeof command.description, 'string')
    assert.ok(command.description.trim().length > 0, `${command.name} has no description`)
    assert.equal(typeof command.handler, 'function')
  }
  assert.ok(ctx.listeners.has('agent/created'))
  assert.ok(ctx.listeners.has('agent/disposed'))
  // Session events are handled only by the per-agent listeners: a global one
  // would double-handle every event and would not know the agent's root.
  assert.equal(ctx.listeners.has('session/event'), false)
})

test('tools/result invalidates the snapshot only for a mutating tool', async () => {
  const { Snapshots } = await import('../src/snapshot.js')
  const original = Snapshots.prototype.invalidateAll
  let calls = 0
  Snapshots.prototype.invalidateAll = function patched() {
    calls += 1
    return original.apply(this, arguments)
  }
  try {
    const ctx = ctxOf()
    apply(ctx, { mode: 'guard' })
    await settle()
    const listener = ctx.listeners.get('tools/result')
    listener({ name: 'read', token: 't-read', arguments: {} }, {})
    await settle()
    assert.equal(calls, 0, 'a read result must not invalidate')
    listener({ name: 'bash', token: 't-bash', arguments: {} }, {})
    await settle()
    assert.ok(calls >= 1, 'a bash result must invalidate')
  } finally {
    Snapshots.prototype.invalidateAll = original
  }
})

test('apply attaches every existing agent and disposes it on agent/disposed', async () => {
  const agent = agentOf('agent-1')
  const ctx = ctxOf({ agents: [agent] })
  apply(ctx, { mode: 'guard' })
  await settle()

  assert.ok(agent.listeners.has('agent/pre-step'))
  assert.ok(agent.listeners.has('agent/turn-stopping'))
  assert.ok(agent.listeners.has('session/event'))
  assert.equal(agent.sections.length, 0) // the fake io reports no measure/

  ctx.listeners.get('agent/disposed')({ agent })
  assert.equal(agent.listeners.size, 0)
})

test('a new agent is attached on agent/created and its session events are filtered', async () => {
  const ctx = ctxOf()
  apply(ctx, { mode: 'guard' })
  const agent = agentOf('agent-2')
  ctx.listeners.get('agent/created')({ agent })
  await settle()

  assert.ok(agent.listeners.has('agent/pre-step'))
  const sessionEvent = agent.listeners.get('session/event')
  assert.doesNotThrow(() => sessionEvent({ id: 'other' }, { type: 'turn/end', data: { turn: 1 } }))
})

test('an unknown mode falls back to guard with one warning', async () => {
  const warnings = []
  const original = console.warn
  console.warn = (...args) => warnings.push(args.join(' '))
  try {
    apply(ctxOf(), { mode: 'nonsense' })
  } finally {
    console.warn = original
  }
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /unknown mode/)
  assert.match(warnings[0], /guard/)
})

test('the module imports only local modules and Node built-ins', async () => {
  const source = await (await import('node:fs/promises')).readFile(new URL('../index.js', import.meta.url), 'utf8')
  const specifiers = [...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map(match => match[1])
  assert.ok(specifiers.length > 0)
  assert.equal(specifiers.some(specifier => specifier.startsWith('@deepseek-ai/')), false)
  for (const specifier of specifiers) {
    assert.ok(
      specifier.startsWith('node:') || specifier.startsWith('./') || specifier.startsWith('../'),
      `unexpected import ${specifier}`,
    )
  }
  assert.ok(specifiers.some(specifier => specifier.startsWith('./src/')))
})

test('one root and its child are one session: no second-writer note', async () => {
  const root = agentOf('root-1')
  const child = agentOf('child-1')
  const ctx = ctxOf({ agents: [root, child], roots: [root] })
  apply(ctx, { mode: 'guard' })
  await settle()

  assert.equal(root.injected.length, 0)
  assert.equal(child.injected.length, 0)
  // The child still inherits the guard layer.
  assert.ok(child.listeners.has('agent/pre-step'))
  assert.ok(child.listeners.has('agent/turn-stopping'))
})

test('two root sessions get exactly one second-writer note naming both', async () => {
  const first = agentOf('root-1')
  const second = agentOf('root-2')
  const ctx = ctxOf({ agents: [first, second], roots: [first, second] })
  apply(ctx, { mode: 'guard' })
  await settle()

  const injected = [...first.injected, ...second.injected]
  assert.equal(injected.length, 1)
  assert.match(textOf(injected[0]), /2 sessions are working in this git worktree/)
})

test('the goal service is read per call, so a later registration is seen', async () => {
  const ctx = ctxOf()
  let service
  ctx.get = name => (name === 'goals' ? service : undefined)
  apply(ctx, { mode: 'guard' })
  await settle()

  const goalCommand = ctx.commandsList.find(command => command.name === 'measure-goal')
  const before = await goalCommand.handler({ agent: agentOf('agent-1'), rawInput: '' })
  assert.match(before.text, /has no goal service/)

  service = { get: () => null, create: (_agent, request) => ({ ...request, phase: 'active', roundsStarted: 0, maxGoalRounds: 256 }) }
  const after = await goalCommand.handler({ agent: agentOf('agent-1'), rawInput: '' })
  assert.doesNotMatch(after.text, /has no goal service/)
  assert.match(after.text, /no Measure track is in progress/)
})
