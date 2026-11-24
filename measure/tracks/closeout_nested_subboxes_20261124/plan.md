# Implementation Plan: Closeout ignores nested sub-boxes

Track: `closeout_nested_subboxes_20261124`
Spec: [./spec.md](./spec.md)

**All commits go on fix/closeout-nested-subboxes. Push only to origin/fix/closeout-nested-subboxes, never to main. Only the PM or Daniel merges.**

Test commands: `bash tests/spec_review_gate/run.sh`. Run each long local command through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PRIORITY=p1`. This wrapper applies to local runs only.

Light lane: spec review runs once. Red, Green, Review A, phase acceptance, and closeout run. Final acceptance does not run.

## Phase 1: Closeout ignores nested sub-boxes (due 2026-11-27)

- [ ] Task 1.1 Red: add the contract test `tests/spec_review_gate/test_closeout_nested_subboxes.py` (same style as the other `tests/spec_review_gate` Python tests; runs in CI through `tests/spec_review_gate/run.sh` with no edit of `run.sh`). The test checks FR-1 through FR-4 and fails before the checker edit. Each case names its fixture plan text and its expected feedback. Fixtures: the Math shape (top-level `- [x] Task: ...` lines with SHAs and indented `- [ ]` sub-boxes) gives empty feedback; a top-level `- [ ]` task gives `plan task is not complete`; a top-level `- [~]` task gives `plan task is not complete`; a nested `- [ ]` box under an `[x]` parent without a SHA gives `completed plan task lacks commit SHA`; a nested `- [ ]` box under a `[ ]` parent gives `plan task is not complete`; a nested `- [x]` box without a SHA under an uncovered parent gives the SHA message; a nested `- [ ]` box under a `deferred` parent keeps today's feedback; the real-shape fixture copied from Math plan lines 36-60 gives empty feedback; a plan with only nested `[ ]` boxes gives `track_incomplete` zero.
- [ ] Task 1.2 Green: implement FR-1 through FR-3 in `plan_closeout_feedback` and add the CHANGELOG.md entry `Closeout ignores nested sub-boxes under a covered [x] parent`. Suites: `bash tests/spec_review_gate/run.sh`.
- [ ] Task 1.3 PR and records: the build session pushes the branch, opens the pull request, and watches check `checks` green. No merge. Then record the PR number, the check result, and the diff stat in this plan.
