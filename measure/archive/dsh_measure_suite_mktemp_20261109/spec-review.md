# Spec Review: dsh_measure_suite_mktemp_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-09
Reviewer: subagent (fresh context, default model)

### What this track proposes

Every `tests/spec_review_gate/test_*.sh` suite gets the same failed-`mktemp`
guard — `FAIL: mktemp -d failed; no fixture can be built`, a one-FAIL summary,
and exit 1 — replacing the two unguarded S1 suites and the older
"did not return a folder" message in three docs suites; a new
`test_mktemp_failure.sh` stubs `mktemp` and proves the guard for every suite; the
MKTEMP tech-debt row is resolved; gate 11/11, CLI 12/12, node 301/301, parity.

### How the current system works, per this spec

`run.sh` selects the suites (nine shell suites plus `test_checker.py`). The four
adversarial shell suites already guard; the three docs suites guard with a
different message and no summary; the two S1 suites do not check at all. The
Python suite uses `tempfile.mkdtemp`, not the `mktemp` binary. With a working
`mktemp` the pre-track gate is 10/10.

### Findings

- F1 [Major] Acceptance Criteria: "every suite exits 1" is broader than the shell-suite scope — `test_checker.py` uses `tempfile.mkdtemp`, so a failing `mktemp` binary does not affect it; the proof skips it deliberately.
- F2 [Major] FR-1/FR-2: the guard has two halves (empty and not-a-directory) but the only stub exits 1, so the `[ ! -d ]` half was untested.
- F3 [Major] FR-2/NFR-1: "finish quickly"/"ends immediately" had no timeout.
- F4 [Major] FR-2/NFR-1: "create no file in the repository" was checked with a git status that omits ignored paths (`measure/runs/`, logs, `__pycache__/`).
- F5 [Nit] FR-1/plan Task 1.1: FR-1 required the `TMP="$(mktemp -d)" || TMP=""` idiom while the three docs suites keep `TMP="$(mktemp -d)"`.
- F6 [Nit] NFR-2: "behave exactly as before" was not literal (new proof suite; two S1 suites gain a guard).
- F7 [Nit] Acceptance Criteria: "gate 11/11 and CLI 12/12" omitted node 301/301 and both parity gates.
- F8 [Nit] FR-3: the older "did not return a folder" text still exists in `test_checker.py` (a different `tempfile.mkdtemp` message).

### Author Response

- F1: FIX (the record now says "every shell suite"; the Python suite is out of scope and uses `tempfile.mkdtemp`)
- F2: FIX (the proof adds a second stub that exits 0 and prints a regular file; all nine suites must still exit 1 with the guard message — 19 checks)
- F3: FIX (each stubbed run is wrapped in `timeout 60`, and the proof records a FAIL if `timeout` is unavailable)
- F4: FIX (the snapshot adds `--ignored`, and the check is named "including ignored paths")
- F5: FIX (the guard is specified by behavior — empty or not a directory — not by the shell idiom; the docs suites keep their equivalent form)
- F6: FIX (the preserved contract is named: the nine existing suites' checks, summaries, and flags, and the 11/11 gate)
- F7: FIX (the acceptance mirrors FR-5: gate 11/11, CLI 12/12, node 301/301, both parity gates)
- F8: FIX (the record says "the older guard message" and does not claim the Python suite's `tempfile.mkdtemp` message is gone)
