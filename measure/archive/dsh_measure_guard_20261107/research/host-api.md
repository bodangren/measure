# DSH host-side plugin API — research notes

Target: dsh **0.2.2-rc.1**, **@deepseek-ai/cordis 4.1.0**. Evidence root **`$P`** =
`/home/daniel-bo/.local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/`.
Per section: **confidence** = documented / inferred from types (+compiled `lib/*.js`) / guessed.

## 0. Plugin module shape

A plugin package is a Cordis plugin module: `name`, optional `Config` (schemastery), optional `inject`
(required service keys), `apply(ctx, config)`. Shipped shape: `export { apply, inject, name }`
(`$P/dsh-experimental-auto-review/lib/index.js` tail; `$P/dsh-storage-domain/lib/index.js:337`
`const inject = ["storage"]`). Soft deps: `ctx.get('fs')` returns `undefined` when unmounted
(`$P/dsh-llm/lib/index.js`, `fileReadPath`). Disposers: `ctx.effect(() => disposer, label)` →
`Disposable<Promise<void>>` (`$P/cordis/lib/types/fiber.d.ts:161`). Listeners:
`ctx.on(name, fn, options?: boolean | { prepend?: boolean; global?: boolean }): () => boolean`
(`$P/cordis/lib/types/events.d.ts`). Everything registered through `ctx` is fiber-owned and unwinds.

```js
export const name = 'measure-guard'
export const inject = ['systemPrompt', 'tools', 'agents', 'commands', 'workingDirectory']
export const Config = Schema.object({ mode: Schema.string().default('guard') })
export function apply(ctx, config) { /* registrations */ }
```
**Confidence: documented** (`$P/dsh-base/README.md` §custom profile; per-package exports).

## 1. `dsh-system-prompt` — prompt sections

`import '@deepseek-ai/dsh-system-prompt'`; service `ctx.systemPrompt`. Exact (`lib/types/index.d.ts:256`):

```ts
section(section: PromptSection): () => void
getSectionOrder(name: PromptSectionOrderName): number
getContextOrder(name: PromptContextOrderName): number
context(context: PromptContext): () => void
suppressRuntimeContext(): () => void
tools(provider: (c: AssembleContext) => ToolProviderResult): () => void
variable(name: string, provider: (c: AssembleContext) => string | undefined): () => void
assemble(context?: AssembleContext): Promise<PromptAssembly>
refreshContext(assembly: PromptAssembly, context?: AssembleContext): PromptAssembly

interface PromptSection {
  readonly name: string          // duplicate within one layer throws
  readonly order: number         // ascending; ties → code-unit name order
  readonly text: string | ((context: AssembleContext) => string)
  readonly interpolate?: boolean // default true; false keeps literal {{…}}
  readonly complete?: boolean    // 2+ effective complete sections ⇒ assembly fails
}
```

Ordering (`SECTION_ORDERS`): `HARNESS_IDENTITY -1000`, `DEPLOYMENT_PERSONA_PREFIX 0`, `PLAN_POLICY 500`,
`TEAM_POLICY 600`, `TOOL_* 1000–3000`, `MCP_SERVERS 3100`, `TOOLS_SDK 5000`, `STRUCTURED_OUTPUT 9900`,
`HARNESS_SOURCE 10000`, `WEB_SURFACE 10100`, `DEPLOYMENT_PERSONA_SUFFIX 10200`. External sections may
use any finite order; only repository-owned contributors must call `getSectionOrder()`.

Lifetime: the returned effect disposer; register **and** dispose emit unfiltered
`system-prompt/change()` (`.d.ts:33`). Scoped: registering through `agent.ctx` shadows a same-named
global section **for that agent only** (README:28). Cache: "Prefix-stable while identity, persona,
variables, section text, and order render identically" (README:156) — so a static section is a one-time
cost; a `text` provider returning changing text rewrites prompt nodes (cache loss from first change).
Keep the FR-1 rule text static; put changing state in `agent.inject()`.

```js
ctx.effect(() => ctx.systemPrompt.section({
  name: 'measure:rules', order: 5000,
  text: 'Follow the Task Workflow in `measure/workflow.md`; do not implement work the active plan does not cover.',
}), 'measure:rules')
```
**Confidence: documented.**

## 2. `dsh-tools` — registry, guard, pipeline events

`import '@deepseek-ai/dsh-tools'`; service `ctx.tools` (`ToolsService` = `ToolRuntime`),
`static inject = ["systemPrompt"]` (`lib/index.js:405`).

```ts
guard(guard: ToolGuard): () => void
checkGuards(exec: ToolExecution): string | undefined   // first denial reason
export type ToolGuard = (execution: Readonly<ToolExecution>) => string | undefined
```
(`lib/types/index.d.ts:136,142`; `contracts.d.ts:374`.)

* **Synchronous**; no promise, never awaited.
* **Monotonic deny-only**: string denies, `undefined` leaves unchanged; no `allow` result exists.
* **Multiple guards**: order `[global, ...scopeChain(agent)]` — global first, then farthest ancestor →
  nearest scope (`$P/dsh-scope/lib/types/store.d.ts:119`); within a layer, registration order; the
  **first** non-`undefined` reason wins (`lib/index.js:657`).
* **Only on `allow`**: `pipeline.js:402` `decision.kind === 'allow' ? this.tools.checkGuards(exec) :
  decision.reason` — `deny`/`cancel`/rejected `ask` never reach guards.
* **Denial shape**: `{ content:[{type:'text', text:'Error: '+reason}], isError:true,
  error:{ message: reason } }` (`pipeline.js:405-415`). No `ToolErrorInfo` — guard denials cannot
  carry a code/user-facing reason (only pre-execute `{kind:'deny', info}` can).
* A guard denial still flows through `tools/post-execute`.

```ts
interface ToolExecutionInput {
  readonly callId: ToolCallId; readonly rootCallId?: ToolCallId
  readonly name: string; readonly schema?: ToolSchema      // PTC inner binding
  readonly arguments: unknown                              // snapshot, deep-frozen
  readonly agent?: Agent                                   // absent for standalone execute()
  readonly toolSet?: ResolvedToolSet
  readonly parent?: ToolExecutionToken                     // set on PTC sub-dispatches
  readonly signal: AbortSignal
}
interface ToolExecution extends ToolExecutionInput { readonly rootCallId: ToolCallId
  readonly token: ToolExecutionToken }                     // opaque symbol
```
**No `turn`/`step` on an execution.** The token is minted in `createExecution` before
`tools/pre-execute` (`pipeline.js:295`), so it is a valid Map key for the whole invocation — the exact
technique in `dsh-agent-instructions` (`lib/index.js:1442/1500`, `executionTouches.get/delete(exec.token)`).

Events (`events.d.ts`), all scope-filtered by `exec.agent`:

| Event | Mode | Signature |
|---|---|---|
| `tools/pre-execute` | waterfall | `(exec: ToolExecution, next: () => Promise<PreToolDecision>) => Promise<PreToolDecision>` |
| `tools/execute` | waterfall | `(exec: ToolDispatchExecution, next) => Promise<ToolExecutionResult>` (may replace `signal` only) |
| `tools/post-execute` | waterfall | `(exec: ToolExecution, result: Readonly<ToolExecutionResult>, next: () => Promise<PostToolDecision>)` |
| `tools/result` | emit | `(exec: Readonly<ToolExecution>, result: Readonly<ToolExecutionResult>) => undefined` |
| `tools/change` | emit | `() => void` |

```ts
type PreToolDecision = { kind:'allow' } | { kind:'deny'; reason: string; info?: ToolErrorInfo }
  | { kind:'cancel' } | { kind:'ask'; reason?: string; displayReason?: { en: string; [l: string]: string } }
type PostToolDecision = { kind:'accept'; content?: ContentBlock[]; additionalContexts?: UserMessage[] }
  | { kind:'accept'; value: JsonValue; additionalContexts?: UserMessage[] }
  | { kind:'block'; feedback: ContentBlock[]; additionalContexts?: UserMessage[] }
```

* `pre-execute` **cannot rewrite `exec.arguments`** (README:197); `timeoutMs` is declarative only.
* Use `{ prepend: true }` to gate before other policy (auto-review: `lib/index.js:565-598`).
* A throwing listener becomes an error result (`pipeline.js:415`) — wrap I/O in `try/catch`, default allow.
* `tools/result` is fire-and-forget with contained failures: cleanup/observation only.

```js
const decisions = new Map()                       // ToolExecutionToken -> string | undefined
ctx.on('tools/pre-execute', async (exec, next) => {
  const gate = await next()                       // let other policy stay authoritative
  if (gate.kind !== 'allow') return gate
  try { decisions.set(exec.token, await decide(exec)) } catch { decisions.set(exec.token, undefined) }
  return gate
})
ctx.tools.guard((exec) => decisions.get(exec.token))
ctx.on('tools/result', (exec) => { decisions.delete(exec.token) })
```
**Confidence: documented** for guard/events/decisions; ordering, `Error: <reason>` and "guards run only
on allow" **inferred from `lib/index.js`/`pipeline.js`**.

## 3. `dsh-agent` — registry, inject, lifecycle events

`import '@deepseek-ai/dsh-agent'`; service `ctx.agents` (`AgentRegistry`, `lib/types/index.d.ts:203`):

```ts
list(): Agent[]; roots(): Agent[]; get(id: SessionId): Agent | undefined
turnBoundaryOf(session: Session): TurnBoundaryProjection
currentInitiator(): Agent | undefined                // process-local AsyncLocalStorage
create(options: CreateAgentOptions): Promise<AgentHandle>
resume(options: ResumeAgentOptions): Promise<AgentHandle>

interface TurnBoundaryProjection {                    // types.d.ts:55
  readonly openTurnStartSeq: OptionalSessionSeq
  readonly lastStepStartSeq: OptionalSessionSeq
  readonly lastStepBoundary: { kind:'start'|'end'; seq: SessionSeq } | null
  readonly lastTurn: number                           // 0 before the first turn
}
```

`Agent` runtime face (`runtime-types.d.ts:163-237`, declaration-merged onto `{ readonly id: SessionId }`):
`options`, `session`, `model`, `inbox`, `status: 'idle'|'running'`, `ctx`, `cancel(cause, {keepInbox?})`,
`whenIdle()`, `runMaintenance(task)`, `send(message, target, wakeup)`, `followup(message)`,
`steer(message)`, `inject(message: UserMessage): void`.

`inject()` = "Queue model-facing context for the next pre-step without waking the driver … may miss a
request whose pre-step already claimed its batch." Source kinds are merge-declared, e.g.
`dsh-repeat-tool-reminder` declares `MessageSourceMap['repeat-tool-reminder']` and builds messages with
`createUserMessage({ content, source: { kind, form: 'notice', summary } })`
(`ContextForm` = `instructions|catalog|snapshot|notice|relay|recall`, `$P/dsh-llm/lib/types/message.d.ts:75`).

```ts
'agent/created'({ agent, source: 'startup'|'resume'|'clear'|'compact', signal? }): undefined | Promise<undefined>  // serial
'agent/disposed'({ agent }): void                                    // emit
'agent/status'({ agent, status }): void
'agent/inbox/inserted'({agent,message}) | 'claimed'({agent,message,turn}) | 'discarded'({agent,message})
'agent/pre-step'({ agent, messages: UserMessage[], turn: number, step: number,
                   signal: AbortSignal, modelSelection: Readonly<ModelSelection> },
                  next: () => Promise<PreStepDecision>): Promise<PreStepDecision>   // waterfall
'agent/turn-stopping'({ agent, turn: number, signal: AbortSignal }): Promise<void> | void  // serial
'agent/error'({ agent, turn, step, error }): void
type PreStepDecision = { kind:'reject' } | { kind:'enter'; messages: UserMessage[]; startsRequestSeries?: true }
```

* `turn-stopping` is awaited **before** the boundary commits; a listener objects only by calling
  `agent.steer(...)` and letting the machine re-read the inbox (README:80). That is FR-9 strict's lever.
* `pre-step` returning `{kind:'enter', messages}` is the exactly-once insertion point
  (`dsh-agent-instructions` `lib/index.js:1480-1500` splices after the last claimed message).
* `agent/created` listeners must not await `agent.whenIdle()` or their own disposal (README:207).
* Turn identity comes from event payloads, `turnBoundaryOf().lastTurn`, or `agent/inbox/claimed`.

```js
agent.inject(createUserMessage({ content: [{ type: 'text', text: note }],
  source: { kind: 'measure-guard', form: 'notice', summary: 'task changed → T3' } }))
```
**Confidence: documented** (README §intercept/observe + `runtime-types.d.ts`).

## 4. `dsh-session` — event stream

`import '@deepseek-ai/dsh-session'`; service `ctx.sessions`. Observation is a plain listener:

```ts
'session/event'(session: Session, event: SessionEvent): void       // emit, post-commit, fire-and-forget
'session/created'(session): void; 'session/disposed'(session): void
'session/flush'(session): Promise<void> | void                     // parallel, awaited
```
(`lib/types/index.d.ts:30-72`; listener failures logged and contained.) Envelope (`types.d.ts:497`):
`{ type: K; seq: SessionSeq; time: number /* epoch ms */; data: SessionEventMap[K]; ignorable?: true }`.

| Event | `data` | Declared in |
|---|---|---|
| `turn/start` / `turn/end` | `{ turn }` / `{ turn; reason: TurnEndReason }` | `dsh-session/.../types.d.ts:268,279` |
| `step/start` / `step/end` | `{ turn; step }` | same:284,289 |
| surface: `user/message`, `system/message`, `assistant/message`, `tool/call`, `tool/result` | — | same:300-396 |
| `compaction/start` | `{ compactionId; sourceCommandId?; turn: number\|null }` | **`$P/dsh-compaction/lib/types/types.d.ts:21`** |
| `compaction/summary` | `{ compactionId; summary: ContentBlock[]; shadowedRange; shadowedSeqs; shadowedTokenCount; provider; model; maxTokens? }` | same:35 |
| `compaction/end` | `{ compactionId; sourceCommandId?; turn: number\|null; error?: string }` | same:73 |
| `compaction/prune` | `{ shadowedRange; shadowedSeqs; shadowedTokenCount }` | same:88 |

`TurnEndReason` (merge-extensible, `types.d.ts:170`): `completed` | `aborted{reason: AgentCancelCause|
{kind:'legacy'}}` | `blocked` | `error{error: LlmFailure}` | `max-tokens` | `interrupted` | `forked`.

```js
ctx.on('session/event', (session, event) => {
  const agent = ctx.agents.get(session.id)            // Agent.id === Session.id
  if (!agent) return
  if (event.type === 'turn/end') { const { turn, reason } = event.data /* FR-9 */ }
  if (event.type === 'compaction/end' && event.data.error === undefined) { /* re-note next step */ }
})
```
`turn/end` is appended after the turn closes, so an `inject()` from that listener is only claimed by a
later turn's step (and the loop does not flush at turn boundaries).
**Confidence: documented** (feed) / **documented at declaration site** (compaction, from `dsh-compaction`).

## 5. `dsh-commands` — slash commands

`import '@deepseek-ai/dsh-commands'`; service `ctx.commands` (`CommandRuntime`):

```ts
register(definition: CommandDefinition): () => void
list(agent: Agent): readonly CommandDescriptor[]
find(agent: Agent, name: string): CommandDefinition | undefined
execute(agent: Agent, line: string, submittedAttachments: readonly CommandSubmitAttachment[],
        signal: AbortSignal): Promise<CommandExecution | undefined>

interface CommandDefinition {
  readonly definitionId?: CommandDefinitionId       // stable plugin-namespaced identity
  readonly name: string                             // lowercase, no slash
  readonly description: string
  readonly input?: { hint: string; attachments?: boolean }
  readonly recordInput?: boolean                    // default true
  readonly handler: (i: CommandInvocation) => CommandResult | Promise<CommandResult>
}
interface CommandInvocation { readonly commandId: CommandId; readonly agent: Agent
  readonly rawInput: string                         // text after the name, separators included
  readonly attachments: readonly (ImageBlock|FileBlock)[]; readonly signal: AbortSignal }
type CommandResult = { kind:'success'; text?: string; sourceEventSeq?: SessionSeq }
                   | { kind:'error'; text: string }
```
**Returns text** via `{kind:'success', text}`; rendered by the UI, never a model message. Each admitted
run appends log-only `command/run` + `command/done` (`types.d.ts:101-119`); admission misses log nothing.

**`commandUi` is client-only.** `ctx.commandUi` lives in
`@deepseek-ai/dsh-client-ui-commands/client` (`CommandUiRuntime`) and is a browser/React service:
`register(contribution)` (name collides with a host command ⇒ **fails loud**), `decorate(decoration)`
(attaches a bare-invocation `popupSelect`/`action` to an existing **host** command, keeping its row and
lifecycle), `dismiss(name)`; `CommandUiSpec = {kind:'popupSelect',…} | {kind:'action', run(session)}`
(`lib/types/client/contract.d.ts`). Host code cannot import it. So FR-4 = host command returning text +
(if a panel is wanted) a separate client package with a `dsh.client` manifest field
(`{ "client": { "inject": [...], "platform": "web" } }`, cf. `$P/dsh-client-ui-commands/package.json`)
and a Web bundle row (`$P/dsh-web-app/cordis.patch.yml:379`).

```js
ctx.commands.register({ name: 'measure-status', description: 'Show Measure position',
  handler: async ({ agent }) => ({ kind: 'success', text: await renderStatus(agent) }) })
```
**Confidence: documented** (`dsh-commands` README/`.d.ts`; client rule in `dsh-client-ui-commands`
README:32 + `contract.d.ts`).

## 6. `dsh-storage` + `dsh-storage-domain` — durable per-profile state

Hub `@deepseek-ai/dsh-storage` (`ctx.storage`) + data form `@deepseek-ai/dsh-storage-domain`
(`ctx.storageDomain`, declared there). Base mounts `storage` + `storage-json` +
`storage-domain {backend: json}` (`$P/dsh-base/cordis.patch.yml`), so base-backed profiles have it.

```ts
open<S extends DomainSpec>(spec: S): Promise<Domain<S>>; get(name): DomainImpl | undefined
interface Domain<S> { readonly name: string; readonly global: DomainGlobalHandleOf<S>
  table<N extends keyof S['tables'] & string>(name: N): KvTable<TableKeyOf<S,N>, TableValueOf<S,N>>
  close(): Promise<void> }                              // caller-owned; close via ctx.effect
interface KvTable<K extends string, V> {
  get(key: K): V | undefined                            // synchronous, from memory
  entries(): IterableIterator<[K,V]>; keys(): IterableIterator<K>; readonly size: number
  put(key: K, value: V): Promise<void>; delete(key: K): Promise<boolean>
  deleteMany(keys: readonly K[]): Promise<number>; update(key: K, fn: (cur: V) => V): Promise<V> }
```
(`$P/dsh-storage-domain/lib/types/domain.d.ts`, `index.d.ts`.) Declare with
`defineDomain({ name, version, layout?, compatibleVersions?, invalidRecords?, global?, tables })` and
`domainTable(zodSchema)`; names must match `UNIT_NAME_RE = /^[a-z][a-z0-9_]*$/` (`$P/dsh-storage/lib/index.js`)
— `measure_guard`, not `measure-guard`. A global schema accepting `null` throws at module load.
Writes resolve only after durability and emit `domain/changed(change)` post-commit, in-process only;
`DomainError` codes: `already-open`, `facet-unsupported`, `invalid-record`, `missing-key`, `closed`.

```js
const spec = defineDomain({ name: 'measure_guard', version: 1, tables: {
  repos: domainTable(z.object({ mode: z.enum(['off','advise','guard']), bypass: z.boolean() })) } })
const domain = await ctx.storageDomain.open(spec)
ctx.effect(() => domain.close(), 'measure_guard')
await domain.table('repos').put(rootKey, { mode: 'guard', bypass: false })
```
**Confidence: documented** (both READMEs + `.d.ts`); `UNIT_NAME_RE` value **inferred from `lib/index.js`**.

## 7. Paths, files, subprocesses

**`ctx.fs`** is declared by `@deepseek-ai/dsh-fs` (abstract `FileSystem`), implemented by
`dsh-fs-local` or `dsh-fs-sandbox`. **Base mounts `dsh-fs-sandbox`**, and mounting both fails the profile.

```ts
resolve(path: string, opts?: { cwd?: string; signal?: AbortSignal }): Promise<FsTarget>
processPath(t: FsTarget): string; processPathFromHostPath(hostPath): string | undefined
contains(parent: FsTarget, child: FsTarget): boolean
stat(t, signal?): Promise<FsInfo | undefined>; lstat(path, opts?, signal?): Promise<FsPathInfo | undefined>
readText(t, signal?): Promise<string>; streamText(t, signal?): Promise<AsyncIterable<string>>
listDir(t, signal?): Promise<FsDirEntry[]>; writeText/editText/patchText/deleteFile/moveFile(...)
interface FsTarget { targetKey: FsTargetKey; displayPath: string }
```
(`$P/dsh-fs/lib/types/index.d.ts:110-200`, `types.d.ts:52`.) `resolve()` is async, may do I/O, and for
the local backend normalizes + **realpaths** (realpath-derived `targetKey`) — it *is* the `realpath`
step of FR-12, no shell needed. Errors are `FsError` with stable codes (`FS_NOT_FOUND`, `FS_NOT_TEXT`,
`FS_STALE_VERSION`, …). `config.cwd` is a resolution default, not containment.

**`ctx.workingDirectory`** (`@deepseek-ai/dsh-working-directory`): `get(session): string` (sync, no I/O),
`ensure(agent, signal?): Promise<string>` (validates/recovers, throws if the project is gone),
`set(agent, path, signal?): Promise<string>`, `defaultDirectory: string`
(`lib/types/index.d.ts:46-86`). `get()` for per-call root, `ensure()` in async prep — never in a guard.

**`ctx.subprocess`** (`@deepseek-ai/dsh-subprocess`, provider `dsh-subprocess-local`; `argv` never
shell-interpreted):

```ts
resolveExecutable(command: string, env?, signal?): Promise<string>
spawn(spec: SubprocessSpawnSpec): SubprocessHandle        // synchronous handle
interface SubprocessSpawnSpec { argv: readonly string[]; cwd: string
  stdio: SubprocessStdio; graceMs: number; signal?: AbortSignal; env?: NodeJS.ProcessEnv }
interface SubprocessHandle { stdin/stdout/stderr; control: Duplex | undefined
  collected: SubprocessCollectedOutputs                   // offset readers, valid after exit
  done: Promise<{ exitCode: number|null; signal: NodeJS.Signals|null }>
  terminate(): void; waitForExit(signal?): Promise<boolean> }
```
(`$P/dsh-subprocess/lib/types/index.d.ts:88-110`, `types.d.ts:69-183`.)

```js
const exe = await ctx.subprocess.resolveExecutable('git')
const h = ctx.subprocess.spawn({ argv: [exe, 'rev-parse', '--show-toplevel'], cwd,
  stdio: { stdin:'ignore', stdout:{ maxBytes: 64*1024 }, stderr:{ maxBytes: 8*1024 } },
  graceMs: 5000, signal })
const { exitCode } = await h.done
const top = exitCode === 0 ? h.collected.stdout.readFrom(0).text.trim() : undefined
```
**Non-blocking rules**: every fs/subprocess API is promise-based and takes an `AbortSignal`; never use
`node:fs` sync calls or `child_process.execSync` — the guard path runs synchronously inside the tool
pipeline, so a blocking call stalls the whole batch. Do all I/O in `tools/pre-execute`, cache per root,
cap outputs. `ctx.subprocess` does **no** sandboxing (confinement lives in the bash/fs rows); `ctx.shell`
(`ShellExecutor` from `@deepseek-ai/dsh-shell`, concrete `dsh-bash-local`/`dsh-bash-sandbox`,
`execute(spec: ShellExecSpec): Promise<ShellExecution>`) is the sandboxed-shell route.
**Confidence: documented** for the three contracts; provider rows **inferred from `cordis.patch.yml`**.

## 8. `dsh-base` — services a base-backed profile provides

`@deepseek-ai/dsh-base` is a pure patch document (`cordis.patch.yml`, `dsh.bundle.patch`); its module "carries no runtime API" (`lib/types/index.d.ts`). Rows a plugin may rely on:
**Agent/loop**: `dsh-llm`, `dsh-llm-deepseek*`, `dsh-agent`, `dsh-agent-loop`, `dsh-agent-default-model`, `dsh-session`, `dsh-session-projection`, `dsh-session-persistence-jsonl`, `dsh-jobs-local`, `dsh-subagent*`, `dsh-goal`, `dsh-plan-mode`, `dsh-compaction-basic`, `dsh-token-meter`, `dsh-session-checkpoint-policy`.
**Prompt/tools**: `dsh-system-prompt`, `dsh-tools`, `dsh-tool-executor-native` (`…-ptc` mounted **disabled**), `dsh-tool-fs`, `dsh-tool-fs-search`, `dsh-tool-bash` *or* `dsh-tool-pwsh` (platform-gated), `dsh-tool-jobs`, `dsh-tool-todo`, `dsh-tool-goal`, `dsh-tool-skill`, `dsh-tool-web`, `dsh-repeat-tool-reminder`, `dsh-tool-call-timeout-policy`.
**Files/process**: `dsh-fs-sandbox` (⇒ `ctx.fs`), `dsh-subprocess-local` (⇒ `ctx.subprocess`), `dsh-bash-sandbox` (⇒ `ctx.shell`), `dsh-sandbox-local`, `dsh-sandbox-policy`, `dsh-shell-env`, `dsh-working-directory`, `dsh-tool-working-directory`.
**State**: `dsh-storage`, `dsh-storage-json`, `dsh-storage-domain`, `dsh-session-projection-cache`, `dsh-attachment-local`.
**Interaction**: `dsh-commands`, `dsh-command-feedback`, `dsh-command-compact`, `dsh-command-goal`, `dsh-user-approval` (⇒ `ctx.approval`), `dsh-permission-presets` (⇒ `ctx.permissionPresets`), `dsh-user-questions`, `dsh-agent-instructions`, `dsh-skill*`, `dsh-mcp-resources`.
**Ops**: `dsh-settings`, `dsh-config-editor`, `dsh-typert-*`, `dsh-api-gateway`, `dsh-plugin-manager` (disabled without `profileContext`), `@deepseek-ai/cordis-plugin-timer`.
Web-only extras (client roster, terminal, worktrees, plugin market) come from later bundles (`$P/dsh-web-app/cordis.patch.yml`). **Confidence: documented** + **inferred from `cordis.patch.yml`**.

## 9. Prior art (read for this design)

* **`dsh-repeat-tool-reminder`** — advisory chain guard: counts on `tools/post-execute` (so denied calls count), `WeakMap<Agent, Chain>`, delivers via the decision's `additionalContexts` (never a `content` replacement) with `source: {…, form:'notice', summary:'<tool> × <n>'}`; resets on `agent/pre-step` when a `source.kind === 'user'` message enters; fail-loud config validation in `apply`.
* **`dsh-experimental-auto-review`** — denying guard: one effect installs the preset contribution plus a `tools/pre-execute` listener with `{ prepend: true }` (`lib/index.js:565-598`); then either a final `deny` (under `never`) or delegate + `ask` when later listeners allow. Codes `AUTO_REVIEW_DENIED`/`AUTO_REVIEW_FAILED` go to `tool_result.error`, never to model text. It reads the log with the deprecated `snapshotEvents()` under a waiver — do not copy.
* **`dsh-agent-instructions`** — the notes template: `agent/pre-step` splice of a durable `user/message`, `tools/result` + `exec.token` touch tracking, `session/event` (`step/end`) reconciliation, escaped `<system-reminder>` framing, typed source.
* **`dsh-permission-presets`** — guards do **not** interact with presets: a preset bundles `sandbox` + `approval` knobs only; tool policy is `tools/pre-execute`/guards. The single coupling is `PreToolDecision.ask`, resolved through `ctx.get('approval')` **before** guards. A guard cannot ask.

## 10. Assumptions that did NOT hold / gotchas

1. **`ToolGuard` cannot be async and sees no `turn`/`step`** — turn identity must come from `ctx.agents.turnBoundaryOf(agent.session).lastTurn` (or be captured in `agent/pre-step`).
2. **Guard denials carry no structured error** — only pre-execute `{kind:'deny', info}` reaches `tool_result.error`; a guard denial is `Error: <reason>` + `error.message` only.
3. **Guards run only after `allow`** — a `deny`/`cancel`/rejected `ask` (from any plugin) short-circuits them.
4. **`commandUi` is client-only** — a host plugin cannot open a panel. Host command text + client `decorate()` + a `dsh.client` package + a Web bundle row. A same-name client *contribution* is a hard collision.
5. **Compaction events belong to `dsh-compaction`**, not `dsh-session` (`turn/*`, `step/*`, surfaces are `dsh-session`); `session/event` sees all.
6. **`session/event` is fire-and-forget post-commit**; throwing is swallowed (logged). Not an ordering or hold-open mechanism — that is `agent/turn-stopping`.
7. **`agent.inject()` may miss a step** and does not wake an idle driver; for exactly-once use the `agent/pre-step` return value instead.
8. **`tools/pre-execute` cannot rewrite arguments**; `timeoutMs` on a definition is declarative only.
9. **Base mounts `dsh-fs-sandbox` and `dsh-bash-sandbox`**, not the `-local` twins; depend on the `ctx.fs`/`ctx.shell` seams (mounting both providers fails the profile).
10. **Storage domain names are `^[a-z][a-z0-9_]*$`** (no dashes); record schemas are **zod** 4.4.3 (schemastery is only for plugin `Config`); a nullable global throws at load.
11. **Deprecated, avoid**: `agent/request`, and the sync readers `eventAt()`, `snapshotEvents()`, `ownEvents()`.
12. **Out-of-repo plugins must not call `appendPluginRecord`/`plugin:` records** (`dsh-session` README). Durable state → `ctx.storageDomain`; model-facing notes → `agent.inject`/`agent/pre-step`.
