# Implementation Plan: Merge base allow

Track: `merge_base_allow_20261114`
Spec: [./spec.md](./spec.md)

**All commits go on fix/merge-base-allow. Push only to origin/fix/merge-base-allow, never to main. Nobody merges the pull request except Daniel.**

## Phase 1: Merge base allow

- [x] Task 1.1: add the FR-2 section to `tests/spec_review_gate/test_s2_role_docs.sh` and show that it fails on today's role files (Red: `git merge-base --is-ancestor A B` gives deny in every audit role); add the FR-1 rule directly after the `*git merge*` deny rule in each of the eight role files (Green); run `bash tests/spec_review_gate/run.sh` and record the results; commit `503a973`
- [ ] Task 1.2: finalize `metadata.json` (status done, `actual_tasks`, the `completed` key, `"lane": "light"`); update `CHANGELOG.md` and `README.md` line 33 as FR-5 says; archive the track; after the plan tasks close, move the registry entry from Active Tracks to the end of Archived Tracks with `[x]` and the metadata description; run `bash tests/dsh/test-registry.sh` and the closeout check; record the results
- [ ] Task: Measure - User Manual Verification 'Phase 1: Merge base allow' (Protocol in workflow.md)

After the last commit of this phase, push fix/merge-base-allow to origin and open a PR to main. Never merge the PR.
