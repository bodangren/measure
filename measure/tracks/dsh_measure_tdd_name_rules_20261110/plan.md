# Implementation Plan: DSH Measure TDD name rules

Track: `dsh_measure_tdd_name_rules_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The widened rules and their pins [checkpoint: 4b40241]

- [x] Task 1.1: `mods/measure-guard/hooks/guards.ts`: `TEST_FILES` matches code files at any depth under a test directory and `TEST_COMMANDS` matches `node --test`/`node <options> --test`; sync the DSH and OpenCode core copies `742bf2b`
- [x] Task 1.2: `plugins/dsh-measure-guard/tests/core.test.js`: pin the new positives (`tests/unit/x.py`, `src/__tests__/deep/x.ts`, `plugins/a/tests/deep/y.js`, `node --test`, `node --experimental-strip-types --test`) and the negative controls (`tests/README.md`, `node -e`) `742bf2b`
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` gates, `bash tests/spec_review_gate/run.sh` (11/11), and `bash tests/dsh/run.sh` (13/13) `742bf2b`
- [x] Task: Measure - User Manual Verification 'Phase 1: The widened rules and their pins' (Protocol in workflow.md) `4b40241`

## Phase 2: Records and closeout

- [x] Task 2.1: note the widened coverage in the guard README and the tech-debt name-rule row, add the `CHANGELOG.md` entry; install + reload the plugin, record the live check, run the gates again `c46a607`
- [~] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_tdd_name_rules_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
