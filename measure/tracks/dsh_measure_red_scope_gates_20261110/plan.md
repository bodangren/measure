# Implementation Plan: DSH Measure track-scoped gates

Track: `dsh_measure_red_scope_gates_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The two helpers and the three gates

- [x] Task 1.1: `skills/measure-orchestrator/scripts/measure_interphase_checks.py`: add `scoped_changed_files` and `own_commits_after`; use them in the spec-review outside-`measure/runs/` rule, `ux_paths` (with `--track` on the command and the role gate), and the Jr Green HEAD-advance check `bc3c63e`
- [x] Task 1.2: `tests/spec_review_gate/test_red_track_scope.py`: own-only paths, the None fallbacks, `ux_paths` with a track, `own_commits_after` for another-track-only, and the Jr Green subprocess case `bc3c63e`
- [x] Task 1.3: run `bash tests/spec_review_gate/run.sh` (12/12 with the extended suite), `bash tests/dsh/run.sh` (14/14), the node suite, and both parity gates `bc3c63e`
- [~] Task: Measure - User Manual Verification 'Phase 1: The two helpers and the three gates' (Protocol in workflow.md)

## Phase 2: Records and closeout

- [ ] Task 2.1: update the contracts.md Baseline/HEAD-advance bullets and the (deduplicated) tech-debt row, add the `CHANGELOG.md` entry; record the live check, run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_red_scope_gates_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
