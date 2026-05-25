# Implementation Plan — Graph-Aware Measure Workflows

## Phase S1: Graph-aware new-track workflow [checkpoint: 8e8d3fc]
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

## Phase S2: Graph-aware implement context loading [checkpoint: 9f60d8e]
_Story ref: spec.md#story-s2_

- [x] Task: Define acceptance criteria for §3.2 Load Graph Context 4e7e803
- [x] Task: Edit `references/implement.md` §3.2 to add step 6 "Load Graph Context" 4e7e803
    - [x] Freshness check + skip-note path
    - [x] `build-graph stats` once + `build-graph inspect <Symbol>` per exported symbol in spec/plan
    - [x] Summarize findings (file paths, callers count) into the implementer's working context
- [x] Task: Measure - User Manual Verification 'Phase S2: Graph-aware implement context loading' (Protocol in workflow.md) — DEFERRED to end of track per user instruction

## Phase S3: Graph-aware per-task implementation [checkpoint: 5b8c324]
_Story ref: spec.md#story-s3_

- [x] Task: Define acceptance criteria for pre-edit inspect + post-edit update c35da50
- [x] Task: Edit `references/implement.md` §3.3 to add per-task graph protocol c35da50
    - [x] Pre-edit: `build-graph inspect <Symbol>` for exported targets; record caller count in commit message or git note
    - [x] Post-edit decision tree: when to `build-graph update` vs skip (mirrors AGENTS.md rule 5)
- [x] Task: Cross-reference `workflow.md` Task Workflow section (if it has per-task hooks, add graph protocol there too — additive) c35da50
- [x] Task: Measure - User Manual Verification 'Phase S3: Graph-aware per-task implementation' (Protocol in workflow.md) — DEFERRED to end of track per user instruction

## Phase S4: Graph-aware review [checkpoint: 6ae86b0]
_Story ref: spec.md#story-s4_

- [x] Task: Define acceptance criteria for §2.2 + §2.3 graph queries 1dfa446
- [x] Task: Edit `references/review.md` §1.0 to add a third non-blocking availability check for build-graph (mirrors browser-harness-js check) 1dfa446
- [x] Task: Edit `references/review.md` §2.2 to add "Load Graph Callers" step for changed exported symbols 1dfa446
- [x] Task: Edit `references/review.md` §2.3 to add caller-compatibility check as a new bullet 1dfa446
- [x] Task: Edit `references/review.md` §2.5 Verification Checks block to add `Graph Caller Check: [Pass/Fail/Skipped]` 1dfa446
- [x] Task: Measure - User Manual Verification 'Phase S4: Graph-aware review' (Protocol in workflow.md) — DEFERRED to end of track per user instruction

## Phase S5: Setup scaffolding + SKILL.md sync [checkpoint: 779a8ae]
_Story ref: spec.md#story-s5_

- [x] Task: Define acceptance criteria for setup.md §2.9 build-graph offer c5c66dd
- [x] Task: Edit `references/setup.md` §2.9 to add build-graph install + scan offer (TS-detected only) c5c66dd
    - [x] Append AGENTS.md rules to project's AGENTS.md (or create one)
    - [x] Add `graph.db` link to `measure/index.md` under "Architecture & Facts"
- [x] Task: Edit `SKILL.md` to add "Graph-Aware Mode (optional)" subsection (≤15 lines) c5c66dd
    - [x] Update directory tree to mention optional `graph.db`
    - [x] Update command descriptions for new-track, implement, review to mention graph integration
- [x] Task: Measure - User Manual Verification 'Phase S5: Setup scaffolding + SKILL.md sync' (Protocol in workflow.md) — DEFERRED to end of track per user instruction

## Phase S6: Dogfood + retrospective
_Story ref: spec.md#story-s5 (AC3)_

- [x] Task: Dry-run against `lessons_learned_20260307` and `visual_refresh_20260425` to confirm no regressions 7349583
- [x] Task: Update this track's `sprint.stories[]` to all `done`, populate `demo_notes` and `retro_ref` 38afc84
- [x] Task: Append retrospective entries to `measure/lessons-learned.md` 18bfeb7
- [x] Task: Sync updated `claude-skills/measure/` to `~/.claude/skills/measure/` and `~/.agents/skills/measure/`
- [x] Task: Measure - User Manual Verification 'Phase S6: Dogfood + retrospective' (Protocol in workflow.md) — DEFERRED to end of track per user instruction
