# Specification: DSH Measure gate timing

## Overview

Two adversarial suites bound wall-clock runtime with a 5-second constant: the S4 doc-drift
recipe on 10,000 path claims per document (`G5 time`) and the S3 dispositions checker on
20,000-line and 50,000-item logs (`G18 time limits`). Under a loaded machine the gate then
fails without any regression — observed while archiving the commit-wrapper track: `G5` took
5.62 s while another suite ran, and the gate went red with a clean tree; the same suites
pass when run alone. That is a verification-reliability defect: the checks exist to catch
algorithmic blowups (quadratic loops, per-item subprocesses), which are orders of magnitude
slower than the bound, not to police scheduler noise.

This track makes both budgets tolerant of a loaded machine while keeping the algorithmic
detection: the S4 G5 budget is calibrated from a tenth-size run of the same recipe
(extrapolated x5 with a 20 s floor), and the S3 G18 budget becomes a 30 s constant with the
measured reason; a load probe (busy loops running beside the suite) proves the suite passes
where the old 5 s constant failed.

## Functional Requirements

- **FR-1 (S4 calibrated budget).** `test_s4_adversarial.sh` runs the A11 recipe on a
  1,000-claim-per-document fixture, extrapolates its runtime to the 10,000-claim case with a
  5x allowance and a 20 s floor, and uses that budget for the `G5 time` check; the message
  prints the budget and the measured seconds, and the 20,000-candidate-line assertion is
  unchanged.
- **FR-2 (S3 budget).** `test_s3_adversarial.sh` uses a 30 s budget for the `G18 time
  limits` probes with a comment naming the observed load flake and why an algorithmic
  regression is still caught.
- **FR-3 (load proof).** With four busy loops running beside the suite, the S4 adversarial
  suite passes (the measured G5 time may exceed 5 s), and it fails if the recipe is replaced
  by a quadratic mutant under the same budget.
- **FR-4 (generated artifacts).** `bin/measure-dsh --check` prunes `__pycache__`/`*.pyc` from the skill-source file list, because the installer copies tracked files from the ref and never installs generated artifacts; a local `__pycache__` left by a Measure script must not report an incomplete skill copy (observed live during this track: a closeout run recreated it and made `--check --live` red). `tests/dsh/test-check.sh` pins the case.
- **FR-5 (records).** The gate-timing tech-debt row becomes `Resolved`;
  `CHANGELOG.md` records the change; the live check passes (no plugin code change).
- **FR-5 (verification).** srg 11/11 under load and idle, CLI 13/13, node 352/352, both
  parity gates ok; the track is archived with a manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (still catches blowups).** The calibration misses a quadratic recipe by orders of
  magnitude; the G5 candidate-count assertion is unchanged.
- **NFR-2 (no flakes, no sleeps).** No fixed sleeps are added; only the budgets change.

## Acceptance Criteria (track level)

- Given the busy-loop load, Then the S4 suite passes and reports a G5 time above 5 s.
- Given a quadratic-stub recipe, Then the G5 check still fails.
- Given the idle machine, Then both suites pass as before.
