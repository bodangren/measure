# Implementation Plan: DSH Measure dispositions parser fix2

Track: `dsh_measure_srg_parser_fix2_20261108`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Broaden the rejection and exact markers

- [x] Task 1.1: `skills/measure-orchestrator/scripts/measure_interphase_checks.py`: extend the character class to C1 controls (U+0080–U+009F), U+2028/U+2029, bidi controls (U+202A–U+202E, U+2066–U+2069) on top of C0-minus-tab/DEL and the zero-width set; make `has_agent_result()` match the two markers as whole lines after stripping, not substrings
- [x] Task 1.2: `tests/spec_review_gate/test_s3_adversarial.sh`: add CONTEST(U+2028), CONTEST(U+0085), and CONTEST(U+202E) contract rejects with the exact message, the ordering probe (invalid item + control character reports the item message, not the control message), and a marker-look-alike probe; assert the full exact message on the control probes
- [x] Task 1.3: run `bash tests/spec_review_gate/run.sh` (10/10, including the extended S3 probes)
- [ ] Task: Measure - User Manual Verification 'Phase 1: Broaden the rejection and exact markers' (Protocol in workflow.md)

## Phase 2: Grammar, records, and gates

- [x] Task 2.1: `skills/measure-orchestrator/references/contracts.md`: list the new rejection in the dispositions grammar (control characters, C1 controls, line separators, bidi controls, zero-width characters) with the exact message; add the assertion to `tests/spec_review_gate/test_s3_dispositions_docs.sh`
- [x] Task 2.2: write `measure/archive/dsh_measure_srg_parser_20261108/spec-review.md` with F1–F7 and one disposition each, link it from the track's index, add a dated correction note to its spec; update the tech-debt row (resolved: control/format characters and marker substring matching; remaining: scope rule) and the CHANGELOG wording; run the node suite and both parity scripts
- [ ] Task: Measure - User Manual Verification 'Phase 2: Grammar, records, and gates' (Protocol in workflow.md)

## Phase 3: Closeout

- [ ] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_srg_parser_fix2_20261108` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
