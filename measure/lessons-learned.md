# Lessons Learned

> This file is curated working memory, not an append-only log. Keep it at or below **50 lines**.
> Remove or condense entries that are no longer relevant to near-term planning.

## Architecture & Design

- (2026-05-25, scrum_tracks_20260525) Opt-in additive design (Sprint Mode) preserved 100% backward compatibility with two existing tracks. Pattern: gate new behavior on a single signal (`## Stories` in spec / `sprint` key in metadata), and require ALL readers to treat absence as classic mode without warning.
- <a id="2026-05-25-graph_integration"></a>(2026-05-25, graph_integration_20260525) Graph-Aware Mode uses a 3-way availability gate (tool on PATH AND data file fresh AND project language matches) so every entry point degrades to a single `Note: ...` line without HALT. Reusing the same 3 skip-note formats across all 5 entry points (new-track, implement, review, setup) made the user-visible behavior predictable.

- <a id="2026-10-04-measure_guard"></a>(2026-10-04, measure_guard_20261004) Keep the system prompt fixed and send changing state (track, task, reminders) as conversation notes. A system prompt that changes with each task resets the prompt cache.
- (2026-10-04, measure_guard_20261004) Claude Code mods: a function that uses `$` must be in the hooks module file; the engine does not follow `$` across an import. Put pure logic in imported modules and the `$` calls in `register.tsx`.

## Recurring Gotchas

- (2026-05-25, scrum_tracks_20260525) When inserting a new step mid-list in a numbered reference doc (e.g., `new-track.md §2.2`), prior step references in *other* docs may silently drift. Audit cross-references after any §X step-number change.
- (2026-05-25, graph_integration_20260525) Inserting a new numbered step in a markdown file can create duplicate numbers (two `3.` items) when only one renumber pass is done. Always grep `^[0-9]\.` after every insertion and renumber the suffix block in one shot.

- (2026-10-04, measure_guard_20261004) The `claude plugin test` environment has no file, network, or process access, and its `$` has no `store` noun. A test answers each `$` call with its own hooks; fixtures must be `.ts` modules (generate them from real files with a script).
- (2026-10-04, measure_guard_20261004) A rule like "the active track is the first `[~]` track" breaks when 2 tracks are `[~]`. Check each selection rule against the real `tracks.md` before the spec is final.

- (2026-10-05, measure_guard_20261004) In an inline (not fullscreen) terminal, the pane close mark and `ctrl+x x` did not close a mod pane. Give each pane a command that also closes it, and open it with `closeOnEscape: true`.
- (2026-10-05, measure_guard_20261004) An interactive session watches a `--plugin-dir` folder: a saved edit reloads the mod at once, and an open pane stays open across the reload. No restart is necessary.

## Patterns That Worked Well

- (2026-05-25, scrum_tracks_20260525) Self-dogfooding: making the track that introduces a feature *also* be the first user of that feature (story-shaped spec, sprint metadata, velocity datapoint) caught two real issues during execution that pure unit-testing would have missed.
- (2026-05-25, scrum_tracks_20260525) Locking acceptance criteria as a separate dedicated task before any edits (Tasks X.1 in every phase) eliminated mid-task scope drift across all 6 phases.
- (2026-05-25, graph_integration_20260525) Same-region task folding (planned consecutive tasks that touch one doc collapsed into one commit) reduced 16 commits to 5 feature commits across S2-S5 with zero loss of traceability — every folded commit message names the folded task numbers.

- (2026-10-04, measure_guard_20261004) Two scratch scripts (task done: commit, git note, SHA in plan.md, next task `[~]`; phase done: checkpoint commit, report note, `[checkpoint: <sha>]`) made the per-task ceremony cheap across 47 tasks.

## Planning Improvements

- (2026-05-25, scrum_tracks_20260525) Estimate was perfect (28 tasks planned, 28 actual). One contributor: the Phase Completion Verification tasks were counted up front rather than added late, so the plan reflected real ceremony cost.
- (2026-05-25, scrum_tracks_20260525) Tasks 1.2 and 1.3 ended up folded into a single commit because their edits touched the same numbered step block. Future plans: when two consecutive tasks edit the same code/doc region, consider merging them at planning time.
- (2026-05-25, graph_integration_20260525) Estimate again hit exactly 28/28 (calibrated). Pattern confirmed: when a workflow-edit track has N stories and each story has ~5-6 tasks (1 AC + 1-3 edits + 1 cross-ref + 1 deferred manual verify), the per-story task count is predictable enough that the same template works across tracks.
- (2026-10-04, measure_guard_20261004) Estimate 47/47 for a 9-story code track: 5 tasks per story (Contract, Red, Green, Docs, deferred verification) plus 2 setup tasks. Each Red task recorded the failing test output in its git note.
