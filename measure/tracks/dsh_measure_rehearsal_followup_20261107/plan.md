# Implementation Plan: DSH Measure rehearsal follow-up corrections

Track: `dsh_measure_rehearsal_followup_20261107`
Spec: [./spec.md](./spec.md)

A bug-fix track: harden the fixture contract test, correct the archived review
claims and rules, then the evidence and closeout. The gate is
`node --test plugins/dsh-measure-guard/tests/*.test.js` (stays 288), both parity
scripts, `bash tests/dsh/run.sh`, and `bash tests/spec_review_gate/run.sh`.

## Phase 1: Fixture contract hardening [checkpoint: 75bc45a]

- [x] Task 1.1: `tests/dsh/test-rehearsal-fixture.sh` asserts a real commit: `git -C "$PROJECT" rev-parse --verify HEAD` succeeds and `git -C "$PROJECT" log --oneline` lists exactly one commit (the `.git/HEAD` existence check is removed as the commit proof)
- [x] Task 1.2: run `bash tests/dsh/run.sh`; the new assertion passes alongside the existing contract tests
- [x] Task: Measure - User Manual Verification 'Phase 1: Fixture contract hardening' (Protocol in workflow.md) `75bc45a`

## Phase 2: The archived review corrections

- [~] Task 2.1: correct the archived rehearsal track's `spec.md` (Overview and FR-4 state exactly what ran; acceptance fields defined), the Rehearsal section in `skills/measure-orchestrator/references/dsh.md` (parent-session root in the closing summary; the exact "always allowed" rule with the closeout/registry/shell exceptions), and its `metadata.json` deviation notes (Accepted Risk for the deferred isolated-session strict path, naming the Host `session.create` cwd lead)
- [ ] Task 2.2: write the archived track's `spec-review.md`: this round's findings, the author responses, and the explicit Accepted Risk for the unexecuted strict path
- [ ] Task: Measure - User Manual Verification 'Phase 2: The archived review corrections' (Protocol in workflow.md)

## Phase 3: Evidence and closeout

- [ ] Task 3.1: extend `measure/runs/dsh_measure_team_rehearsal_20261107/live-rehearsal.md` with the two subagent ids and their roles, the exact commands, the guard output observed, and the cleanup checks with their commands and results (fixture absent, `repos.json` has no fixture root, plugin reloaded, `git status` clean)
- [ ] Task 3.2: update `docs/dsh.md` if any statement about the guard root is now inexact; closeout documents (`measure/lessons-learned.md`, `measure/tech-debt.md`), `metadata.json`, archive the track, update `measure/tracks.md`
- [ ] Task: Measure - User Manual Verification 'Phase 3: Evidence and closeout' (Protocol in workflow.md)
