# Specification: CI workflow for the measure repo

## Overview

The measure repo has no CI. `measure/tech-debt.md` line 21 records this gap. A GitHub Actions workflow will run the repo checks on each pull request and each push to main. The pre-merge rule becomes a machine check.

Source: PM assignment A-new, due 2026-11-25, light lane, chore track.

## Functional Requirements

- **FR-1 (Triggers).** The workflow runs on each pull request and on each push to main. No other trigger starts it.
- **FR-2 (Checks).** One job runs these four commands in this order:
  1. `bash tests/spec_review_gate/run.sh`
  2. `bash tests/dsh/run.sh`
  3. `bash plugins/dsh-measure-guard/scripts/check-parity.sh`
  4. `bash plugins/opencode-measure-guard/scripts/check-parity.sh`
  The workflow runs exactly these four commands. Each step calls plain `bash ...` with no wrapper, no `HEAVY_` variable, and no path outside the repo.
- **FR-3 (Red contract test).** `tests/ci/test-workflow.sh` checks the workflow file: both triggers, the four commands, one job, read-only permissions, pinned action versions. The test also checks that the workflow names no absolute path outside the repo and no `heavy-run`. The test fails before the workflow file exists. The test lives in its own runner `tests/ci/run.sh`. The runner executes `tests/ci/test-*.sh` and exits 0 only when all pass, like `tests/dsh/run.sh`. The contract test is a local check. The workflow does not run it.
- **FR-4 (Green workflow).** `.github/workflows/ci.yml` holds one job with a stable name (the name feeds the required-check rule). The file pins each action version. The file sets `permissions: contents: read`. The file runs the four commands as plain `bash ...` steps with no wrapper. The file adds no dependency, no matrix, and no cache unless a test needs one.
- **FR-5 (Proof).** The proof pushes one throwaway branch named `ci-proof/red-20261123` with one deliberately broken test. The proof opens a draft pull request from that branch to main. The workflow runs on the pull request and the check shows red. The evidence names the check by its job name from `ci.yml`. The pull request is then closed unmerged (`gh pr close`). The branch is deleted remote and local. Main requires the check when the repo settings allow it with the `gh` token (`gh api` branch protection or a ruleset). When the settings do not allow it, the report names the one setting for the PM.
- **FR-6 (Closeout).** The track closes the "no CI" row in `measure/tech-debt.md` at closeout.
- **FR-7 (Runners).** FR-7 applies to local runs only: Red, Green, review, and acceptance runs on this machine. Each long local command runs through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500` and `HEAVY_PRIORITY=p1`.

## Acceptance Criteria

- A pull request shows the check green.
- A deliberately broken test on branch `ci-proof/red-20261123` shows the check red on its draft pull request to main. The evidence names the check by its job name. The pull request is closed unmerged. That branch is deleted (remote and local).
- Main requires the check, or the report names the one setting that blocks this.
- The tech-debt "no CI" row is closed.

## Out of Scope

- No new test suite and no change to the four commands.
- No matrix, no cache, and no new dependency unless a test needs it.
- No change to branch protection beyond the one required-check rule.
- No fix for a runner-only failure by skipping tests; each fix lands at the root.

## Open Questions

- **Q1 (Runner tools).** The spec does not fix the tool list the runner needs (bash, python3, git, node, jq, bun, or others) for the four commands. Red and Green settle the list by running the workflow, not by guessing.
- **Q2 (Paths outside the repo).** The spec does not fix which paths the tests read outside the repo (for example `/home/daniebo/...`). Red and Green settle this by running the workflow, not by guessing. The wrapper question is already answered: FR-7 applies to local runs only, and the workflow itself uses no wrapper.
