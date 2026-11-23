#!/usr/bin/env bash
# Contract test: the 8 audit roles allow the role-gate command (FR-1 to FR-3 of
# measure/tracks/audit_role_gate_allow_20261123/spec.md).
# Uses the same v2_shell_effect helper as tests/spec_review_gate/test_s2_role_docs.sh
# and follows the same convention, so tests/spec_review_gate/run.sh runs it in CI.
# Defenses: A4 (every extract is asserted non-empty before a compare),
# A3 (labeled comparisons, no bare-digit match), A7 (exact fixed strings, no exclusion filter).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

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

# rules FILE: one 'action|resource|effect' line for each permissions rule in the frontmatter of FILE
rules() {
  awk 'NR > 1 && $0 == "---" { exit }
       /^  - action: / { a = $3 }
       /^    resource: / { r = substr($0, index($0, ":") + 2) }
       /^    effect: / { print a "|" r "|" $2 }' "$1" 2>/dev/null
}

# v2_shell_effect FILE CMD: evaluate the shell rules of FILE for CMD with the
# OpenCode V2 rules: whole-value wildcard match (`*` is zero or more characters,
# `?` is one character, other characters are literal; the quotes of the resource
# are stripped), a pattern that ends in " *" also matches the value without that
# suffix, the last matching rule gives the effect, and no match gives ask.
v2_shell_effect() {
  local cmd="$2" act res pat eff result="ask"
  while IFS='|' read -r act res eff; do
    [ "$act" = "shell" ] || continue
    pat="${res%\"}"
    pat="${pat#\"}"
    if [[ "$cmd" == $pat ]] || { [[ "$pat" == *' *' ]] && [[ "$cmd" == ${pat%' *'} ]]; }; then
      result="$eff"
    fi
  done < <(rules "$1" | grep '^shell|')
  printf '%s' "$result"
}

AUDIT_ROLES=(
  agents/measure-ux-browser-review.md
  agents/measure-final-acceptance.md
  agents/measure-review-c-ux-api.md
  agents/measure-phase-acceptance.md
  agents/measure-orchestrator-audit.md
  agents/measure-review-a-correctness.md
  agents/measure-review-b-security.md
  agents/measure-spec-review.md
)

# FR-3: the exact failing shape. The phase text holds "rm (" so the unanchored
# "*rm *" deny matches it until the FR-1 allow rule is added.
BASE_CMD='python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py role-gate --repo . --role phase-acceptance --track t --phase "Phase 1: README uses the heavy-run form (due 2026-11-26)" --baseline abc --result-file measure/runs/t/r.json --log-file measure/runs/t/r.log'
CLOSEOUT_CMD='python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py closeout --repo . --track t'
# FR-1: the new rule uses this resource with effect allow.
ALLOW_RESOURCE='    resource: "python3 */measure-orchestrator/scripts/measure_interphase_checks.py role-gate *"'
# FR-3: the closeout expectation is the effect at this base commit.
BASE_COMMIT=3c694b5

# effect_check LABEL FILE CMD EXPECTED: pass when v2_shell_effect of CMD in FILE equals EXPECTED
effect_check() {
  echo "=== $1 ==="
  local got
  got="$(v2_shell_effect "$2" "$3")"
  if blank "$got"; then fail "$1: no effect evaluated"
  elif [ "$got" = "$4" ]; then pass "$1: $got"
  else fail "$1: gives [$got], expected [$4]"; fi
}

for f in "${AUDIT_ROLES[@]}"; do
  echo "=== $f: the role file is in scope (holds the *rm * deny) ==="
  if [ ! -s "$ROOT/$f" ]; then
    fail "$f: the role file is missing or empty"
    continue
  fi
  rm_ln=$(grep -nxF -- '    resource: "*rm *"' "$ROOT/$f" 2>/dev/null | head -n 1 | cut -d: -f1 || true)
  if blank "$rm_ln"; then
    fail "$f: the role file holds no *rm * deny, so it is out of scope"
    continue
  fi
  rm_eff="$(sed -n "$((rm_ln + 1))p" "$ROOT/$f")"
  if [ "$rm_eff" = "    effect: deny" ]; then pass "$f: holds the *rm * deny at line $rm_ln"
  else fail "$f: the *rm * rule at line $rm_ln is followed by [$rm_eff], expected [    effect: deny]"; fi

  # FR-3: the exact failing shape gives allow (deny before the FR-1 edit).
  effect_check "$f: role-gate shape gives allow" "$ROOT/$f" "$BASE_CMD" "allow"
  # FR-1 accepted gap: a chain with no matched redirect still gives allow.
  effect_check "$f: role-gate shape with ; rm x gives allow (accepted gap, FR-1)" "$ROOT/$f" "$BASE_CMD; rm x" "allow"
  # FR-1: a matched redirect (a space before >) gives deny; the later redirect denies win.
  effect_check "$f: role-gate shape with a spaced redirect gives deny" "$ROOT/$f" "$BASE_CMD > out.txt" "deny"
  effect_check "$f: role-gate shape with a chained spaced redirect gives deny" "$ROOT/$f" "$BASE_CMD; rm x > out.txt" "deny"
  # FR-1 existing gap, unchanged: an unspaced > matches none of the three denies.
  effect_check "$f: role-gate shape with 2>&1 gives allow (existing gap, unchanged)" "$ROOT/$f" "$BASE_CMD 2>&1" "allow"

  # FR-3: commands that do not start with the role-gate form still deny.
  effect_check "$f: rm x still gives deny" "$ROOT/$f" "rm x" "deny"
  effect_check "$f: cp a b still gives deny" "$ROOT/$f" "cp a b" "deny"
  effect_check "$f: git commit -m x still gives deny" "$ROOT/$f" "git commit -m x" "deny"

  # FR-3: the closeout shape keeps the effect recorded at the base commit.
  echo "=== $f: closeout shape keeps the base-commit effect ==="
  base_file="$TMP/base_$(basename "$f")"
  if ! git -C "$ROOT" show "$BASE_COMMIT:$f" > "$base_file" 2>/dev/null || [ ! -s "$base_file" ]; then
    fail "$f: cannot read the role file at the base commit $BASE_COMMIT"
  else
    expected="$(v2_shell_effect "$base_file" "$CLOSEOUT_CMD")"
    if blank "$expected"; then
      fail "$f: no closeout effect evaluated at the base commit"
    else
      got="$(v2_shell_effect "$ROOT/$f" "$CLOSEOUT_CMD")"
      if blank "$got"; then fail "$f: no closeout effect evaluated"
      elif [ "$got" = "$expected" ]; then pass "$f: closeout gives [$got], the base-commit effect"
      else fail "$f: closeout gives [$got], expected the base-commit effect [$expected]"; fi
    fi
  fi

  # FR-1 and FR-3: the allow rule sits after the *truncate * deny and before the * > * deny.
  echo "=== $f: allow rule sits after the truncate deny and before the write-redirect deny ==="
  trunc_ln=$(grep -nxF -- '    resource: "*truncate *"' "$ROOT/$f" 2>/dev/null | head -n 1 | cut -d: -f1 || true)
  allow_ln=$(grep -nxF -- "$ALLOW_RESOURCE" "$ROOT/$f" 2>/dev/null | head -n 1 | cut -d: -f1 || true)
  redir_ln=$(grep -nxF -- '    resource: "* > *"' "$ROOT/$f" 2>/dev/null | head -n 1 | cut -d: -f1 || true)
  if blank "$trunc_ln" || blank "$redir_ln"; then
    fail "$f: the truncate or write-redirect deny is missing (truncate=[$trunc_ln] redirect=[$redir_ln])"
  elif blank "$allow_ln"; then
    fail "$f: the role-gate allow rule is missing (expected after line $trunc_ln and before line $redir_ln)"
  elif [ "$allow_ln" -gt "$trunc_ln" ] && [ "$allow_ln" -lt "$redir_ln" ]; then
    pass "$f: allow rule at line $allow_ln, after truncate (line $trunc_ln) and before redirect (line $redir_ln)"
  else
    fail "$f: allow rule at line $allow_ln, expected after line $trunc_ln and before line $redir_ln"
  fi
done

echo ""
echo "=== Results ==="
for r in "${RESULTS[@]}"; do echo "$r"; done
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "=== Total: $TOTAL checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
