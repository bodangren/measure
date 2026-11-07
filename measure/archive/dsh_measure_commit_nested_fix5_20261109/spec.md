# Specification: DSH Measure commit guard nested fix5

## Overview

The nested fix4 track closed the option-argument forms but its review found:

- **F1/F2 [Blocker/Major]:** the plan named this track's own `spec-review.md` as
  the fix3 review's target, and FR-4 listed records that already existed while
  the actually missing fix3 review record was not a requirement.
- **F3 [Major]:** FR-4/FR-5/acceptance said `node 312` while the suite is 311.
- **F4 [Major]:** the "not pinned by a case" premise was false — the `bash -c --`
  case already existed.
- **F5 [Major]:** the `--` reversal falsifies prior correction notes that say the
  loop skips any `--` before the command word; those statements need dated
  corrections rather than silence.
- **F6 [Major]:** `--init-file FILE -c` is a required form with no case.
- **F7 [Nit]:** the shipped walk sets `takesCommand` for any option token whose
  text contains `c`, so `bash --norc -- -c <string>` (bash rejects it) scans; the
  rule should key on short option clusters only.

This track tightens the `-c` detection to short option clusters, adds the
`--init-file` and `--norc` cases, and corrects the records with named targets.

## Functional Requirements

- **FR-1 (short-cluster `-c`).** `takesCommand` is set only by a short option
  cluster containing `c` (`-c`, `-lc`, `-xc`); a long option such as `--norc` does
  not set it, so `bash --norc -- -c <string>` does not scan (matching bash's
  rejection), while `bash -euo pipefail -c`, `bash --init-file FILE -c`, and
  `bash --rcfile FILE -c` do.
- **FR-2 (the cases).** Unit cases for `bash --init-file FILE -c "git add x"`
  (path) and `bash --norc -- -c "git add x"` (no path); all existing cases stay.
- **FR-3 (records, named targets).** The fix3 review is recorded in
  `measure/archive/dsh_measure_commit_nested_fix3_20261109/spec-review.md` (not
  in this track's own review file) and linked from that index; the fix4 plan's
  wrong target is corrected by a dated note in the fix4 `spec.md`; the node count
  is stated as 311 wherever FR-4/FR-5/acceptance mention 312; prior `--`
  statements in `measure/archive/dsh_measure_commit_nested_fix2_20261109/spec.md`
  and `measure/archive/dsh_measure_commit_nested_fix3_20261109/spec.md` get dated
  corrections describing the shipped behavior (`--` after `-c` skipped, before
  `-c` stops the scan); the `measure/tech-debt.md` residual keeps only
  option-argument forms outside the known set, wrapper scripts, and shell
  functions; the `CHANGELOG.md` bullet states `node 313 tests` after this
  track's two cases.
- **FR-4 (verification).** node 313/313, both parity gates ok, CLI 13/13,
  srg 11/11.

## Non-Functional Requirements

- **NFR-1 (bounded).** Token-level; no new dependency.
- **NFR-2 (contract preserved).** Existing cases keep their results; the
  `--norc` command becomes not-scanned (over-approximation removed).

## Acceptance Criteria (track level)

- Given `bash --init-file FILE -c "git add x"`, Then the path is returned.
- Given `bash --norc -- -c "git add x"`, Then no path.
- Given the fix3 archive, Then its review record exists there and is linked, and
  the fix4 plan's wrong target has a dated correction.
- Given the gates, Then node 313/313, CLI 13/13, srg 11/11, parity ok; each phase
  checkpoint is pushed.

## Out of Scope

- Options with arguments outside the known list; wrapper scripts; shell
  functions.

> **Correction (2026-11-09, before the review):** the node suite is 312 tests
> after this track's single case block (not 313); the base was 311.

> **Follow-up correction (2026-11-09, after the review):** the missing record was
> the fix4 review, written to
> `measure/archive/dsh_measure_commit_nested_fix4_20261109/spec-review.md`; the
> fix3 review already existed. This track's two assertions form one test block,
> so the base 311 becomes 312. The fix4 plan holds a dated review-target
> correction, and the fix3 spec holds a dated CHANGELOG-count correction (310
> before fix4, 312 after fix5). Dated corrections are appended, not rewritten.
