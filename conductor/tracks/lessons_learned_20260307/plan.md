# Implementation Plan: Conductor Workflow Memory & Learning Improvements

Track: `lessons_learned_20260307`
Spec: [./spec.md](./spec.md)

---

## Phase 1: New Template Files

Create the two new artifact templates, keep `claude-skills/` and `templates/` copies in sync, and define the bounded-memory format.

- [ ] Task 1.1: Create `lessons-learned.md` template
    - [ ] Define acceptance criteria: file has four sections (Architecture & Design, Recurring Gotchas, Patterns That Worked Well, Planning Improvements), each with a comment placeholder, an example entry, and guidance that the file is curated working memory capped at 50 lines
    - [ ] Write `claude-skills/conductor/assets/lessons-learned.md`
    - [ ] Write `templates/lessons-learned.md`
    - [ ] Verify both copies match the acceptance criteria and remain identical

- [ ] Task 1.2: Create `tech-debt.md` template
    - [ ] Define acceptance criteria: file has a table with columns (Date, Track, Item, Severity, Status, Notes), uses `Open`/`Resolved` status values, includes one example row marked as resolved, and states that the file is curated working memory capped at 50 lines
    - [ ] Write `claude-skills/conductor/assets/tech-debt.md`
    - [ ] Write `templates/tech-debt.md`
    - [ ] Verify both copies match the acceptance criteria and remain identical

- [ ] Task 1.3: Add context budget checker script
    - [ ] Define acceptance criteria: repository contains a small script that reports line counts for `conductor/lessons-learned.md` and `conductor/tech-debt.md`, marks each as `OK` or `OVER_LIMIT`, and exits successfully even when files do not yet exist
    - [ ] Write `scripts/conductor/check_context_budget.sh`
    - [ ] Verify the script uses a standard 50-line limit and can be referenced by workflow docs

- [ ] Task 1.4: Conductor - User Manual Verification 'Phase 1: New Template Files' (Protocol in workflow.md)

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

- [ ] Task 2.4: Add setup guidance for memory artifacts and budget checker
    - [ ] Define acceptance criteria: setup.md notes that `lessons-learned.md` and `tech-debt.md` are bounded working-memory artifacts and references the standard context budget checker command
    - [ ] Edit `claude-skills/conductor/references/setup.md`
    - [ ] Verify the guidance is additive and clearly points to the checker script

- [ ] Task 2.5: Conductor - User Manual Verification 'Phase 2: Setup Workflow Integration' (Protocol in workflow.md)

---

## Phase 3: New Track Workflow Integration

Update `references/new-track.md` to load lessons-learned before planning and surface tech debt during spec gathering.

- [ ] Task 3.1: Load lessons-learned.md before plan generation (FR-4, item 1)
    - [ ] Define acceptance criteria: in new-track.md §2.3 step 2 (Read section), there is an instruction to resolve and read `**Lessons Learned**` (if it exists) and use its contents to inform plan complexity and ordering
    - [ ] Edit `claude-skills/conductor/references/new-track.md` §2.3
    - [ ] Verify the instruction is placed before the "Generate Implementation Plan" step and handles file-not-found gracefully

- [ ] Task 3.2: Surface tech debt during spec questions (FR-4, item 2)
    - [ ] Define acceptance criteria: in new-track.md §2.2, after the spec questions are complete, there is a step that checks `**Tech Debt Registry**` for relevant open items and presents them to the user
    - [ ] Edit `claude-skills/conductor/references/new-track.md` §2.2
    - [ ] Verify the step handles file-not-found gracefully and only surfaces relevant items

- [ ] Task 3.3: Add context-budget checks before memory files are loaded
    - [ ] Define acceptance criteria: new-track.md checks line count with `wc -l` or `scripts/conductor/check_context_budget.sh` before loading `lessons-learned.md` or `tech-debt.md`, and instructs the agent to summarize or prune when either file exceeds 50 lines
    - [ ] Edit `claude-skills/conductor/references/new-track.md`
    - [ ] Verify the instructions are placed before memory files are read

- [ ] Task 3.4: Update metadata.json template in new-track.md (FR-9)
    - [ ] Define acceptance criteria: the metadata.json template in new-track.md §2.4 includes `estimated_tasks`, `actual_tasks`, and `deviation_notes` fields
    - [ ] Edit `claude-skills/conductor/references/new-track.md` §2.4
    - [ ] Verify JSON is valid and fields are present

- [ ] Task 3.5: Populate `estimated_tasks` during plan finalization
    - [ ] Define acceptance criteria: new-track.md instructs the agent to count planned tasks when the plan is finalized and write that value into `metadata.json`
    - [ ] Edit `claude-skills/conductor/references/new-track.md`
    - [ ] Verify the counting rule is clearly described and occurs before artifact creation is finalized

- [ ] Task 3.6: Conductor - User Manual Verification 'Phase 3: New Track Workflow Integration' (Protocol in workflow.md)

---

## Phase 4: Implement Workflow Integration

Update `references/implement.md` and the workflow template to capture retrospectives and tech debt during implementation.

- [ ] Task 4.1: Load project memory before execution begins
    - [ ] Define acceptance criteria: implement.md instructs the agent to check context budget, then read relevant entries from `lessons-learned.md` and open items from `tech-debt.md` before task execution starts
    - [ ] Edit `claude-skills/conductor/references/implement.md`
    - [ ] Verify the step is additive, runs before task execution, and handles missing files gracefully

- [ ] Task 4.2: Add retrospective and metadata finalization steps to implement.md §3.4
    - [ ] Define acceptance criteria: implement.md §3.4 (Finalize Track) has a new step before the track status update that asks three retrospective questions, appends entries to `lessons-learned.md` or `tech-debt.md` when needed, updates `actual_tasks`, and fills `deviation_notes` when the plan materially changed
    - [ ] Edit `claude-skills/conductor/references/implement.md` §3.4
    - [ ] Verify the step handles absent lessons-learned.md/tech-debt.md gracefully and explains when `deviation_notes` must be filled

- [ ] Task 4.3: Add tech debt prompt and context budget note to workflow templates
    - [ ] Define acceptance criteria: `assets/workflow.md` Standard Task Workflow notes that when a known shortcut is taken, the agent prompts the user to add a row to `tech-debt.md`, and references the standard context-budget checker before loading memory artifacts
    - [ ] Edit `claude-skills/conductor/assets/workflow.md` and `templates/workflow.md`
    - [ ] Verify both copies are identical after edit

- [ ] Task 4.4: Conductor - User Manual Verification 'Phase 4: Implement Workflow Integration' (Protocol in workflow.md)

---

## Phase 5: Review Workflow Integration

Update `references/review.md` to offer logging critical/high findings to lessons-learned.md.

- [ ] Task 5.1: Load recurring gotchas before analysis
    - [ ] Define acceptance criteria: review.md checks context budget, then reads relevant `lessons-learned.md` entries before analysis so the review can look for repeated failure modes
    - [ ] Edit `claude-skills/conductor/references/review.md` §2.2
    - [ ] Verify the step is additive and handles missing files gracefully

- [ ] Task 5.2: Add lessons-learned logging offer to review.md §3.1 (FR-7)
    - [ ] Define acceptance criteria: review.md §3.1 (Review Decision), after the Apply Fixes option, has a new prompt offering to log the root cause of Critical or High findings to `lessons-learned.md` under "Recurring Gotchas"
    - [ ] Edit `claude-skills/conductor/references/review.md` §3.1
    - [ ] Verify the prompt only triggers for Critical/High severity findings and handles absent lessons-learned.md gracefully

- [ ] Task 5.3: Conductor - User Manual Verification 'Phase 5: Review Workflow Integration' (Protocol in workflow.md)

---

## Phase 6: Status Workflow Integration

Update `references/status.md` to show project health indicators.

- [ ] Task 6.1: Read status.md to understand current output format
    - [ ] Read `claude-skills/conductor/references/status.md`
    - [ ] Identify the correct insertion point for the new "Project Health" section

- [ ] Task 6.2: Add Project Health section to status.md (FR-7)
    - [ ] Define acceptance criteria: status.md output includes a "Project Health" section showing (a) last update date of `lessons-learned.md` via `git log -1 --format="%ar"`, (b) count of open rows in `tech-debt.md`, and (c) current line counts for both memory artifacts
    - [ ] Edit `claude-skills/conductor/references/status.md`
    - [ ] Verify all values handle absent files gracefully (show "not created yet" rather than erroring)

- [ ] Task 6.3: Add context budget warnings to status.md
    - [ ] Define acceptance criteria: status.md reports whether either memory artifact exceeds the 50-line context budget using `wc -l` or the standard checker script
    - [ ] Edit `claude-skills/conductor/references/status.md`
    - [ ] Verify the warning format is clear and non-fatal

- [ ] Task 6.4: Conductor - User Manual Verification 'Phase 6: Status Workflow Integration' (Protocol in workflow.md)

---

## Phase 7: Skill Documentation Synchronization

Update top-level conductor documentation so the new memory features are discoverable to agents.

- [ ] Task 7.1: Update conductor skill overview and directory structure
    - [ ] Define acceptance criteria: `claude-skills/conductor/SKILL.md` mentions `lessons-learned.md` and `tech-debt.md` in the directory structure or core concepts and describes them as bounded working-memory artifacts
    - [ ] Edit `claude-skills/conductor/SKILL.md`
    - [ ] Verify the changes are concise and consistent with the workflow references

- [ ] Task 7.2: Update conductor skill assets section
    - [ ] Define acceptance criteria: `claude-skills/conductor/SKILL.md` assets section mentions the new templates or otherwise points readers to where they are maintained
    - [ ] Edit `claude-skills/conductor/SKILL.md`
    - [ ] Verify the new references are accurate

- [ ] Task 7.3: Conductor - User Manual Verification 'Phase 7: Skill Documentation Synchronization' (Protocol in workflow.md)
