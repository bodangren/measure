// Small hand-written Measure files for edge cases. The real files below are
// copies of this repository's measure/ folder; keep them in sync by reading
// the source.

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

export const NO_PHASE_PLAN = `# Plan: A plan with no Phase heading

This plan has only prose.
`

// ----- Real copies below. Snapshots from this repository at HEAD; refresh
// from the source files when edits land.

export const INDEX = `# Measure Index

This file is the root of the Universal File Resolution Protocol. All Measure commands resolve project files by name using the links below.

## Project Context

- **Product Definition**: [./product.md](./product.md)
- **Product Guidelines**: [./product-guidelines.md](./product-guidelines.md)
- **Tech Stack**: [./tech-stack.md](./tech-stack.md)
- **Workflow**: [./workflow.md](./workflow.md)

## Tracks

- **Tracks Registry**: [./tracks.md](./tracks.md)
- **Tracks Directory**: [./tracks/](./tracks/)

## Style Guides

- **Code Styleguides Directory**: [./code_styleguides/](./code_styleguides/)

## Learning & Continuity

- **Lessons Learned**: [./lessons-learned.md](./lessons-learned.md)
- **Tech Debt Registry**: [./tech-debt.md](./tech-debt.md)
`

export const TRACKS = `# Project Tracks

This file tracks all major tracks for the Measure project.

---

- [x] **Track: Add lessons-learned memory and tech debt tracking to Measure workflow**
  *Link: [./archive/lessons_learned_20260307/](./archive/lessons_learned_20260307/)*

- [x] [Visual Refresh: Define Unique Identity](archive/visual_refresh_20260425/index.md)

---

- [x] **Track: Add scrum-style user stories, sprint metadata, and velocity tracking to Measure tracks**
  *Link: [./archive/scrum_tracks_20260525/](./archive/scrum_tracks_20260525/)*

---

- [x] **Track: Integrate build-graph into Measure new-track, implement, review, and setup workflows**
  *Link: [./archive/graph_integration_20260525/](./archive/graph_integration_20260525/)*

---

- [x] **Track: Track sets: create a related set of tracks in one pass (issue #4)**
  *Link: [./archive/track_sets_20261009/](./archive/track_sets_20261009/)*
  *One questioning phase, one overview page, two review gates, and a dependency record for a related set of tracks. Three fresh-agent reviews.*

---

## Cancelled Tracks

Cancelled on 2026-10-05. Each \`metadata.json\` has the reason in \`cancel_reason\`. These lines have no status marker, so Measure tools do not read them as tracks.

- Daily Automation Dashboard — the daily reports stopped, and a dashboard already exists.
  *Link: [./archive/daily_automation_dashboard_20260527/](./archive/daily_automation_dashboard_20260527/)*
- Track Dependency Graph — no current need, and the CLI breaks the no-build-tools rule.
  *Link: [./archive/track_dependency_graph_20260527/](./archive/track_dependency_graph_20260527/)*
- Multi-Project Portfolio View — Fleet Commander owns the multi-project view.
  *Link: [./archive/multi_project_portfolio_view_20260527/](./archive/multi_project_portfolio_view_20260527/)*
- Agent Performance Benchmarking — Fleet Commander owns model routing. \`rubric.json\` stays for a later audit.
  *Link: [./archive/agent_performance_benchmarking_20260527/](./archive/agent_performance_benchmarking_20260527/)*

---

- [x] **Track: measure-guard: Claude Code mod that guards the Measure workflow**
  *Link: [./archive/measure_guard_20261004/](./archive/measure_guard_20261004/)*
  *Mod that shows the plan state and guards edits, commits, and closeouts.*

---

- [x] **Track: Skill distribution repair: install skills from main by cron, and remove automation-supervisor.py**
  *Link: [./archive/skill_distribution_repair_20261005/](./archive/skill_distribution_repair_20261005/)*
  *Copies of the skills and agent roles from \`main\` by cron, with local edit protection. Deletes the superseded supervisor in all projects.*
`

// Trimmed plan from measure/archive/measure_guard_20261004/plan.md. The full
// plan is 16 KB; this slice covers Phase S1 (the [x] phase with a checkpoint
// and SHAs) plus the first three tasks of Phase S2 (where the [~] task lives).
export const GUARD_PLAN = `# Implementation Plan: measure-guard Mod

> Source: \`spec.md\` (story-shaped). Design brief: \`mods/measure-guard/DESIGN.md\`.
> Red evidence: each Test task runs \`claude plugin test mods/measure-guard\`, and the git note of the commit records the failure output.
> Plugin names: Task 1.2 confirms the event and API names in the \`plugin-authoring\` skill. If a name is different, use the skill's name and record the difference in the git note.

## Phase S1: Plan context for the agent [checkpoint: ea3ed16]
_Story ref: spec.md#story-s1_

- [x] Task 1.1: Declare the mod in the tech stack (before any test) \`b3f3056\`
    - [x] Add a Tooling Exceptions row to \`measure/tech-stack.md\` for \`measure_guard_20261004\`: TypeScript mod, \`claude plugin test\` (\`*.test.ts\`), \`claude plugin validate\`
- [x] Task 1.2: Scaffold the mod \`539e99d\`
    - [x] Load the \`plugin-authoring\` skill. Confirm \`session.start\`, \`prompt.compose\`, \`tool.call\`, the tool-result event, \`AbovePrompt\`, \`classic.Stop\`, \`$.state\`, \`$.store\`, toast, pane, and command registration
- [x] Task 1.3: Contract — parser and state types \`1d265a8\`
    - [x] Lock the S1 acceptance criteria in the task note
- [x] Task 1.4: Test (Red) — parser, rule section, and task note \`7f6cdec\`
    - [x] Update the contract for the design change (2026-10-04, prompt cache): a fixed \`ruleSection\`, \`noteKey\` and \`taskNote\` in place of \`contextSection\`, and the \`$.state\` field \`notedKey\`
- [~] Task 1.5: Implement (Green) — parser, session start, rule section, task note \`4f02889\`
    - [x] Implement the functions in \`hooks/parse.ts\`
- [x] Task 1.6: Validate & Docs \`80bd0a2\`
    - [x] Run \`claude plugin validate\` and the full test suite

## Phase S2: Progress band above the prompt [checkpoint: 7dd90c1]
_Story ref: spec.md#story-s2_

- [x] Task 2.1: Contract — band model \`1b61020\`
    - [x] Lock the S2 acceptance criteria
- [b] Task 2.2: Test (Red) — band \`878739b\`
    - [ ] Write tests for mid-plan text
- [b] Task 2.3: Implement (Green) — band \`76c78a7\`
    - [ ] Render \`bandText\` in \`AbovePrompt\`
- [x] Task 2.4: Validate & Docs \`3b5232d\`
    - [x] Run validate and the full test suite

## Phase S3: Edit guard [checkpoint: b4fddf2]

- [ ] Task 3.1: Contract — edit decision \`d2eabf9\`
- [ ] Task 3.2: Test (Red) — edit guard \`9574e90\`
- [ ] Task 3.3: Implement (Green) — edit guard \`efeace3\`
- [ ] Task 3.4: Validate & Docs \`b47f8b5\`
`

// Index file of an archived track folder: links to spec, plan, metadata.
export const GUARD_INDEX = `# Track measure_guard_20261004 Context

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Metadata](./metadata.json)
`