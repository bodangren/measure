// The Host half of dsh-measure-guard: one plugin instance owns the state, the
// snapshot cache, the I/O seam, and the root writers; apply() only registers.
// The module imports no Harness package: every capability comes from ctx
// (design §2).
import { parseModeOf, createState } from './src/state.js'
import { Snapshots, canonicalRoot, gitStatus, makeIo } from './src/snapshot.js'
import { RootWriters } from './src/roots.js'
import { attachAgent } from './src/context.js'
import { measureStatusTool } from './src/status.js'
import { measureCommands } from './src/commands.js'

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

  const deps = {
    mode,
    state,
    io,
    snapshots,
    roots,
    rootOf,
    refreshSnapshot: async root => {
      snapshots.invalidate(root)
      return snapshots.get(root)
    },
    gitStatusOf: root => gitStatus(io, root),
  }

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

}
