# Product Guidelines

## Voice & Tone

- **Precise and instructional**: Instructions must be unambiguous for AI agents. If a step can be interpreted two ways, rewrite it.
- **Active voice**: "Read the file" not "The file should be read."
- **Imperative mood for steps**: "Announce...", "Read...", "Write..." — not "You should announce..."
- **Bold critical instructions**: Use `**CRITICAL:**` and `**HALT**` for non-negotiable conditions.
- **Numbered steps for sequences**: Always number sequential steps. Use nested numbering (e.g., 3.1, 3.2) for sub-steps.

## Documentation Style

- All documentation in Markdown.
- Use H2 (`##`) for major sections, H3 (`###`) for sub-sections.
- Code blocks for all shell commands and file content examples.
- Checkboxes (`[ ]`, `[~]`, `[x]`) for task status — never use other markers.
- Bold file names and key terms on first use in a section: `**Specification**`, `**Tracks Registry**`.

## Naming Conventions

- **Track IDs**: `shortname_YYYYMMDD` (lowercase, underscores, no spaces)
- **File names**: lowercase with hyphens (`new-track.md`, `tech-stack.md`, `lessons-learned.md`)
- **Directory names**: lowercase with hyphens (`code_styleguides/` is an exception for legacy compatibility)
- **Status markers**: `[ ]` pending, `[~]` in progress, `[x]` complete — consistent everywhere

## Workflow Design Principles

- Every workflow step must be deterministic: an AI agent should never need to guess what to do next.
- Failure modes must be explicitly handled. Every protocol that can fail must specify a HALT condition and a user-facing message.
- All file operations must be validated. If a file read fails, halt and report; never silently continue.
- New features are additive: do not remove or restructure existing workflow steps when adding new ones.
- Optional features degrade gracefully: if a file doesn't exist, warn but do not halt (unless it is a core context file).

## Terminology

Use these terms consistently:

| Term | Meaning |
|------|---------|
| Track | A unit of work (feature, bug, chore) with spec and plan |
| Specification / Spec | The `spec.md` file describing requirements |
| Implementation Plan / Plan | The `plan.md` file with phased tasks |
| Tracks Registry | `conductor/tracks.md` — the master list |
| Workflow | `conductor/workflow.md` — the task lifecycle rules |
| Universal File Resolution Protocol | The index-based file lookup mechanism |
