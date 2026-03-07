# Implementation Plan: Conductor Workflow Memory & Learning Improvements

Track: `lessons_learned_20260307`
Spec: [./spec.md](./spec.md)

---

## Phase 1: New Template Files

Create the two new artifact templates, keep `claude-skills/` and `templates/` copies in sync, and define the bounded-memory format.

- [x] Task 1.1: Create `lessons-learned.md` template `8cae46a`
    - [x] Define acceptance criteria: file has four sections (Architecture & Design, Recurring Gotchas, Patterns That Worked Well, Planning Improvements), each with a comment placeholder, an example entry, and guidance that the file is curated working memory capped at 50 lines
    - [x] Write `claude-skills/conductor/assets/lessons-learned.md`
    - [x] Write `templates/lessons-learned.md`
    - [x] Verify both copies match the acceptance criteria and remain identical

- [x] Task 1.2: Create `tech-debt.md` template `8cae46a`
    - [x] Define acceptance criteria: file has a table with columns (Date, Track, Item, Severity, Status, Notes), uses `Open`/`Resolved` status values, includes one example row marked as resolved, and states that the file is curated working memory capped at 50 lines
    - [x] Write `claude-skills/conductor/assets/tech-debt.md`
    - [x] Write `templates/tech-debt.md`
    - [x] Verify both copies match the acceptance criteria and remain identical

- [x] Task 1.3: Add context budget checker script `8cae46a`
    - [x] Define acceptance criteria: repository contains a small script that reports line counts for `conductor/lessons-learned.md` and `conductor/tech-debt.md`, marks each as `OK` or `OVER_LIMIT`, and exits successfully even when files do not yet exist
    - [x] Write `scripts/conductor/check_context_budget.sh`
    - [x] Verify the script uses a standard 50-line limit and can be referenced by workflow docs

- [ ] Task 1.4: Conductor - User Manual Verification 'Phase 1: New Template Files' (Protocol in workflow.md)

---

## Phase 2: Setup Workflow Integration

Update `references/setup.md` to create both new files and register them in `index.md`.

- [x] Task 2.1: Add stub creation steps to setup.md (FR-3) `52e2f79`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/setup.md` — add the new step after §2.5
    - [x] Verify the step is correctly placed and references the correct asset paths

- [x] Task 2.2: Add index.md entries for new files (FR-3) `52e2f79`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/setup.md` — add index entries in the index update instructions
    - [x] Verify entries use correct link format

- [x] Task 2.3: Update metadata.json template in setup.md (FR-8) `52e2f79`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/setup.md` — update the metadata.json template
    - [x] Verify the JSON is valid and fields are present

- [x] Task 2.4: Add setup guidance for memory artifacts and budget checker `52e2f79`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/setup.md`
    - [x] Verify the guidance is additive and clearly points to the checker script

- [ ] Task 2.5: Conductor - User Manual Verification 'Phase 2: Setup Workflow Integration' (Protocol in workflow.md) — deferred

---

## Phase 3: New Track Workflow Integration

Update `references/new-track.md` to load lessons-learned before planning and surface tech debt during spec gathering.

- [x] Task 3.1: Load lessons-learned.md before plan generation (FR-4, item 1) `b30cd9d`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/new-track.md` §2.3
    - [x] Verify the instruction is placed before the "Generate Implementation Plan" step and handles file-not-found gracefully

- [x] Task 3.2: Surface tech debt during spec questions (FR-4, item 2) `b30cd9d`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/new-track.md` §2.2
    - [x] Verify the step handles file-not-found gracefully and only surfaces relevant items

- [x] Task 3.3: Add context-budget checks before memory files are loaded `b30cd9d`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/new-track.md`
    - [x] Verify the instructions are placed before memory files are read

- [x] Task 3.4: Update metadata.json template in new-track.md (FR-9) `b30cd9d`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/new-track.md` §2.4
    - [x] Verify JSON is valid and fields are present

- [x] Task 3.5: Populate `estimated_tasks` during plan finalization `b30cd9d`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/new-track.md`
    - [x] Verify the counting rule is clearly described and occurs before artifact creation is finalized

- [ ] Task 3.6: Conductor - User Manual Verification 'Phase 3: New Track Workflow Integration' (Protocol in workflow.md) — deferred

---

## Phase 4: Implement Workflow Integration

Update `references/implement.md` and the workflow template to capture retrospectives and tech debt during implementation.

- [x] Task 4.1: Load project memory before execution begins `95633d5`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/implement.md`
    - [x] Verify the step is additive, runs before task execution, and handles missing files gracefully

- [x] Task 4.2: Add retrospective and metadata finalization steps to implement.md §3.4 `95633d5`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/implement.md` §3.4
    - [x] Verify the step handles absent lessons-learned.md/tech-debt.md gracefully and explains when `deviation_notes` must be filled

- [x] Task 4.3: Add tech debt prompt and context budget note to workflow templates `95633d5`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/assets/workflow.md` and `templates/workflow.md`
    - [x] Verify both copies are identical after edit

- [ ] Task 4.4: Conductor - User Manual Verification 'Phase 4: Implement Workflow Integration' (Protocol in workflow.md) — deferred

---

## Phase 5: Review Workflow Integration

Update `references/review.md` to offer logging critical/high findings to lessons-learned.md.

- [x] Task 5.1: Load recurring gotchas before analysis `b73bb15`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/review.md` §2.2
    - [x] Verify the step is additive and handles missing files gracefully

- [x] Task 5.2: Add lessons-learned logging offer to review.md §3.1 (FR-7) `b73bb15`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/review.md` §3.1
    - [x] Verify the prompt only triggers for Critical/High severity findings and handles absent lessons-learned.md gracefully

- [ ] Task 5.3: Conductor - User Manual Verification 'Phase 5: Review Workflow Integration' (Protocol in workflow.md) — deferred

---

## Phase 6: Status Workflow Integration

Update `references/status.md` to show project health indicators.

- [x] Task 6.1: Read status.md to understand current output format `7323d8f`
    - [x] Read `claude-skills/conductor/references/status.md`
    - [x] Identify the correct insertion point for the new "Project Health" section

- [x] Task 6.2: Add Project Health section to status.md (FR-7) `7323d8f`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/status.md`
    - [x] Verify all values handle absent files gracefully (show "not created yet" rather than erroring)

- [x] Task 6.3: Add context budget warnings to status.md `7323d8f`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/references/status.md`
    - [x] Verify the warning format is clear and non-fatal

- [ ] Task 6.4: Conductor - User Manual Verification 'Phase 6: Status Workflow Integration' (Protocol in workflow.md) — deferred

---

## Phase 7: Skill Documentation Synchronization

Update top-level conductor documentation so the new memory features are discoverable to agents.

- [x] Task 7.1: Update conductor skill overview and directory structure `84dfc3e`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/SKILL.md`
    - [x] Verify the changes are concise and consistent with the workflow references

- [x] Task 7.2: Update conductor skill assets section `84dfc3e`
    - [x] Define acceptance criteria
    - [x] Edit `claude-skills/conductor/SKILL.md`
    - [x] Verify the new references are accurate

- [ ] Task 7.3: Conductor - User Manual Verification 'Phase 7: Skill Documentation Synchronization' (Protocol in workflow.md) — deferred
