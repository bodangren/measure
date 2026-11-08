# Changelog

## Unreleased

### Bug Fixes

* **contract clarity:** the phase-acceptance role now states the test-only HEAD-advance exception (a HEAD moved only by test files or `measure/runs/` keeps the prerequisite results applicable, and the acceptance records the exact HEAD and the allowed commits); `new-track.md` step 9 names findings and items by id, says how to resume after a Stop, prescribes `secret redacted (location unknown)`, and states that approving finalises the report; `contracts.md` gains the role-result identity fields and the model-selection rule. Each sentence is pinned by the S3 docs suite (88 → 98 checks), the claude-skills bundle copy is byte-identical, and the Group (d)/(f)/(g) tech-debt rows are Resolved. Track `dsh_measure_contract_clarity_20261110`.
* **shell redirect safety:** the bounded shell-write grammar now recognizes the noclobber override `>|` (and `2>|`) as a redirect and treats the `ln` destination like the `cp`/`mv`/`install` one, so `echo hi >| measure/tracks.md` and `ln -s x plan.md` reach the closeout shell deny instead of the end-of-turn backstop only; stream devices, `>&` duplications, and `-t`/`--target-directory` remain excluded. Suite 331 → 333. Track `dsh_measure_shell_redirect_safety_20261110`.
* **commit detection through git global options:** the shared core parser now recognizes the documented git global options between `git` and `commit` (`-C`/`-c`, `--git-dir`/`--work-tree`/`--namespace`/`--super-prefix`/`--config-env`/`--attr-source`, the short flags, and the documented long flags such as `--no-pager`), so `git --no-pager commit -m "feat(app): Add"` and its siblings are checked by the strict message-format and no-task rules instead of being skipped as a non-commit; the DSH adapter `-a` detector uses the same run. Before the fix, all eight measured forms returned null from the parser. Copies synced; both parity gates ok; suite 327 to 331. Track `dsh_measure_commit_global_detect_20261110`.
* **commit guard git global options:** the strict commit guard's in-command `git add`/`git stage` scan now skips the documented git global options with their real arity (`-C`/`-c`, `--git-dir`/`--work-tree`/`--namespace`/`--super-prefix`/`--config-env`/`--attr-source`, the attached `-C<dir>`/`-c<name=value>`/`--option=value` forms, and the documented flags such as `--no-pager`, `-p`, `--literal-pathspecs`), so `git -c k=v add f && git commit …` no longer hides `f` from the no-task rule; an unknown global option fails closed to the whole working-tree set, and the substitution scanner recognizes the same option run. Measured before the fix: six forms returned no paths. Suite 324 → 327. Track `dsh_measure_commit_git_options_20261110`.
* **guard patch/after-text visibility:** the DSH adapter now reconstructs the after-text of `apply_patch` (Add File, Delete File, and exactly-matching Update hunks) and `str_replace_editor` (`create`, `str_replace`, `insert`), so the closeout guard checks registry and plan writes made through them like `edit`/`write`; a header without a hunk, a non-matching context line, or an unknown command still fails closed with the unreadable-tool deny. The bounded shell grammar also recognizes `cp`/`mv`/`install` destinations (the `-t`/`--target-directory` forms stay documented residuals), so a copied plan or registry reaches the closeout deny instead of the blind spot. Suite 318 → 324 (reconstruction, readable/denied patch, and shell-copy cases). Track `dsh_measure_apply_patch_visibility_20261110`.
* **audit contract fix3:** Detectors item 3 now states that a proposed guard which would fail is a nonblocking candidate that leaves the audit `status` at `pass` — a proposal cannot fail the gate that carries it — and the S4 test replaced its line-based negatives with whole-file whitespace-collapsed checks and pins the full candidate-format sentence (suite 33 checks). The fix2 review F1–F5 is recorded with dispositions, the fix2 spec carries a dated correction note, and the Group (a) tech-debt row is `Resolved`. Mutation-proved: wrapped phrases, a weakened format sentence, and a flipped status rule each fail. Track `dsh_measure_audit_contract_fix3_20261110`.
* **audit role contract:** the audit example uses `schema_version` 1; `role-gate --role orchestrator-audit` (and the `measure-orchestrator-audit` alias) validates the audit result; Inputs, Detectors, and Outputs describe catalog/guard-test proposals only with the `PROPOSAL:` candidate format; doc tests pin the schema version, format, and the absence of the append/write instructions. Tracks `dsh_measure_audit_contract_20261110` and `dsh_measure_audit_contract_fix2_20261110`.

### Features

* **role contracts:** `contracts.md` now has a "Marker Matching and Baseline" section pinned by the S3 docs test — whole-line marker matching after stripping, the raw dispositions value with one CRLF terminator ignored, item stripping, all six audit scope names plus the spec-review section scope, the spec-review baseline resolution (no ancestry requirement; Mid Red/Jr Green compare strings), the committed set (tree plus every commit in `baseline..HEAD`) and the working-tree union, and the HEAD-advance rule. Track `dsh_measure_contracts_scope_20261110`.

### Features

* **snapshot invalidation cost:** the Host no longer invalidates every cached snapshot on every `tools/result`; a read-only result (`read`, `grep`, `glob`, `read_image`, `web_search`, `web_fetch`, `todo_write`) skips it, while every other tool — including an unknown name — keeps the fail-safe invalidation; the pre-step invalidation remains, and the within-step external-edit window is the documented residual (node 318 tests; `MUTATION_TOOLS` is exported and the two classifications are tested disjoint). Tracks `dsh_measure_snapshot_invalidate_20261109` and `dsh_measure_snapshot_invalidate_fix2_20261109`.

### Features

* **allow-list parsing:** the allow-list dedupe is linear (visited `Set`, first-seen order) and an entry containing a C0 control character is ignored with `has a control character`, so a binary-corrupted `measure/guard-allow` cannot admit a path; the OpenCode adapter's V6/V7 cases and both README rule tables are updated (control character is order 1). node 315 tests. Track `dsh_measure_allow_parse_20261109`.

### Features

* **commit guard nested commands:** `git stage` now contributes like `git add`, and `bash`/`sh`/`zsh` by basename with any `-c`-bearing option cluster (`-c`, `-lc`, `-x -c`, `/bin/bash`), multi-word `eval`, and `git stage` substitutions are scanned recursively (four-level cap, unreadable inner text fails closed) by the strict commit guard's `addedPaths`, so a non-test file staged through a nested shell cannot bypass the no-task check; node 310 tests, DSH adapter local. Track `dsh_measure_commit_nested_20261109`.

### Features

* **commit guard substitution:** a `git add` hidden in a command substitution (`X=$(git add secret.txt); git commit …`) now fails closed to the full working-tree set, so the strict no-task commit rule sees the file; single-quoted or backslash-escaped `$(git add …)` text and substitutions without an add keep the old behavior, and nested spans, `git -C <dir> add`, and quoted `"add"` are recognized (node 303 tests; DSH adapter local). Track `dsh_measure_commit_substitution_20261109`.

### Features

* **skill-doc contract:** `tests/dsh/test-skill-docs.sh` now keeps every `skills/*/SKILL.md` frontmatter description within the skill format (at most 1024 characters, no `<`/`>` characters), rejects a SKILL.md Markdown link to a folder (npm `skill.referenced-directory`, finding N3), reports a missing description, and rejects symbolic links in the `claude-skills/` bundle as a separate rule, with fixtures for each rule and the 1024/1025 boundary; the CLI suite is 13/13. Track `dsh_measure_skill_doctor_check_20261109`.

### Features

* **intermediate-commit scope:** `changed_files()`, `committed_files()`, and the `spec-review` scope rule now union every path a commit in `baseline..HEAD` touched (`git rev-list` + `git diff-tree -z`, exact bytes), so a production file added and later deleted inside a phase can no longer hide from the mid-red, audit, or spec-review scope checks; `test_checker.py` gains spec-review, mid-red, `changed_files`, and `ux_paths` intermediate probes (35 tests). Track `dsh_measure_scope_intermediate_20261109`.

### Features

* **spec-review-gate suites:** every suite now guards a failed `mktemp -d` with the same `FAIL: mktemp -d failed; no fixture can be built` message, a one-FAIL summary, and exit 1; the new `tests/spec_review_gate/test_mktemp_failure.sh` stubs `mktemp` on PATH — once failing, once succeeding with a regular file — and proves the guard for all nine suites plus repository cleanliness including ignored paths (19 checks; gate 11/11). Track `dsh_measure_suite_mktemp_20261109`.

### Features

* **closeout registry check:** `closeout` now verifies the archived track's `measure/tracks.md` entry — it must exist, carry a description, and that description must equal the collapsed `metadata.json` description — so a post-archive metadata edit can no longer drift silently (the recurring failure behind two CLI red runs this session). New test `tests/dsh/test-closeout-registry.sh` covers matching, drifted, missing-description, and missing-entry records. Track `dsh_measure_closeout_registry_20261108`.

### Features

* **A11 doc-drift recipe:** the detection recipe in the anti-pattern catalog (and this project's copy) now reads documents in text mode (`grep -a`) so a NUL or invalid UTF-8 byte cannot hide claims; it checks backticked paths that contain exactly one space between segments (directory claims kept), skips a span whose first word is an existing executable (a command with an argument; shipped by fix2), and reports a document as `does not exist`, `is not a regular file`, or `cannot be read`; the S4 contract rows and sensitivity mutants cover each case (92 checks). Tracks `dsh_measure_a11_recipe_20261108` and `dsh_measure_a11_recipe_fix2_20261108`.

### Features

* **srg dispositions parser:** a parseable `dispositions:` value carrying a control or format character (C0 except tab, DEL, C1 controls, U+2028/U+2029, bidi controls, zero-width characters) is now rejected with `invalid dispositions line: control or zero-width character`; the S3 contract probes cover CONTEST/ESCALATE text and a tab-in-text pass (95 checks). The parser row keeps the scope-rule item as the residual. Track `dsh_measure_srg_parser_20261108`.

### Features

* **spec-review-gate runner:** `tests/spec_review_gate/run.sh` never runs itself, skips a symlinked suite with `ignored suite (symbolic link)`, refuses a suite name containing a glob metacharacter (`unittest discover -p` would treat it as a pattern), and treats a captured `Ran 0 tests` line as a failing `.py` suite (Python ≤ 3.11 exited 0 for it). The adversarial suite gains five probes (119 checks pass) and the tech-debt row resolves SELF/SYMLINK/PYGLOB/PYZERO with MKTEMP as the residual. Track `dsh_measure_srg_runner_20261108`.

### Features

* **dsh shell-write grammar:** the redirect scan now masks heredoc bodies (through the delimiter line, with tab stripping for `<<-`), `>` characters inside quoted spans, and `#` comments before looking for `>`/`>>`, so a document or echo that quotes `> measure/tracks.md` is no longer denied while real writes (a redirect before a heredoc marker, multiple redirects) still are. `tee`/`sed -i` parsing keeps its own rules; command substitution and helper scripts stay the documented residual. Suite 299/299; installed evidence: `measure/runs/dsh_measure_shell_grammar_20261107/live-shell.md`. Track `dsh_measure_shell_grammar_20261107`.

### Features

* **dsh commit guard quoting:** the strict commit guard's in-command `git add` arguments are now read with a shell-word tokenizer (single quotes literal, double-quote and backslash escapes, `#` comments, `--` end-of-options), so a quoted path with spaces (for example `git add "src/a b.ts"`) contributes exactly that path instead of being split, and an unterminated quote fails closed. Proven against the installed plugin (digest `sha256:3d732c439b706149b`) and a real scratch `git add "file with space.ts"`; the parser tests grow from 288 to 291. Track `dsh_measure_add_quoting_20261107`.

### Features

* **spec-review gate mid-red rename:** the orchestrator checker's `committed_files` now forces `--no-renames`, so a rename lists its old path as a deletion and its new path as an addition in one call, so the mid-red gate catches a Red commit that renames a production file into `tests/` instead of passing it. A regression test proves the old code exits 0 (the bypass) and the fix exits 1 with the old path listed; the spec-review-gate suite is 10/10. Track `dsh_measure_midred_rename_20261107`.

### Features

* **dsh semantic reload:** `bin/measure-dsh reload` and the unchanged-block `install` now increment the managed plugin entry's `reloadNonce` config value instead of toggling a YAML comment. A comment changes no composed configuration, so the loader skipped the recompose and the running plugin kept its cached repository-mode store; the rehearsal found it live (a fixture-rooted session still reported `guard` after `reload`). The fix is proven both directions (override → reload → `strict/repository`; cleared → reload → `guard/config`), and legacy marker lines are dropped on install/reload. Track `dsh_measure_reload_20261107`.

### Features

* **dsh isolated-session rehearsal:** the guard's strict deny is proven in a disposable project by a session whose working directory is the fixture (created through the host session RPC `POST /api/session/create` with `{ cwd }`); the deny text, the session ids, and the cleanup checks are recorded under `measure/runs/dsh_measure_isolated_session_20261107/`. The run also proved that `bin/measure-dsh reload` (a comment-marker toggle) does not refresh the running plugin's cached repository-mode store — the next track fixes that. Track `dsh_measure_isolated_session_20261107`.

### Features

* **parse:** the shared parser reads the two live `tracks.md` shapes: an optional ordered-list prefix (`1. - [~] **Track: …**`) and a `*Link:*` on the same bold line, in addition to this repository's next-line link. The DSH adapter had reported `cannot read the Measure files: … has track lines in no known format` for the Mediarr registry (198 entries, 9 active now parse). The canonical change is in `mods/measure-guard/hooks/parse.ts`; the OpenCode and DSH parity copies and both unknown-format detectors follow. Track `dsh_measure_evolve_20261107`.

### Bug Fixes

* **dsh rehearsal contract:** `tests/dsh/test-rehearsal-fixture.sh` now asserts the fixture's real initial commit (`rev-parse --verify HEAD` + exactly one commit, with a negative case) instead of the `.git/HEAD` file, and the rehearsal track's records were corrected: the executed run proved the Red→Green→commit handoff but not the fixture's strict deny path (a subagent keeps the parent session's guard root), the `measure/` write rule now lists the closeout/registry/shell exceptions, and the review record carries the deferral of a true isolated-session rehearsal as an Accepted Risk. Track `dsh_measure_rehearsal_followup_20261107`.

### Features

* **dsh agent-team rehearsal:** a disposable Measure fixture (`tests/dsh/rehearsal/make-project.sh`) and its contract test, plus a Rehearsal protocol in `skills/measure-orchestrator/references/dsh.md` (section 10). One real rehearsal executed Red and Green subagents end to end (failing test → green → commit with a git note) and established the limit it documents: a subagent's `cwd` is its shell directory, not its guard root, so an isolated-project rehearsal needs a session opened in that project; `dsh --profile headless` cannot host the guard (`webServer` inject + stored credentials). Track `dsh_measure_team_rehearsal_20261107`.

* **dsh compact band:** the Measure band is capped at 160 characters on a word boundary with an ellipsis and never wraps, so a long task title no longer eats the composer's vertical space. The full position text stays available as the row's hover title (`bandFull`) and in `measure_status` (the sidebar panel shows the status lines and the goal line, not the active task text). Track `dsh_measure_band_20261107`.

* **dsh operator controls:** `/measure-mode` makes the guard mode effective per repository: a persisted repository override wins over an in-memory session override, which wins over `config.mode`; every guard path reads the effective mode per call, and the state route/band/status expose the value and its source. `/measure-verify` is a read-only on-demand run of the git-backed task checks and the active track's `metadata.json` verdict. Track `dsh_measure_ops_20261107`.

* **dsh live verification:** `bin/measure-dsh install` now writes the profile patch as a recompose trigger and a new `bin/measure-dsh reload` action performs that write on demand, so a running Host loads the installed code. The plugin captures a SHA-256 digest of its code files at module evaluation and serves it as `x-measure-guard-digest`; `--check --live` compares it with the installed copy, so a stale running instance is FAIL (naming both digests) instead of a false PASS, and a pre-digest instance is WARN. Track `dsh_measure_hardening_20261107`.
* **dsh git-backed verification:** the end-of-turn check now proves each `[x]` task's SHA is a real commit (`git rev-parse --verify --quiet <sha>^{commit}`; a missing object exits 1, where `git cat-file -e` exits 128 and would be misread as a fatal error) and carries its git note (`git notes show`); a missing commit or note is a turn problem, and a git that cannot answer fails open. Closing a track now requires its `metadata.json` to exist, parse, and have `actual_tasks` equal the plan's `[x]` count. Track `dsh_measure_hardening_20261107`.
* **dsh bypass closure:** shell writes (`>`/`>>`, `tee`, `sed -i`) are path-checked within a bounded grammar and registry/plan writes through them or through `apply_patch`/`str_replace_editor` are denied with a "use edit or write" text; the commit guard narrows its file set (`git add <paths>` exactly, `-A` all, `-u` tracked, `-a` tracked only) instead of blocking valid commits with unrelated untracked files. All new denies are inert in `advise` mode and under `/measure-off`. Track `dsh_measure_hardening_20261107`.

* **dsh setup button:** the DSH band now offers the two setup answers "Set up Measure" and "Turn off for session" when a git repository has no `measure/` folder. The buttons post `{ sessionId, choice }` to the exact `POST /measure-guard/setup` route; `off` records the session answer and hides the offer, `setup` records the request and delivers the shared core's setup prompt to the agent once and shows the "setup requested" variant. Unknown sessions (404), malformed bodies and unknown choices (400), and non-POST methods (405) change nothing. Track `dsh_measure_evolve_20261107`.
* **dsh goal binding:** the DSH adapter binds the DeepSeek Harness goal to the active Measure track. `/measure-goal` creates a goal from the track entry (objective `Measure track "<name>" (<id>).`), replaces a complete goal, and reports an active, paused, or blocked goal without mutating it. The band, `measure_status`, the panel, and the state route carry the goal phase and round position; the end-of-turn check reports a complete goal with an open `[~]` task and any current goal while no track is in progress. The goal service is read per call as an optional capability, so a build without it degrades to no goal line. Track `dsh_measure_evolve_20261107`.
* **dsh strict guards:** in `strict` mode the DSH adapter now enforces Red-before-Green (a source edit is denied until the `[~]` task has a successful test-file write and a failed test command; the Red record is keyed by task) and the commit ceremony (the `<type>(<scope>): <description>` message format, no commit of files outside `measure/` while no task is `[~]`, and a post-commit reminder to add the git note and the SHA in `plan.md`). Every decision and deny text is the shared core's. Track `dsh_measure_evolve_20261107`.

* **dsh environment:** `bin/measure-dsh` installs, checks, and removes the DeepSeek Harness profile layer for Measure development: the guard plugin copy with its stamp, one marker-managed `cordis.patch.yml` row, the skill-copy and module-export checks, and the live route identity. The guard plugin gains the eight Measure workflow commands (they steer the agent into the matching workflow) and an `x-measure-guard-module` route header; `skills/measure-orchestrator/references/dsh.md` maps the Measure roles to DSH subagents, and [`docs/dsh.md`](docs/dsh.md) is the guide. The installer no longer carries a DSH plugin row: the CLI owns that copy. Track `dsh_measure_dev_20261107`.
* **dsh:** DeepSeek Harness plugin `plugins/dsh-measure-guard/`: a Host plugin and a hand-written browser half, with no build step and no new dependency. It adds the fixed Measure rule section and exactly-once task notes in projects with `measure/`, the second-writer warning, the setup offer, the `measure_status` tool, `measure-off`, `measure-on`, and `measure-status`, the edit, closeout, and end-of-turn guards with the `measure/guard-allow` list, a composer status band, a sidebar status panel, and one JSON status route. The shared core is a parity copy of the Claude Code mod's `parse.ts` and `guards.ts`. Track `dsh_measure_guard_20261107`.
* **guard allow list:** the file `measure/guard-allow` lists folders that get writes while no task is `[~]`. The edit guard, the end-of-turn check, the commit guard, and the TDD guard treat a listed folder as Measure work. Both the Claude Code mod and the OpenCode plugin read it. Track `guard_allow_list_20261101`.
* **opencode:** OpenCode 2 plugin `plugins/opencode-measure-guard/` (server and terminal parts): the Measure rule in the system prompt, task notes, edit, closeout, TDD, and commit guards, the end-of-turn check, `/measure-off`, `/measure-on`, `/measure-guard`, the Measure workflow commands, the `measure_status` tool, and a terminal band. Track `opencode_plugin_20261021`.
* **agents:** `measure-orchestrator` carries the Measure rule section in its prompt; the OpenCode plugin adds the same section to every other agent.
* **spec review:** `new-track` now runs one fresh subagent against the new standard `references/spec-review.md` before the track commit. The step writes `spec-review.md` in the track folder and adds it to the track index. Track `spec_review_gate_20261030`.
* **spec review role:** the new report-only `measure-spec-review` subagent reviews `spec.md` and `plan.md` once per track, before the first strategy role. `role-gate --role spec-review` checks the paraphrase, the finding format, the verdict, and the commit scope. Track `spec_review_gate_20261030`.
* **installer:** `bin/install-targets.tsv` rows for the OpenCode plugin (without `tests/`), its commands, and the agents under `~/.config/opencode/`; the pattern column accepts bash extglob forms such as `!(tests/*)`.
* **finding dispositions:** every routed finding gets one disposition: FIX, CONTEST with evidence that the reviewer can read, ESCALATE to the user, or DECLINE for a Nit finding. `role-gate --log-file` checks the optional `dispositions:` line of the result block. The Green role, the review roles, the phase-acceptance role, the spec review standard, and the `review` workflow use the same four words. Track `spec_review_gate_20261030`.
* **doc drift:** the weekly `measure-orchestrator-audit` run checks the documents that agents read against the code. It reports each difference as a nonblocking `DRIFT:` finding. Three ideas come from the EGM project (https://github.com/google/elephant-goldfish-model, Apache-2.0). They are the fresh-context spec review, the finding dispositions, and the doc drift check. Track `spec_review_gate_20261030`.
* **agents:** the 14 role files in `agents/` use the native OpenCode 2 frontmatter: `description`, `mode`, `steps`, and an ordered `permissions` list. The files do not pin a model, because the orchestrator gives the model at each spawn. Each subagent denies the question tool and sends its questions to the orchestrator. The orchestrator file adds the model tables, the independence rules, and the session names.
* **skills:** the 11 longer files of `skills/measure/` and `claude-skills/measure/` start with a `## Contents` list.
* **skill doctor fixes:** the `measure` description has 462 characters (it had 1052, over the 1024 limit), and the `build-graph` description has 337 characters. The `measure` skill links each code style guide file. The `measure-orchestrator` skill starts with a `## Quick start` section and names no harness tool. Checks: npm `skill-doctor` 0.1.0 and the Claude Code `/skill-doctor` report. Track `skill_doctor_fixes_20261031`.

## [0.4.1](https://github.com/gemini-cli-extensions/conductor/compare/conductor-v0.4.0...conductor-v0.4.1) (2026-03-11)


### Bug Fixes

* update readme ([d1957ae](https://github.com/gemini-cli-extensions/conductor/commit/d1957ae0b965f2aa769331b9d850b7dd93eeb27a))

## [0.4.0](https://github.com/gemini-cli-extensions/conductor/compare/conductor-v0.3.1...conductor-v0.4.0) (2026-03-10)


### Features

* integrate Plan Mode and extension-native policies into Conductor ([4a4d9b2](https://github.com/gemini-cli-extensions/conductor/commit/4a4d9b2d21d896c032161aa0247fb1ab9a7e59bc))
* **plan:** add conductor as planning directory ([5cf078c](https://github.com/gemini-cli-extensions/conductor/commit/5cf078c9c186fa9474e579123ecaeee3533fa1e2))
* **plan:** basic plan mode tool integration ([923ef57](https://github.com/gemini-cli-extensions/conductor/commit/923ef57c06cb97aeef1a3d0cf2c192f7bb28e63d))
* **policy:** move and configure conductor policies ([e0fbc72](https://github.com/gemini-cli-extensions/conductor/commit/e0fbc723cc3eb693063ae13b0d39fa00376b3594))
* **setup:** add user confirmation loop for product requirements drafting ([6907cae](https://github.com/gemini-cli-extensions/conductor/commit/6907cae60aef8e858c6495ca46957f46c22b1470))
* **setup:** allow intelligent self-correction on tool failures ([898daa7](https://github.com/gemini-cli-extensions/conductor/commit/898daa707793eba6884583d9d22cd6623719c4fc))
* **setup:** enforce run_shell_command for listing external templates ([1224569](https://github.com/gemini-cli-extensions/conductor/commit/122456948166283fb37af9317596472cdf487cb5))
* **setup:** implement shallow artifact inference with state priority table ([68a2a2c](https://github.com/gemini-cli-extensions/conductor/commit/68a2a2ceb24603bf3ecb59a80a44d4551d450671))
* **setup:** mandate relative paths for file operations in plan mode ([a717aa0](https://github.com/gemini-cli-extensions/conductor/commit/a717aa0d909605cf373a7036592f2748b092655f))
* **setup:** use ask_user tool for interactive prompts ([e71e8e0](https://github.com/gemini-cli-extensions/conductor/commit/e71e8e0d6b7086855789ba9c0acb35cac439279d))


### Bug Fixes

* **conductor:** refine plan mode entry logic in setup and newTrack ([3d9b3c8](https://github.com/gemini-cli-extensions/conductor/commit/3d9b3c8cc34849120e778bfebd02b47230953e29))
* **conductor:** refine plan mode entry logic in setup and newTrack ([9a413d2](https://github.com/gemini-cli-extensions/conductor/commit/9a413d28332763d231dbb6f9a693ae604856b7e2))
* **plan:** configure agent to avoid redirection in shell commands which is blocked by plan mode ([7b27eca](https://github.com/gemini-cli-extensions/conductor/commit/7b27eca892c9f7f2d7f624569ad7f62a33832740))
* **plan:** use extension-native policies folder ([db6d52d](https://github.com/gemini-cli-extensions/conductor/commit/db6d52dd33cb5492ecc7df1444e67f9f615091d6))
* **setup:** refine project maturity detection and harden resume edge-cases ([eb9d127](https://github.com/gemini-cli-extensions/conductor/commit/eb9d1277c1e0b29593e3929f902ca0fcbef0b2fc))
* **setup:** Remove model selection constraint from setup command ([90b583f](https://github.com/gemini-cli-extensions/conductor/commit/90b583fd2f6a3167e436d72778f7d9ab94498263))

## [0.3.1](https://github.com/gemini-cli-extensions/conductor/compare/conductor-v0.3.0...conductor-v0.3.1) (2026-02-19)


### Bug Fixes

* **conductor:** Address review comments and standardize interactive flows ([f025c7d](https://github.com/gemini-cli-extensions/conductor/commit/f025c7d1552077cc2e5b6d2ae80ae85ac4298b28))

## [0.3.0](https://github.com/gemini-cli-extensions/conductor/compare/conductor-v0.2.0...conductor-v0.3.0) (2026-02-11)


### Features

* add /conductor:review command ([d4749d3](https://github.com/gemini-cli-extensions/conductor/commit/d4749d320ae983a12064488eb4b605529b0841e9))
* add /conductor:review command ([d6e382a](https://github.com/gemini-cli-extensions/conductor/commit/d6e382a980a816339c9ca9904a4744a635af7bd0))
* **conductor:** address review comments to make recommendations more conversational ([8630f35](https://github.com/gemini-cli-extensions/conductor/commit/8630f358f1d4ecf9e6c2815d0c607cf8c49ee3e8))
* **conductor:** make review recommendations more conversational ([44446c6](https://github.com/gemini-cli-extensions/conductor/commit/44446c6338bdc5159fd8d9c7cf4c362e48d34e40))
* **conductor:** make review recommendations more conversational ([ec3dd99](https://github.com/gemini-cli-extensions/conductor/commit/ec3dd996afd98e7c695cc8dee79f3779b8e1d105))
* **conductor:** update review process to commit fixes and update plan ([c26980a](https://github.com/gemini-cli-extensions/conductor/commit/c26980a5b9f952974c8c3cbcd82dc8c3ab2911f9))
* **review:** update review process to commit fixes and update plan ([0d533be](https://github.com/gemini-cli-extensions/conductor/commit/0d533be1c3ebfc07fd04cf8219ddc5964343c24a))


### Bug Fixes

* commit changed conductor files at the end of newTrack ([232c08b](https://github.com/gemini-cli-extensions/conductor/commit/232c08b3c99e362981019a6b8e7ca8de55d78357))
* Commit conductor files at the end of :newTrack ([#94](https://github.com/gemini-cli-extensions/conductor/issues/94)) ([232c08b](https://github.com/gemini-cli-extensions/conductor/commit/232c08b3c99e362981019a6b8e7ca8de55d78357))
* **conductor:** move pre-initialization overview before resume check ([774fb49](https://github.com/gemini-cli-extensions/conductor/commit/774fb49119d1f4d8d87dff22cbc14924fdb02a5b))
* **conductor:** move pre-initialization overview before resume check ([f2b7ba5](https://github.com/gemini-cli-extensions/conductor/commit/f2b7ba5c8963990ad454853692182f9367a099be)), closes [#81](https://github.com/gemini-cli-extensions/conductor/issues/81)
* improve error message when required files are missing in review command ([d61c588](https://github.com/gemini-cli-extensions/conductor/commit/d61c588c6d4adc3393468180d62f13097f589e4c))

## [0.2.0](https://github.com/gemini-cli-extensions/conductor/compare/conductor-v0.1.1...conductor-v0.2.0) (2026-01-14)


### Features

* Add GitHub Actions workflow to package and upload release assets. ([5e0fcb0](https://github.com/gemini-cli-extensions/conductor/commit/5e0fcb0d4d19acfd8f62b08b5f9404a1a4f53f14))
* Add GitHub Actions workflow to package and upload release assets. ([20858c9](https://github.com/gemini-cli-extensions/conductor/commit/20858c90b48eabb5fe77aefab5a216269cc77c09))
* **conductor:** implement tracks directory abstraction ([caeb814](https://github.com/gemini-cli-extensions/conductor/commit/caeb8146bec590eda35bc7934b796656804fcf9a))
* Implement Universal File Resolution Protocol ([fe902f3](https://github.com/gemini-cli-extensions/conductor/commit/fe902f32762630e674f186b742f4ebb778473702))
* integrate release asset packaging into release-please workflow ([3ef512c](https://github.com/gemini-cli-extensions/conductor/commit/3ef512c3320e7877f1c05ed34433cf28a3111b30))
* introduce index markdown files and the Universal File Resolution Protocol ([bbb69c9](https://github.com/gemini-cli-extensions/conductor/commit/bbb69c9fa8d4a6b3c225bfb665d565715523fa7d))
* introduce index.md files for file resolution ([cbd24d2](https://github.com/gemini-cli-extensions/conductor/commit/cbd24d2b086697a3ca6e147e6b0edfedb84f99ce))
* **styleguide:** Add comprehensive Google C# Style Guide summary ([6672f4e](https://github.com/gemini-cli-extensions/conductor/commit/6672f4ec2d2aa3831b164635a3e4dc0aa6f17679))
* **styleguide:** Add comprehensive Google C# Style Guide summary ([e222aca](https://github.com/gemini-cli-extensions/conductor/commit/e222aca7eb7475c07e618b410444f14090d62715))


### Bug Fixes

* build tarball outside source tree to avoid self-inclusion ([830f584](https://github.com/gemini-cli-extensions/conductor/commit/830f5847c206a9b76d58ebed0c184ff6c0c6e725))
* **conductor:** ensure track completion and doc sync are committed automatically ([f6a1522](https://github.com/gemini-cli-extensions/conductor/commit/f6a1522d0dea1e0ea887fcd732f1b47475dc0226))
* **conductor:** ensure track completion and doc sync are committed automatically ([e3630ac](https://github.com/gemini-cli-extensions/conductor/commit/e3630acc146a641f29fdf23f9c28d5d9cdf945b8))
* **conductor:** remove hardcoded path hints in favor of Universal File Resolution Protocol ([6b14aaa](https://github.com/gemini-cli-extensions/conductor/commit/6b14aaa6f8bffd29b2dc3eb5fc22b2ed1d19418d))
* Correct typos, step numbering, and documentation errors ([ab9516b](https://github.com/gemini-cli-extensions/conductor/commit/ab9516ba6dd29d0ec5ea40b2cb2abab83fc791be))
* Correct typos, step numbering, and documentation errors ([d825c32](https://github.com/gemini-cli-extensions/conductor/commit/d825c326061ab63a4d3b8928cbf32bc3f6a9c797))
* Correct typos, trailing whitespace and grammar ([484d5f3](https://github.com/gemini-cli-extensions/conductor/commit/484d5f3cf7a0c4a8cbbcaff71f74b62c0af3dd35))
* Correct typos, trailing whitespace and grammar ([94edcbb](https://github.com/gemini-cli-extensions/conductor/commit/94edcbbd0102eb6f9d5977eebf0cc3511aff6f64))
* Replace manual text input with interactive options ([b49d770](https://github.com/gemini-cli-extensions/conductor/commit/b49d77058ccd5ccedc83c1974cc36a2340b637ab))
* Replace manual text input with interactive options ([746b2e5](https://github.com/gemini-cli-extensions/conductor/commit/746b2e5f0a5ee9fc49edf8480dad3b8afffe8064))
* **setup:** clarify definition of 'track' in setup flow ([819dcc9](https://github.com/gemini-cli-extensions/conductor/commit/819dcc989d70d572d81655e0ac0314ede987f8b4))
* **setup:** Enhance project analysis protocol to avoid excessive token consumption. ([#6](https://github.com/gemini-cli-extensions/conductor/issues/6)) ([1e60e8a](https://github.com/gemini-cli-extensions/conductor/commit/1e60e8a96e5abeab966ff8d5bd95e14e3e331cfa))
* standardize Markdown checkbox format for tracks and plans ([92080f0](https://github.com/gemini-cli-extensions/conductor/commit/92080f0508ca370373adee1addec07855506adeb))
* standardize Markdown checkbox format for tracks and plans ([84634e7](https://github.com/gemini-cli-extensions/conductor/commit/84634e774bc37bd3996815dfd6ed41a519b45c1d))
* **styleguide:** Clarify usage of 'var' in C# guidelines for better readability ([a67b6c0](https://github.com/gemini-cli-extensions/conductor/commit/a67b6c08cac15de54f01cd1e64fff3f99bc55462))
* **styleguide:** Enhance C# guidelines with additional rules for constants, collections, and argument clarity ([eea7495](https://github.com/gemini-cli-extensions/conductor/commit/eea7495194edb01f6cfa86774cf2981ed012bf73))
* **styleguide:** Update C# formatting rules and guidelines for consistency ([50f39ab](https://github.com/gemini-cli-extensions/conductor/commit/50f39abf9941ff4786e3b995d4c077bfdf07b9c9))
* **styleguide:** Update C# guidelines by removing async method suffix rule and adding best practices for structs, collection types, file organization, and namespaces ([8bfc888](https://github.com/gemini-cli-extensions/conductor/commit/8bfc888b1b1a4191228f0d85e3ac89fe25fb9541))
* **styleguide:** Update C# guidelines for member ordering and enhance clarity on  string interpolation ([0e0991b](https://github.com/gemini-cli-extensions/conductor/commit/0e0991b73210f83b2b26007e813603d3cd2f0d48))
