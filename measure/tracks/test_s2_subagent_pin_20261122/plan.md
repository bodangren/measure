# Implementation Plan: Test S2 subagent pin matches the orchestrator subagent rules

Track: `test_s2_subagent_pin_20261122`
Spec: [./spec.md](./spec.md)

**All commits go on fix/test-s2-subagent-pin. Push only to origin/fix/test-s2-subagent-pin, never to main. Only the PM or Daniel merges.**

Test commands: `bash tests/spec_review_gate/run.sh`; PROJECT_CHECKS `bash tests/dsh/run.sh` (from `measure/gates.json`). Run each long command through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PRIORITY=p1`.

Pinned-text guard. This track edits the S2 subagent pin itself, so no pinned-text guard applies beyond FR-1. Green changes only the check title, the expected list, and the pass/fail messages of the subagent check. Green keeps every other check byte-identical.

Copy check (2026-11-22). `agents/measure-orchestrator.md` holds the nine subagent pairs: one `"*"` deny followed by eight allows (`measure-*`, `coder`, `www-publisher`, `copywriter`, `fact-gate-checker`, `thai-writer`, `print-proof-auditor`, `change-quality-reviewer`). No copy of this rule text lives elsewhere in the repo. Only `tests/spec_review_gate/test_s2_role_docs.sh` pins it.

## Phase 1: Test pin matches the orchestrator subagent rules (due 2026-11-22)

- [~] Task 1.1 (due 2026-11-22): gap-closing Red. Red kind: gap_closing. Update the pin in `tests/spec_review_gate/test_s2_role_docs.sh`: the check title names the five global subagents; `EXPECT_SUBAGENT` holds the nine pairs in the FR-1 order; the pass message reads "the subagent rules equal the nine pairs in order"; the fail message reads "the subagent rules differ from the nine pairs". Breakage proof: run the updated check logic against a copy of the orchestrator file without the `www-publisher` row and show FAIL; run it against a copy with the rows reordered and show FAIL; run it against the live file and show PASS.
- [ ] Task 1.2 (due 2026-11-22): records (command exits). Run `bash tests/spec_review_gate/run.sh` and `bash tests/dsh/run.sh`, each through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500 HEAVY_PRIORITY=p1`. Record each exit in this plan. Both must exit 0 before the merge.
