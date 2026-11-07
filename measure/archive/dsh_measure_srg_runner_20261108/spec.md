# Specification: DSH Measure spec-review-gate runner hardening

## Overview

`tests/spec_review_gate/run.sh` runs each `test_*.sh`/`test_*.py` suite in
`tests/spec_review_gate/` and prints one summary. Its documented hardening rows
say: the runner can select itself; it follows symbolic links; a `.py` file name
is passed to `unittest discover -p` as a glob pattern; and on Python ≤ 3.11 a
`.py` suite with zero tests exits 0 and counts as PASS. These are verification
gaps in the gate that guards every spec review, so they are worth closing.

This track hardens the runner: it never runs itself, skips symlinked suites with
a message, refuses a suite whose file name contains a glob metacharacter (because
the name is used as a discovery pattern), and turns a zero-test `.py` suite into
a FAIL by checking the captured output. It adds probes for each rule to the
runner's own adversarial suite.

## Functional Requirements

- **FR-1 (self-selection).** The runner skips its own file even when a pattern or
  filename matches it (`run.sh` is never executed as a suite; a pattern that
  matches only the runner prints `no suites matched` and exits 1).
- **FR-2 (symlinks).** A selected name that is a symbolic link is skipped with
  `ignored suite (symbolic link): <name>` on stderr and is not counted as a
  suite; a real suite next to it still runs and the summary counts only real
  suites.
- **FR-3 (glob metacharacters).** A selected suite file whose name contains `*`,
  `?`, or `[` is refused: the runner prints `refusing a suite name with a glob
  metacharacter: <name>` and exits 1 before running anything (the name would be
  interpreted as a discovery pattern).
- **FR-4 (zero-test `.py` suites).** The runner captures a `.py` suite's output
  and prints it; when the output contains a `Ran 0 tests` line the suite is
  recorded as FAIL (exit 1 overall), independent of the Python version's exit
  code.
- **FR-5 (the probes).** `tests/spec_review_gate/test_s1_adversarial.sh` gains
  runner probes for: a self-selection pattern alone (no suites matched, exit 1);
  a self-selection pattern beside a real suite (only the real suite runs); a
  symlinked suite skipped while a real suite runs; a glob-metacharacter name
  refused with exit 1; and a zero-test `.py` suite recorded as FAIL. The existing
  probes stay unchanged.
- **FR-6 (records).** `measure/tech-debt.md`'s srg-runner row is updated (SELF,
  SYMLINK, PYGLOB, and PYZERO resolved; the suite-level MKTEMP item remains as
  the named residual), and `CHANGELOG.md` has a bug-fix entry.

## Non-Functional Requirements

- **NFR-1 (no new dependency).** bash, coreutils, and the existing python3.
- **NFR-2 (contract preserved).** The preserved parts are: the 0/1 exit
  convention, the `--- suite:` markers and the one summary line, the rejection of
  patterns containing `/` or `..`, and the sorted suite order. FR-4 may change
  the exit code for a tree whose only suite is a zero-test `.py` file, and FR-3
  adds an exit-1 refusal for a glob-metacharacter name; both are intended.
- **NFR-3 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the runner, Then a self-selection pattern runs nothing; a symlink is
  skipped; a glob-metacharacter file name exits 1 with its message; a zero-test
  `.py` suite is FAIL.
- Given `bash tests/spec_review_gate/run.sh`, Then all ten suites pass on the
  real tree.
- Given the node suite and both parity gates, Then node is 301/301 and both
  parity gates are ok.
- Given the records, Then the tech-debt row names the resolved items and the
  MKTEMP residual, and the CHANGELOG has the entry; each phase checkpoint is
  pushed.

## Out of Scope

- The suite-level MKTEMP item (adding a failed-`mktemp` case inside every S1
  suite); it stays in tech-debt as the named residual.
- The remaining opencode/spec-review rows.
