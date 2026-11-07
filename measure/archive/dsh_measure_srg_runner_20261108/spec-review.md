# Spec Review: dsh_measure_srg_runner_20261108

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-08
Reviewer: subagent (fresh context, default model)

### What this track proposes

Hardening `tests/spec_review_gate/run.sh` so it never runs itself, skips a
selected symbolic link with a message, refuses a suite name containing a glob
metacharacter with `refusing a suite name with a glob metacharacter: <name>` and
exit 1, and captures a `.py` suite's output so a `Ran 0 tests` line records a
FAIL; five probes in the runner's adversarial suite; tech-debt row update
(SELF/SYMLINK/PYGLOB/PYZERO resolved, MKTEMP residual) and a CHANGELOG entry.

### How the current system works, per this spec

The committed runner runs each selected `test_*.sh`/`test_*.py` suite, prints a
per-suite marker and one summary, and exits 1 on a failure or no match. It could
select itself (`*.sh` runs `run.sh` as a suite), followed symlinks, passed each
`.py` name to `unittest discover -p` as an fnmatch pattern, and counted a
zero-test `.py` suite as PASS on Python ≤ 3.11 (3.14 exits 5, 3.11 exits 0).
The 2026-10-30 srg-runner tech-debt row lists the four items.

### Findings

- F1 [Major] spec FR-5 / plan Task 1.2: the named zero-test probe already passed against the committed runner on this host (Python 3.14 exits 5 when no tests run), so it did not exercise FR-4; it needed an exit-0 fixture (a stub `python3` on PATH) so the rule is proven on the pre-change runner.
- F2 [Major] spec FR-5 / plan Task 1.2: "refused with exit 1" is also what the committed runner did for a `[...]` name (zero tests → exit 1 on 3.12+), and a literal name expands to nothing under `nullglob`; the probe needed wildcard selection and the stderr message assertion.
- F3 [Major] spec FR-1/FR-5: the self-selection "alone" pair (no suites + exit 1) is exactly the nested `run.sh` behavior, so the probe needed the outer 0-suite summary (or absence of a `--- suite: run.sh ---` line).
- F4 [Nit] spec NFR-2: "exit codes … stay as they are" could not be literally true because FR-4 changes the exit code for a zero-test tree and FR-3 adds a refusal; the preserved parts needed naming (0/1 convention, summary format, `/`/`..` rejection, sorted order).

### Author Response

- F1: FIX (the probe uses a stub `python3` on PATH that prints `Ran 0 tests` and exits 0; the runner records the suite as FAIL and the probe asserts the failure and the `zero tests ran in test_zero.py` report)
- F2: FIX (the probe selects the `[1]`-named file through the default wildcard pattern and asserts the `refusing a suite name with a glob metacharacter` message and that no suite ran)
- F3: FIX (the self-selection probe asserts the outer summary is 0 suites (PASS=0, FAIL=0) in addition to `no suites matched`; the beside-a-suite probe asserts exactly one real suite ran)
- F4: FIX (NFR-2 now names the preserved parts: the 0/1 exit convention, the summary format, the `/`/`..` pattern rejection, and the sorted suite order)

The probes are in `tests/spec_review_gate/test_s1_adversarial.sh` (119 checks,
PASS=119).
