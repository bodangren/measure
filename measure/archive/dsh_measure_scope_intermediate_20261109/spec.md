# Specification: DSH Measure intermediate-commit scope coverage

## Overview

The parser row's last open item says "the scope rule compares trees, not
intermediate commits". `changed_files(repo, baseline)` and
`committed_files(repo, baseline)` in
`skills/measure-orchestrator/scripts/measure_interphase_checks.py` compare
`baseline..HEAD` as a tree diff, so a path that a commit inside the range touched
and a later commit removed is invisible: the mid-red gate's non-test/non-Measure
check can miss a production file that was edited and reverted (or renamed away and
back) within the phase, and the audit's changed-file scope can under-report the
same way.

This track unions the per-commit paths from `baseline..HEAD` into both functions
(on top of the existing tree and working-tree diffs), and adds a deterministic
S2 adversarial probe: a temporary git repo where one commit adds a production
file and the next deletes it — the mid-red role gate must report
`Mid Red changed non-test/non-Measure files`, while a phase whose only change is
a test file still passes.

## Functional Requirements

- **FR-1 (intermediate paths).** `changed_files()` and `committed_files()` include
  every path touched by a commit in `baseline..HEAD` — added, modified, deleted,
  or renamed (both sides where the history lists them) — in addition to the
  existing tree diff and the working-tree/staged diffs; the result stays sorted,
  deduplicated, and `-z`-safe for paths with spaces.
- **FR-2 (the probe).** `tests/spec_review_gate/test_s2_adversarial.sh` gains a
  probe in a temporary git repository: a Measure plan fixture at the baseline, a
  commit that adds a production file, a commit that deletes it, then
  `role-gate --role mid-red --baseline <baseline>` reports
  `Mid Red changed non-test/non-Measure files`; a second case whose intermediate
  commit only adds a test file reports no such message.
- **FR-3 (records).** The parser row (`measure/tech-debt.md`) drops its last
  residual and is resolved; `CHANGELOG.md` has a bug-fix entry.
- **FR-4 (verification).** srg 11/11, CLI 12/12, node 301/301, both parity gates
  ok; a real phase with no intermediate commits produces the same results as
  before.

## Non-Functional Requirements

- **NFR-1 (bounded).** One extra `git log --name-only` per call; no new
  dependency.
- **NFR-2 (contract preserved).** Paths, sorting, deduplication, and the existing
  messages stay; only the set can grow to include intermediate history.

## Acceptance Criteria (track level)

- Given a baseline..HEAD range where a commit adds and a later commit deletes a
  production file, Then the mid-red gate reports the non-test/non-Measure
  message.
- Given a range whose intermediate commits touch only test files, Then the gate
  reports no such message.
- Given the gates, Then srg 11/11, CLI 12/12, node 301/301, parity ok; each phase
  checkpoint is pushed.

## Out of Scope

- The commit staged-read race and the opencode rows.

> **Correction (2026-11-09, after the review):** the union covers all three
> tree-diff listings — `changed_files()` (tree + working + staged + history),
> `committed_files()` (tree + history), and the inline `spec-review` scope block
> in `cmd_role_gate` (tree + history). The history list is exact bytes:
> `git rev-list baseline..HEAD`, then
> `git diff-tree --no-commit-id --name-only -r -z --no-renames <rev>`, so names are
> not quoted and leading whitespace is preserved (G16 stays green). The probes
> live in `test_checker.py` (the mid-red fixture): spec-review intermediate
> add/delete and inside-runs cases, mid-red intermediate add/delete outside tests
> and test-file-only control, and direct `changed_files()`/`ux_paths()` checks.
> The non-regression check is the full gate set, not a stored before/after.
