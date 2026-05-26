# Spec: Track Dependency Graph

## Problem
Tracks are independent. There is no way to express that Track B depends on Track A, or to visualize the critical path through a project's backlog.

## Solution
Add optional `depends_on` to track metadata and generate a Mermaid or D3 dependency graph from tracks.md. Update the new-track workflow to ask about dependencies.

## Acceptance Criteria
- [ ] `metadata.json` supports `depends_on: string[]` of track IDs
- [ ] `tracks.md` validation ensures all `depends_on` IDs exist
- [ ] `measure graph` CLI command generates a Mermaid flowchart or SVG
- [ ] Circular dependency detection with clear error message
- [ ] Status rollup: if dependency is not `[x]`, dependent track shows `[~]` with blocker note
- [ ] Update `new-track` workflow to ask: "Does this track depend on any existing tracks?"

## Out of Scope
- Gantt chart timeline
- Automatic dependency inference from code
- Critical path analysis with story points
