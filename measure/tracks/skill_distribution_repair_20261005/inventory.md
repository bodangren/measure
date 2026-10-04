# Inventory: bundles and install targets

Date: 2026-10-05. Made with a read-only script that compares the git blob hash of each file on `main` with each target file.

## Acceptance criteria (Task 1.1)

- Each bundle in FR-2, and each target of the old installer, has a row with the counts of same, different, missing, and extra files.
- Each different file has the source date (last commit on `main`), the target date (mtime), and the newer side.
- Where the dates give a wrong result, a finding says so.
- The hard-link sub-task has a status and a reason.

## Results

Source: `main` at `2892fc5`.

### `skills/measure` (22 files)

| Target | Same | Different | Missing | Extra |
| --- | --- | --- | --- | --- |
| `~/.claude/skills/measure` | 21 | 1 | 0 | 0 |
| `~/.agents/skills/measure` | 20 | 2 | 0 | 0 |
| `~/.codex/skills/measure` | — | — | — | — (folder absent) |
| `~/.config/opencode/skills/measure` | — | — | — | — (folder absent) |

- `~/.claude/skills/measure/SKILL.md`: differs; source 2026-08-08, target 2026-05-25; newer: **source**
- `~/.agents/skills/measure/SKILL.md`: differs; source 2026-08-08, target 2026-05-25; newer: **source**
- `~/.agents/skills/measure/references/review.md`: differs; source 2026-06-28, target 2026-08-10; newer: **target**

### `skills/measure-orchestrator` (5 files)

| Target | Same | Different | Missing | Extra |
| --- | --- | --- | --- | --- |
| `~/.claude/skills/measure-orchestrator` | — | — | — | — (folder absent) |
| `~/.agents/skills/measure-orchestrator` | 4 | 1 | 0 | 0 |

- `~/.agents/skills/measure-orchestrator/SKILL.md`: differs; source 2026-06-28, target 2026-08-13; newer: **target**

### `skills/build-graph` (1 files)

| Target | Same | Different | Missing | Extra |
| --- | --- | --- | --- | --- |
| `~/.claude/skills/build-graph` | 1 | 0 | 0 | 0 |
| `~/.agents/skills/build-graph` | 1 | 0 | 0 | 0 |

### `agents` (13 files)

| Target | Same | Different | Missing | Extra |
| --- | --- | --- | --- | --- |
| `~/.config/opencode/agents` | 0 | 13 | 0 | 0 |
| `~/.agents/agents` | 13 | 0 | 0 | 0 |

- `~/.config/opencode/agents/measure-adversarial-testing.md`: differs; source 2026-10-04, target 2026-09-18; newer: **source**
- `~/.config/opencode/agents/measure-closeout.md`: differs; source 2026-10-04, target 2026-09-18; newer: **source**
- `~/.config/opencode/agents/measure-final-acceptance.md`: differs; source 2026-10-04, target 2026-09-18; newer: **source**
- `~/.config/opencode/agents/measure-jr-green.md`: differs; source 2026-10-04, target 2026-09-18; newer: **source**
- `~/.config/opencode/agents/measure-mid-red.md`: differs; source 2026-10-04, target 2026-09-18; newer: **source**
- `~/.config/opencode/agents/measure-orchestrator-audit.md`: differs; source 2026-10-04, target 2026-09-18; newer: **source**
- `~/.config/opencode/agents/measure-orchestrator.md`: differs; source 2026-10-04, target 2026-09-18; newer: **source**
- `~/.config/opencode/agents/measure-phase-acceptance.md`: differs; source 2026-10-04, target 2026-09-18; newer: **source**
- `~/.config/opencode/agents/measure-review-a-correctness.md`: differs; source 2026-10-04, target 2026-09-18; newer: **source**
- `~/.config/opencode/agents/measure-review-b-security.md`: differs; source 2026-10-04, target 2026-09-18; newer: **source**
- `~/.config/opencode/agents/measure-review-c-ux-api.md`: differs; source 2026-10-04, target 2026-09-18; newer: **source**
- `~/.config/opencode/agents/measure-strategy.md`: differs; source 2026-10-04, target 2026-09-18; newer: **source**
- `~/.config/opencode/agents/measure-ux-browser-review.md`: differs; source 2026-10-04, target 2026-09-18; newer: **source**

## Findings

1. **Stale installs.** `SKILL.md` in `~/.claude/skills/measure` and `~/.agents/skills/measure` is from 2026-05-25. It does not have the "Continuous improvement" section (issue #1).
2. **Local edits not in the repository.** These 2 target files are newer than `main`, and Task 1.2 must reconcile them:
   - `~/.agents/skills/measure/references/review.md` (2026-08-10): replaces the `browser-harness-js` CDP check with Kimi WebBridge.
   - `~/.agents/skills/measure-orchestrator/SKILL.md` (2026-08-13).
3. **The OpenCode agents use a different format.** The dates say that `main` is newer, but that is not correct. The content on `main` is the same as `~/.agents/agents` (mtime 2026-08-29). The 13 files in `~/.config/opencode/agents` (2026-09-18) have:
   - no `model:` line (the files on `main` set a model for each role), and
   - a `permissions:` list with `action`, `resource`, and `effect` items, where `main` has `permission:` keys (`edit`, `bash`, `skill`, `task`).
   - A plain copy from `main` can break these agents or change their models. Task 1.2 must decide the format for this target before the contract (Task 1.3).
4. **Absent targets.** `~/.codex/skills/measure`, `~/.config/opencode/skills/measure`, and `~/.claude/skills/measure-orchestrator` do not exist. The old installer would create the first 2.
5. **No extra files.** No target has a file that `main` does not have.

## Open: the second hard link of `~/.agents/agents/measure-*.md`

`~/.agents/agents/measure-closeout.md` has a link count of 2. The permission system blocked the search of the home folder for the other link. Status: deferred to the user. To find it, run:

    find ~ -xdev -samefile ~/.agents/agents/measure-closeout.md 2>/dev/null

FR-3 (write in place) keeps this link in all cases.
