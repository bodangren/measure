// Small hand-written Measure files for the edge cases.

export const EDGE_PLAN = `# Plan: Edge

## Phase 1: Setup [checkpoint: 8e8d3fc]

- [x] Task: Archived style SHA aa591f4
    - [x] Sub-task one
- [x] Task: Backtick SHA \`82b9e67\`
- [b] Task: Human check deferred:user
- [b] Task: Human check with no owner

## Run record

- [x] Not a task
- [ ] Not a task either

## Phase 2: Build

- [~] Task: Write the parser
    - [ ] Sub-task
- [ ] Task: Write the band
`

export const TWO_ACTIVE_TRACKS = `# Project Tracks

- [~] **Track: First**
  *Link: [./tracks/first_1/](./tracks/first_1/)*

---

- [~] **Track: Second**
  *Link: [./tracks/second_2/](./tracks/second_2/)*

- [x] [Old work](archive/old_0/index.md)
`

export const PLAN_NO_ACTIVE_TASK = `## Phase 1: A

- [x] Task: Done \`1234567\`
- [ ] Task: Next
`

export const PLAN_ACTIVE_TASK = `## Phase 1: A

- [~] Task: Doing the work
`

/** 4 phases; the [~] task is task 3 of 7 in phase 2; 2 [b] tasks. */
export const BAND_PLAN = `## Phase 1: One [checkpoint: 1111111]

- [x] Task: Done \`aaaaaaa\`

## Phase 2: Two

- [x] Task: First \`bbbbbbb\`
- [b] Task: Second deferred:user
- [~] Task: Third
- [ ] Task: Fourth
- [ ] Task: Fifth
- [b] Task: Sixth
- [ ] Task: Seventh

## Phase 3: Three

- [ ] Task: Later

## Phase 4: Four

- [ ] Task: Last
`

export const DONE_PLAN = `## Phase 1: A [checkpoint: 1234567]

- [x] Task: Done \`1234567\`
- [b] Task: Human check deferred:user
`

// The Mediarr registry shape: numbered execution-order entries and a `*Link:*`
// on the same bold line. The DSH adapter reported "no known format" on this.
export const MEDIARR_REGISTRY = `# Project Tracks

## Active Tracks — Execution Order

1. - [~] **Track: Home Network Deployment Hardening** *Phases: 6 | Link: [./tracks/chore_home_network_deployment_hardening_20260712/](./tracks/chore_home_network_deployment_hardening_20260712/)*
2. - [~] **Track: Database Migration and Data Preservation Strategy** *Phases: 5 | Link: [./tracks/database_migration_strategy_20260713/](./tracks/database_migration_strategy_20260713/)*

## Scoped Tracks (not started)

- [ ] **Track: Adult Library for Mediarr** *Phases: 5 | Link: [./tracks/feature_adult_library_20261107/](./tracks/feature_adult_library_20261107/)*

## Recently Completed (archived)

- [x] **Track: TV Client Browse Density** *Phases: 5 | Link: [./archive/feature_tv_browse_playback_20261003/](./archive/feature_tv_browse_playback_20261003/)*
`
