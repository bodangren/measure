# Implementation Plan: Green gate ignores the open review task

Track: `green_gate_review_task_20261124`
Spec: [./spec.md](./spec.md)

**All commits go on fix/green-gate-open-review-task. Push only to origin/fix/green-gate-open-review-task, never to main. Only the PM or Daniel merges.**

Test commands: `bash tests/spec_review_gate/run.sh`. Run each long local command through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PRIORITY=p1`. This wrapper applies to local runs only.

Light lane: spec review runs once. Red, Green, Review A, phase acceptance, and closeout run. Final acceptance does not run.

## Phase 1: Green gate ignores the open review task (due 2026-11-27)

- [ ] Task 1.1 Red: add the contract test `tests/spec_review_gate/test_green_gate_review_task.py` (same style as `tests/spec_review_gate/test_gate_track_scope.py` and `tests/spec_review_gate/test_role_gate_heavy_run.py`; runs in CI through `tests/spec_review_gate/run.sh` with no edit of `run.sh`). The test checks FR-1 through FR-3 and fails before the checker edit. Cases: all `[x]` with SHA plus one `[~]` `Review A` task passes; two such `[~]` tasks fail; a `[~]` task that names no later role fails; a `[ ]` review task fails; each of the named later roles passes alone as `[~]`; the mid-red gate and the review-a gate keep their old result; the Lending shape with task 3.5 as `[~]` `Review A` passes.
- [ ] Task 1.2 Green: implement the helper and wire it into the jr-green branch per FR-1 through FR-3. Suites: `bash tests/spec_review_gate/run.sh`.
- [ ] Task 1.3 PR and records: the build session pushes the branch, opens the pull request, and watches check `checks` green. No merge. Then record the PR number, the check result, and the diff stat in this plan.
