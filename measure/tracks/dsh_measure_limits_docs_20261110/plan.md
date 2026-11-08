# Implementation Plan: DSH Measure limits documentation

Track: `dsh_measure_limits_docs_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The two limits sections and their pin

- [x] Task 1.1: `plugins/dsh-measure-guard/README.md` Known limits gains the root-resolution/headless and allow-list-memory bullets; `plugins/opencode-measure-guard/README.md` gains `## Known limitations (OpenCode 2.0.32)` with the three runtime limits `e0ca7fd`
- [x] Task 1.2: `tests/dsh/test-docs.sh` checks both limits sections (heading plus two bullets) and rejects a fixture copy without the section `e0ca7fd`
- [x] Task 1.3: run `bash tests/dsh/run.sh`, `bash tests/spec_review_gate/run.sh` (12/12), the node suite, and both parity gates `e0ca7fd`
- [~] Task: Measure - User Manual Verification 'Phase 1: The two limits sections and their pin' (Protocol in workflow.md)

## Phase 2: Records and closeout

- [ ] Task 2.1: resolve the six constraint rows with their document reference, add the `CHANGELOG.md` entry; record the live check, run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_limits_docs_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
