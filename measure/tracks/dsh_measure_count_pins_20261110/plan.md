# Implementation Plan: DSH Measure count pins

Track: `dsh_measure_count_pins_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The derived counts and the mutation proof [checkpoint: cf6de7c]

- [x] Task 1.1: `tests/spec_review_gate/test_s4_doc_drift.sh`: derive `CATALOG_COUNT`/`CATALOG_LAST` from the catalog, use them in the six count checks, and fail on an empty/zero derivation `9cf2c2e`
- [x] Task 1.2: mutation proof: add a temporary `## A12 — …` heading to the skills catalog, observe the suite fail on the count text, restore it, observe the suite pass `9cf2c2e`
- [x] Task 1.3: run `bash tests/spec_review_gate/run.sh` (11/11), `bash tests/dsh/run.sh` (13/13), the node suite, and both parity gates `9cf2c2e`
- [x] Task: Measure - User Manual Verification 'Phase 1: The derived counts and the mutation proof' (Protocol in workflow.md) `cf6de7c`

## Phase 2: Records and closeout

- [~] Task 2.1: flip the Group (b) tech-debt row to Resolved, add the `CHANGELOG.md` entry; re-sync the installed skill copies, record the live check, run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_count_pins_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
