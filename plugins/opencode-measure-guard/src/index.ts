// The server plugin: wires the Guard to the OpenCode 2 hooks. OpenCode loads
// this file from ~/.config/opencode/plugins/opencode-measure-guard (package
// export ".") and provides @opencode/plugin at runtime.
import { Plugin } from '@opencode/plugin'
import { Guard } from './guard'
import { modeFrom } from './options'
import { Bypass, Sessions } from './state'
import type { CompactionEvent, ContextEvent, PromptEvent, ToolAfterEvent, ToolBeforeEvent } from './hooks/types'

// The host accepts the default export only: no named exports in this file.
const PLUGIN_ID = 'measure.guard'

export default Plugin.define({
  id: PLUGIN_ID,
  async setup(ctx) {
    const mode = modeFrom(ctx.options, process.env)
    const guard = new Guard(ctx.location.directory, mode, new Sessions(), new Bypass(ctx.storage))

    await ctx.session.hook('context', event => guard.onContext(event as unknown as ContextEvent))
    await ctx.session.hook('prompt', event => guard.onPrompt(event as unknown as PromptEvent))
    await ctx.session.hook('compaction', event => guard.onCompaction(event as unknown as CompactionEvent))
    await ctx.tool.hook('execute.before', event => guard.onToolBefore(event as unknown as ToolBeforeEvent))
    await ctx.tool.hook('execute.after', event => guard.onToolAfter(event as unknown as ToolAfterEvent))

    // The end-of-turn check on the turn-end events of the subscription.
    void watchIdle(ctx, guard)
  },
})

/** The setup context of the host (the type is not exported by name). */
type PluginContext = Parameters<Parameters<typeof Plugin.define>[0]['setup']>[0]

/** An event of the subscription as the plugin reads it. */
type SubscribedEvent = { type: string; data?: { sessionID?: unknown } }

/**
 * The events that end a turn. OpenCode 2.0.32 delivers the durable
 * `session.execution.*` events to a plugin subscription; the ephemeral
 * `session.idle` was not seen live, so it is accepted but not relied on.
 */
const TURN_END_EVENTS = new Set(['session.idle', 'session.execution.succeeded', 'session.execution.failed', 'session.execution.interrupted'])

/** Two turn-end events closer than this count as one (idle after execution). */
const TURN_END_DEBOUNCE_MS = 1000

/**
 * Runs the end-of-turn check when a session's execution ends: a synthetic
 * reminder (guard mode, or strict after the follow-ups), or a follow-up prompt
 * (strict). The loop ends when the instance disposes the subscription.
 */
const watchIdle = async (ctx: PluginContext, guard: Guard): Promise<void> => {
  const lastCheck = new Map<string, number>()
  try {
    for await (const event of ctx.event.subscribe() as AsyncIterable<SubscribedEvent>) {
      if (!TURN_END_EVENTS.has(event.type)) continue
      const sessionID = event.data?.sessionID
      if (typeof sessionID !== 'string') continue
      const now = Date.now()
      if (now - (lastCheck.get(sessionID) ?? 0) < TURN_END_DEBOUNCE_MS) continue
      lastCheck.set(sessionID, now)
      const action = await guard.onIdle(sessionID)
      // resume: false keeps the reminder in the transcript without a new agent loop (the live check showed the agent resumes otherwise).
      if (action.kind === 'remind') {
        await ctx.session.synthetic({ sessionID, text: action.text, description: 'measure-guard reminder', resume: false })
        // The synthetic message reaches the agent with the next prompt; the prompt rider would double it.
        guard.session(sessionID).reminder = null
      }
      else if (action.kind === 'follow-up') await ctx.session.prompt({ sessionID, text: action.text })
    }
  } catch (error) {
    // A closed subscription ends the loop; anything else is logged and the check stops.
    console.error('measure-guard: the turn-end watch stopped', error)
  }
}
