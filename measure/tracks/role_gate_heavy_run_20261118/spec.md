# Specification: Role-gate heavy-run wrapper with excludes

## Overview

The `role-gate` command in `skills/measure-orchestrator/scripts/measure_interphase_checks.py` runs each gate command by itself. On Workbooks a full gate run takes about 25 minutes outside the machine load guard, and the gate has no way to skip a file.

Source: PM tool request 2026-11-18, item 6.

## Decided change

The gate runs each gate command through a heavy-run wrapper when one is set. The wrapper resolves in this order: `--runner <path>`, the `MEASURE_HEAVY_RUN` env var, then `heavy-run.sh` on PATH. No wrapper prints one note line and runs the command directly as today. The wrapper takes the gate shell string with `-c` and returns the command exit code, so the gate keeps its pass logic.

`--exclude <file>` is repeatable. Each excluded file leaves the gate test run. The exclusion applies where the command lists test files (literal path tokens) or selects them (glob tokens, expanded against the repo). A command that names no matching test file fails closed with a clear message instead of running the file. Each excluded file prints one `INFO: excluded <file>` line.

## Tests

New file `tests/spec_review_gate/test_role_gate_heavy_run.py` in the style of `test_subbox_sha.py`. It covers: wrapper from the flag, wrapper from the env var, no wrapper found (direct run plus note), exit-code pass-through (0 and non-zero), one and two `--exclude` files, and an exclusion the command cannot take (fails closed). Confirm the tests fail before the change, then pass.

Run the new file, then the `spec_review_gate` suite once through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh`. Run `bin/install-measure-skill --ref chore/role-gate-heavy-run --check` only to report it.
