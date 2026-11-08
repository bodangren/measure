# Implementation Plan: DSH Measure accepted-risk closure

Track: `dsh_measure_accepted_closure_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The two pins

- [x] Task 1.1: `plugins/dsh-measure-guard/tests/plugin.test.js`: assert every registered tool takes no parameter (read-only surface pin), and verify the commit-union test covers the pre-run staged read residual `f410697`
- [x] Task 1.2: run the node suite, both parity gates, srg 12/12, and CLI 14/14 `f410697`
- [~] Task: Measure - User Manual Verification 'Phase 1: The two pins' (Protocol in workflow.md)

## Phase 2: Records and closeout

- [ ] Task 2.1: resolve the five accepted rows with their rationale, add the `CHANGELOG.md` entry; record the live check, run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_accepted_closure_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
