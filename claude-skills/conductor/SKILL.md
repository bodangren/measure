---
name: conductor
description: |
  Spec-driven development framework for AI-assisted software projects. Conductor organizes work into "tracks" (features, bugs, or chores) with specifications and phased implementation plans, following Test-Driven Development principles.

  Use this skill when:
  - User wants to set up a new project with Conductor ("conductor setup", "set up conductor", "initialize conductor")
  - User wants to create a new track/feature ("new track", "create track", "add feature", "plan feature")
  - User wants to implement tasks from a track ("implement", "start implementing", "work on track", "execute plan")
  - User wants to review completed work ("review", "code review", "verify track")
  - User wants to check project status ("conductor status", "show progress", "track status")
  - User wants to revert previous work ("revert", "undo track", "rollback task")
  - User mentions conductor commands or spec-driven development
---

# Conductor

Spec-driven development framework that organizes AI-assisted software development into structured, trackable units of work.

## Core Concepts

- **Track**: A high-level unit of work (feature, bug fix, or chore) with its own spec and plan
- **Spec**: Detailed requirements and acceptance criteria (`spec.md`)
- **Plan**: Phased implementation tasks following TDD methodology (`plan.md`)
- **Workflow**: Development procedures including TDD, quality gates, and commit guidelines
- **Lessons Learned**: Curated working-memory file (`lessons-learned.md`) capturing architecture decisions, recurring gotchas, useful patterns, and planning insights across tracks
- **Tech Debt Registry**: Bounded working-memory file (`tech-debt.md`) tracking known shortcuts and deferred work with severity and status
- **Universal File Resolution Protocol**: Index-based file lookup that resolves named references (e.g., **Product Definition**) to file paths via `index.md`

## Directory Structure

```
conductor/
├── index.md                # Index for file resolution
├── product.md              # Product vision and features (Product Definition)
├── product-guidelines.md   # Brand, voice, and design guidelines (Product Guidelines)
├── tech-stack.md          # Technology choices and rationale (Tech Stack)
├── workflow.md            # Development workflow and quality gates (Workflow)
├── tracks.md              # Master list of all tracks (Tracks Registry)
├── lessons-learned.md     # Curated project memory (bounded, 50-line max)
├── tech-debt.md           # Known shortcuts and deferred work (bounded, 50-line max)
├── code_styleguides/      # Language-specific style guides
├── tracks/                # Individual track directories
│   └── <track_id>/
│       ├── metadata.json  # Track metadata
│       ├── spec.md        # Track specification (Specification)
│       └── plan.md        # Implementation plan (Implementation Plan)
└── archive/               # Completed/archived tracks
```

## Commands

### Setup
Initialize Conductor in a new or existing project. Read [references/setup.md](references/setup.md) for the full workflow.

### New Track
Create a new track with spec and plan. Read [references/new-track.md](references/new-track.md) for the full workflow.

### Implement
Execute tasks from a track's plan following the project workflow. Loads project memory (lessons learned, tech debt) before starting, and prompts for retrospective insights before finalizing. Read [references/implement.md](references/implement.md) for the full workflow.

### Review
Review completed work against product guidelines, code styleguides, and the original plan. Checks for recurring gotchas from lessons learned. Read [references/review.md](references/review.md) for the full workflow.

### Status
Display project progress overview including track breakdown and project health indicators. Read [references/status.md](references/status.md) for the full workflow.

### Revert
Roll back previous work by track, phase, or task using Git history. Read [references/revert.md](references/revert.md) for the full workflow.

## Task Status Markers

- `[ ]` - Pending
- `[~]` - In Progress
- `[x]` - Completed

## Key Principles

1. **Plan is Source of Truth**: All work tracked in `plan.md`
2. **Test-Driven Development**: Write tests before implementation
3. **High Code Coverage**: Target >80%
4. **Atomic Commits**: Commit after each task
5. **Git Notes**: Attach task summaries for auditability

## Assets

- **Workflow Template**: [assets/workflow.md](assets/workflow.md)
- **Code Styleguides**: [assets/code_styleguides/](assets/code_styleguides/)
- **Lessons Learned Template**: [assets/lessons-learned.md](assets/lessons-learned.md)
- **Tech Debt Template**: [assets/tech-debt.md](assets/tech-debt.md)
