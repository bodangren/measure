# Specification: Closeout deferred and generated checks

## Overview

The closeout gate skips every task line that contains "deferred" and runs no freshness check of `measure/generated`. A closeout that skipped a deferred regenerate still prints PASS.

Source: Forge request 2026-11-19, added to PR #32.

## Decided change

Item 1: closeout fails unless each deferred task of the closeout phase cites its done SHA on the line. The closeout phase is the last phase of the plan, or a task whose text names records, closeout, or regenerate. Deferred tasks in earlier phases keep today's rule.

Item 2: closeout runs the project generator freshness check and requires exit 0. The command comes from a new `GENERATED_CHECK_COMMAND` field in `measure/gates.json`, named like the other `*_COMMAND` fields. When the repo has a `measure/generated` folder and no such field, the gate fails and names the field. When the repo has no `measure/generated` folder, the gate skips the check with one INFO line. The command runs through the same heavy-run wrapper resolution as `role-gate`. The Forge generator runs `node measure/tools/generate.mjs --check`.

## Tests

Add one suite under `tests/spec_review_gate/` with a closeout archive fixture. Cover a deferred closeout task with a SHA, one without a SHA, a deferred task in an earlier phase, a passing generated check, a failing check, a missing field with a generated folder, and a missing generated folder. Confirm the new cases fail before the change. Then change the checker and the docs. Then run the full `tests/spec_review_gate/run.sh` suite and `tests/dsh/test-registry.sh` through the heavy-run wrapper.
