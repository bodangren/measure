# Implementation Plan: DSH Measure skill-doc check fix4

Track: `dsh_measure_skill_doctor_fix4_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The passing fixtures and the records [checkpoint: ddd13be]

- [x] Task 1.1: `tests/dsh/test-skill-docs.sh`: add a temporary skill whose body has `[top](#top)` and `[site](https://example.com/x)`; it must pass and print a PASS line `0686748`
- [x] Task 1.2: add the missing conjunction to the CHANGELOG skill-doc bullet; correct the fix2 review's F1 disposition and the fix3 evidence to the true PASS count `0686748`
- [x] Task 1.3: write `measure/archive/dsh_measure_skill_doctor_fix3_20261109/spec-review.md` (F1–F4 with dispositions), link it from that index, add the dated correction note to its spec; run the test and the CLI suite (13/13) `0686748`
- [x] Task: Measure - User Manual Verification 'Phase 1: The passing fixtures and the records' (Protocol in workflow.md) `ddd13be`

## Phase 2: Gates and closeout

- [x] Task 2.1: run the node suite (301/301), both parity scripts, and `bash tests/spec_review_gate/run.sh` (11/11) `0686748`
- [x] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_skill_doctor_fix4_20261109` and record the manifest-only FAIL
- [x] Task: Measure - User Manual Verification 'Phase 2: Gates and closeout' (Protocol in workflow.md)
