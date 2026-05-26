# Plan: Multi-Project Portfolio View

## Phase 1: Scanner
- [ ] Task: Build `measure portfolio` CLI command
- [ ] Task: Scan `~/Desktop/*/measure/tracks.md` with configurable root
- [ ] Task: Parse active/pending/completed track counts per project
- [ ] Task: Read git metadata (last commit date, unpushed commits)

## Phase 2: Health Scoring
- [ ] Task: Define health rules: 🟢≥4 pending tracks + commits in 7d, 🟡<4 pending or unpushed, 🔴0 commits in 7d
- [ ] Task: Implement `--stale`, `--blocked`, `--needs-tracks` filters
- [ ] Task: Add `--json` output mode

## Phase 3: Integration
- [ ] Task: Replace inline shell logic in daily automation with `measure portfolio --json`
- [ ] Task: Add `measure portfolio` to workflow documentation

## Phase 4: Verification
- [ ] Task: Run against current ~/Desktop and verify output matches manual audit
- [ ] Task: Commit and push
