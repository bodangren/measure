# Implementation Plan: Audit roles may run role-gate

Track: `audit_role_gate_allow_20261123`
Spec: [./spec.md](./spec.md)

**All commits go on chore/audit-role-gate-allow. Push only to origin/chore/audit-role-gate-allow, never to main. Only the PM or Daniel merges.**

Test commands: `bash tests/spec_review_gate/run.sh`. Run each long local command through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PRIORITY=p1`. This wrapper applies to local runs only.

## Phase 1: Audit roles may run role-gate (due 2026-11-26)

- [ ] Task 1.1 Red: add the contract test `tests/spec_review_gate/test_audit_role_gate_allow.sh` (same `v2_shell_effect` helper and runner convention as `tests/spec_review_gate/test_s2_role_docs.sh`; runs in CI through `tests/spec_review_gate/run.sh`). The test checks FR-1 through FR-3, records the accepted-gap case (a role-gate command followed by `; rm x` gives allow), and fails before the agent-file edit.
- [ ] Task 1.2 Green: add the one allow rule to each of the 8 audit agent files per FR-1 and FR-2. Suites: `bash tests/spec_review_gate/run.sh`.
- [ ] Task 1.3 PR and CI: the build session pushes the branch, opens the pull request, and watches check `checks` green. No merge.
- [ ] Task 1.4 Records: record the PR number, the check result, and the diff stat in this plan.
