# Specification: Scrum-Style Tracks (User Stories, Sprint Metadata, Velocity)

## Overview

Add lightweight scrum-flavored structure to Measure tracks so that a "feature track" can optionally behave like a sprint: framed by a sprint goal, decomposed into user stories with Gherkin acceptance criteria, sized with T-shirt estimates, and reported with a rolling velocity. The change is **fully opt-in and additive** — every existing track, spec, plan, and `metadata.json` continues to work without modification.

This closes three gaps in the current workflow:
1. Specs treat requirements as a flat numbered list (FR-1, FR-2), losing the "who/why" framing that makes scope decisions easier.
2. There is no first-class concept of a sprint goal or per-story acceptance criteria, so the agent cannot demo/verify one story at a time.
3. `estimated_tasks` and `actual_tasks` are already captured but never surfaced as velocity, so estimation never improves over time.

## Stories

### Story S1: Story-shaped specification template
**As a** developer planning a feature track
**I want** to capture each requirement as a user story with embedded Gherkin acceptance criteria
**So that** scope discussions are grounded in user value and each story can be independently demoed

**Acceptance Criteria:**
- Given I run `new track` and choose the new "Story-shaped spec" mode, When the agent gathers requirements, Then it prompts me to enumerate user stories using the Connextra format (`As a … I want … So that …`).
- Given I enumerate a story, When the agent records it in `spec.md`, Then the story appears under a `## Stories` section with a `### Story S<n>: <title>` heading, the Connextra triplet, a Gherkin `Acceptance Criteria` list (`Given … When … Then …`), an `Estimate:` field (S/M/L/XL), and a `Priority:` field (Must/Should/Could).
- Given I choose the existing "Classic FR list" mode, When the agent gathers requirements, Then the resulting `spec.md` is identical in structure to today's template (no Stories section).
- Given an existing `spec.md` without a `## Stories` section, When any workflow loads it, Then no workflow errors or HALTs occur.

**Estimate:** M
**Priority:** Must

### Story S2: Optional sprint metadata on feature tracks
**As a** developer reviewing a completed track
**I want** sprint context (goal, stories, estimates, retro pointer) stored in `metadata.json`
**So that** velocity and retrospective data are machine-readable and survive track archival

**Acceptance Criteria:**
- Given a feature track created with story-shaped spec, When the agent writes `metadata.json`, Then it includes a `sprint` object with keys: `goal` (string), `stories` (array of `{id, title, size, priority, status}`), `demo_notes` (string|null), `retro_ref` (string|null).
- Given a track of type `bug` or `chore`, When the agent writes `metadata.json`, Then the `sprint` key is omitted (not present at all).
- Given an existing `metadata.json` without a `sprint` key, When `status.md`, `implement.md`, or `review.md` reads it, Then the workflows treat `sprint` as absent and continue without warnings.
- Given the spec's Stories section changes during implementation (story added, removed, or re-estimated), When the track is finalized, Then `sprint.stories` reflects the final state of the spec.

**Estimate:** S
**Priority:** Must

### Story S3: Velocity & estimation accuracy in status report
**As a** developer planning the next track
**I want** the status command to show a rolling velocity and estimation-accuracy ratio
**So that** my next estimate is calibrated by real history

**Acceptance Criteria:**
- Given at least one completed feature track exists with both `estimated_tasks` and `actual_tasks` populated, When I run `status`, Then the "Project Health" section shows a "Velocity (last 3 feature tracks)" line listing each track's actual task count and the average.
- Given the same data, When I run `status`, Then the report also shows an "Estimation accuracy" line as `actual / estimated = <ratio>` (averaged across the same 3 tracks) with a one-word qualifier (`under-estimating` if ratio > 1.15, `over-estimating` if ratio < 0.85, `calibrated` otherwise).
- Given fewer than 3 qualifying completed tracks exist, When I run `status`, Then the report shows the line with available data and the note `(based on <n> track(s) — directional only)`.
- Given no completed feature track has both fields populated, When I run `status`, Then the velocity section displays `not yet available — complete a feature track to start tracking velocity` and does not error.
- Given a completed track of type `bug` or `chore`, When velocity is computed, Then that track is excluded from the rolling window.

**Estimate:** S
**Priority:** Must

### Story S4: Story-aware plan generation
**As a** developer implementing a story-shaped track
**I want** each story in the spec to map to a single Phase in `plan.md`
**So that** phase checkpoints align with story-level demoable units

**Acceptance Criteria:**
- Given a spec with `## Stories` containing N stories, When the agent generates `plan.md`, Then `plan.md` contains N phases, one per story, with the heading `## Phase S<n>: <story title>` and a `_Story ref: spec.md#story-s<n>_` line under the heading.
- Given each story phase, When the agent generates tasks, Then it still enforces the Contract-First → Test → Implement → Doctor sub-structure inside the phase.
- Given a spec with no `## Stories` section (classic FR list), When the agent generates `plan.md`, Then phases follow the existing Contract-First/Test/Implement/Doctor structure unchanged.
- Given an existing `plan.md` from a legacy track, When `status.md` parses it, Then phase counting works regardless of whether headings start with `Phase 1:` or `Phase S1:`.

**Estimate:** S
**Priority:** Should

### Story S5: Documentation and template parity
**As a** new user reading the Measure skill
**I want** SKILL.md and reference docs to explain the optional scrum mode
**So that** I know it exists and when to use it

**Acceptance Criteria:**
- Given the updated skill, When I read `claude-skills/measure/SKILL.md`, Then a new "Sprint Mode (optional)" subsection under Core Concepts describes Stories, sprint metadata, and velocity in <15 lines.
- Given the updated skill, When I read `references/new-track.md`, Then §2.2 includes the mode choice ("Story-shaped spec" vs "Classic FR list") with a recommendation and a one-line backward-compatibility note.
- Given the updated `metadata.json` schema, When I read `references/setup.md` and `references/new-track.md`, Then both show the schema with the optional `sprint` object commented as "// omit for bug/chore tracks; optional for features".
- Given any change to a workflow asset, When I check `claude-skills/measure/assets/` vs the project-level `templates/` directory (if present), Then both copies remain identical.

**Estimate:** S
**Priority:** Should

## Non-Functional Requirements

- **Backward compatibility (hard constraint):** No existing track, spec, plan, or `metadata.json` may require migration. All readers must treat the new fields as optional.
- All workflow changes are **additive only** — no existing steps are removed or reordered.
- All new file content follows existing Markdown conventions (see `product-guidelines.md`).
- The `sprint` object in `metadata.json` must be valid JSON and round-trip cleanly through any tool that reads it.
- Velocity logic in `status.md` must complete in O(n) over completed tracks and must never HALT on a missing/malformed metadata file (skip and continue).
- Both `claude-skills/measure/` and `templates/` copies must be updated for any template change.

## Acceptance Criteria (track-level)

1. Running `new track` offers a "Story-shaped spec" vs "Classic FR list" mode choice; both produce valid specs and plans.
2. A story-shaped spec contains a `## Stories` section with at least one `### Story S<n>:` block including Connextra triplet, Gherkin AC, Estimate, and Priority.
3. A feature track created via story mode has a `sprint` object in `metadata.json` populated with goal, stories, priorities, and sizes.
4. A bug/chore track has no `sprint` key in `metadata.json`.
5. `status` displays a "Velocity (last 3 feature tracks)" line and an "Estimation accuracy" line under Project Health, with graceful fallback when fewer than 3 tracks exist.
6. A story-shaped plan uses `## Phase S<n>: <story title>` headings; a classic plan continues to use `## Phase <n>:`.
7. SKILL.md, `references/new-track.md`, and `references/setup.md` document the optional sprint mode and updated metadata schema.
8. All existing tracks in `measure/tracks/` continue to parse and report correctly under `status`, `implement`, and `review` without modification.
9. `claude-skills/measure/assets/` and `templates/` (if present) copies remain identical for any modified template.

## Out of Scope

- Migrating existing tracks (`lessons_learned_20260307`, `visual_refresh_20260425`) to the new format.
- Sprint planning ceremonies as a literal scrum implementation (no separate "sprint planning" command, no sprint duration enforcement, no daily standup artifacts).
- Velocity charts or graphical reporting (text only in `status.md`).
- Mapping T-shirt sizes to numeric story points (the field stores the T-shirt letter only).
- Integration with external project-management tools (Jira, Linear).
- Changes to the Contract-First → Test → Implement → Doctor pipeline inside phases.
- A separate "backlog vs sprint" split in `tracks.md` (deferred — would be Idea 4 from research).
- Story-level status markers on plan headings (deferred — would be Idea 6 from research).
