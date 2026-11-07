# Design Decisions: DSH Measure development environment

Track: `dsh_measure_dev_20261107`
Spec: [./spec.md](./spec.md)
Date: 2026-11-07 · Author model: deepseek-flash
Status: written before Phase 1 Red; this file closes every choice the plan must
not leave to the implementer.

## 1. File layout

```
bin/measure-dsh                              # the environment CLI (POSIX bash)
tests/dsh/run.sh                             # runner: every test-*.sh, then exit 0/1
tests/dsh/lib.sh                             # temporary world: fake HOME, DSH home, profile, git repo, installer stub
tests/dsh/test-install.sh                    # install idempotency, prerequisites, repair
tests/dsh/test-check.sh                      # every check item, green and red
tests/dsh/test-foreign-row.sh                # refusal and uninstall safety
tests/dsh/test-uninstall.sh                  # managed block and copy removal
tests/dsh/test-docs.sh                       # guide links, command names, role/model table
plugins/dsh-measure-guard/src/workflow.js    # the eight workflow commands + message texts
plugins/dsh-measure-guard/tests/workflow.test.js
skills/measure-orchestrator/references/dsh.md
docs/dsh.md
README.md, CHANGELOG.md                      # harness table + install/guide + entry
measure/tech-stack.md                        # distribution row + tooling exception row
```

`plugins/dsh-measure-guard/index.js` gains one import and one registration block
for the workflow commands (the file already owns the state and the guard).

## 2. `bin/measure-dsh` contract

```
measure-dsh install   [--dsh-home DIR] [--profile NAME] [--mode MODE]
                      [--ref REF] [--no-skills] [--dry-run]
measure-dsh --check   [--dsh-home DIR] [--profile NAME] [--source DIR]
                      [--live] [--session ID] [--json]
measure-dsh uninstall [--dsh-home DIR] [--profile NAME] [--prune] [--dry-run]
measure-dsh --help
```

- **Resolution.** `--dsh-home` beats `$DSH_HOME` beats `~/.dsh`. `--profile`
  defaults to `web`. The plugin source is `<repo>/plugins/dsh-measure-guard`
  where `<repo>` is the parent of the script's folder; `--source` overrides it
  for `--check`. `--mode` accepts `advise`, `guard`, `strict`; default `guard`.
- **Exit codes.** `0` all checks passed / install complete; `1` one or more
  checks failed / install incomplete; `2` usage error (bad flag, bad mode,
  `--session` without `--live`); `3` environment error (no DSH installation, no
  profile folder, unreadable patch file).
- **Output.** One line per item: `PASS <item>: <detail>`, `FAIL <item>:
  <detail>`, `WARN <item>: <detail>`, `SKIP <item>: <detail>`. `install` and
  `uninstall` print each action as `WRITE <path>` / `KEEP <path>` /
  `REMOVE <path>`. `--json` prints one JSON object with `ok`, `items[]`
  (`{ item, status, detail }`), and `actions[]`.
- **Flags.** `--dry-run` prints the actions and writes nothing. `--no-skills`
  skips the installer step. `--live` adds the route check (requires a running
  profile at the default port or `$DSH_WEB_URL`); `--session` names the session
  id for that check. `--prune` (uninstall) also deletes the installed plugin
  copy.
- **`install` order.** (1) prerequisites: Node >= 24.9, the profile folder
  exists, `plugins/dsh-measure-guard/index.js` exists; (2) foreign-row scan;
  (3) `mkdir -p <profile>/plugins`; (4) the skill step:
  `bin/install-measure-skill --ref <ref>` unless `--no-skills` (its exit code 2
  — local edits kept — becomes `WARN`); (5) managed block write; (6) summary
  and the restart note (the one operator action).
- **Skill step delegation.** `measure-dsh` never copies skill files; it runs
  the installer, which owns every skill target and the plugin target row
  `plugins/dsh-measure-guard -> <profile>/plugins/dsh-measure-guard`. The
  plugin copy therefore exists after step 4; `install` fails with a clear
  message when the installer could not write it (for example the row is absent
  from the selected ref).
- **Idempotency.** A second install with the same flags writes nothing
  different; the summary says `unchanged`. The only write is the patch file
  when its block text differs.

## 3. Managed block format

The script owns exactly one block, found by its marker lines:

```yaml
# >>> measure-dsh managed block (id: measure-guard) >>>
- insert:
    - id: measure-guard
      name: ./plugins/dsh-measure-guard/index.js
      config:
        mode: guard
# <<< measure-dsh managed block <<<
```

- Parsing is line-based: exactly one `>>>` marker, exactly one `<<<` marker
  after it. Zero markers appends the block after a blank line (creating the
  file when absent); two or more markers is a `FAIL`.
- The replacement is byte-surgical: text before `>>>`, the block, text after
  `<<<`; every other line of the file is preserved exactly.
- A **foreign row** is any line matching `^\s*-\s+id:\s*measure-guard\s*$`
  outside the managed block, or an `insert` row whose `name` mentions
  `dsh-measure-guard` outside it. `install` and `--check` refuse with the line
  number and the deletion hint; `uninstall` leaves it alone.
- Writes go to `<file>.measure-dsh.tmp`, then `mv` over the target; a failed
  step leaves the original intact. The file mode is preserved.
- The row's `name` is always the profile-relative
  `./plugins/dsh-measure-guard/index.js`, the `id` is always `measure-guard`,
  and the only config field is `mode`.

## 4. Check items

| Item | Source of truth | PASS when |
|---|---|---|
| `dsh-install` | `<dsh-home>/profiles/<profile>` exists; the `dsh` package resolves | the profile folder exists (the CLI path is optional: `SKIP` when `dsh` is not on PATH) |
| `node` | `node --version` | >= 24.9 |
| `skill-measure` | installed `<agentsHome>/skills/measure` (and `<claudeHome>/skills/measure` when it exists) | every file under `<repo>/skills/measure` exists in the installed copy; up to 10 missing are listed, then "and N more" |
| `skill-orchestrator` | same, for `skills/measure-orchestrator` | same rule |
| `plugin` | `<profile>/plugins/dsh-measure-guard/` | `index.js`, `client.js`, `package.json`, `cordis.patch.yml`, `src/`, `locale/`, `icon.svg` exist; `node --input-type=module -e "import('<plugin>/index.js')"` exports `name`/`inject`/`apply` |
| `record` | `<profile>/cordis.patch.yml` | exactly one managed block, `name` is `./plugins/dsh-measure-guard/index.js`, `id` is `measure-guard`, `mode` is one of the three values |
| `foreign-row` | the same file | no `measure-guard` row outside the block |
| `live` (with `--live`) | `$DSH_WEB_URL` or `http://127.0.0.1:3080` | `GET /measure-guard/state?sessionId=<id>` answers 200 with a `band` field; `SKIP` without `--live` |

A missing repository source turns the two skill completeness checks into
`SKIP` (nothing to compare) without failing. A missing skill root is `FAIL`.

## 5. Workflow commands (plugin)

`src/workflow.js` exports `WORKFLOWS` and `measureWorkflowCommands(deps)`:

| Command | Reference | Message verb |
|---|---|---|
| `measure-setup` | `references/setup.md` | Set up Measure in this project |
| `measure-new-track` | `references/new-track.md` | Create a new Measure track |
| `measure-new-track-set` | `references/new-track-set.md` | Create a Measure track set |
| `measure-implement` | `references/implement.md` | Implement the active Measure track |
| `measure-review` | `references/review.md` | Review a Measure track or change |
| `measure-revert` | `references/revert.md` | Revert Measure work |
| `measure-doctor` | `references/doctor.md` | Run the Measure doctor |
| `measure-orchestrate` | `references/../SKILL.md` (orchestrator) | Orchestrate the active Measure track |

Message template (one `UserMessage`, `source: { kind: 'measure-guard', form:
'instructions', summary: 'Measure <workflow>' }`):

```
Follow the Measure workflow "<workflow>". Load the `measure` skill and read
its `references/<file>.md`; then continue with that workflow. The source of
truth is measure/tracks.md and the active track's plan.md.
```

- Handler: `(invocation) => { ... }` receives the receiving `Agent`; guard
  rails run first (project has `measure/`, the reference file exists), then
  `invocation.agent.steer(newUserMessage(...))`, and return
  `{ kind: 'success', text: 'Starting the Measure <workflow> workflow.' }`.
- `measure-setup` skips the `measure/` guard.
- A missing reference file returns `{ kind: 'error', text: 'measure-guard: the
  installed measure skill is incomplete (missing references/<file>.md). Run
  bin/install-measure-skill.' }` and submits nothing.
- Definitions: one-line descriptions, registered next to the existing commands
  in `index.js`; no name collides with `measure` (the skill) or with
  `measure-status`/`measure-off`/`measure-on`.
- The reference file is located under `~/.agents/skills/measure` first, then
  `~/.claude/skills/measure`; existence is read with `node:fs/promises` (a
  trusted host read outside the workspace sandbox).

## 6. Orchestrator DSH reference

`skills/measure-orchestrator/references/dsh.md` (new) contains, in order: the
subagent tools and their arguments, the model families available in this
installation (from the profile `subagent-model-selection-settings`:
`deepseek-official/deepseek-flash`, `minimax-cn/MiniMax-M3.1-Flash`,
`xiaomi/mimo-v2.6-flash`, `xiaomi/mimo-v2.6-pro`, `kimi-coding/k3.1-pro`,
`kimi-coding/kimi-for-coding`), the role table (role -> prompt summary -> model
family), the independence and three-family review rule, the guard-marker
handoff (every role marks its task `[~]` and records the SHA), and the tool
restrictions per role. `skills/measure-orchestrator/SKILL.md` gains one bullet
in its contents list and one paragraph pointing at it. The file marks every
claim that was not verified against the installation.

## 7. Test matrix

| Phase | Normal | Edge |
|---|---|---|
| 1 | `install` into a temp world writes the block and the copy; second run unchanged; `--dry-run` writes nothing | no profile folder -> exit 3; bad mode -> exit 2; installer exit 2 -> WARN |
| 1 | `--check` green after install | missing plugin copy -> FAIL; missing block -> FAIL; two blocks -> FAIL; incomplete skill copy -> FAIL listing files; no source -> SKIP |
| 1 | `uninstall` removes block + copy; foreign row survives | hand-written row -> install and check refuse, file byte-identical; `uninstall` keeps it |
| 1 | atomic write preserves the rest of the file | patch file without trailing newline; read-only profile -> exit 3, original intact |
| 2 | all eight commands registered with descriptions | name list exact; no duplicate registration |
| 2 | each handler steers one message with the right reference | project without `measure/` -> error + no steer; missing reference -> error + no steer; `measure-setup` works without `measure/` |
| 3 | reference and guide links resolve | every command and every model id in the guide exists in the profile patch |
| 4 | README names DSH; CHANGELOG entry present | tech-stack rows present; guide links resolve from README |
| 5 | live install from the profile copy; route answers; band shows the track; commands in the catalog | mode change is reflected in the record check; restart note printed |

## 8. Live migration of this workstation

The current profile has a hand-written `id: measure-guard` block (absolute path,
`mode: advise`) from the guard track's live check. The migration is:
`bin/install-measure-skill --ref HEAD` (the installer from this branch installs
the plugin copy and the skills), delete the hand-written block, then
`bin/measure-dsh install --ref HEAD --mode guard` writes the managed block. The
new `name` is a different module URL, so a profile reload imports the installed
copy without a host restart; the host restart is still required for later host
code edits (printed by the checklist). Guard mode is installed only after the
track's own plan has a `[~]` task, so the session can keep writing.

## 9. Verification commands

```
bash tests/dsh/run.sh
node --test 'plugins/dsh-measure-guard/tests/*.test.js'
bash plugins/dsh-measure-guard/scripts/check-parity.sh
bin/measure-dsh --check
bin/measure-dsh --check --live --session <id>
```
