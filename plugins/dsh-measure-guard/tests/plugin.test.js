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
const ctxOf = ({ agents = [] } = {}) => {
  const tools = []
  const commands = []
  const listeners = new Map()
  return {
    tools: { register: definition => (tools.push(definition), () => {}) },
    commands: { register: definition => (commands.push(definition), () => {}) },
    agents: { list: () => agents, get: id => agents.find(agent => agent.id === id) },
    workingDirectory: { get: () => '/repo' },
    fs: {
      resolve: async path => ({ targetKey: path, displayPath: path }),
      readText: async () => '',
      stat: async () => undefined,
    },
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

test('apply registers measure_status, the three commands, and the lifecycle listeners', async () => {
  const plugin = await import('../index.js')
  assert.equal(plugin.name, 'measure-guard')
  assert.equal(plugin.inject.includes('tools'), true)
  assert.equal(plugin.inject.includes('agents'), true)
  assert.equal(plugin.inject.includes('commands'), true)

  const ctx = ctxOf()
  apply(ctx, { mode: 'strict' })
  await settle()

  assert.equal(ctx.toolsList.length, 1)
  assert.equal(ctx.toolsList[0].name, 'measure_status')
  assert.deepEqual(
    ctx.commandsList.map(command => command.name),
    ['measure-off', 'measure-on', 'measure-status'],
  )
  assert.ok(ctx.listeners.has('agent/created'))
  assert.ok(ctx.listeners.has('agent/disposed'))
  // Session events are handled only by the per-agent listeners: a global one
  // would double-handle every event and would not know the agent's root.
  assert.equal(ctx.listeners.has('session/event'), false)
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
