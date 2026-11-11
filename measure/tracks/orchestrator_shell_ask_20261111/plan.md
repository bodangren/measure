# Implementation Plan: Orchestrator shell default ask

Track: `orchestrator_shell_ask_20261111`
Spec: [./spec.md](./spec.md)

**All commits go on fix/orchestrator-shell-ask. Push only to origin/fix/orchestrator-shell-ask. Never push to main.**

## Phase 1: Restore the ask default

- [x] Task 1.1: change line 17 of `agents/measure-orchestrator.md` to ask and the pin in `tests/spec_review_gate/test_s2_role_docs.sh` to ask; run the doc tests of FR-5 into the FR-5 log; commit the 2 files; check the installed-copy diffs and run `bin/install-measure-skill --ref HEAD --check`; record the results `7c37744`
- [~] Task 1.2: finalize `metadata.json` (status done, actual_tasks, the `completed` key, `"lane": "light"`); update `README.md` and `CHANGELOG.md` as FR-8 says; archive the track; after the plan tasks close, move the registry entry from Active Tracks to the end of Archived Tracks with `[x]` and the metadata description; run `bash tests/dsh/test-registry.sh` and the closeout check; record the results
- [ ] Task: Measure - User Manual Verification 'Phase 1: Restore the ask default' (Protocol in workflow.md)

After the last commit of this phase, push fix/orchestrator-shell-ask to origin and open a PR to main. Never merge the PR.
