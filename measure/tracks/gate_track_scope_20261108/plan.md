# Implementation Plan: Gate track scope

Track: `gate_track_scope_20261108`. Spec: [spec.md](./spec.md).

## Rules for every phase

- Work on `main` in `/home/daniebo/Desktop/measure`. Never stage `extensions/`.
- Attach a git note to each task commit.
- Run one test file directly. Run the full `tests/spec_review_gate/run.sh` through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_PRIORITY=p2` (PM rule, 2026-11-08: leftover slot only).
- Get each subagent slot through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/slot wait` in the background.
- Pick each subagent model with `/home/daniebo/Desktop/advantage-pr/scripts/jobs/ra-quota pick <role> --not-family claude --why`.
- Keep each G20 mutant line of `tests/spec_review_gate/test_s2_adversarial.sh` one time in the checker.
- Push nothing without the PM's word.

## Phase 1: Spec review [checkpoint: 33488f0]

- [x] Task 1.1: Run `measure-spec-review` with a fresh agent of a family other than Claude. Write the result to `measure/runs/gate_track_scope_20261108/`. Record the findings and the responses in `spec-review.md`. `1a510ee`
  - Round 1 on `9d67250`: fail, 2 Blocker, 2 Major, 3 Nit (`4fd7751`). Revision: `ab95c03`.
  - Round 2 on `ab95c03`: pass, 0 Blocker, 0 Major, 1 Nit (`1a510ee`). The spec-review gate passed. F8: FIX in the Phase 1 checkpoint commit.

## Phase 2: Red tests [checkpoint: f182beb]

- [x] Task 2.1: Write `tests/spec_review_gate/test_gate_track_scope.py` with the cases of AC-1 to AC-18. Run the file against the unchanged checker. Record each failing case name as the Red evidence. `3ac3771`
  - Evidence: the unchanged checker gives `Ran 18 tests`, `FAILED (failures=13)`. Log: `measure/runs/gate_track_scope_20261108/red-p2-unchanged-checker.log`.
  - Failing: `test_spec_review_mixed_range_passes`, `test_spec_review_own_commit_outside_runs_fails`, `test_spec_review_only_other_tracks_passes`, `test_spec_review_untagged_commit_counts_as_own`, `test_spec_review_unlistable_own_commit_fails`, `test_jr_green_range_without_own_commit_fails`, `test_jr_green_mixed_range_passes`, `test_jr_green_untagged_commit_counts_as_own`, `test_ux_review_other_track_ui_commit_passes`, `test_ux_review_unlistable_own_commit_fails`, `test_ux_paths_track_option_scopes_stdout`, `test_ux_paths_require_with_only_other_tracks_fails`, `test_ux_paths_unlistable_own_commit_fails`.
  - Passing (guards of the old behavior): `test_spec_review_missing_baseline_tree_fails_in_scoped_mode`, `test_spec_review_single_track_range_keeps_output`, `test_ux_review_own_ui_commit_needs_dev_url`, `test_ux_review_working_tree_change_counts`, `test_ux_paths_without_track_keeps_full_range`.
  - The run is direct, not through `heavy-run.sh`: one unittest file is a light run (PM, 2026-11-08).

## Phase 3: Green change [checkpoint: 34648f4]

- [x] Task 3.1: Change `measure_interphase_checks.py` (FR-1 to FR-6). Run the new test file, `test_red_track_scope.py`, and `test_checker.py` (AC-19). `94db90d`
  - Evidence: `test_gate_track_scope.py` gives `Ran 18 tests`, `OK`. `test_red_track_scope.py` gives `Ran 13 tests`, `OK`. `test_checker.py` gives `Ran 38 tests`, `OK`. Logs: `measure/runs/gate_track_scope_20261108/green-p3-test_*.log`.
  - Evidence: 9 mutants of the new lines, each killed by 1 or more cases of the new file (`green-p3-mutants.log`). Each G20 mutant line of `test_s2_adversarial.sh` occurs one time in the checker.
- [x] Task 3.2: Run the Monorepo replay of AC-21 on a read-only clone. Record the old and the new output. `24e678d`
  - Evidence: on a read-only clone at `bd5dc101d` with `--baseline 39d019003`, the old checker exits 1 and lists the five `apps/storytime/` files and the plan of `storytime_at_home_release_20261106`. The new checker exits 0 and skips 2 commits. Log: `green-p3-monorepo-replay.log`.
- [x] Task 3.3: Update `references/contracts.md`, `CHANGELOG.md`, and `measure/tech-debt.md` (FR-7). `a79c8ce`
  - Evidence: `test_s2_role_docs.sh` 51/51, `test_s3_dispositions_docs.sh` 98/98, `test_s4_doc_drift.sh` 34/34.
- [x] Task 3.4: Run `bash tests/spec_review_gate/run.sh` through `heavy-run.sh` (AC-20). `b88ef8a`
  - Evidence: on `b88ef8a` (after the Review A fixes), through `heavy-run.sh` with `HEAVY_PRIORITY=p2`: `13 suites (PASS=13, FAIL=0)`, `run.sh exit 0`. Log: `measure/runs/gate_track_scope_20261108/green-p3-full-suite.log`.
  - A first job on `5734bd2` was stopped in the queue before it started, so that one run covers the Review A fixes.

## Phase 4: Review and distribution

- [x] Task 4.1: Run `measure-review-a-correctness` with a fresh agent of a family other than Claude. Fix each Blocker. Fix each other finding, or record the reason in the plan. `54b4280`
  - Review A on `5734bd2` with `deepseek/deepseek-flash#high`: status pass, 0 Blocker, 0 Major, 3 Nit. Result: `measure/runs/gate_track_scope_20261108/review-a-5734bd2.json` (`4a50bd4`). The reviewer reached its step limit before the file write, so the orchestrator wrote the JSON of its final answer with no change. `audit-result` passes.
  - F1 [Nit] (no case stages a change): FIX in `54b4280`. New case `test_ux_review_staged_change_counts`. It kills the mutant that drops the staged union (`review-a-f1-mutant.log`).
  - F2 [Nit] (contracts omit the Jr Green fallback when `git log` fails): FIX in `54b4280`.
  - F3 [Nit] (the changelog INFO sentence is not exact on a tree-diff failure): FIX in `54b4280`.
  - The review ran before Task 3.4, so one full-suite run covers the fixes.
- [x] Task 4.2: Run `bin/install-measure-skill`, then `bin/install-measure-skill --check`. Compare the installed checker with `main` (AC-22). `34648f4`
  - Evidence: the install from `main` (`34648f4`) exits 0 (`written=2`: the checker and `contracts.md`). `--check` prints "No differences: every target matches main (34648f4)." and exits 0. `cmp` shows that the installed checker and `contracts.md` equal `main`.
  - Evidence: the installed copy on the Monorepo replay (`bd5dc101d`, `--baseline 39d019003`) exits 0 and skips 2 commits of other tracks. Log: `measure/runs/gate_track_scope_20261108/green-p4-install.log`.
- [x] Task 4.3: Send the PM one line: the commit, the test name, and the install result. `34648f4`
  - Line: fix `94db90d` (and `54b4280`), test `tests/spec_review_gate/test_gate_track_scope.py` (19 cases; the request case is `test_spec_review_mixed_range_passes`), installed from `main` `34648f4` (`--check` exit 0), not pushed.
