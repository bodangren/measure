# Specification: Fixture paths

## Overview

The mid-red role gate lists non-test files. In the Lending project, synthetic
fixtures under `harness/model-guide-tests/fixtures/...` were listed as
non-test files, so each Red gate there needed a recorded deviation. This track
adds one rule: a path is test-owned when a `fixtures` folder sits at any depth
under a folder whose name ends in `-tests`.

Source: PM order, 2026-11-15, light lane. One PR; the PM merges and installs.

## The order (PM, 2026-11-15)

Also treat a path as test-owned when it has a `fixtures/` folder under a
folder whose name ends in `-tests`. Keep every other rule. Red first.

## Decided change (recorded here; do not choose another design)

- Add one helper directly above `non_test_paths()` in
  `skills/measure-orchestrator/scripts/measure_interphase_checks.py`:

  ```python
  def is_tests_fixture(path: str) -> bool:
      """True when a `fixtures` folder sits at any depth under a folder whose name ends in `-tests`."""
      folders = path.split("/")[:-1]
      return any(name.endswith("-tests") and "fixtures" in folders[index + 1 :] for index, name in enumerate(folders))
  ```

- In `non_test_paths()`, directly after the `/__tests__/` and `/tests/` check,
  add:

  ```python
        if is_tests_fixture(path):
            continue
  ```

- No other change to the checker. The match is case-sensitive and works on
  whole folder names only. Only folders count: the last path part (the file
  name) never matches.

### Examples (the test pins each one)

- Test-owned (not listed):
  - `harness/model-guide-tests/fixtures/x.json`
  - `harness/model-guide-tests/fixtures/deep/y.json`
  - `model-guide-tests/fixtures/x.json` (the `-tests` folder at the root)
  - `harness/model-guide-tests/cases/fixtures/x.json` (fixtures deeper under
    the `-tests` folder)
- Still non-test (listed):
  - `harness/fixtures/x.json`
  - `fixtures/x.json`
  - `harness/model-guide-tests/x.json`
  - `harness/model-guide-tests-old/fixtures/x.json`
  - `harness/model-guidetests/fixtures/x.json`
  - `fixtures/model-guide-tests/x.json`
  - `harness/model-guide-tests/fixtures` (a file named `fixtures`)
  - `harness/model-guide-tests/fixtures.json`
  - `harness/Model-Guide-TESTS/fixtures/x.json`
  - `harness/model-guide-tests/fixturesx/x.json`
- Old rules, unchanged: `tests/x.py`, `src/tests/x.py`, `src/__tests__/x.ts`,
  `src/a.test.ts`, and `measure/plan.md` are test-owned; `src/a.py` and
  `src/test/x.py` stay non-test.

## Test

One new self-contained suite `tests/spec_review_gate/test_fixture_paths.py`.
Python standard library only. The module docstring names the track id. The
suite loads the checker with `importlib`, the same way as `checker_module()`
in `tests/spec_review_gate/test_red_track_scope.py` (register the module in
`sys.modules` before `exec`). The suite does not import other test modules.
`run.sh` finds `test_*.py` by itself; do not edit `run.sh`.

- Class 1 (unit): call `non_test_paths()` with every example path above and
  assert the exact sorted list of listed paths. Each group (test-owned, still
  non-test, old rules) gets its own test method, so a Red failure names the
  group.
- Class 2 (end to end): build a temporary git repository with one track,
  copying the `setUp`, `write`, `git`, `commit`, and `role_gate` pattern of
  `test_red_track_scope.py`, with an explicit clean environment
  (`RED_TEST_COMMAND=false`, `GIT_CONFIG_GLOBAL=/dev/null`,
  `GIT_CONFIG_NOSYSTEM=1`).
  - Case A: one Red commit adds `tests/test_look.py` and
    `harness/model-guide-tests/fixtures/case.json`, and the plan task is
    `[~]`: `role-gate --role mid-red` exits 0, prints
    "PASS: mid-red gate passed", and does not print "Mid Red changed
    non-test/non-Measure files".
  - Case B: the same with `harness/fixtures/case.json`: exit 1, the non-test
    message, and the line "FAIL: - harness/fixtures/case.json".
- Red: before the change, the test-owned unit group and Case A fail; the
  other cases pass. Keep the Red output in
  `measure/runs/fixture_paths_20261115/red-fixture.log`. Green: all pass,
  kept in `measure/runs/fixture_paths_20261115/green-fixture.log`. The runs
  folder is gitignored.

## Functional Requirements

- **FR-1 (the checker change and the suite).** Add the helper and the two
  lines of the Decided change and add the new suite (Red first). Commit on
  `chore/fixture-paths` with the message
  `fix(checker): Count -tests fixtures as test files in the mid-red check`.
  Keep `red-fixture.log`, `green-fixture.log`, `run-suites.log`, and
  `test-registry-task1.1.log` in
  `measure/runs/fixture_paths_20261115/`.
- **FR-2 (the records).** `CHANGELOG.md` gets one entry as the first of the
  list under the existing `### Bug Fixes` heading of `## Unreleased`,
  directly above the "G21 time margin" entry. The entry has this exact text
  (one physical line, followed by one empty line, the same as the entries
  there):

  ```
  * **fixture paths:** the mid-red check of `skills/measure-orchestrator/scripts/measure_interphase_checks.py` now counts more files as test files. A file is a test file when a `fixtures` folder sits at any depth under a folder whose name ends in `-tests`, for example `harness/model-guide-tests/fixtures/x.json`. The new helper `is_tests_fixture()` compares whole folder names, is case-sensitive, and never compares the file name. Every other rule of `non_test_paths()` stays. Cause: the Lending project keeps synthetic fixtures under `harness/model-guide-tests/fixtures/`, so the gate listed them as non-test files, and each Red gate there needed a recorded deviation. Track `fixture_paths_20261115`.
  ```

  `README.md` line 33: replace its first sentence, up to and including its closing
  bracket and full stop, with "As of 2026-11-15, the latest archived track is
  Fixture paths (the mid-red gate counts a file under a fixtures folder
  inside a folder whose name ends in -tests as a test file)." The rest of
  line 33 stays unchanged. Both record changes ride in the Task 1.2 archive
  commit.
- **FR-3 (the closeout).** Archive the track to
  `measure/archive/fixture_paths_20261115/`, move the registry entry to
  Archived Tracks with `[x]`, and record the results.

## Acceptance Criteria

- Before the checker change, `python3 -m unittest discover -s tests/spec_review_gate -p test_fixture_paths.py` fails only in the test-owned unit group and in Case A (Red). After the change, the same command passes (Green).
- Through the heavy-job wrapper with no shell redirection (`>`, `>>`, `tee`):
  `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/spec_review_gate/run.sh`
  (evidence `run-suites.log`) and
  `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/test-registry.sh`
  (Task 1.1 evidence `test-registry-task1.1.log`; Task 1.2 evidence
  `test-registry.log`) exit 0.
- The closeout check fails only on the missing closeout manifest
  (`closeout-check.log`).

## Out of Scope

- The installed copy of the checker.
- The `UX_EXCLUDE_PARTS` list at line 454 of the checker.
- The measure-guard TDD path rules.
- Any other test-path rule.
