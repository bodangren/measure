# Implementation Plan: Result line

Track: `result_line_20261115`
Spec: [./spec.md](./spec.md)

**All commits go on chore/result-line. Push only to origin/chore/result-line, never to main. Only Daniel merges.**

## Phase 1: Result line

- [ ] Task 1.1: add the S2 section of spec.md to tests/spec_review_gate/test_s2_role_docs.sh before the "# Edge checks" block (Red: the section fails before the change), then add the RESULT line of spec.md to the 13 agents files, each after its anchor paragraph (Green), keep the placement diffs (for each file, diff agents/<file> ~/.config/opencode/agents/<file> shows only the PR #16 and PR #18 lines) as evidence, run the gates bash tests/spec_review_gate/test_s2_role_docs.sh (direct) and HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/spec_review_gate/run.sh (no shell redirection), and commit with `chore(agents): Add the RESULT verdict line to the thirteen role files`.
- [ ] Task 1.2: records and closeout, with the record texts of FR-2 (format precedent: the Prompt audit archive commit 9622461). Finalize metadata.json (status done, actual_tasks, the completed key, and the deviation_notes record). Update CHANGELOG.md with one entry at the top of "## Unreleased" under the existing "### Chores" heading, with the exact text of FR-2. Update README.md line 33 to start with "As of 2026-11-15, the latest archived track is Result line (the thirteen Measure role files gain the RESULT verdict line, and an S2 role-doc section pins it)." and keep the rest of line 33 unchanged. Commit `chore(measure): Archive track 'Result line'` holds these record changes, the git mv of the track folder to measure/archive/result_line_20261115/, the finalized metadata.json, and the removal of the Active Tracks entry; then commit `chore(measure): Add the archived track 'Result line' to the registry` with the Archived Tracks entry at the end, [x], and the metadata description. Run HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/test-registry.sh with no shell redirection (long timeout), then run the closeout check (python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py closeout --repo . --track result_line_20261115), in this order; the closeout check fails only on the missing closeout manifest. Record the results in the plan and in metadata.json deviation_notes, in the commit `chore(measure): Record the closeout checks of 'Result line'`.
- [ ] Task: Measure - User Manual Verification 'Phase 1: Result line' (Protocol in workflow.md)

After the last commit of this phase, push chore/result-line to origin and open the pull request. Never merge the pull request.
