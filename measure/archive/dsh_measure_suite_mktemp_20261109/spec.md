# Specification: DSH Measure Suite mktemp-failure guard

## Overview

The spec-review-gate suites build their fixtures under `mktemp -d`. Most guard a
failed `mktemp`, but two do not — `tests/spec_review_gate/test_s1_standard.sh`
and `tests/spec_review_gate/test_s1_new_track.sh` call `TMP="$(mktemp -d)"` with no
failure check, so a failed `mktemp` (full disk, bad `TMPDIR`) would leave them
running with an empty `TMP` and produce confusing failures (or, worse, fixtures
rooted at the wrong place) instead of a clear FAIL. The remaining suites guard
it with inconsistent messages ("mktemp -d failed; no fixture can be built" vs
"mktemp -d did not return a folder").

This track gives every suite the same guard: on failure, print
`FAIL: mktemp -d failed; no fixture can be built`, print its summary line with
one FAIL, and exit 1. It adds a new suite that stubs `mktemp` on `PATH` and runs
every other suite to prove the guard fires for each one, and it resolves the
tech-debt MKTEMP row.

## Functional Requirements

- **FR-1 (the guard).** Every `tests/spec_review_gate/test_*.sh` suite creates
  its workspace as `TMP="$(mktemp -d)" || TMP=""` and, when `TMP` is empty or not
  a directory, prints `FAIL: mktemp -d failed; no fixture can be built`, prints
  the suite's normal `=== Total: N checks (PASS=X, FAIL=Y) ===` summary with
  PASS=0, FAIL=1, and exits 1.
- **FR-2 (the proof).** A new suite `tests/spec_review_gate/test_mktemp_failure.sh`
  writes a `mktemp` stub that exits 1, runs every other `test_*.sh` with the stub
  first on `PATH`, and asserts each exits 1 with the guard message; the stubbed
  runs must finish quickly and create no file in the repository.
- **FR-3 (consistency).** All suites use the exact guard message (the older
  "did not return a folder" text is gone), and the existing summaries and flags
  are preserved when `mktemp` works.
- **FR-4 (records).** `measure/tech-debt.md`'s MKTEMP item is resolved with the
  new suite named; `CHANGELOG.md` has a bug-fix entry.
- **FR-5 (verification).** `bash tests/spec_review_gate/run.sh` is 11/11 (the new
  suite joins with the others), the node suite is 301/301, both parity gates are
  ok, and `bash tests/dsh/run.sh` is 12/12.

## Non-Functional Requirements

- **NFR-1 (bounded).** The new suite runs each other suite under a failing stub;
  no network, no repository write, and each stubbed run ends immediately.
- **NFR-2 (contract preserved).** The suites behave exactly as before when
  `mktemp` works; the gate still passes 11/11.

## Acceptance Criteria (track level)

- Given a failing `mktemp` on `PATH`, Then every suite exits 1 with the guard
  message and a one-FAIL summary.
- Given a working `mktemp`, Then the gate is 11/11 and CLI 12/12.
- Given the tech-debt row, Then the MKTEMP item is resolved and names the proof
  suite.
- Given each phase checkpoint, Then it is pushed.

## Out of Scope

- The parser scope rule, the commit staged-read race, and the opencode/A11
  report-only rows.

> **Correction (2026-11-09, after the review):** "every suite" means every shell
> suite; `test_checker.py` uses `tempfile.mkdtemp` and is out of scope. The guard
> has two halves — empty and not-a-directory — and the proof exercises both (the
> second stub exits 0 and prints a regular file). Each stubbed run is bounded by
> `timeout 60`; the repository snapshot includes `--ignored`. The preserved
> contract is the nine existing suites' checks/summaries/flags and the 11/11
> gate. The acceptance mirrors the gates: srg 11/11, CLI 12/12, node 301/301,
> both parity gates. The older guard message is replaced in the three docs
> suites; the distinct `tempfile.mkdtemp` message in `test_checker.py` stays.
