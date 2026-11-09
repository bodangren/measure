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
| OpenCode plugin | `plugins/opencode-measure-guard/` | OpenCode 2 server and terminal plugin package (root entries `index.ts` and `tui.ts`; the host loads the folder, not `package.json` exports), installed from `main` into `~/.config/opencode/plugins/opencode-measure-guard` without `tests/`; its `commands/` into `~/.config/opencode/commands`; `agents/measure-*.md` into `~/.config/opencode/agents` |
| DSH plugin bundle | `plugins/dsh-measure-guard/` | DeepSeek Harness profile bundle: one Host plugin row (`index.js`, plain ESM JavaScript) plus a hand-written browser half (`client.js`, the documented `window.__ModuleLoader__.load` Lazy-CJS format, declared by `dsh.client`). The shared `.ts` core is loaded by Node's built-in type stripping (Node >= 24.9, the DSH floor); no build step and no package manager. Installed by `bin/install-measure-skill` into `~/.dsh/profiles/web/plugins/` and selected by one profile `cordis.patch.yml` row. |
| Measure environment CLI | `bin/measure-dsh` | DeepSeek Harness environment CLI: copies `plugins/dsh-measure-guard/` into the resolved profile (`--dsh-home`/`$DSH_HOME`, `--profile`), writes one marker-managed `cordis.patch.yml` insert row, verifies the skill copies and the running route, and uninstalls the layer. The installer's DSH plugin target is removed by track `dsh_measure_dev_20261107`; the CLI is the DSH plugin writer. |

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
| `skill_distribution_repair_20261005` | `bin/install-measure-skill` (rewritten: `--ref`, `--check`, `--adopt`, `--cron`) | **bash** test scripts under `measure/archive/skill_distribution_repair_20261005/scripts/`. Each test runs the installer against a temporary git repository, a temporary `HOME`, and a fake `crontab` on `PATH`. | The installer writes into the home folder and into the crontab. A manual check cannot prove the local-edit protection, the in-place writes, or the idempotent cron changes without a risk to the real files. |
| `opencode_plugin_20261021` | None. The track adds an OpenCode 2 plugin package (`plugins/opencode-measure-guard/`): TypeScript that the OpenCode host loads and compiles under Bun. No build step; `node_modules/` is not committed. | **`bun test plugins/opencode-measure-guard`** (`tests/*.test.ts`, a fake plugin context, temporary projects from the real `measure/` files), **`bun x tsc --noEmit -p plugins/opencode-measure-guard`** after `bun install` in that folder (dev-only types from `@opencode/plugin`), and the **running OpenCode service** for the load checks (`loading plugin` in the service log, one `opencode run` for the live deny). | The plugin denies or allows tool calls and sends prompts; a manual check cannot prove each guard in each mode. OpenCode itself runs plugins under Bun, so Bun is already on every machine that runs the plugin; the project adds no runtime and no bundler. The type check against the published plugin types catches hook-signature drift between OpenCode releases. |
| `spec_review_gate_20261030` | `measure_interphase_checks.py role-gate --role spec-review` (new role gate) and the `dispositions:` check of `role-gate` (extended). Python standard library only. No new package and no build step. | **bash** contract tests and **`python3 -m unittest`** under `tests/spec_review_gate/`, run by `tests/spec_review_gate/run.sh`. Python tests run the checker as a subprocess in temporary git repositories. | The checker decides gate results. A manual check cannot prove each rejection case, each exit code, or each exact message. |
| `dsh_measure_guard_20261107` | None (no executable CLI). The track adds a DSH bundle (`plugins/dsh-measure-guard/`): plain ESM JavaScript the DSH Host loads, a hand-written browser bundle in the documented Lazy-CJS format, and a parity copy of the shared `.ts` core loaded by Node's type stripping. No build step, no package manager, no `node_modules`. | **`node --test plugins/dsh-measure-guard/tests/*.test.js`** (`node:test` over a string fixture project and the copied core) and **`bash plugins/dsh-measure-guard/scripts/check-parity.sh`** (the shared-core parity gate). The live check is one DSH profile patch row with the running Web GUI. | The plugin denies or allows tool calls and injects prompts; a manual check cannot prove each guard in each mode. Node >= 24.9, which DSH already requires, strips the copied `.ts` core with no build step, and `node --test` needs no package manager. |
| `dsh_idle_compaction_20261110` | None (no executable CLI). The track adds a DSH Host plugin (`plugins/dsh-idle-compaction/`): plain ESM JavaScript loaded from a profile path, with a pure policy module and no `@deepseek-ai/*` import, no build step and no `node_modules`. | **`node --test plugins/dsh-idle-compaction/tests/*.test.js`** (`node:test` over the pure policy and a fake Cordis context) and the live Web profile for the short-idle-budget proof recorded under `measure/runs/dsh_idle_compaction_20261110/`. | The plugin decides when to call a session's compaction backend; a manual check cannot prove the activity classification, the one-per-idle-window rule, the backoff, the agent binding, or the abort/drain. Node >= 24.9 is already the DSH floor, and `node --test` needs no package manager. |
| `dsh_measure_dev_20261107` | `bin/measure-dsh` (new) | **`bash tests/dsh/run.sh`** (contract tests in a temporary world: fake HOME, DSH home, profile and patch file, a real copy of the plugin package and the skills, and a configurable installer stub) plus **`node --test plugins/dsh-measure-guard/tests/*.test.js`** for the workflow commands and the route identity header, and the live `--check --live`. | The CLI edits a user-owned YAML file, copies a package, and stamps it; a manual check cannot prove idempotency, the foreign-row refusal, atomic replacement, the `[]` uninstall remainder, or the local-edit/stale-file rules. bash is already the installer's test layer; no new runner. |

## Architecture

```
measure-repo/
├── skills/measure/           # Canonical shared-skill source
│   ├── SKILL.md
│   ├── references/
│   └── assets/
├── skills/measure-orchestrator/  # Multi-agent orchestration skill
├── skills/build-graph/       # Knowledge-graph skill (repo-graph CLI)
├── agents/                   # 14 measure-* role definitions
├── bin/install-measure-skill # Installer (reads main; cron-capable)
├── bin/install-targets.tsv   # Bundle-to-target map for the installer
├── mods/measure-guard/       # Claude Code mod
├── plugins/opencode-measure-guard/  # OpenCode 2 plugin (server + terminal), core copied from the mod
├── plugins/dsh-measure-guard/  # DSH bundle (Host plugin + hand-written Client half), core copied from the mod
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
