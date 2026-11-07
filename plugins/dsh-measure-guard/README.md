# dsh-measure-guard

Measure guard rails for the DeepSeek Harness (DSH). This is the third adapter of the shared Measure guard core, after the Claude Code mod (`mods/measure-guard/`) and the OpenCode plugin (`plugins/opencode-measure-guard/`). It reads the project's `measure/` files, keeps the agent on the active track and task, and denies work the active plan does not cover. The Host half registers the system-prompt rule, the task note, the `measure_status` tool, the three commands, the edit, closeout and end-of-turn guards, and one JSON route; the Client half draws the status band and the Measure panel.

Track: [`measure/archive/dsh_measure_guard_20261107/`](../../measure/archive/dsh_measure_guard_20261107/) (specification, design, and plan).

## Layout

```text
plugins/dsh-measure-guard/
├── package.json              # name, exports, dsh.bundle.patch, dsh.client, engines.node
├── cordis.patch.yml          # the self-referencing insert row of a bundle install
├── index.js                  # Host half: export name, inject, apply; owns the state
├── client.js                 # Client half: hand-written window.__ModuleLoader__.load factory
├── icon.svg                  # the plugin icon of the Plugins page
├── locale/
│   ├── en.json               # {"meta":{"title","description"}} for the plugin display
│   └── zh.json               # the same metadata in Chinese
├── src/
│   ├── state.js              # the four state classes: repos, agents, turns, bypass
│   ├── snapshot.js           # the I/O seam, canonical root, snapshot loader, cache
│   ├── roots.js              # one writer per canonical root, the second-writer notice
│   ├── context.js            # rule section, task note, reminder, compaction re-note
│   ├── hooks.js              # decision map, tool guard, mutation normalization
│   ├── guard.js              # edit guard, closeout guard, end-of-turn check
│   ├── status.js             # measure_status text and the hand-built tool definition
│   ├── commands.js           # measure-off, measure-on, measure-status
│   ├── setup.js              # the shared setup symbols plus the agent-state helpers
│   ├── client-state.js       # the JSON view and the HTTP route the client polls
│   ├── types.ts              # parity copy of mods/measure-guard/types/index.d.ts
│   └── core/
│       ├── parse.ts          # parity copy of mods/measure-guard/hooks/parse.ts
│       └── guards.ts         # parity copy (+ .ts on its one value import)
├── scripts/check-parity.sh   # the three parity checks against mods/measure-guard/
├── tests/
│   ├── fixtures.js           # the in-memory project and the repository fixture
│   ├── core.test.js          # the shared core on the fixture, and the parity gate
│   ├── state.test.js         # repos.json, agents, turns, bypass, mode parsing
│   ├── snapshot.test.js      # the real repository, a temp repository, no measure/
│   ├── roots.test.js         # one writer, one second-writer notice, releases
│   ├── context.test.js       # rule section, exactly-once note, compaction, reminder
│   ├── status.test.js        # the status text and the tool definition
│   ├── commands.test.js      # the three commands and their scopes
│   ├── setup.test.js         # the setup question, the answers, the band text
│   ├── guard-prep.test.js    # the decision lifecycle and the fail-open paths
│   ├── mutation.test.js      # every tool shape and the multi-path denial
│   ├── edit-guard.test.js    # deny without [~], allow with [~], allow list, bypass
│   ├── closeout.test.js      # track close, phase start, the after-text rules
│   ├── end-of-turn.test.js   # the problems, the strict hold, the reminder
│   ├── client-state.test.js  # the JSON route, the 404, the failure path
│   ├── client-bundle.test.js # the client text, its id, its surfaces
│   ├── plugin.test.js        # the Host registrations of index.js
│   └── install.sh            # the installer target contract (bash)
└── README.md
```

No build step, no package manager, and no `node_modules`: `index.js` and `client.js` are plain ESM at the package root, `client.js` is served as bytes, and the `.ts` core is loaded by Node's built-in type stripping (Node >= 24.9).

## Install

### a. The environment CLI (preferred)

From the repository root:

```bash
bin/measure-dsh install
```

It copies this package (everything except `tests/`) into
`<dsh-home>/profiles/<profile>/plugins/dsh-measure-guard` with a stamp, writes
one marker-managed row into the profile's `cordis.patch.yml`, and verifies the
result. `--profile`, `--dsh-home`, `--mode`, `--source`, and `--ref` are
documented in [`docs/dsh.md`](../../docs/dsh.md); `bin/measure-dsh --check`
verifies an install and `bin/measure-dsh uninstall` removes the row and the copy
it owns. The row loads both halves: the Client half is found through the nearest
`package.json`.

### b. Without the installer

Clone this repository and point one profile row at an absolute path, exactly like the live check did:

```yaml
- insert:
    - id: measure-guard
      name: /home/daniel-bo/Desktop/measure/plugins/dsh-measure-guard/index.js
      config:
        mode: guard
```

No pnpm and no `node_modules` are needed on this route either.

### c. A real bundle install (needs pnpm)

From the repository root:

```bash
dsh plugin --profile web add ./plugins/dsh-measure-guard
```

The profile manifest then lists `dsh-measure-guard`, and the Plugins page shows its title and icon instead of the technical path.

The live check of this repository used route (b) with `mode: advise`. The default mode is `guard`.

## Modes

`config.mode` sets the default level. The plugin validates the value itself: `advise`, `guard`, or `strict`; an unknown value logs one warning and falls back to `guard`.

The **effective** mode of a repository is: the persisted per-repository override
> the in-memory session override > `config.mode`. `/measure-mode <advise|guard|strict>` sets the session override, `/measure-mode <mode> repo` persists the repository override, `/measure-mode default` and `/measure-mode default repo` clear them, and `/measure-mode` with no argument reports the effective mode and its source. Every guard path reads the effective mode per call, the state route carries `mode: { value, source }`, the band shows a localized mode label, and the status text appends `Mode: <value> (<source>)`.

| Mode | Behaviour |
| --- | --- |
| `advise` | The context layer and the band only. Every guard allows. |
| `guard` (default) | The edit guard, the closeout guard, and the end-of-turn check with a UI notice and an agent reminder delivered by the next step. |
| `strict` | `guard`, plus the end-of-turn hold-open at most twice per turn, the TDD guard, and the commit guard with its post-commit reminder. |

## Context

- **Rule section.** One fixed system-prompt section, registered through `ctx.systemPrompt.section({ name: 'measure:rule', order: 5000, text })`, with the shared core's `ruleSection()` text. The text never changes in a session, so the prompt cache stays valid. The section exists only for an agent whose project has a `measure/` folder.
- **Task note.** The shared core's `taskNote()` text, delivered exactly once per task change as `{ kind: 'enter', messages }` returned from `agent/pre-step`. It is not sent through `agent.inject()`, because an injection can miss a step. The note names the active track and the current task, or the next task when none is in progress.
- **Re-note after compaction.** A successful `compaction/end` arms the note again, so the first step after the compaction receives it. A compaction with an error keeps the current note key.
- **Second-writer warning.** The first root session of a canonical root is the writer. A second distinct root session in the same work tree gets exactly one injected note: `measure-guard: 2 sessions are working in this git worktree. measure-guard only warns; it does not arbitrate between them.` A second distinct root session also adds the adapter's own suffix to the band: `<n> sessions` (FR-12). The rest of the band line is the shared core's, including the number of tracks in progress and the bypass state. A child agent (a subagent, teammate, or fork under an owner) inherits the rule section and every guard, but it never claims a writer slot and never counts as a session: `ctx.agents.roots()` names the live top-level agents, and only those claim.
- **Setup offer.** In a git repository without `measure/` folder, the first blocked edit returns the shared core's setup deny, and the band offers the two actions "Set up Measure" and "Turn off for session". A click posts to `POST /measure-guard/setup`; the answer lives in the agent state, so it is remembered for the session. `off` makes the edit guard pass and hides the offer; `setup` records the request, delivers the shared core's setup prompt to the agent once, and the band shows "Measure · setup requested.". A denied edit with no button click still records `off` once, as before.

## Tools and commands

- **`measure_status`.** A tool with no parameters. It returns the shared core's status lines: the tracks with their markers, the active plan path, each phase with its closed count and checkpoint SHA, the `[b]` tasks, the allow list, and the bypass state, followed by the task note (the active track with the current or the next task). It never returns the whole specification.
- **Commands.** Four host commands, each registered through `ctx.commands.register`; the first three take an optional `repo` argument that widens the scope from the session to the repository:

  | Command | Effect |
  | --- | --- |
  | `measure-off [repo]` | Turns the guards off for this session, or for this repository (kept across restarts). |
  | `measure-on [repo]` | Turns them on again for the same scope. |
  | `measure-status` | Replies with the status text of the current project. |
  | `measure-goal` | Seeds a DeepSeek Harness goal from the active Measure track, replaces a complete goal, or reports the current goal without mutating it. |
  | `measure-mode` | Reports, sets, or clears the effective guard mode for this session or the repository (see Modes). |
  | `measure-verify` | Read-only: verifies the active plan's commits, git notes, and `metadata.json` `actual_tasks` and reports the problems (or a clean count). |

- **Workflow commands.** Eight more host commands steer the receiving agent into
  the matching Measure workflow: `measure-setup`, `measure-new-track`,
  `measure-new-track-set`, `measure-implement`, `measure-review`,
  `measure-revert`, `measure-doctor`, `measure-orchestrate`. Each one resolves
  the installed skill reference first, then sends one instruction message; the
  rest of the command line is forwarded as `Arguments:`. `/measure-orchestrate`
  loads the `measure-orchestrator` skill.
- **Goal line and binding (Story S4).** The state route carries `goal: { objective, phase, round, maxRounds } | null`; the band adds a localized goal row, the `measure_status` text and the panel append `Goal <phase> · round <n>/<max> · <objective>`. `/measure-goal` creates a goal with the objective `Measure track "<track name>" (<track id>).` when there is none (or the current goal is complete, which the goal service allows replacing), reports `active`/`paused`/`blocked` goals with the matching guidance, and reports a refusal from the goal service instead of throwing. The goal service is read per call (`ctx.get('goals')`, not `inject`), so a goal service that registers later is still seen. The end-of-turn check reports two mismatches: a complete goal while a task is `[~]`, and any current goal while no track is in progress.
- **Agent-team rehearsal (reference, not a command).** `tests/dsh/rehearsal/make-project.sh` builds a disposable Measure project, and section 10 of `skills/measure-orchestrator/references/dsh.md` documents the Red/Green/Review protocol. A `subagent`'s `cwd` changes its shell directory but not its guard root (the child is guarded against the parent session's repository), so a disposable-project rehearsal needs a session whose working directory is that project (open it through the host session RPC with `{ cwd }`; the authenticated GUI page context can issue the calls, and `tests/dsh/rehearsal/host-api.mjs` is the operator form). The strict deny was proven this way (evidence under `measure/runs/dsh_measure_isolated_session_20261107/`).
- **Client decoration.** The Client half decorates `measure-status` with a `commandUi` action that opens the Measure panel. The trigger is consumed by the action, so a bare invocation spends the command line and submits nothing to the model.

## Guards

All decisions come from the shared core; the adapter only normalizes the call and prepares the texts the core reads.

- **Edit guard.** In `guard` and `strict`, a write inside the project root and outside `measure/` is denied when no task in the active plan has `[~]`. The deny text names the next task, or the track, and ends with the shared bypass line: `If this block is wrong, the user can run /measure-off.` A write inside `measure/` passes, a path on the allow list passes, a parse error allows everything, and the deny lists every denied path of a multi-path call (up to five, then "and N more").
- **Closeout guard.** A track may change to `[x]` only when its plan has no open task; the deny names the open tasks and says that a human-gated task can stay `[b]` with a `deferred:<owner>` field. A task in phase N+1 may change to `[~]` only when the heading of phase N carries `[checkpoint: <sha>]`. Closing a track also checks its `metadata.json` (Story S2): the file must exist and be valid JSON, and its `actual_tasks` must equal the plan's `[x]` count; the deny names both numbers.
- **TDD guard (strict).** A source file of the project, outside `measure/` and off the allow list, is denied for the active `[~]` task until the task's Red phase is complete: a test-file write succeeded and a test command ran and failed. The Red record is kept per agent and keyed by the track id plus the task text, so a new task resets it. The deny text is the shared core's `tddDecision` text and names the missing steps. `advise` and `guard` allow the edit.
- **Commit guard (strict).** A `git commit` whose message is not `<type>(<scope>): <description>` is denied with the shared core's text. A commit whose staged files include a path outside `measure/` while no task is `[~]` is denied and the deny text lists the paths; a commit that takes changes (`-a`, or a `git add` earlier in the command) also counts changed and untracked paths. A message the adapter cannot read (`-F`, a variable, the editor) is allowed with a note instead of a deny. The `git add` arguments in the same command are read with a shell-word tokenizer (quoted and escaped paths are exact; `--` ends the options), so the added paths cannot hide behind quoting; an unterminated quote fails closed, a backslash-newline continuation and quoted separators are handled, and a wrapper script or a command substitution can still hide what it adds (a bounded parser, not a shell). After a successful commit for a `[~]` task the tool result carries the core's `commitReminder`: the git note and the 7-character SHA step.
- **Shell-write guard (Story S3).** A bash command's write targets are extracted within a bounded grammar: `>`/`>>` redirection, `tee` arguments, and `sed -i` file arguments (stream devices, `>&` duplications, options, and sed scripts are not targets). A relative target resolves against the Session-effective directory; a target inside the project goes through the shared `editDecision` and, in strict mode, `tddDecision`. A write to `measure/tracks.md` or a `measure/**/plan.md` is denied with the "use edit or write" text because the closeout guard cannot read it. Every other command is allowed and the end-of-turn check is the backstop.
- **Unreadable-tool registry deny (Story S3).** `apply_patch` and `str_replace_editor` carry no reconstructable after-text, so writing `measure/tracks.md` or a `measure/**/plan.md` through them is denied with the same text; other files keep the fail-open behavior.
- **End-of-turn check.** The baseline is `git status` at the first `agent/pre-step` of the turn; the problems are computed at `agent/turn-stopping`. The problems are files changed outside `measure/` while no task is `[~]`, `[x]` tasks that lost their SHA, and (Story S2) git-backed failures: a cited SHA that no commit owns, or a commit with no git note. The git probes are tri-state: `git rev-parse --verify --quiet <sha>^{commit}` (exit 0 = a real commit, exit 1 = missing or not a commit, anything else = git cannot answer and the check fails open) and `git notes show <sha>` (exit 1 = no note). `advise` shows them in the band only, `guard` records them (the band shows them as problem rows) and queues a reminder that the next step delivers, and `strict` holds the turn open by steering, at most twice per turn.
- **Allow list.** `measure/guard-allow` in the guarded repository names the folders that count as Measure work. It is parsed by the shared core's `parseAllowList` and matched by `isAllowed`, with the same rules as the two existing adapters.
- **Fail-open policy.** Every guard preparation wraps its I/O in try/catch and allows the call on failure. A parse error in the Measure files allows everything. A shell call (`bash`, `pwsh`) has unknown paths, so the edit guard does not path-check it and the end-of-turn check is its backstop. A tool whose after-text cannot be reconstructed (`apply_patch`, `str_replace_editor`) passes the closeout guard and is covered by the end-of-turn check.

## State and root resolution

- **Repository config.** `~/.local/state/measure/dsh-guard/repos.json` holds `{ "<realpath root>": { mode?, off? } }`: the mode override and the repository bypass. It is read once and written atomically through a temp file and a rename. This is the only state that survives a restart.
- **In-memory state.** The per-agent record (note key, setup answer, reminder, problems) and the per-turn record (baseline status, tasks without a SHA, block count) live in memory and are dropped when the agent is disposed. The end-of-turn baseline is captured once, at the first step of the turn.
- **Root.** The session working directory is read per call, resolved to a realpath with `ctx.fs.resolve`, and then replaced by the output of `git rev-parse --show-toplevel`, realpathed again. When git fails or the directory is not a work tree, the realpathed effective directory is the root. Linked worktrees are independent: each has its own root, its own snapshot cache entry, and its own writer record.
- **Path arguments.** A relative file argument is resolved against the session-effective directory per call, never against the process working directory. A durable directory change mid-turn is honoured on the next call.
- **Registry shapes.** The shared parser reads both live `tracks.md` shapes: the bold title with its `*Link:*` on one of the next three lines (this repository's shape), and the Mediarr execution-order shape with an ordered-list prefix (`1. - [~] **Track: …**`) and `*Phases: … | Link: […]()*` on the same line. A line in neither shape is reported as a parse error and the guards fail open.

## Client surface

- **Band.** A session-scoped entry in the `conversation.input.dock` slot, registered with the id `measure-guard` and order 20. It polls the Host route every 2 s while it is mounted and renders the band line (with the `<n> sessions` suffix when a second session shares the work tree), the bypass state, the effective mode, the DSH goal row, the setup actions while the offer has no answer, and the open problems. The band line is **compact**: the view caps it at `BAND_MAX = 160` characters on a word boundary with a trailing `…` (`band`), while `bandFull` carries the complete position text as the row's hover title. The row never wraps and the primary span ellipsizes, so a long task title cannot eat the composer's vertical space. The full position text is available through the hover title (`bandFull`) and in `measure_status`; the sidebar panel shows the status lines and the goal line, not the active task text.
- **Panel.** The keyed `main` slot with the key `measure`, paired with the `sidebar.panellist` entry with the id `measure` and its own icon. It is root-scoped: it lists the sessions from `ctx.sessions.list` and shows the status text of the selected one.
- **Command decoration.** `ctx.commandUi.decorate({ name: 'measure-status', ui: { kind: 'action' } })` opens the panel through `ctx.layout.selectPanel('measure')`.
- **Data route.** `GET /measure-guard/state?sessionId=<id>` returns `{ band, bandFull, status, guardsOff, problems, updatedAt, goal, mode, setup }`. An unknown session id is a 404. The band and the panel read the same route, so the Client never parses the Measure files itself.
- **Styling.** Theme tokens only (`--dsw-alias-*`, `--dsw-radius-*`); no hard-coded colours.
- **Localization boundary.** The plugin's own chrome is localized in English and Chinese: the band labels, the panel headings and rows, the command descriptions, and the setup line. The parity-bound core text (the deny texts, the task note, the status lines, the end-of-turn reminder) ships in English by design, because a translation layer would break the core parity.

## Parity rule

The shared core stays the single decision source. Change the Claude Code mod first, then copy:

1. `src/core/parse.ts` is byte-identical to `mods/measure-guard/hooks/parse.ts`.
2. `src/core/guards.ts` is identical after exactly one mechanical transform: its only extensionless value import `./parse` gains `.ts`, which Node ESM needs.
3. `src/types.ts` is `mods/measure-guard/types/index.d.ts` without its `declare module 'claude-code'` block, plus the DSH header note.

```bash
bash plugins/dsh-measure-guard/scripts/check-parity.sh
```

The script prints `parity: ok` and exits 0, or names the file that differs and exits 1.

## Checks

```bash
node --test 'plugins/dsh-measure-guard/tests/*.test.js'
bash plugins/dsh-measure-guard/scripts/check-parity.sh
bash tests/dsh/run.sh
```

From the package folder, `node --run test` runs the first two. The installer test uses a temporary home folder and never touches the real one.

The live check reads the JSON route of the running GUI:

```bash
curl -D - 'http://127.0.0.1:3080/measure-guard/state?sessionId=<id>'
```

The response carries two identity headers: `x-measure-guard-module` names the
loaded module's path, and `x-measure-guard-digest: sha256:<hex>` is the digest
of the code bytes the running instance loaded. The digest is captured once, at
module evaluation (`src/digest.js`), so a Host that still runs an older instance
answers with the old digest. `bin/measure-dsh --check --live` compares it with
the source digest: a mismatch is FAIL (stale plugin code), an absent header is
WARN (a pre-digest instance), and a match is PASS. The remediation is
`bin/measure-dsh reload`, which increments the managed entry's `reloadNonce`
config value in the profile's `cordis.patch.yml` (every other YAML line is
unchanged) so the composed configuration changes and the running profile
recomposes and re-reads its caches. The plugin accepts and ignores the
`config.reloadNonce` field; a YAML comment would not work because it changes no
composed configuration. `install` increments the same field when the managed
block is unchanged.

Current state: the test count and the contract suite are in [CHANGELOG.md](../../CHANGELOG.md); the environment CLI's contract tests are `bash tests/dsh/run.sh`.

## Verified live

The live check ran in the running DSH web profile with one reversible insert row in `~/.dsh/profiles/web/cordis.patch.yml` and `mode: advise`. It proved:

- the boot graph carries a `dsh-measure-guard` entry, so the Host half loaded and the modules node half resolved the nearest `package.json` to serve the Client half;
- the band renders the shared core's band line, `Measure · measure-guard for the DeepSeek Harness · Phase 4/5 · Task 4/5 [ ] Task 4.4: Live load check · no task in progress`;
- the sidebar entry opens the keyed `main` panel `measure`, which lists the sessions and renders the status of the selected one, with the guards state and the active plan with its checkpoint SHAs;
- the session context carries the fixed `# Measure workflow (measure-guard)` rule section, the task note naming the next task, and the second-writer warning;
- `measure_status` appears in the tool schemas of the session;
- a real parse error fails open: a `measure/` folder whose track lines are in no known format produced `cannot read the Measure files: ... has track lines in no known format · guards allow all calls` instead of a crash.

The evidence images are [`live-band.png`](../../measure/runs/dsh_measure_guard_20261107/live-band.png) and [`live-panel.png`](../../measure/runs/dsh_measure_guard_20261107/live-panel.png).

## Known limits

- **Marker-only enforcement.** The plugin checks the `[ ]`, `[~]`, `[x]`, and `[b]` markers and the checkpoint headings. It does not verify a SHA, a git note, a `metadata.json` field, a generated document, or an archival step. A later task may start while an earlier one is still open, a checkpoint SHA may be fabricated, an `[x]` task may carry a SHA no commit owns, a commit may combine implementation and plan changes and skip the git notes, and a track may close without `actual_tasks` or generated-doc verification. The agent may also edit `measure/guard-allow` itself.
- **Shell writes are path-checked only within the bounded grammar.** `>`, `>>`, `tee`, and `sed -i` targets are checked; other write forms (a script's own file I/O, `cp`, `mv`, a nested shell) are not, and the TDD Red record still does not see shell-written test files. The end-of-turn check is the backstop.
- **A shell command that cannot be parsed adds no deny.** The grammar is deliberately bounded: unusual quoting, command substitution, or a write inside a helper script is allowed. This is a bypass reducer, not a shell parser.
- **A heredoc body is not parsed separately.** The grammar scans the whole command string, so redirect-looking text inside a heredoc (for example a document that quotes `> measure/tracks.md`) can trigger a deny. That is fail-closed; use `write`/`edit` for files whose content contains such examples.

- **The strict guards are name-based.** The TDD guard recognizes a test file and a test command by the shared core's name rules, and the commit guard recognizes the message format and the staged paths. A renamed test, an unusual runner, or a commit message built by a script can slip through; the end-of-turn check is the backstop.
- **Closeout for `apply_patch`/`str_replace_editor` is denied only on the registry files.** A write to `measure/tracks.md` or a `measure/**/plan.md` through those tools is denied (use `edit`/`write`); every other path keeps the fail-open behavior because no after-text can be reconstructed.
- **POSIX only.** Windows containment fails open and is out of scope.
- **The setup answer is per agent.** The choice lives in the agent state, so a new session in a repository without `measure/` asks again.
- **The setup answer is per agent.** A session that never clicks a button records `off` on its first blocked edit, exactly as before; a session that clicks "Set up Measure" gets the shared core's setup prompt once and the band's "setup requested" variant, and the setup workflow itself still runs through the `measure-setup` command/skill.
- **The writer count trusts `ctx.agents.roots()`.** A host whose registry cannot tell a root from a child (no `roots()` method, or a throwing call) falls back to counting every agent, so the pre-fix false positive can return there.
- **A path-form row shows the technical package id** in the Plugins page, because a row that names a file path has no display metadata. The bundle install shows the localized title and the icon.
- **The profile target spells the default `~/.dsh`.** A different `DSH_HOME` needs the row adjusted, or the bundle installed with `dsh plugin add`.

## Deferred

- Windows path support (POSIX only; the containment checks fail open there).

The strict-mode TDD and commit guards (FR-13) and subagent inheritance plus goal
binding (FR-14) are shipped by track `dsh_measure_evolve_20261107`.
