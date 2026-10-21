# opencode-measure-guard

An OpenCode 2 plugin that makes the agent follow the Measure workflow. It is the OpenCode counterpart of the Claude Code mod `mods/measure-guard/`: it reads the Measure files of the project, shows the plan position, sends the active task to the agent, and stops work that the active plan does not cover.

Track: `measure/tracks/opencode_plugin_20261021/` (spec and plan). The decision log is in the spec.

## Layout

```
plugins/opencode-measure-guard/
├── package.json          # exports "." (server) and "./tui" (terminal); dev-only type deps
├── tsconfig.json
├── src/
│   ├── index.ts          # server plugin: Plugin.define({ id: "measure.guard" })
│   ├── tui.tsx           # terminal plugin: Plugin.define({ id: "measure.guard.tui" })
│   ├── types.ts          # copy of mods/measure-guard/types/index.d.ts (no `declare module` block)
│   └── core/
│       ├── parse.ts      # copy of mods/measure-guard/hooks/parse.ts
│       └── guards.ts     # copy of mods/measure-guard/hooks/guards.ts
├── entry/measure-guard.ts # the file the installer puts into ~/.config/opencode/plugins/ (see Install)
├── commands/             # markdown commands installed into ~/.config/opencode/commands
├── scripts/check-parity.sh
└── tests/                # bun test
```

## Install

OpenCode 2.0.32 loads the direct `.ts` files of `~/.config/opencode/plugins/`. A package folder with a `package.json` in that folder is not loaded. The install therefore has two parts:

```
~/.config/opencode/plugins/
├── measure-guard.ts          # copy of entry/measure-guard.ts; re-exports ./opencode-measure-guard/src/index.ts
└── opencode-measure-guard/   # copy of this folder without tests/ and node_modules/
```

The service log (`~/.local/share/opencode/log/opencode.log`) shows `loading plugin id=.../plugins/measure-guard.ts` after the copy; the service watches the file and reloads it on change. OpenCode provides `@opencode/plugin` at runtime, so the copy needs no `bun install`.

## Parity rule

The plugin decides with the same code as the Claude Code mod. `src/core/parse.ts` and `src/core/guards.ts` are byte copies of the mod's modules, and `src/types.ts` is the mod's types file without its `declare module 'claude-code'` block. The copies keep their `../types` import, so `types.ts` sits one folder up from `core/`.

```bash
bash plugins/opencode-measure-guard/scripts/check-parity.sh   # exits 1 and names the file that differs
```

Change the mod first, then copy. The Claude Code mod never imports from this folder.

## Snapshot

`src/snapshot.ts` reads the project into a `Snapshot` (the type of the mod): `index.md` for the Tracks Registry link, `tracks.md`, and the plan of every `[~]` track; the active track is the first `[~]` track whose plan has a `[~]` task, else the first `[~]` track. A project outside a git work tree or without `measure/` gives `hasMeasure: false`. A tracks file in no known format or an active track without a plan gives `parseError`, and every guard then allows all calls. `gitStatus(root)` returns the `git status --porcelain --untracked-files=all` lines for the end-of-turn check.

## State

`src/state.ts` keeps one `SessionState` per OpenCode session (task note key, setup answer, turn state, problems, reminder, Red state). The bypass is per project root: `/measure-off` keeps `session` in memory, `/measure-off repo` stores `off:<root>` in the plugin storage so it survives a restart. The guard mode comes from the plugin options (`plugins: [{ "package": "opencode-measure-guard", "options": { "mode": "strict" } }]`), else from `MEASURE_GUARD_MODE`, else `guard`.

### State file

The server writes `~/.local/state/measure/opencode-guard/<16 hex of sha1(root)>.json` with `{ root, mode, guardsOff, problems, updatedAt }` after every end-of-turn check and bypass change. The terminal plugin reads it to show the bypass and the open problems; it never writes it.

## Context

- **Rule.** The fixed text of `ruleSection()` goes into the system prompt through the session `context` hook, as one appended system part, for every agent except `measure-orchestrator`. That agent carries the same text in its prompt body (`agents/measure-orchestrator.md`, section "Measure rule"), so the rule is never doubled. The text never changes in a session, so the prompt cache stays valid.
- **Task note.** The `prompt` hook appends `taskNote()` (active track, `[~]` task, or the next action) to the user's prompt text when the track or the task changed since the last note of that session. A pending end-of-turn reminder rides on the same prompt.
- **Compaction.** The `compaction` hook adds the task note to the compaction request and clears the note key, so the first prompt after the compaction gets the note again.

## Guards

The `execute.before` tool hook runs the guards for `edit`, `write`, `multiedit`, and `apply_patch`. The file of a call comes from `path` (OpenCode 2.0) or `filePath` (older builds); an `apply_patch` names every `*** Update File:`, `*** Add File:`, and `*** Delete File:` path of its `patchText`. A deny is an `Error` thrown from the hook; OpenCode marks the tool call as failed and the agent reads the error text.

- **Edit guard.** In mode `guard` or `strict`, a write outside `measure/` passes only when the active plan has a `[~]` task. The deny text names the next task and the bypass command. A git repository without `measure/` gets the setup deny once per session; the text names `/measure-setup` and `/measure-off`.
- **Closeout guard.** A write of `tracks.md` that closes a track whose plan has open tasks is denied; a close with only `[b]` tasks passes and the `[b]` list rides on the tool output. A write of a `plan.md` that starts a new phase before the previous phase has its `[checkpoint: <sha>]` line is denied. The guard rebuilds the file after the edit (`edit`, `write`, and `multiedit` inputs) to decide.
- **Task note after a call.** The `execute.after` hook appends the task note to the output of a shell call or of a write inside `measure/` when the track or the task changed.

Live check (Task 4.4, OpenCode 2.0.32, model `coding-plan/glm-5.3-flash`): a `write` of `hello.txt` in a project with no `[~]` task failed with `measure-guard: no task in the track "..." is in progress. Mark the next task ...`, the file was not created, and the agent quoted the deny text.

## Checks

```bash
cd plugins/opencode-measure-guard
bun test                      # unit tests; no install needed
bun install && bun x tsc --noEmit -p .   # type check against the published @opencode/plugin types
```

`node_modules/` and `bun.lock` are not committed. OpenCode provides `@opencode/plugin`, `@opencode/plugin/tui`, `solid-js`, and the OpenTUI packages at runtime.
