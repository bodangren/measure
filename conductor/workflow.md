# Project Workflow

## Guiding Principles

1. **The Plan is the Source of Truth:** All work must be tracked in `plan.md`
2. **The Tech Stack is Deliberate:** Changes to the tech stack must be documented in `tech-stack.md` *before* implementation
3. **Acceptance-Criteria-First Development:** For Markdown/prompt projects, define acceptance criteria before editing files (analogous to TDD's Red phase)
4. **Verify Before Completing:** Manually verify each task against its acceptance criteria before marking complete
5. **Clarity First:** Every workflow change must be unambiguous to an AI agent reading it fresh

## Task Workflow

All tasks follow a strict lifecycle:

### Standard Task Workflow

1. **Select Task:** Choose the next available task from `plan.md` in sequential order

2. **Mark In Progress:** Before beginning work, edit `plan.md` and change the task from `[ ]` to `[~]`

3. **Define Acceptance Criteria (Red Phase):**
   - Before editing any file, write out the specific, verifiable acceptance criteria for the task.
   - For workflow edits: state exactly what the new step should say and where it should appear.
   - For new files: state the required sections, fields, and format.
   - **CRITICAL:** Do not proceed until acceptance criteria are documented.

4. **Implement (Green Phase):**
   - Make the minimal changes necessary to satisfy the acceptance criteria.
   - For workflow reference files: edit the relevant section in `claude-skills/conductor/references/`.
   - For template files: edit the relevant file in `claude-skills/conductor/assets/` AND `templates/`.
   - Verify the result matches the acceptance criteria.

5. **Refactor (Optional but Recommended):**
   - Review the edited file for consistency with surrounding content.
   - Ensure tone, formatting, and terminology match the product guidelines.

6. **Document Deviations:** If implementation requires a tech stack change:
   - **STOP** implementation
   - Update `tech-stack.md`
   - Add a dated note explaining the change
   - Resume implementation

7. **Commit Code Changes:**
   - Stage all changed files related to the task.
   - Propose a clear, concise commit message (e.g., `feat(implement): Add retrospective step to track finalization`).
   - Perform the commit.

8. **Attach Task Summary with Git Notes:**
   - **Step 8.1: Get Commit Hash:** `git log -1 --format="%H"`
   - **Step 8.2: Draft Note Content:** Task name, summary of changes, list of modified files, and the "why."
   - **Step 8.3: Attach Note:** `git notes add -m "<note content>" <commit_hash>`

9. **Get and Record Task Commit SHA:**
   - Update `plan.md`: change `[~]` to `[x]` and append the first 7 characters of the commit hash.
   - Write the updated `plan.md`.

10. **Commit Plan Update:**
    - Stage `plan.md`.
    - Commit: `conductor(plan): Mark task '<task name>' as complete`

### Phase Completion Verification and Checkpointing Protocol

**Trigger:** This protocol is executed immediately after a task is completed that also concludes a phase in `plan.md`.

1. **Announce Protocol Start:** Inform the user that the phase is complete and verification has begun.

2. **Verify Changed Files:**
   - Find the starting SHA from the previous phase checkpoint in `plan.md` (or first commit if none).
   - Run `git diff --name-only <previous_checkpoint_sha> HEAD` to list changed files.
   - For each changed file, verify the changes satisfy the phase's stated acceptance criteria.

3. **Manual Verification Plan:**
   - Generate a step-by-step verification plan based on the phase's goals.
   - For workflow changes: ask the reviewer to read the modified section and confirm it is unambiguous and correctly placed.

   Example:
   ```
   Phase complete. For manual verification:

   1. Open `claude-skills/conductor/references/implement.md`
   2. Find section 3.4 (Finalize Track)
   3. Confirm a new retrospective step appears before the track status update
   4. Confirm the step references `lessons-learned.md` correctly
   ```

4. **Await User Confirmation:**
   - Ask: "Does this meet your expectations? Please confirm with yes or provide feedback."
   - **PAUSE** and await explicit confirmation before proceeding.

5. **Create Checkpoint Commit:**
   - Commit: `conductor(checkpoint): Checkpoint end of Phase <X>`

6. **Attach Verification Report via Git Notes:**
   - Attach a report including the verification steps taken and the user's confirmation.

7. **Record Phase Checkpoint SHA:**
   - Update `plan.md` with the checkpoint SHA in format `[checkpoint: <sha>]`.
   - Commit: `conductor(plan): Mark phase '<PHASE NAME>' as complete`

8. **Announce Completion.**

### Quality Gates

Before marking any task complete, verify:

- [ ] Changes satisfy the task's acceptance criteria
- [ ] Modified files are consistent in tone and formatting with surrounding content
- [ ] Terminology matches the product guidelines
- [ ] No existing workflow steps were unintentionally removed or reordered
- [ ] File names and section references are correct
- [ ] Both `claude-skills/` and `templates/` copies are updated if a template was changed

## Development Commands

### Verify File Structure
```bash
# List all conductor skill files
find claude-skills/conductor -type f | sort
find templates -type f | sort
```

### Check for Inconsistencies
```bash
# Compare template copies
diff claude-skills/conductor/assets/workflow.md templates/workflow.md
```

### Git Workflow
```bash
# Stage specific files
git add claude-skills/conductor/references/implement.md

# Review staged changes before committing
git diff --staged

# Commit
git commit -m "feat(implement): Add retrospective step to track finalization"
```

## Commit Guidelines

### Message Format
```
<type>(<scope>): <description>
```

### Types
- `feat`: New workflow step or file
- `fix`: Correction to an existing step
- `docs`: Documentation-only change
- `refactor`: Restructuring without behavior change
- `chore`: Maintenance (file moves, cleanup)

### Scopes
- `setup`, `new-track`, `implement`, `review`, `status`, `revert`: Reference file changes
- `workflow`: Template workflow changes
- `assets`: Asset file changes
- `conductor`: Meta/infrastructure changes

### Examples
```bash
git commit -m "feat(implement): Add retrospective step before track finalization"
git commit -m "feat(setup): Create lessons-learned.md and tech-debt.md stubs"
git commit -m "fix(review): Correct lessons-learned append instruction"
```

## Definition of Done

A task is complete when:

1. All file edits satisfy the acceptance criteria
2. Changes are consistent with product guidelines (tone, formatting, terminology)
3. Both skill copies updated if a template was changed (`claude-skills/` and `templates/`)
4. Changes committed with a proper message
5. Git note with task summary attached to the commit
6. `plan.md` updated with `[x]` status and commit SHA
