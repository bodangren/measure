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
  *One-command, verifiable DSH Measure development environment: environment CLI, workflow commands, agent-team reference, guide, live migration*

- [x] **Track: measure-guard for the DeepSeek Harness**
  *Link: [./archive/dsh_measure_guard_20261107/](./archive/dsh_measure_guard_20261107/)*
  *measure-guard for the DeepSeek Harness: a third adapter over the shared Measure core, with DSH-native context and guard layers*

- [x] **Track: DSH Measure evolution: strict guards, session-accurate writers, goal binding, and the setup button**
  *Link: [./archive/dsh_measure_evolve_20261107/](./archive/dsh_measure_evolve_20261107/)*
  *DSH Measure evolution: strict TDD and commit guards, session-accurate writer detection, goal binding to the active Measure track, and the in-band setup answer*

- [x] **Track: DSH Measure hardening: trustworthy live verification and real guard enforcement**
  *Link: [./archive/dsh_measure_hardening_20261107/](./archive/dsh_measure_hardening_20261107/)*
  *DSH Measure hardening: a live check that detects stale plugin code, git-backed verification of the task ceremony, and closure of the apply_patch/shell-write/commit-add bypasses*

- [x] **Track: DSH Measure operator controls: effective mode and on-demand verification**
  *Link: [./archive/dsh_measure_ops_20261107/](./archive/dsh_measure_ops_20261107/)*
  *DSH Measure operator controls: the effective guard mode with a /measure-mode command (session and persisted repository overrides) and a read-only /measure-verify command*

- [x] **Track: DSH Measure compact status band**
  *Link: [./archive/dsh_measure_band_20261107/](./archive/dsh_measure_band_20261107/)*
  *DSH Measure compact status band: cap the band at one line with a word-boundary ellipsis, keep the full position text as bandFull and a hover title*

- [x] **Track: DSH Measure band follow-up corrections**
  *Link: [./archive/dsh_measure_band_followup_20261107/](./archive/dsh_measure_band_followup_20261107/)*
  *Correct the compact-band track's false panel-fallback claim, pin and test the exact compaction contract (strip, boundary, no-space), fix the stale route field list, and prove the cap live*

- [x] **Track: DSH Measure agent-team rehearsal**
  *Link: [./archive/dsh_measure_team_rehearsal_20261107/](./archive/dsh_measure_team_rehearsal_20261107/)*
  *DSH Measure agent-team rehearsal: a disposable Measure fixture, the Red/Green/Review protocol for DSH subagents, one executed rehearsal with the live guard, and the documented integration facts*

- [x] **Track: DSH Measure rehearsal follow-up corrections**
  *Link: [./archive/dsh_measure_rehearsal_followup_20261107/](./archive/dsh_measure_rehearsal_followup_20261107/)*
  *Correct the rehearsal track's overclaims and rules, harden the fixture contract test to assert a real commit, define the acceptance fields, add the cleanup checks, and record the review with an exp…*

- [x] **Track: DSH Measure isolated-session rehearsal**
  *Link: [./archive/dsh_measure_isolated_session_20261107/](./archive/dsh_measure_isolated_session_20261107/)*
  *Prove the guard's strict deny in a disposable project by driving a real isolated session whose working directory is the fixture, using the authenticated host session API from the browser bridge con…*

- [x] **Track: DSH Measure semantic reload**
  *Link: [./archive/dsh_measure_reload_20261107/](./archive/dsh_measure_reload_20261107/)*
  *Make bin/measure-dsh reload and the unchanged-block install change the composed config semantically (a reloadNonce config value) instead of a YAML comment, so the loader recomposes and the plugin r…*

- [x] **Track: DSH Measure reload follow-up corrections**
  *Link: [./archive/dsh_measure_reload_followup_20261107/](./archive/dsh_measure_reload_followup_20261107/)*
  *Correct the semantic-reload track's executable proof record, pin the three undefined edge cases in code+tests, fix the lesson that still says to toggle a comment marker, and add the post-docs gate*

- [x] **Track: DSH Measure mid-red gate: rename-aware committed files**
  *Link: [./archive/dsh_measure_midred_rename_20261107/](./archive/dsh_measure_midred_rename_20261107/)*
  *Make the orchestrator checker's committed_files rename-aware (union the old and new path), so the mid-red gate catches a production file renamed into tests/; add the regression test and update the…*

- [x] **Track: DSH Measure mid-red rename follow-up**
  *Link: [./archive/dsh_measure_midred_followup_20261107/](./archive/dsh_measure_midred_followup_20261107/)*
  *Simplify committed_files to the proven single --no-renames -z call, add the mid-red control case (test-only commit stays clean), and correct the archived mid-red record with the executed Red order*

- [x] **Track: DSH Measure mid-red record reconciliation**
  *Link: [./archive/dsh_measure_midred_records_20261107/](./archive/dsh_measure_midred_records_20261107/)*
  *Reconcile the mid-red rename records: closeout-clean archived plans (task markers + SHAs), the missing tests/a.py absence assertion, the archived follow-up spec-review.md, and the archived mid-red…*

- [x] **Track: DSH Measure mid-red evidence and record precision**
  *Link: [./archive/dsh_measure_midred_evidence_20261107/](./archive/dsh_measure_midred_evidence_20261107/)*
  *Add the named closeout evidence ledger, define closeout-clean (manifest out of scope), correct the open-task list, record the five findings verbatim with dispositions, and add the parity gate task*

- [x] **Track: DSH Measure commit guard: quote-aware `git add` arguments**
  *Link: [./archive/dsh_measure_add_quoting_20261107/](./archive/dsh_measure_add_quoting_20261107/)*
  *Replace the commit guard's whitespace git-add split with a shell-word tokenizer so quoted/escaped paths are captured exactly, with an unterminated quote failing closed*

- [x] **Track: DSH Measure commit guard: token-scan `git add` and record corrections**
  *Link: [./archive/dsh_measure_add_quoting_followup_20261107/](./archive/dsh_measure_add_quoting_followup_20261107/)*
  *Replace the segment regex with a whole-command token scan (continuations, quoted separators, real comments), correct the shipped quoting record, and reconcile the mid-red evidence/record review (le…*

- [x] **Track: DSH Measure token scan follow-up**
  *Link: [./archive/dsh_measure_token_scan_followup_20261107/](./archive/dsh_measure_token_scan_followup_20261107/)*
  *Handle double-quoted backslash-newline continuations and require git at command position in the token scan; add their tests; reconcile the token-scan follow-up record (task SHAs, ledger format, evi…*

- [x] **Track: DSH Measure commit scan fix2**
  *Link: [./archive/dsh_measure_scan_fix2_20261107/](./archive/dsh_measure_scan_fix2_20261107/)*
  *Count env-prefixed and wrapper git commands in the added-paths scan (no fail-open), add tests, and correct the ledger sections and the token-scan follow-up record wording*

- [x] **Track: README videos**
  *Link: [./archive/readme_videos_20261105/](./archive/readme_videos_20261105/)*
  *Two YouTube videos as linked thumbnails in README.md (Daniel's request through the PM, Google Tasks, 2026-11-05 18:37 ICT).*

- [x] **Track: Allow list for the measure guard**
  *Link: [./archive/guard_allow_list_20261101/](./archive/guard_allow_list_20261101/)*
  *Allow list for the measure guard: a per-repository file measure/guard-allow names folders that may get writes while no task is [~] (PM request A-41, approved by Daniel on 2026-11-01).*

- [x] **Track: Spec review gate, finding dispositions, and doc drift check**
  *Link: [./archive/spec_review_gate_20261030/](./archive/spec_review_gate_20261030/)*
  *Spec review gate, finding dispositions, and doc drift check: a fresh-subagent review of spec.md and plan.md in new-track, a measure-spec-review orchestrator role with a checker gate, four dispositi…*

- [x] **Track: Skill doctor fixes for the Measure skills**
  *Link: [./archive/skill_doctor_fixes_20261031/](./archive/skill_doctor_fixes_20261031/)*
  *Skill doctor fixes for the Measure skills: fix the findings of the npm skill-doctor 0.1.0 static check and of the Claude Code /skill-doctor usage report for skills/measure, skills/measure-orchestra…*

- [x] **Track: DSH Measure shell grammar: heredoc- and quote-aware scanning**
  *Link: [./archive/dsh_measure_shell_grammar_20261107/](./archive/dsh_measure_shell_grammar_20261107/)*
  *Make the shell-write redirect scan heredoc-, quote-, and comment-aware (masking bodies/spans/comments) so prose quoting a redirect is no longer denied, while real writes stay detected*

- [x] **Track: Visual Refresh: Define Unique Identity**
  *Link: [./archive/visual_refresh_20260425/](./archive/visual_refresh_20260425/)*
  *Define the project's unique visual identity: palette, typography, and component language.*

- [x] **Track: DSH Measure tracks registry cleanup**
  *Link: [./archive/dsh_measure_registry_20261107/](./archive/dsh_measure_registry_20261107/)*
  *Rebuilt the tracks registry into one entry per archive directory with one description (37 directories, 0 merged description blocks) and added tests/dsh/test-registry.sh to the CLI suite (11/11). 8 tasks, 3 checkpoints, pushed per phase.*
