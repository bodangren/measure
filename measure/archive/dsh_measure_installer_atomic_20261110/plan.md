# Implementation Plan: DSH Measure installer atomicity

Track: `dsh_measure_installer_atomic_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Atomic writes and their test [checkpoint: c3b4c77]

- [x] Task 1.1: `bin/install-measure-skill`: `put()` writes a sibling temporary file and renames it; the stamp is written the same way; failures clean up and exit 3 with `cannot write`; the header documents the change `625b73e`
- [x] Task 1.2: new `tests/dsh/test-skill-install.sh`: real fixture repository (real installer, custom targets, small bundle); install, content/stamp equality, no temporary leftovers, read-only folder failure with unchanged target, recovery re-run `625b73e`
- [x] Task 1.3: run `bash tests/dsh/run.sh` (14/14), `bash tests/spec_review_gate/run.sh` (11/11), the node suite, and both parity gates `625b73e`
- [x] Task: Measure - User Manual Verification 'Phase 1: Atomic writes and their test' (Protocol in workflow.md) `c3b4c77`

## Phase 2: Records and closeout

- [x] Task 2.1: update the installer tech-debt row with the resolved atomicity/log part and the remaining shared-skill uninstall design, add the `CHANGELOG.md` entry; record the live check, run the gates again `52f55e4`
- [x] Task 2.2: `metadata.json`, archive the track, update the tracks registry; run `closeout --track dsh_measure_installer_atomic_20261110` and record the manifest-only FAIL `2638eaa`
- [~] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
