#!/usr/bin/env bash
# Contract test for the README heavy-run form (track readme_heavy_run_form_20261123).
#
# It checks plugins/opencode-measure-guard/README.md for FR-1 through FR-4:
# the Checks block uses the heavy-run form for both commands plus the new
# sentence; the Guards section gains the Heavy-run guard bullet; the Guards
# intro covers the shell tools; every other line is unchanged against
# git show cd3c41b:plugins/opencode-measure-guard/README.md.
# The test FAILS before the README edit (Red state).
#
# README_UNDER_TEST (or $1) overrides the file under test. It is used only
# for /tmp mutation fixtures that prove this test is not vacuous. It
# defaults to the repo README.
set -uo pipefail

DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd -- "$DIR/../.." && pwd)"
ORIG_REF="cd3c41b"
ORIG_PATH="plugins/opencode-measure-guard/README.md"
DEFAULT_README="$REPO/$ORIG_PATH"
README="${1:-${README_UNDER_TEST:-$DEFAULT_README}}"

HEAVY_PREFIX="HEAVY_PRIORITY=p1 HEAVY_MIN_AVAIL_MB=1500 /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c"
HEAVY_TEST="$HEAVY_PREFIX 'bun test'"
HEAVY_TYPE="$HEAVY_PREFIX 'timeout 120 bun install && bun x tsc --noEmit -p .'"
SENTENCE="The heavy-run guard refuses a bare suite or a bare \`tsc --noEmit\` in a role session; run both through \`scripts/jobs/heavy-run.sh\` as shown."

FAILED=0
PASS_COUNT=0
FAIL_COUNT=0
RESULTS=()

pass() { RESULTS+=("PASS: $1"); PASS_COUNT=$((PASS_COUNT + 1)); echo "PASS: $1"; }
fail() { RESULTS+=("FAIL: $1"); FAILED=1; FAIL_COUNT=$((FAIL_COUNT + 1)); echo "FAIL: $1"; }

have_readme=0
[ -f "$README" ] && have_readme=1

need_readme() {
  if [ "$have_readme" -eq 0 ]; then
    fail "$1: cannot check, README is missing: $README"
    return 1
  fi
  return 0
}

checks_section() {
  awk '/^## Checks/{f=1;next} f && /^## /{exit} f' "$README"
}

echo "=== readme-file-exists ==="
if [ "$have_readme" -eq 1 ]; then
  pass "readme-file-exists: $README exists"
else
  fail "readme-file-exists: $README is missing (Green has not edited it yet)"
fi

echo "=== checks-no-bare-bun-test ==="
if need_readme "checks-no-bare-bun-test"; then
  SECTION="$(checks_section)"
  bun_lines="$(echo "$SECTION" | grep -F 'bun test' || true)"
  if [ -z "$bun_lines" ]; then
    fail "checks-no-bare-bun-test: Checks section names no bun test line (heavy-run test line is missing)"
  elif echo "$bun_lines" | grep -q -F 'heavy-run.sh'; then
    bare="$(echo "$bun_lines" | grep -v -F 'heavy-run.sh' || true)"
    if [ -n "$bare" ]; then
      fail "checks-no-bare-bun-test: bare bun test line outside the heavy-run form: [$bare]"
    else
      pass "checks-no-bare-bun-test: every bun test line uses the heavy-run form"
    fi
  else
    fail "checks-no-bare-bun-test: bun test line is bare (no heavy-run.sh prefix)"
  fi
fi

echo "=== checks-no-bare-tsc ==="
if need_readme "checks-no-bare-tsc"; then
  SECTION="$(checks_section)"
  tsc_lines="$(echo "$SECTION" | grep -F 'bun x tsc' || true)"
  if [ -z "$tsc_lines" ]; then
    fail "checks-no-bare-tsc: Checks section names no bun x tsc line (heavy-run type line is missing)"
  elif echo "$tsc_lines" | grep -q -F 'heavy-run.sh'; then
    bare="$(echo "$tsc_lines" | grep -v -F 'heavy-run.sh' || true)"
    if [ -n "$bare" ]; then
      fail "checks-no-bare-tsc: bare bun x tsc line outside the heavy-run form: [$bare]"
    else
      pass "checks-no-bare-tsc: every bun x tsc line uses the heavy-run form"
    fi
  else
    fail "checks-no-bare-tsc: bun x tsc line is bare (no heavy-run.sh prefix)"
  fi
fi

echo "=== checks-heavy-test-line ==="
if need_readme "checks-heavy-test-line"; then
  if grep -q -F -- "$HEAVY_TEST" "$README"; then
    pass "checks-heavy-test-line: heavy-run test line is present"
  else
    fail "checks-heavy-test-line: missing heavy-run test line [$HEAVY_TEST]"
  fi
fi

echo "=== checks-heavy-type-line ==="
if need_readme "checks-heavy-type-line"; then
  if grep -q -F -- "$HEAVY_TYPE" "$README"; then
    pass "checks-heavy-type-line: heavy-run type line is present"
  else
    fail "checks-heavy-type-line: missing heavy-run type line [$HEAVY_TYPE]"
  fi
fi

echo "=== checks-new-sentence ==="
if need_readme "checks-new-sentence"; then
  if grep -q -F -- "$SENTENCE" "$README"; then
    pass "checks-new-sentence: new heavy-run sentence follows the Checks block"
  else
    fail "checks-new-sentence: missing sentence [$SENTENCE]"
  fi
fi

BULLET_LINE=""
if [ "$have_readme" -eq 1 ]; then
  BULLET_LINE="$(grep -F -- '- **Heavy-run guard.**' "$README" | head -n 1 || true)"
fi

echo "=== guards-bullet-present ==="
if need_readme "guards-bullet-present"; then
  if [ -n "$BULLET_LINE" ]; then
    pass "guards-bullet-present: Heavy-run guard bullet is present"
  else
    fail "guards-bullet-present: no bullet starts with - **Heavy-run guard.** (Green has not added it yet)"
  fi
fi

echo "=== guards-bullet-matcher ==="
if need_readme "guards-bullet-matcher"; then
  if [ -z "$BULLET_LINE" ]; then
    fail "guards-bullet-matcher: cannot check, bullet is missing"
  else
    missing=""
    for token in heavyRunDecision src/core/guards "first word" NAME=value npx bunx; do
      if ! echo "$BULLET_LINE" | grep -q -F -- "$token"; then
        missing="$missing [$token]"
      fi
    done
    if [ -z "$missing" ]; then
      pass "guards-bullet-matcher: bullet names heavyRunDecision, src/core/guards, the first-word rule, and the npx/bunx prefix"
    else
      fail "guards-bullet-matcher: bullet misses token(s):$missing"
    fi
  fi
fi

echo "=== guards-bullet-scope ==="
if need_readme "guards-bullet-scope"; then
  if [ -z "$BULLET_LINE" ]; then
    fail "guards-bullet-scope: cannot check, bullet is missing"
  else
    missing=""
    for token in mode "role session" "dev server" Playwright Chrome "test suite" render build-graph scripts/jobs/heavy-run.sh "tsc --noEmit"; do
      if ! echo "$BULLET_LINE" | grep -q -F -- "$token"; then
        missing="$missing [$token]"
      fi
    done
    if echo "$BULLET_LINE" | grep -q -F 'orchestrator'; then
      missing="$missing [must not name orchestrator]"
    fi
    if [ -z "$missing" ]; then
      pass "guards-bullet-scope: bullet names the mode, role sessions, every refused class, and the heavy-run path"
    else
      fail "guards-bullet-scope: bullet misses token(s):$missing"
    fi
  fi
fi

echo "=== guards-bullet-version ==="
if need_readme "guards-bullet-version"; then
  if [ -z "$BULLET_LINE" ]; then
    fail "guards-bullet-version: cannot check, bullet is missing"
  else
    missing=""
    echo "$BULLET_LINE" | grep -qE 'one[ -]line' || missing="$missing [one line]"
    echo "$BULLET_LINE" | grep -q -F 'heavy-run' || missing="$missing [heavy-run]"
    echo "$BULLET_LINE" | grep -q -F 'ersion 1' || missing="$missing [version 1]"
    echo "$BULLET_LINE" | grep -q -F 'direct commands only' || missing="$missing [direct commands only]"
    echo "$BULLET_LINE" | grep -q -F 'wrapper' || missing="$missing [wrapper]"
    echo "$BULLET_LINE" | grep -q -F 'bash -c' || missing="$missing [bash -c]"
    echo "$BULLET_LINE" | grep -q -F 'not checked' || missing="$missing [not checked]"
    if [ -z "$missing" ]; then
      pass "guards-bullet-version: bullet states the one-line deny, version 1 direct-only scope, and the wrapper exclusion"
    else
      fail "guards-bullet-version: bullet misses token(s):$missing"
    fi
  fi
fi

echo "=== guards-intro-shell-tools ==="
if need_readme "guards-intro-shell-tools"; then
  INTRO="$(grep -E '^\The `execute\.before`' "$README" | head -n 1 || true)"
  if [ -z "$INTRO" ]; then
    fail "guards-intro-shell-tools: Guards intro line (The execute.before hook) is missing"
  elif ! echo "$INTRO" | grep -q -F 'shell'; then
    fail "guards-intro-shell-tools: Guards intro does not cover the shell tools (FR-3 not applied yet)"
  elif ! echo "$INTRO" | grep -q -F 'The `execute.before` tool hook runs the guards for'; then
    fail "guards-intro-shell-tools: Guards intro rewrote the sentence start (FR-3 allows at most one clause)"
  else
    pass "guards-intro-shell-tools: Guards intro keeps its start and covers the shell tools"
  fi
fi

echo "=== readme-nothing-else-moves ==="
if need_readme "readme-nothing-else-moves"; then
  ORIG_TMP="$(mktemp)" || { fail "readme-nothing-else-moves: mktemp failed"; ORIG_TMP=""; }
  if [ -n "$ORIG_TMP" ]; then
    if ! git -C "$REPO" show "$ORIG_REF:$ORIG_PATH" > "$ORIG_TMP" 2>/dev/null; then
      fail "readme-nothing-else-moves: cannot read $ORIG_REF:$ORIG_PATH"
    else
      collapse() {
        sed -e 's/^The `execute\.before`.*$/GUARDS_INTRO/' "$1" | awk '
          /^## Checks/ { in_checks = 1 }
          in_checks && /^```bash/ {
            print "CHECKS_REGION"
            in_fence = 1
            next
          }
          in_fence {
            if ($0 ~ /node_modules/) {
              print
              in_fence = 0
              in_checks = 0
            }
            next
          }
          { print }
        ' | grep -v -F -- '- **Heavy-run guard.**' | grep -v -F -- 'The heavy-run guard refuses a bare suite'
      }
      ORIG_NORM="$(mktemp)" || ORIG_NORM=""
      CURR_NORM="$(mktemp)" || CURR_NORM=""
      if [ -z "$ORIG_NORM" ] || [ -z "$CURR_NORM" ]; then
        fail "readme-nothing-else-moves: mktemp failed"
      else
        collapse "$ORIG_TMP" > "$ORIG_NORM"
        collapse "$README" > "$CURR_NORM"
        DIFF_OUT="$(diff -u "$ORIG_NORM" "$CURR_NORM" || true)"
        if [ -z "$DIFF_OUT" ]; then
          pass "readme-nothing-else-moves: only the Checks block, the new bullet, the new sentence, and the Guards intro changed"
        else
          fail "readme-nothing-else-moves: lines outside the allowed block changed: [$DIFF_OUT]"
        fi
        rm -f "$ORIG_NORM" "$CURR_NORM"
      fi
    fi
    rm -f "$ORIG_TMP"
  fi
fi

TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "=== Total: $TOTAL checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
for r in "${RESULTS[@]+"${RESULTS[@]}"}"; do echo "$r"; done
if [ "$FAILED" -ne 0 ]; then
  exit 1
fi
exit 0
