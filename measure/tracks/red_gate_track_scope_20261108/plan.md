# Implementation Plan: Red gate track scope

Track: `red_gate_track_scope_20261108`. Spec: [spec.md](./spec.md).

## Rules for every phase

- Work on `main` in `/home/daniebo/Desktop/measure`. Never stage `extensions/`.
- Attach a git note to each task commit.
- Run one test file directly. Run the full `tests/spec_review_gate/run.sh` through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` (PM rule, 2026-11-08).
- Get each subagent slot through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/slot wait` in the background. Storytime roles go first.
- Push nothing without the PM's word.

## Phase 1: Spec review

- [x] Task 1.1: Run `measure-spec-review` with a fresh agent of a family other than Claude. Write the result to `measure/runs/red_gate_track_scope_20261108/`. Record the findings and the responses in `spec-review.md`. `d52a3c2`

## Phase 2: Red tests [checkpoint: 232bc29]

- [x] Task 2.1: Write `tests/spec_review_gate/test_red_track_scope.py` with the cases of AC-1 to AC-8. Run the file against the unchanged checker. Record each failing case name as the Red evidence. `232bc29`
  - Evidence: the unchanged checker gives `Ran 11 tests`, `FAILED (failures=18)`. Only `test_single_track_range_prints_no_info` passes. Log: `measure/runs/red_gate_track_scope_20261108/red-p2-unchanged-checker.log`.
  - The run is direct, not through `heavy-run.sh`: the PM said on 2026-11-08 that one unittest file is a light run.

## Phase 3: Green change [checkpoint: 1901799]

- [x] Task 3.1: Change the `mid-red` branch of `measure_interphase_checks.py` (FR-1 to FR-5). Run the new test file and `tests/spec_review_gate/test_checker.py`. `7691a39`
  - Evidence: `test_red_track_scope.py` gives `Ran 11 tests`, `OK`. `test_checker.py` gives `Ran 38 tests`, `OK`.
  - Evidence: on the Monorepo look Phase 2 Red range (`08e60c795..126189088`, read-only clone), the old checker exits 1 with 10 files of other tracks. The new checker exits 0 and skips 12 commits. Log: `measure/runs/red_gate_track_scope_20261108/green-p3-monorepo-look-range.log`.
- [x] Task 3.2: Update `references/contracts.md`, `CHANGELOG.md`, and `measure/tech-debt.md` (FR-6). `78878d4`
- [x] Task 3.3: Run `bash tests/spec_review_gate/run.sh` (AC-9). `1901799`
  - Run 1 (on `b09dd9c`): 12 suites, PASS=11, FAIL=1. `test_s2_adversarial.sh` G20 failed: `if listed.returncode != 0:` occurred two times, so the mutant did not apply once. Fix: `0306a7b`. Log: `measure/runs/red_gate_track_scope_20261108/green-p3-full-suite.log`.
  - Run 2 (on `1901799`, through `heavy-run.sh`): `12 suites (PASS=12, FAIL=0)`, `run.sh exit 0`. Log: `green-p3-full-suite-r2.log`.

## Phase 4: Review and distribution

- [x] Task 4.1: Run `measure-review-a-correctness` with a fresh agent of a family other than Claude. Fix each Blocker. Fix each other finding, or record the reason in the plan. `0306a7b`
  - Review A on `b09dd9c` with `deepseek/deepseek-flash#high`: status pass, 0 Blocker, 1 Major, 3 Nit. Result: `measure/runs/red_gate_track_scope_20261108/review-a-b09dd9c.json` (`6ac18db`).
  - F1 [Major] (no test for the each-id rule or the archive folder): FIX in `041ba4f`. Two new cases. Each case fails for its mutant (`review-a-f1-mutants.log`).
  - F2 [Nit] (`is_track_folder` reads the working tree, so a commit can add its own track folder): DECLINE. A check at the baseline makes a track that starts during the phase count as own, and the gate then fails on its commits again. The INFO line names the id, and the new folder shows in the range. Same limit as spec F1.
  - F3 [Nit] (contracts omit the D5 failure rules): FIX in `0306a7b`.
  - F4 [Nit] (AC-9 has no result yet): Task 3.3 run 2 closes it.
- [~] Task 4.2: Run `bin/install-measure-skill`, then `bin/install-measure-skill --check`. Compare the installed checker with `main` (AC-10).
- [ ] Task 4.3: Send the PM one line: the commit and the test name.
