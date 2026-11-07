# Implementation Plan: DSH Measure development environment

Track: `dsh_measure_dev_20261107`
Spec: [./spec.md](./spec.md) · Design: [./design.md](./design.md)

Gate for every phase: `bash tests/dsh/run.sh` (bash contract tests) and
`node --test 'plugins/dsh-measure-guard/tests/*.test.js'` plus the parity gate.
The script under test is `bin/measure-dsh`; the plugin under test is
`plugins/dsh-measure-guard`.

## Phase 1: Environment CLI

- [ ] Task 1.1: Record the environment CLI in the tech stack
    - [ ] `measure/tech-stack.md` Distribution Formats row for `bin/measure-dsh`
    - [ ] `measure/tech-stack.md` Tooling Exceptions row for this track (`bash tests/dsh/run.sh`, `node --test`)
- [ ] Task 1.2: CLI skeleton, resolution, and install
    - [ ] `bin/measure-dsh`: usage/help, `--dsh-home`/`$DSH_HOME`/`~/.dsh` resolution, `--profile`, `--mode` validation, `--ref`, `--dry-run`, `--no-skills`, exit codes, output format
    - [ ] `install`: prerequisites, foreign-row scan, `mkdir -p <profile>/plugins`, `bin/install-measure-skill --ref <ref>`, managed block write, summary and restart note
    - [ ] `tests/dsh/lib.sh` plus `tests/dsh/test-install.sh`: temp world (fake HOME, DSH home, profile, git repo, installer stub), first install writes the block, second is unchanged, `--dry-run` writes nothing, missing profile exits 3, bad mode exits 2, installer exit 2 becomes WARN
- [ ] Task 1.3: Check
    - [ ] `--check` items from `design.md §4`: `dsh-install`, `node`, `skill-measure`, `skill-orchestrator`, `plugin`, `record`, `foreign-row`, `live`; `--json`; `--source`; `--live`/`--session`
    - [ ] `tests/dsh/test-check.sh`: green after install; each red case (missing plugin, missing block, two blocks, incomplete skill copy, unsupported mode in the record); `SKIP` without `--live`, source-missing `SKIP`
- [ ] Task 1.4: Uninstall and safety
    - [ ] `uninstall` removes the managed block and, with `--prune`, the plugin copy; `--dry-run`; keeps skills and foreign rows; non-zero only when an owned item could not be removed
    - [ ] `tests/dsh/test-foreign-row.sh` and `tests/dsh/test-uninstall.sh`: hand-written row refuses install/check and survives uninstall, file byte-identical; atomic write preserves the rest of the file, including no trailing newline; read-only profile exits 3 with the original intact
- [ ] Task 1.5: Measure - User Manual Verification 'Phase 1: Environment CLI' (Protocol in workflow.md)

## Phase 2: Workflow commands

- [ ] Task 2.1: Workflow module
    - [ ] `plugins/dsh-measure-guard/src/workflow.js`: `WORKFLOWS` table, message template, reference lookup under `~/.agents/skills/measure` then `~/.claude/skills/measure`, `measureWorkflowCommands(deps)` with the eight definitions and their guard rails
    - [ ] `plugins/dsh-measure-guard/tests/workflow.test.js`: names/descriptions exact; one steer per command with the right reference text; no `measure/` -> error and no steer; missing reference -> error and no steer; `measure-setup` allowed without `measure/`
- [ ] Task 2.2: Wire the commands
    - [ ] `plugins/dsh-measure-guard/index.js` registers the workflow commands through `ctx.commands.register`, next to the existing three
    - [ ] `plugins/dsh-measure-guard/tests/plugin.test.js` asserts the eleven commands and no duplicate registration
- [ ] Task 2.3: Measure - User Manual Verification 'Phase 2: Workflow commands' (Protocol in workflow.md)

## Phase 3: Agent team reference

- [ ] Task 3.1: DSH orchestrator reference
    - [ ] `skills/measure-orchestrator/references/dsh.md`: subagent tools and arguments, the profile's model list, the role table (role -> prompt summary -> model family), independence and the three-family review rule, guard-marker handoffs, per-role tool restrictions
    - [ ] `skills/measure-orchestrator/SKILL.md`: one contents bullet and one paragraph linking the reference
- [ ] Task 3.2: Documentation checks
    - [ ] `tests/dsh/test-docs.sh`: every link in the guide and the DSH reference resolves; the command names and the model ids named in the guide exist in the profile patch
    - [ ] `tests/dsh/test-docs.sh` in `tests/dsh/run.sh`
- [ ] Task 3.3: Measure - User Manual Verification 'Phase 3: Agent team reference' (Protocol in workflow.md)

## Phase 4: Guide and distribution

- [ ] Task 4.1: The guide
    - [ ] `docs/dsh.md`: prerequisites, install, check, modes, workflow commands, agent team, uninstall, troubleshooting (restart note, foreign row, incomplete skill copy)
- [ ] Task 4.2: README and changelog
    - [ ] `README.md`: the harness section names DSH and links `docs/dsh.md`; the install section names `bin/measure-dsh`
    - [ ] `CHANGELOG.md`: one Unreleased entry for the environment
- [ ] Task 4.3: Measure - User Manual Verification 'Phase 4: Guide and distribution' (Protocol in workflow.md)

## Phase 5: Live environment and closeout

- [ ] Task 5.1: Live migration
    - [ ] Install from this branch (`bin/install-measure-skill --ref HEAD`), remove the hand-written profile row, `bin/measure-dsh install --ref HEAD --mode guard`, and prove `--check` and `--check --live` green
    - [ ] Record the evidence (state route JSON, band text, command catalog) in the task git note and `measure/runs/dsh_measure_dev_20261107/`
- [ ] Task 5.2: Measure - User Manual Verification 'Phase 5: Live environment and closeout' (Protocol in workflow.md)

## Deferred to a follow-up track

- DSH agent presets that mount the guard per agent.
- Porting `agents/measure-*.md` to a DSH-native role registry (if DSH grows one).
- Windows support for `bin/measure-dsh`.
