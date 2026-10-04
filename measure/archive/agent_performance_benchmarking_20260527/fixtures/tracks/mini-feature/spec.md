# Spec: Mini Feature (fixture)

Deterministic 2-task feature track used as a fixture for the
`agent_performance_benchmarking_20260527` Phase 1 harness tests.
Hand-written so that any future implementation can rely on its
contents to exercise the runner.

## Acceptance Criteria
- [ ] Exposes exactly two tasks in `plan.md`
- [ ] Tasks use the standard `[ ]` markers (no `[x]`, no `[~]`)
- [ ] Title contains the word "Feature" so the runner can group by type
