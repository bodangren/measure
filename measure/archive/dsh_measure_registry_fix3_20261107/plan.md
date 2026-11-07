# Implementation Plan: DSH Measure registry checker completeness

Track: `dsh_measure_registry_fix3_20261107`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Complete the check [checkpoint: 42ece9b]

- [x] Task 1.1: `tests/dsh/test-registry.sh`: split the registry by section and require archived bold entries (and only those) inside `## Archived Tracks`; require each entry's description to equal its archive's `metadata.json` description (collapsed) or, when empty, the entry's bold title; reject one-line `- [x] [Title](archive/<dir>/…)` links anywhere; keep the existing rules `457a272`
- [x] Task 1.2: add isolated negative fixtures for an entry outside the section, a metadata mismatch, a clipped description, and an old-shape link (each building its own registry and archive tree) `457a272`
- [x] Task 1.3: fix the registry's `visual_refresh_20260425` description to its bold title (the defined empty-description fallback); run `bash tests/dsh/test-registry.sh` and record each PASS `457a272`
- [x] Task: Measure - User Manual Verification 'Phase 1: Complete the check' (Protocol in workflow.md) `42ece9b`

## Phase 2: Records and gates [checkpoint: c7449ac]

- [x] Task 2.1: write `measure/archive/dsh_measure_registry_fix2_20261107/spec-review.md` with F1–F7 and one disposition each, link it from that track's index, and correct its Overview's pre-fix shape; state the entry count as archive-referencing entries in this track's record
- [x] Task 2.2: run the node suite (301/301), both parity scripts, and `bash tests/dsh/run.sh`; record the results
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md) `c7449ac`

## Phase 3: Closeout

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_registry_fix3_20261107` and record the manifest-only FAIL
- [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
