# Lessons Learned

> This file is curated working memory, not an append-only log. Keep it at or below **50 lines**.
> Remove or condense entries that are no longer relevant to near-term planning.

## Architecture & Design

- (2026-05-25, scrum_tracks_20260525) Opt-in additive design (Sprint Mode) preserved 100% backward compatibility with two existing tracks. Pattern: gate new behavior on a single signal (`## Stories` in spec / `sprint` key in metadata), and require ALL readers to treat absence as classic mode without warning.

## Recurring Gotchas

- (2026-05-25, scrum_tracks_20260525) When inserting a new step mid-list in a numbered reference doc (e.g., `new-track.md §2.2`), prior step references in *other* docs may silently drift. Audit cross-references after any §X step-number change.

## Patterns That Worked Well

- (2026-05-25, scrum_tracks_20260525) Self-dogfooding: making the track that introduces a feature *also* be the first user of that feature (story-shaped spec, sprint metadata, velocity datapoint) caught two real issues during execution that pure unit-testing would have missed.
- (2026-05-25, scrum_tracks_20260525) Locking acceptance criteria as a separate dedicated task before any edits (Tasks X.1 in every phase) eliminated mid-task scope drift across all 6 phases.

## Planning Improvements

- (2026-05-25, scrum_tracks_20260525) Estimate was perfect (28 tasks planned, 28 actual). One contributor: the Phase Completion Verification tasks were counted up front rather than added late, so the plan reflected real ceremony cost.
- (2026-05-25, scrum_tracks_20260525) Tasks 1.2 and 1.3 ended up folded into a single commit because their edits touched the same numbered step block. Future plans: when two consecutive tasks edit the same code/doc region, consider merging them at planning time.
