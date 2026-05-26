# Spec: Agent Performance Benchmarking

## Problem
There is no systematic data on which AI models perform best for different track types (features, bugs, chores, refactors) in Measure. Users pick models based on habit, not evidence.

## Solution
Create a benchmarking harness that runs identical tracks across different models and measures: time to complete, plan quality score (rubric-based), test pass rate, and commit message quality.

## Acceptance Criteria
- [ ] `measure benchmark` CLI that accepts a track directory and a list of models
- [ ] Runs the track's plan.md tasks against each model in isolation (temp directory)
- [ ] Metrics: wall clock time, number of tool calls, test pass rate, lint errors, plan adherence score (did it follow TDD?)
- [ ] Results stored in `measure/benchmarks/<track_id>/<model>.json`
- [ ] Summary report: ranking table per model, per track type
- [ ] Update `tech-stack.md` with recommended models per track type based on results

## Out of Scope
- Cost benchmarking (assumed from token counts)
- Real-time leaderboard
- Automatic model selection
