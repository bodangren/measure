# New Track Workflow

Create a new track with spec and plan through interactive specification gathering.

## Prerequisites

Validate every tool call. If any fails, halt immediately and inform the user.

## 1.0 Setup Check

**PROTOCOL: Verify that the Conductor environment is properly set up.**

1.  **Verify Core Context:** Using the **Universal File Resolution Protocol**, resolve and verify the existence of:
    -   **Product Definition**
    -   **Tech Stack**
    -   **Workflow**

2.  **Handle Failure:** If ANY of these are missing (or their resolved paths do not exist), Announce: "Conductor is not set up. Please run setup first." and HALT.

## 2.0 Track Initialization

### 2.1 Get Track Description

1. Check if user provided a description
2. If not, ask: "Please provide a brief description of the track (feature, bug fix, chore, etc.)"
3. Infer track type from description (Feature vs Bug/Chore/Refactor) - do NOT ask user to classify

### 2.2 Interactive Specification gathering (**Specification**)

1. Announce: "I'll guide you through questions to build a comprehensive specification."

2. Ask questions sequentially (one at a time, wait for response):
   - **For Features**: 3-5 questions about functionality, implementation, interactions, inputs/outputs
   - **For Bugs/Chores**: 2-3 questions about reproduction steps, scope, success criteria

3. Question Guidelines:
   - Classify each question as "Additive" or "Exclusive Choice"
   - **Additive**: Add "(Select all that apply)", allow multiple answers
   - **Exclusive Choice**: Single answer required
   - Provide 2-3 plausible options based on context
   - Last option must be "Type your own answer"
   - Summarize understanding before moving on

4. Draft **Specification** (`spec.md`) with:
   - Overview
   - Functional Requirements
   - Non-Functional Requirements (if applicable)
   - Acceptance Criteria
   - Out of Scope

5. Present draft for review:
   > "I've drafted the **Specification**. Please review:"
   > ```markdown
   > [spec content]
   > ```
   > "Does this accurately capture the requirements? Suggest changes or confirm."

6. Revise until confirmed

### 2.3 Plan Generation (**Implementation Plan**)

1. Announce: "Now I will create an **Implementation Plan** based on the **Specification**."

2. Read:
   - Confirmed **Specification** content
   - **Workflow**

3. Generate **Implementation Plan** (`plan.md`):
   - Hierarchical structure: Phases → Tasks → Sub-tasks
   - Follow TDD methodology from **Workflow** (e.g., "Write Tests" then "Implement")
   - Include `[ ]` status markers for EVERY task and sub-task:
     ```markdown
     - [ ] Task: Create user model
         - [ ] Write unit tests for user model
         - [ ] Implement user model
     ```
   - If **Workflow** defines "Phase Completion Verification Protocol", append to each phase:
     ```markdown
     - [ ] Task: Conductor - User Manual Verification '<Phase Name>' (Protocol in workflow.md)
     ```

4. Present draft for review
5. Revise until confirmed

### 2.4 Create Artifacts

1. Check for existing track names:
   - Resolve **Tracks Directory**.
   - List directories in the **Tracks Directory**.
   - Extract short names from track IDs
   - If proposed name matches existing, halt and suggest different name

2. Generate Track ID: `shortname_YYYYMMDD`

3. Create directory in the **Tracks Directory**: `conductor/tracks/<track_id>/`

4. Create `metadata.json`:
```json
{
  "track_id": "<track_id>",
  "type": "feature",
  "status": "new",
  "created_at": "YYYY-MM-DDTHH:MM:SSZ",
  "updated_at": "YYYY-MM-DDTHH:MM:SSZ",
  "description": "<Initial user description>"
}
```

5. **Create Track Index**: Create `conductor/tracks/<track_id>/index.md`.

6. Write files:
   - **Specification** (`spec.md`)
   - **Implementation Plan** (`plan.md`)

7. Update track index with links to **Specification** and **Implementation Plan**.

8. Update **Tracks Registry** (`conductor/tracks.md`):
```markdown
- [ ] **Track: <Track Description>**
  *Link: [./conductor/tracks/<track_id>/](./conductor/tracks/<track_id>/)*
```

9. Announce completion:
   > "New track '<track_id>' has been created. You can now start implementation."
