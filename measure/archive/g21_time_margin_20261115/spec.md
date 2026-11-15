# Specification: G21 time margin

## Overview

The adversarial suite `tests/spec_review_gate/test_s3_adversarial.sh` has a
G21 sensitivity mutant named "the old quadratic any(...) loop" (line 472).
The mutant replaces the linear start-line check with a quadratic
`any(start < index for start in starts)` loop. The G18 probes (group
`g18_time`) must kill the mutant.

On the new tower computer (12 threads), the mutant survives. The suite prints
one failing check:

```text
FAIL: G21 sensitivity: mutant 'the old quadratic any(...) loop' fails at least one probe -- 4 checks, 0 fail
```

The orchestrator saw this FAIL on main `248fff5` (orchestrator run,
2026-11-15). The build session of track `heavy_run_prompt_20261115` saw the
same FAIL at `3c231a0`. So `bash tests/spec_review_gate/run.sh` exits 1 on
this machine.

Cause: the first G18 probe ("20000 end lines, then 20000 start lines and one
complete block", line 367) gives the quadratic loop about 4e8 steps. Each
mutant run has a 15 s subprocess timeout (line 483), and `TIME_LIMIT` is 30 s
(line 63). The faster tower finishes the quadratic run inside both limits, so
no probe fails and the mutant is not killed.

Decided fix (2026-11-15): widen the first G18 probe to 100000 lines per
count, through a named constant, so the quadratic work grows to about 1e10
steps. This track changes only the test file.

Source: orchestrator finding, 2026-11-15. The PM let the track run in a
leftover slot.

## Functional Requirements

- **FR-1 (the constant).** In `tests/spec_review_gate/test_s3_adversarial.sh`,
  add a named constant near `TIME_LIMIT` (line 63): `G18_LINES = 100000`. The
  comment above it says: the first G18 probe uses G18_LINES end lines and
  G18_LINES start lines, so the quadratic mutant needs about G18_LINES
  squared (1e10) steps, which no machine ends in the 15 s mutant timeout,
  while the linear checker reads the 200000 lines in far less than
  `TIME_LIMIT`.

- **FR-2 (the first G18 probe).** The first G18 probe (line 367) uses
  `G18_LINES` for both counts. Its label says the number from the constant,
  for example `f"{G18_LINES} end lines, then {G18_LINES} start lines and one
  complete block"`.

- **FR-3 (no other change).** `TIME_LIMIT` stays 30 s. The 15 s mutant
  timeout stays. The other three G18 probes stay. Every other check of the
  suite stays.

- **FR-4 (the records).** `CHANGELOG.md` gets one entry at the top of
  "## Unreleased" / "### Bug Fixes". `README.md` line 33 names this track as
  the latest archived track (2026-11-15).

## Acceptance Criteria

- Red: `bash tests/spec_review_gate/test_s3_adversarial.sh` runs before FR-1
  and FR-2 land, fails with the G21 quadratic FAIL line, and the output is
  kept in `measure/runs/g21_time_margin_20261115/`.
- Green: the same run exits 0, the G21 quadratic mutant line is PASS with a
  "killed by:" line, and the first G18 probe of the real checker passes. The
  output is kept in `measure/runs/g21_time_margin_20261115/`.
- `bash tests/spec_review_gate/test_s3_adversarial.sh` exits 0 (run it
  directly; one suite file).
- Through the heavy-job wrapper, with no shell redirection (Storytime has
  first claim on the heavy lock, so a wait is normal):
  `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/spec_review_gate/run.sh`
  exits 0.
- Through the heavy-job wrapper, with no shell redirection:
  `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/test-registry.sh`
  exits 0.
- The closeout check
  (`python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py closeout --repo . --track g21_time_margin_20261115`)
  fails only on the missing closeout manifest.
- `CHANGELOG.md` gets one entry at the top of "## Unreleased" / "### Bug
  Fixes".
- `README.md` line 33 names this track as the latest archived track
  (2026-11-15).

## Out of scope

- The checker itself. Only the test file changes.
- The other suites. Only `tests/spec_review_gate/test_s3_adversarial.sh`
  changes.
- The S4 G5 calibration.
- A merge into `main`. Only Daniel merges the pull request. The pull request
  stacks on PR #16.
