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
  },
})
