# Implementation Plan: DSH Measure TDD names and fixture paths

Track: `dsh_measure_tdd_names_fixture_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The names, the commands, and the paths [checkpoint: 49ec005]

- [x] Task 1.1: `mods/measure-guard/hooks/guards.ts`: the `_test.` file rule gains `dart` and `rb`; the test commands gain `node --run test` and `cargo nextest run`; sync the DSH and OpenCode core copies `cdb2b36`
- [x] Task 1.2: `mods/measure-guard/tests/fixtures/sync-real.sh`: read both plans from `measure/archive/`; verify every path it reads exists and parses with `jq` without regenerating `real.ts` `cdb2b36`
- [x] Task 1.3: DSH tests pin the four additions plus the `node --run build` / `cargo nextest list` negatives, and show the pre-fix rules miss them; run the node suite, both parity gates, srg 12/12, and CLI 14/14 `cdb2b36`
- [x] Task: Measure - User Manual Verification 'Phase 1: The names, the commands, and the paths' (Protocol in workflow.md) `49ec005`

## Phase 2: Records and closeout [checkpoint: 77dfcbc]

- [x] Task 2.1: update the name-rule and fixture tech-debt rows, add the `CHANGELOG.md` entry; install + reload the plugin, record the live check, run the gates again `0ace434`
- [x] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_tdd_names_fixture_20261110` and record the manifest-only FAIL `e8d8a44`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md) `77dfcbc`
