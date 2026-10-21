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

    // The end-of-turn check: session.idle events of this instance's sessions.
    void watchIdle(ctx, guard)
  },
})

/** The setup context of the host (the type is not exported by name). */
type PluginContext = Parameters<Parameters<typeof Plugin.define>[0]['setup']>[0]

/** The idle event as the plugin reads it. */
type IdleEvent = { type: string; data?: { sessionID?: unknown } }

/**
 * Runs the end-of-turn check on every `session.idle` event: a synthetic
 * reminder (guard mode, or strict after the follow-ups), or a follow-up prompt
 * (strict). The loop ends when the instance disposes the subscription.
 */
const watchIdle = async (ctx: PluginContext, guard: Guard): Promise<void> => {
  try {
    for await (const event of ctx.event.subscribe() as AsyncIterable<IdleEvent>) {
      if (event.type !== 'session.idle') continue
      const sessionID = event.data?.sessionID
      if (typeof sessionID !== 'string') continue
      const action = await guard.onIdle(sessionID)
      if (action.kind === 'remind') await ctx.session.synthetic({ sessionID, text: action.text, description: 'measure-guard reminder' })
      else if (action.kind === 'follow-up') await ctx.session.prompt({ sessionID, text: action.text })
    }
  } catch (error) {
    // A closed subscription ends the loop; anything else is logged and the check stops.
    console.error('measure-guard: the idle watch stopped', error)
  }
}
