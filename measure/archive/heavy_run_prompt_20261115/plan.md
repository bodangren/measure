# Implementation Plan: Heavy-run prompt line

Track: `heavy_run_prompt_20261115`
Spec: [./spec.md](./spec.md)

**All commits go on fix/heavy-run-prompt. Push only to origin/fix/heavy-run-prompt, never to main. Only Daniel merges the pull request. The pull request stacks on PR #15.**

## Phase 1: Heavy-run prompt line

- [x] Task 1.1: the S2 role-doc section (Red) and the five role paragraphs (Green). Add one section to `tests/spec_review_gate/test_s2_role_docs.sh` before the "# Edge checks" block, with the checks of FR-3: for each of the five files of FR-1, the exact paragraph of FR-2 occurs exactly once and is the first non-empty line after the "Do not use the question tool." paragraph, and the three files `agents/measure-spec-review.md`, `agents/measure-orchestrator-audit.md`, and `agents/measure-ux-browser-review.md` do not hold the paragraph. Run `bash tests/spec_review_gate/test_s2_role_docs.sh`, show that only the new checks fail, and keep the output in `measure/runs/heavy_run_prompt_20261115/` (Red). Insert the paragraph of FR-2 after the "Do not use the question tool." paragraph (line 115), with one empty line before and after it, in the five files of FR-1 (Green); no frontmatter line changes. Run `bash tests/spec_review_gate/test_s2_role_docs.sh` (exit 0, the existing checks still pass) and `bash tests/spec_review_gate/run.sh` (exit 0), and keep the outputs in `measure/runs/heavy_run_prompt_20261115/`. Commit the five role files and the test file. `4dd3570`
- [x] Task 1.2: records and closeout. Finalize `metadata.json` (status done, `actual_tasks`, the `completed` key). Update `CHANGELOG.md` with one entry at the top of "## Unreleased" / "### Bug Fixes", and `README.md` line 33 to name this track as the latest archived track (2026-11-15). Archive the track, and after the plan tasks close, move the registry entry from Active Tracks to the end of Archived Tracks with `[x]` and the metadata description. Run `bash tests/dsh/test-registry.sh` (long timeout) and the closeout check of the acceptance criteria, in this order; the closeout check fails only on the missing closeout manifest. Record the results. `f1204fc`
- [ ] Task: Measure - User Manual Verification 'Phase 1: Heavy-run prompt line' (Protocol in workflow.md)

After the last commit of this phase, push fix/heavy-run-prompt to origin and open the pull request that stacks on PR #15. Never merge the pull request.
