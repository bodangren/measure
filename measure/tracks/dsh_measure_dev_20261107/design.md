# Design Decisions: DSH Measure development environment

Track: `dsh_measure_dev_20261107`
Spec: [./spec.md](./spec.md)
Date: 2026-11-07 · Author model: deepseek-flash
Status: written before Phase 1 Red, revised after the three-family spec review.

## 0. Ownership decision (one writer per artefact)

| Artefact | Writer | Note |
|---|---|---|
| Skill copies (`~/.claude/skills/measure`, `~/.agents/skills/measure`, `measure-orchestrator`) | `bin/install-measure-skill` | the installer stays the only skill writer (NFR-3); `measure-dsh` only runs it and verifies it |
| Plugin copy under the profile | `bin/measure-dsh` | it must honour `--dsh-home` and `--profile`, which the installer's fixed target cannot express |
| Profile patch block | `bin/measure-dsh` | marker-managed; no other writer |

The installer's DSH plugin row is therefore **removed** from
`bin/install-targets.tsv` in this track (the CLI owns that copy), and the guard
plugin's installer-contract test `plugins/dsh-measure-guard/tests/install.sh` is
replaced by the CLI contract tests in `tests/dsh/`. The guard plugin README and
the tech-stack row are updated to name `bin/measure-dsh` as the DSH installer.

## 1. File layout

```
bin/measure-dsh                              # the environment CLI (POSIX bash)
tests/dsh/run.sh                             # runner: every test-*.sh in order, exit 0/1
tests/dsh/lib.sh                             # temporary world: fake HOME, DSH home, profile, git repo, installer stub
tests/dsh/test-install.sh                    # install, idempotency, dry-run, prerequisites
tests/dsh/test-check.sh                      # every check item, green and red
tests/dsh/test-foreign-row.sh                # refusal and uninstall safety
tests/dsh/test-uninstall.sh                  # managed block + owned copy removal, keep-copy
tests/dsh/test-atomic-write.sh               # byte-preserving replacement, no trailing newline, read-only target
tests/dsh/test-reference.sh                  # the orchestrator DSH reference (Phase 3)
tests/dsh/test-docs.sh                       # guide links, command names, model ids (Phase 4)
plugins/dsh-measure-guard/src/workflow.js    # the eight workflow commands and message texts
plugins/dsh-measure-guard/tests/workflow.test.js
plugins/dsh-measure-guard/tests/plugin.test.js   # extended: eleven commands
skills/measure-orchestrator/references/dsh.md
docs/dsh.md
bin/install-targets.tsv                      # the DSH plugin row is removed
README.md, CHANGELOG.md, measure/tech-stack.md
```

## 2. `bin/measure-dsh` contract

```
measure-dsh install   [--dsh-home DIR] [--profile NAME] [--mode MODE]
                      [--ref REF] [--no-skills] [--dry-run]
measure-dsh --check   [--dsh-home DIR] [--profile NAME] [--source DIR]
                      [--live] [--session ID] [--json]
measure-dsh uninstall [--dsh-home DIR] [--profile NAME] [--keep-copy] [--dry-run]
measure-dsh --help
```

- **Resolution.** `--dsh-home` beats `$DSH_HOME` beats `~/.dsh`. `--profile`
  defaults to `web`. The plugin source is `<repo>/plugins/dsh-measure-guard`
  where `<repo>` is the parent of the script's folder; `--source` overrides it
  for `--check` and for the copy `install` makes. `--mode` accepts `advise`,
  `guard`, `strict`; default `guard`. The skills are installed to the agents
  and Claude homes resolved like `dsh-agent-instructions` does:
  `$DSH_AGENTS_HOME` else `~/.agents`, and `~/.claude`.
- **Exit codes.** `0` all checks passed / install complete; `1` one or more
  checks failed / install incomplete; `2` usage error (bad flag, bad mode,
  `--session` without `--live`); `3` environment error (no profile folder, an
  unreadable patch file, a failed prerequisite).
- **Output.** One line per item: `PASS <item>: <detail>`, `FAIL <item>:
  <detail>`, `WARN <item>: <detail>`, `SKIP <item>: <detail>`; actions as
  `WRITE <path>`, `KEEP <path>`, `REMOVE <path>`. `--json` prints one object
  with `ok`, `items[]`, `actions[]`.
- **`install` order.** (1) prerequisites: Node >= 24.9, the profile folder
  exists, the plugin source has `index.js` and `package.json`; (2) foreign-row
  scan; (3) `mkdir -p <profile>/plugins`; (4) the skill step unless
  `--no-skills`: `bin/install-measure-skill --ref <ref>` (the installer resolves
  the real `$HOME`, so the CLI does not redirect it; the step is skipped with
  `WARN` when the installer is absent). Its exit code 2 (local edits kept)
  becomes `WARN`; any other non-zero becomes `FAIL`; (5) copy the
  plugin source (everything except `tests/`) into
  `<profile>/plugins/dsh-measure-guard/` and write the stamp; (6) write or
  replace the managed block; (7) print the checklist, the restart note, and
  anything the operator must do.
- **Idempotency.** A second install with the same flags compares every file and
  the block text; it writes only what differs and the summary says `unchanged`
  when nothing did.
- **`--dry-run`** prints the actions it would take and writes nothing.
- **`uninstall`** removes the managed block and the plugin copy
  `<profile>/plugins/dsh-measure-guard/` it owns by default; `--keep-copy`
  keeps the copy; it never removes a foreign row and never touches the skills.
  After removal the patch file must still be a valid top-level array: when only
  comments and blank lines remain, the CLI writes `[]` as the file content (a
  comments-only YAML document parses as null and would fail composition).
  Non-zero only when an owned item could not be removed.
- **Copy stamp.** `<profile>/plugins/dsh-measure-guard/.measure-dsh-install`
  with a header line `# measure-dsh install stamp v1` and one
  `file <sha256>  <relpath>` line per copied file. The CLI owns this stamp; a
  user-edited file (hash differs from the stamp) is kept with `WARN`, matching
  the installer's local-edit policy.

## 3. Managed block format

```yaml
# >>> measure-dsh managed block (id: measure-guard) >>>
- insert:
    - id: measure-guard
      name: ./plugins/dsh-measure-guard/index.js
      config:
        mode: guard
# <<< measure-dsh managed block <<<
```

- Exactly one `>>>` marker and one later `<<<`; zero markers appends the block
  after a blank line (creating the file when absent); two or more is `FAIL`.
- Replacement is byte-surgical: text before `>>>`, the block, text after
  `<<<`; every other line is preserved exactly, including a missing trailing
  newline (it is normalised once, and the summary says so).
- A **foreign row** is any non-comment line outside the block that mentions the
  guard id or package in a YAML key: the rule matches
  `(^|[\[{,]\s*)id\s*:\s*['"]?measure-guard['"]?` (block and flow mappings,
  quoted or plain) or `(^|[\[{,]\s*)name\s*:\s*['"]?[^'"#\n]*dsh-measure-guard`
  (plain, single- or double-quoted). Comment lines are ignored. `install` and
  `--check` refuse with the line number and the deletion hint; `uninstall`
  leaves the row alone.
- Writes go to `<file>.measure-dsh.tmp` and are renamed over the target; a
  failure leaves the original untouched and the file mode is preserved.
- The row is always `id: measure-guard`, `name:
  ./plugins/dsh-measure-guard/index.js`, and only `config.mode` varies.

## 4. Check items

| Item | Source of truth | PASS when |
|---|---|---|
| `dsh-install` | `<dsh-home>/profiles/<profile>` exists | the profile folder exists |
| `node` | `node --version` | >= 24.9 |
| `skill-measure` | installed skill roots (below) | every file under `<repo>/skills/measure` exists in the installed copy; up to 10 missing names are listed, then "and N more"; a missing installed root is `FAIL`; no repository source is `SKIP` |
| `skill-orchestrator` | the same rule for `skills/measure-orchestrator` | the same rule |
| `plugin` | `<profile>/plugins/dsh-measure-guard/` | `index.js`, `client.js`, `package.json`, `cordis.patch.yml`, `src/`, `locale/`, `icon.svg` exist; the stamp lists exactly the copied files with matching hashes; `node --input-type=module -e "import('<plugin>/index.js')"` prints/exports `name`, `inject`, `apply` |
| `record` | `<profile>/cordis.patch.yml` | exactly one managed block; `id: measure-guard`; `name: ./plugins/dsh-measure-guard/index.js`; `mode` in the three values |
| `foreign-row` | the same file | no `measure-guard` row outside the block |
| `live` (with `--live`) | `$DSH_WEB_URL` or `http://127.0.0.1:3080` | the session id is `--session`, else `$DSH_SESSION_ID`, else the item is `SKIP` with the hint; `GET /measure-guard/state?sessionId=<id>` answers 200 with a `band` field |

**Skill roots.** One resolution order, first existing root wins per skill:
`<agentsHome>/skills/<name>` (agents home = `$DSH_AGENTS_HOME` else `~/.agents`),
`<dshHome>/skills/<name>`, `<cwd>/.dsh/skills/<name>`,
`<cwd>/.agents/skills/<name>`, `~/.claude/skills/<name>`. Real paths are
de-duplicated (`~/.agents/skills` may be a symlink to `~/.claude/skills`), so a
symlink never makes the same directory pass twice. `--check` reports the
resolved root for each skill.

**Why not the installer's `--check`.** `bin/install-measure-skill --check`
compares against a git ref (default `main`), which is exactly right for the
cron-installed copies and wrong for "the working tree I am developing is
complete in the installed copy". The CLI is read-only here, so it does its own
file walk; the installer remains the only writer, as NFR-3 says.

## 5. Workflow commands (plugin)

`src/workflow.js` exports `WORKFLOWS`, `resolveSkillFile(deps, skill, relPath)`
and `measureWorkflowCommands(deps)`:

| Command | Reference | Message verb |
|---|---|---|
| `measure-setup` | `measure/references/setup.md` | Set up Measure in this project |
| `measure-new-track` | `measure/references/new-track.md` | Create a new Measure track |
| `measure-new-track-set` | `measure/references/new-track-set.md` | Create a Measure track set |
| `measure-implement` | `measure/references/implement.md` | Implement the active Measure track |
| `measure-review` | `measure/references/review.md` | Review a Measure track or change |
| `measure-revert` | `measure/references/revert.md` | Revert Measure work |
| `measure-doctor` | `measure/references/doctor.md` | Run the Measure doctor |
| `measure-orchestrate` | `measure-orchestrator/SKILL.md` (skill `measure-orchestrator`) | Orchestrate the active Measure track |

Each `WORKFLOWS` entry carries `{ command, workflow, skill, file }`; `skill` is
`measure` for every command except `measure-orchestrate`, which is
`measure-orchestrator`. Message template (one `UserMessage`, `source: { kind:
'measure-guard', form: 'instructions', summary: 'Measure <workflow>' }`):

```
Follow the Measure workflow "<workflow>". Load the `<skill>` skill and read
`<resolved reference path>`; then continue with that workflow. The source of
truth is measure/tracks.md and the active track's plan.md.
```

- Handler: `(invocation) => { ... }`; guard rails run first, then
  `invocation.agent.steer(newUserMessage(...))`, then
  `{ kind: 'success', text: 'Starting the Measure <workflow> workflow.' }`.
- **Project rail.** The subject is the canonical root from `deps.rootOf(agent)`
  and its snapshot from `deps.snapshots.get(root)`; a project without
  `measure/` returns `{ kind: 'error', text: 'measure-guard: this project has no
  measure/ folder. Run /measure-setup first.' }` and submits nothing.
  `measure-setup` skips this rail.
- **Reference rail.** `resolveSkillFile` uses the same root order as §4; a
  missing reference returns `{ kind: 'error', text: 'measure-guard: the
  installed measure skill is incomplete (missing <skill>/<file>). Run
  bin/install-measure-skill.' }` and submits nothing.
- **`measure-orchestrate`** resolves `<measure-orchestrator>/SKILL.md`;
  the skill name is not `measure`, so the lookup is by skill name, not by the
  `measure` root only.
- Definitions carry one-line descriptions and are registered next to the
  existing three in `index.js`; no name collides with `measure` or with
  `measure-status`/`measure-off`/`measure-on`.
- Reference existence is read with `node:fs/promises` (a trusted host read
  outside the workspace sandbox) and cached per agent session for one minute.

## 6. Orchestrator DSH reference

`skills/measure-orchestrator/references/dsh.md` contains the subagent tools and
their arguments, the model families from the profile, the fixed role table
below, the independence and three-family review rule, the guard-marker handoffs
(each role marks its task `[~]` and records the SHA), and per-role tool
restrictions. The role prompt is the body of `agents/measure-<role>.md` (its
frontmatter stays out of the subagent prompt); the reference names that file for
each role, so the role text has one source.

| Role | Prompt source | Provider/model |
|---|---|---|
| `measure-orchestrator` | `agents/measure-orchestrator.md` | `deepseek-official/deepseek-flash` |
| `measure-spec-review` | `agents/measure-spec-review.md` | `kimi-coding/k3.1-pro` |
| `measure-strategy` | `agents/measure-strategy.md` | `deepseek-official/deepseek-flash` |
| `measure-mid-red` | `agents/measure-mid-red.md` | `deepseek-official/deepseek-flash` |
| `measure-jr-green` | `agents/measure-jr-green.md` | `deepseek-official/deepseek-flash` |
| `measure-review-a-correctness` | `agents/measure-review-a-correctness.md` | `xiaomi/mimo-v2.6-pro` |
| `measure-review-b-security` | `agents/measure-review-b-security.md` | `kimi-coding/k3.1-pro` |
| `measure-review-c-ux-api` | `agents/measure-review-c-ux-api.md` | `minimax-cn/MiniMax-M3.1-Flash` |
| `measure-phase-acceptance` | `agents/measure-phase-acceptance.md` | `xiaomi/mimo-v2.6-pro` |
| `measure-adversarial-testing` | `agents/measure-adversarial-testing.md` | `minimax-cn/MiniMax-M3.1-Flash` |
| `measure-ux-browser-review` | `agents/measure-ux-browser-review.md` | `minimax-cn/MiniMax-M3.1-Flash` |
| `measure-final-acceptance` | `agents/measure-final-acceptance.md` | `kimi-coding/k3.1-pro` |
| `measure-closeout` | `agents/measure-closeout.md` | `deepseek-official/deepseek-flash` |
| `measure-orchestrator-audit` | `agents/measure-orchestrator-audit.md` | `xiaomi/mimo-v2.6-pro` |

Independence rule: a reviewer's family differs from the family that wrote the
artifact under review where the profile allows it, and the three review roles
(`review-a`, `review-b`, `review-c`) never share a family. The model ids above
are the profile's `subagent-model-selection-settings.allowedModels`;
`test-reference.sh` checks every id against the profile patch.
`skills/measure-orchestrator/SKILL.md` gains one contents bullet and one
paragraph linking the reference. The file marks every claim not verified against
the installation.

## 7. Test matrix

| Phase | Normal | Edge |
|---|---|---|
| 1 (`test-install.sh`) | install into a temp world writes the copy, its stamp, and the managed block; second run unchanged; `--dry-run` writes nothing | missing profile -> 3; bad mode -> 2; installer exit 2 -> WARN; source without `index.js` -> 3 |
| 1 (`test-check.sh`) | green after install | missing plugin -> FAIL; missing/stale stamp -> FAIL; missing block -> FAIL; two blocks -> FAIL; incomplete skill copy -> FAIL with names; no source -> SKIP; record with `mode: nope` -> FAIL; `live` without `--live` -> SKIP; `--json` shape |
| 1 (`test-foreign-row.sh`, `test-uninstall.sh`, `test-atomic-write.sh`) | uninstall removes block + copy; `--keep-copy` keeps the copy | hand-written row: install/check refuse with the line, file byte-identical, uninstall keeps it; patch without trailing newline; read-only target -> 3, original intact; local-edit file kept with WARN |
| 2 (`workflow.test.js`) | all eight commands registered with descriptions; each steers one message with the resolved reference | no `measure/` -> error + no steer; missing reference -> error + no steer; `measure-setup` without `measure/` works; orchestrator resolves its own skill root |
| 3 (`test-reference.sh`) | the DSH reference exists, its local links resolve, and every named command/model appears | a missing model id is `FAIL` |
| 4 (`test-docs.sh`) | `docs/dsh.md` links resolve; README names the guide; CHANGELOG has the entry; the tech-stack rows exist | a dangling guide link or a missing command name is `FAIL` |
| 5 | live install from the profile copy; `--check` green; `--check --live` green | mode change reflected in `record`; restart note printed |

## 8. Live migration of this workstation

The current profile has a hand-written `id: measure-guard` block (absolute path,
`mode: advise`). Sequence:

1. Back up the patch file: `cp cordis.patch.yml cordis.patch.yml.bak-measure-dsh`.
2. `bin/install-measure-skill --ref HEAD` — installs/repairs the skill copies
   from this branch (it no longer carries a DSH plugin row).
3. `bin/measure-dsh install --ref HEAD --mode guard` — creates
   `<profile>/plugins`, copies the plugin, writes the managed block. It refuses
   while the hand-written row exists, so the row is deleted in the same step:
   the CLI prints the exact lines, and the operator (the Lead) removes them
   first, then re-runs. No copy is deleted by that removal.
4. Verify: `bin/measure-dsh --check` and `bin/measure-dsh --check --live
   --session <id>`; the plugin route and boot graph.

The new row's `name` is a different module URL from the hand-written absolute
path, so a profile recomposition imports the installed copy without a host
restart — this is expected but **unproven**, so Phase 5 proves it and records
the result. If it does not happen, the fallback is a host restart performed by
the operator outside the agent session; the track's evidence then uses the file
and record checks plus the route from the currently loaded instance, and the
restart is recorded as the one pending operator action.

## 9. Verification commands

```
bash tests/dsh/run.sh
node --test 'plugins/dsh-measure-guard/tests/*.test.js'
bash plugins/dsh-measure-guard/scripts/check-parity.sh
bin/measure-dsh --check
bin/measure-dsh --check --live --session "$DSH_SESSION_ID"
```
