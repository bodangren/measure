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

- [~] **Track: DSH Measure hardening: trustworthy live verification and real guard enforcement**
  *Link: [./tracks/dsh_measure_hardening_20261107/](./tracks/dsh_measure_hardening_20261107/)*
  *The live check must detect stale plugin code (load-time digest), the guard must verify real commits and git notes instead of trusting markers, and the apply_patch/shell-write/in-command-git-add bypasses must close.*

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
