# Implementation Plan: DSH Measure contracts matching and scope details

Track: `dsh_measure_contracts_scope_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The section and its assertions [checkpoint: c277ef2]

- [x] Task 1.1: `skills/measure-orchestrator/references/contracts.md`: add a "## Marker Matching and Baseline" section stating the whole-line marker matching after stripping, the raw dispositions value with one CRLF terminator ignored, the item strip and control/format rejection, the finding scope names, the baseline resolution without ancestry, the unioned changed files (tree plus every commit in `baseline..HEAD`), and the HEAD-advance requirement for mid-red and jr-green `64b65a5`
- [x] Task 1.2: `tests/spec_review_gate/test_s3_dispositions_docs.sh`: extract the new section and assert one exact phrase from each requirement, so a deleted sentence fails `64b65a5`
- [x] Task 1.3: run `bash tests/spec_review_gate/run.sh` (11/11) and `bash tests/dsh/run.sh` (13/13) `64b65a5`
- [x] Task: Measure - User Manual Verification 'Phase 1: The section and its assertions' (Protocol in workflow.md) `c277ef2`

## Phase 2: Records and closeout [checkpoint: 82de102]

- [x] Task 2.1: update the Group (d) row in `measure/tech-debt.md` (matching/scope/baseline resolved; residual named) and add the `CHANGELOG.md` entry; run the node suite (318/318) and both parity gates `64b65a5`
- [x] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_contracts_scope_20261110` and record the manifest-only FAIL `969ebb2`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md) `82de102`
