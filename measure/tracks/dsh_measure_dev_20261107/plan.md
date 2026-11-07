# Implementation Plan: DSH Measure development environment

Track: `dsh_measure_dev_20261107`
Spec: [./spec.md](./spec.md) · Design: [./design.md](./design.md)

Gate for every phase: `bash tests/dsh/run.sh` (bash contract tests) and
`node --test 'plugins/dsh-measure-guard/tests/*.test.js'` plus the parity gate.
The script under test is `bin/measure-dsh`; the plugin under test is
`plugins/dsh-measure-guard`.

## Phase 1: Environment CLI

- [ ] Task 1.1: Record the environment CLI in the tech stack
    - [ ] `measure/tech-stack.md` Distribution Formats row for `bin/measure-dsh` (and the note that it replaces the installer's DSH plugin target)
    - [ ] `measure/tech-stack.md` Tooling Exceptions row for this track (`bash tests/dsh/run.sh`, `node --test`)
- [ ] Task 1.2: CLI skeleton, resolution, and install
    - [ ] `bin/measure-dsh`: usage/help, `--dsh-home`/`$DSH_HOME`/`~/.dsh` resolution, `--profile`, `--mode` validation, `--ref`, `--source`, `--dry-run`, `--no-skills`, exit codes, output format
    - [ ] `install`: prerequisites, foreign-row scan, `mkdir -p <profile>/plugins`, the installer skill step, the plugin copy with `.measure-dsh-install`, the managed block, the summary and restart note
    - [ ] `tests/dsh/run.sh`, `tests/dsh/lib.sh`, `tests/dsh/test-install.sh`: temp world (fake HOME, DSH home, profile, git repo, installer stub); first install writes copy+stamp+block; second run unchanged; `--dry-run` writes nothing; missing profile exits 3; bad mode exits 2; installer exit 2 becomes WARN
- [ ] Task 1.3: Check
    - [ ] `--check` items from `design.md §4`: `dsh-install`, `node`, `skill-measure`, `skill-orchestrator`, `plugin`, `record`, `foreign-row`, `live`; `--json`; `--source`; `--live`/`--session`/`$DSH_SESSION_ID`
    - [ ] `tests/dsh/test-check.sh`: green after install; each red case (missing plugin, stale stamp, missing block, two blocks, incomplete skill copy, invalid mode in the record); `live` SKIP without the flag and without a session id; source-missing SKIP; `--json` shape
- [ ] Task 1.4: Uninstall and safety
    - [ ] `uninstall` removes the managed block and the owned plugin copy, `--keep-copy` keeps the copy, `--dry-run` writes nothing; keeps skills and foreign rows; non-zero only when an owned item could not be removed
    - [ ] `tests/dsh/test-foreign-row.sh`, `tests/dsh/test-uninstall.sh`, `tests/dsh/test-atomic-write.sh`: hand-written row refuses install/check with its line number and survives uninstall byte-identically; atomic write preserves the rest of the file; a patch file without a trailing newline; read-only profile exits 3 with the original intact; a user-edited copy file is kept with WARN
- [ ] Task 1.5: Measure - User Manual Verification 'Phase 1: Environment CLI' (Protocol in workflow.md)

## Phase 2: Workflow commands

- [ ] Task 2.1: Workflow module
    - [ ] `plugins/dsh-measure-guard/src/workflow.js`: `WORKFLOWS` table, message template, `resolveSkillFile` (the §4 root order with realpath dedupe), the project rail through `deps.rootOf`/`deps.snapshots`, the reference rail, `measureWorkflowCommands(deps)`
    - [ ] `plugins/dsh-measure-guard/tests/workflow.test.js`: names/descriptions exact; one `agent.steer` per command with the resolved reference path; no `measure/` -> error and no steer; missing reference -> error and no steer; `measure-setup` allowed without `measure/`; `measure-orchestrate` resolves the orchestrator skill
- [ ] Task 2.2: Wire the commands
    - [ ] `plugins/dsh-measure-guard/index.js` registers the workflow commands through `ctx.commands.register`, next to the existing three
    - [ ] `plugins/dsh-measure-guard/tests/plugin.test.js` asserts the eleven commands and no duplicate registration
- [ ] Task 2.3: Measure - User Manual Verification 'Phase 2: Workflow commands' (Protocol in workflow.md)

## Phase 3: Agent team reference

- [ ] Task 3.1: DSH orchestrator reference
    - [ ] `skills/measure-orchestrator/references/dsh.md`: subagent tools and arguments, the profile's model list, the role table (role -> prompt summary -> model family), independence and the three-family review rule, guard-marker handoffs, per-role tool restrictions
    - [ ] `skills/measure-orchestrator/SKILL.md`: one contents bullet and one paragraph linking the reference
- [ ] Task 3.2: Reference checks
    - [ ] `tests/dsh/test-reference.sh` in `tests/dsh/run.sh`: the reference exists; its local links resolve; every command name and model id it names exists (models against the profile patch)
- [ ] Task 3.3: Measure - User Manual Verification 'Phase 3: Agent team reference' (Protocol in workflow.md)

## Phase 4: Guide, docs, and distribution alignment

- [ ] Task 4.1: The guide and its checks
    - [ ] `docs/dsh.md`: prerequisites, install, check, modes, workflow commands, agent team, uninstall, troubleshooting (restart note, foreign row, incomplete skill copy)
    - [ ] `tests/dsh/test-docs.sh` in `tests/dsh/run.sh`: every guide link resolves; the guide names every command; README links the guide; the CHANGELOG entry exists
- [ ] Task 4.2: README and changelog
    - [ ] `README.md`: the harness section names DSH and links `docs/dsh.md`; the install section names `bin/measure-dsh`
    - [ ] `CHANGELOG.md`: one Unreleased entry (environment CLI, workflow commands, agent-team reference, guide)
- [ ] Task 4.3: Distribution alignment
    - [ ] remove the DSH plugin row from `bin/install-targets.tsv`; delete `plugins/dsh-measure-guard/tests/install.sh` (replaced by `tests/dsh/`); update the guard plugin README install section
    - [ ] `tests/dsh/test-install.sh` asserts the installer carries no DSH plugin row and the CLI owns the copy
- [ ] Task 4.4: Measure - User Manual Verification 'Phase 4: Guide, docs, and distribution alignment' (Protocol in workflow.md)

## Phase 5: Live environment and closeout

- [ ] Task 5.1: Live migration
    - [ ] Back up the profile patch, run `bin/install-measure-skill --ref HEAD`, remove the hand-written row, run `bin/measure-dsh install --ref HEAD --mode guard`, and prove `--check` and `--check --live` green
    - [ ] Record the evidence (state route JSON, band text, command catalog, boot graph) in the task git note and `measure/runs/dsh_measure_dev_20261107/`; record whether the recomposition re-imported the installed copy or a restart is pending
- [ ] Task 5.2: Measure - User Manual Verification 'Phase 5: Live environment and closeout' (Protocol in workflow.md)

## Deferred to a follow-up track

- DSH agent presets that mount the guard per agent.
- Porting `agents/measure-*.md` to a DSH-native role registry (if DSH grows one).
- Windows support for `bin/measure-dsh`.
