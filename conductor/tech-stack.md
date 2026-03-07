# Tech Stack

## Primary Format

**Markdown** is the sole format for all workflow specifications, templates, project artifacts, and documentation. No HTML, no compiled output.

**JSON** is used for structured metadata files (`metadata.json`, `setup_state.json`).

## Distribution Formats

| Format | Location | Target Runtime |
|--------|----------|---------------|
| Claude Skills bundle | `claude-skills/conductor/` | Claude Code (Anthropic) |
| Gemini CLI extension | `codex-skills/conductor/` | Gemini CLI (Google) |
| Templates | `templates/` | Copied to user projects at setup time |

The Claude Skills bundle is a `.skill` zip archive. The Gemini CLI extension uses the extension protocol defined by Gemini CLI.

## Tooling

- **Git**: Version control, audit trail, and revert mechanism. Git notes are used for task summaries attached to commits.
- **No build tools**: No package managers, compilers, or transpilers. The project is pure Markdown and JSON.
- **No test runners**: Verification is manual (workflow-guided) rather than automated test suites.

## Architecture

```
conductor-repo/
├── templates/           # Canonical templates copied to user projects at setup
│   ├── workflow.md
│   └── code_styleguides/
├── claude-skills/conductor/    # Claude Code skill bundle source
│   ├── SKILL.md                # Skill manifest (name, description, trigger)
│   ├── references/             # Step-by-step command workflows
│   │   ├── setup.md
│   │   ├── new-track.md
│   │   ├── implement.md
│   │   ├── review.md
│   │   ├── status.md
│   │   └── revert.md
│   └── assets/                 # Files the skill copies into user projects
│       ├── workflow.md
│       └── code_styleguides/
└── codex-skills/conductor/     # Gemini CLI extension source (parallel structure)
```

## Versioning

Semantic versioning via git tags. Changes to workflow steps that alter AI agent behavior increment the minor version. Breaking changes to directory structure or file formats increment the major version.

## Design Constraints

- Workflow files must be interpretable by AI agents with no external tool dependencies.
- All file paths referenced in workflows must be resolvable via the Universal File Resolution Protocol (index-based lookup).
- The system must work offline; no external API calls are made by the workflow itself.
