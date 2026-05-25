# Implementation Plan — Graph-Aware Measure Workflows

## Phase S1: Graph-aware new-track workflow
_Story ref: spec.md#story-s1_

- [x] Task: Define acceptance criteria for §2.2 graph-informed questioning aa591f4
    - [x] Document the one-line skip-note format (reusable across all 5 stories)
    - [x] Document the freshness check (`graph.db` mtime <24h)
- [x] Task: Edit `references/new-track.md` §2.2 to add Graph Context Probe before questioning f14f5d8
    - [x] Add freshness check + `build-graph search`/`stats` for the feature area
    - [x] Add "Brownfield + TS + graph available" branch in questioning guidance
- [x] Task: Edit `references/new-track.md` §2.3 to inject blast-radius notes per story-phase 2b1fdea
    - [x] When a phase touches an exported symbol, run `build-graph callers` and append callers list under the phase heading
- [x] Task: Measure - User Manual Verification 'Phase S1: Graph-aware new-track workflow' (Protocol in workflow.md) — DEFERRED to end of track per user instruction

## Phase S2: Graph-aware implement context loading
_Story ref: spec.md#story-s2_

- [ ] Task: Define acceptance criteria for §3.2 Load Graph Context
- [ ] Task: Edit `references/implement.md` §3.2 to add step 6 "Load Graph Context"
    - [ ] Freshness check + skip-note path
    - [ ] `build-graph stats` once + `build-graph inspect <Symbol>` per exported symbol in spec/plan
    - [ ] Summarize findings (file paths, callers count) into the implementer's working context
- [ ] Task: Measure - User Manual Verification 'Phase S2: Graph-aware implement context loading' (Protocol in workflow.md)

## Phase S3: Graph-aware per-task implementation
_Story ref: spec.md#story-s3_

- [ ] Task: Define acceptance criteria for pre-edit inspect + post-edit update
- [ ] Task: Edit `references/implement.md` §3.3 to add per-task graph protocol
    - [ ] Pre-edit: `build-graph inspect <Symbol>` for exported targets; record caller count in commit message or git note
    - [ ] Post-edit decision tree: when to `build-graph update` vs skip (mirrors AGENTS.md rule 5)
- [ ] Task: Cross-reference `workflow.md` Task Workflow section (if it has per-task hooks, add graph protocol there too — additive)
- [ ] Task: Measure - User Manual Verification 'Phase S3: Graph-aware per-task implementation' (Protocol in workflow.md)

## Phase S4: Graph-aware review
_Story ref: spec.md#story-s4_

- [ ] Task: Define acceptance criteria for §2.2 + §2.3 graph queries
- [ ] Task: Edit `references/review.md` §1.0 to add a third non-blocking availability check for build-graph (mirrors browser-harness-js check)
- [ ] Task: Edit `references/review.md` §2.2 to add "Load Graph Callers" step for changed exported symbols
- [ ] Task: Edit `references/review.md` §2.3 to add caller-compatibility check as a new bullet
- [ ] Task: Edit `references/review.md` §2.5 Verification Checks block to add `Graph Caller Check: [Pass/Fail/Skipped]`
- [ ] Task: Measure - User Manual Verification 'Phase S4: Graph-aware review' (Protocol in workflow.md)

## Phase S5: Setup scaffolding + SKILL.md sync
_Story ref: spec.md#story-s5_

- [ ] Task: Define acceptance criteria for setup.md §2.9 build-graph offer
- [ ] Task: Edit `references/setup.md` §2.9 to add build-graph install + scan offer (TS-detected only)
    - [ ] Append AGENTS.md rules to project's AGENTS.md (or create one)
    - [ ] Add `graph.db` link to `measure/index.md` under "Architecture & Facts"
- [ ] Task: Edit `SKILL.md` to add "Graph-Aware Mode (optional)" subsection (≤15 lines)
    - [ ] Update directory tree to mention optional `graph.db`
    - [ ] Update command descriptions for new-track, implement, review to mention graph integration
- [ ] Task: Measure - User Manual Verification 'Phase S5: Setup scaffolding + SKILL.md sync' (Protocol in workflow.md)

## Phase S6: Dogfood + retrospective
_Story ref: spec.md#story-s5 (AC3)_

- [ ] Task: Dry-run against `lessons_learned_20260307` and `visual_refresh_20260425` to confirm no regressions
- [ ] Task: Update this track's `sprint.stories[]` to all `done`, populate `demo_notes` and `retro_ref`
- [ ] Task: Append retrospective entries to `measure/lessons-learned.md`
- [ ] Task: Sync updated `claude-skills/measure/` to `~/.claude/skills/measure/` and `~/.agents/skills/measure/`
- [ ] Task: Measure - User Manual Verification 'Phase S6: Dogfood + retrospective' (Protocol in workflow.md)
