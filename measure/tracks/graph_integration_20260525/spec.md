# Graph-Aware Measure Workflows — Specification

## Overview

**Sprint Goal:** Make build-graph a first-class context source in Measure's new-track, implement, and review workflows so structural questions go to the graph before grep, and graph freshness is preserved across edits.

build-graph (in `repo-graph/`) is a CLI tool that builds a SQLite knowledge graph of a TypeScript codebase and answers structural questions (callers, dependencies, paths, exports) faster and more accurately than grep. Today, Measure's spec gathering, planning, implementation, and review steps treat structural understanding as a grep-and-read-files exercise. This track integrates `build-graph` as an optional-but-recommended context source across new-track, implement, review, and setup — with graceful skip when build-graph is unavailable.

Coupling: **Optional with graceful skip** (mirrors `browser-harness-js` in review.md §2.4). No project breaks if `build-graph` isn't installed or `graph.db` is missing/stale.

## Stories

### Story S1: Graph-aware new-track workflow
**As a** Measure user planning a new track on a TypeScript codebase
**I want** spec questions and plan generation to be informed by build-graph queries
**So that** I capture cross-file blast radius before writing the spec

**Acceptance Criteria:**
- Given build-graph is on PATH and `graph.db` exists and is <24h old, When I run new-track on a brownfield project, Then §2.2 questioning batches include at least one question informed by `build-graph search`/`stats` results for the feature area.
- Given the same, When §2.3 generates the plan, Then every story-phase that touches an exported symbol lists the callers (from `build-graph callers`) as an explicit blast-radius note.
- Given build-graph is missing OR graph.db is stale, When new-track runs, Then it logs a one-line skip note and continues without HALT.

**Estimate:** M
**Priority:** Must

### Story S2: Graph-aware implement context loading
**As an** implementer starting a track
**I want** §3.2 to load graph context for the track's affected modules
**So that** I have a structural map before touching code

**Acceptance Criteria:**
- Given graph.db exists and is <24h old, When implement begins §3.2, Then it runs `build-graph stats` once and `build-graph inspect` for each exported symbol named in the spec/plan, summarizing findings into the implementer's working context.
- Given graph.db is missing or stale, When §3.2 runs, Then it logs a one-line skip note and continues.

**Estimate:** S
**Priority:** Must

### Story S3: Graph-aware per-task implementation
**As an** implementer working through tasks
**I want** to query the graph before editing exported symbols and update it after structural edits
**So that** the graph stays fresh and blast radius is checked before every breaking change

**Acceptance Criteria:**
- Given an in-progress task that modifies an exported function/class/interface/schema, When I begin the task, Then I run `build-graph inspect <Symbol>` and record the caller count in the task's commit message or git note.
- Given a task that changes signatures, imports/exports, schemas, or JSX hierarchy, When the task finishes, Then `build-graph update graph.db <changed-files>` is run before the next task starts.
- Given a task that only changes internal function bodies, When the task finishes, Then graph update is skipped (per AGENTS.md "When NOT to update").

**Estimate:** M
**Priority:** Must

### Story S4: Graph-aware review
**As a** reviewer
**I want** review.md to consult the graph when analyzing diffs
**So that** I catch cross-file breakage that diff-only review misses

**Acceptance Criteria:**
- Given a diff that touches exported symbols, When §2.2 retrieves context, Then it runs `build-graph callers` for each exported symbol in the diff and lists all callers in the review context.
- Given §2.3 analyzes changes, When an exported signature changed, Then the review verifies each caller listed in AC1 is still compatible (or flags as a finding).
- Given graph.db is missing or stale, When review runs, Then it logs a one-line skip note in the Verification Checks block and continues.

**Estimate:** M
**Priority:** Must

### Story S5: Setup scaffolding + SKILL.md sync + dogfood
**As a** Measure adopter on a TypeScript project
**I want** setup.md to detect TS and offer to scaffold build-graph
**So that** the graph exists from day one

**Acceptance Criteria:**
- Given the inferred Tech Stack includes TypeScript, When setup §2.9 runs, Then it offers (multi-select) to install build-graph and create initial graph.db.
- Given the user approves, When scaffolding completes, Then `graph.db` exists, `measure/index.md` links it under "Architecture & Facts", and AGENTS.md is updated with the build-graph rules.
- Given any path through this track, When complete, Then SKILL.md mentions Graph-Aware Mode in a new subsection (similar to Sprint Mode) and this track's `sprint.stories[]` are all `done` with a retro entry in lessons-learned.md.

**Estimate:** S
**Priority:** Should

## Non-Functional Requirements

- **Backward compatibility:** All graph-aware steps degrade silently when `build-graph` is missing or `graph.db` is stale (>24h or missing). No HALT, no warning louder than a one-line skip note.
- **TypeScript-scoped:** Graph features are only invoked when the project's Tech Stack includes TypeScript. Non-TS projects skip silently.
- **Performance:** Graph queries used inline (during questioning, review) should complete in <2s per call; if slower, log a one-line warning and continue.

## Acceptance Criteria (track-level)

- All 5 stories' AC pass.
- Existing Measure projects without `build-graph` continue to work unchanged (verified by dry-run against `lessons_learned_20260307` and `visual_refresh_20260425`).
- SKILL.md ≤ +15 lines (Graph-Aware Mode subsection); reference files updated additively only.

## Out of Scope

- Modifying `status.md` or `revert.md` (graph doesn't add value there).
- Modifying `doctor.md` (separate track if needed).
- Auto-installing build-graph globally — setup.md offers, doesn't force.
- Non-TypeScript graph builders.
