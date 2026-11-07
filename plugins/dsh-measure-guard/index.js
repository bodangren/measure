// The Host half of dsh-measure-guard: one plugin instance owns the state, the
// snapshot cache, the I/O seam, and the root writers; apply() only registers.
// The module imports no Harness package: every capability comes from ctx
// (design §2).
import { homedir } from 'node:os'

import { parseModeOf, createState } from './src/state.js'
import { Snapshots, canonicalRoot, gitStatus, makeIo } from './src/snapshot.js'
import { RootWriters } from './src/roots.js'
import { attachAgent } from './src/context.js'
import { measureStatusTool } from './src/status.js'
import { measureCommands } from './src/commands.js'
import { measureWorkflowCommands } from './src/workflow.js'
import { createDecisions, installToolGuard, postExecuteListener, preExecuteListener } from './src/hooks.js'
import { onTurnStopping, prepareDecision } from './src/guard.js'
import { registerClientState } from './src/client-state.js'

export const name = 'measure-guard'

export const inject = [
  'tools',
  'agents',
  'commands',
  'systemPrompt',
  'workingDirectory',
  'fs',
  'subprocess',
  'sessions',
  'webServer',
]

export function apply(ctx, config) {
  const log = text => console.warn(text)
  const mode = parseModeOf(config?.mode, log)
  const state = createState()
  const io = makeIo(ctx)
  const snapshots = new Snapshots(io)
  const roots = new RootWriters()

  /** The canonical root of an agent's working directory (FR-12). */
  const rootOf = async agent => {
    const dir = agent?.session === undefined ? ctx.workingDirectory.defaultDirectory : ctx.workingDirectory.get(agent.session)
    if (dir === undefined || dir === null) throw new Error('measure-guard: the agent has no working directory')
    return canonicalRoot(io, dir)
  }

  /** The Session-effective directory of an agent (synchronous, no I/O; FR-12). */
  const dirOf = agent => {
    if (agent === undefined || agent === null) return undefined
    return agent.session === undefined ? ctx.workingDirectory.defaultDirectory : ctx.workingDirectory.get(agent.session)
  }

  // The guard layer resolves path arguments with `io.resolve(path, { cwd })`
  // (design §4) while the snapshot seam keeps its `(path, cwd, signal)` form.
  const guardIo = {
    resolve: (path, options = {}) => io.resolve(path, options?.cwd, options?.signal),
    readText: (path, signal) => io.readText(path, signal),
    exists: (path, signal) => io.exists(path, signal),
    gitLines: (args, cwd, signal) => io.gitLines(args, cwd, signal),
  }

  const decisions = createDecisions()
  /** The closeout notes of allowed calls, by token, for `tools/post-execute`. */
  const callNotes = new Map()

  const deps = {
    mode,
    state,
    io: guardIo,
    snapshots,
    roots,
    rootOf,
    dirOf,
    refreshSnapshot: async root => {
      snapshots.invalidate(root)
      return snapshots.get(root)
    },
    gitStatusOf: root => gitStatus(io, root),
  }
  deps.decide = exec => prepareDecision(deps, exec)
  deps.onTurnStopping = args => onTurnStopping(deps, args)
  deps.computeProblems = ({ agentId }) => [...state.agents.sessionOf(agentId).problems]

  const attached = new Map()
  const attach = async agent => {
    if (agent === undefined || agent === null || attached.has(agent.id)) return
    attached.set(agent.id, null)
    try {
      const dispose = await attachAgent(ctx, agent, deps)
      attached.set(agent.id, dispose)
      // The plugin fiber owns the agent-scoped registrations too, so unloading
      // the plugin removes them even before the agent is disposed.
      ctx.effect(() => dispose, `measure-guard:agent:${agent.id}`)
    } catch (error) {
      attached.delete(agent.id)
      roots.release(agent.id)
      state.agents.forget(agent.id)
      log(`measure-guard: could not attach to agent ${agent.id}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  for (const agent of ctx.agents.list()) void attach(agent)

  ctx.on('agent/created', payload => attach(payload?.agent))

  ctx.on('agent/disposed', payload => {
    const agent = payload?.agent
    if (agent === undefined || agent === null) return
    const dispose = attached.get(agent.id)
    attached.delete(agent.id)
    if (typeof dispose === 'function') dispose()
    roots.release(agent.id)
    state.agents.forget(agent.id)
    state.turns.forgetAgent(agent.id)
  })

  ctx.effect(() => ctx.tools.register(measureStatusTool(deps)), 'measure-guard:measure_status')

  for (const command of measureCommands(deps)) {
    ctx.effect(() => ctx.commands.register(command), `measure-guard:${command.name}`)
  }

  // The eight Measure workflow commands (FR-6, FR-7): each one resolves the
  // installed skill reference and steers the receiving agent.
  const workflowDeps = { ...deps, skillDeps: { env: process.env, home: homedir() } }
  for (const command of measureWorkflowCommands(workflowDeps)) {
    ctx.effect(() => ctx.commands.register(command), `measure-guard:${command.name}`)
  }

  // The Client data channel (FR-15): one exact HTTP route that the band and
  // the panel poll; the browser half is served from client.js by the loader.
  registerClientState(ctx, {
    agentOf: id => ctx.agents.get(id),
    rootOf,
    snapshots,
    state,
    mode,
    roots,
  })

  // The guard layer (FR-5..FR-9): decision preparation on the way in, the
  // synchronous guard that reports it, the closeout note on the way out, and
  // the cleanup that also drops the cached snapshot for the next call.
  ctx.on('tools/pre-execute', preExecuteListener(deps, decisions, callNotes))
  installToolGuard(ctx, decisions)
  ctx.on('tools/post-execute', postExecuteListener(callNotes))
  ctx.on('tools/result', exec => {
    callNotes.delete(exec.token)
    snapshots.invalidateAll()
  })
}
