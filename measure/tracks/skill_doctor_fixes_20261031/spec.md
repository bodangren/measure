# Specification: Skill doctor fixes for the Measure skills

## Overview

Daniel asked the PM (task A-40, 2026-10-31) to run skill-doctor on the Measure skills of this repository and to implement the improvements. Two tools have this name:

1. The npm package `skill-doctor` 0.1.0 (MIT license, <https://github.com/marian2js/skill-doctor>). It is a static check of skill files. Its code reads only files, and it makes no network call.
2. The Claude Code command `/skill-doctor`, built into Claude Code 2.1.310. It reports the context cost and the use count of each skill that a Claude Code session loads.

Both tools ran on 2026-10-31 against `main` at `9f6ed7c`. This track fixes their findings for the skills in `skills/` and for the bundle copy `claude-skills/measure/`.

## Findings

| Id | Tool and rule | Skill | Finding |
| --- | --- | --- | --- |
| N1 | npm, `skill.invalid-frontmatter-description` (error) | `measure` | The description has 1052 characters. The Agent Skills limit is 1024 characters. |
| N2 | npm, `skill.long-frontmatter-description` (warning at strict) | `measure` | The description is longer than 900 characters. |
| N3 | npm, `skill.referenced-directory` (warning) | `measure` | Line 142 of `SKILL.md` links to the folder `assets/code_styleguides/`, not to a file. |
| N4 | npm, `skill.missing-usage-guidance` (warning; error at strict) | `measure-orchestrator` | The tool finds no usage section. The section `## Start Here` exists, but four other sections come before it, and the word list of the tool does not contain its name. |
| C1 | Claude Code `/skill-doctor` | `measure` | The listing costs about 350 tokens in each turn, the most of the 115 loaded skills. The skill has 58 uses. |
| C2 | Claude Code `/skill-doctor` | `build-graph` | The listing costs about 240 tokens in each turn. The skill has 0 uses in Claude Code on this machine. |
| X1 | Review by the author of this track | `measure-orchestrator` | Lines 8 and 117 of `SKILL.md` name the OpenCode 1 `task` tool and its `subagent_type` parameter. Measure works in any harness. |

## Decisions

The PM approved these decisions on 2026-10-31 ("go, with your defaults").

1. **Track type:** chore. The metadata has no sprint object.
2. **Branch:** the work happens on the branch `chore/skill-doctor-fixes`, in the worktree `/home/daniebo/Desktop/measure-worktrees/skill-doctor-fixes`. The branch merges into `main` with `git merge --no-ff`. Then the worktree is removed and the branch is deleted. The branch is not pushed.
3. **Claude bundle:** each commit that changes a file in `skills/measure/` copies the file to the same path in `claude-skills/measure/`. The zip file `claude-skills/measure.skill` is not rebuilt.
4. **N1, N2, C1:** the new `measure` description is the text in "New descriptions" (462 characters). It stays in the `description: |` block form, on one line, with no `<` or `>`.
5. **C2:** the new `build-graph` description is the text in "New descriptions" (337 characters). `build-graph` stays installed in `~/.claude/skills`. The text has `Use it when the user`, because the npm rule `skill.description-missing-trigger-guidance` needs trigger words such as `use it when` or `when the user`.
6. **N3:** the Code Styleguides line links each of the 8 files in `assets/code_styleguides/`.
7. **N4:** the `## Start Here` section moves without other changes to the place directly after the first paragraph of `SKILL.md`. Its heading becomes `## Quick start`. No other text is added.
8. **X1:** the two sentences name no harness tool. The plan gives the exact text.
9. **Verification:** the npm tool runs from `/tmp/skill-doctor-run`, outside the repository. The repository gets no new dependency and no new test file. For Markdown work, the workflow uses acceptance criteria in place of a failing test.
10. **Out of scope:** files outside this repository, the installer targets, the evals of `measure-orchestrator`, and the help text of the checker script.

## New descriptions

`measure`:

```text
Spec-driven development framework for AI coding agents. Measure keeps each feature, bug, or chore as a track with a spec, a phased plan, and project memory. Use it for structured development, also when the user does not say "Measure". Triggers: "measure setup", "new track", "plan feature", "write a spec", "track set", "implement", "work on track", "review", "verify track", "measure status", "what's left", "revert", "undo track", spec-driven development, TDD.
```

`build-graph`:

```text
Build and query a SQLite knowledge graph of a TypeScript codebase: symbols, imports, callers, and call paths. Use it when the user wants to find callers ("find all callers of", "what uses this"), trace a path ("trace from X to Y"), find a symbol, check what a change breaks, or understand the architecture of a large TypeScript codebase.
```

## Acceptance Criteria

1. `node /tmp/skill-doctor-run/node_modules/skill-doctor/dist/cli.js <folder> --strictness pedantic --fail-on warning` exits 0 with score 100 and 0 findings, for `skills/` and for `claude-skills/`.
2. The `measure` description has 500 characters or less. The `build-graph` description has 400 characters or less. Neither description has `<` or `>`.
3. `diff -r skills/measure claude-skills/measure` shows no difference.
4. `bash tests/spec_review_gate/run.sh` reports `10 suites (PASS=10, FAIL=0)`. `bun test` in `plugins/opencode-measure-guard` reports 0 failures.
5. `skills/measure-orchestrator/SKILL.md` has the heading `## Quick start` directly after the first paragraph and no `## Start Here` heading. Apart from the heading, the section text is the same as before.
6. After the install, `bin/install-measure-skill --check` exits 0.
7. After the install, `claude -p "/skill-doctor"` shows a lower context value for `measure` than C1 and for `build-graph` than C2.
