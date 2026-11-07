# Implementation Plan: DSH Measure dispositions parser fix3

Track: `dsh_measure_srg_parser_fix3_20261108`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Raw value, bidi marks, and the probes [checkpoint: 3188d19]

- [x] Task 1.1: `skills/measure-orchestrator/scripts/measure_interphase_checks.py`: keep the raw value (after the `dispositions:` prefix, before stripping) and search it; add U+061C, U+200E, and U+200F to the class `a54fbf5`
- [x] Task 1.2: `tests/spec_review_gate/test_s3_adversarial.sh`: contract rejects for a trailing U+2028 and a leading U+0085 in the value, and CONTEST text with U+200E, U+061C, and U+200F, all with the exact message; existing probes unchanged `a54fbf5`
- [x] Task 1.3: `tests/spec_review_gate/test_s3_dispositions_docs.sh`: assert the whole class sentence (control character, C1 control, line/paragraph separator, bidi control, zero-width character) and the exact message `a54fbf5`
- [x] Task: Measure - User Manual Verification 'Phase 1: Raw value, bidi marks, and the probes' (Protocol in workflow.md) `3188d19`

## Phase 2: Records and gates [checkpoint: 5b3ac75]

- [x] Task 2.1: write `measure/archive/dsh_measure_srg_parser_fix2_20261108/spec-review.md` (F1–F3 with dispositions), link it from its index, add the dated correction note to its spec, and update the tech-debt row (trailing separators and bidi marks resolved; scope rule only residual) `a54fbf5`
- [x] Task 2.2: run `bash tests/spec_review_gate/run.sh` (10/10), the node suite (301/301), and both parity scripts; record the results `a54fbf5`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md) `5b3ac75`

## Phase 3: Closeout [checkpoint: 661b8dd]

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_srg_parser_fix3_20261108` and record the manifest-only FAIL `27384a0`
- [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md) `661b8dd`
