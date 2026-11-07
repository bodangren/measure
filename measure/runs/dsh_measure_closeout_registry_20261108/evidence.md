# Closeout registry-description guard evidence

Date: 2026-11-09

New test: bash tests/dsh/test-closeout-registry.sh -> 4 PASS (matching, drifted metadata, missing description, missing entry).
Real tracks: closeout reports only the expected manifest FAIL (dsh_measure_a11_recipe_fix3_20261108, dsh_measure_registry_fix4_20261107 checked).
CLI suite: 12 passed / 0 failed.
srg: 10 suites (PASS=10, FAIL=0); node 301/301; parity ok.

## Closeout (after the metadata sync caught by the new check)

FAIL: missing closeout manifest: /home/daniel-bo/Desktop/measure/measure/archive/dsh_measure_closeout_registry_20261108/automation-supervisor-closeout-manifest.json

The new guard caught this track's own metadata/registry drift before the sync; after the sync the output is the expected manifest-only FAIL.
