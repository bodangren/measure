# Specification: DSH Measure mid-red gate: rename-aware committed files

## Overview

The spec-review gate already closes the rename gap for its own scope (a rename
lists its old path and its new path, whatever `diff.renames` says —
`test_edge_rename_into_runs_folder_lists_old_path`). The **mid-red** gate has
the same gap and not the same fix: `non_test_committed_files()` walks
`committed_files()`, which uses plain `git diff --name-only <baseline>..HEAD`;
with rename detection on, a rename prints only its new path, so a Red commit can
move a production file into `tests/` and the check misses the old production
path. This track makes `committed_files()` rename-aware (it unions the old and
new path of every rename, parsed from `git diff --name-status --diff-filter=R`)
and adds the mid-red regression test.

This is a verification-accuracy fix in the shipped orchestrator skill script
(`skills/measure-orchestrator/scripts/measure_interphase_checks.py`); no other
role's behavior changes.

> **Follow-up correction (2026-11-07, dsh_measure_midred_followup_20261107):**
> the normative text is kept as shipped, with two dated corrections: (1) FR-1 was
> first implemented as a two-call union (a `--name-only` call plus a
> `--name-status --diff-filter=R` tab parse); the follow-up replaced it with the
> single `git diff --name-only --no-renames -z <baseline>..HEAD` call the
> spec-review scope already uses, and a control case proves a test-only Red commit
> keeps the clean PASS. (2) FR-3's fixture recipe needs a `mkdir tests` before
> `git mv src/a.py tests/a.py` (git does not create the destination directory);
> the executed Red order is recorded in the archived plan.

## Functional Requirements

- **FR-1 (rename-aware `committed_files`).** `committed_files(repo, baseline)`
  returns the union of the `--name-only` paths and **both paths of every rename**
  (`R` record from `git diff --name-status --diff-filter=R <baseline>..HEAD`,
  split on tabs). The result stays sorted and deduplicated; a git failure keeps
  the current empty-list behavior. `diff.renames=true` and `false` both yield
  both paths (with detection off the A/D records already name both, so the union
  is a no-op).
- **FR-2 (the mid-red gate catches the move).** A Red commit that renames a
  production file into a test folder makes `role-gate --role mid-red` report
  `Mid Red changed non-test/non-Measure files` and list the **old** production
  path, with exit 1. A commit that changes no non-test file keeps the report
  clean (control case).
- **FR-3 (the regression test).** `tests/spec_review_gate/test_checker.py` gains
  the mid-red rename case (fixture: base commit with `src/a.py`; commit
  `git mv src/a.py tests/a.py`; run the checker with
  `--role mid-red --phase "Phase S1: Fixture"`, `RED_TEST_COMMAND=false`, and
  `GIT_CONFIG_*` forcing `diff.renames=true`; assert exit 1, the message, and
  `- src/a.py`). The test must fail before the fix (no old path in the list).
- **FR-4 (records).** The checker's `committed_files` docstring states the rename
  rule; `measure/tech-debt.md`'s rename row is updated (the mid-red part
  resolves; any remaining spec-review runner items stay); the track docs and
  review record are archived.

## Non-Functional Requirements

- **NFR-1 (no behavior change elsewhere).** Only `committed_files` (used by
  `non_test_committed_files`) changes; the spec-review scope listing stays on its
  own `--no-renames` path; `tests/spec_review_gate/run.sh` passes 10/10.
- **NFR-2 (no plugin change).** The DSH plugin is untouched; the node suite
  stays 288/288 and both parity gates stay green.
- **NFR-3 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given a Red commit that renames `src/a.py` to `tests/a.py`, When the checker
  runs `role-gate --role mid-red`, Then it exits 1 and prints
  `Mid Red changed non-test/non-Measure files` followed by `- src/a.py`.
- Given the pre-fix code, Then that test fails (the old path is absent).
- Given `bash tests/spec_review_gate/run.sh`, Then all 10 suites pass.
- Given the plugin package, Then the node suite is 288/288 and both parity gates
  print `parity: ok`.

## Out of Scope

- Reopening the spec-review scope fix (already solved).
- The other spec_review_gate robustness rows (checker parser, runner symlinks,
  A11 recipe); they stay in tech-debt.
- Windows paths and platform packaging.
