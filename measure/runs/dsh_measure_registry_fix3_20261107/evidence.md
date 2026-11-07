# Registry checker completeness evidence

Date: 2026-11-08

Structural check: bash tests/dsh/test-registry.sh
[PASS] the registry has one complete three-line entry per archive directory
[PASS] archive directories without entries are rejected
[PASS] an archived entry outside the section is rejected
[PASS] a description that differs from metadata is rejected
[PASS] a clipped description is rejected
[PASS] the old single-line entry shape is rejected
[PASS] a missing description is rejected
[PASS] an orphan description is rejected
[PASS] a title without its own link is rejected
[PASS] a duplicate entry is rejected
[PASS] two active tracks are rejected
[PASS] a description that differs from the empty-metadata fallback is rejected
[PASS] a cancelled reason entry inside Archived is rejected
[PASS] an active entry inside Archived is rejected

Registry count: 40 archive directories = 40 archive-referencing lines (each directory one entry); active entries: 1.

Gates: node 301/301; both parity gates ok; CLI suite 11 passed / 0 failed.

closeout --track dsh_measure_registry_fix3_20261107:
FAIL: completed plan task lacks commit SHA: - [x] Task 2.1: write `measure/archive/dsh_measure_registry_fix2_20261107/spec-review.md` with F1–F7 and one disposition each, link it from that track's index, and correct its Overview's pre-fix shape; state the entry count as archive-referencing entries in this track's record
FAIL: completed plan task lacks commit SHA: - [x] Task 2.2: run the node suite (301/301), both parity scripts, and `bash tests/dsh/run.sh`; record the results
FAIL: completed plan task lacks commit SHA: - [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_registry_fix3_20261107` and record the manifest-only FAIL
FAIL: completed plan task lacks commit SHA: - [x] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
FAIL: missing closeout manifest: /home/daniel-bo/Desktop/measure/measure/archive/dsh_measure_registry_fix3_20261107/automation-supervisor-closeout-manifest.json

## Addendum (2026-11-08, after the fix4 review)

The four missing-SHA failures above were repaired: the archived fix3 plan's Tasks 2.1, 2.2, 3.1 and the Phase 3 verification line now carry commit SHAs (2dcc69e / 457a272 / 2dcc69e and the Phase 3 checkpoint).

Current fix3 closeout output:
FAIL: missing closeout manifest: /home/daniel-bo/Desktop/measure/measure/archive/dsh_measure_registry_fix3_20261107/automation-supervisor-closeout-manifest.json

The check currently prints fourteen PASS lines (this file lists them above); the original eleven plus the empty-fallback, reason-entry-in-Archived, and active-entry-in-Archived cases.
