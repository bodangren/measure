# Setup Workflow

Initialize Measure in a new or existing project.

## Prerequisites

Validate every tool call. If any fails, halt immediately and inform the user.

## Resume Check

1. Check for `measure/setup_state.json`
2. If exists, read `last_successful_step` and resume from the next step:
   - `"2.1_product_guide"` → Skip to Product Guidelines (2.2)
   - `"2.2_product_guidelines"` → Skip to Design Definition (2.3)
   - `"2.3_design_definition"` → Skip to Tech Stack (2.4)
   - `"2.4_tech_stack"` → Skip to Code Styleguides (2.5)
   - `"2.5_code_styleguides"` → Skip to Workflow (2.6)
   - `"2.6_workflow"` → Skip to Memory Artifacts (2.7)
   - `"2.7_memory_artifacts"` → Skip to Select Skills (2.8)
   - `"3.3_initial_track_generated"` → Setup complete, inform user to use `new track` or `implement`

## 1.0 Project Discovery

### Detect Project Maturity

**Brownfield (Existing)** if ANY of:
- `.git`, `.svn`, or `.hg` directory exists
- `git status --porcelain` shows uncommitted changes
- Dependency manifests exist: `package.json`, `pom.xml`, `requirements.txt`, `go.mod`
- Source directories exist: `src/`, `app/`, `lib/` with code files

**Greenfield (New)** if NONE of the above AND directory is empty or contains only README.md

### Brownfield Workflow

1. Announce existing project detected
2. Warn about uncommitted changes if present
3. Ask permission for read-only analysis scan (use AskUserQuestion)
4. If approved, analyze:
   - README.md first
   - Respect `.gitignore` and `.geminiignore` patterns
   - Use `git ls-files --exclude-standard -co` to list files
   - Prioritize manifest files: `package.json`, `pom.xml`, etc.
   - For files >1MB, read only first/last 20 lines
5. Extract: programming language, frameworks, databases, architecture type
6. Infer project goal from README or package.json description
7. Proceed to Generate Product Guide

### Greenfield Workflow

1. Announce new project initialization
2. Initialize git if `.git` doesn't exist: `git init`
3. Ask: "What do you want to build?"
4. Create `measure/` directory
5. Create `measure/setup_state.json` with `{"last_successful_step": ""}`
6. **Create index.md**: Create `measure/index.md` as the root for the Universal File Resolution Protocol.
7. Write response to `measure/product.md` under `# Initial Concept`

## 2.0 Interactive Document Generation

### 2.1 Product Definition (`product.md`)

1. Announce creating **Product Definition**
2. Ask 3-5 questions sequentially (one at a time, wait for response):
   - Target users, goals, features
   - Provide 3 suggested options per question
   - Last options: "Type your own answer", "Autogenerate and review"
   - For Brownfield: ask context-aware questions based on analysis
3. Draft `product.md` based ONLY on user's selected answers
4. Present for review with options: Approve / Suggest Changes
5. Write to `measure/product.md`
6. Update `measure/index.md` with link to **Product Definition**.
7. Update state: `{"last_successful_step": "2.1_product_guide"}`

### 2.2 Product Guidelines (`product-guidelines.md`)

1. Announce creating **Product Guidelines**
2. Ask 3-5 questions about: prose style, brand messaging, visual identity
3. Draft based on user selections
4. Present for review
5. Write to `measure/product-guidelines.md`
6. Update `measure/index.md` with link to **Product Guidelines**.
7. Update state: `{"last_successful_step": "2.2_product_guidelines"}`

### 2.3 Design Definition (`DESIGN.md`)

1. Announce creating **Design Definition** using the `@google/design.md` specification.
2. Ask the user to choose a mode:
   - **"Recommend from getdesign.md"** — The agent fetches `https://getdesign.md`, reads `measure/product.md` for context, selects three designs that best fit the project, and presents them as options.
   - **"Interactive"** — The agent asks the user directly about their preferred aesthetic.
3. **If "Recommend from getdesign.md":**
   a. Fetch `https://getdesign.md` to load the design catalog.
   b. Read `measure/product.md` to understand the project goal, target users, and product personality.
   c. Select three designs from the catalog that are the best fit. Be opinionated — do not pick generic choices.
   d. **Generate visual preview:** Read `claude-skills/measure/assets/design-preview-template.html` and create `measure/design-preview.html` customized for the three selected designs. Each tab renders the same components (nav, hero, palette, typography, buttons, cards, forms, spacing, radius, elevation) styled with that design's actual tokens from getdesign.md.
   e. Announce the preview and ask the user to open `measure/design-preview.html` in their browser.
   f. Present the three recommendations via `ask_user`:
      - "Here are three design suggestions from getdesign.md that might fit with your project definition. Open `measure/design-preview.html` in your browser to see the visual comparison. Which one do you like best?"
      - Include an escape hatch: "None — let me pick" to show the full catalog.
   g. If "None — let me pick", present the full catalog and ask the user to name their choice.
   h. After a design is selected, ask for differentiation:
      - "You chose **[Design Name]**. How do you want to adapt this design definition to differentiate it from {Design Name}? What should feel different, unique, or better aligned with your brand?"
4. Draft `DESIGN.md` in the project root. Incorporate BOTH the chosen aesthetic AND the user's differentiation notes. Ensure it adheres strictly to the `@google/design.md` spec (avoiding generic "AI slop" terms like "clean" or "modern" without substance).
5. Present for review.
6. Write to `DESIGN.md` in the project root.
7. Update `measure/index.md` with link to **Design Definition**.
8. Update state: `{"last_successful_step": "2.3_design_definition"}`

### 2.4 Tech Stack (`tech-stack.md`)

1. Announce defining **Tech Stack**
2. For Greenfield: Ask about languages, frameworks, databases
3. For Brownfield: State inferred stack, ask for confirmation only
4. Draft based on selections
5. Present for review
6. Write to `measure/tech-stack.md`
7. Update `measure/index.md` with link to **Tech Stack**.
8. Update state: `{"last_successful_step": "2.4_tech_stack"}`

### 2.5 Code Styleguides

1. List available styleguides from `assets/code_styleguides/`
2. Recommend based on tech stack
3. Ask: Include recommended / Edit selection
4. Copy selected files to `measure/code_styleguides/`
5. Update state: `{"last_successful_step": "2.5_code_styleguides"}`

### 2.6 Workflow

1. Copy `assets/workflow.md` to `measure/workflow.md`
2. Update `measure/index.md` with link to **Workflow**.
3. Ask: Default workflow or Customize?

Default includes:
- 80% test coverage
- Commit after every task
- Git Notes for task summaries

If Customize:
- Question 1: Change coverage percentage?
- Question 2: Commit after task or phase?
- Question 3: Use Git Notes or commit message for summaries?

4. Update `measure/workflow.md` based on responses
5. Update state: `{"last_successful_step": "2.6_workflow"}`

### 2.7 Memory Artifacts

1. Copy `assets/lessons-learned.md` to `measure/lessons-learned.md`
2. Copy `assets/tech-debt.md` to `measure/tech-debt.md`
3. Update `measure/index.md` with links:
   - `**Lessons Learned**`: `./lessons-learned.md`
   - `**Tech Debt Registry**`: `./tech-debt.md`
4. Announce: "Created **Lessons Learned** and **Tech Debt Registry** as bounded working-memory artifacts (50-line context budget each). Use `scripts/measure/check_context_budget.sh` to check limits."
5. Update state: `{"last_successful_step": "2.7_memory_artifacts"}`

### 2.8 Select Skills (Interactive)

1. **Analyze and Recommend:**
   - Instead of using a local catalog, use Vercel's Skills registry (`https://skills.sh/`).
   - Execute `npx -y skills search <query>` using keywords from the detected `tech-stack.md` (e.g., "react", "python", "postgres") as the search query.
   - Review the results and select the most relevant skills.

2. **Determine Mode:**
   - **If no relevant skills are found:** Announce "No additional agent skills were found for this project context. Skipping skill installation." and skip to 2.9.
   - **If relevant skills are found:** Present recommendations to the user.
   - Ask: "Based on your project context, I found the following skills via Vercel's registry: <List>. How would you like to proceed?"
   - Options:
     - **Install Recommended**: Install the recommended skills.
     - **Install find-skills**: Install the 'find-skills' skill to help discover more later.
     - **Skip**: Do not install any skills at this time.

3. **Process Selection & Install:**
   - If "Install Recommended": Execute `npx -y skills add <skill-names>`.
   - If "Install find-skills": Execute `npx -y skills add https://github.com/vercel-labs/skills --skill find-skills`.
   - If "Skip": Proceed without installation.

4. **Continue:** Proceed to Section 2.8.1.

### 2.8.1 Skill Reload Confirmation

1. **Execution Trigger:** This step MUST only be executed if you installed new skills in the previous section.
2. **Notify and Pause:** "New skills installed. Please run `/claude skills reload` to enable them. Let me know when you have done this." Do NOT use AskUserQuestion here.
3. **Wait for Confirmation:** Pause and wait for the user to confirm they have reloaded the skills.

### 2.9 Finalization

## 3.0 Initial Track Generation

### 3.1 Product Requirements (Greenfield only)

1. Announce defining requirements
2. Ask 3-5 questions about user stories, functional/non-functional requirements
3. Gather responses for track generation

### 3.2 Propose Initial Track

1. Analyze **Product Definition**, **Tech Stack**, and gathered requirements
2. Generate a single track title (usually MVP for greenfield)
3. Present for approval
4. If declined, ask for clarification

### 3.3 Create Track Artifacts

1. Create **Tracks Registry** (`measure/tracks.md`):
```markdown
# Project Tracks

This file tracks all major tracks for the project.

---

- [ ] **Track: <Track Description>**
  *Link: [./measure/tracks/<track_id>/](./measure/tracks/<track_id>/)*
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
6. **Create Track Index**: Create `measure/tracks/<track_id>/index.md`.
7. Generate and write **Specification** (`spec.md`) and **Implementation Plan** (`plan.md`).
8. Update track index with links to **Specification** and **Implementation Plan**.
   - Plan must follow TDD structure from **Workflow**
   - Include `[ ]` markers for all tasks and sub-tasks
   - Add phase completion tasks if defined in workflow
9. Update state: `{"last_successful_step": "3.3_initial_track_generated"}`

### 3.4 Finalize

1. Summarize all actions taken
2. Commit: `measure(setup): Add measure setup files`
3. Inform user they can start with `implement`
