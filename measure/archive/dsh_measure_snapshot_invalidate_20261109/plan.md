# Implementation Plan: DSH Measure snapshot invalidation narrowing

Track: `dsh_measure_snapshot_invalidate_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The predicate and the call site [checkpoint: 84581eb]

- [x] Task 1.1: `plugins/dsh-measure-guard/src/hooks.js`: export `repoMutationLikely(toolName)` with the read-only allowlist and fail-safe default; `index.js` invalidates on `tools/result` only when it is true `580698c`
- [x] Task 1.2: tests — the predicate for the allowlist, write tools, and an unknown name; a plugin-level test that a `read` result does not invalidate while a `bash` result does `580698c`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js` and both parity scripts `580698c`
- [x] Task: Measure - User Manual Verification 'Phase 1: The predicate and the call site' (Protocol in workflow.md) `84581eb`

## Phase 2: Records and gates [checkpoint: d03b0af]

- [x] Task 2.1: update the snapshot-invalidation perf row in `measure/tech-debt.md` and add the `CHANGELOG.md` bug-fix entry `580698c`
- [x] Task 2.2: run `bash tests/dsh/run.sh` (13/13) and `bash tests/spec_review_gate/run.sh` (11/11) `580698c`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md) `d03b0af`

## Phase 3: Closeout [checkpoint: 90139d7]

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_snapshot_invalidate_20261109` and record the manifest-only FAIL `e1b5ecd`
- [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md) `90139d7`
