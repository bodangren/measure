# Implementation Plan: Prompt audit

Track: `prompt_audit_20261115`
Spec: [./spec.md](./spec.md)

**All commits go on chore/prompt-audit. Push only to origin/chore/prompt-audit, never to main. Only Daniel merges.**

## Phase 1: Prompt audit [checkpoint: pending]

- [ ] Task 1.1: apply the audit table of spec.md in one commit (message `chore(prompts): Trim old-model wording from the Measure prompts`), including the mirror edits in `claude-skills/measure/`; run the gates `bash tests/spec_review_gate/test_s1_new_track.sh`, `bash tests/spec_review_gate/test_s2_role_docs.sh`, `bash tests/spec_review_gate/test_s4_doc_drift.sh`, `bash tests/dsh/test-skill-docs.sh`, `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/spec_review_gate/run.sh` (no shell redirection), `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/run.sh` (no shell redirection), and `node --test tests/*.test.js` in `plugins/dsh-measure-guard`; record the per-file line counts before and after the cuts (the table of spec.md gives the expected counts) and `diff -r skills/measure claude-skills/measure` exit 0 in the task line of this plan.
- [ ] Task 1.2: records and closeout. Finalize `metadata.json` (status done, `actual_tasks`, the `completed` key). Update `CHANGELOG.md` with one entry at the top of "## Unreleased" ("### Chores" heading when none exists), and `README.md` line 33 to name this track as the latest archived track. Archive the track, and after the plan tasks close, move the registry entry from Active Tracks to the end of Archived Tracks with `[x]` and the metadata description. Run `HEAVY_PRIORITY=p2 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh bash tests/dsh/test-registry.sh` with no shell redirection (long timeout), then run the closeout check of the acceptance criteria, in this order; the closeout check fails only on the missing closeout manifest. Record the results.
- [ ] Task: Measure - User Manual Verification 'Phase 1: Prompt audit' (Protocol in workflow.md)

After the last commit of this phase, push chore/prompt-audit to origin and open the pull request. Never merge the pull request.
