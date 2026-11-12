# Project Tracks

This file tracks all major tracks for the Measure project.

## Active Tracks

- [~] **Track: Final acceptance head scope**
  *Link: [./tracks/final_acceptance_head_scope_20261113/](./tracks/final_acceptance_head_scope_20261113/)*
  *Let final acceptance count a later commit as covered when it changes no path of the track or only its plan and evidence files, and record the path diff (PM request, 2026-11-13)*

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
  *Correct the rehearsal track's overclaims and rules, harden the fixture contract test to assert a real commit, define the acceptance fields, add the cleanup checks, and record the review with an explicit Accepted Risk for the deferred isolated-session strict path*

- [x] **Track: DSH Measure isolated-session rehearsal**
  *Link: [./archive/dsh_measure_isolated_session_20261107/](./archive/dsh_measure_isolated_session_20261107/)*
  *Prove the guard's strict deny in a disposable project by driving a real isolated session whose working directory is the fixture, using the authenticated host session API from the browser bridge context*

- [x] **Track: DSH Measure semantic reload**
  *Link: [./archive/dsh_measure_reload_20261107/](./archive/dsh_measure_reload_20261107/)*
  *Make bin/measure-dsh reload and the unchanged-block install change the composed config semantically (a reloadNonce config value) instead of a YAML comment, so the loader recomposes and the plugin re-reads its caches*

- [x] **Track: DSH Measure reload follow-up corrections**
  *Link: [./archive/dsh_measure_reload_followup_20261107/](./archive/dsh_measure_reload_followup_20261107/)*
  *Correct the semantic-reload track's executable proof record, pin the three undefined edge cases in code+tests, fix the lesson that still says to toggle a comment marker, and add the post-docs gate*

- [x] **Track: DSH Measure mid-red gate: rename-aware committed files**
  *Link: [./archive/dsh_measure_midred_rename_20261107/](./archive/dsh_measure_midred_rename_20261107/)*
  *Make the orchestrator checker's committed_files rename-aware (union the old and new path), so the mid-red gate catches a production file renamed into tests/; add the regression test and update the records*

- [x] **Track: DSH Measure mid-red rename follow-up**
  *Link: [./archive/dsh_measure_midred_followup_20261107/](./archive/dsh_measure_midred_followup_20261107/)*
  *Simplify committed_files to the proven single --no-renames -z call, add the mid-red control case (test-only commit stays clean), and correct the archived mid-red record with the executed Red order*

- [x] **Track: DSH Measure mid-red record reconciliation**
  *Link: [./archive/dsh_measure_midred_records_20261107/](./archive/dsh_measure_midred_records_20261107/)*
  *Reconcile the mid-red rename records: closeout-clean archived plans (task markers + SHAs), the missing tests/a.py absence assertion, the archived follow-up spec-review.md, and the archived mid-red spec correction note*

- [x] **Track: DSH Measure mid-red evidence and record precision**
  *Link: [./archive/dsh_measure_midred_evidence_20261107/](./archive/dsh_measure_midred_evidence_20261107/)*
  *Add the named closeout evidence ledger, define closeout-clean (manifest out of scope), correct the open-task list, record the five findings verbatim with dispositions, and add the parity gate task*

- [x] **Track: DSH Measure commit guard: quote-aware `git add` arguments**
  *Link: [./archive/dsh_measure_add_quoting_20261107/](./archive/dsh_measure_add_quoting_20261107/)*
  *Replace the commit guard's whitespace git-add split with a shell-word tokenizer so quoted/escaped paths are captured exactly, with an unterminated quote failing closed*

- [x] **Track: DSH Measure commit guard: token-scan `git add` and record corrections**
  *Link: [./archive/dsh_measure_add_quoting_followup_20261107/](./archive/dsh_measure_add_quoting_followup_20261107/)*
  *Replace the segment regex with a whole-command token scan (continuations, quoted separators, real comments), correct the shipped quoting record, and reconcile the mid-red evidence/record review (ledger tracked, archived plans closeout-clean, definition, wording)*

- [x] **Track: DSH Measure token scan follow-up**
  *Link: [./archive/dsh_measure_token_scan_followup_20261107/](./archive/dsh_measure_token_scan_followup_20261107/)*
  *Handle double-quoted backslash-newline continuations and require git at command position in the token scan; add their tests; reconcile the token-scan follow-up record (task SHAs, ledger format, evidence Overview wording)*

- [x] **Track: DSH Measure commit scan fix2**
  *Link: [./archive/dsh_measure_scan_fix2_20261107/](./archive/dsh_measure_scan_fix2_20261107/)*
  *Count env-prefixed and wrapper git commands in the added-paths scan (no fail-open), add tests, and correct the ledger sections and the token-scan follow-up record wording*

- [x] **Track: README videos**
  *Link: [./archive/readme_videos_20261105/](./archive/readme_videos_20261105/)*
  *Two YouTube videos as linked thumbnails in README.md (Daniel's request through the PM, Google Tasks, 2026-11-05 18:37 ICT).*

- [x] **Track: Allow list for the measure guard**
  *Link: [./archive/guard_allow_list_20261101/](./archive/guard_allow_list_20261101/)*
  *Allow list for the measure guard: a per-repository file measure/guard-allow names folders that may get writes while no task is [~] (PM request A-41, approved by Daniel on 2026-11-01). Shared core of the Claude Code mod and the OpenCode plugin; the advantage-pr list for its scheduled jobs.*

- [x] **Track: Spec review gate, finding dispositions, and doc drift check**
  *Link: [./archive/spec_review_gate_20261030/](./archive/spec_review_gate_20261030/)*
  *Spec review gate, finding dispositions, and doc drift check: a fresh-subagent review of spec.md and plan.md in new-track, a measure-spec-review orchestrator role with a checker gate, four dispositions for routed review findings, and a doc drift detector in the weekly audit. Ideas adapted from Google's Elephant-Goldfish Model (Apache-2.0).*

- [x] **Track: Skill doctor fixes for the Measure skills**
  *Link: [./archive/skill_doctor_fixes_20261031/](./archive/skill_doctor_fixes_20261031/)*
  *Skill doctor fixes for the Measure skills: fix the findings of the npm skill-doctor 0.1.0 static check and of the Claude Code /skill-doctor usage report for skills/measure, skills/measure-orchestrator, skills/build-graph, and the claude-skills/measure copy (PM task A-40).*

- [x] **Track: DSH Measure shell grammar: heredoc- and quote-aware scanning**
  *Link: [./archive/dsh_measure_shell_grammar_20261107/](./archive/dsh_measure_shell_grammar_20261107/)*
  *Make the shell-write redirect scan heredoc-, quote-, and comment-aware (masking bodies/spans/comments) so prose quoting a redirect is no longer denied, while real writes stay detected*

- [x] **Track: Visual Refresh: Define Unique Identity**
  *Link: [./archive/visual_refresh_20260425/](./archive/visual_refresh_20260425/)*
  *Visual Refresh: Define Unique Identity*

- [x] **Track: DSH Measure tracks registry cleanup**
  *Link: [./archive/dsh_measure_registry_20261107/](./archive/dsh_measure_registry_20261107/)*
  *Rebuild the measure/tracks.md Archived Tracks section (one entry per archive dir with one description) and add a structural registry check to the CLI suite*

- [x] **Track: Add lessons-learned memory and tech debt tracking to Measure workflow**
  *Link: [./archive/lessons_learned_20260307/](./archive/lessons_learned_20260307/)*
  *Add lessons-learned memory and tech debt tracking to Measure workflow*

- [x] **Track: Add scrum-style user stories, sprint metadata, and velocity tracking to Measure tracks**
  *Link: [./archive/scrum_tracks_20260525/](./archive/scrum_tracks_20260525/)*
  *Add scrum-style user stories, sprint metadata, and velocity tracking to Measure tracks*

- [x] **Track: Integrate build-graph into Measure new-track, implement, review, and setup workflows**
  *Link: [./archive/graph_integration_20260525/](./archive/graph_integration_20260525/)*
  *Integrate build-graph into Measure new-track, implement, review, and setup workflows*

- [x] **Track: Track sets: create a related set of tracks in one pass (issue #4)**
  *Link: [./archive/track_sets_20261009/](./archive/track_sets_20261009/)*
  *Track sets: create a related set of tracks in one pass (issue #4)*

- [x] **Track: measure-guard: Claude Code mod that guards the Measure workflow**
  *Link: [./archive/measure_guard_20261004/](./archive/measure_guard_20261004/)*
  *measure-guard: a Claude Code mod that shows the Measure plan state and guards edits, commits, and closeouts (from mods/measure-guard/DESIGN.md)*

- [x] **Track: OpenCode plugin: measure-guard for OpenCode 2, with agents, commands, a terminal band, and installer targets**
  *Link: [./archive/opencode_plugin_20261021/](./archive/opencode_plugin_20261021/)*
  *OpenCode plugin: measure-guard for OpenCode 2 (server and terminal parts), Measure agents, commands, installer targets, and documents*

- [x] **Track: Skill distribution repair: install skills from main by cron, and remove automation-supervisor.py**
  *Link: [./archive/skill_distribution_repair_20261005/](./archive/skill_distribution_repair_20261005/)*
  *Skill distribution repair: install the Measure skills and agent roles from main by cron, protect local edits, and remove automation-supervisor.py everywhere*

- [x] **Track: DSH Measure registry consolidation**
  *Link: [./archive/dsh_measure_registry_fix2_20261107/](./archive/dsh_measure_registry_fix2_20261107/)*
  *Consolidate measure/tracks.md to one layout (every archive directory exactly once, full metadata descriptions), harden tests/dsh/test-registry.sh with attribution rules and isolated negative fixtures, and correct the archived registry track's record*

- [x] **Track: DSH Measure registry checker completeness**
  *Link: [./archive/dsh_measure_registry_fix3_20261107/](./archive/dsh_measure_registry_fix3_20261107/)*
  *Complete the registry structural check: section placement, description content equality against each archive's metadata (title fallback), and rejection of the old one-line link shape; deliver the consolidation review record*

- [x] **Track: DSH Measure registry check finalization**
  *Link: [./archive/dsh_measure_registry_fix4_20261107/](./archive/dsh_measure_registry_fix4_20261107/)*
  *Finalize the registry check: pin the label-stripped-title fallback, add empty-fallback and section-only fixtures, name the evidence file and JSON mechanism, and deliver the fix3 review record*

- [x] **Track: DSH Measure spec-review-gate runner hardening**
  *Link: [./archive/dsh_measure_srg_runner_20261108/](./archive/dsh_measure_srg_runner_20261108/)*
  *Harden tests/spec_review_gate/run.sh: never run itself, skip symlinked suites, refuse glob-metacharacter names passed as discovery patterns, and fail a zero-test .py suite; add runner probes and records*

- [x] **Track: DSH Measure dispositions parser hardening**
  *Link: [./archive/dsh_measure_srg_parser_20261108/](./archive/dsh_measure_srg_parser_20261108/)*
  *Reject control and zero-width characters in a parseable dispositions value (CONTEST/ESCALATE text), with contract tests; record the resolved parser part and the remaining scope-rule item*

- [x] **Track: DSH Measure dispositions parser fix2**
  *Link: [./archive/dsh_measure_srg_parser_fix2_20261108/](./archive/dsh_measure_srg_parser_fix2_20261108/)*
  *Broaden the dispositions control/format rejection (C1, U+2028/2029, bidi, zero-width), make the result markers exact lines, add the ordering probe and the grammar/doc test, and record the review*

- [x] **Track: DSH Measure dispositions parser fix3**
  *Link: [./archive/dsh_measure_srg_parser_fix3_20261108/](./archive/dsh_measure_srg_parser_fix3_20261108/)*
  *Search the raw dispositions value, add the remaining Bidi_Control marks (U+061C/200E/200F), strengthen the grammar doc test to the full class sentence, and record the fix2 review*

- [x] **Track: DSH Measure A11 recipe hardening**
  *Link: [./archive/dsh_measure_a11_recipe_20261108/](./archive/dsh_measure_a11_recipe_20261108/)*
  *Harden the A11 detection recipe: text-mode grep for NUL/invalid-UTF-8 documents, space-containing path claims, and distinct missing/non-regular/unreadable document messages, with S4 contract cases*

- [x] **Track: DSH Measure A11 recipe fix2**
  *Link: [./archive/dsh_measure_a11_recipe_fix2_20261108/](./archive/dsh_measure_a11_recipe_fix2_20261108/)*
  *Skip executable command spans, pin the single-space path rule, retarget the sensitivity mutants, guard the unreadable row for root, and correct the records*

- [x] **Track: DSH Measure A11 recipe fix3**
  *Link: [./archive/dsh_measure_a11_recipe_fix3_20261108/](./archive/dsh_measure_a11_recipe_fix3_20261108/)*
  *Record corrections for A11 fix2: replace the stale pattern in its documents, correct the CHANGELOG facts, pin the root branch and live-count wording, and record the fix2 review*

- [x] **Track: DSH Measure closeout registry-description guard**
  *Link: [./archive/dsh_measure_closeout_registry_20261108/](./archive/dsh_measure_closeout_registry_20261108/)*
  *Make closeout verify the archived track's registry entry description against metadata, with a new CLI test for matching/mismatch/missing cases*

- [x] **Track: DSH Measure suite mktemp-failure guard**
  *Link: [./archive/dsh_measure_suite_mktemp_20261109/](./archive/dsh_measure_suite_mktemp_20261109/)*
  *Give every spec-review-gate suite the same failed-mktemp guard, add a stub-mktemp suite that proves each guard fires, and resolve the MKTEMP tech-debt row*

- [x] **Track: DSH Measure intermediate-commit scope coverage**
  *Link: [./archive/dsh_measure_scope_intermediate_20261109/](./archive/dsh_measure_scope_intermediate_20261109/)*
  *Union per-commit paths from baseline..HEAD into changed_files and committed_files so intermediate add-then-delete commits are visible to the mid-red and audit scope checks, with an S2 probe*

- [x] **Track: DSH Measure skill-description repository check**
  *Link: [./archive/dsh_measure_skill_doctor_check_20261109/](./archive/dsh_measure_skill_doctor_check_20261109/)*
  *Add a CLI contract test that checks every SKILL.md description length and angle-bracket rule and rejects symlinks in the claude-skills bundle, with negative fixtures*

- [x] **Track: DSH Measure skill-doc check fix2**
  *Link: [./archive/dsh_measure_skill_doctor_fix2_20261109/](./archive/dsh_measure_skill_doctor_fix2_20261109/)*
  *Enforce the real folder-link rule (Markdown links to directories, N3), keep the bundle symlink rule separately, and add block/boundary/character/missing-description fixtures*

- [x] **Track: DSH Measure skill-doc check fix3**
  *Link: [./archive/dsh_measure_skill_doctor_fix3_20261109/](./archive/dsh_measure_skill_doctor_fix3_20261109/)*
  *Add the folded > block fixture, correct the tech-debt row and CHANGELOG to name the Markdown folder-link rule, and record the fix2 review*

- [x] **Track: DSH Measure skill-doc check fix4**
  *Link: [./archive/dsh_measure_skill_doctor_fix4_20261109/](./archive/dsh_measure_skill_doctor_fix4_20261109/)*
  *Add anchor-only and scheme passing fixtures, fix the CHANGELOG conjunction, correct the stale PASS counts, and record the fix3 review*

- [x] **Track: DSH Measure commit guard substitution fail-closed**
  *Link: [./archive/dsh_measure_commit_substitution_20261109/](./archive/dsh_measure_commit_substitution_20261109/)*
  *Make the strict commit guard's addedPaths fail closed when a command substitution hides a git add, with unit cases and the tech-debt row narrowed*

- [x] **Track: DSH Measure commit guard nested-command coverage**
  *Link: [./archive/dsh_measure_commit_nested_20261109/](./archive/dsh_measure_commit_nested_20261109/)*
  *Treat git stage like git add and scan bash/sh/zsh -c and eval inner commands recursively in the strict commit guard, with tests and the tech-debt residual narrowed*

- [x] **Track: DSH Measure commit guard nested fix2**
  *Link: [./archive/dsh_measure_commit_nested_fix2_20261109/](./archive/dsh_measure_commit_nested_fix2_20261109/)*
  *Pin the four-level depth cap, join all eval arguments, accept every shell -c spelling and git stage substitutions, add the missing tests, and record the review*

- [x] **Track: DSH Measure commit guard nested fix3**
  *Link: [./archive/dsh_measure_commit_nested_fix3_20261109/](./archive/dsh_measure_commit_nested_fix3_20261109/)*
  *Skip shell option arguments while finding -c, pin the depth boundary with a pair test, and correct the fix1/fix2 review records and CHANGELOG count*

- [x] **Track: DSH Measure commit guard nested fix4**
  *Link: [./archive/dsh_measure_commit_nested_fix4_20261109/](./archive/dsh_measure_commit_nested_fix4_20261109/)*
  *Step over option arguments by behavior (-euo, --rcfile), pin -- semantics against bash, add the cases, and correct the named records*

- [x] **Track: DSH Measure commit guard nested fix5**
  *Link: [./archive/dsh_measure_commit_nested_fix5_20261109/](./archive/dsh_measure_commit_nested_fix5_20261109/)*
  *Key -c detection on short option clusters (not --norc), add --init-file and --norc cases, and correct the fix3/fix4 records with named targets*

- [x] **Track: DSH Measure allow-list parse hardening**
  *Link: [./archive/dsh_measure_allow_parse_20261109/](./archive/dsh_measure_allow_parse_20261109/)*
  *Make allow-list dedupe linear with a visited set, ignore control-character entries with a reason, add tests, and update the row*

- [x] **Track: DSH Measure snapshot invalidation narrowing**
  *Link: [./archive/dsh_measure_snapshot_invalidate_20261109/](./archive/dsh_measure_snapshot_invalidate_20261109/)*
  *Narrow the per-tools/result snapshot invalidation to tools that can change the repository, with a read-only allowlist and fail-safe unknown names*

- [x] **Track: DSH Measure snapshot invalidation fix2**
  *Link: [./archive/dsh_measure_snapshot_invalidate_fix2_20261109/](./archive/dsh_measure_snapshot_invalidate_fix2_20261109/)*
  *Export MUTATION_TOOLS with a disjoint-set test, state the within-step window, and correct the row and spec records*

- [x] **Track: DSH Measure snapshot invalidation fix3**
  *Link: [./archive/dsh_measure_snapshot_invalidate_fix3_20261109/](./archive/dsh_measure_snapshot_invalidate_fix3_20261109/)*
  *Records-only: put all four corrections in the fix2 spec, fix the original count note, dual-attribute the CHANGELOG, add the rev-parse cost, and consolidate the perf row*

- [x] **Track: DSH Measure contracts matching and scope details**
  *Link: [./archive/dsh_measure_contracts_scope_20261110/](./archive/dsh_measure_contracts_scope_20261110/)*
  *Document the marker matching, raw dispositions value, scope names, non-ancestor baseline, unioned changed files, and HEAD-advance rules in contracts.md with doc-test assertions*

- [x] **Track: DSH Measure audit role contract alignment**
  *Link: [./archive/dsh_measure_audit_contract_20261110/](./archive/dsh_measure_audit_contract_20261110/)*
  *Align the audit role contract: schema version 1, an orchestrator-audit role gate, proposal-only outputs matching the permissions, and tests*

- [x] **Track: DSH Measure audit contract fix2**
  *Link: [./archive/dsh_measure_audit_contract_fix2_20261110/](./archive/dsh_measure_audit_contract_fix2_20261110/)*
  *Remove the remaining append/write instructions, define the PROPOSAL candidate format, pin the measure-orchestrator-audit alias and negative doc checks, and record the review*

- [x] **Track: DSH Measure audit contract fix3**
  *Link: [./archive/dsh_measure_audit_contract_fix3_20261110/](./archive/dsh_measure_audit_contract_fix3_20261110/)*
  *Pin the proposal status rule, make the doc checks whole-file and format-complete, and reconcile the fix2 review*

- [x] **Track: DSH Measure apply_patch visibility**
  *Link: [./archive/dsh_measure_apply_patch_visibility_20261110/](./archive/dsh_measure_apply_patch_visibility_20261110/)*
  *Reconstruct the apply_patch and str_replace_editor after-text for the closeout guard and close the cp/mv/install shell-write gap*

- [x] **Track: DSH Measure commit global options**
  *Link: [./archive/dsh_measure_commit_git_options_20261110/](./archive/dsh_measure_commit_git_options_20261110/)*
  *Keep the in-command git add visible through the documented git global options and fail closed on an unknown one*

- [x] **Track: DSH Measure commit global detection**
  *Link: [./archive/dsh_measure_commit_global_detect_20261110/](./archive/dsh_measure_commit_global_detect_20261110/)*
  *Recognize the documented git global options before commit and add so the strict commit guard cannot be skipped*

- [x] **Track: DSH Measure shell redirect safety**
  *Link: [./archive/dsh_measure_shell_redirect_safety_20261110/](./archive/dsh_measure_shell_redirect_safety_20261110/)*
  *Recognize the noclobber redirect and the ln destination in the bounded shell-write grammar*

- [x] **Track: DSH Measure contract clarity**
  *Link: [./archive/dsh_measure_contract_clarity_20261110/](./archive/dsh_measure_contract_clarity_20261110/)*
  *Write and pin the phase-acceptance HEAD exception, the new-track step-9 decisions, and the audit-result identity fields*

- [x] **Track: DSH Measure gate robustness**
  *Link: [./archive/dsh_measure_gate_robustness_20261110/](./archive/dsh_measure_gate_robustness_20261110/)*
  *Make the live corpus the committed one and tolerate empty documents under pipefail in the A11 recipe*

- [x] **Track: DSH Measure band render test**
  *Link: [./archive/dsh_measure_band_render_test_20261110/](./archive/dsh_measure_band_render_test_20261110/)*
  *Render the shipped client bundle in a dependency-free fake React and assert the band, panel, i18n, and apply registrations*

- [x] **Track: DSH Measure A11 dotdot scope**
  *Link: [./archive/dsh_measure_a11_dotdot_scope_20261110/](./archive/dsh_measure_a11_dotdot_scope_20261110/)*
  *Keep the A11 doc-drift recipe inside the repository by skipping claims with a dotdot segment*

- [x] **Track: DSH Measure route identity**
  *Link: [./archive/dsh_measure_route_identity_20261110/](./archive/dsh_measure_route_identity_20261110/)*
  *Attach the module identity headers to every state- and setup-route response, not only the 200 view*

- [x] **Track: DSH Measure setup route transport**
  *Link: [./archive/dsh_measure_setup_route_transport_20261110/](./archive/dsh_measure_setup_route_transport_20261110/)*
  *Register the setup route as a handler so a POST reaches setupResponse on the Host, and prove it live*

- [x] **Track: DSH Measure band poll pause**
  *Link: [./archive/dsh_measure_band_poll_pause_20261110/](./archive/dsh_measure_band_poll_pause_20261110/)*
  *Pause the band and panel state poll while the page is hidden and refresh on return to visibility*

- [x] **Track: DSH Measure TDD name rules**
  *Link: [./archive/dsh_measure_tdd_name_rules_20261110/](./archive/dsh_measure_tdd_name_rules_20261110/)*
  *Recognize nested test-directory files and the node --test runner in the shared TDD name rules*

- [x] **Track: DSH Measure agent tools**
  *Link: [./archive/dsh_measure_agent_tools_20261110/](./archive/dsh_measure_agent_tools_20261110/)*
  *Add read-only measure_verify and measure_mode tools so agents can use the verify and mode report without the GUI*

- [x] **Track: DSH Measure count pins**
  *Link: [./archive/dsh_measure_count_pins_20261110/](./archive/dsh_measure_count_pins_20261110/)*
  *Derive the anti-pattern class count and range from the catalog so the doc-drift count checks stop being frozen literals*

- [x] **Track: DSH Measure commit wrapper closure**
  *Link: [./archive/dsh_measure_commit_wrapper_20261110/](./archive/dsh_measure_commit_wrapper_20261110/)*
  *Fail closed on a nested-shell script, a directly invoked script, and a sourced script in the commit guard's add scan*

- [x] **Track: DSH Measure gate timing**
  *Link: [./archive/dsh_measure_gate_timing_20261110/](./archive/dsh_measure_gate_timing_20261110/)*
  *Make the adversarial-suite wall-clock budgets tolerant of a loaded machine while still catching algorithmic blowups*

- [x] **Track: DSH Measure doc contract**
  *Link: [./archive/dsh_measure_doc_contract_20261110/](./archive/dsh_measure_doc_contract_20261110/)*
  *Copy a project's metadata keys in new-track and lint inline code spans in the guide and plugin READMEs*

- [x] **Track: DSH Measure installer atomicity**
  *Link: [./archive/dsh_measure_installer_atomic_20261110/](./archive/dsh_measure_installer_atomic_20261110/)*
  *Write each installed skill file and the stamp through a sibling temporary file and rename, and test the atomic path*

- [x] **Track: DSH Measure shell visibility for every adapter**
  *Link: [./archive/dsh_measure_shell_visibility_adapters_20261110/](./archive/dsh_measure_shell_visibility_adapters_20261110/)*
  *Share the bounded shell-write grammar in the core and feed its targets to the mod and OpenCode edit and TDD guards*

- [x] **Track: DSH Measure band width**
  *Link: [./archive/dsh_measure_band_width_20261110/](./archive/dsh_measure_band_width_20261110/)*
  *Cap the band line by terminal columns so wide East Asian text cannot overflow and zero-width text is not over-counted*

- [x] **Track: DSH Measure TDD names and fixture paths**
  *Link: [./archive/dsh_measure_tdd_names_fixture_20261110/](./archive/dsh_measure_tdd_names_fixture_20261110/)*
  *Cover two more test-file conventions and test commands, and point the real-data fixture generator at the archived plans*

- [x] **Track: DSH Measure accepted-risk closure**
  *Link: [./archive/dsh_measure_accepted_closure_20261110/](./archive/dsh_measure_accepted_closure_20261110/)*
  *Close the accepted design rows with recorded rationale and pin the read-only agent tool surface*

- [x] **Track: DSH Measure limits documentation**
  *Link: [./archive/dsh_measure_limits_docs_20261110/](./archive/dsh_measure_limits_docs_20261110/)*
  *Document the Host and OpenCode runtime constraints in the adapter READMEs, pin the sections, and close the constraint rows*

- [x] **Track: DSH Measure track-scoped gates**
  *Link: [./archive/dsh_measure_red_scope_gates_20261110/](./archive/dsh_measure_red_scope_gates_20261110/)*
  *Apply the Mid Red track scope to the spec-review scope rule, ux-paths, and the Jr Green HEAD-advance check*

- [x] **Track: Red gate track scope**
  *Link: [./archive/red_gate_track_scope_20261108/](./archive/red_gate_track_scope_20261108/)*
  *Scope the mid-red role gate to the commits of the track under check, so commits of other tracks in the same range do not fail it (PM request, 2026-11-08).*

- [x] **Track: Gate track scope**
  *Link: [./archive/gate_track_scope_20261108/](./archive/gate_track_scope_20261108/)*
  *Give the spec-review, jr-green, and ux-browser-review gates and the ux-paths command the mid-red track scope, so commits of other tracks in the range do not change their result (PM request, 2026-11-08).*

- [x] **Track: Guard session track**
  *Link: [./archive/guard_session_track_20261109/](./archive/guard_session_track_20261109/)*
  *Give each OpenCode session its own track in the measure-guard task note, from its prompts, its title, or the files it writes, and list the tracks in progress when a session names none (PM request, 2026-11-09).*

- [x] **Track: Guard phase start**
  *Link: [./archive/guard_phase_start_20261109/](./archive/guard_phase_start_20261109/)*
  *Make the phase-start rule of the measure-guard closeout guard a note in place of a deny, so a task can start or close while an earlier phase has no checkpoint (PM request, 2026-11-09).*

- [x] **Track: DSH idle-session compaction**
  *Link: [./archive/dsh_idle_compaction_20261110/](./archive/dsh_idle_compaction_20261110/)*
  *Compact a live session after 55 minutes without activity, but skip it when nothing new was recorded since the last compaction*

- [x] **Track: DSH Measure band strip**
  *Link: [./archive/dsh_measure_band_strip_20261110/](./archive/dsh_measure_band_strip_20261110/)*
  *Keep the Measure band to one bounded row and turn its inline problem list into a count that opens the panel*

- [x] **Track: Installed role-file edits**
  *Link: [./archive/role_file_edits_20261111/](./archive/role_file_edits_20261111/)*
  *Copy the installed role-file edits (higher step limits, the Rating rubric v1 section, the Route line rule) into agents/, so the repository and the installed roles agree (PM decision, 2026-11-11)*

- [x] **Track: Merge pull request 9**
  *Link: [./archive/pr_9_merge_20261111/](./archive/pr_9_merge_20261111/)*
  *Review PR #9 (orchestrator process review, measure-status extension, and installed role-file edits) against its stated verification, then merge it into main*

- [x] **Track: Implement the orchestrator process review**
  *Link: [./archive/orchestrator_process_fixes_20261111/](./archive/orchestrator_process_fixes_20261111/)*
  *Implement the 2026-11-10 orchestrator process review: fail-fast dispatch and permissions, a two-round remediation limit with count-free records, committed gate commands with a final-acceptance closeout, and the review's other findings*

- [x] **Track: Orchestrator shell default ask**
  *Link: [./archive/orchestrator_shell_ask_20261111/](./archive/orchestrator_shell_ask_20261111/)*
  *Change the default shell entry of agents/measure-orchestrator.md from deny back to ask and keep the rest of 72e20d3 (PM order, 2026-11-11)*
