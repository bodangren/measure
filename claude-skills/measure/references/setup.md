# Setup Workflow

Initialize Measure in a new or existing project.

## Prerequisites

Validate every tool call. If any fails, halt immediately and inform the user.

## 1.0 Pre-Initialization

### 1.1 Welcome Overview

Present the following overview:

> "Welcome to Measure. I will guide you through the following steps to set up your project:
> 1. **Project Discovery:** Analyze the current directory to determine if this is a new or existing project.
> 2. **Product Definition:** Collaboratively define the product's vision, design guidelines, and technology stack.
> 3. **Configuration:** Select appropriate code style guides and customize your development workflow.
> 4. **Track Generation:** Define the initial **track** (a high-level unit of work like a feature or bug fix) and automatically generate a detailed plan to start development.
>
> Let's get started!"

### 1.2 Project Audit

**PROTOCOL: Before starting setup, determine the project's state by auditing existing artifacts.**

1. **Announce Audit:** Inform the user that you are auditing the project for any existing Measure configuration.

2. **Audit Artifacts:** Check for the existence of the following files/directories in the `measure/` directory (and `DESIGN.md` in the project root):
   - `product.md`
   - `product-guidelines.md`
   - `../DESIGN.md`
   - `tech-stack.md`
   - `code_styleguides/`
   - `workflow.md`
   - `index.md`
   - `tracks/*/` (specifically `plan.md` and `index.md`)

3. **Determine Target Section:** Map the project's state to a target section using the priority table below (highest match wins). **DO NOT JUMP YET.** Keep this target in mind.

| Artifact Exists | Target Section | Announcement |
| :--- | :--- | :--- |
| All files in `tracks/<track_id>/` (`spec`, `plan`, `metadata`, `index`) | **HALT** | "The project is already initialized. Use `new track` or `implement`." |
| `index.md` (top-level) | **Section 3.0** | "Resuming setup: Scaffolding is complete. Next: generate the first track." |
| `workflow.md` | **Section 2.7** | "Resuming setup: Workflow is defined. Next: select Agent Skills." |
| `code_styleguides/` | **Section 2.6** | "Resuming setup: Guides/Tech Stack configured. Next: define project workflow." |
| `tech-stack.md` | **Section 2.5** | "Resuming setup: Tech Stack defined. Next: select Code Styleguides." |
| `../DESIGN.md` | **Section 2.4** | "Resuming setup: Design Definition complete. Next: define the Technology Stack." |
| `product-guidelines.md` | **Section 2.3** | "Resuming setup: Guidelines are complete. Next: create Design Definition." |
| `product.md` | **Section 2.2** | "Resuming setup: Product Guide is complete. Next: create Product Guidelines." |
| (None) | **Section 2.0** | (None) |

4. **Proceed to Section 2.0:** You MUST proceed to Section 2.0 to establish the Greenfield/Brownfield context before jumping to your target.

## 2.0 Project Discovery

### Detect Project Maturity

**Brownfield (Existing)** if ANY of:
- `.git`, `.svn`, or `.hg` directory exists
- `git status --porcelain` shows uncommitted changes (ignoring changes within the `measure/` directory)
- Dependency manifests exist: `package.json`, `pom.xml`, `requirements.txt`, `go.mod`, `Cargo.toml`
- Source directories exist: `src/`, `app/`, `lib/`, `bin/` with code files

**Greenfield (New)** if NONE of the above AND directory is empty or contains only README.md

### Resume Fast-Forward Check

- If the **Target Section** (from 1.2) is anything other than "Section 2.0":
  - Announce the project maturity classification and **briefly state the reason** (e.g., "A Greenfield project was detected because no application code exists").
  - **IMMEDIATELY JUMP** to the Target Section. Do not execute the rest of Section 2.0.
- If the Target Section is "Section 2.0", proceed to the appropriate workflow below.

### Brownfield Workflow

1. Announce existing project detected, **briefly stating the specific indicator** (e.g., "because I found a `package.json` file")
2. If `git status --porcelain` indicated uncommitted changes, warn: "You have uncommitted changes in your Git repository. Please commit or stash before proceeding."
3. **Pre-analysis Confirmation:** Ask permission for a read-only scan to analyze the project.
4. If denied, halt.
5. If approved, analyze:
   - **Prioritize README.md** first
   - **Respect ignore files:** Check for `.gitignore`. Use its patterns to exclude files/directories from analysis.
   - **List relevant files:** Use `git ls-files --exclude-standard -co | xargs -n 1 dirname | sort -u` for directory listing. If not a Git project, construct a `find` command that respects ignore files.
   - **Fallback:** If no `.gitignore` exists, manually ignore common directories: `node_modules`, `.m2`, `build`, `dist`, `bin`, `target`, `.git`, `.idea`, `.vscode`
   - **Prioritize manifest files:** `package.json`, `pom.xml`, `requirements.txt`, `go.mod`, etc.
   - **Large file handling:** For files >1MB, read only first and last 20 lines to infer purpose
6. **Extract and Infer:**
   - **CRITICAL:** Do NOT ask for more files. Base analysis SOLELY on discovered file snippets and directory structure.
   - Programming Language
   - Frameworks (frontend and backend)
   - Database Drivers
   - Architecture type from top 2 levels of file tree
   - Project goal in one sentence from README header or package.json description
7. Proceed to Section 2.1

### Greenfield Workflow

1. Announce new project initialization
2. Initialize git if `.git` doesn't exist: `git init`
3. Ask: "What do you want to build?"
   - **CRITICAL:** Do NOT execute any tool calls until the user has provided a response.
4. Execute `mkdir -p measure`
5. Write the user's response to `measure/product.md` under a `# Initial Concept` heading
6. Proceed to Section 2.1

## 2.1 Product Definition (`product.md`)

1. Announce creating **Product Definition**
2. Ask the user to choose a mode:
   - **Interactive:** Guide through questions to refine the vision
   - **Autogenerate:** Draft a comprehensive guide based on the initial concept
3. **If Interactive:** Ask 3-5 questions, batching up to 4 related questions in a single prompt:
   - **Question classification:** Classify each as "Additive" (multi-select, e.g., features, goals) or "Exclusive Choice" (single answer, e.g., primary platform)
   - **Format:** Header (short label), provide 3 options with label and description
   - **Brownfield:** Formulate questions specifically aware of the analyzed codebase. Do NOT ask generic questions if the answer is already in the files.
   - Wait for response, confirm understanding before next batch
4. **If Autogenerate:** Skip directly to drafting
5. Draft `product.md` based ONLY on the user's selected answers
6. Present for review with embedded content:
   > "Please review the drafted Product Guide below. What would you like to do next?"
   > ```markdown
   > [draft content]
   > ```
   > Options: **Approve** (proceed) / **Suggest changes** (modify)
7. **Append** the generated content to the existing `measure/product.md` file, preserving the `# Initial Concept` section
8. Update `measure/index.md` with link to **Product Definition**
9. Update state: `{"last_successful_step": "2.1_product_guide"}`

## 2.2 Product Guidelines (`product-guidelines.md`)

1. Announce creating **Product Guidelines**
2. Ask the user to choose a mode:
   - **Interactive:** Ask about prose style, branding, and UX principles
   - **Autogenerate:** Draft standard guidelines based on best practices
3. **If Interactive:** Ask 3-5 questions, batching up to 4 related questions:
   - **Brownfield:** Analyze current docs/code to suggest guidelines matching the established style
   - Provide 3 options per question with label and description
4. **If Autogenerate:** Skip directly to drafting
5. Draft based on user selections
6. Present for review with embedded content (Approve / Suggest changes)
7. Write to `measure/product-guidelines.md`
8. Update `measure/index.md` with link to **Product Guidelines**
9. Update state: `{"last_successful_step": "2.2_product_guidelines"}`

## 2.3 Design Definition (`DESIGN.md`)

1. Announce creating **Design Definition** using the `@google/design.md` specification.
2. Ask the user to choose a mode:
   - **Recommend from getdesign.md:** The agent fetches `https://getdesign.md`, reads `measure/product.md` for context, selects three designs that best fit the project, and presents them as options.
   - **Interactive:** The agent asks about preferred aesthetic. Suggest specific named examples: "Apple (Premium white space)", "Stripe (Purple gradients)", "Linear (Ultra-minimal)", "Ollama (Terminal-first)", etc.
3. **If "Recommend from getdesign.md":**
   a. Fetch `https://getdesign.md` to load the design catalog.
   b. Read `measure/product.md` to understand the project goal, target users, and product personality.
   c. Select three designs from the catalog that are the best fit. Be opinionated — do not pick generic choices.
   d. **Generate visual preview:** Read `claude-skills/measure/assets/design-preview-template.html` and create `measure/design-preview.html` customized for the three selected designs. Each tab renders the same components (nav, hero, palette, typography, buttons, cards, forms, spacing, radius, elevation) styled with that design's actual tokens from getdesign.md.
   e. Announce the preview: "I generated a visual design preview at `measure/design-preview.html`. It has 3 tabs — one for each recommended design. Please open it in your browser to compare them side-by-side."
   f. Present the three recommendations:
      - "Here are three design suggestions from getdesign.md that might fit with your project definition. Open `measure/design-preview.html` in your browser to see the visual comparison. Which one do you like best?"
      - Include an escape hatch: "None — let me pick" to show the full catalog.
   g. If "None — let me pick", present the full catalog and ask the user to name their choice.
   h. After a design is selected, ask for differentiation:
      - "You chose **[Design Name]**. How do you want to adapt this design definition to differentiate it from [Design Name]? What should feel different, unique, or better aligned with your brand?"
4. **Before drafting:** Execute `npx -y @google/design.md spec` to read the latest format specification and follow it exactly.
5. Draft `DESIGN.md` in the project root. Incorporate BOTH the chosen aesthetic AND the user's differentiation notes. **CRITICAL:** The design must be highly opinionated and avoid generic "AI slop" terms like "clean" or "modern" without specific implementation details.
6. Present for review with embedded content (Approve / Suggest changes)
7. Write to `DESIGN.md` in the project root.
8. Update `measure/index.md` with link to **Design Definition**.
9. Update state: `{"last_successful_step": "2.3_design_definition"}`

## 2.4 Tech Stack (`tech-stack.md`)

1. Announce defining **Tech Stack**

2. **For Greenfield:** Ask the user to choose a mode:
   - **Interactive:** Hand-pick languages, frameworks, and databases
   - **Autogenerate:** Recommend a standard stack based on project goal

   If Interactive, batch 4 questions separating concerns (Languages, Backend Frameworks, Frontend Frameworks, Database). Use multi-select to allow hybrid stacks. Options should explain *why/where* a tech fits (e.g., "TypeScript — Ideal for Angular UI").

3. **For Brownfield:**
   - **CRITICAL WARNING:** Your goal is to document the project's *existing* tech stack, not to propose changes.
   - State the inferred stack from the code analysis
   - Ask for confirmation: "Is the inferred tech stack correct?"
   - If the user disputes the suggestion, ask them to provide the correct tech stack manually
   - Proceed to draft using the user's input

4. Draft based on selections
5. Present for review with embedded content (Approve / Suggest changes)
6. Write to `measure/tech-stack.md`
7. Update `measure/index.md` with link to **Tech Stack**
8. Update state: `{"last_successful_step": "2.4_tech_stack"}`

## 2.5 Code Styleguides

1. List available styleguides from `assets/code_styleguides/`

2. **For Greenfield:**
   - Recommend the most appropriate style guide(s) based on the Tech Stack (e.g., "python.md" for a Python project)
   - Ask: **Recommended** (use suggested guides) / **Select from Library** (hand-pick)
   - If "Select from Library": Present guides in groups of 3-4 with multi-select. If the final group has only 1 item, add a "None" option.

3. **For Brownfield:**
   - Announce: "Based on the inferred tech stack, I will copy the following code style guides: <list>."
   - Ask: **Proceed** (use suggested guides) / **Add More** (select additional from library)
   - If "Add More": Present additional guides in a batched call with groups of 4 options max.

4. Copy selected files to `measure/code_styleguides/`
5. Update state: `{"last_successful_step": "2.5_code_styleguides"}`

## 2.6 Workflow

1. Copy `assets/workflow.md` to `measure/workflow.md`
2. Update `measure/index.md` with link to **Workflow**
3. Ask: Default workflow or Customize?

   Default includes:
   - 80% test coverage
   - Commit after every task
   - Git Notes for task summaries

   If Customize:
   - Question 1: Change coverage percentage?
   - Question 2: Commit after task or phase?
   - Question 3: Use Git Notes or commit message for summaries?
   - **Final Tweak:** After answering, show a summary and ask: "Based on your answers, I will configure the workflow with: [summary]. Is there anything else you'd like to change or add?"

4. Update `measure/workflow.md` based on responses
5. Update state: `{"last_successful_step": "2.6_workflow"}`

## 2.7 Memory Artifacts

1. Copy `assets/lessons-learned.md` to `measure/lessons-learned.md`
2. Copy `assets/tech-debt.md` to `measure/tech-debt.md`
3. Update `measure/index.md` with links:
   - `**Lessons Learned**`: `./lessons-learned.md`
   - `**Tech Debt Registry**`: `./tech-debt.md`
4. Announce: "Created **Lessons Learned** and **Tech Debt Registry** as bounded working-memory artifacts (50-line context budget each). Use `scripts/measure/check_context_budget.sh` to check limits."
5. Update state: `{"last_successful_step": "2.7_memory_artifacts"}`

## 2.8 Select Skills (Interactive)

1. **Analyze and Recommend:**
   - Use Vercel's Skills registry (`https://skills.sh/`).
   - Execute `npx -y skills search <query>` using keywords from the detected `tech-stack.md` (e.g., "react", "python", "postgres") as the search query.
   - Review the results and select the most relevant skills.

2. **Determine Mode:**
   - **If no relevant skills are found:** Announce "No additional agent skills were found for this project context. Skipping skill installation." and skip to 2.9.
   - **If relevant skills are found:** Present recommendations:
     - Ask: "Based on your project context, I found the following skills via Vercel's registry: <List>. How would you like to proceed?"
     - Options:
       - **Install Recommended**: Install the recommended skills.
       - **Install find-skills**: Install the 'find-skills' skill to help discover more later.
       - **Skip**: Do not install any skills at this time.

3. **Process Selection & Install:**
   - If "Install Recommended": Execute `npx -y skills add <skill-names>`
   - If "Install find-skills": Execute `npx -y skills add https://github.com/vercel-labs/skills --skill find-skills`
   - If "Skip": Proceed without installation.

4. **Continue:** Proceed to Section 2.8.1.

### 2.8.1 Skill Reload Confirmation

1. **Execution Trigger:** This step MUST only be executed if you installed new skills in the previous section.
2. **Notify and Pause:** "New skills installed. Please reload your skills to enable them. Let me know when you have done this." Do NOT ask a question here — make a statement and wait.
3. **Wait for Confirmation:** Pause and wait for the user to confirm they have reloaded the skills.

## 2.9 Finalization

1. **Generate Index File:** Create `measure/index.md` with the following content:
   ```markdown
   # Project Context

   ## Definition
   - [Product Definition](./product.md)
   - [Product Guidelines](./product-guidelines.md)
   - [Design Definition](../DESIGN.md)
   - [Tech Stack](./tech-stack.md)

   ## Workflow
   - [Workflow](./workflow.md)
   - [Code Style Guides](./code_styleguides/)

   ## Learning & Continuity
   - [Lessons Learned](./lessons-learned.md)
   - [Tech Debt Registry](./tech-debt.md)

   ## Management
   - [Tracks Registry](./tracks.md)
   - [Tracks Directory](./tracks/)
   ```
   Announce: "Created `measure/index.md` to serve as the project context index."

2. **Summarize Actions:** Present a summary of all actions taken during the initial setup, including:
   - The guide files that were copied
   - The workflow file that was copied
3. **Transition:** Announce that the initial setup is complete and you will now proceed to define the first track for the project.

## 3.0 Initial Track Generation

**Pre-Requisite (Cleanup):** If resuming because a previous setup was interrupted, check if the `measure/tracks/` directory exists but is incomplete. If it exists, **delete** the entire `measure/tracks/` directory before proceeding to ensure a clean slate.

### 3.1 Product Requirements (Greenfield only)

1. Announce defining requirements
2. Ask the user to choose a mode:
   - **Interactive:** Guide through user stories and functional goals
   - **Autogenerate:** Draft requirements based on the Product Guide
3. **If Interactive:** Ask 3-5 questions, batching up to 4 related questions:
   - User Stories, Key Features, Constraints, Non-functional Requirements
   - Provide 3 options per question with label and description
   - Wait for response
4. **If Autogenerate:** Skip directly to drafting
5. **Drafting Logic:** The source of truth for generation is **only the user's selected answers**. Expand on these to create a polished output.
6. Present for review with embedded content:
   > "Please review the drafted Product Requirements below. What would you like to do next?"
   > ```markdown
   > [draft content]
   > ```
   > Options: **Approve** / **Suggest changes**
7. Revise until confirmed

### 3.2 Propose Initial Track

1. Announce that you will propose an initial track. Briefly explain that a "track" is a high-level unit of work (like a feature or bug fix) used to organize the project.
2. Generate a single track title based on context:
   - **Greenfield:** Focus on the MVP core (e.g., "Build core tip calculator functionality")
   - **Brownfield:** Focus on maintenance or targeted enhancements (e.g., "Implement user authentication flow")
3. Present for approval:
   > "To get the project started, I suggest the following track: '<Track Title>'. Do you want to proceed with this track?"
   > Options: **Yes** / **Suggest changes**
4. If "Suggest changes", ask: "Please enter the description for the initial track:" with placeholder "e.g., Setup CI/CD pipeline"

### 3.3 Create Track Artifacts

1. Initialize **Tracks Registry** (`measure/tracks.md`):
   ```markdown
   # Project Tracks

   This file tracks all major tracks for the project.

   ---

   - [ ] **Track: <Track Description>**
     *Link: [./tracks/<track_id>/](./tracks/<track_id>/)*
   ```
2. Update `measure/index.md` with link to **Tracks Registry**.

3. Generate Track ID: `shortname_YYYYMMDD`
4. Create directory: `measure/tracks/<track_id>/`
5. Create `metadata.json`:
   ```json
   {
     "track_id": "<track_id>",
     "type": "feature",
     "status": "new",
     "created_at": "YYYY-MM-DDTHH:MM:SSZ",
     "updated_at": "YYYY-MM-DDTHH:MM:SSZ",
     "description": "<description>",
     "estimated_tasks": null,
     "actual_tasks": null,
     "deviation_notes": ""
   }
   ```
6. **Create Track Index:** Create `measure/tracks/<track_id>/index.md` with:
   ```markdown
   # Track <track_id> Context

   - [Specification](./spec.md)
   - [Implementation Plan](./plan.md)
   - [Metadata](./metadata.json)
   ```
7. Generate and write **Specification** (`spec.md`) and **Implementation Plan** (`plan.md`).
   - **CRITICAL:** The structure of tasks MUST adhere to the principles in `measure/workflow.md`. For example, if the workflow specifies TDD, each feature task must be broken down into a "Write Tests" sub-task followed by an "Implement Feature" sub-task.
   - **Status markers** for EVERY task and sub-task:
     ```markdown
     - [ ] Task: Create user model
         - [ ] Write unit tests for user model
         - [ ] Implement user model
     ```
   - **CRITICAL: Inject Phase Completion Tasks.** Read `measure/workflow.md` to determine if a "Phase Completion Verification and Checkpointing Protocol" is defined. If it exists, append to each phase:
     ```markdown
     - [ ] Task: Measure - User Manual Verification '<Phase Name>' (Protocol in workflow.md)
     ```
8. **Populate `estimated_tasks`:** Count total top-level tasks in the finalized `plan.md` and write to `metadata.json`.
9. Update state: `{"last_successful_step": "3.3_initial_track_generated"}`

### 3.4 Finalize

1. Announce that setup and initial track generation are complete.
2. Summarize all actions taken.
3. Commit: `measure(setup): Add measure setup files`
4. Inform user: "You can now start implementation by running `implement`."
