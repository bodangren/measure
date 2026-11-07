# Suite mktemp-failure guard evidence

Date: 2026-11-09

Every suite now exits 1 with 'FAIL: mktemp -d failed; no fixture can be built' and a one-FAIL summary when mktemp fails.

Proof suite: bash tests/spec_review_gate/test_mktemp_failure.sh -> 19 checks PASS=19 (nine suites with a failing mktemp, nine with a file-returning mktemp, repository unchanged including ignored paths).
Gate: 11 suites (PASS=11, FAIL=0).
CLI suite: 12 passed / 0 failed; node 301/301; parity ok.

## Closeout

FAIL: missing closeout manifest: /home/daniel-bo/Desktop/measure/measure/archive/dsh_measure_suite_mktemp_20261109/automation-supervisor-closeout-manifest.json
