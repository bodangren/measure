# Specification: DSH Measure commit guard nested fix4

## Overview

The nested fix3 track closed the `-o`/`-O` forms but its review found the
option-argument rule was keyed on exact option names and the `--` rule was
unpinned:

- **F1:** `bash -euo pipefail -c "git add …"` (the `o` of the `-euo` cluster takes
  the next argument) and `bash --rcfile FILE -c "git add …"` still hide the add.
- **F2:** the `--` branch only alters `bash -o pipefail -- -c …`, which bash
  rejects; `bash -c -- <string>` already worked, and the rule was not pinned by a
  case.
- **F3–F7:** the review-record, residual, fix1-F5, CHANGELOG-count, and fix2
  off-by-one tasks named no target files or values, and the fix2 spec still says
  "depth 5 and beyond returns `all: true`".

This track implements the option-argument class by behavior (a known option that
takes an argument, or a short cluster ending in `o`/`O`), pins the `--` behavior
(`bash -c -- <string>` scans; `--` before any `-c` stops the scan, matching
bash), adds the missing cases, and corrects the records with named files.

## Functional Requirements

- **FR-1 (option arguments).** While hunting for the `-c` cluster: an option that
  takes an argument is stepped over with its argument — `-o`, `-O`, a short
  cluster ending in `o`/`O` (`-euo`), `--rcfile`, and `--init-file`; a
  `--opt=value` token is one token. `bash -euo pipefail -c "git add x"` and
  `bash --rcfile FILE -c "git add x"` return the path.
- **FR-2 (`--`).** A `--` after the `-c` cluster is skipped and the following word
  is the command string (`bash -c -- <string>` scans it). A `--` before any
  `-c` cluster ends option processing with no command string, so nothing is
  scanned (`bash -- -c <string>`, `bash -o pipefail -- -c <string>`), matching
  bash's own behavior.
- **FR-3 (the tests).** Cases for `bash -euo pipefail -c`, `bash --rcfile FILE
  -c`, `bash -c -- <string>` (path), and `bash -- -c <string>` (no path); the
  existing boundary pair and all earlier cases stay.
- **FR-4 (records, named files).** The fix2 review is recorded in
  `measure/archive/dsh_measure_commit_nested_fix2_20261109/spec-review.md`
  (findings with severity/scope, dispositions, date, reviewer) and linked from
  that index; the fix2 spec gets a dated note in its `spec.md` correction block;
  the false fix1 finding text in
  `measure/archive/dsh_measure_commit_nested_20261109/spec-review.md` gets a
  dated correction appended (not rewritten); the fix2 spec's "depth 5 and
  beyond" sentence is corrected; the commit-race row in `measure/tech-debt.md`
  names unknown-argument options, wrapper scripts, and shell functions as the
  residual; the `CHANGELOG.md` commit-guard bullet states `node 312 tests`.
- **FR-5 (verification).** node suite 312/312, both parity gates ok, CLI 13/13,
  srg 11/11.

## Non-Functional Requirements

- **NFR-1 (bounded).** Token-level scanning; no new dependency.
- **NFR-2 (contract preserved).** Existing cases keep their results; only the
  newly recognized option-argument forms and the `--`-before-`-c` behavior are
  pinned.

## Acceptance Criteria (track level)

- Given `bash -euo pipefail -c "git add x"` and `bash --rcfile FILE -c "git add
  x"`, Then the path is returned.
- Given `bash -- -c "git add x"`, Then no path; given `bash -c -- "git add x"`,
  Then the path.
- Given the fix2 archive, Then its review record exists with severity/scope and
  dispositions and is linked; the fix1 finding carries a dated correction; the
  fix2 spec's off-by-one sentence is corrected.
- Given the gates, Then node 312/312, CLI 13/13, srg 11/11, parity ok; each phase
  checkpoint is pushed.

## Out of Scope

- Options with arguments not in the known list; arbitrary wrapper scripts and
  shell functions.

> **Correction (2026-11-09, before the review):** the node suite is 311 tests
> after this track's cases (not 312): the option/`--` case is one test block.
