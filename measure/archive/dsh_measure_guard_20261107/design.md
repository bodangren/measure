# Design Decisions: DSH measure-guard

Track: `dsh_measure_guard_20261107`
Date: 2026-11-07
Author model: deepseek-flash
Status: written after spec review rounds, before Phase 1 Red.

This file closes the design choices the plan must not leave to the
implementer (spec review standard, Zero-Decision Check). It is the contract the
plan's tasks cite.

## 1. Package location and file layout

The bundle is `plugins/dsh-measure-guard/` (mirrors `plugins/opencode-measure-guard/`).

```
plugins/dsh-measure-guard/
├── package.json           # name dsh-measure-guard; main/exports; dsh.bundle.patch; dsh.client
├── cordis.patch.yml       # one self-referencing insert row
├── index.js               # Host half: export name, inject, apply; Config optional
├── client.js              # Client half: hand-written window.__ModuleLoader__.load factory
├── icon.svg
├── locale/en.json         # {"meta":{"title","description"}}
├── locale/zh.json
├── src/
│   ├── core/parse.ts      # parity copy of mods/measure-guard/hooks/parse.ts
│   ├── core/guards.ts     # parity copy (+ .ts extension on its one value import)
│   ├── types.ts           # parity copy of mods/measure-guard/types/index.d.ts
│   ├── snapshot.js        # root resolution, file reads, git status, cache
│   ├── state.js           # 4 state classes: repo config, root snapshot, agent, turn
│   ├── hooks.js           # tool mutation normalization + decision-prep helpers
│   ├── guard.js           # Guard runtime: decision map, handlers, notes
│   ├── status.js          # measure_status text, band/panel view, commands text
│   └── client-state.js    # the HTTP resource body (JSON the Client fetches)
├── scripts/check-parity.sh
├── tests/                 # one *.test.js per module (see plan.md), plus:
│   ├── fixtures.js        # in-memory project (Measure files as strings)
│   └── install.sh         # installer target contract (bash)
└── README.md
```

The repository `.gitignore` ignores `lib/` at every depth, so the package keeps
`index.js` and `client.js` at its root (the pattern of the shipped build-free
template) instead of an `lib/` folder.

`index.js` and `client.js` are the only files the DSH loader resolves
(`main`/`exports["."]` and `exports["./client"]`). `src/**/*.js` are plain ESM
modules imported by `index.js` with explicit relative paths and `.js`
extensions. `src/core/*.ts` are loaded by Node's built-in type stripping
(Node >= 24.9, `--strip-types` on by default; the DSH root requires >= 24.9);
they are inside the package, never under `node_modules`, which is the one place
Node refuses to strip types.

## 2. Host plugin module shape

`index.js`:

```js
export const name = 'measure-guard'
export const inject = ['tools', 'agents', 'commands', 'systemPrompt',
                       'workingDirectory', 'fs', 'subprocess', 'sessions']
export function apply(ctx, config) { /* registrations, all ctx.effect-owned */ }
```

- `Config` is **not** exported: the plugin validates `config.mode` itself
  (`advise|guard|strict`, default `guard`). This avoids a schemastery
  dependency (NFR-2). A malformed value logs one warning and falls back to
  `guard`.
- The plugin imports **no** `@deepseek-ai/*` package. Every capability comes
  from `ctx` services, event names are plain strings, and the two message
  helpers it needs (`createUserMessage` semantics) are re-implemented locally
  (`newUserMessage()` in `src/state.js`): `{ ...input, role: 'user',
  id: randomUUID() }`, deep-frozen. Evidence: `dsh-llm/lib/index.js:37-64`.
- Everything registered in `apply` uses `ctx.effect(...)` or `ctx.on(...)` so
  the fiber unwinds it.

The no-import rule has three consequences the adapter must honour:

1. **Tool definition.** `measure_status` cannot call `defineTool` (a bare
   `@deepseek-ai/dsh-tools` import). It registers a hand-built `ToolDefinition`
   with the same fields `defineTool` produces (`dsh-tools/lib/index.js:310-345`):
   `{ name, description, parameters: <JSON Schema>, output: { schema: <JSON
   Schema>, render: (args, value) => [{ type: 'text', text: value }] },
   async execute(args, exec) { return text } }`. The tool takes no parameters.
2. **User messages.** `newUserMessage({ content, source })` reproduces
   `createUserMessage` (`dsh-llm/lib/index.js:37-64`): `structuredClone` of the
   input, `role: 'user'`, `id` from `randomUUID()` (`node:crypto`), deep-frozen.
   `source` is `{ kind: 'measure-guard', form: 'notice', summary }`.
3. **Files and processes.** Project reads use the `ctx.fs` seam:
   `const target = await ctx.fs.resolve(path, { cwd, signal })` then
   `await ctx.fs.readText(target, signal)`; `stat`/`contains` are on the same
   seam. The repository config store (a trusted host file under
   `~/.local/state`, outside the workspace sandbox) uses `node:fs/promises`
   directly, async only. Git runs through `ctx.subprocess` (design §4); no
   `node:child_process` and no synchronous calls in the guard path.
   `node:crypto`, `node:fs/promises`, `node:path`, and `node:os` are the only
   Node built-ins the adapter imports.

## 3. State classes (FR-11)

| Class | Owner | Where |
|---|---|---|
| Repository config | `ReproStore` (`src/state.js`) | `~/.local/state/measure/dsh-guard/repos.json` — `{ "<realpath root>": { mode?: Mode, off?: true } }`, read on first use, written atomically |
| Root snapshot | `Snapshots` (`src/snapshot.js`) | in memory, one `Snapshot` per canonical root, invalidated on `tools/result`, `agent/pre-step`, `compaction/end` |
| Agent state | `Agents` (`src/state.js`) | in memory keyed by `agent.id` (= `session.id`): `notedKey`, `setupChoice`, `reminder`, `problems`, `red`, `bypass` |
| Turn state | `Turns` (`src/state.js`) | in memory keyed by `${agent.id}:${turn}`: `{ status, unsha, blocks }`; the baseline is captured in the first `agent/pre-step` of the turn; deleted on `turn/end` |

The repository bypass (`/measure-off repo`) is persisted in the repository
config store. **Deviation:** FR-11 named `ctx.storageDomain`; that API requires
zod record schemas (a runtime dependency, NFR-2 conflict), so the file store is
used instead. Same call as the OpenCode adapter's state file.

## 4. Root and path resolution (FR-12)

- **Effective directory per call.** `ctx.workingDirectory.get(agent.session)`
  (synchronous, no I/O) is read on every guarded call and every snapshot load;
  a durable `working-directory/change` mid-turn is therefore honoured on the
  next call. The snapshot cache is keyed by canonical root, so a changed
  directory loads the new project's files on demand and the old root's cache
  entry stays.
- **Path arguments** (relative file arguments and the shell `workdir`) are
  resolved against that effective directory, never the process cwd:
  `await ctx.fs.resolve(path, { cwd: dir, signal })` returns the realpathed
  target; containment (`isInside`) and the allow list then compare that
  realpath with the canonical root. A target outside every root is never
  denied (it is not Measure work).
- **Canonical root**: `await ctx.fs.resolve(dir)`, then
  `git rev-parse --show-toplevel` through `ctx.subprocess.spawn` with
  `graceMs`, byte-capped stdio, and the call's `AbortSignal`; the output is
  realpathed with `ctx.fs.resolve`. Fall back to the realpathed effective
  directory when git fails or the directory is not a work tree.
- **Writer record** (`src/roots.js`): a `Map<root, Set<agentId>>`. The first
  agent of a root is the writer. A second distinct agent gets exactly one
  `agent.inject` warning note (`summary: 'measure-guard: another session'`) and
  the band suffix `<n> sessions` (the client view appends it from
  `RootWriters.countOf`); re-attaching the same agent never warns
  twice. `agent/disposed` removes the id, and the record for a root is deleted
  when its set empties, so a restarted agent starts clean. First release
  detects, it does not arbitrate.
- All of this runs only in async paths (`tools/pre-execute`,
  `agent/pre-step`, command handlers, the HTTP resource). Nothing blocks.

## 5. Decision preparation (FR-5) and mutation normalization (FR-6)

`src/hooks.js`:

```js
normalizeMutation(name, args, root) -> { paths: string[], ... }  // FR-6
```

- `edit`: `file_path` (also `path`/`filePath`), `old_string`, `new_string`, `replace_all`.
- `write`: `file_path` (also `path`/`filePath`), `content`.
- `apply_patch`: `input`/`patchText`; paths from `*** Update File:`, `*** Add File:`, `*** Delete File:`.
- `str_replace_editor`: `path` + `command` (`create`/`str_replace`/`insert`/`view`); `view` is not a mutation.
- `bash` / `pwsh`: `{ kind: 'shell', command }` — a shell call is classified,
  not path-derived. Its touched paths are unknown, so the edit guard does not
  inspect it (the same documented known non-enforcement as both existing
  adapters); Bash/PowerShell writes are caught by the end-of-turn check through
  `git status`. No shell path extraction is invented in this track, and the
  strict commit/TDD guards that would read a shell command are deferred (FR-13).
- A multi-path call is denied when any path is denied; the deny lists every
  denied path (up to 5 then "and N more").

**Mutation schema.** `normalizeMutation(name, args, dir)` returns exactly one of:

```js
{ kind: 'file', paths: string[], afterTexts: Map<path, string|null>, edit: FileEdit|null }
{ kind: 'shell', command: string }
{ kind: 'other' }
```

`afterTexts` is the reconstructed file text for the closeout guard, and
`edit` is the core's `FileEdit` (`{tool:'Edit'|'Write', ...}`) so the shared
`applyEdit` can compute it. `afterTexts` is filled only for `edit` and `write`
(the shared core's two `applyEdit` cases). `apply_patch`,
`str_replace_editor`, `multiedit`, and shell calls return `edit: null` and
empty `afterTexts`; the closeout guard then allows (fail open) and the
end-of-turn check is the backstop. `view` (a `str_replace_editor` command that
only reads) returns `{ kind: 'other' }`.

**Fail-open policy** (one rule, tested): every guard preparation wraps its I/O
in try/catch and stores `undefined` (allow) on failure; a parse error in the
Measure files also allows; an unknown tool name is not a mutation. A denial is
only ever produced by the shared core's decision functions.

Decision map in `src/guard.js` (exact technique from `dsh-agent-instructions`):

```js
const decisions = new Map()            // ToolExecutionToken -> string | undefined
ctx.on('tools/pre-execute', async (exec, next) => {
  const gate = await next()
  if (gate.kind !== 'allow') return gate
  decisions.set(exec.token, await decideFor(exec))   // try/catch -> undefined
  return gate
})
ctx.effect(() => ctx.tools.guard(exec => decisions.get(exec.token)))
ctx.on('tools/result', exec => { decisions.delete(exec.token) })
```

Turn identity for tool calls: `exec` has no turn. The turn number is taken from
`ctx.agents.turnBoundaryOf(exec.agent.session).lastTurn` (synchronous,
projection-backed) when a call needs turn state.

## 6. Context layer (FR-1..FR-4)

- **Rule section**: one agent-scoped `agent.ctx.systemPrompt.section({ name:
  'measure:rule', order: 5000, text: ruleSection() })`, registered when the
  plugin attaches to an agent whose canonical root has a `measure/` folder
  (`ctx.agents.list()` at `apply` for existing agents, then `agent/created`).
  The text is static (cache-safe). No section is registered for an agent whose
  project has no `measure/`, which is how NFR-1's inertness reaches the prompt.
- **Task note (exactly once)**: returned from `agent/pre-step` as
  `{ kind: 'enter', messages: [...messages, note] }` only when the noteKey
  changed; also on the first step after `compaction/end`, and when the cached
  snapshot was invalidated by an external edit. `agent.inject()` is used only
  for one-shot notices (end-of-turn reminder, second-writer warning) where a
  missed step is acceptable. This corrects FR-2's "through agent.inject()":
  `inject()` may miss a step (host-api research gotcha 7), so the exactly-once
  requirement is met through `pre-step`.
- **`measure_status` tool** (`ctx.tools.register` + `defineTool` semantics,
  hand-built definition object): no parameters; returns the status lines, the
  active track/position/`[b]` count/next action/spec path, never the whole
  spec.
- **Commands** (`ctx.commands.register`): `measure-off` (`repo` argument),
  `measure-on` (`repo`), `measure-status`; handler returns
  `{ kind: 'success', text }`. The Client half decorates `measure-status` with
  a `commandUi` action that opens the panel.
- **Setup (NFR-1).** In a git repository without `measure/`, the shared core's
  `needsSetup`/`SETUP_DENY`/`SETUP_PROMPT`/`setupBandText` drive the flow: the
  band shows the offer (`setupBandText(setupChoice)`), the first blocked edit
  returns `SETUP_DENY` naming the two answers, and the user's answer is kept in
  agent state (`pending` → `off` or `setup`). `off` makes edits pass;
  `setup` keeps showing the prompt text until setup runs. Outside a git work
  tree, and once `off` is answered, the plugin is inert.

## 7. Guard layer (FR-7..FR-9)

All guard decisions are the shared core's (`editDecision`, `trackCloseDecision`,
`phaseStartDecision`, `turnProblems`, `stopAction`). The DSH adapter only builds
the `GuardContext`, normalizes mutations, and prepares file texts for the
closeout guard (`readOrEmpty` + `applyEdit`/`applyMultiEdit` equivalents).

- **Edit guard** (guard+strict): deny text = core text + `BYPASS`.
- **Closeout guard**: `tracks.md` close uses `closedTracks` + per-plan reads;
  a plan edit uses `phaseStartDecision`.
- **End-of-turn**: baseline at the first `agent/pre-step` of the turn
  (`gitStatus` via subprocess); `agent/turn-stopping` computes problems and
  **strict** holds the turn open by `agent.steer(newUserMessage(...))`, at most
  `MAX_BLOCKS` times. `steer()` is the documented objection lever at that
  boundary (`dsh-agent/README.md`: a listener objects by steering and the
  machine re-reads its inbox); `dsh-agent-loop/lib/index.js:789-797` shows the
  loop breaks only when the `next-step` inbox is empty after the turn-stopping
  dispatch, and `steer()` splices there and wakes the driver (`:571-578`).
  Guard mode records the problems and queues a reminder delivered by the next
  `agent/pre-step` (and shows them in the band). `advise` shows the band only.

## 8. Client surface (FR-4, FR-10; plain JS, no build)

`package.json` adds `dsh.client: { platform: 'web', inject:
['@deepseek-ai/dsh-client-ui-conversation', '@deepseek-ai/dsh-client-ui-sidebar',
'@deepseek-ai/dsh-client-ui-layout'] }` and `exports['./client'] = './client.js'`.
`dsh.client.inject` is package-load ordering only; the Cordis service inject is
`export const inject = ['slots', 'sessions', 'locale', 'layout', 'commandUi']`
inside the bundle. The pattern is the shipped build-free template
`@deepseek-ai/dsh-agent-preset/skills/cordis-plugin-development/templates/decoration`.

`client.js` registers a lazy factory with `window.__ModuleLoader__.load({ id:
'dsh-measure-guard', factory(require) { ... } })`, requires only `react` from
the module table (no Harness Client package: forbidden by the shipped skill's
`references/practices.md`), and returns `{ apply, inject }`.

- **Band**: `ctx.slots.inject('conversation.input.dock', () =>
  ctx.slots.register({ name: 'conversation.input.dock', id: 'measure-guard',
  order: 20, locale: NS }, Band))`. The dock is session-scoped and its component
  props carry `sessionId`, so the component fetches
  `GET /measure-guard/state?sessionId=<id>` every 2 s while mounted (the Host
  resource registered through `ctx.webServer.register({ path, resource })`),
  renders the band line, the `[b]` count, the guard bypass state, and problem
  rows; theme tokens only (`--dsw-alias-*`, `--dsw-radius-*`). The host
  `inject` list gains `webServer`.
- **Panel**: `main` keyed slot key `measure` plus `sidebar.panellist` id
  `measure`; root-scoped (no session binding), so it lists the sessions from
  `ctx.sessions.list` and fetches the same resource for the selected session.
- **Command action**: `ctx.commandUi.decorate({ name: 'measure-status',
  available: () => true, ui: { kind: 'action', run: () => ctx.layout.selectPanel('measure') } })`.
- Locale dictionaries are inline in `client.js` through `ctx.locale.register/`.
- Client inject: `['slots', 'sessions', 'locale', 'layout', 'commandUi']`.

The HTTP resource is the zero-dependency host→client channel: session
projections would need zod wire schemas, Typert remotes need codegen, and
`plugin:` session records are forbidden outside this repository
(`dsh-session/README.md:72`).

## 9. Shared core and parity

`scripts/check-parity.sh` (modeled on the OpenCode one) checks:

1. `src/core/parse.ts` is byte-identical to `mods/measure-guard/hooks/parse.ts`.
2. `src/core/guards.ts` is identical after one mechanical transform: the
   mod's `from './parse'` becomes `from './parse.ts'` (Node ESM needs the
   extension; this is the only extensionless value import in the core).
3. `src/types.ts` is the mod's `types/index.d.ts` without its `declare module
   'claude-code'` block, plus the two-line header note (the OpenCode precedent).

`npm`-free test gate: `node --test tests/*.test.js` (the shell expands the
glob; Node's positional is a file or glob, not a bare directory name) then
`bash scripts/check-parity.sh`, exposed as `node --run test` from the package
folder.

## 10. Test matrix (normal and edge per phase)

| Phase | Normal | Edge |
|---|---|---|
| 1 | fixture parses; active task and band line correct | parse error (track line in no known format); empty plan; no `measure/` |
| 2 | snapshot reads real repo; note key changes with the task; `measure_status` text | no git repo; plan `[~]` without `plan.md`; compaction re-note; second writer notice |
| 3 | deny write without `[~]`; allow with `[~]`; allow inside `measure/`; deny track close with open tasks; deny phase N+1 without checkpoint | allow list passes; parse error allows all; multi-path call with one denied path; `advise` allows everything; Bash write only caught at turn end |
| 4 | HTTP resource returns the JSON view; client bundle registers band, panel, and command action | no session id -> 404; no `measure/` in project -> setup view; client factory with no `require` beyond react |
| 5 | installer row copies the bundle without tests; `--check` clean | local edit kept with exit 2; profile patch row loads the copied path |

## 11. Install and verification

- **Client-half discovery for a path row** [verified in
  `dsh-client-modules/lib/index.js` `locatePkgJson`/`nearestPackage`]: for a
  path-form Loader row the modules node half resolves the module URL and walks
  up to the nearest `package.json` (any string `name`), so a row pointing at
  `plugins/dsh-measure-guard/index.js` still finds this package's `dsh.client`
  declaration and serves `client.js`. Both halves therefore load from the same
  patch row, with no pnpm and no `node_modules`.
- **Manual verification (live)**: append one row to
  `~/.dsh/profiles/web/cordis.patch.yml`:
  `- insert: [ { id: measure-guard, name: /home/daniel-bo/Desktop/measure/plugins/dsh-measure-guard/index.js } ]`
  (HMR recomposes; delete the row to unload). This is the "path row" route and
  needs no pnpm.
- **Distribution**: `bin/install-targets.tsv` row
  `plugins/dsh-measure-guard	~/.dsh/profiles/web/plugins/dsh-measure-guard	!(tests/*)`,
  plus the same `cordis.patch.yml` row with `name: ./plugins/dsh-measure-guard/index.js`.
  `dsh.bundle.patch` stays valid for a later real bundle install
  (`dsh plugin --profile web add <abs path>`).
  - The installer skips a target whose **immediate parent** is missing, and the
    immediate parent here is `~/.dsh/profiles/web/plugins`, not the profile
    folder. `README.md` therefore tells the user to create it once
    (`mkdir -p ~/.dsh/profiles/web/plugins`) before the first install; the
    installer test covers the skip-then-create sequence.
  - The target spells the default DSH home (`~/.dsh`). A `DSH_HOME` elsewhere
    needs the row adjusted or the bundle installed with `dsh plugin add`; the
    README states both.
- **No build step, no package manager, no `node_modules`** in the repository.

## 12. Shared-core symbol map (FR → core symbol)

| FR | Shared core symbol (`mods/measure-guard/hooks/*`) |
|---|---|
| FR-1 | `ruleSection()` (`parse.ts`) |
| FR-2 | `noteKey()`, `taskNote()` (`parse.ts`) |
| FR-3 | `statusLines()`, `bandLine()`, `position()`, `blockedCount()` (`parse.ts`) |
| FR-4 | `statusLines()`, `guardsText()` (`parse.ts`) |
| FR-5 | none (adapter plumbing only) |
| FR-6 | none (adapter normalization; `Decision`/`FileEdit` types) |
| FR-7 | `editDecision()`, `isAllowed()`, `isInside()` (`guards.ts`) |
| FR-8 | `closedTracks()`, `trackCloseDecision()`, `phaseStartDecision()` (`guards.ts`) |
| FR-9 | `turnProblems()`, `stopAction()`, `changedDuringTurn()`, `unshaTasks()`, `MAX_BLOCKS` (`guards.ts`) |
| FR-10 | `parseAllowList()` (`parse.ts`), `isAllowed()` (`guards.ts`) |

The adapter never re-implements these: `src/status.js` and `src/commands.js` call
`statusLines`/`bandLine`/`taskNote`; `src/guard.js` calls the decision functions.

## 13. Deviations from the spec text (recorded for the Author Response)

1. FR-2: task notes use `agent/pre-step`, not `agent.inject`, for exactly-once.
2. FR-9 names `agent.steer()` for the strict hold-open, the documented
   objection lever at `agent/turn-stopping`. `agent.inject()` would also land
   in the next-step inbox, but steer is the documented mechanism, so the spec,
   the plan and this design name steer.
3. FR-11: repository config persists in a JSON state file, not `ctx.storageDomain`.
4. NFR-3: parity compares `guards.ts` after one documented mechanical transform
   (the `./parse` specifier gains its `.ts` extension, the only extensionless
   value import in the core); `parse.ts` stays byte-identical and `types.ts`
   keeps the existing `declare module` transform.
5. Phase 4: the band/panel data channel is a Host HTTP resource; no projection,
   no remote, no codegen, no new dependency.
6. FR-8: the closeout guard reads the after-text only for `edit`/`write` and
   fails open for every other mutation tool.
7. NFR-5: the parity-bound core text (deny, note, status, reminder) ships in
   English; the plugin's own chrome is localized.

## 14. Localization boundary (NFR-5)

The shared core returns fixed English strings (`ruleSection`, `taskNote`,
`statusLines`, `bandLine`, the deny texts, the reminder). They are the
parity-locked contract, so the DSH adapter renders them unchanged in English.
Everything the adapter itself shows is localized with `ctx.locale` under the
namespace `measure-guard`: the band's own labels, the panel headings and rows,
the command descriptions, the setup offer text, and the HTTP view's labels.
`locale/en.json` and `locale/zh.json` carry the plugin display metadata
(`meta.title`, `meta.description`); the runtime dictionaries live inline in
`client.js` because a hand-written bundle has no build step to compile them.
