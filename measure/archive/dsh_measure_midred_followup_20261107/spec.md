# Specification: DSH Measure mid-red rename follow-up

## Overview

The mid-red rename track shipped (a production file renamed into `tests/` can no
longer bypass the mid-red gate), but its fresh review found that the
implementation duplicates an approach the same script already uses and that the
test surface has no normal case:

1. **A second command and a tab parser are unnecessary.** The spec-review block
   in the same file lists both sides of a rename with **one** call,
   `git diff --name-only --no-renames -z <baseline>..HEAD`
   (`measure_interphase_checks.py`, the scope listing), which
   `test_edge_rename_into_runs_folder_lists_old_path` proves. The shipped fix
   adds a second `--name-status` call plus tab parsing instead.
2. **No control case.** FR-2 requires a commit that changes no non-test file to
   keep the mid-red report clean, but no test covers it, and the rename test
   asserts only the presence of the old path (not that the new `tests/a.py` path
   is absent from the non-test list).
3. **The Red ordering is not reproducible.** The plan applied the fix first and
   then asked for a Red run "against the unmodified function" without naming the
   revert mechanism or the record location.
4. **A fixture command is not runnable as written** (`git mv` into a missing
   `tests/` directory).

This follow-up simplifies `committed_files()` to the proven single call, adds the
control case, and corrects the archived record with the executed order and
evidence. No behaviour changes beyond the simpler implementation.

## Functional Requirements

- **FR-1 (one call, no parser).** `committed_files(repo, baseline)` runs
  `git diff --name-only --no-renames -z <baseline>..HEAD`, splits on NUL, and
  returns the sorted, deduplicated, non-empty paths (empty on a git failure).
  With rename detection forced off, a rename lists its old path as a deletion
  and its new path as an addition, so both are present without a second command
  or tab parsing. The docstring states the rule.
- **FR-2 (the control case).** A Red commit that changes only test files leaves
  the mid-red report clean: `role-gate --role mid-red` exits 1 (the missing
  agent-result block remains the only reason) and does **not** print
  `Mid Red changed non-test/non-Measure files`. The rename case additionally
  asserts that the new `tests/a.py` path is not in the report (only the old
  production path is).
- **FR-3 (the corrected record).** The archived mid-red track's spec/plan state:
  the single-call approach (the follow-up's implementation), the fixture's
  `mkdir tests` step, the control case, and the executed Red order with its
  evidence (the delivered test was run against the previous function via a
  temporary copy/revert; old code exits 0, fixed code exits 1 with the old path).
  The follow-up's own `spec-review.md` records this review and the responses.
- **FR-4 (records).** `measure/tech-debt.md`'s resolved rename row names the
  single-call approach; the checker's docstring matches; docs/CHANGELOG stay
  accurate.

## Non-Functional Requirements

- **NFR-1 (no behaviour change).** The mid-red gate's decision set is identical
  for a rename (old path included) and for a test-only change (nothing listed);
  the spec-review scope path is untouched.
- **NFR-2 (no plugin change).** Node suite stays 288/288; both parity gates green.
- **NFR-3 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the checker, When I run the full checker tests, Then the rename case, the
  control case, and the existing tests pass; `bash tests/spec_review_gate/run.sh`
  is 10/10.
- Given the previous implementation, Then the control case and the simplified
  function differ only in implementation (same results for both cases).
- Given the node suite and both parity gates, Then they stay green.
- Given the archived mid-red track, Then its record states the single-call
  approach, the mkdir step, the control case, and the reproducible Red order.

## Out of Scope

- Reopening the spec-review scope listing (already solved with `--no-renames`).
- The other spec_review_gate runner/parser rows in tech-debt.
- Windows paths and platform packaging.
