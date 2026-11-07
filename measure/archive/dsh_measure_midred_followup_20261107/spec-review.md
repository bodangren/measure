# Spec Review: dsh_measure_midred_followup_20261107

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-07
Reviewer: subagent (fresh context, default model)

### What this track proposes

Replacing `committed_files()` with one `git diff --name-only --no-renames -z <baseline>..HEAD` call (NUL-split, sorted, deduplicated, non-empty, empty on git failure) and a docstring that states the rule, removing the second `--name-status` call and its tab parser. It adds a mid-red control case for a test-only Red commit and requires the rename case to keep the new `tests/a.py` path out of the non-test report. It also corrects the archived mid-red record, the resolved tech-debt row, the checker docstring, the docs, and the CHANGELOG, with no behaviour change to the gate.

### How the current system works, per this spec

`non_test_committed_files()` walks `committed_files()` and drops `measure/` paths, test suffixes, and `tests/` paths. The single `--no-renames -z` call lists a rename's old path as a deletion and its new path as an addition (verified in a scratch repo under `diff.renames=true`; `test_edge_rename_into_runs_folder_lists_old_path` proves it for the spec-review scope). A test-only Red commit passes the mid-red gate cleanly with no `--log-file`.

### Findings

- F1 [Major] spec.md FR-2: the stated control-case result was wrong — with no `--log-file`, `has_agent_result("")` is True, so a test-only commit yields exit 0 and `PASS: mid-red gate passed`; the delivered test asserts exit 0, while FR-2 said exit 1 with the missing-block feedback.
- F2 [Blocker] plan.md Phase 1: the phase named only `measure_interphase_checks.py` and `test_checker.py`, but the single call makes the `"--name-only", "--no-renames", "-z"` anchor occur twice and `tests/spec_review_gate/test_s2_adversarial.sh`'s G20 mutants require `count == 1`, so the suite is 9/10 until that file is re-anchored — a change the plan did not name and that landed after checkpoint 8cfd295 (in 31835e6).
- F3 [Major] plan.md Task 2.1 / spec.md FR-3: "annotate the archived mid-red track's spec/plan" did not say whether to rewrite or append, or which item belongs in which file; the archived spec still stated the two-call union and the `git mv` recipe without `mkdir tests`, while only the plan carried the note.

### Closeout observations (same read-only pass)

- O1: the archived follow-up plan had Task 2.2 and the Phase 2 verification task `[ ]` and no completed task carried a commit SHA, so `closeout --track dsh_measure_midred_followup_20261107` failed.
- O2: the delivered rename case did not assert that `tests/a.py` is absent, which Task 1.2/FR-2 named.
- O3: the follow-up archive had no `spec-review.md`.
- O4: the archived mid-red spec was never corrected (only its plan and metadata), and the `mkdir tests` step appeared in neither.

### Author Response

- F1: FIX (FR-2 now states the real observable — exit 0 and `PASS: mid-red gate passed` with no non-test message — and the missing-block note as the supplied-non-file-log-path case)
- F2: FIX (Task 1.1 names `tests/spec_review_gate/test_s2_adversarial.sh` and the G20 re-anchoring, with the 9/10→10/10 and 31835e6-after-8cfd295 facts recorded)
- F3: FIX (Task 2.1 names both archived files and the dated-correction form; the archived mid-red spec now carries the correction note; the metadata note is named)
- O1: FIX (the archived follow-up plan's tasks carry their SHAs and the closeout check now reports only the missing `automation-supervisor` manifest, which is an automation-supervisor artifact this manual track never produced — documented, not a missing task)
- O2: FIX (the rename case asserts `tests/a.py` is absent; checker tests 30/30)
- O3: FIX (this file, linked from the track's `index.md`)
- O4: FIX (the archived mid-red spec carries the dated correction note; the `mkdir tests` step is stated in both archived files)
