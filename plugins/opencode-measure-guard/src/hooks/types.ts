// The shapes of the OpenCode hook events the plugin reads and changes, as
// structural types, so the tests need no OpenCode types. They match the
// `@opencode/plugin` promise API (SessionHooks, ToolHooks) of OpenCode 2.0.

/** A system prompt part (`SystemPart` of @opencode/ai). */
export type SystemPart = { type: 'text'; text: string; cache?: unknown; metadata?: Record<string, unknown> }

/** `session.hook("context")`: the request to the model, before it is sent. */
export type ContextEvent = {
  readonly sessionID: string
  readonly agent: string
  system: SystemPart[]
  messages: unknown[]
}

/** `session.hook("prompt")`: a user prompt before admission. */
export type PromptEvent = {
  readonly sessionID: string
  readonly messageID: string
  prompt: { text: string; [key: string]: unknown }
  metadata?: Record<string, unknown>
}

/** `session.hook("compaction")`: the compaction request; `system` and `messages` are mutable. */
export type CompactionEvent = ContextEvent & { result?: unknown }

/** `tool.hook("execute.before")`: `input` is the tool's arguments, mutable. */
export type ToolBeforeEvent = {
  tool: string
  readonly sessionID: string
  readonly agent: string
  readonly messageID: string
  readonly id: string
  input: unknown
}

/** A tool result: `output` is the text the model reads. */
export type ToolResult = { output?: unknown; content?: unknown; metadata?: Record<string, unknown> }

/** `tool.hook("execute.after")`: a completed call has `result`; a failed one has `error`. */
export type ToolAfterEvent = {
  readonly tool: string
  readonly sessionID: string
  readonly agent: string
  readonly messageID: string
  readonly id: string
  readonly input: unknown
} & ({ readonly status: 'completed'; result: ToolResult } | { readonly status: 'error'; error: { message: string } })
