# Implementation Plan: DSH Measure Suite mktemp-failure guard

Track: `dsh_measure_suite_mktemp_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The guard and its proof [checkpoint: 15af2bf]

- [x] Task 1.1: give `test_s1_standard.sh` and `test_s1_new_track.sh` the failed-`mktemp` guard, and unify the message in the suites that already guard it (`test_s2_role_docs.sh`, `test_s3_dispositions_docs.sh`, `test_s4_doc_drift.sh`) to `FAIL: mktemp -d failed; no fixture can be built` with a one-FAIL summary and exit 1 `4068f00`
- [x] Task 1.2: add `tests/spec_review_gate/test_mktemp_failure.sh`: a `mktemp` stub that exits 1, run every other `test_*.sh` with the stub first on `PATH`, assert exit 1 and the guard message for each, and assert the stub run leaves the repository unchanged `4068f00`
- [x] Task 1.3: run `bash tests/spec_review_gate/run.sh` (11/11) and record each suite's stubbed result `4068f00`
- [x] Task: Measure - User Manual Verification 'Phase 1: The guard and its proof' (Protocol in workflow.md) `15af2bf`

## Phase 2: Records and gates [checkpoint: 610aca2]

- [x] Task 2.1: resolve the MKTEMP item in `measure/tech-debt.md` (naming the new proof suite) and add the `CHANGELOG.md` bug-fix entry `4068f00`
- [x] Task 2.2: run the node suite (301/301), both parity scripts, and `bash tests/dsh/run.sh` (12/12) `4068f00`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md) `610aca2`

## Phase 3: Closeout

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_suite_mktemp_20261109` and record the manifest-only FAIL `b1f69f2`
- [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
