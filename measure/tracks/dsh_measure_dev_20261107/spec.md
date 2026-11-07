# Specification: DSH Measure development environment

Track: `dsh_measure_dev_20261107`
Type: feature · Spec mode: classic FR list
Author model: deepseek-flash · Date: 2026-11-07
Review: three independent reviewers from three model families (see
[spec-review.md](./spec-review.md) once run).
Design: [design.md](./design.md) fixes the file layout, the script contract, the
command messages, the managed block format, and the test matrix.

## Overview

Measure is a set of agent skills, agent roles, and guard-rail adapters. It works
in any harness that loads skills, and this repository ships the `measure` skill,
the `measure-orchestrator` skill, 14 agent roles, a Claude Code mod, and the
OpenCode 2 plugin. The DeepSeek Harness (DSH) already loads the `measure` skill
from `~/.agents/skills` and the project's `AGENTS.md`, and the
`dsh_measure_guard_20261107` track built a working DSH guard plugin.

What a DSH workstation still lacks is the environment around that plugin. The
guard is installed today as a hand-written profile row pointing at a working
tree, the guard mode is `advise` rather than `guard`, the skill copy on this
machine is incomplete (its `references/` and `assets/` are missing), the Measure
workflows are not reachable as commands, the Measure roles have no mapping to
DSH subagents, and nothing tells a user whether a DSH installation can develop
with Measure.

This track turns that hand-wired setup into one repeatable, verifiable
environment: one command installs, checks, and removes the profile layer; the
plugin gains the Measure workflow commands; the orchestrator skill gains a DSH
reference; and a guide plus a live check close the loop. The track does not
change DSH itself and does not change the installer contract.

## Functional Requirements

### The environment command (L1)

**FR-1 — `bin/measure-dsh` CLI.** One POSIX bash entry point with three modes:
`install`, `--check`, and `uninstall` (plus `--help`). It resolves the DSH home
from `$DSH_HOME` or `~/.dsh`, the profile from `--profile` (default `web`), the
guard mode from `--mode advise|guard|strict` (default `guard`), and the skill
installer ref from `--ref` (default `main`). `install` and `uninstall` accept
`--dry-run`; `--check` accepts `--source`, `--live`, `--session`, and `--json`;
`uninstall` accepts `--keep-copy`. Every mode prints one line per check with
`PASS`, `FAIL`, `SKIP`, or `WARN`, and `--check` exits 0 only when no item
failed. The full contract (flags, exit codes, output columns) is fixed in
`design.md §2`.

**FR-2 — Install.** `install` performs, in order: (a) prerequisite checks (Node
>= 24.9, the profile folder exists, `plugins/dsh-measure-guard/` present);
(b) the foreign-row refusal of FR-3; (c) `mkdir -p <profile>/plugins`; (d) the
skill install step unless `--no-skills` — it runs
`bin/install-measure-skill --ref <ref>`, so the installer remains the only
writer of the skill copies; (e) copies `plugins/dsh-measure-guard/` without
`tests/` into `<profile>/plugins/dsh-measure-guard/` and writes its own stamp
`<profile>/plugins/dsh-measure-guard/.measure-dsh-install` (a per-file sha256
list, the installer's local-edit convention); (f) writes one managed block into
`<profile>/cordis.patch.yml` whose `insert` row has `id: measure-guard`,
`name: ./plugins/dsh-measure-guard/index.js`, and `config.mode` from the flag;
(g) prints the checklist, the restart note, and any remaining operator action.
The plugin copy is **the CLI's write**, not the installer's: the installer's DSH
target is fixed to `<dsh-home>/profiles/web/plugins` and cannot honour
`--profile` or `--dsh-home`, so this track removes that target row from
`bin/install-targets.tsv` and the CLI is the DSH plugin writer (see FR-11).
Every file write is atomic (temp file, then rename).

**FR-3 — Foreign-row refusal.** A row with `id: measure-guard` outside the
managed block (for example a hand-written row from an earlier manual install) is
never overwritten. `install` and `--check` report it with `FAIL` and name the
block to remove; `uninstall` removes only the managed block and the installed
plugin copy. The check and install are therefore safe on a profile someone else
configured.

**FR-4 — Check.** `--check` reports, at least: the skill copies (`measure` and
`measure-orchestrator` resolved through one documented root order, real paths
de-duplicated, every repository file present in the installed copy), the plugin
copy (present, its stamp lists exactly the copied files with matching hashes),
the profile block (`id`, `name`, and `mode` exactly as `design.md §3`), the
plugin module (imports cleanly under plain Node and exports `name`, `inject`,
`apply`), and, with `--live`, the state route. The live session id is
`--session`, else `$DSH_SESSION_ID`, else the item is `SKIP` with a hint.
`--check` never writes. A missing `pnpm` is not an error; a different
`DSH_HOME` or agents home is honoured through the environment.

**FR-5 — Uninstall.** `uninstall` removes the managed block and, by default,
the plugin copy `<profile>/plugins/dsh-measure-guard/` that it owns;
`--keep-copy` keeps the copy. It reports what it kept (skills, foreign rows, and
user-edited files), never removes a foreign row, and exits non-zero only when it
could not remove something it owns.

### The workflow command surface (L2)

**FR-6 — Measure workflow commands in the plugin.** `plugins/dsh-measure-guard`
registers these host commands through `ctx.commands.register`: `measure-setup`,
`measure-new-track`, `measure-new-track-set`, `measure-implement`,
`measure-review`, `measure-revert`, `measure-doctor`, and `measure-orchestrate`.
Each handler submits one instruction message to the receiving agent (the
documented command-producer pattern: the handler may use the receiving `Agent`),
so the workflow starts without the user retyping it. The message names the
canonical `measure` skill and the reference file to follow
(`skills/measure/references/<name>.md`) rather than duplicating the workflow
text. The existing `measure-status`, `measure-off`, and `measure-on` keep their
behaviour.

**FR-7 — Command guard rails.** A workflow command other than `measure-setup`
returns an error text naming `/measure-setup` when the session's project has no
`measure/` folder, and submits nothing. A command whose workflow reference is
missing from the installed skill returns an error naming the installer step
instead of submitting a message that points at a missing file. Definitions are
registered once, carry a one-line description for discovery, and never collide
with the `measure` skill name.

### The agent team (L3)

**FR-8 — Measure roles on DSH subagents.** A new reference
`skills/measure-orchestrator/references/dsh.md` maps each Measure role to a DSH
subagent spawn: the `subagent` (and `subagent_fork`) tools, the provider/model
selection available in the profile, a role prompt template, independence rules,
the three-family review rule, and how the role uses the guard's plan markers.
`skills/measure-orchestrator/SKILL.md` links the reference from its contents
list. The reference names only APIs and models that exist in this installation
(DSH 0.2.2-rc.1) and marks anything uncorroborated.

### Documentation and verification (L4)

**FR-9 — Guide and README.** A new `docs/dsh.md` is the quickstart: what the
environment installs, the three modes, the workflow commands, the agent-team
mapping, the check list, uninstall, and troubleshooting (the restart note, a
foreign row, an incomplete skill copy). `README.md` names DSH next to the other
two harnesses and links the guide; `CHANGELOG.md` gains one entry.

**FR-10 — Live environment and evidence.** On this machine, after the track: the
guard plugin is installed from the profile copy (not the working tree), the
profile row is the managed block, the mode is `guard` (the operator may switch),
`--check` is green, the state route answers, the band shows the active track,
the workflow commands appear in the command catalog, and the track records the
evidence in the task git notes and `measure/runs/`. Re-importing the installed
copy without a host restart is expected (the row's module URL changed) but is
proven, not assumed; if the recomposition does not happen, the host restart is
the recorded operator action and the evidence falls back to the file, record,
and route checks from the loaded instance.

**FR-11 — Distribution alignment.** The DSH plugin's installer target row is
removed from `bin/install-targets.tsv` (the CLI owns that copy), the guard
plugin's installer-contract test `plugins/dsh-measure-guard/tests/install.sh` is
replaced by the CLI contract tests, and the guard plugin README plus
`measure/tech-stack.md` name `bin/measure-dsh` as the DSH installer.

## Non-Functional Requirements

- **NFR-1** No new runtime dependency. `bin/measure-dsh` is POSIX bash; the
  tests are bash scripts and `node --test` where a JS assertion is simpler.
- **NFR-2** No unbounded writes. The CLI's own writes land under the effective
  DSH home/profile, are atomic, and are reversible by `uninstall`; the skill
  step invokes `bin/install-measure-skill` as the documented external writer of
  its own targets; no `sudo`, no network, no write outside those roots.
- **NFR-3** The installer stays the only skill writer. `measure-dsh` calls it
  and verifies its result; it never copies skill files itself.
- **NFR-4** POSIX only, consistent with the repository.
- **NFR-5** The guide and every message are plain English. The script makes no
  external network call; `--check --live` reads only the loopback profile
  route.

## Acceptance Criteria

- Given a DSH profile with no measure-guard row, when `bin/measure-dsh install`
  runs, then the plugin copy exists with its stamp, exactly one managed block
  points at it, and `--check` exits 0.
- Given the same environment, when `install` runs twice, then the second run
  changes nothing and `--check` still exits 0.
- Given a profile with a hand-written `id: measure-guard` row outside the
  managed block, when `install` or `--check` runs, then it reports `FAIL` with
  the block to remove and does not write anything.
- Given a profile with a managed block, when `uninstall` runs, then the block
  and the installed copy are gone and every other row and file is unchanged;
  with `--keep-copy`, the copy stays.
- Given an incomplete `~/.agents/skills/measure` copy, when `--check` runs,
  then it lists the missing files and exits non-zero.
- Given a project with `measure/` and a session, when `/measure-implement` runs,
  then the agent receives exactly one instruction message naming the implement
  reference and nothing is submitted to the model before the handler returns.
- Given a project without `measure/`, when `/measure-implement` runs, then it
  returns the setup hint and submits nothing.
- Given a running DSH profile with the plugin installed, when `--check --live`
  runs, then the state route answers and the check is green.
- Given the repository, when the guide's links are resolved, then every target
  exists and names only APIs present in this DSH installation.

## Out of Scope

- Editing DSH itself (it is an installed npm package) and adding DSH agent
  presets.
- Porting the `agents/measure-*.md` frontmatter into a DSH-native format; the
  DSH mapping is a documented reference, not a new role registry.
- Changing the installer contract, the skill content, or the guard's decision
  semantics.
- Merging the `feat/dsh-measure-guard` branch; the branch stack is the
  operator's decision.
- Windows.

## Accepted Risks

- **The script edits a user-owned YAML file.** Accepted with the managed-block
  marker, atomic writes, the foreign-row refusal, and `uninstall`. A YAML
  re-serialization is deliberately avoided: the rest of the file is preserved
  byte for byte.
- **The check can pass while the running host is stale.** `--check` proves the
  files; `--check --live` proves the route; a host started before the install
  still needs the restart the checklist prints.
- **The guard defaults to `guard`, so an empty plan blocks writes.** That is
  the Measure rule; `/measure-off` is the escape hatch and the guide says so.
