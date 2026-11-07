# Implementation Plan: DSH Measure mid-red rename follow-up

Track: `dsh_measure_midred_followup_20261107`
Spec: [./spec.md](./spec.md)

A small correctness/cleanup track in the shipped orchestrator checker: simplify
the rename handling, add the control case, correct the record, close out. Gates:
`bash tests/spec_review_gate/run.sh` (10/10),
`node --test plugins/dsh-measure-guard/tests/*.test.js` (stays 288), both parity
scripts.

## Phase 1: Simplify and cover [checkpoint: 8cfd295]

- [x] Task 1.1: `skills/measure-orchestrator/scripts/measure_interphase_checks.py`: `committed_files()` becomes one `git diff --name-only --no-renames -z <baseline>..HEAD` call, split on NUL, sorted/deduplicated/non-empty, empty on failure; the docstring states the rule (the second `--name-status` call and the tab parsing are removed)
- [x] Task 1.2: `tests/spec_review_gate/test_checker.py`: add the control case (a Red commit that changes only test files keeps the mid-red report clean) and assert in the rename case that `tests/a.py` is not in the non-test report while `- src/a.py` is
- [x] Task 1.3: run the checker tests and `bash tests/spec_review_gate/run.sh`; both pass (the rename and control cases behave identically under the old and simplified implementations)
- [x] Task: Measure - User Manual Verification 'Phase 1: Simplify and cover' (Protocol in workflow.md) `8cfd295`

## Phase 2: The corrected record and closeout [checkpoint: da75968]

- [x] Task 2.1: annotate the archived mid-red track's spec/plan with the single-call approach, the fixture's `mkdir tests` step, the control case, and the executed Red order/evidence; write this track's `spec-review.md` with the review and the responses; update the resolved `measure/tech-debt.md` row's resolution note
- [x] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md` `a481293`
- [x] Task: Measure - User Manual Verification 'Phase 2: The corrected record and closeout' (Protocol in workflow.md) `da75968`
