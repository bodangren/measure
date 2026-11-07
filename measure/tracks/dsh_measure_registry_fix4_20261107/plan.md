# Implementation Plan: DSH Measure registry check finalization

Track: `dsh_measure_registry_fix4_20261107`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Finalize the check

- [x] Task 1.1: `tests/dsh/test-registry.sh`: pin the empty-description fallback to the label-stripped bold title (text between `**Track: ` and `**`), and reject any non-bold reason entry (`- <title> — <reason>` plus a link) or `[~]` entry inside `## Archived Tracks`, each with a specific message
- [x] Task 1.2: add the fixtures — empty-description fallback mismatch (metadata description empty, description differs from the title), a cancelled reason entry in Archived, and a `[~]` entry in Archived — and run `bash tests/dsh/test-registry.sh`, recording the PASS lines in `measure/runs/dsh_measure_registry_fix3_20261107/evidence.md`
- [ ] Task: Measure - User Manual Verification 'Phase 1: Finalize the check' (Protocol in workflow.md)

## Phase 2: Records and gates

- [~] Task 2.1: write `measure/archive/dsh_measure_registry_fix3_20261107/spec-review.md` (F1–F7 with one disposition each), link it from that track's index, add a dated correction note to its `spec.md` (fallback string, "the six earlier cases", the F7 wording), and complete the evidence file with the node/parity/CLI results, the archive-referencing entry count, and the closeout output
- [ ] Task 2.2: run `node --test plugins/dsh-measure-guard/tests/*.test.js` (301/301), both `plugins/dsh-measure-guard/scripts/check-parity.sh` and `plugins/opencode-measure-guard/scripts/check-parity.sh`, and `bash tests/dsh/run.sh`; record the results
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md)

## Phase 3: Closeout

- [ ] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_registry_fix4_20261107` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
