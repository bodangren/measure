// The Host half of dsh-idle-compaction: one watcher per preset revision, bound to
// the sessions of every live agent of that preset, ticks a timer, and asks the
// preset's own compaction backend for one standalone idle-session compaction
// when a session has been idle for the configured window and holds activity
// after its last successful compaction. Every decision is the pure policy's;
// this module owns the timer, the agent binding, and the backend call only.
//
// The plugin is loaded from a profile path, so it may import no
// `@deepseek-ai/*` package: every capability comes from `ctx`.
import { compactGate, createState, describeError, observe, parseSettings } from './src/policy.js'

export const name = 'idle-compaction'

/**
 * The watcher needs the preset's compaction engine (the only place the Web app
 * mounts one), the live-agent registry, and the timer helpers.
 */
export const inject = ['compaction', 'agents', 'timer']

export function apply(ctx, config) {
  const settings = parseSettings(config)
  if (!settings.enabled) return

  const warn = text => {
    const logger = ctx.logger
    if (logger !== undefined && logger !== null && typeof logger.warn === 'function') logger.warn(text)
    else console.warn(text)
  }

  /** One state per live session of this preset; a preset plugin is shared, not per session. */
  const states = new Map()
  /** The compaction operations in flight, so disposal can abort and await them. */
  const active = new Set()
  let disposed = false

  const isRoot = agent => {
    try {
      return ctx.agents.roots().some(one => one === agent || one.id === agent.id)
    } catch {
      return false
    }
  }

  /** Scan one session's committed log once and start watching it (idempotent). */
  const bind = agent => {
    if (disposed || agent === undefined || agent === null) return
    if (states.has(agent.id)) return
    try {
      if (!settings.includeSubagents && !isRoot(agent)) return
      states.set(agent.id, createState(agent, agent.session.snapshotEvents()))
      warn(`armed for session ${agent.id} (idle ${settings.idleMinutes} min, check ${settings.checkSeconds} s)`)
    } catch (error) {
      warn(`cannot watch session ${agent?.id}: ${describeError(error)}`)
    }
  }

  const unbind = agent => {
    const state = agent === undefined || agent === null ? undefined : states.get(agent.id)
    if (state === undefined) return
    states.delete(agent.id)
    if (state.controller !== null && state.controller !== undefined) state.controller.abort()
  }

  /** Fold every committed event of a watched session into its state. */
  const onSessionEvent = (session, event) => {
    if (disposed || session === undefined || session === null) return
    const state = states.get(session.id)
    if (state === undefined) return
    try {
      observe(state, event)
    } catch (error) {
      warn(`cannot observe an event of session ${session.id}: ${describeError(error)}`)
    }
  }

  /** Ask the backend for one idle compaction when the gate is open. */
  const compact = state => {
    const now = Date.now()
    if (!compactGate(state, { idleMs: settings.idleMs, now, status: state.agent.status })) return
    const controller = new AbortController()
    state.controller = controller
    const operation = (async () => {
      try {
        const result = await ctx.compaction.compactNow(state.agent, controller.signal)
        if (result === null) {
          state.lastAttemptAt = Date.now()
          warn(`no compactable history for session ${state.agent.id}; retrying after another idle window`)
          return
        }
        state.lastCompactionEndSeq = Math.max(state.lastCompactionEndSeq, result.endSeq)
        warn(
          `compacted idle session ${state.agent.id} (${result.shadowedSeqs.length} items, ~${result.shadowedTokenCount} tokens)`,
        )
      } catch (error) {
        if (controller.signal.aborted) return
        if (error?.code === 'busy') {
          warn(`session ${state.agent.id} became active before compaction; retrying on a later tick`)
          return
        }
        state.lastAttemptAt = Date.now()
        warn(`idle compaction failed for session ${state.agent.id}: ${describeError(error)}`)
      } finally {
        if (state.controller === controller) state.controller = null
      }
    })()
    active.add(operation)
    operation.then(
      () => active.delete(operation),
      () => active.delete(operation),
    )
  }

  /** One watcher tick: every eligible session compacts at most once per window. */
  const tick = () => {
    if (disposed) return
    for (const state of [...states.values()]) {
      try {
        compact(state)
      } catch (error) {
        warn(`idle check failed for session ${state.agent?.id}: ${describeError(error)}`)
      }
    }
  }

  /** Stop everything: abort an in-flight compaction and await its settlement. */
  const drain = async () => {
    disposed = true
    for (const state of states.values()) {
      if (state.controller !== null && state.controller !== undefined) state.controller.abort()
    }
    states.clear()
    await Promise.allSettled([...active])
  }

  ctx.effect(() => {
    const stopTimer = ctx.interval(tick, settings.pollMs)
    const offCreated = ctx.on('agent/created', payload => bind(payload?.agent))
    const offDisposed = ctx.on('agent/disposed', payload => unbind(payload?.agent))
    const offStatus = ctx.on('agent/status', payload => bind(payload?.agent))
    const offEvent = ctx.on('session/event', onSessionEvent)
    return async () => {
      stopTimer()
      offCreated()
      offDisposed()
      offStatus()
      offEvent()
      await drain()
    }
  }, 'idle-compaction.watcher')

  // A profile recomposition or a preset revision switch re-binds live agents
  // without a fresh creation edge, so bind what is already live.
  try {
    for (const agent of ctx.agents.list()) bind(agent)
  } catch (error) {
    warn(`cannot list live agents: ${describeError(error)}`)
  }
}
