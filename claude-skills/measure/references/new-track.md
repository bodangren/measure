# New Track Workflow

Create a new track with spec and plan through interactive specification gathering.

## Prerequisites

Validate every tool call. If any fails, halt immediately and inform the user.

## 1.0 Setup Check

**PROTOCOL: Verify that the Measure environment is properly set up.**

1. **Verify Core Context:** Using the **Universal File Resolution Protocol**, resolve and verify the existence of:
   - **Product Definition**
   - **Tech Stack**
   - **Workflow**

2. **Handle Failure:** If ANY of these are missing (or their resolved paths do not exist), Announce: "Measure is not set up. Please run setup first." and HALT.

## 2.0 Track Initialization

### 2.1 Get Track Description

1. Check if user provided a description
2. If not, ask: "Please provide a brief description of the track (feature, bug fix, chore, etc.)"
3. Infer track type from description (Feature vs Bug/Chore/Refactor) - do NOT ask user to classify

### 2.2 Interactive Specification Gathering (**Specification**)

1. Announce: "I'll now guide you through a series of questions to build a comprehensive specification (`spec.md`) for this track."

2. **Choose Spec Format (Mode Selection):** Before any other questions, ask the user how the spec should be structured.
   - Header: `Spec format`
   - Question: "How should this track's spec be structured?"
   - Options:
     - **Story-shaped spec (Recommended for features)** — Decompose requirements into user stories with Gherkin acceptance criteria, T-shirt sizes, and priorities. Enables sprint metadata and velocity tracking.
     - **Classic FR list** — Numbered functional requirements (FR-1, FR-2…). Best for bug fixes, chores, and simple refactors.
   - **Default suggestion:** If the inferred track type is `feature`, recommend Story-shaped. Otherwise recommend Classic.
   - Record the selection as `spec_mode = story | classic` and use it to branch the remaining steps in this section.

3. **Questioning Phase:** Ask questions to gather details for the `spec.md`. You must batch up to 4 related questions in a single prompt to streamline the process. Tailor questions based on `spec_mode` and the track type.
   - **CRITICAL:** Wait for the user's response after each prompt.
   - **Question Classification:** Before formulating any question, classify its purpose as either "Additive" or "Exclusive Choice":
     - **Additive** (multi-select): For brainstorming and defining scope (e.g., features, goals). Use "(Select all that apply)".
     - **Exclusive Choice** (single answer): For foundational, singular commitments (e.g., selecting a primary technology).
   - **Format:** For each question:
     - Header: Short label (max 16 chars)
     - Provide 2-3 plausible options based on context, each with a label and description
     - Last option: "Type your own answer"
   - **If `spec_mode = story` (Story-shaped path):**
     - First, ask for the **Sprint Goal**: a single sentence describing the outcome of completing this track. This becomes the spec's Overview anchor and the `sprint.goal` in metadata.
     - Then ask the user to enumerate the **user stories** for this track. For each story, gather (batched per story, ≤4 prompts):
       1. Short title (≤8 words) and the Connextra triplet (`As a <role>`, `I want <capability>`, `So that <outcome>`).
       2. Gherkin acceptance criteria (1–5 `Given … When … Then …` bullets per story).
       3. Estimate: `S | M | L | XL` (T-shirt size).
       4. Priority: `Must | Should | Could`.
     - Continue until the user signals "no more stories".
   - **If `spec_mode = classic` (Classic path):**
     - **For Features:** Ask 3-4 questions about functionality, implementation approach, interactions, inputs/outputs.
     - **For Bugs/Chores:** Ask 2-3 questions about reproduction steps, scope, success criteria.
   - **Brownfield:** Formulate questions specifically aware of the analyzed codebase. Do NOT ask generic questions if the answer is already in the files.
   - Confirm your understanding by summarizing before moving to drafting.

4. **Surface Relevant Tech Debt:** Resolve **Tech Debt Registry** (if it exists).
   - Check line count with `wc -l`. If over 50 lines, summarize or prune before loading.
   - If the file exists, scan for `Open` items relevant to the feature area.
   - If relevant items are found, present them: "There are open tech debt items that may relate to this track. Would you like to address any of them?"
   - If the file does not exist, skip silently.

5. Draft **Specification** (`spec.md`) with:
   - Overview
   - **If `spec_mode = story`:** `## Stories` section (one `### Story S<n>: <title>` block per story — see schema below)
   - **If `spec_mode = classic`:** `## Functional Requirements` section (FR-1, FR-2, …)
   - Non-Functional Requirements (if applicable)
   - Acceptance Criteria (track-level)
   - Out of Scope

   **Story block schema (when `spec_mode = story`):**
   ```markdown
   ### Story S<n>: <short title>
   **As a** <role>
   **I want** <capability>
   **So that** <outcome>

   **Acceptance Criteria:**
   - Given <context>, When <action>, Then <observable outcome>.
   - Given …, When …, Then ….

   **Estimate:** S | M | L | XL
   **Priority:** Must | Should | Could
   ```

   **Backward-compat rule:** Any downstream workflow that reads `spec.md` MUST treat the absence of a `## Stories` section as classic mode and proceed silently — no HALT, no warning, no migration prompt.

6. Present draft for review with embedded content:
   > "Please review the drafted Specification below. Does this accurately capture the requirements?"
   > ```markdown
   > [spec content]
   > ```
   > Options: **Approve** (proceed to planning) / **Revise** (modify requirements)

7. Revise until confirmed

### 2.3 Plan Generation (**Implementation Plan**)

1. Announce: "Now I will create an **Implementation Plan** (`plan.md`) based on the **Specification**."

2. Read:
   - Confirmed **Specification** content
   - **Workflow**
   - **Lessons Learned** (if it exists): Check line count with `wc -l` first. If over 50 lines, summarize or prune before loading. Use its contents to:
     - Identify known gotchas relevant to the track type or feature area.
     - Adjust task complexity estimates based on "Planning Improvements" entries.
     - Note relevant patterns in the generated plan.
   - If **Lessons Learned** does not exist, log a warning and continue.

3. Generate **Implementation Plan** (`plan.md`):
   - Hierarchical structure: Phases → Tasks → Sub-tasks
   - **CRITICAL:** Enforce the strict Contract-First pipeline. The plan MUST include the following phases in order:
     1. **Contract & Schema Definition:** Update or create strict schemas (e.g., Zod, OpenAPI) and contracts.
     2. **Test:** Write contract/unit tests for the new features.
     3. **Implement:** Implement the service/repo/backend/UI based on the contracts.
     4. **Generate Docs & Doctor:** Run `measure/generate.sh` to update generated facts, and run `measure/doctor.sh` to pass architectural linters.
   - Include `[ ]` status markers for EVERY task and sub-task:
     ```markdown
     - [ ] Task: Define User Model Contract
         - [ ] Update Zod schema for User
         - [ ] Export schema from feature root
     ```
   - If **Workflow** defines "Phase Completion Verification Protocol", append to each phase:
     ```markdown
     - [ ] Task: Measure - User Manual Verification '<Phase Name>' (Protocol in workflow.md)
     ```

4. Present draft for review with embedded content:
   > "Please review the drafted Implementation Plan below. Does this look correct and cover all the necessary steps?"
   > ```markdown
   > [plan content]
   > ```
   > Options: **Approve** (proceed) / **Revise** (modify implementation steps)

5. Revise until confirmed

### 2.4 Skill Recommendation (Interactive)

1. **Analyze Needs:**
   - Use Vercel's Skills registry (`https://skills.sh/`).
   - Execute `npx -y skills search <query>` using keywords from the **Tech Stack** and confirmed **Specification**.
   - Review the results and identify relevant skills that are NOT yet installed (check `.claude/skills/`).

2. **Recommendation Loop:**
   - **If relevant missing skills are found:**
     - Ask: "I've identified some skills that could help with this track. Would you like to install any of them?"
     - Present options with labels and descriptions explaining relevance. Multi-select enabled.
   - **Install:** If the user selects any skills, for each:
     - Create directory at `.claude/skills/<skill-name>/`
     - Execute `npx -y skills add <skill-name>` or download from URL
   - **If no missing skills found:** Skip this section.

### 2.4.1 Skill Reload Confirmation

1. **Execution Trigger:** This step MUST only be executed if you installed new skills in the previous section.
2. **Notify and Pause:** "New skills installed. Please reload your skills to enable them. Let me know when you have done this." Do NOT ask a question here — make a statement and wait.
3. **Wait for Confirmation:** Pause and wait for the user to confirm they have reloaded the skills.

### 2.5 Create Artifacts

1. Check for existing track names:
   - Resolve **Tracks Directory**.
   - List directories in the **Tracks Directory**.
   - Extract short names from track IDs
   - If proposed name matches existing, halt and suggest different name

2. Generate Track ID: `shortname_YYYYMMDD`

3. Create directory in the **Tracks Directory**: `measure/tracks/<track_id>/`

4. Create `metadata.json`:
   ```json
   {
     "track_id": "<track_id>",
     "type": "feature",
     "status": "new",
     "created_at": "YYYY-MM-DDTHH:MM:SSZ",
     "updated_at": "YYYY-MM-DDTHH:MM:SSZ",
     "description": "<Initial user description>",
     "estimated_tasks": null,
     "actual_tasks": null,
     "deviation_notes": ""
   }
   ```

5. **Create Track Index:** Create `measure/tracks/<track_id>/index.md` with:
   ```markdown
   # Track <track_id> Context

   - [Specification](./spec.md)
   - [Implementation Plan](./plan.md)
   - [Metadata](./metadata.json)
   ```

6. Write files:
   - **Specification** (`spec.md`)
   - **Implementation Plan** (`plan.md`)

7. Update **Tracks Registry** (`measure/tracks.md`):
   ```markdown

   ---

   - [ ] **Track: <Track Description>**
     *Link: [./tracks/<track_id>/](./tracks/<track_id>/)*
   ```

8. **Populate `estimated_tasks`:** Count the total number of top-level tasks in the finalized `plan.md` and write that value into `metadata.json` as `estimated_tasks`.

9. **Commit Changes:** Stage the **Tracks Registry** and all new track files. Commit with message `chore(measure): Add new track '<track_description>'`.

10. Announce completion:
    > "New track '<track_id>' has been created and added to the tracks file. You can now start implementation by running `implement`."
