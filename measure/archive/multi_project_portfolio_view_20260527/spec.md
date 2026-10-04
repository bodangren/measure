# Spec: Multi-Project Portfolio View

## Problem
Measure operates on one project at a time. Users with many projects (like this portfolio) have no single view of health across all repositories.

## Solution
Add a `measure portfolio` command that scans `~/Desktop/*/measure/` and generates a consolidated health report: pending track counts, stale projects, blockers, and recommendations.

## Acceptance Criteria
- [ ] `measure portfolio` CLI reads all `*/measure/tracks.md` under a configurable root
- [ ] Output: table of projects with active tracks, pending track count, last commit date, health color
- [ ] Configurable exclusions (like bus-math-v2, Workbooks)
- [ ] Flags: `--stale` (only projects with 0 commits in 7 days), `--blocked` (projects with stalled tracks), `--needs-tracks` (< 4 pending)
- [ ] JSON output mode for integration with daily automation
- [ ] Update daily automation to use this instead of inline shell logic

## Out of Scope
- Web UI for portfolio (covered by Daily Automation Dashboard)
- Cross-project track dependencies
- Automatic project discovery via GitHub API
