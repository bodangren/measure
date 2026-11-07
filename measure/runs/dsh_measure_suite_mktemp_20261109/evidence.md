# Suite mktemp-failure guard evidence

Date: 2026-11-09

Every suite now exits 1 with 'FAIL: mktemp -d failed; no fixture can be built' and a one-FAIL summary when mktemp fails.

Proof suite: bash tests/spec_review_gate/test_mktemp_failure.sh -> 10 checks PASS=10 (nine suites + repository unchanged).
Gate: 11 suites (PASS=11, FAIL=0).
CLI suite: 12 passed / 0 failed; node 301/301; parity ok.
