# Implementation Plan: Installed role-file edits

Track: `role_file_edits_20261111`
Spec: [./spec.md](./spec.md)

**All commits go on local-changes-20261111. Push only to origin/local-changes-20261111. Never push to main.**

## Phase 1: Copy the installed role-file edits

- [x] Task 1.1: copy the 9 installed role files into `agents/`; check `cmp` and `git diff --numstat agents/` against the spec table; run the 5 doc tests; commit; run `bin/install-measure-skill --ref HEAD --check`; record the results `f45b7d5`
- [~] Task 1.2: finalize `metadata.json` (status done, actual tasks), archive the track, update the tracks registry, run `bash tests/dsh/test-registry.sh` and the closeout check; record the results
- [ ] Task: Measure - User Manual Verification 'Phase 1: Copy the installed role-file edits' (Protocol in workflow.md)

After the last commit of this phase, push local-changes-20261111 to origin and update PR #9. Never merge PR #9.
