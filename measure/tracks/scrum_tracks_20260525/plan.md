# Implementation Plan: Scrum-Style Tracks (User Stories, Sprint Metadata, Velocity)

Track: `scrum_tracks_20260525`
Spec: [./spec.md](./spec.md)

---

## Phase S1: Story-shaped specification template [checkpoint: df64fa9]
_Story ref: spec.md#story-s1_

Add an opt-in "Story-shaped spec" mode to `new-track.md` §2.2 that produces a `## Stories` section with Connextra + Gherkin AC + Estimate + Priority. Classic mode unchanged.

- [x] Task 1.1: Define acceptance criteria for the story-shaped spec template `9450dcf`
    - [x] Write out exact section headings, field labels, and ordering for `### Story S<n>:` blocks
    - [x] Define the mode-choice prompt wording for §2.2 (label, options, recommendation)
    - [x] Define the backward-compat fallback rule (silent skip when `## Stories` absent)

- [x] Task 1.2: Edit `claude-skills/measure/references/new-track.md` §2.2 — add mode selection `34ce469`
    - [x] Insert a mode-choice step before existing questioning phase (Story-shaped vs Classic)
    - [x] For Story-shaped: replace FR-style questions with story enumeration prompts (story title, Connextra triplet, Gherkin AC, Estimate S/M/L/XL, Priority Must/Should/Could)
    - [x] For Classic: route to existing FR-list flow unchanged
    - [x] Verify the section is additive and does not remove any existing step

- [x] Task 1.3: Edit `claude-skills/measure/references/new-track.md` §2.2 step 4 — update spec template `34ce469`
    - [x] Add optional `## Stories` section to the spec template structure list
    - [x] Document the `### Story S<n>:` block schema in the reference
    - [x] Verify existing "Functional Requirements" remains the structure for Classic mode

- [x] Task 1.4: Manual verification — round-trip a story-shaped spec `dbd43fe`
    - [x] Hand-write a sample story-shaped spec following the new template
    - [x] Verify it is readable, complete, and unambiguous
    - [x] Verify the template instructions in new-track.md would reproduce it

- [x] Task 1.5: Measure - User Manual Verification 'Phase S1: Story-shaped specification template' (Protocol in workflow.md) `df64fa9`

---

## Phase S2: Optional sprint metadata on feature tracks [checkpoint: b840a75]
_Story ref: spec.md#story-s2_

Extend `metadata.json` with an optional `sprint` object. Update setup.md and new-track.md schemas. Ensure all readers tolerate absence.

- [x] Task 2.1: Define acceptance criteria for the `sprint` metadata schema `6c82eb1`
    - [x] Write the exact JSON shape: `{goal, stories[], demo_notes, retro_ref}`
    - [x] Define `stories[]` element shape: `{id, title, size, priority, status}` with allowed values
    - [x] Document the rule: `sprint` key present only on story-shaped feature tracks; absent on bug/chore/classic-feature tracks

- [x] Task 2.2: Update `metadata.json` template in `claude-skills/measure/references/new-track.md` §2.5 `13000ea`
    - [x] Add the `sprint` object as an optional field with inline comment "// omit for bug/chore tracks; optional for features"
    - [x] Add a populate step after spec confirmation: when story-shaped spec was chosen, write `sprint.goal` (from spec overview) and `sprint.stories[]` (from spec's `### Story S<n>:` blocks)
    - [x] Verify the JSON is valid and the instructions describe when to populate vs omit

- [x] Task 2.3: Update `metadata.json` template in `claude-skills/measure/references/setup.md` §3.3 `13000ea`
    - [x] Add the same optional `sprint` field with the same inline comment
    - [x] Verify both setup.md and new-track.md show identical schemas

- [x] Task 2.4: Update implement.md §3.4 — sync `sprint.stories` on track finalize `7904d3f`
    - [x] Add a sub-step: if `metadata.json` has a `sprint` key, re-read `spec.md` `## Stories`, and update `sprint.stories[].status` to reflect completion (`done` / `partial` / `dropped`) based on plan task completion
    - [x] Document the rule: if a story was added/removed/re-estimated during implementation, reflect that in `sprint.stories[]` before commit
    - [x] Verify the step gracefully skips when `sprint` key is absent

- [x] Task 2.5: Verify backward compatibility of metadata reads `67bbeab`
    - [x] Read existing tracks' `metadata.json` (lessons_learned_20260307, visual_refresh_20260425) and confirm new schema treats them as valid (no `sprint` key = OK)
    - [x] Document the read-side rule in implement.md, review.md, and status.md as needed: "treat `sprint` as optional"

- [x] Task 2.6: Measure - User Manual Verification 'Phase S2: Optional sprint metadata' (Protocol in workflow.md) `b840a75`

---

## Phase S3: Velocity & estimation accuracy in status report [checkpoint: ae676d5]
_Story ref: spec.md#story-s3_

Add velocity and estimation-accuracy lines to `status.md` Project Health, computed from the last 3 completed feature tracks.

- [x] Task 3.1: Define acceptance criteria for the velocity calculation `e9d47af`
    - [x] Specify the filter: completed tracks (`[x]`) of type `feature` with both `estimated_tasks` and `actual_tasks` populated
    - [x] Specify ordering: most-recent first by `metadata.json.created_at` (or `updated_at` if present)
    - [x] Specify the qualifier thresholds: `under-estimating` if ratio > 1.15, `over-estimating` if ratio < 0.85, `calibrated` otherwise
    - [x] Specify fallback strings for <3 tracks and 0 tracks

- [x] Task 3.2: Edit `claude-skills/measure/references/status.md` §4.0 — extend the Project Health section `2a5a3c2`
    - [x] Add a "Velocity (last 3 feature tracks)" line under Project Health
    - [x] Add an "Estimation accuracy" line with ratio and qualifier
    - [x] Document the fallback string for `<3` and `0` qualifying tracks
    - [x] Verify the new lines are appended (not replacing) and the existing Lessons Learned / Tech Debt lines remain

- [x] Task 3.3: Edit `claude-skills/measure/references/status.md` §2.0 — add the read step `2a5a3c2`
    - [x] Add a step: "For each track in **Tracks Registry**, also read `metadata.json` and extract `type`, `status`, `estimated_tasks`, `actual_tasks`, `created_at`"
    - [x] Document the rule: skip silently if `metadata.json` is missing or malformed (do not HALT)
    - [x] Verify the read step is additive to existing track-data reads

- [x] Task 3.4: Manual verification — dry-run velocity on existing data `f26369d`
    - [x] Use existing `lessons_learned_20260307` metadata (`estimated_tasks: 29`, `actual_tasks: 22`)
    - [x] Confirm a single-track report would show: `Velocity: 22 tasks (based on 1 track — directional only)` and `Estimation accuracy: actual/estimated = 0.76 (over-estimating)`
    - [x] Verify the visual_refresh track (no `estimated_tasks`) is excluded correctly

- [x] Task 3.5: Measure - User Manual Verification 'Phase S3: Velocity & estimation accuracy' (Protocol in workflow.md) `ae676d5`

---

## Phase S4: Story-aware plan generation
_Story ref: spec.md#story-s4_

When the spec uses story-shaped mode, generate one Phase per story (`## Phase S<n>: <story title>`) preserving Contract-First → Test → Implement → Doctor sub-tasks. Classic mode unchanged.

- [x] Task 4.1: Define acceptance criteria for story-aware plan layout
    - [x] Specify the heading format: `## Phase S<n>: <story title>` with a `_Story ref: spec.md#story-s<n>_` line below
    - [x] Confirm that inside each story-phase, Contract-First → Test → Implement → Doctor sub-task structure remains
    - [x] Confirm Classic mode produces unchanged plan output

- [x] Task 4.2: Edit `claude-skills/measure/references/new-track.md` §2.3 — branch plan generation
    - [x] Add: "If the spec contains a `## Stories` section, generate one Phase per story using `## Phase S<n>: <story title>` headings; otherwise use the existing phase structure"
    - [x] Preserve the Contract-First pipeline instruction for both branches
    - [x] Verify the Phase Completion Verification task is appended to every story-phase as before

- [x] Task 4.3: Verify `status.md` phase parser tolerates both heading formats
    - [x] Re-read status.md §3.0 phase identification rule
    - [x] Confirm "top-level markdown headings" covers both `## Phase 1:` and `## Phase S1:`
    - [x] If clarification is needed, add a one-line note that both formats are valid; otherwise leave unchanged

- [ ] Task 4.4: Measure - User Manual Verification 'Phase S4: Story-aware plan generation' (Protocol in workflow.md)

---

## Phase S5: Documentation and skill sync
_Story ref: spec.md#story-s5_

Update SKILL.md to introduce optional Sprint Mode and update product.md success metrics if appropriate. Skip `templates/` parity (directory does not exist in this repo).

- [ ] Task 5.1: Edit `claude-skills/measure/SKILL.md` — add Sprint Mode section
    - [ ] Add a "Sprint Mode (optional)" subsection under Core Concepts (≤15 lines) describing Stories, sprint metadata, and velocity
    - [ ] Update the directory structure block to mention that `metadata.json` may contain an optional `sprint` object
    - [ ] Update the "New Track" command description to mention the mode choice
    - [ ] Update the "Status" command description to mention velocity reporting
    - [ ] Verify the additions are concise and link to references

- [ ] Task 5.2: Verify documentation cross-references
    - [ ] Confirm references to `spec.md` Stories section in new-track.md, implement.md
    - [ ] Confirm references to `sprint` metadata in implement.md, status.md, setup.md, new-track.md
    - [ ] Fix any broken or missing cross-references

- [ ] Task 5.3: Note for tech debt — `templates/` parity deferred
    - [ ] Append to `tech-debt.md` (creating it if absent under §1.x of the spec's setup): "templates/ directory does not exist in this repo; if it is reintroduced, copies of `workflow.md`, `lessons-learned.md`, `tech-debt.md` must be re-synced. Severity: Low. Status: Open."
    - [ ] Verify the entry follows the existing tech-debt.md row schema

- [ ] Task 5.4: Measure - User Manual Verification 'Phase S5: Documentation and skill sync' (Protocol in workflow.md)

---

## Phase S6: Self-dogfood retrospective
_Story ref: (cross-cutting — not tied to a single spec story)_

Use this track itself as the first scrum-shaped track. Verify the full loop end-to-end and capture lessons.

- [ ] Task 6.1: Populate this track's own `metadata.json` with the `sprint` object
    - [ ] Set `sprint.goal` from spec Overview
    - [ ] Set `sprint.stories[]` from spec §Stories (S1–S5)
    - [ ] Mark each story `status` according to plan completion at finalize time

- [ ] Task 6.2: Run `status` and confirm velocity shows this track once complete
    - [ ] Confirm Velocity line includes this track's actual_tasks
    - [ ] Confirm Estimation accuracy qualifier renders correctly

- [ ] Task 6.3: Append retrospective entries to `lessons-learned.md`
    - [ ] Create `measure/lessons-learned.md` from `claude-skills/measure/assets/lessons-learned.md` if absent
    - [ ] Add at least one entry per section that surfaced naturally (Architecture, Gotchas, Patterns, Planning)
    - [ ] Verify the file stays within the 50-line budget

- [ ] Task 6.4: Measure - User Manual Verification 'Phase S6: Self-dogfood retrospective' (Protocol in workflow.md)
