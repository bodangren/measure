# Implementation Plan: DSH Measure apply_patch visibility

Track: `dsh_measure_apply_patch_visibility_20261110`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: After-text reconstruction and the closeout guard

- [x] Task 1.1: `plugins/dsh-measure-guard/src/hooks.js`: reconstruct the after-text for `apply_patch` (Add/Delete/Update with exact-context hunks) and `str_replace_editor` (`create`/`str_replace`/`insert`); unknown forms yield no after-text `6ff0bcb`
- [x] Task 1.2: `plugins/dsh-measure-guard/src/guard.js`: `afterTextToolDeny` denies only when the after-text is unavailable; the closeout guard runs on reconstructed text; tests for allowed/denied patches and unreadable hunks `6ff0bcb`
- [x] Task 1.3: `plugins/dsh-measure-guard/src/shell.js`: recognize `cp`, `mv`, and `install` destination targets (the `-t`/`--target-directory` forms stay documented residuals), so a copied plan or registry is denied by the existing shell rule; tests `6ff0bcb`
- [x] Task 1.4: run `node --test plugins/dsh-measure-guard/tests/*.test.js`, both `check-parity.sh` gates, `bash tests/spec_review_gate/run.sh` (11/11), and `bash tests/dsh/run.sh` (13/13) `6ff0bcb`
- [~] Task: Measure - User Manual Verification 'Phase 1: After-text reconstruction and the closeout guard' (Protocol in workflow.md)

## Phase 2: Records and closeout

- [ ] Task 2.1: update the adapter READMEs and the tech-debt rows (apply_patch residual, shell-write row), add the CHANGELOG entry, record the live installed-plugin evidence; run the gates again
- [ ] Task 2.2: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_apply_patch_visibility_20261110` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and closeout' (Protocol in workflow.md)
