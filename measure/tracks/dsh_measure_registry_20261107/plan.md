# Implementation Plan: DSH Measure tracks registry cleanup

Track: `dsh_measure_registry_20261107`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Rebuild the registry [checkpoint: 4589f8c]

- [x] Task 1.1: rebuild `measure/tracks.md`'s Archived Tracks section — one entry per directory under `measure/archive/` (title, link, and one description from that track's `metadata.json`), no merged description block; the active and cancelled sections stay unchanged
- [x] Task 1.2: review the rebuild for lost entries (the archive-directory count equals the entry count) and for unchanged active/cancelled sections; record the before/after counts
- [x] Task: Measure - User Manual Verification 'Phase 1: Rebuild the registry' (Protocol in workflow.md) `4589f8c`

## Phase 2: The structural check

- [ ] Task 2.1: `tests/dsh/test-registry.sh`: assert each `- [x] **Track:` line is followed by a `*Link:` line within two lines, each archive directory has exactly one entry, the active section has at most one `[~]` track, and no merged two-or-more `*…*` description block exists; run it against a fixture with a merged block (must fail) and against the rebuilt registry (must pass)
- [ ] Task 2.2: run `node --test plugins/dsh-measure-guard/tests/*.test.js` (301/301), both `plugins/dsh-measure-guard/scripts/check-parity.sh` and `plugins/opencode-measure-guard/scripts/check-parity.sh`, and `bash tests/dsh/run.sh`; record the results
- [ ] Task: Measure - User Manual Verification 'Phase 2: The structural check' (Protocol in workflow.md)

## Phase 3: Closeout

- [ ] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_registry_20261107` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
