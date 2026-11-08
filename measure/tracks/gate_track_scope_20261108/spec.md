# Specification: Gate track scope

Author model: claude-code/claude-opus-5-5 (Claude family).

## Overview

The PM sent this request on 2026-11-08. The PM's words:

> What: the spec-review gate of measure-orchestrator counts commits of other tracks as files outside measure/runs/ (Monorepo 11-08 18:20, traffic binding track, during parallel login commits). The mid-red gate already skips other tracks after your fix of today; give the spec-review gate the same track scope (and check the other gates that count files in a commit range). Why: parallel tracks in the Monorepo make false gate fails. Done when: the installed checker scopes the spec-review gate by track, with a test, committed in your repo and installed. Date needed: 11-10.

The change gives the track scope of the `mid-red` gate to each other check that reads the commits of `baseline..HEAD`: the `spec-review` gate, the `ux-browser-review` gate, the `ux-paths` command, and the HEAD check of the `jr-green` gate. A commit of another track does not change the result of these checks. A commit that the checker cannot give to another track still counts as a commit of the track (fail closed). The change closes the tech-debt row of `red_gate_track_scope_20261108` (2026-11-08, Medium).

## Current system

- `skills/measure-orchestrator/scripts/measure_interphase_checks.py`, `cmd_role_gate`:
  - **`spec-review`.** The gate lists the tree diff `git diff --name-only --no-renames -z <baseline>..HEAD` and adds `history_files` (the files of each commit in the range). It fails with `spec-review committed files outside measure/runs/` and one `- <path>` line for each path that does not start with `measure/runs/`.
  - **`ux-browser-review`.** The gate calls `ux_paths(repo, baseline)`. `ux_paths` filters `changed_files`: the tree diff, the unstaged diff, the staged diff, and `history_files`. The gate fails with `UX-relevant files changed but PROJECT_DEV_URL is unset` when the list has a path and `PROJECT_DEV_URL` is unset.
  - **`jr-green`.** The gate fails with `expected committed Green-phase implementation change, but HEAD did not advance` when HEAD equals the `--baseline` string. A commit of another track moves HEAD, so this check passes when the range has no Green commit of the track.
  - **`mid-red`.** The gate has the track scope since `red_gate_track_scope_20261108`. `red_scope` sorts each commit of the range, and `commit_paths` lists the files of one commit.
- The `ux-paths` command prints the `ux_paths` list, one path on each line. With `--require`, it fails with `FAIL: no UX-relevant paths found` when the list is empty. It has no `--track` option.
- No other check reads the commits of a range. The audit gates read a result file and the plan. The `closeout` check reads the registry, the plan, and the metadata.
- Evidence of the failure: in the Monorepo, the spec review of `sales_traffic_source_binding_20261108` read `39d019003`. In the range after `39d019003`, the commits `1fa196df8` and `bd5dc101d` of track `storytime_at_home_release_20261106` change five files in `apps/storytime/` and the plan of that track. The spec-review gate lists these six files as files outside `measure/runs/`. The Monorepo ignores `measure/runs/` (`.gitignore` line 56), so the spec reviewer commits no file.
- `tests/spec_review_gate/test_s2_adversarial.sh` (G20) changes exact lines of the `spec-review` branch. Each changed line must occur one time in the checker, or the mutant does not apply and the suite fails.

## Decisions

- **D1 (one sort).** Each check in this track uses the sort of the `mid-red` gate with no change: the two id forms (D2 of `red_gate_track_scope_20261108`) and the rule for a commit of another track (D3 of that spec). The function `red_scope` gets the name `track_scope`, and the class `RedScope` gets the name `TrackScope`. The `mid-red` gate uses the new names and keeps its output.
- **D2 (scoped mode).** A check uses the scoped mode only when `baseline..HEAD` has 1 or more commits of another track. When the range has no such commit, or `git log` cannot list the range, the check reads the same file set as before, and its output does not change.
- **D3 (the scoped file set).** In the scoped mode, the committed file set is the union of `commit_paths` for each commit of the track. When `commit_paths` fails for a commit, the check fails with `<name> could not list the files of commit <12-character sha>`. `<name>` is `spec-review`, `ux-browser-review`, or `ux-paths`.
- **D4 (`spec-review`).** The checks of `--baseline` run first and do not change. The gate sorts the range only after the baseline resolves to a commit. In the scoped mode, the scope rule reads the D3 set, with the same message and the same `- <path>` lines. A range with no commit of the track passes the scope rule, because a spec reviewer can commit no file.
- **D5 (`ux-browser-review`).** In the scoped mode, the gate filters the D3 set plus the unstaged diff and the staged diff. A working-tree change has no track id, so it always counts. The filter and the message do not change.
- **D6 (`ux-paths --track`).** The `ux-paths` command gets an optional `--track <id>`. Without `--track`, the command does not change. With `--track`, the command uses D2, D3, and D5. The INFO lines of D8 go to stderr, so stdout keeps one path on each line. A D3 failure prints `FAIL: ux-paths could not list the files of commit <12-character sha>` to stdout, and the command exits 1. `--require` keeps its rule and its message.
- **D7 (`jr-green`).** In the scoped mode, the gate fails when the range has no commit of the track. The message is `expected committed Green-phase implementation change, but baseline..HEAD has no commit of track <track>`. This rule replaces the HEAD check in the scoped mode. The other checks of the gate do not change.
- **D8 (visible skips).** In the scoped mode, each check prints `INFO: <name> skipped <n> commits of other tracks`. Then it prints one line `INFO: - <12-character sha> <ids>` for each skipped commit, the newest commit first, with the ids joined by `,`. `<name>` is `mid-red`, `jr-green`, `spec-review`, `ux-browser-review`, or `ux-paths`. A role gate prints the lines to stdout before the `FAIL:` or `PASS:` lines, on a pass and on a fail.
- **D9 (distribution).** The change lands on the local `main`. `bin/install-measure-skill` copies the bundle to `~/.agents/skills/measure-orchestrator/`, the path in the `SKILL.md` commands that the Monorepo orchestrator runs. Nothing is pushed without the PM's word.

## Functional requirements

- **FR-1.** `track_scope` and `TrackScope` replace `red_scope` and `RedScope` (D1). The `mid-red` gate output does not change.
- **FR-2.** The `spec-review` gate uses the scoped mode (D2, D3, D4).
- **FR-3.** The `ux-browser-review` gate uses the scoped mode (D2, D3, D5).
- **FR-4.** The `ux-paths` command accepts `--track` (D6).
- **FR-5.** The `jr-green` gate uses the scoped mode for its HEAD check (D7).
- **FR-6.** Each scoped check prints the skipped commits (D8).
- **FR-7.** `references/contracts.md` states the scope rule for each check. The changed text is the `role-gate --role spec-review` sentence of `## Spec Review JSON`, and the `Baseline`, `HEAD advance`, and `Track scope (Mid Red)` bullets of `## Marker Matching and Baseline`. The new name of the last bullet is `Track scope`. `CHANGELOG.md` records the change. `measure/tech-debt.md` marks the row of `red_gate_track_scope_20261108` as Resolved.
- **FR-8.** The installed checker at `~/.agents/skills/measure-orchestrator/scripts/measure_interphase_checks.py` equals the checker on `main` (D9).

## Acceptance criteria

The new test file is `tests/spec_review_gate/test_gate_track_scope.py`. Each case builds a temporary git repo on branch `main`. The fixture commit holds `measure/index.md`, `measure/tracks.md`, `measure/tracks/look_track/plan.md`, `measure/tracks/login_track/plan.md`, `src/a.py`, and `app/src/a.tsx`. The look plan has the heading `## Phase 1: Green` and one task `- [x] Task 1.1: Green change abc1234`. The checks run on `look_track` as a subprocess, with `--baseline <fixture commit>`, no `--log-file`, and an explicit environment. A result file lives outside the repo. The `spec-review` result is a passing spec-review payload. The `ux-browser-review` result is a passing payload with `ux_applicability: not_applicable` and `webbridge_status: not_run`.

`spec-review` (`role-gate --role spec-review --phase "track setup"`):

- **AC-1** (`test_spec_review_mixed_range_passes`). The range has one `look_track` commit that changes only `measure/runs/look_track/notes.md`. It also has two subject-tagged `login_track` commits that change `src/login.py` and `measure/tracks/login_track/plan.md`. The gate exits 0 and prints `PASS: spec-review gate passed`. The output has `INFO: spec-review skipped 2 commits of other tracks` and one `INFO: - <sha> login_track` line for each `login_track` commit, the newest first. The output does not name a `login_track` file.
- **AC-2** (`test_spec_review_own_commit_outside_runs_fails`). The AC-1 range has one more `look_track` commit that changes `measure/tracks/look_track/spec.md`. The gate exits 1 and prints `FAIL: spec-review committed files outside measure/runs/` and `FAIL: - measure/tracks/look_track/spec.md`. The output does not name a `login_track` file.
- **AC-3** (`test_spec_review_only_other_tracks_passes`). The range has only the two `login_track` commits. The gate exits 0, prints the PASS line, and prints `INFO: spec-review skipped 2 commits of other tracks`.
- **AC-4** (`test_spec_review_untagged_commit_counts_as_own`). The range has the two `login_track` commits and one untagged commit that changes `src/misc.py`. The gate exits 1 and prints `FAIL: - src/misc.py`.
- **AC-5** (`test_spec_review_unlistable_own_commit_fails`). The range has the two `login_track` commits and then one `look_track` commit. The test deletes the loose root tree object of the `look_track` commit. The gate exits 1 and prints `FAIL: spec-review could not list the files of commit <12-character sha>`.
- **AC-6** (`test_spec_review_single_track_range_keeps_output`). A range with only one `look_track` commit inside `measure/runs/` prints only `PASS: spec-review gate passed`, with no `INFO:` line.

`jr-green` (`role-gate --role jr-green --phase "Phase 1: Green"`, `GREEN_TEST_COMMAND=true`):

- **AC-7** (`test_jr_green_range_without_own_commit_fails`). The range has only the two `login_track` commits. The gate exits 1 and prints the D7 message and `INFO: jr-green skipped 2 commits of other tracks`.
- **AC-8** (`test_jr_green_mixed_range_passes`). The range has the two `login_track` commits and one `look_track` commit. The gate exits 0, prints `PASS: jr-green gate passed`, and prints `INFO: jr-green skipped 2 commits of other tracks`.
- **AC-9** (`test_jr_green_untagged_commit_counts_as_own`). The range has the two `login_track` commits and one untagged commit. The gate exits 0 and prints the PASS line.

`ux-browser-review` (`role-gate --role ux-browser-review --phase "Phase 1: Green"`, `PROJECT_DEV_URL` unset):

- **AC-10** (`test_ux_review_other_track_ui_commit_passes`). The range has one `look_track` commit that changes `tests/test_look.py` and one `login_track` commit that changes `app/src/login.tsx`. The gate exits 0, prints `PASS: ux-browser-review gate passed`, and prints `INFO: ux-browser-review skipped 1 commits of other tracks`.
- **AC-11** (`test_ux_review_own_ui_commit_needs_dev_url`). The AC-10 range has one more `look_track` commit that changes `app/src/look.tsx`. The gate exits 1 and prints `FAIL: UX-relevant files changed but PROJECT_DEV_URL is unset`.
- **AC-12** (`test_ux_review_working_tree_change_counts`). The repo has the AC-10 range. Then the test changes `app/src/a.tsx` in the working tree and does not stage the change. The gate exits 1 with the AC-11 message.

`ux-paths` (`ux-paths --baseline <fixture commit>`):

- **AC-13** (`test_ux_paths_track_option_scopes_stdout`). The range has one `look_track` commit that changes `app/src/look.tsx` and one `login_track` commit that changes `app/src/login.tsx`. With `--track look_track`, the command exits 0. Stdout is exactly `app/src/look.tsx`. Stderr has `INFO: ux-paths skipped 1 commits of other tracks` and one `INFO: - <sha> login_track` line.
- **AC-14** (`test_ux_paths_without_track_keeps_full_range`). The same range with no `--track` prints both paths on stdout and nothing on stderr.
- **AC-15** (`test_ux_paths_require_with_only_other_tracks_fails`). The range has only the `login_track` commit. With `--track look_track --require`, the command exits 1 and prints `FAIL: no UX-relevant paths found`.

General:

- **AC-16.** `tests/spec_review_gate/test_red_track_scope.py` and `tests/spec_review_gate/test_checker.py` pass with no change.
- **AC-17.** `bash tests/spec_review_gate/run.sh` reports every suite as PASS.
- **AC-18.** On a read-only clone of the Monorepo at `bd5dc101d`, the `spec-review` gate with `--baseline 39d019003`, `--track sales_traffic_source_binding_20261108`, and the real result `spec-review-39d019003.json` exits 0. It prints `INFO: spec-review skipped 2 commits of other tracks`. The checker before this track exits 1 on the same input.
- **AC-19.** `bin/install-measure-skill --check` exits 0 after the install, and `cmp` shows that the installed checker equals the checker on `main`.

## Out of scope

- A scope by paths (D1 of `red_gate_track_scope_20261108`).
- The commit rule of the Monorepo. The Monorepo already tags each non-chore commit.
- A push to `origin`. The PM gives that word.

## Known limits

- The commit message is the claim of the role. A role can tag its own commit with the id of another real track, and the check then skips it. D8 keeps each skip visible, and the reviews compare each skipped commit with the other track. The PM accepted the tag as the scope key.
- An untagged commit of another track (for example a Monorepo `chore` commit with no tag) still counts as a commit of the track, and it can still fail a check. This is the fail-closed choice.
- `is_track_folder` reads the working tree, so a commit that adds a track folder can make its own id count as another track. The INFO line names the id (Review A F2 of `red_gate_track_scope_20261108`).
