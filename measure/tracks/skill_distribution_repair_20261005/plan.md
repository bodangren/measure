# Plan: Skill Distribution Repair

> Source: `spec.md` (classic FR list). Work on the branch `chore/skill-distribution`. The cron job installs from `main`, so the result reaches the agents after the merge.

## Phase 1: Inventory and contract

- [x] Task 1.1: Inventory — the differences between each bundle and each target `c1f0b7b`
    - [x] List each file that differs, with the newer side and the date. Write the list to `inventory.md` in this track folder
    - [b] Find the second link of each `~/.agents/agents/measure-*.md` file (link count 2), and record what reads it deferred:user (the permission system blocked the home-folder search; command in `inventory.md`)
- [x] Task 1.2: Reconcile the local edits (FR-5 precondition) `89d79b1`
    - [x] Show the user the diff of `~/.agents/skills/measure/references/review.md` and `~/.agents/skills/measure-orchestrator/SKILL.md`, and each other target file that is newer than the source
    - [x] Copy the edits that the user approves into `skills/`, and commit them (Kimi WebBridge review, report-only orchestrator reviews; OpenCode agents left out)
- [x] Task 1.3: Contract — tooling exception and installer contract `5c003a8`
    - [x] Add a row for this track to the Tooling Exceptions table in `tech-stack.md` (bash test scripts) before any test
    - [x] Define the targets file format, the stamp file format, the modes, and the exit codes (0, 1, 2) in `contract.md` in this track folder
- [~] Task: Measure - User Manual Verification 'Phase 1: Inventory and contract' (Protocol in workflow.md)

## Phase 2: Test (Red)

- [ ] Task 2.1: Write the installer tests under `scripts/` in this track folder
    - [ ] Install from `main`: the targets match `main` (FR-1, FR-2)
    - [ ] A commit on a feature branch does not change the targets (FR-1)
    - [ ] An existing hard link to a target file stays after an install (FR-3)
    - [ ] A local edit stays, the log has a warning, and the exit code is 2 (FR-5, FR-9)
    - [ ] A file removed from the source is removed from the target; a file that the installer did not install stays (FR-6)
    - [ ] `--check` writes nothing and exits with 0 or 1 (FR-7)
    - [ ] `--cron install` and `--cron remove` keep the other crontab lines and are idempotent, with a fake `crontab` on `PATH` (FR-8)
- [ ] Task 2.2: Run the tests and record the failures in the git note
- [ ] Task: Measure - User Manual Verification 'Phase 2: Test (Red)' (Protocol in workflow.md)

## Phase 3: Implement (Green)

- [ ] Task 3.1: Rewrite `bin/install-measure-skill`: `git archive`, the targets file, in-place copy, stamp file, local edit protection, stale file removal, `--check` (FR-1 to FR-7, FR-9)
- [ ] Task 3.2: Add `--cron install` and `--cron remove` (FR-8)
- [ ] Task 3.3: Run the installer on this machine
    - [ ] Run `--check` and show the user the result before the first install
    - [ ] Run the install, then `--cron install`. Confirm that `crontab -l` keeps the 3 existing jobs
- [ ] Task: Measure - User Manual Verification 'Phase 3: Implement (Green)' (Protocol in workflow.md)

## Phase 4: Remove the supervisor

- [ ] Task 4.1: This repository (FR-10, FR-11)
    - [ ] Delete `measure/automation-supervisor.py`, the `AGENTS.md` section, and the `.gitignore` line `measure/runs/`
    - [ ] Update the references in `agents/*.md` and `skills/measure-orchestrator/`. Ask the user about each reference that the Pi harness may still use
- [ ] Task 4.2: The other projects and worktrees (FR-12, FR-13)
    - [ ] Show the user the list of repositories, branches, and the action for each before any change
    - [ ] For each repository: delete the file and the `AGENTS.md` section, and commit only those paths on the current branch. Do not push
    - [ ] Delete `~/.local/bin/measure-supervisor` and `mediarr/measure/automation-supervisor.md`
    - [ ] Report each repository that was skipped, and why
- [ ] Task: Measure - User Manual Verification 'Phase 4: Remove the supervisor' (Protocol in workflow.md)

## Phase 5: Docs and closeout

- [ ] Task 5.1: Update `tech-stack.md`, `product.md`, `README.md`, and `tech-debt.md` (FR-14, FR-15)
- [ ] Task 5.2: After the merge to `main`, confirm the acceptance criteria
    - [ ] After one cron run, `--check` exits with 0, and `~/.claude/skills/measure/SKILL.md` has the "Continuous improvement" section
    - [ ] Ask the user, then close issue #1 in `bodangren/measure` with a link to the commit
- [ ] Task: Measure - User Manual Verification 'Phase 5: Docs and closeout' (Protocol in workflow.md)
