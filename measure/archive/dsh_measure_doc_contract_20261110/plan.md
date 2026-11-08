# Implementation Plan: DSH Measure doc contract

Track: `dsh_measure_doc_contract_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The rule, the span, and the lint [checkpoint: 923e10d]

- [x] Task 1.1: `skills/measure/references/new-track.md` §2.5 step 4 project-metadata-keys rule (bundle copy synced); `plugins/opencode-measure-guard/README.md` status-lines span fixed `0deea61`
- [x] Task 1.2: `tests/dsh/test-docs.sh` inline-code-span balance check over the guide and the two plugin READMEs with an unbalanced-span fixture; `test_s1_new_track.sh` pins the §2.5 rule `0deea61`
- [x] Task 1.3: run `bash tests/dsh/run.sh` (13/13), `bash tests/spec_review_gate/run.sh` (11/11), the node suite, and both parity gates `0deea61`
- [x] Task: Measure - User Manual Verification 'Phase 1: The rule, the span, and the lint' (Protocol in workflow.md) `923e10d`

## Phase 2: Records and closeout

- [x] Task 2.1: resolve the metadata-schema and broken-span tech-debt rows, add the `CHANGELOG.md` entry; record the live check, run the gates again `755b942`
- [x] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_doc_contract_20261110` and record the manifest-only FAIL `293be89`
- [~] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
