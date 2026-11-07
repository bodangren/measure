# Implementation Plan: DSH Measure allow-list parse hardening

Track: `dsh_measure_allow_parse_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Linear dedupe and control characters

- [x] Task 1.1: `plugins/dsh-measure-guard/src/core/parse.ts`: dedupe with a visited set (first-seen order) and add the `has a control character` reason for C0 characters in `allowProblem` `6d2fdcf`
- [x] Task 1.2: `plugins/dsh-measure-guard/tests/core.test.js`: duplicate-folder, `./src/`, NUL-entry, and 2000-line count cases `6d2fdcf`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js` and both parity scripts `6d2fdcf`
- [ ] Task: Measure - User Manual Verification 'Phase 1: Linear dedupe and control characters' (Protocol in workflow.md)

## Phase 2: Records and gates

- [x] Task 2.1: update the allow-list row in `measure/tech-debt.md` (dedupe and binary items resolved; wide list remains accepted) and add the `CHANGELOG.md` bug-fix entry `6d2fdcf`
- [x] Task 2.2: run `bash tests/dsh/run.sh` (13/13) and `bash tests/spec_review_gate/run.sh` (11/11) `6d2fdcf`
- [x] Task 2.3: update the OpenCode adapter's V6/V7 cases (the control-character entry is ignored) and the ordered ignore-rule tables in `mods/measure-guard/README.md` and `plugins/opencode-measure-guard/README.md` (control character is order 1) `6d2fdcf`
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md)

## Phase 3: Closeout

- [ ] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_allow_parse_20261109` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
