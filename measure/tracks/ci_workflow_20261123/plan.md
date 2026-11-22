# Implementation Plan: CI workflow for the measure repo

Track: `ci_workflow_20261123`
Spec: [./spec.md](./spec.md)

**All commits go on chore/ci-workflow. Push only to origin/chore/ci-workflow, never to main, except Task 1.3. Task 1.3 may also push one throwaway branch named ci-proof/red-20261123 and nothing else. Only the PM or Daniel merges.**

Test commands: `bash tests/spec_review_gate/run.sh`; `bash tests/dsh/run.sh`; `bash plugins/dsh-measure-guard/scripts/check-parity.sh`; `bash plugins/opencode-measure-guard/scripts/check-parity.sh` (from the PM assignment). Run each long local command through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PRIORITY=p1`. This wrapper applies to local runs only. The workflow itself uses plain `bash ...` steps.

## Phase 1: CI workflow runs the repo checks (due 2026-11-25)

- [ ] Task 1.1 Red: add a local contract test `tests/ci/test-workflow.sh` that checks the workflow file (triggers pull_request and push to main, the four commands, one job, read-only permissions, pinned action versions; also no absolute path outside the repo and no heavy-run). The test must fail before the workflow exists. Wire it into its own runner `tests/ci/run.sh`, which runs `tests/ci/test-*.sh` and exits 0 only when all pass.
- [ ] Task 1.2 Green: add `.github/workflows/ci.yml`. Push the branch and open the pull request. The Actions run must pass. Fix each runner-only failure at the root (no test is skipped).
- [ ] Task 1.3 Proof: push throwaway branch `ci-proof/red-20261123` with one deliberately broken test; the branch is never merged. Open a draft pull request from that branch to main. Show the red check on that pull request and name the check by its job name. Close the pull request unmerged (`gh pr close`). Delete the branch remote and local. Set the required check on main when the repo settings allow it with the `gh` token; else record the one blocking setting. Close the tech-debt "no CI" row.
- [ ] Task 1.4 Records: record the green run, the red proof, the branch deletions, and the required-check state in this plan.
