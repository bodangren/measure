# Tech Stack

## Primary Format

**Markdown** is the sole format for all workflow specifications, templates, project artifacts, and documentation. No HTML, no compiled output.

**JSON** is used for structured metadata files (`metadata.json`, `setup_state.json`).

## Distribution Formats

| Format | Location | Target Runtime |
|--------|----------|---------------|
| Canonical shared skill | `skills/measure/` | Installed from `main` into `~/.claude/skills/measure` and `~/.agents/skills/measure` |
| Orchestration skills and roles | `skills/measure-orchestrator/`, `skills/build-graph/`, `agents/measure-*.md` | Installed from `main` into `~/.agents/` (and `~/.claude/skills/build-graph`) |
| Claude Skills bundle | `claude-skills/measure/` | A copy of `skills/measure/` for `claude skills add`; the Definition of Done keeps it equal |
| Claude Code mod | `mods/measure-guard/` | Claude Code function-hook plugin, loaded with `claude --plugin-dir` or `CLAUDE_CODE_PLUGIN_DIRS` |

`bin/install-measure-skill` reads the bundles and `bin/install-targets.tsv` from
`main` (never from the working tree) and copies them into each target in place.
A stamp file in each target protects local edits. `--cron install` adds an hourly
job, and `--check` reports differences without a write. The contract is in the
`skill_distribution_repair_20261005` track folder.

## Tooling

- **Git**: Version control, audit trail, and revert mechanism. Git notes are used for task summaries attached to commits.
- **No build tools**: No package managers, compilers, or transpilers. The project is pure Markdown and JSON.
- **No general-purpose test runners**: Verification is manual (workflow-guided) rather than automated test suites, *except* where a specific track introduces an executable CLI that requires deterministic, repeatable checks. See **Tooling Exceptions** below.

### Tooling Exceptions (track-scoped)

Tracks that introduce a new executable CLI must declare their verification tooling in this section **before** writing tests or implementation. This makes the exception visible to reviewers and to future tracks.

| Track | Introduced CLI(s) | Verification layer | Why an exception is justified |
|---|---|---|---|
| `agent_performance_benchmarking_20260527` (cancelled 2026-10-05; files in `measure/archive/`) | `bin/measure-benchmark run` / `bin/measure-benchmark score` / `bin/measure-benchmark report` (new) | **bash + `jq`** assertion scripts under `measure/archive/agent_performance_benchmarking_20260527/scripts/` | The track's whole purpose is measuring model behavior against a deterministic contract. A workflow-only/manual gate cannot prove a "command not found" Red, cannot diff golden help text, and cannot `jq` a JSON output. The verification layer is itself part of the track deliverable; it is not a project-wide test runner. |
| `measure_guard_20261004` | None. The track adds a Claude Code mod (`mods/measure-guard/`): a TypeScript hooks module that the Claude Code engine loads and compiles. No package manager or build step. | **`claude plugin test mods/measure-guard`** (`*.test.ts` files, engine test kit `claude-code/testing`) and **`claude plugin validate mods/measure-guard`** | The mod is executable TypeScript with guard logic (deny or allow tool calls). A manual check cannot prove that a guard denies the correct calls in each mode. The test runner and the validator are part of the Claude Code binary, so the project still has no package manager. |
| `skill_distribution_repair_20261005` | `bin/install-measure-skill` (rewritten: `--ref`, `--check`, `--adopt`, `--cron`) | **bash** test scripts under `measure/tracks/skill_distribution_repair_20261005/scripts/`. Each test runs the installer against a temporary git repository, a temporary `HOME`, and a fake `crontab` on `PATH`. | The installer writes into the home folder and into the crontab. A manual check cannot prove the local-edit protection, the in-place writes, or the idempotent cron changes without a risk to the real files. |

## Architecture

```
measure-repo/
├── skills/measure/           # Canonical shared-skill source
│   ├── SKILL.md
│   ├── references/
│   └── assets/
├── skills/measure-orchestrator/  # Multi-agent orchestration skill
├── skills/build-graph/       # Knowledge-graph skill (repo-graph CLI)
├── agents/                   # 13 measure-* role definitions
├── bin/install-measure-skill # Installer (reads main; cron-capable)
├── bin/install-targets.tsv   # Bundle-to-target map for the installer
├── mods/measure-guard/       # Claude Code mod
└── claude-skills/measure/    # Copy of skills/measure for claude skills add
    ├── SKILL.md                # Skill manifest (name, description, trigger)
    ├── references/             # Step-by-step command workflows
    │   ├── setup.md
    │   ├── new-track.md
    │   ├── implement.md
    │   ├── review.md
    │   ├── status.md
    │   └── revert.md
    └── assets/                 # Files the skill copies into user projects
        ├── workflow.md
        └── code_styleguides/
```

## Versioning

Semantic versioning via git tags. Changes to workflow steps that alter AI agent behavior increment the minor version. Breaking changes to directory structure or file formats increment the major version.

## Design Constraints

- Workflow files must be interpretable by AI agents with no external tool dependencies.
- All file paths referenced in workflows must be resolvable via the Universal File Resolution Protocol (index-based lookup).
- The system must work offline; no external API calls are made by the workflow itself.
