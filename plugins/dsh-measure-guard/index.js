// The Host half of dsh-measure-guard: one plugin instance owns the state, the
// snapshot cache, the I/O seam, and the root writers; apply() only registers.
// The module imports no Harness package: every capability comes from ctx
// (design §2).
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

import { parseModeOf, createState, newUserMessage } from './src/state.js'
import { Snapshots, canonicalRoot, gitStatus, makeIo } from './src/snapshot.js'
import { RootWriters } from './src/roots.js'
import { attachAgent } from './src/context.js'
import { measureStatusTool } from './src/status.js'
import { measureVerifyTool } from './src/verify.js'
import { measureCommands } from './src/commands.js'
import { measureWorkflowCommands } from './src/workflow.js'
import { createDecisions, installToolGuard, postCommitListener, postExecuteListener, preExecuteListener, repoMutationLikely } from './src/hooks.js'
import { onTurnStopping, prepareDecision } from './src/guard.js'
import { recordRed } from './src/strict.js'
import { goalService } from './src/goal.js'
import { SessionModes, effectiveMode, measureModeTool } from './src/modes.js'
import { loadedDigest } from './src/digest.js'
import { SETUP_PROMPT } from './src/setup.js'
import { registerClientState } from './src/client-state.js'

export const name = 'measure-guard'

/**
 * The digest of the bytes this instance loaded (Story S1). It is computed once,
 * at module evaluation, never per request: a stale Host instance that was
 * loaded before an install replaced the files keeps the old digest, which is
 * exactly what `bin/measure-dsh --check --live` compares against the source.
 */
const LOADED_DIGEST = loadedDigest(fileURLToPath(new URL('.', import.meta.url)))

/** The digest of this instance's loaded bytes (Story S1); exported for the tests. */
export const digest = LOADED_DIGEST

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
  /** The in-memory session mode overrides (Story S1); a reload drops them. */
  const sessionModes = new SessionModes()
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
  /** The allowed commits of a `[~]` task, by token, for the post-commit reminder. */
  const commitDue = new Set()

  const deps = {
    configMode: mode,
    sessionModes,
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
    gitProbe: (args, cwd) => io.gitProbe(args, cwd),
  }
  /**
   * True only for a top-level session (a root agent). `ctx.agents.roots()`
   * names the live agents created without an owning agent context; a subagent,
   * teammate, or fork under an owner is not a root and must not claim a writer
   * slot (tech debt: one root and its child looked like two sessions). A host
   * without the method, or a throwing call, keeps today's behavior and treats
   * every agent as a root.
   */
  /** The effective mode of a canonical root (Story S1): repository > session > config. */
  deps.modeOf = root => effectiveMode(deps, root)

  /**
   * The goal service as an optional capability (Story S4). It is not in
   * `inject`, so Cordis does not order it before this plugin; the value is
   * therefore read per call, and a goal service that registers later is seen.
   * A capture at apply time would leave goal binding silently off.
   */
  Object.defineProperty(deps, 'goals', { get: () => goalService(ctx), enumerable: true, configurable: true })

  deps.isRoot = agent => {
    if (agent === undefined || agent === null) return false
    const agents = ctx.agents
    if (agents === undefined || agents === null || typeof agents.roots !== 'function') return true
    try {
      return agents.roots().some(rootAgent => rootAgent !== null && rootAgent !== undefined && rootAgent.id === agent.id)
    } catch {
      return true
    }
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
  ctx.effect(() => ctx.tools.register(measureVerifyTool(deps)), 'measure-guard:measure_verify')
  ctx.effect(() => ctx.tools.register(measureModeTool(deps)), 'measure-guard:measure_mode')

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
    modeOf: root => deps.modeOf(root),
    roots,
    // The installed entry identifies itself on the state route; the CLI's live
    // check compares this URL with the installed copy.
    moduleUrl: import.meta.url,
    // The digest of the loaded bytes, for the CLI's stale-instance check.
    digest: LOADED_DIGEST,
    // The setup button's "Set up Measure" answer delivers the shared core's
    // setup prompt to the receiving agent exactly once (Story S5).
    injectSetup: agent => {
      if (agent === null || agent === undefined || typeof agent.inject !== 'function') return
      agent.inject(
        newUserMessage({
          content: [{ type: 'text', text: SETUP_PROMPT }],
          source: { kind: 'measure-guard', form: 'notice', summary: 'setup requested' },
        }),
      )
    },
  })

  // The guard layer (FR-5..FR-9): decision preparation on the way in, the
  // synchronous guard that reports it, the closeout note on the way out, and
  // the cleanup that also drops the cached snapshot for the next call.
  ctx.on('tools/pre-execute', preExecuteListener(deps, decisions, callNotes, commitDue))
  installToolGuard(ctx, decisions)
  // The commit reminder is the inner listener: the reminder wraps its accepted
  // decision, so the note append and the reminder compose in that order.
  ctx.on('tools/post-execute', postCommitListener(commitDue))
  ctx.on('tools/post-execute', postExecuteListener(callNotes))
  ctx.on('tools/result', (exec, result) => {
    callNotes.delete(exec.token)
    commitDue.delete(exec.token)
    // A read-only result cannot change the repository; every other tool keeps
    // the fail-safe invalidation.
    if (repoMutationLikely(exec?.name)) snapshots.invalidateAll()
    // The strict-mode Red record of a finished call (FR-13): a successful
    // test-file write or a failed test command. It runs after the
    // invalidation, so the task key is read from a fresh snapshot.
    void recordRed(deps, exec, result)
  })
}
