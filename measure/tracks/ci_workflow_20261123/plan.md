# Implementation Plan: CI workflow for the measure repo

Track: `ci_workflow_20261123`
Spec: [./spec.md](./spec.md)

**All commits go on chore/ci-workflow. Push only to origin/chore/ci-workflow, never to main. Only the PM or Daniel merges.**

Test commands: `bash tests/spec_review_gate/run.sh`; `bash tests/dsh/run.sh`; `bash plugins/dsh-measure-guard/scripts/check-parity.sh`; `bash plugins/opencode-measure-guard/scripts/check-parity.sh` (from the PM assignment). Run each long command through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PRIORITY=p1`.

## Phase 1: CI workflow runs the repo checks (due 2026-11-25)

- [ ] Task 1.1 Red: add a local contract test `tests/ci/test-workflow.sh` that checks the workflow file (triggers pull_request and push to main, the four commands, one job, read-only permissions, pinned action versions). The test must fail before the workflow exists. Wire it into an existing runner or into its own `tests/ci/run.sh`, as the Red round decides.
- [ ] Task 1.2 Green: add `.github/workflows/ci.yml`. Push the branch and open the pull request. The Actions run must pass. Fix each runner-only failure at the root (no test is skipped).
- [ ] Task 1.3 Proof: push a throwaway branch with one deliberately broken test and show the red check. Delete that branch, remote and local. Set the required check on main when the repo settings allow it with the `gh` token; else record the one blocking setting. Close the tech-debt "no CI" row.
- [ ] Task 1.4 Records: record the green run, the red proof, the branch deletions, and the required-check state in this plan.
