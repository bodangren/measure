# Implementation Plan: DSH Measure mid-red gate: rename-aware committed files

Track: `dsh_measure_midred_rename_20261107`
Spec: [./spec.md](./spec.md)

A bug-fix track in the shipped orchestrator checker: the contract change, the
regression test, then the records and closeout. The gates are
`bash tests/spec_review_gate/run.sh` (10/10),
`node --test plugins/dsh-measure-guard/tests/*.test.js` (stays 288), both parity
scripts, and `bash tests/dsh/run.sh`.

## Phase 1: Rename-aware committed files [checkpoint: 2de82ef]

- [x] Task 1.1: `skills/measure-orchestrator/scripts/measure_interphase_checks.py`: `committed_files()` unions the `--name-only` paths with both paths of every rename from `git diff --name-status --diff-filter=R <baseline>..HEAD` (tabs, sorted, deduplicated, empty on git failure); its docstring states the rule
- [x] Task 1.2: Red: `tests/spec_review_gate/test_checker.py` gains the mid-red rename case (prod file renamed into `tests/`, `diff.renames=true`, `RED_TEST_COMMAND=false`); run it against the unmodified function and record that `- src/a.py` is absent (the failing Red)
- [x] Task 1.3: Green: the case passes with the fix; the other checker tests stay green
- [x] Task 1.4: run `bash tests/spec_review_gate/run.sh`; all 10 suites pass (10/10 PASS on the final tree)
- [x] Task: Measure - User Manual Verification 'Phase 1: Rename-aware committed files' (Protocol in workflow.md) `2de82ef`

## Phase 2: Records and closeout [checkpoint: 08c3792]

- [x] Task 2.1: update `measure/tech-debt.md` (the rename row: the mid-red part resolves; the spec-review runner items remain) and any checker reference text that names the committed-file rule
- [x] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md` `09fd7fe`; `spec-review.md` records the review with the author responses
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md) `08c3792`

> **Follow-up correction (2026-11-07, dsh_measure_midred_followup_20261107):**
> the delivered implementation used two git calls; the follow-up replaced it with
> the single `--no-renames -z` call. The executed Red order was: the test was
> written first, then a missing `tests/` fixture directory was fixed, the fix was
> applied, and a temporary copy/revert of `committed_files` proved the genuine
> bypass (old code exits 0 with no feedback) and the fixed behaviour (exit 1 with
> `- src/a.py`).
