# Orchestrator process fixes: verification results

Date: 2026-11-11

## Suites

```
node --test plugins/dsh-measure-guard/tests/*.test.js
ℹ tests 356, pass 356, fail 0

python3 tests/spec_review_gate/test_checker.py
Ran 49 tests ... OK       (the gates-file, closeout, and short-baseline cases were added here)

plugins/dsh-measure-guard/scripts/check-parity.sh      parity: ok
plugins/opencode-measure-guard/scripts/check-parity.sh parity: ok

bash tests/dsh/run.sh
== summary: 14 passed, 0 failed ==                     (EXIT 0)

bash tests/spec_review_gate/run.sh
=== spec_review_gate: 13 suites (PASS=13, FAIL=0) ===   (EXIT=0)
```

The S2 role-docs suite grew from 51 to 58 checks (five fail-fast dispatch and
progress checks, two audit-role redirect checks); the checker suite grew from 37
to 49 tests.

## What the gates now prove

- `measure/gates.json` supplies `RED_TEST_COMMAND`, `GREEN_TEST_COMMAND`,
  `PROJECT_LINT`, `PROJECT_CHECKS`, `PROJECT_TESTS`, and `PROJECT_DEV_URL`; a
  `role-gate`/`closeout` run reads the file and an environment variable wins.
- `closeout` fails without a passing `measure/runs/<track>/final-acceptance-*.json`
  and accepts `"lane": "light"` with the INFO line. This track declares
  `"lane": "light"` because it closes without a final-acceptance run (its gate
  evidence is this file and the full suites above).
- The Mid Red and Jr Green HEAD-advance check resolves the baseline, so a short
  SHA no longer passes as "HEAD advanced".
- The eight audit roles keep a narrowed write-redirect deny (`* > *`, `* >*`,
  `*>>*`) instead of the blanket `*>*`, so `2>&1` commands are not blocked.

## Role files

The 2026-11-11 role-table edits in `agents/` are the installed copies from the
merged PR #9; this track only changes `agents/measure-orchestrator.md` (dispatch,
default shell effect, progress rule, model-source sentence) and the audit-role
shell rules. `bin/install-measure-skill` will report the installed copies as
different; the hourly installer propagates from `main`.
