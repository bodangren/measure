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
