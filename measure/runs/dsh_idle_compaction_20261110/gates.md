# Idle-session compaction: verification results

Date: 2026-11-10
Tree: `main` at the round-2 fix (`087878e`), working tree clean.

## Plugin suites

```
cd plugins/dsh-idle-compaction && node --test tests/*.test.js
tests 32, pass 32, fail 0
```

Covers the pure policy (17 tests) and the fake-Cordis watcher wiring (15 tests:
bind from `agents.list()` and `agent/created`, awaited `readSession` scan before
an eligible tick, one compaction per idle window, running-agent and child-agent
skips, re-arm on new activity, busy/no-op/failure containment, disposal aborts,
timer cleared).

## Repository gates

```
bash tests/dsh/run.sh
== summary: 14 passed, 0 failed ==   (EXIT 0)

plugins/dsh-measure-guard/scripts/check-parity.sh
parity: ok
plugins/opencode-measure-guard/scripts/check-parity.sh
parity: ok
```

## Spec review gate

```
bash tests/spec_review_gate/run.sh
=== spec_review_gate: 12 suites (PASS=12, FAIL=0) ===   (EXIT=0)
```

Run on the same tree before the round-2 commit; the committed tree is identical
(`git status --short` empty between the run and `087878e`).

## Live proof

The short-idle live proof in `measure/runs/dsh_idle_compaction_20261110/live-evidence.md`
was re-run with the final `readSession` build on the isolated DSH home
(`session-e74ca894-ae61-4df9-9ff1-bd3e2b52b932`: compaction start seq 44 with
`turn: null`, summary seq 46, end seq 48 without error; 12 s of ticks with no new
activity produced no second compaction; one new turn re-armed exactly one more).
The running Web profile is restored to `idleMinutes: 55`, `checkSeconds: 60`.
