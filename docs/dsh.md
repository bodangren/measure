# Developing with Measure on the DeepSeek Harness

This guide turns a DeepSeek Harness (DSH) installation into a Measure
development environment: the `measure` skill, the guard plugin with its
composer band and status panel, the Measure workflow commands, and a mapping of
the Measure roles to DSH subagents. One CLI installs, checks, and removes the
whole profile layer.

Measure is harness-agnostic; DSH is the third harness with guard rails, after
Claude Code and OpenCode 2. See [`../README.md`](../README.md) for the framework
itself and [`../skills/measure/`](../skills/measure/) for the workflow
references.

## What you get

- **The Measure skill.** `skills/measure` is installed into
  `~/.agents/skills/measure`, where DSH discovers skills. Ask the agent to
  "new track", "implement", "review", or "measure status", or load the skill
  with `/measure`.
- **The guard.** `plugins/dsh-measure-guard` runs as a DSH profile bundle. In
  `guard` mode it denies edits outside `measure/` while no plan task is `[~]`,
  guards the track and phase closeout, and reports an end-of-turn reminder. A
  composer band and a Measure panel show the plan position.
- **The workflow commands.** `/measure-setup`, `/measure-new-track`,
  `/measure-new-track-set`, `/measure-implement`, `/measure-review`,
  `/measure-revert`, `/measure-doctor`, and `/measure-orchestrate` start the
  matching workflow without retyping it. `/measure-status` shows the plan
  position and opens the panel; `/measure-off` and `/measure-on` toggle the
  guards.
- **The agent team.** The Measure roles run as DSH subagents; the mapping and
  the model table are in
  [`../skills/measure-orchestrator/references/dsh.md`](../skills/measure-orchestrator/references/dsh.md).

## Prerequisites

- DSH 0.2.2-rc.1 or a compatible release, on Node >= 24.9 (the DSH floor). The
  plugin loads its copied `.ts` core through Node's built-in type stripping.
- A DSH web profile; the default is `web` under `$DSH_HOME` (`~/.dsh`).
- This repository checked out, because `bin/measure-dsh` copies the plugin from
  it and delegates the skill copies to `bin/install-measure-skill`.

## Install

From the repository root:

```bash
bin/measure-dsh install
```

It runs, in order: prerequisite checks; the foreign-row refusal; creation of
`<profile>/plugins`; the skill install step (`bin/install-measure-skill --ref
main`, add `--no-skills` to skip it); a stamped copy of
`plugins/dsh-measure-guard` into the profile; and one marker-managed row in
`<profile>/cordis.patch.yml`:

```yaml
# >>> measure-dsh managed block (id: measure-guard) >>>
- insert:
    - id: measure-guard
      name: ./plugins/dsh-measure-guard/index.js
      config:
        mode: guard
# <<< measure-dsh managed block <<<
```

Flags: `--dsh-home DIR`, `--profile NAME` (default `web`), `--mode
advise|guard|strict` (default `guard`), `--ref REF` for the skill step (use
`HEAD` while developing this repository), `--source DIR` for a plugin package
other than `plugins/dsh-measure-guard`, `--dry-run`.

A profile patch edit recomposes the profile live, so a correct install normally
needs no restart. Restart DSH when `--check --live` reports a module-identity
mismatch, and after you edit the installed host files later (their folder is not
watched).

### A different DSH home or profile

`--dsh-home` and `--profile` move both the copy and the row; nothing else needs
to change. A profile whose name is not `web` is fine as long as its folder
exists.

## Check

```bash
bin/measure-dsh --check
bin/measure-dsh --check --json
bin/measure-dsh --check --live --session "$DSH_SESSION_ID"
```

One line per item: the profile folder, Node, the two skill copies (every
repository file present, roots resolved in the DSH order), the plugin copy (all
files plus an exact stamp), the plugin module's exports, the managed row and its
mode, any foreign row, and with `--live` the state route (200 plus a `band`
field, the `x-measure-guard-module` header naming the installed copy, and the
`x-measure-guard-digest` header with the digest of the loaded code bytes). A
mismatched digest is FAIL because the running Host executes stale plugin code;
an absent digest is WARN. Exit code 0 means no item failed; `--json` prints the
same items as a machine-readable object.

After `install` replaces the plugin copy, the running profile must recompose to
load the new code. `install` writes the patch file even when the managed block is
unchanged, and `bin/measure-dsh reload` performs the same write on demand; both
toggle only trailing newlines, so the YAML entries stay byte-equal. Restart DSH
when `--check --live` still reports a stale digest (some hosts do not watch the
patch file).

## Modes

| Mode | Behaviour |
|---|---|
| `advise` | The context and the band only; nothing is denied. |
| `guard` (default) | Edit, closeout, and end-of-turn guards; the band and the reminder. |
| `strict` | `guard` plus the end-of-turn hold-open (at most twice per turn), the TDD Red-before-Green guard, and the commit format/no-task guard with its post-commit reminder. |

Change the mode by editing the managed block's `config.mode` (the profile
recomposes on save) or by re-running `install --mode`.

## Goal binding

The adapter reads the DSH goal as an optional capability (`ctx.get('goals')`,
never `inject`) and keeps it aligned with the active Measure track. The band,
the `measure_status` output, and the panel show `Goal <phase> · round
<n>/<max> · <objective>`, and the state route carries a `goal` summary.
`/measure-goal` seeds a goal from the active track's entry (objective
`Measure track "<track name>" (<track id>).`), replaces a complete goal, and
reports an `active`, `paused`, or `blocked` goal without mutating it. The
end-of-turn check reports a complete goal while a task is still `[~]`, and any
current goal while no track is in progress. The guard never mutates the goal
from a guard path.

## Setup answer

A git repository without a `measure/` folder shows the setup question in the
band: **Set up Measure** or **Turn off for session**. The answer is stored for
the session and posted to `POST /measure-guard/setup`; "Set up Measure" also
delivers the shared core's setup prompt to the agent. A blocked edit with no
button click records "off" once, as before.

## Agent team

The Measure orchestrator drives a track through the Measure roles. On DSH the
roles are subagent prompts with a fixed provider/model per role; the full table,
the prompt template, the independence rule, and the guard-marker handoffs are in
[`../skills/measure-orchestrator/references/dsh.md`](../skills/measure-orchestrator/references/dsh.md).

## Uninstall

```bash
bin/measure-dsh uninstall
```

It removes the managed block and the plugin copy it owns (only files whose hash
still matches the stamp; an edited file is kept and listed), and leaves the
skill copies alone. `--keep-copy` keeps the plugin copy; `--dry-run` prints the
actions only. If the patch file would contain only comments afterwards, it is
left as a valid empty patch (`[]`).

## Troubleshooting

- **"a foreign measure-guard row exists"** — an earlier hand-written profile row
  is in the way. Delete the lines the check names (a backup of the patch file is
  written by the migration), then re-run.
- **"the installed measure skill is incomplete"** — run
  `bin/install-measure-skill --ref main` (or `--ref HEAD` while developing this
  repository) and re-check.
- **The band or the panel is missing** — the profile may still run an older
  module. Check `--check --live`; if the module identity differs, restart DSH.
- **Edits are denied in `guard` mode** — that is the Measure rule: mark the next
  plan task `[~]` first, or use `/measure-off`. The deny text names the next
  task.
- **A different `DSH_HOME`** — the default is `~/.dsh`; pass `--dsh-home` or set
  `$DSH_HOME`. The install copy and the managed row always follow it.
- **A path-form row shows a technical package id** — expected: the Plugins page
  has display metadata only for a real bundle install (`dsh plugin --profile web
  add <path>` when pnpm is available).

## Files the environment writes

- `<profile>/plugins/dsh-measure-guard/` — the plugin copy and its
  `.measure-dsh-install` stamp.
- `<profile>/cordis.patch.yml` — exactly one marker-managed block.
- The skill copies, written by `bin/install-measure-skill` in its own targets.

Nothing else is touched, and `uninstall` reverses the first two.
