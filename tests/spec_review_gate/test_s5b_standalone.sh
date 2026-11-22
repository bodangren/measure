#!/usr/bin/env bash
# S5b contract test: the late-finding stop rule reads standalone.
# The delivered rule text must not use a track-local FR id, which a skill reader
# cannot resolve. The two count and record sentences name the exception instead.
# Defenses: A4 (the stop-rule extract is asserted non-empty before each search),
# A3 (no count assertions), A7 (exact fixed strings, no exclusion filter).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CONTRACTS="$ROOT/skills/measure-orchestrator/references/contracts.md"

FAILED=0
PASS_COUNT=0
FAIL_COUNT=0
RESULTS=()
pass() { RESULTS+=("PASS: $1"); PASS_COUNT=$((PASS_COUNT + 1)); echo "PASS: $1"; }
fail() { RESULTS+=("FAIL: $1"); FAIL_COUNT=$((FAIL_COUNT + 1)); FAILED=1; echo "FAIL: $1"; }

TMP="$(mktemp -d)"
if [ -z "$TMP" ] || [ ! -d "$TMP" ]; then
  echo "FAIL: mktemp -d failed; no fixture can be built"
  echo "=== Total: 1 checks (PASS=0, FAIL=1) ==="
  exit 1
fi
trap 'rm -rf "$TMP"' EXIT

blank() { [ -z "${1//[[:space:]]/}" ]; }

# stop_rule: the stop-rule paragraph, from the bold heading to the next level-2 heading
stop_rule() {
  awk '
    /^[[:space:]]*```/ { fence = !fence }
    !fence && index($0, "**Late-finding stop rule.**") > 0 { found = 1 }
    found { if (!fence && $0 ~ /^## /) { exit }; print }
  ' "$1" 2>/dev/null
}

# flat TEXT: collapse newlines and runs of spaces to single spaces
flat() { printf '%s\n' "$1" | tr '\n' ' ' | sed -E 's/[[:space:]]+/ /g'; }

# in_flat LABEL TEXT STRING: pass when TEXT holds STRING after whitespace collapse
in_flat() {
  echo "=== $1 ==="
  if blank "$2"; then fail "$1: the searched text is missing or empty"
  elif [[ "$(flat "$2")" == *"$3"* ]]; then pass "$1"
  else fail "$1: missing [$3]"; fi
}

echo "=== contracts.md exists ==="
if [ -s "$CONTRACTS" ]; then pass "contracts.md exists"; else fail "contracts.md is missing or empty"; fi

STOP="$(stop_rule "$CONTRACTS")"
echo "=== the stop-rule paragraph is non-empty ==="
if blank "$STOP"; then fail "the stop-rule paragraph is missing or empty"; else pass "the stop-rule paragraph is non-empty"; fi

# The new case: a track-local FR id in the rule text fails the check.
echo "=== the stop-rule paragraph holds no track-local FR id ==="
if blank "$STOP"; then fail "the stop-rule paragraph is missing or empty"
elif grep -qF -- 'FR-' <<< "$STOP"; then fail "the stop-rule paragraph holds a track-local FR id"
else pass "the stop-rule paragraph holds no track-local FR id"; fi

in_flat 'the count rule names the wrong-result exception' "$STOP" 'A one-fix-round finding under the wrong-result exception counts toward the Round limit count.'
in_flat 'the record rule names the wrong-result exception' "$STOP" 'The reason states why the finding did or did not meet the wrong-result exception.'

echo ""
echo "=== Results ==="
for r in "${RESULTS[@]}"; do echo "$r"; done
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "=== Total: $TOTAL checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
