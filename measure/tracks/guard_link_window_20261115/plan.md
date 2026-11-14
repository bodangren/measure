# Implementation Plan: Guard link window and S1 helpers

Track: `guard_link_window_20261115`
Spec: [./spec.md](./spec.md)

**All commits go on fix/guard-link-window. Push only to origin/fix/guard-link-window, never to main. Only Daniel merges the pull request.**

## Phase 1: Guard link window and S1 helpers

- [ ] Task 1.1: D2 (the S1 helpers). Show that the two checks print "command not found" and give no PASS lines (Red, keep the output in `measure/runs/guard_link_window_20261115/`); define `in_text` and `in_flat` with the `blank` and `flat` helpers near `in_block` in `tests/spec_review_gate/test_s1_new_track.sh` (Green); run the S1 test and `bash tests/spec_review_gate/run.sh`; prove with the mutation copy `tests/spec_review_gate/mut_s1.sh` that each check can fail, keep its output, and delete the copy before the commit; commit
- [ ] Task 1.2: D1 (the parser window). Add the FR-4 cases to `mods/measure-guard/tests/parse.test.ts` and show that case (a) fails before the change (Red); replace the 3-line window in `mods/measure-guard/hooks/parse.ts` with the scan rule and update the comment at lines 5 to 8 (Green); copy `parse.ts` to `plugins/opencode-measure-guard/src/core/parse.ts` and `plugins/dsh-measure-guard/src/core/parse.ts` and run each `scripts/check-parity.sh`; update `plugins/dsh-measure-guard/README.md` line 173 and `mods/measure-guard/README.md` line 168 as FR-3 says; run `claude plugin test mods/measure-guard`, `claude plugin validate mods/measure-guard`, `bun test`, `bun x tsc --noEmit -p .` in `plugins/opencode-measure-guard`, and `node --test tests/*.test.js` in `plugins/dsh-measure-guard`; keep the outputs in `measure/runs/guard_link_window_20261115/`; commit
- [ ] Task 1.3: finalize `metadata.json` (status done, `actual_tasks`, the `completed` key, `"lane": "light"`); update `CHANGELOG.md` and `README.md` line 33; archive the track; after the plan tasks close, move the registry entry from Active Tracks to the end of Archived Tracks with `[x]` and the metadata description; run `bash tests/dsh/test-registry.sh` (long timeout) and the closeout check; record the results
- [ ] Task: Measure - User Manual Verification 'Phase 1: Guard link window and S1 helpers' (Protocol in workflow.md)

After the last commit of this phase, push fix/guard-link-window to origin and open a PR to main. Never merge the PR.
