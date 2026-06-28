# Measure

**Measure twice, code once.**

Measure is a spec-driven development framework for AI-assisted software projects. It organizes work into structured, trackable units called **tracks** — each with a specification and a phased implementation plan — so your AI coding assistant writes code that actually matches your intent.

> Measure is a community fork of [Google's Conductor framework](https://github.com/gemini-cli-extensions/conductor) for Gemini CLI, extended with persistent memory, skills integration, design workflows, and multi-agent support.

---

## Why Measure?

AI coding assistants are great at writing code, but terrible at remembering context. Without structure, every session starts from zero. Style guides drift. Tech stack decisions get ignored. Features wander off-spec. And when something breaks, reverting means hunting through commit hashes instead of rolling back a logical unit of work.

Measure fixes this by treating project context as a first-class artifact. It lives in your repo, versioned alongside your code, so every agent interaction starts with deep, persistent project awareness.

---

## The Workflow

Every piece of work follows the same lifecycle:

```
Context → Spec & Plan → Implement → Review
```

1. **Setup** — Define your product, tech stack, workflow, and style guides once.
2. **New Track** — Write a spec and break the work into phased tasks.
3. **Implement** — Your agent executes the plan, checkpoint by checkpoint.
4. **Review** — Verify against the spec, style guides, and product goals.

---

## Commands: When to Use What

Measure provides six commands. Each maps to a specific phase of the development lifecycle.

### `/measure:setup` — Project Onboarding
**When:** Once per project, or when resurrecting a project that lacks context.  
**What it does:** Scaffolds the `measure/` directory with product definition, tech stack, workflow, style guides, and design preferences. Optionally generates a visual design preview by fetching getdesign.md and rendering three recommended aesthetics as a tabbed HTML preview.  
**Artifact:** `measure/product.md`, `measure/tech-stack.md`, `measure/workflow.md`, `measure/design-preview.html` (if using getdesign.md), `DESIGN.md` (in project root), etc.

### `/measure:newTrack` — Planning
**When:** You have a new feature, bug, or chore to tackle.  
**What it does:** Guides you through writing a `spec.md` (requirements & acceptance criteria) and a `plan.md` (phased tasks with TDD checkpoints). Loads lessons-learned and tech-debt from previous tracks to surface gotchas early.  
**Artifact:** `measure/tracks/<track_id>/spec.md`, `measure/tracks/<track_id>/plan.md`, `measure/tracks/<track_id>/metadata.json`

### `/measure:implement` — Execution
**When:** A track's plan is approved and you're ready to build.  
**What it does:** The agent works through `plan.md` task by task, following your project's workflow (e.g., TDD: write test → fail → implement → pass). Loads project memory before starting and prompts for retrospective insights before finalizing.  
**Artifact:** Updated `measure/tracks/<track_id>/plan.md` (checked-off tasks), synchronized context files.

### `/measure:review` — Quality Gate
**When:** A track (or phase) is complete and you want to verify quality before merging.  
**What it does:** Checks the implementation against product guidelines, code style guides, the original spec, and recurring gotchas from `lessons-learned.md`. Can auto-commit fixes.  
**Artifact:** Review notes, potential fix commits, updated plan status.

### `/measure:status` — Progress Check
**When:** You want a quick overview of where things stand.  
**What it does:** Reads `measure/tracks.md` and active track plans to show completion percentages, current phase, project health indicators (memory artifacts age, open tech debt), and upcoming work.

### `/measure:revert` — Safe Rollback
**When:** Something went wrong and you need to undo work at a logical level.  
**What it does:** Analyzes git history (or jj) to understand which commits belong to a track, phase, or task. Reverts the logical unit rather than raw commit hashes.  
**Artifact:** Clean working tree with targeted rollback.

---

## Skills Integration

Measure doesn't just manage your project — it activates relevant **external skills** based on your tech stack.

During setup and new-track creation, Measure analyzes your project's dependencies and keywords, then recommends skills from the catalog (Firebase, DevOps, OWASP, etc.). When you approve, the agent loads those skills into context, giving you deep, domain-specific expertise without manual configuration.

| Skill Domain | Example Triggers |
|-------------|------------------|
| **Firebase** | `firebase`, `firestore`, `auth` dependencies |
| **DevOps / GCP** | `terraform`, `gcloud`, `skaffold` |
| **Security** | OWASP signals based on file patterns and dependencies |

Skills are loaded from the shared `.agents/skills/` convention, so they work across Claude Code, Gemini CLI, and any compatible agent.

---

## Features

- **📋 Tracks** — Structured units of work (features, bugs, chores) with `spec.md` and `plan.md`
- **🧠 Persistent Memory** — `lessons-learned.md` and `tech-debt.md` accumulate knowledge across tracks
- **🎨 Visual Design Preview** — Tabbed HTML preview of 3 getdesign.md aesthetics during setup
- **🛠️ Skills Integration** — Auto-detect project tech and activate relevant agent skills
- **🔍 Universal File Resolution** — Index-based protocol so agents always find the right file
- **🔄 VCS-Agnostic Revert** — Roll back by track, phase, or task (Git + Jujutsu support)
- **📐 Plan Mode Support** — Native integration with agent plan-mode tools for safe planning
- **✅ Quality Gates** — Review against style guides, product guidelines, and the original plan

---

## Supported Platforms

Measure works across multiple AI agent environments:

| Platform | Format | Installation |
|----------|--------|-------------|
| **Claude Code** | `.skill` bundle | `claude skills add /path/to/measure.skill` |
| **Gemini CLI** | Extension | `gemini extensions install <repo-url> --auto-update` |
| **Shared Skills** | `.agents/skills/` | Copy `claude-skills/measure/` to your shared skills directory |

---

## Generated Artifacts

Measure scaffolds a `measure/` directory in your project root, plus a design definition at the project root:

```
measure/
├── product.md              # Product vision and features
├── product-guidelines.md   # Brand, voice, and design standards
├── tech-stack.md          # Technology choices and rationale
├── workflow.md            # Development workflow and quality gates
├── design-preview.html    # Visual comparison of 3 getdesign.md aesthetics
├── lessons-learned.md     # Curated project memory (≤50 lines)
├── tech-debt.md           # Known shortcuts and deferred work
├── index.md               # Universal File Resolution index
├── tracks.md              # Master list of all tracks
├── code_styleguides/      # Language-specific style guides
└── tracks/
    └── <track_id>/
        ├── spec.md        # Track specification
        ├── plan.md        # Implementation plan
        └── metadata.json  # Track metadata

DESIGN.md                   # Visual identity & design system (project root)
```

---

## Bundled Agents & Skills

Measure ships with a curated set of role-specific **subagents** and **skills** so the framework can run end-to-end with deterministic contracts instead of relying on a single generalist model.

### Agents (`agents/`)

The `agents/` directory contains subagent definitions that can be invoked from your AI assistant's `task` tool.

**Measure framework agents** — orchestrate the spec-driven TDD lifecycle:

| Agent | Role |
|-------|------|
| `measure-strategy` | Creates / refreshes the test strategy before phase execution |
| `measure-mid-red` | Writes targeted failing tests and plan evidence for the Red phase |
| `measure-jr-green` | Implements Green-phase behavior after Red tests are committed |
| `measure-adversarial-testing` | Adds boundary, failure-path, integration, and regression tests |
| `measure-review-a-correctness` | Reviews for correctness, architecture, and meaningful tests |
| `measure-review-b-security` | Reviews for security, authorization, validation, and data handling |
| `measure-review-c-ux-api` | Reviews for UX and API end-to-end contract gaps |
| `measure-ux-browser-review` | Multimodal browser UX review for user-facing changes |
| `measure-phase-acceptance` | Independent phase acceptance against spec, plan, tests, and commits |
| `measure-final-acceptance` | Final track acceptance before closeout or archive |
| `measure-closeout` | Archives a track and verifies closeout artifacts |
| `measure-orchestrator-audit` | Audits the orchestrator for anti-patterns |

**Coder agents** — model-routed coding subagents you can delegate to from any phase:

- `coder-deepseek-v4-pro`, `coder-deepseek-v4-flash`
- `coder-kimi-k2p7`
- `coder-minimax-m3`
- `coder-xiaomi-mimo-v2-5`, `coder-xiaomi-mimo-v2-5-pro`
- `coder-vocengine-ark-code-latest`, `coder-vocengine-glm-5-2`
- `coder-openrouter-free`
- `coder-orchestrator` — multi-model dispatch

Each `coder-*` agent is tuned for a specific cost/quality profile (see the agent's frontmatter). Pick the cheapest one whose capability matches the phase.

### Skills (`skills/`)

Bundled skill packs that activate automatically when their triggers match:

| Skill | Purpose |
|-------|---------|
| `measure` | The core Measure framework skill |
| `measure-orchestrator` | Run a track as a coordinated sequence of focused subagents with deterministic inter-phase checks (`scripts/measure_interphase_checks.py`) |
| `measure-orchestrator-workspace` | Workspace-level orchestration utilities |
| `build-graph` | Build and query a SQLite knowledge graph of a TypeScript codebase for structural reasoning |

To install the bundled skills:

```bash
# Claude Code
cp -r skills/* ~/.claude/skills/

# Shared .agents/skills/ convention (any agent)
cp -r skills/* ~/.agents/skills/
```

### Related Projects

- **[repo-graph](https://github.com/bodangren/repo-graph)** — The standalone CLI behind the `build-graph` skill. Scans TypeScript codebases via AST parsing and stores the knowledge graph in SQLite, so agents can answer structural questions ("find all callers of", "what breaks if I change", "trace from X to Y") cheaply.

---

## Quick Start

### 1. Install Measure

**Claude Code:**
```bash
claude skills add /path/to/claude-skills/measure
```

**Gemini CLI:**
```bash
gemini extensions install <repo-url> --auto-update
```

**Shared skills (any agent):**
```bash
cp -r claude-skills/measure ~/.agents/skills/
```

### 2. Set Up Your Project

```bash
/measure:setup
```

Measure will guide you through defining your product, tech stack, and workflow preferences. If you opt for getdesign.md recommendations, you'll get a `measure/design-preview.html` with 3 tabbed design options to review in your browser.

### 3. Start Your First Track

```bash
/measure:newTrack "Add OAuth login with Google and GitHub"
```

Review the generated spec and plan, then:

```bash
/measure:implement
```

### 4. Review and Iterate

```bash
/measure:review
```

---

## Origin & Attribution

Measure started as a fork of [Google's Conductor](https://github.com/gemini-cli-extensions/conductor), the spec-driven development framework built for Gemini CLI. We've preserved the core philosophy — **Context → Spec & Plan → Implement** — while extending it with:

- Persistent project memory (lessons-learned, tech-debt)
- Cross-platform skill packaging (Claude Code, Gemini CLI, shared skills)
- Visual design preview with getdesign.md integration
- Plan mode policies and safe execution boundaries
- VCS abstraction beyond Git
- An expanded skills catalog with auto-activation

If you're coming from Conductor, the core concepts (tracks, specs, plans, workflow) are identical. The command namespace has moved from `/conductor:*` to `/measure:*`, and the scaffold directory from `conductor/` to `measure/`.

---

## Contributing

Contributions are welcome. Please open an issue or pull request.

## License

Apache License 2.0
