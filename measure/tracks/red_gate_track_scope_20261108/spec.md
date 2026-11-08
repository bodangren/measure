# Specification: Red gate track scope

Author model: claude-code/claude-opus-5-5 (Claude family).

## Overview

The PM sent this request on 2026-11-08. The PM's words:

> What: the Red mechanical gate of the Measure orchestrator checks every commit in the range BASE..HEAD. Scope it to the commits of the track under check (the `track_id:` trailer or subject tag), or to the paths of the track. Commits of other tracks in the same range must not fail the gate. Why: Monorepo now runs 3 tracks in parallel (look, login, CI/CD) on one branch. Today the look 2.2 Red gate failed only on the concurrent commits of the other tracks, and each run now needs a hand-recorded exception. Done when: a test shows a range with mixed track commits that passes for the track whose commits are all test or plan, and fails when one of its own commits touches production code; the skill copy that Monorepo uses picks up the change; you send me one line (commit, test name). Date needed: 11-10.

The change scopes the `mid-red` role gate to the commits of the track under check. A commit of another track in the same range does not fail the gate. A commit that the checker cannot give to another track still counts as a commit of the track (fail closed).

## Current system

- `skills/measure-orchestrator/scripts/measure_interphase_checks.py`, `cmd_role_gate`, the `mid-red` branch, runs four checks:
  1. HEAD must not equal `--baseline`.
  2. The phase must have a `[~]` task when it has open tasks.
  3. `non_test_committed_files(repo, baseline)` lists each path outside `measure/` and outside the test patterns. The list comes from `committed_files`: the tree diff `baseline..HEAD` plus the files of each commit in the range (`history_files`). The gate fails with `Mid Red changed non-test/non-Measure files` and one `- <path>` line for each path.
  4. `RED_TEST_COMMAND` must fail.
- Check 3 reads every commit in the range. Check 1 passes when any commit advances HEAD.
- The Monorepo commit form is `<type>(<scope>): <text> (track_id: <name>_<YYYYMMDD>)`. The Monorepo `AGENTS.md` (commitlint section) requires this tag in each non-chore subject.
- Evidence of the failure: `reading-advantage-monorepo/measure/runs/storytime_look_20261107/red-p1-r3-8b56ac236.log` and `measure/runs/per_app_cicd_20261107/red-p1-4e3fffe22.log`. Each gate failed only on the files of other tracks.
- The git trailer parser accepts only letters, digits, and `-` in a key. `git interpret-trailers` and `%(trailers)` do not read a `track_id:` line (checked with git 2.53.0). The checker must parse the line itself.

## Decisions

- **D1 (scope by commit id).** The gate scopes by the track id of each commit. The scope by paths is not used: no machine-readable record names the paths of a track.
- **D2 (the track ids of a commit).** The checker reads two forms:
  - each `(track_id: <id>)` in the subject line (the first line of the message);
  - each line after the subject whose whole text, after the strip of spaces, is `track_id: <id>`.

  The key is the exact lowercase text `track_id`. The `<id>` grammar is `[A-Za-z0-9][A-Za-z0-9_.-]*`. Text that does not match a form gives no id.
- **D3 (a commit of another track).** A commit is a commit of another track when all three rules are true:
  1. the commit has 1 or more track ids;
  2. no id equals `--track`;
  3. each id names a folder `measure/tracks/<id>` or `measure/archive/<id>` in the repo.

  Every other commit is a commit of the track (fail closed). This includes a commit with no id, a commit with the id of the track, and a commit with an unknown id.
- **D4 (scoped mode).** The gate uses the scoped mode only when the range has 1 or more commits of another track. When the range has no such commit, the gate reads the same file set as before, with no change in its output.
- **D5 (the scoped file set).** In the scoped mode, check 3 reads only the files of the commits of the track. Each commit gives the paths of `git diff-tree -r --root --cc --no-renames -z --name-only --no-commit-id <commit>`. `--cc` lists the paths that a merge commit changes itself. `--no-renames` keeps the old path and the new path of a rename.
- **D6 (no commit of the track).** In the scoped mode, the gate fails when the range has no commit of the track. The message is `expected committed Red-phase test change, but baseline..HEAD has no commit of track <track>`. This rule replaces check 1 in the scoped mode.
- **D7 (visible skips).** In the scoped mode, the gate prints `INFO: mid-red skipped <n> commits of other tracks` before the result lines. Then it prints one line `- <12-character sha> <ids>` for each skipped commit, in `git log` order. A person can see each skipped commit and its tag.
- **D8 (only the mid-red gate).** The `spec-review` scope rule, `ux-paths`, and the `jr-green` HEAD check also read the full range. They stay as they are. A row in `measure/tech-debt.md` records them.
- **D9 (distribution).** The change lands on the local `main`. `bin/install-measure-skill` copies the bundles from `main`. The target is `~/.agents/skills/measure-orchestrator/`, the path in the `SKILL.md` commands that the Monorepo orchestrator runs. Nothing is pushed without the PM's word.

## Functional requirements

- **FR-1.** The checker reads the track ids of each commit in `baseline..HEAD` as D2 states.
- **FR-2.** The checker sorts each commit as a commit of the track or a commit of another track, as D3 states.
- **FR-3.** In the scoped mode (D4), the non-test check reads only the files of the commits of the track (D5).
- **FR-4.** In the scoped mode, the gate fails when the range has no commit of the track (D6).
- **FR-5.** In the scoped mode, the gate prints the skipped commits (D7).
- **FR-6.** `references/contracts.md` states the scope rule in the section `## Marker Matching and Baseline`. `CHANGELOG.md` and `measure/tech-debt.md` record the change and the D8 follow-up.
- **FR-7.** The installed copy at `~/.agents/skills/measure-orchestrator/scripts/measure_interphase_checks.py` equals the file on `main` (D9).

## Acceptance criteria

The new test file is `tests/spec_review_gate/test_red_track_scope.py`. Each case builds a temporary git repo with the tracks `look_track` and `login_track`. Each case runs the checker as a subprocess with `RED_TEST_COMMAND=false`.

- **AC-1** (`test_mixed_range_passes_when_own_commits_are_test_or_plan`). The range has commits of `look_track` that change only a test file and the plan. It also has subject-tagged commits of `login_track` that change production files. `role-gate --role mid-red --track look_track` exits 0 and prints `PASS: mid-red gate passed`. The output names the `login_track` commits in the INFO lines. No `- <path>` line names a production file of `login_track`.
- **AC-2** (`test_mixed_range_fails_when_own_commit_touches_production`). The same range has one more `look_track` commit that changes `src/look.py`. The gate exits 1. The output has `Mid Red changed non-test/non-Measure files` and `- src/look.py`. The output has no `- ` line for a `login_track` file.
- **AC-3** (`test_body_line_marks_another_track`). A `login_track` commit with the id only in a body line `track_id: login_track` counts as a commit of another track.
- **AC-4** (fail closed). Each of these commits counts as a commit of the track, and its production file fails the gate:
  - a commit with no id (`test_untagged_commit_counts_as_own`);
  - a commit with an id that names no track folder (`test_unknown_track_id_counts_as_own`);
  - a commit with the ids of both tracks (`test_commit_with_both_ids_counts_as_own`);
  - a commit whose tag does not match the grammar, for example `(track_id: ..)` or `Track_Id: login_track` (`test_malformed_tag_counts_as_own`).
- **AC-5** (`test_range_without_own_commit_fails`). The range has only `login_track` commits. The gate exits 1 with the D6 message.
- **AC-6** (`test_own_rename_into_tests_lists_old_path`). In the scoped mode, a `look_track` commit renames `src/a.py` to `tests/a.py`. The gate exits 1 and prints `- src/a.py`.
- **AC-7** (`test_own_merge_change_is_listed`). In the scoped mode, an untagged merge commit adds a production file in the merge itself. The gate exits 1 and lists that file.
- **AC-8** (`test_single_track_range_prints_no_info`). A range with no commit of another track prints no `INFO:` line. The existing mid-red cases of `test_checker.py` pass with no change.
- **AC-9.** `bash tests/spec_review_gate/run.sh` reports every suite as PASS.
- **AC-10.** `bin/install-measure-skill --check` exits 0 after the install, and `cmp` shows the installed checker equals the checker on `main`.

## Out of scope

- The scope by paths (D1).
- The `spec-review` scope rule, `ux-paths`, and the `jr-green` HEAD check (D8).
- A push to `origin`. The PM gives that word.
- The `(track_id: ...)` commit rule for this repo. This repo does not use the tag.

## Known limits

- The commit message is the claim of the role. A role can tag its own production commit with the id of another real track. D7 keeps each such skip visible in the gate output.
- An untagged commit of another track (for example a Monorepo `chore` commit) still counts as a commit of the track. Such a commit can still fail the gate. This is the fail-closed choice.
