# Plan: Agent Performance Benchmarking

## Phase 1: Harness
- [ ] Task: Build `measure benchmark` CLI
- [ ] Task: Implement isolated temp directory runner for each model
- [ ] Task: Capture: wall clock time, tool call count, test pass rate, lint errors

## Phase 2: Scoring
- [ ] Task: Define plan adherence rubric (TDD followed? spec referenced?)
- [ ] Task: Implement rubric scorer reading plan.md and git log
- [ ] Task: Store results in `measure/benchmarks/<track_id>/<model>.json`

## Phase 3: Reporting
- [ ] Task: Build `measure benchmark:report` command generating ranking table
- [ ] Task: Group by track type (feature/bug/chore/refactor)
- [ ] Task: Update `tech-stack.md` with model recommendations per type

## Phase 4: Verification
- [ ] Task: Run benchmark on 2 sample tracks across 2 models
- [ ] Task: Verify report output is readable and actionable
- [ ] Task: Commit and push
