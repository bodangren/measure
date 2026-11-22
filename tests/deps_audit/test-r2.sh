#!/usr/bin/env bash
# tests/deps_audit/test-r2.sh — Green regression check for Review A F1 and F2.
#
# It covers the audit check tests/deps_audit/run.sh:
# - F1: an advisory record with a missing severity, or with a severity outside
#   critical, high, moderate, and low, is malformed. The check exits 2.
# - F2: an allow line needs a nonempty reason after the GHSA id. A bare id
#   does not exempt an advisory, and an id matches exactly, never as a prefix.
#
# The Red test tests/deps_audit/test.sh and its fixtures stay untouched. The
# fixtures of the cases below live under tests/deps_audit/fixtures/ and belong
# to this file.
set -uo pipefail

DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
RUNSH="$DIR/run.sh"
FIX="$DIR/fixtures"

FAILED=0
PASS_COUNT=0
FAIL_COUNT=0
pass() { PASS_COUNT=$((PASS_COUNT + 1)); echo "PASS: $1"; }
fail() { FAILED=1; FAIL_COUNT=$((FAIL_COUNT + 1)); echo "FAIL: $1"; }

# run_case <name> <fixture-dir> <want-exit> [allow-file]
run_case() {
  local name="$1" casedir="$2" want="$3" allow="${4:-$FIX/empty-allow.txt}"
  echo "=== $name ==="
  local out rc
  if out="$(DEPS_AUDIT_FIXTURE_DIR="$casedir" DEPS_AUDIT_ALLOW_FILE="$allow" bash "$RUNSH" 2>&1)"; then
    rc=0
  else
    rc=$?
  fi
  if [[ "$rc" -eq "$want" ]]; then
    pass "$name exits $want (got $rc)"
  else
    fail "$name exits $want (got $rc; output: $out)"
  fi
  printf '%s' "$out"
}

# Case 1: an advisory record without a severity is malformed.
run_case "missing-severity" "$FIX/case-missing-severity" 2

# Case 2: an advisory record with a severity outside the four names is
# malformed.
run_case "unknown-severity" "$FIX/case-unknown-severity" 2

# Case 3: an allow line without a reason does not exempt the advisory.
run_case "bare-id-no-reason" "$FIX/case-bare-id" 1 "$FIX/case-bare-id/allow.txt"

# Case 4: the advisory of the bare-id case stays counted, and the prefix id
# with a reason does not exempt it either.
echo "=== bare-id-counts ==="
BARE_OUT=""
BARE_RC=0
if BARE_OUT="$(DEPS_AUDIT_FIXTURE_DIR="$FIX/case-bare-id" DEPS_AUDIT_ALLOW_FILE="$FIX/case-bare-id/allow.txt" bash "$RUNSH" 2>&1)"; then
  BARE_RC=0
else
  BARE_RC=$?
fi
if [[ "$BARE_RC" -eq 1 ]] \
  && printf '%s\n' "$BARE_OUT" | grep -q '^opencode-measure-guard: critical 0, high 1, moderate 0, low 0$'; then
  pass "bare-id-counts keeps the high advisory counted"
else
  fail "bare-id-counts keeps the high advisory counted (rc=$BARE_RC; output: $BARE_OUT)"
fi

echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
