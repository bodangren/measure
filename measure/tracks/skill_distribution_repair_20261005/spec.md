# Spec: Skill Distribution Repair

## Overview

Agents must run the Measure skills and agent roles that are on `main`. Now they do not, because the copies do not stay the same as the source:

- `bin/install-measure-skill` makes hard links. Git writes new files on checkout and merge, so each checkout breaks the links. Every copy now has a link count of 1.
- `~/.claude/skills/measure` and `~/.agents/skills/measure` date from 2026-05-25. The repository copy is from 2026-08-08. The installed `SKILL.md` does not have the "Continuous improvement" section that issue #1 asks for.
- Copies have changes in both directions:
  - `~/.agents/skills/measure/references/review.md` (Kimi WebBridge, 2026-08-10) is newer than the repository copy.
  - `~/.agents/skills/measure-orchestrator/SKILL.md` (2026-08-13) is newer than the repository copy.
  - All 13 `measure-*` files in `~/.config/opencode/agents/` (2026-09-18) are older than the repository copies (2026-10-04).
- The installer handles only `skills/measure`. It does not install `skills/measure-orchestrator`, `skills/build-graph`, or `agents/`.

This track also removes `automation-supervisor.py`. The user confirmed on 2026-10-05 that Fleet Commander and the Pi harness replace it. There are 29 copies of the file, and each copy has its own inode.

Decisions from the user (2026-10-05):

- **Install source:** a cron job copies from the `main` branch every hour. A feature branch never reaches the agents.
- **Supervisor removal:** in each project, commit only the removed paths on the branch that is checked out. Do not push.
- **Local edits (Task 1.2):** the repository takes the 2 newer target edits: `review.md` section 2.4 uses Kimi WebBridge, and the `measure-orchestrator` review roles are report-only. The OpenCode agents are not a target.

## Functional Requirements

### Installer

- **FR-1:** `bin/install-measure-skill` exports the bundles from a git ref with `git archive`. The default ref is `main`. `--ref <ref>` selects another ref.
- **FR-2:** A targets file in the repository lists each bundle and its target folders:
  - `skills/measure` → `~/.claude/skills/measure`, `~/.agents/skills/measure`
  - `skills/measure-orchestrator` → `~/.agents/skills/measure-orchestrator`
  - `skills/build-graph` → `~/.claude/skills/build-graph`, `~/.agents/skills/build-graph`
  - `agents/` → `~/.agents/agents` (the `measure-*.md` files only)
  - A target whose parent folder does not exist is skipped with a note.
  - `~/.config/opencode/agents` is not a target. Its 13 files use another format (a `permissions:` list, no `model:` line), and the installer does not change them. (User decision, 2026-10-05, Task 1.2.)
- **FR-3:** The installer writes each file in place (`cp`, not rename). An existing hard link to a target file stays.
- **FR-4:** The installer writes a stamp file in each target: the ref, the commit SHA, the time, and the SHA-256 of each installed file.
- **FR-5:** Local edit protection: if the hash of a target file is different from the hash in the stamp, the installer does not overwrite that file. It writes a warning, continues with the other files, and exits with code 2. A target with no stamp file gets the same protection for each different file, until the user runs `--adopt` once for the first install.
- **FR-6:** The installer removes a target file only if the stamp lists it and the source no longer has it. It never removes a file that it did not install.
- **FR-7:** `--check` writes nothing. It reports each file that is missing, different, or locally edited, and exits with 0 (no differences) or 1 (differences). An error (an unknown ref, a bad targets file, a bad option) exits with 3 in all modes. `contract.md` has the full rules.
- **FR-8:** `--cron install` adds one crontab line that runs the installer every hour. `--cron remove` removes that line. Both keep all other crontab lines, and running either one twice gives the same result.
- **FR-9:** Each run appends a summary line to `~/.local/state/measure/install.log`.

### Supervisor removal

- **FR-10:** In this repository, remove `measure/automation-supervisor.py`, the "Automation Supervisor" section of `AGENTS.md`, and the `measure/runs/` line in `.gitignore`.
- **FR-11:** Update the supervisor references in `agents/*.md` and `skills/measure-orchestrator/`. If a reference names a file that the Pi harness still uses, ask the user before changing it.
- **FR-12:** In each other project and worktree that has `measure/automation-supervisor.py`, delete the file and the `AGENTS.md` section, and commit only those paths on the current branch.
  - Skip a repository that has a merge, rebase, or cherry-pick in progress. Report it.
  - If `AGENTS.md` has other uncommitted changes, commit only the deletion of the file. Report the `AGENTS.md` line for a manual fix.
  - If the file is untracked, delete it, and commit only the `AGENTS.md` change.
- **FR-13:** Delete `~/.local/bin/measure-supervisor` and `mediarr/measure/automation-supervisor.md`. Keep the 201 `automation-supervisor-*-manifest.json` files in track archives as history.

### Documentation

- **FR-14:** Update `tech-stack.md`, `product.md`, and `README.md`: the install source, the targets, the cron job, and the removal of the `codex-skills/` and `templates/` rows. Those folders do not exist.
- **FR-15:** Mark the tech-debt items for the supervisor regex and for `templates/` as `Resolved`.

## Non-Functional Requirements

- The installer is bash with the standard tools (`git`, `tar`, `sha256sum`, `crontab`). No package manager.
- The tests run against a temporary git repository and a temporary `HOME`. They never write to the real home folder.

## Acceptance Criteria

- After a merge to `main` and one cron run, `bin/install-measure-skill --check` exits with 0.
- `~/.claude/skills/measure/SKILL.md` has the "Continuous improvement" section.
- A commit on a feature branch does not change any installed file.
- A local edit in a target file stays, and the log shows a warning for it.
- `find ~ -name automation-supervisor.py` finds no file outside track archives, and `crontab -l` shows the new line and all old lines.

## Out of Scope

- A drift check in `/measure:doctor`. This can be a later track that reads the stamp file.
- Measure guards for OpenCode and the Pi harness.
- The `[b]` marker definition and the task-count rule in `status.md`.
- Push to a remote, and the merge of `feat/measure-guard-mod`.
