# Implementation Plan: DSH Measure contract clarity

Track: `dsh_measure_contract_clarity_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The rules and their pins [checkpoint: cc348fe]

- [x] Task 1.1: `agents/measure-phase-acceptance.md` test-only HEAD-advance exception; `skills/measure/references/new-track.md` step 9 (finding ids, Stop/resume, unknown secret location, approval wording); `contracts.md` role-result identity and model-default bullets; sync the `claude-skills/measure` bundle copy `8793c78`
- [x] Task 1.2: `tests/spec_review_gate/test_s3_dispositions_docs.sh` asserts each new sentence `8793c78`
- [x] Task 1.3: run `bash tests/spec_review_gate/run.sh` (11/11), `bash tests/dsh/run.sh` (13/13), the node suite, and both parity gates `8793c78`
- [x] Task: Measure - User Manual Verification 'Phase 1: The rules and their pins' (Protocol in workflow.md) `cc348fe`

## Phase 2: Records and closeout

- [~] Task 2.1: flip the Group (d)/(f)/(g) tech-debt rows to Resolved with evidence, state the Group (b)/(e) remaining scope, add the `CHANGELOG.md` entry; install + reload the plugin, record the live check, run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_contract_clarity_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
