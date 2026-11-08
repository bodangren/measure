# Implementation Plan: DSH Measure shell visibility for every adapter

Track: `dsh_measure_shell_visibility_adapters_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The shared grammar and the two wirings [checkpoint: 863bc7c]

- [x] Task 1.1: move the grammar into `mods/measure-guard/hooks/guards.ts` (source of truth), sync the DSH and OpenCode core copies, and make `plugins/dsh-measure-guard/src/shell.js` a re-export; keep the DSH node suite green and both parity gates ok `992d4f2`
- [x] Task 1.2: wire `mods/measure-guard/hooks/register.tsx` and `plugins/opencode-measure-guard/src/guard.ts` to feed `shellWritePaths` targets through the edit and strict TDD guards; add the cases to both adapters' edit-guard TS suites `992d4f2`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` gates, `bash tests/spec_review_gate/run.sh` (11/11), and `bash tests/dsh/run.sh` (14/14) `992d4f2`
- [x] Task: Measure - User Manual Verification 'Phase 1: The shared grammar and the two wirings' (Protocol in workflow.md) `863bc7c`

## Phase 2: Records and closeout [checkpoint: efe35ee]

- [x] Task 2.1: record the closure and residual in the tech-debt row, update both adapter READMEs and `CHANGELOG.md`; install + reload the plugin, record the live check, run the gates again `19f10ef`
- [x] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_shell_visibility_adapters_20261110` and record the manifest-only FAIL `896d021`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md) `efe35ee`
