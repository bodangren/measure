# Specification: DSH Measure commit guard nested fix3

## Overview

The nested fix2 track widened the shell recognition but its review found:

- **F2:** the cap text is off by one — the shipped check is `depth > 3`, so the
  fourth nested level already fails closed; the five-level test passes under
  four- and five-level caps, so it does not pin the value.
- **F3:** `bash -o pipefail -c '…'` and `bash -O extglob -c '…'` stop the option
  loop at the option argument, so a real `-c` command is missed; `--` handling is
  unspecified.
- **F1:** the plan named no review-record/correction-note files.
- **F4:** the fix1 review's F5 claim ("already a taken change via
  `GIT_ADD`/`takesChanges`") is false — the adapter's `stagedFiles` receives
  `commitTakesAll`, not the core `takesChanges`, and the fixture had empty
  staged/status, so only the recursion denied it.
- **F5:** "the four rules" is undefined and the CHANGELOG still says `node 306
  tests` while the suite is 308+.

This track fixes the option-argument scanning, adds a boundary pair (three
nested shells → path; four → `all: true`), and corrects the records.

## Functional Requirements

- **FR-1 (option arguments).** The shell scan skips the argument of `-o`/`-O`
  (and a long option in the `--opt=value` form) while looking for the
  `-c`-bearing option cluster; `bash -o pipefail -c "git add x"` and `bash -O
  extglob -c "git add x"` return the path. A `--` token before the command word
  is skipped. An option that takes an argument without a known name remains a
  named residual.
- **FR-2 (the cap boundary).** The spec and comment state `depth > 3` (the
  exported call is depth 0; three nested shells are scanned; the fourth nested
  level returns `all: true`), and a boundary test asserts both (three nested →
  path; four nested → `all: true`).
- **FR-3 (records).** The fix2 review is recorded with F1–F5 dispositions in
  `measure/archive/dsh_measure_commit_nested_fix2_20261109/spec-review.md`, the
  file is linked from that index, and the fix2 spec gets a dated correction note
  naming this file; the fix1 review's F5 disposition is corrected (the fixture
  had empty staged/status, so only the recursion denied it); the CHANGELOG
  states the suite count and the residual names the option-argument and
  arbitrary-wrapper/function limits precisely.
- **FR-4 (verification).** node suite passes (308+), both parity gates ok,
  CLI 13/13, srg 11/11.

## Non-Functional Requirements

- **NFR-1 (bounded).** Token-level only; no new dependency.
- **NFR-2 (contract preserved).** Existing cases keep their results; only the
  newly recognized option-argument spellings become stricter.

## Acceptance Criteria (track level)

- Given `bash -o pipefail -c "git add x"` and `bash -O extglob -c "git add x"`,
  Then the path is returned.
- Given three nested `bash -c` shells, Then the path is returned; given four,
  Then `all: true`.
- Given the fix2 review, Then it holds F1–F5 with dispositions and is linked;
  the fix1 F5 disposition is corrected.
- Given the gates, Then node 308+ passes, CLI 13/13, srg 11/11, parity ok; each
  phase checkpoint is pushed.

## Out of Scope

- Options with unknown arguments, arbitrary wrapper scripts, and shell
  functions.

> **Correction (2026-11-09, dsh_measure_commit_nested_fix4_20261109):** the option
> loop steps over the argument of `-o`/`-O`, a short cluster ending in `o`/`O`
> (`-euo`), `--rcfile`, and `--init-file`; a `--` after `-c` is skipped while a
> `--` before any `-c` stops the scan (matching bash). The residual target is the
> commit-race row in `measure/tech-debt.md`. The fix2 review is recorded in its
> archive with severity/scope and dispositions; the fix1 F5 finding carries an
> appended dated correction; the fix2 spec's "depth 5 and beyond" sentence is
> corrected to `depth > 3` with a boundary pair. The CHANGELOG states `node 311
> tests`.
