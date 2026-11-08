# Implementation Plan: DSH Measure gate robustness

Track: `dsh_measure_gate_robustness_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The tracked corpus and the pipefail tolerance [checkpoint: 9f32535]

- [x] Task 1.1: `tests/spec_review_gate/test_s3_adversarial.sh`: the G19 live corpus is `git ls-files` over `measure/runs` and `measure/archive`, filtered to `.log`, instead of a filesystem walk `7d97df8`
- [x] Task 1.2: the A11 recipe ends its per-document pipeline with `done || true` in both catalogs (identical blocks); `test_s4_adversarial.sh` pins the `-o pipefail` empty-document exit 0 `7d97df8`
- [x] Task 1.3: prove the foreign-log case (an untracked invalid log leaves S3 green), then run `bash tests/spec_review_gate/run.sh` (11/11), `bash tests/dsh/run.sh` (13/13), the node suite, and both parity gates `7d97df8`
- [x] Task: Measure - User Manual Verification 'Phase 1: The tracked corpus and the pipefail tolerance' (Protocol in workflow.md) `9f32535`

## Phase 2: Records and closeout

- [x] Task 2.1: update the Group (b) tech-debt row with the resolved parts (G19 corpus, pipefail tolerance, Unreleased credit) and the remaining fixed-count literal scope, add the `CHANGELOG.md` entry; install + reload the plugin, record the live check, run the gates again `5f77360`
- [~] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_gate_robustness_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
