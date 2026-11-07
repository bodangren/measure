# Implementation Plan: DSH Measure skill-doc check fix3

Track: `dsh_measure_skill_doctor_fix3_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The fixture and the records

- [x] Task 1.1: `tests/dsh/test-skill-docs.sh`: add the folded `description: >` fixture (≤1024 passes, 1025 fails)
- [x] Task 1.2: `measure/tech-debt.md`'s skill_doctor row and the `CHANGELOG.md` skill-doc bullet name the Markdown folder-link rule (N3, `skill.referenced-directory`) and keep the separate bundle-symlink rule
- [x] Task 1.3: write `measure/archive/dsh_measure_skill_doctor_fix2_20261109/spec-review.md` (F1–F5 with dispositions), link it from that index, add the dated correction note to its spec; run the test and the CLI suite (13/13)
- [ ] Task: Measure - User Manual Verification 'Phase 1: The fixture and the records' (Protocol in workflow.md)

## Phase 2: Gates and closeout

- [x] Task 2.1: run the node suite (301/301), both parity scripts, and `bash tests/spec_review_gate/run.sh` (11/11)
- [ ] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_skill_doctor_fix3_20261109` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Gates and closeout' (Protocol in workflow.md)
