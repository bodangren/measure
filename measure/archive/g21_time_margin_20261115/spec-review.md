# Spec Review: g21_time_margin_20261115

Author model: volcengine-agent-plan/glm-5.3-flash

## Round 1

Date: 2026-11-15
Reviewer: measure-spec-review, kimi-code-plan-cn/kimi-for-coding#high

### What this track proposes

The track widens the first G18 probe of `tests/spec_review_gate/test_s3_adversarial.sh` from 20000 to 100000 lines per count, through a named constant `G18_LINES` near `TIME_LIMIT`. The goal is to kill the G21 sensitivity mutant "the old quadratic any(...) loop" on fast machines. Only the test file changes. The records update `CHANGELOG.md` and `README.md` line 33.

### How the current system works, per this spec

The S3 adversarial suite embeds a copy of the result-block checker and runs sensitivity mutants against probe groups. The G18 probes are wall-clock checks with a 30 s `TIME_LIMIT`, and each mutant run has a 15 s subprocess timeout. The mutant replaces the linear test `if first_start < index:` with `if any(start < index for start in starts):` inside a loop over all end lines, which makes the work quadratic in the probe width. On the new tower the 20000-line probe gives about 4e8 steps, which finishes inside the 15 s timeout, so no probe fails and the mutant survives. The real checker is linear and reads the probe input in about 0.05 s at 100000 lines per count.

### Findings

- None
