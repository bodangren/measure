# Specification: DSH Measure agent-team rehearsal

## Overview

**Sprint goal:** One real Measure phase runs through DSH subagents with the guard live, so the orchestrator's role playbook is proven rather than described.

`skills/measure-orchestrator/references/dsh.md` maps the Measure roles to DSH subagent calls, and the plugin registers `/measure-orchestrate`. Nothing has ever executed that mapping end to end: the Lead has never spawned a Red role and a Green role on a disposable Measure project with the guard watching, so nobody knows whether the handoffs hold (for example, whether a strict-mode Green agent is blocked because the Red record is per agent). This track builds a disposable rehearsal project, documents the protocol, runs one rehearsal, and records what the guard actually does.

This is test- and documentation-only work plus one evidence run; no shared-core change, no new dependency, no shipped-runtime change except the docs.

## Functional Requirements

- **FR-1 (fixture builder).** `tests/dsh/rehearsal/make-project.sh` is a test-only bash script that builds a throwaway git repository with a minimal Measure project: `measure/index.md` (Tracks Registry link), `measure/tracks.md` with one `[~]` track, `measure/tracks/<id>/plan.md` with one phase and one `[~]` task, and `measure/tracks/<id>/metadata.json` with `actual_tasks: 0`; it makes the initial commit and prints the canonical project path on stdout. `make-project.sh --cleanup <dir>` removes the project (only under the system temp folder). The script never writes outside its temp folder or the caller's expectation of stdout.
- **FR-2 (fixture contract test).** `tests/dsh/test-rehearsal-fixture.sh` joins the CLI contract suite: it builds a fixture, asserts the four Measure files and the git commit exist, feeds the fixture to the plugin's real `loadSnapshot` (via node from `plugins/dsh-measure-guard/src/snapshot.js`), and asserts `hasMeasure`, `parseError === null`, the active track id, and exactly one `[~]` task. It then cleans up.
- **FR-3 (rehearsal protocol).** `skills/measure-orchestrator/references/dsh.md` (the only copy: `bin/install-targets.tsv` installs the orchestrator skill from `skills/` to `~/.agents/skills`; there is no `claude-skills` orchestrator copy) gains a "Rehearsal" section: the Lead builds a fixture, sets the repository mode override `strict` for the fixture root (the same `repos.json` seam the adapter reads), spawns the Red subagent (`cwd` = fixture: write a failing test, run it, report the failure), then the Green subagent (`cwd` = fixture: run the failing test itself, implement until green, commit with a git note), then the Review subagent (read-only against the spec); it records the two integration facts the rehearsal must prove — (a) the Red record is per agent, so a strict-mode Green must run the failing test itself before a source edit is allowed; (b) a project write inside `measure/` is always allowed, so a plan/tracks edit never needs the Red phase. The section names the evidence to capture and the cleanup step (clear the mode override).
- **FR-4 (executed rehearsal).** The Lead runs one rehearsal on a fixture with the live guard: Red and Green are real DSH subagents spawned with `cwd` = the fixture; the evidence records the fixture path, the subagent targets, the guard denies/notes observed, the test failure and pass, and the commit. The fixture is removed and the mode override cleared afterwards; the evidence is stored under `measure/runs/dsh_measure_team_rehearsal_20261107/`.
- **FR-5 (documentation and closeout).** The plugin README, `docs/dsh.md`, `CHANGELOG.md`, `measure/lessons-learned.md`, `measure/tech-debt.md`, and the track metadata record the rehearsal and what it proved; the track is archived with a registry update.

## Non-Functional Requirements

- **NFR-1 (test-only fixture).** The builder lives under `tests/dsh/` and is not part of the shipped plugin; it uses bash and the system temp folder only.
- **NFR-2 (no core change, no dependency).** Both parity gates stay green; no new package.
- **NFR-3 (guard-clean evidence).** The rehearsal uses the real plugin; its evidence is the guard's own behaviour (denies and notes), not a simulation.
- **NFR-4 (cleanup).** No fixture, temp state, mode override, or subagent is left behind; the repo is clean after the run.

## Acceptance Criteria (track level)

- Given the repository, When I run `bash tests/dsh/run.sh`, Then the fixture contract test passes along with the existing contract tests.
- Given the plugin package, When I run `node --test plugins/dsh-measure-guard/tests/*.test.js`, Then every test passes; both parity gates print `parity: ok`; `bash tests/spec_review_gate/run.sh` passes.
- Given the evidence folder, Then it contains the fixture path, the subagent targets, the observed guard behaviour, the fail/pass test output, and the commit.
- Given the track completes, Then the skill reference, README, docs, CHANGELOG, lessons, tech-debt, and metadata are updated and the track is archived.

## Out of Scope

- Changing the guard's per-agent Red record (the rehearsal documents it; a design change would be its own track).
- Automating a full multi-phase orchestration or model/provider routing.
- Windows paths and platform packaging.
