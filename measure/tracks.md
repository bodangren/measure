# Project Tracks

This file tracks all major tracks for the Measure project.

---

- [x] **Track: Add lessons-learned memory and tech debt tracking to Measure workflow**
  *Link: [./archive/lessons_learned_20260307/](./archive/lessons_learned_20260307/)*

- [x] [Visual Refresh: Define Unique Identity](archive/visual_refresh_20260425/index.md)

---

- [x] **Track: Add scrum-style user stories, sprint metadata, and velocity tracking to Measure tracks**
  *Link: [./archive/scrum_tracks_20260525/](./archive/scrum_tracks_20260525/)*

---

- [x] **Track: Integrate build-graph into Measure new-track, implement, review, and setup workflows**
  *Link: [./archive/graph_integration_20260525/](./archive/graph_integration_20260525/)*

---

- [x] **Track: Track sets: create a related set of tracks in one pass (issue #4)**
  *Link: [./archive/track_sets_20261009/](./archive/track_sets_20261009/)*
  *One questioning phase, one overview page, two review gates, and a dependency record for a related set of tracks. Three fresh-agent reviews.*

---

## Cancelled Tracks

Cancelled on 2026-10-05. Each `metadata.json` has the reason in `cancel_reason`. These lines have no status marker, so Measure tools do not read them as tracks.

- Daily Automation Dashboard — the daily reports stopped, and a dashboard already exists.
  *Link: [./archive/daily_automation_dashboard_20260527/](./archive/daily_automation_dashboard_20260527/)*
- Track Dependency Graph — no current need, and the CLI breaks the no-build-tools rule.
  *Link: [./archive/track_dependency_graph_20260527/](./archive/track_dependency_graph_20260527/)*
- Multi-Project Portfolio View — Fleet Commander owns the multi-project view.
  *Link: [./archive/multi_project_portfolio_view_20260527/](./archive/multi_project_portfolio_view_20260527/)*
- Agent Performance Benchmarking — Fleet Commander owns model routing. `rubric.json` stays for a later audit.
  *Link: [./archive/agent_performance_benchmarking_20260527/](./archive/agent_performance_benchmarking_20260527/)*

---

- [x] **Track: measure-guard: Claude Code mod that guards the Measure workflow**
  *Link: [./archive/measure_guard_20261004/](./archive/measure_guard_20261004/)*
  *Mod that shows the plan state and guards edits, commits, and closeouts.*

---

- [x] **Track: Skill distribution repair: install skills from main by cron, and remove automation-supervisor.py**
  *Link: [./archive/skill_distribution_repair_20261005/](./archive/skill_distribution_repair_20261005/)*
  *Copies of the skills and agent roles from `main` by cron, with local edit protection. Deletes the superseded supervisor in all projects.*

---

- [x] **Track: OpenCode plugin: measure-guard for OpenCode 2, with agents, commands, a terminal band, and installer targets**
  *Link: [./archive/opencode_plugin_20261021/](./archive/opencode_plugin_20261021/)*
  *Server and terminal plugin package `plugins/opencode-measure-guard/`, shared core by copy with a parity gate, the rule in the `measure-orchestrator` agent.*

---

## Archived Tracks

- [x] **Track: DSH Measure development environment**
  *Link: [./archive/dsh_measure_dev_20261107/](./archive/dsh_measure_dev_20261107/)*
  *One command installs, checks, and removes the DSH profile layer; the plugin gains the Measure workflow commands; the orchestrator skill gains a DSH agent-team reference. Five phases, 18 tasks, live-verified in the running web profile with a module-identity proof.*

- [x] **Track: measure-guard for the DeepSeek Harness**
  *Link: [./archive/dsh_measure_guard_20261107/](./archive/dsh_measure_guard_20261107/)*
  *A third adapter over the shared core: context and guard layers on Cordis, plain-JS, no build step. Five phases, 28 tasks, 143 tests, live-verified in the web profile.*

- [x] **Track: DSH Measure evolution: strict guards, session-accurate writers, goal binding, and the setup button**
  *Link: [./archive/dsh_measure_evolve_20261107/](./archive/dsh_measure_evolve_20261107/)*
  *Closes the DSH guard's deferred FR-13 and FR-14 plus the setup button: strict Red-before-Green and commit guards, root-only writer sessions, a goal bound to the active track (`/measure-goal`, goal line, drift checks), the in-band setup answer, and the shared registry parser fix for the Mediarr format. 34 tasks, 7 checkpoints, 213 tests, live-verified.*

- [x] **Track: DSH Measure hardening: trustworthy live verification and real guard enforcement**
  *Link: [./archive/dsh_measure_hardening_20261107/](./archive/dsh_measure_hardening_20261107/)*

- [x] **Track: DSH Measure operator controls: effective mode and on-demand verification**
  *Link: [./archive/dsh_measure_ops_20261107/](./archive/dsh_measure_ops_20261107/)*

- [x] **Track: DSH Measure compact status band**
  *Link: [./archive/dsh_measure_band_20261107/](./archive/dsh_measure_band_20261107/)*

- [x] **Track: DSH Measure band follow-up corrections**
  *Link: [./archive/dsh_measure_band_followup_20261107/](./archive/dsh_measure_band_followup_20261107/)*

- [x] **Track: DSH Measure agent-team rehearsal**
  *Link: [./archive/dsh_measure_team_rehearsal_20261107/](./archive/dsh_measure_team_rehearsal_20261107/)*

- [x] **Track: DSH Measure rehearsal follow-up corrections**
  *Link: [./archive/dsh_measure_rehearsal_followup_20261107/](./archive/dsh_measure_rehearsal_followup_20261107/)*

- [x] **Track: DSH Measure isolated-session rehearsal**
  *Link: [./archive/dsh_measure_isolated_session_20261107/](./archive/dsh_measure_isolated_session_20261107/)*

- [x] **Track: DSH Measure semantic reload**
  *Link: [./archive/dsh_measure_reload_20261107/](./archive/dsh_measure_reload_20261107/)*

- [x] **Track: DSH Measure reload follow-up corrections**
  *Link: [./archive/dsh_measure_reload_followup_20261107/](./archive/dsh_measure_reload_followup_20261107/)*

- [x] **Track: DSH Measure mid-red gate: rename-aware committed files**
  *Link: [./archive/dsh_measure_midred_rename_20261107/](./archive/dsh_measure_midred_rename_20261107/)*

- [x] **Track: DSH Measure mid-red rename follow-up**
  *Link: [./archive/dsh_measure_midred_followup_20261107/](./archive/dsh_measure_midred_followup_20261107/)*

- [x] **Track: DSH Measure mid-red record reconciliation**
  *Link: [./archive/dsh_measure_midred_records_20261107/](./archive/dsh_measure_midred_records_20261107/)*

- [x] **Track: DSH Measure mid-red evidence and record precision**
  *Link: [./archive/dsh_measure_midred_evidence_20261107/](./archive/dsh_measure_midred_evidence_20261107/)*

- [x] **Track: DSH Measure commit guard: quote-aware `git add` arguments**
  *Link: [./archive/dsh_measure_add_quoting_20261107/](./archive/dsh_measure_add_quoting_20261107/)*

- [x] **Track: DSH Measure commit guard: token-scan `git add` and record corrections**
  *Link: [./archive/dsh_measure_add_quoting_followup_20261107/](./archive/dsh_measure_add_quoting_followup_20261107/)*

- [x] **Track: DSH Measure token scan follow-up**
  *Link: [./archive/dsh_measure_token_scan_followup_20261107/](./archive/dsh_measure_token_scan_followup_20261107/)*

- [x] **Track: DSH Measure commit scan fix2**
  *Link: [./archive/dsh_measure_scan_fix2_20261107/](./archive/dsh_measure_scan_fix2_20261107/)*
  *Env-prefixed and wrapper (`env`, `sudo`, `command`, `exec`, `nice`, `time`, including their option arguments) `git add` commands now contribute their paths instead of failing open; the ledger is indexed per track and the follow-up records cite the right sections. 11 tasks, 3 checkpoints, pushed per phase.*
  *A double-quoted backslash-newline is a continuation and `git` counts only at a command position; the token-scan follow-up record is reconciled (SHAs, ledger read-back, closeout manifest-only FAIL). 10 tasks, 3 checkpoints, pushed per phase.*
  *A whole-command token scan (line continuations, quoted separators, comments) replaces the segment regex; the shipped record is corrected and the mid-red archives are closeout-clean with a tracked ledger. 13 tasks, 4 checkpoints, pushed per phase.*
  *The strict commit guard reads `git add` with a shell-word tokenizer (quotes, escapes, comments, `--`), so a quoted path with spaces contributes exactly that path; unterminated quotes fail closed. 9 tasks, 3 checkpoints, pushed per phase.*
  *The named closeout ledger (output, SHAs, parity, node, srg), a defined closeout-clean (manifest out of scope), the corrected archived open-task list, the concrete review record with dispositions, and the parity gate task. 8 tasks, 2 checkpoints.*
  *Reconciles the mid-red records: the archived plans' task SHAs (closeout check now reports only the automation-supervisor manifest), the missing `tests/a.py` absence assertion, the follow-up's `spec-review.md` with responses, and the archived mid-red spec's dated correction note. 7 tasks, 2 checkpoints.*
  *`committed_files` is one `git diff --name-only --no-renames -z` call (both rename paths, no tab parser), the mid-red control case proves a test-only Red commit stays clean, and the archived record states the single-call approach and the executed Red order. 7 tasks, 2 checkpoints.*
  *`committed_files` now unions both paths of every rename, so the mid-red gate catches a production file renamed into `tests/` (regression test proves the old bypass exits 0 and the fix exits 1); spec-review-gate suite 10/10. 8 tasks, 2 checkpoints.*
  *Corrects the reload track's executable proof record (sessionId, JSON shape, store path, cleanup commands, before/after), pins the three edge cases in the contract tests (no complete block, changed-mode nonce, non-integer nonce), fixes the comment-toggle lesson, and gates Phase 3 with the full CLI suite. 9 tasks, 3 checkpoints.*
  *`reload` and the unchanged-block `install` now increment the managed entry's `reloadNonce` config value, so the loader recomposes and the running plugin re-reads its caches; proven live both directions and covered by the CLI contract tests. 10 tasks, 3 checkpoints.*
  *Proves the guard's strict deny in a disposable project by a real session whose working directory is the fixture (host session RPC with `cwd`): the deny fired verbatim and the agent did not bypass. Also found that the comment-marker `reload` does not refresh the cached repository-mode store. 10 tasks, 3 checkpoints.*
  *Corrects the rehearsal track's overclaims and rules, hardens the fixture contract test to assert a real commit (with a negative case), defines the acceptance fields and cleanup checks, and records the review with an explicit Accepted Risk for the deferred isolated-session strict path. 9 tasks, 3 checkpoints.*
  *A disposable Measure fixture and contract test, the Red/Green/Review protocol in the orchestrator reference (section 10), and one executed rehearsal: Red and Green subagents ran for real (fail → green → commit + git note) and established that a subagent's `cwd` is its shell directory, not its guard root. 12 tasks, 4 checkpoints.*
  *Corrects the false panel-fallback claim (the full text lives in `bandFull` and `measure_status` only), pins and tests the compaction contract (strip, 160/161 boundary, no-space fallback), fixes the route field list, and proves the cap live (band 157 with `…`, bandFull 470). 10 tasks, 3 checkpoints.*
  *The band stays on one line: `band` is capped at 160 characters on a word boundary with an ellipsis, `bandFull` carries the complete text as the hover title, and the Client row never wraps. 9 tasks, 2 checkpoints, 283 tests, live-verified (band 157 chars, bandFull 198).*
  *The effective mode is real (repository override > session override > config, `/measure-mode`, state route/band/status) and `/measure-verify` reports the git-backed ceremony on demand, read-only. 13 tasks, 3 checkpoints, 278 tests, live-verified (a repository `strict` override with config `advise` produced a real strict deny; reload learned to toggle a content marker).*
  *The live check now proves the running Host executes the installed bytes (load-time digest + `reload`), the guard verifies real commits and git notes plus the closeout `metadata.json`, and the apply_patch/shell-write/commit-add bypasses are closed (commit-set precision, bounded shell grammar). 19 tasks, 4 checkpoints, 251 tests, live-verified including the stale-instance FAIL and the turn-end git problem.*

- [x] **Track: README videos**
  *Link: [./archive/readme_videos_20261105/](./archive/readme_videos_20261105/)*
  *Two YouTube videos as linked thumbnails in `README.md`, at Daniel's request.*

- [x] **Track: Allow list for the measure guard**
  *Link: [./archive/guard_allow_list_20261101/](./archive/guard_allow_list_20261101/)*
  *A per-repository file `measure/guard-allow` names folders that a scheduled job may write while no task is `[~]`. Shared core of the mod and the plugin.*

- [x] **Track: Spec review gate, finding dispositions, and doc drift check**
  *Link: [./archive/spec_review_gate_20261030/](./archive/spec_review_gate_20261030/)*
  *A fresh-agent review of each spec and plan, a spec review role with a checker gate, four finding dispositions, and a weekly doc drift check. Ideas from Google's Elephant-Goldfish Model.*

- [x] **Track: Skill doctor fixes for the Measure skills**
  *Link: [./archive/skill_doctor_fixes_20261031/](./archive/skill_doctor_fixes_20261031/)*
  *Fixes for the findings of npm `skill-doctor` 0.1.0 and the Claude Code `/skill-doctor` report: shorter `measure` and `build-graph` descriptions, style guide file links, and an orchestrator quick start.*
