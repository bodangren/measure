# Implementation Plan: Conductor Workflow Memory & Learning Improvements

Track: `lessons_learned_20260307`
Spec: [./spec.md](./spec.md)

---

## Phase 1: New Template Files

Create the two new artifact templates that will be copied into user projects at setup time.

- [ ] Task 1.1: Create `lessons-learned.md` template
    - [ ] Define acceptance criteria: file has four sections (Architecture & Design, Recurring Gotchas, Patterns That Worked Well, Planning Improvements), each with a comment placeholder and an example entry
    - [ ] Write `claude-skills/conductor/assets/lessons-learned.md`
    - [ ] Verify file matches acceptance criteria

- [ ] Task 1.2: Create `tech-debt.md` template
    - [ ] Define acceptance criteria: file has a table with columns (Date, Track, Item, Severity, Notes) and one example row marked as resolved
    - [ ] Write `claude-skills/conductor/assets/tech-debt.md`
    - [ ] Verify file matches acceptance criteria

- [ ] Task 1.3: Conductor - User Manual Verification 'Phase 1: New Template Files' (Protocol in workflow.md)

---

## Phase 2: Setup Workflow Integration

Update `references/setup.md` to create both new files and register them in `index.md`.

- [ ] Task 2.1: Add stub creation steps to setup.md (FR-3)
    - [ ] Define acceptance criteria: after step 2.5 in setup.md, there is a new step that copies `assets/lessons-learned.md` to `conductor/lessons-learned.md` and `assets/tech-debt.md` to `conductor/tech-debt.md`
    - [ ] Edit `claude-skills/conductor/references/setup.md` — add the new step after §2.5
    - [ ] Verify the step is correctly placed and references the correct asset paths

- [ ] Task 2.2: Add index.md entries for new files (FR-3)
    - [ ] Define acceptance criteria: setup.md's index creation steps include entries for `**Lessons Learned**` and `**Tech Debt Registry**`
    - [ ] Edit `claude-skills/conductor/references/setup.md` — add index entries in the index update instructions
    - [ ] Verify entries use correct link format

- [ ] Task 2.3: Update metadata.json template in setup.md (FR-8)
    - [ ] Define acceptance criteria: the metadata.json template in setup.md §3.3 includes `estimated_tasks`, `actual_tasks`, and `deviation_notes` fields
    - [ ] Edit `claude-skills/conductor/references/setup.md` — update the metadata.json template
    - [ ] Verify the JSON is valid and fields are present

- [ ] Task 2.4: Conductor - User Manual Verification 'Phase 2: Setup Workflow Integration' (Protocol in workflow.md)

---

## Phase 3: New Track Workflow Integration

Update `references/new-track.md` to load lessons-learned before planning and surface tech debt during spec gathering.

- [ ] Task 3.1: Load lessons-learned.md before plan generation (FR-4, item 1)
    - [ ] Define acceptance criteria: in new-track.md §2.3 step 2 (Read section), there is an instruction to resolve and read `**Lessons Learned**` (if it exists) and use its contents to inform plan complexity and ordering
    - [ ] Edit `claude-skills/conductor/references/new-track.md` §2.3
    - [ ] Verify the instruction is placed before the "Generate Implementation Plan" step and handles file-not-found gracefully

- [ ] Task 3.2: Surface tech debt during spec questions (FR-4, item 2)
    - [ ] Define acceptance criteria: in new-track.md §2.2, after the spec questions are complete, there is a step that checks `**Tech Debt Registry**` for relevant items and presents them to the user
    - [ ] Edit `claude-skills/conductor/references/new-track.md` §2.2
    - [ ] Verify the step handles file-not-found gracefully and only surfaces relevant items

- [ ] Task 3.3: Update metadata.json template in new-track.md (FR-8)
    - [ ] Define acceptance criteria: the metadata.json template in new-track.md §2.4 includes `estimated_tasks`, `actual_tasks`, and `deviation_notes` fields
    - [ ] Edit `claude-skills/conductor/references/new-track.md` §2.4
    - [ ] Verify JSON is valid and fields are present

- [ ] Task 3.4: Conductor - User Manual Verification 'Phase 3: New Track Workflow Integration' (Protocol in workflow.md)

---

## Phase 4: Implement Workflow Integration

Update `references/implement.md` and the workflow template to capture retrospectives and tech debt during implementation.

- [ ] Task 4.1: Add retrospective step to implement.md §3.4 (FR-5, item 1)
    - [ ] Define acceptance criteria: implement.md §3.4 (Finalize Track) has a new step before the track status update that asks three retrospective questions and, if any answers are yes, appends entries to `lessons-learned.md` or `tech-debt.md`
    - [ ] Edit `claude-skills/conductor/references/implement.md` §3.4
    - [ ] Verify the step handles absent lessons-learned.md/tech-debt.md gracefully

- [ ] Task 4.2: Add tech debt prompt to workflow template (FR-5, item 2)
    - [ ] Define acceptance criteria: `assets/workflow.md` Standard Task Workflow has a note that when a known shortcut is taken, the agent prompts the user to add a row to `tech-debt.md`
    - [ ] Edit `claude-skills/conductor/assets/workflow.md` and `templates/workflow.md`
    - [ ] Verify both copies are identical after edit

- [ ] Task 4.3: Conductor - User Manual Verification 'Phase 4: Implement Workflow Integration' (Protocol in workflow.md)

---

## Phase 5: Review Workflow Integration

Update `references/review.md` to offer logging critical/high findings to lessons-learned.md.

- [ ] Task 5.1: Add lessons-learned logging offer to review.md §3.1 (FR-6)
    - [ ] Define acceptance criteria: review.md §3.1 (Review Decision), after the Apply Fixes option, has a new prompt offering to log the root cause of Critical or High findings to `lessons-learned.md` under "Recurring Gotchas"
    - [ ] Edit `claude-skills/conductor/references/review.md` §3.1
    - [ ] Verify the prompt only triggers for Critical/High severity findings and handles absent lessons-learned.md gracefully

- [ ] Task 5.2: Conductor - User Manual Verification 'Phase 5: Review Workflow Integration' (Protocol in workflow.md)

---

## Phase 6: Status Workflow Integration

Update `references/status.md` to show project health indicators.

- [ ] Task 6.1: Read status.md to understand current output format
    - [ ] Read `claude-skills/conductor/references/status.md`
    - [ ] Identify the correct insertion point for the new "Project Health" section

- [ ] Task 6.2: Add Project Health section to status.md (FR-7)
    - [ ] Define acceptance criteria: status.md output includes a "Project Health" section showing (a) last update date of `lessons-learned.md` via `git log -1 --format="%ar"` and (b) count of open rows in `tech-debt.md`
    - [ ] Edit `claude-skills/conductor/references/status.md`
    - [ ] Verify both values handle absent files gracefully (show "not created yet" rather than erroring)

- [ ] Task 6.3: Conductor - User Manual Verification 'Phase 6: Status Workflow Integration' (Protocol in workflow.md)
