# Implementation Plan: Final acceptance head scope

Track: `final_acceptance_head_scope_20261113`
Spec: [./spec.md](./spec.md)

**All commits go on fix/final-acceptance-head-scope. Push only to origin/fix/final-acceptance-head-scope. Never push to main. The branch stacks on PR #11.**

## Phase 1: Path-scoped HEAD coverage

- [x] Task 1.1: add the FR-2 section to `tests/spec_review_gate/test_s2_role_docs.sh` and show that it fails on today's `agents/measure-final-acceptance.md` (Red); change line 115 as FR-1 says (Green); run the doc tests of FR-3 into the FR-3 log; commit; record the results `6b1a2ad`
- [~] Task 1.2: finalize `metadata.json` (status done, actual_tasks, the `completed` key, `"lane": "light"`); update `README.md` and `CHANGELOG.md` as FR-4 says; archive the track; after the plan tasks close, move the registry entry from Active Tracks to the end of Archived Tracks with `[x]` and the metadata description; run `bash tests/dsh/test-registry.sh` and the closeout check; record the results
- [ ] Task: Measure - User Manual Verification 'Phase 1: Path-scoped HEAD coverage' (Protocol in workflow.md)

After the last commit of this phase, push fix/final-acceptance-head-scope to origin and open a PR to main. Never merge the PR.
