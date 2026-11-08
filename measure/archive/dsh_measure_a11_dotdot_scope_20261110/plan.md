# Implementation Plan: DSH Measure A11 dotdot scope

Track: `dsh_measure_a11_dotdot_scope_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The bound and its contract rows [checkpoint: d309369]

- [x] Task 1.1: both catalogs: the A11 block skips a claim containing a `..` segment (identical blocks) and the paragraph states the rule plus that candidates are reports `c254390`
- [x] Task 1.2: `tests/spec_review_gate/test_s4_adversarial.sh`: the `..`-outside row now expects no line, a `..`-inside row expects no line, and the existing rows keep their lines `c254390`
- [x] Task 1.3: run `bash tests/spec_review_gate/run.sh` (11/11), `bash tests/dsh/run.sh` (13/13), the node suite, and both parity gates `c254390`
- [x] Task: Measure - User Manual Verification 'Phase 1: The bound and its contract rows' (Protocol in workflow.md) `d309369`

## Phase 2: Records and closeout

- [x] Task 2.1: flip the Group (e) tech-debt row to Resolved, add the `CHANGELOG.md` entry; install + reload the plugin, record the live check, run the gates again `8a2c9d7`
- [~] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_a11_dotdot_scope_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
