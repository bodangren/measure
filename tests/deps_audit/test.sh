#!/usr/bin/env bash
# tests/deps_audit/test.sh — Red failing check for the deps audit (Task 1.1).
#
# Contract under test (tests/deps_audit/run.sh, written by Green in Task 1.2):
# - run.sh runs `bun audit --json` in extensions/measure-status and in
#   plugins/opencode-measure-guard, then counts advisories by severity.
# - It prints one line per folder, in this exact shape:
#     <folder>: critical N, high N, moderate N, low N
#   where <folder> is the folder base name (measure-status,
#   opencode-measure-guard).
# - Exit 0 when both folders hold 0 critical and 0 high advisories.
# - Exit 1 when any folder holds a critical or high advisory that is not
#   allowed. Exit 2 when `bun audit` fails or its output does not parse.
# - Env contract Green must implement:
#     DEPS_AUDIT_FIXTURE_DIR — when set, the parser reads
#       <dir>/measure-status.json and <dir>/opencode-measure-guard.json
#       (files shaped like real `bun audit --json` output) instead of
#       running `bun audit`, so tests run without the network.
#     DEPS_AUDIT_ALLOW_FILE — path of the allow file; defaults to
#       tests/deps_audit/allow.txt. The file lists one advisory per line;
#       an entry holds a GHSA id plus its PM-accepted reason. An advisory
#       counts as allowed when its GHSA id (the advisory `url` tail, e.g.
#       GHSA-jp82-f5mq-hwhp) matches the GHSA id token of an allow line.
#       An allowed advisory does not count toward the exit code.
#
# Red state: run.sh does not exist yet, so every case below fails. That
# failure is the expected Red signal, not a broken test.
set -uo pipefail

DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
RUNSH="$DIR/run.sh"
FIX="$DIR/fixtures"
EMPTY_ALLOW="$FIX/empty-allow.txt"

FAILED=0
PASS_COUNT=0
FAIL_COUNT=0
RESULTS=()
pass() { RESULTS+=("PASS: $1"); PASS_COUNT=$((PASS_COUNT + 1)); echo "PASS: $1"; }
fail() { RESULTS+=("FAIL: $1"); FAIL_COUNT=$((FAIL_COUNT + 1)); FAILED=1; echo "FAIL: $1"; }

# run_case <name> <fixture-dir> <want-exit> [allow-file]
run_case() {
  local name="$1" casedir="$2" want="$3" allow="${4:-$EMPTY_ALLOW}"
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

# Cases 1-6: exit-code contract per fixture.
run_case "critical-in-one-folder" "$FIX/case-critical" 1
run_case "high-in-one-folder" "$FIX/case-high" 1
run_case "moderate-and-low-only" "$FIX/case-moderate-low" 0
run_case "no-advisories" "$FIX/case-clean" 0
run_case "allowed-high" "$FIX/case-allowed-high" 0 "$FIX/case-allowed-high/allow.txt"
run_case "bad-json" "$FIX/case-bad-json" 2

# Case 7: the output line format on the moderate/low fixture.
echo "=== output-line-format ==="
FORMAT_OUT=""
FORMAT_RC=0
if FORMAT_OUT="$(DEPS_AUDIT_FIXTURE_DIR="$FIX/case-moderate-low" DEPS_AUDIT_ALLOW_FILE="$EMPTY_ALLOW" bash "$RUNSH" 2>&1)"; then
  FORMAT_RC=0
else
  FORMAT_RC=$?
fi
if [[ "$FORMAT_RC" -eq 0 ]] \
  && printf '%s\n' "$FORMAT_OUT" | grep -q '^measure-status: critical 0, high 0, moderate 1, low 1$' \
  && printf '%s\n' "$FORMAT_OUT" | grep -q '^opencode-measure-guard: critical 0, high 0, moderate 0, low 0$'; then
  pass "output-line-format prints '<folder>: critical N, high N, moderate N, low N' per folder"
else
  fail "output-line-format prints '<folder>: critical N, high N, moderate N, low N' per folder (rc=$FORMAT_RC; output: $FORMAT_OUT)"
fi

# Case 8: a live run (no fixture dir) gives exit 0. This is the target
# state; it passes only after Task 1.2 clears the critical/high advisories.
echo "=== live-run ==="
LIVE_OUT=""
LIVE_RC=0
if LIVE_OUT="$(DEPS_AUDIT_ALLOW_FILE="$EMPTY_ALLOW" bash "$RUNSH" 2>&1)"; then
  LIVE_RC=0
else
  LIVE_RC=$?
fi
if [[ "$LIVE_RC" -eq 0 ]]; then
  pass "live-run exits 0"
else
  fail "live-run exits 0 (got $LIVE_RC; output: $LIVE_OUT)"
fi

echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
