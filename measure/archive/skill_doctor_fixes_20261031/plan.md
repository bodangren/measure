# Implementation Plan: Skill doctor fixes for the Measure skills

Track: `skill_doctor_fixes_20261031`. Spec: [spec.md](./spec.md).

## Rules for every task

- Work in the worktree `/home/daniebo/Desktop/measure-worktrees/skill-doctor-fixes`, on the branch `chore/skill-doctor-fixes`.
- Make one commit for each task. Attach a git note with the task name, the changed files, and the reason. Then make one plan commit with the task SHA.
- When a task changes a file in `skills/measure/`, copy the file to the same path in `claude-skills/measure/` in the same commit.
- The check command `SD` is `node /tmp/skill-doctor-run/node_modules/skill-doctor/dist/cli.js`.

## Phase 1: Skill file fixes [checkpoint: d8bad26]

- [x] Task 1.1: Fix N1, N2, and C1. In `skills/measure/SKILL.md`, replace the two description paragraphs with the `measure` text of the spec, as one line in the `description: |` block. Copy the file to `claude-skills/measure/SKILL.md`. bc3503b
  - Acceptance: the parsed description equals the spec text (462 characters). `SD skills --strictness pedantic --format json` reports no finding for `measure` with a rule id `skill.invalid-frontmatter-description` or `skill.long-frontmatter-description`. Edge case: the YAML front matter still parses, and the `name:` line does not change.
- [x] Task 1.2: Fix N3. In `skills/measure/SKILL.md`, replace the line `- **Code Styleguides**: [assets/code_styleguides/](assets/code_styleguides/)` with this line. Copy the file to `claude-skills/measure/SKILL.md`. ae54182
  - `- **Code Styleguides** (general rules, and one file for each language): [general](assets/code_styleguides/general.md), [C#](assets/code_styleguides/csharp.md), [Dart](assets/code_styleguides/dart.md), [Go](assets/code_styleguides/go.md), [HTML and CSS](assets/code_styleguides/html-css.md), [JavaScript](assets/code_styleguides/javascript.md), [Python](assets/code_styleguides/python.md), [TypeScript](assets/code_styleguides/typescript.md)`
  - Acceptance: `SD skills --strictness pedantic --format json` reports no `skill.referenced-directory` finding. Edge case: each of the 8 linked files exists, so no `skill.missing-referenced-resource` finding appears.
- [x] Task 1.3: Fix C2. In `skills/build-graph/SKILL.md`, replace the description with the `build-graph` text of the spec, as one line in the `description: |` block. f08f951
  - Acceptance: the parsed description equals the spec text (337 characters). `SD skills --strictness pedantic --format json` reports no finding for `build-graph`. Edge case: no `skill.description-missing-trigger-guidance` finding appears, because the text has `Use it when the user`.
- [x] Task 1.4: Fix N4 and X1 in `skills/measure-orchestrator/SKILL.md`. eb9ab94
  - N4: move the `## Start Here` section (the heading line through the line before `## Role Order`) to the place directly after the first paragraph, before `## Anti-Patterns Registry`. Change the heading to `## Quick start`. Change no other line of the section.
  - X1, line 8: replace `are already registered as opencode subagent types — invoke them with the \`task\` tool's \`subagent_type\` parameter.` with `are registered subagent types. Start each one with the subagent tool of the harness, and give the role name as the subagent type.` Keep the role list in the same sentence without change, because `tests/spec_review_gate/test_s2_role_docs.sh` checks it.
  - X1, line 117: replace `Invoke each role by calling the \`task\` tool with \`subagent_type\` set to the matching` / `Measure subagent type (e.g. ...). Pass these values in the task prompt:` with `Start each role with the subagent tool of the harness. Set the subagent type to the matching` / `Measure role (e.g. ...). Pass these values in the role prompt:`. Keep the example role names.
  - Acceptance: `SD skills --strictness pedantic --format json` reports no `skill.missing-usage-guidance` finding. `grep -c '^## Start Here' skills/measure-orchestrator/SKILL.md` prints 0. `grep -n 'subagent_type' skills/measure-orchestrator/SKILL.md` prints nothing. Edge case: the section text below `## Quick start` equals the old `## Start Here` text, line for line.
- [x] Task 1.5: Checks and records. Run acceptance criteria 1 to 5 of the spec. Add one line under `## Unreleased` / `### Features` of `CHANGELOG.md`. b0b8f00
  - Acceptance: `SD skills --strictness pedantic --fail-on warning` and `SD claude-skills --strictness pedantic --fail-on warning` exit 0 with score 100. `diff -r skills/measure claude-skills/measure` shows no difference. `bash tests/spec_review_gate/run.sh` reports `10 suites (PASS=10, FAIL=0)`. `bun test` in `plugins/opencode-measure-guard` reports 0 failures.

## Phase 2: Close, merge, and install

- [x] Task 2.1: Archive the track: move the folder to `measure/archive/skill_doctor_fixes_20261031/`, move the registry entry to `## Archived Tracks` of `measure/tracks.md`, and set `status: done` and `completed` in `metadata.json`. 6a576d4
  - Acceptance: `measure/tracks/skill_doctor_fixes_20261031/` does not exist. `measure/archive/skill_doctor_fixes_20261031/` holds `spec.md`, `plan.md`, `metadata.json`, `index.md`, and `spec-review.md`. `measure/tracks.md` has the `[x]` entry with the link `./archive/skill_doctor_fixes_20261031/` under `## Archived Tracks`, and no entry for this track above that heading. `metadata.json` has `"status": "done"` and `"completed": "2026-10-31"`. Edge case: `python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py status --repo .` lists no incomplete phase for this track.
- [x] Task 2.2: In the main checkout, merge the branch with `git merge --no-ff chore/skill-doctor-fixes`. Run `bin/install-measure-skill` once, then check acceptance criteria 6 and 7. Attach the results as a git note to the merge commit. Remove the worktree, and delete the local branch. Mark this task `[x]` with the merge SHA in the archived plan, and commit the plan on `main`. Push `main` to `origin`. 7788d95
  - Acceptance: `git log --merges -1 --format=%s` names `chore/skill-doctor-fixes`. Acceptance criteria 6 and 7 of the spec pass. `git worktree list` shows only the main checkout. `git branch --list chore/skill-doctor-fixes` prints nothing. `git log origin/main -1` shows the plan commit.
  - Edge cases: when the merge has a conflict, stop and report it, and do not force the merge. When the installer exits 2 (it kept a local edit), stop and report the kept paths. When the hourly cron job installed the merge first, the installer prints `No differences`, and criterion 6 still applies. When `claude -p "/skill-doctor"` does not run, record the reason in the merge note and report criterion 7 as not checked.
