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
- **FR-3 (Red contract test).** `tests/ci/test-workflow.sh` checks the workflow file: both triggers, the four commands, one job, read-only permissions, pinned action versions. The test fails before the workflow file exists. The implementer wires it into an existing runner or into its own `tests/ci/run.sh`, as the Red round decides.
- **FR-4 (Green workflow).** `.github/workflows/ci.yml` holds one job with a stable name (the name feeds the required-check rule). The file pins each action version. The file sets `permissions: contents: read`. The file adds no dependency, no matrix, and no cache unless a test needs one.
- **FR-5 (Proof).** A throwaway branch with one deliberately broken test shows a red check. The branch is deleted after the proof, remote and local. Main requires the check when the repo settings allow it with the `gh` token (`gh api` branch protection or a ruleset). When the settings do not allow it, the report names the one setting for the PM.
- **FR-6 (Closeout).** The track closes the "no CI" row in `measure/tech-debt.md` at closeout.
- **FR-7 (Runners).** Each long command runs through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500` and `HEAVY_PRIORITY=p1`.

## Acceptance Criteria

- A pull request shows the check green.
- A deliberately broken test on a throwaway branch shows the check red, and that branch is deleted (remote and local).
- Main requires the check, or the report names the one setting that blocks this.
- The tech-debt "no CI" row is closed.

## Out of Scope

- No new test suite and no change to the four commands.
- No matrix, no cache, and no new dependency unless a test needs it.
- No change to branch protection beyond the one required-check rule.
- No fix for a runner-only failure by skipping tests; each fix lands at the root.

## Open Questions

- **Q1 (Runner tools).** The spec does not fix the tool list the runner needs (bash, python3, git, node, jq, bun, or others) for the four commands. Red and Green settle the list by running the workflow, not by guessing.
- **Q2 (Paths outside the repo).** The spec does not fix which paths the tests read outside the repo (for example `/home/daniebo/...`). Red and Green settle this by running the workflow, not by guessing.
