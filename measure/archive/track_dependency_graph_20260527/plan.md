# Plan: Track Dependency Graph

## Phase 1: Schema & Validation
- [ ] Task: Update `metadata.json` schema to include `depends_on: string[]`
- [ ] Task: Add validation in `new-track` workflow to check dependency IDs exist
- [ ] Task: Add circular dependency detection utility

## Phase 2: CLI Command
- [ ] Task: Build `measure graph` CLI command
- [ ] Task: Parse all tracks and build adjacency list
- [ ] Task: Generate Mermaid flowchart output
- [ ] Task: Optional: generate SVG via mermaid-cli or inline JS

## Phase 3: Status Rollup
- [ ] Task: Update status display logic: if dependency not `[x]`, show `[~]` with blocker
- [ ] Task: Add dependency chain to `measure status` output

## Phase 4: Verification
- [ ] Task: Test with sample tracks including circular dependency (should error)
- [ ] Task: Update existing tracks with real dependencies where applicable
- [ ] Task: Commit and push
