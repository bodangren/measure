# Registry cleanup evidence

Date: 2026-11-08

Before: the Archived Tracks section parsed to 25 entries, 16 description lines merged under the last entry, and one archive directory (visual_refresh_20260425) existed only as a single-line link; 5 old tracks (lessons_learned, scrum_tracks, graph_integration, visual_refresh, track_sets) had no archive-section entry.

After: 37 archive directories = 37 *Link lines (one each); 0 merged description blocks; every [x] **Track:** line has its link within 2 lines; the new tests/dsh/test-registry.sh enforces these rules and rejects a synthetic merged block and an unreferenced archive directory.

Script check output:
archive dirs: 37
dirs with exactly one link line: 37
merged description blocks: 0

Phase 2 gates (dsh_measure_registry_20261107):
node suite 301/301 pass; parity: ok (both)
CLI suite: 11 passed, 0 failed (includes test-registry.sh)
