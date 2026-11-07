# Registry check finalization evidence

Date: 2026-11-08

## Structural check

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

PASS lines: 14 (the original eleven plus the empty-fallback, reason-entry-in-Archived, and active-entry-in-Archived cases).

## Registry count

Archive directories: 41; archive-referencing entries: 41; active entries: 0.

## Gates

node suite: 301/301 pass
parity gates: parity: ok (both)
CLI suite: 11 passed / 0 failed
spec-review-gate: 10 suites (PASS=10, FAIL=0)

## Closeout outputs

fix3:
FAIL: missing closeout manifest: /home/daniel-bo/Desktop/measure/measure/archive/dsh_measure_registry_fix3_20261107/automation-supervisor-closeout-manifest.json

fix4:
FAIL: missing closeout manifest: /home/daniel-bo/Desktop/measure/measure/archive/dsh_measure_registry_fix4_20261107/automation-supervisor-closeout-manifest.json
