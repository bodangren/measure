# opencode-measure-guard

An OpenCode 2 plugin that makes the agent follow the Measure workflow. It is the OpenCode counterpart of the Claude Code mod `mods/measure-guard/`: it reads the Measure files of the project, shows the plan position, sends the active task to the agent, and stops work that the active plan does not cover.

Track: `measure/tracks/opencode_plugin_20261021/` (spec and plan). The decision log is in the spec.

## Layout

```
plugins/opencode-measure-guard/
├── package.json          # name, scripts, dev-only type deps (the host does not read its exports)
├── tsconfig.json
├── src/
│   ├── index.ts          # server plugin: Plugin.define({ id: "measure.guard" })
│   ├── tui.tsx           # terminal plugin: Plugin.define({ id: "measure.guard.tui" })
│   ├── types.ts          # copy of mods/measure-guard/types/index.d.ts (no `declare module` block)
│   └── core/
│       ├── parse.ts      # copy of mods/measure-guard/hooks/parse.ts
│       └── guards.ts     # copy of mods/measure-guard/hooks/guards.ts
├── index.ts              # server entry (re-exports src/index.ts); the host resolves <folder>/index
├── tui.ts                # terminal entry (re-exports src/tui.tsx); the host resolves <folder>/tui
├── commands/             # markdown commands installed into ~/.config/opencode/commands
├── scripts/check-parity.sh
└── tests/                # bun test
```

## Install

The plugin host of OpenCode 2.0.32 loads a folder under `~/.config/opencode/plugins/` through the files `<folder>/server` or `<folder>/index` (the server plugin) and `<folder>/tui` (the terminal plugin). It does not read `package.json` exports for a local folder, so the package keeps `index.ts` and `tui.ts` at its root. The install is one copy:

```
~/.config/opencode/plugins/opencode-measure-guard/   # this folder without tests/ and node_modules/
```

The service log (`~/.local/share/opencode/log/opencode.log`) shows `loading plugin id=.../plugins/opencode-measure-guard entrypoint=.../opencode-measure-guard/index` after the copy; the service watches the files and reloads them on change. OpenCode provides `@opencode/plugin` at runtime, so the copy needs no `bun install`.

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
- **Task note after a call.** The `execute.after` hook appends the task note to the result of a shell call or of a write inside `measure/` when the track or the task changed.
- **TDD guard (strict).** A write of a source file inside the project and outside `measure/` passes only when, for the `[~]` task, a test file changed and a test command failed. The `execute.after` hook keeps that Red state per session: a completed write of a test file (`*.test.ts`, `test_*.py`, `*_test.go`, and similar), and a test command (`bun test`, `npm test`, `pytest`, `go test`, and similar) that failed by an `error` status or by `metadata.exit` not 0. Markdown, JSON, and other data files pass. A new `[~]` task starts from an empty Red state.
- **Commit guard (strict).** A `shell` command with `git commit` is denied when its message (`-m`, `--message`, or a heredoc) is not in the format `<type>(<scope>): <description>`, or when the commit takes files outside `measure/` while no task has `[~]`. The files come from `git diff --cached --name-only`, plus the status paths for `-a` or a `git add` in the same command. A message the guard cannot read (`-F`, a variable, the editor) passes with a note. An allowed commit of a `[~]` task gets `commitReminder(sha)` on its result: the git note and the SHA in `plan.md`. The SHA comes from the `[<branch> <sha>]` line of the output.
- **Where notes go.** The shell tool of OpenCode 2.0.32 carries its text in `result.content` and leaves `output` empty, so notes go into `content` (a string or a text part), into a string `output` too, and into a new `content` string when both are empty.

Known limits of the strict guards: a test run inside a script the guard does not recognise as a test command (for example `make check`) leaves the Red state empty; the bypass (`/measure-off`) is the way out. A commit made by a tool other than `shell` (an MCP git tool) is not checked. The Red state lives in memory and is per session; a restart of the service starts it again.

Live check (Task 4.4, OpenCode 2.0.32, model `coding-plan/glm-5.3-flash`): a `write` of `hello.txt` in a project with no `[~]` task failed with `measure-guard: no task in the track "..." is in progress. Mark the next task ...`, the file was not created, and the agent quoted the deny text.

## End of turn

The `prompt` hook records the turn start: the `git status --porcelain` lines and the `[x]` tasks without a SHA. The plugin watches `ctx.event.subscribe()` for the turn-end events `session.execution.succeeded`, `session.execution.failed`, and `session.execution.interrupted` (OpenCode 2.0.32 delivers these durable events to a plugin; the ephemeral `session.idle` never arrived in the live check, it is accepted too, and two events within one second count as one). On that event it computes the problems from the status lines at idle and the fresh snapshot (`turnProblems()` of the core): a `[x]` task that lost its SHA during the turn, or files changed outside `measure/` while no task has `[~]`. The problems go to the state file every time, also when the list is empty.

What happens then depends on the mode:

- **advise**: nothing more.
- **guard**: a synthetic message with the problems goes into the session (`ctx.session.synthetic` with `resume: false`, so the agent does not start a new loop on it); OpenCode delivers it with the next user prompt. When the synthetic call fails, the same reminder rides on the next prompt text instead.
- **strict**: a follow-up prompt with the problems (`ctx.session.prompt`) keeps the agent working, at most `MAX_BLOCKS` (2) times per user turn; then the reminder as in guard mode.

The difference to the Claude Code mod: the mod blocks the Stop hook and holds the turn open; OpenCode has no hook that keeps a turn open, so strict mode sends a new prompt instead. Each follow-up ends in a new turn-end event, which counts on the same turn until a user prompt starts the next one. The bypass skips the check. Every plugin instance (one per project directory) sees every event; the check does nothing for a session whose prompt hook did not run in that instance.

Live check (Task 6.3): a file created during a turn in guard mode gave the synthetic message `measure-guard: at the end of the last turn, these problems were open: - Files changed outside measure/ while no task is in progress: stray.txt. ...` and the state file listed the same problem. Without `resume: false` the agent resumed on the message and removed the file by itself.

## Commands

The server plugin adds three commands through `command.transform`:

| Command | Effect |
| --- | --- |
| `/measure-off [repo]` | Turns the guards off for this session; with `repo`, for this repository (kept in the plugin storage across restarts). |
| `/measure-on [repo]` | Turns them on again for the given scope. |
| `/measure-guard` | Replies with the status lines: the tracks, the active task or the next action, the `[b]` count, and the guard state. |

A reply is a synthetic message with `resume: false`. OpenCode delivers it with the next user prompt, so the agent reads it at its next turn; the terminal band shows the bypass state at once through the state file. The command list of the service (`GET /api/command`) shows the three names.

The folder `commands/` holds the eight Measure workflow commands as markdown files for `~/.config/opencode/commands/`: `measure-setup`, `measure-new-track`, `measure-implement`, `measure-review`, `measure-status`, `measure-revert`, `measure-doctor` (each loads the `measure` skill and runs the named workflow from its `references/` folder with `$ARGUMENTS`), and `measure-orchestrate` (agent `measure-orchestrator`, loads the `measure-orchestrator` skill). The descriptions are quoted strings, because they hold a colon.

## Tool

`measure_status` (added through `tool.transform`, no parameters) returns the status lines and the task note as text, so an agent can ask for the plan position instead of reading `tracks.md` and `plan.md`. Live check: the model called it through OpenCode's code mode (`tools.measure_status()`) and quoted the tracks, the active track, and the next task.

## Checks

```bash
cd plugins/opencode-measure-guard
bun test                      # unit tests; no install needed
bun install && bun x tsc --noEmit -p .   # type check against the published @opencode/plugin types
```

`node_modules/` and `bun.lock` are not committed. OpenCode provides `@opencode/plugin`, `@opencode/plugin/tui`, `solid-js`, and the OpenTUI packages at runtime.
