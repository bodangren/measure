#!/usr/bin/env bash
# S1 contract test: step 9 of new-track.md §2.5, SKILL.md, new-track-set.md, the bundle copy,
# and the behavior of the runner tests/spec_review_gate/run.sh.
# Defenses: A4 (a missing line or block fails before any compare or negative check),
# A3 (labeled integers), A7 (exact fixed strings, no exclusion filter), A5 (bundle equality).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NT="$ROOT/skills/measure/references/new-track.md"
SK="$ROOT/skills/measure/SKILL.md"
NTS="$ROOT/skills/measure/references/new-track-set.md"
RUNNER="$ROOT/tests/spec_review_gate/run.sh"
TRACK_BASE=7d72b40665074a89f5be606935cad94a1ef1e4e9

FAILED=0
PASS_COUNT=0
FAIL_COUNT=0
RESULTS=()
pass() { RESULTS+=("PASS: $1"); PASS_COUNT=$((PASS_COUNT + 1)); echo "PASS: $1"; }
fail() { RESULTS+=("FAIL: $1"); FAIL_COUNT=$((FAIL_COUNT + 1)); FAILED=1; echo "FAIL: $1"; }

TMP="$(mktemp -d)" || TMP=""
if [ -z "$TMP" ] || [ ! -d "$TMP" ]; then
  echo "FAIL: mktemp -d failed; no fixture can be built"
  echo "=== Total: 1 checks (PASS=0, FAIL=1) ==="
  exit 1
fi
trap 'rm -rf "$TMP"' EXIT

# section FILE HEADING STOP_REGEX (fence-aware; prints nothing when the heading is absent)
section() {
  awk -v h="$2" -v stop="$3" '
    /^[[:space:]]*```/ { fence = !fence }
    found == 0 { if (!fence && $0 == h) { found = 1 } ; next }
    !fence && $0 ~ stop { exit }
    { print }
  ' "$1" 2>/dev/null
}

# line_of TEXT PREFIX: line number (in TEXT) of the first line that starts with PREFIX, outside fences
line_of() {
  printf '%s\n' "$1" | awk -v s="$2" '
    /^[[:space:]]*```/ { fence = !fence }
    !fence && index($0, s) == 1 { print NR; exit }
  '
}

# in_block LABEL BLOCK STRING: pass when BLOCK holds STRING
in_block() {
  echo "=== $1 ==="
  if grep -qF -- "$3" <<< "$2"; then pass "$1"; else fail "$1: missing [$3]"; fi
}

# ---------------------------------------------------------------------------
# new-track.md section 2.5
S25="$(section "$NT" '### 2.5 Create Artifacts' '^###? ')"
L6="" L9="" L10="" L11=""
if [ -n "${S25//[[:space:]]/}" ]; then
  L6=$(line_of "$S25" '6. Write files:')
  L9=$(line_of "$S25" '9. **Spec Review (fresh subagent):**')
  L10=$(line_of "$S25" '10. **Commit Changes:**')
  L11=$(line_of "$S25" '11. Announce completion:')
fi

echo "=== section 2.5 exists ==="
if [ -n "${S25//[[:space:]]/}" ]; then pass "new-track.md has a non-empty §2.5"; else fail "new-track.md §2.5 is missing or empty"; fi

echo "=== step 9 starts with the review title ==="
if [ -n "$L9" ]; then pass "step 9 line '9. **Spec Review (fresh subagent):**' at §2.5 line $L9"; else fail "§2.5 has no line starting '9. **Spec Review (fresh subagent):**'"; fi

echo "=== step 10 is Commit Changes ==="
if [ -n "$L10" ]; then pass "step 10 line '10. **Commit Changes:**' at §2.5 line $L10"; else fail "§2.5 has no line starting '10. **Commit Changes:**'"; fi

echo "=== step 11 is the announcement ==="
if [ -n "$L11" ]; then pass "step 11 line '11. Announce completion:' at §2.5 line $L11"; else fail "§2.5 has no line starting '11. Announce completion:'"; fi

echo "=== step order: 6 < 9 < 10 < 11 ==="
if [ -z "$L6" ] || [ -z "$L9" ] || [ -z "$L10" ] || [ -z "$L11" ]; then
  fail "step order: a step line is missing (6='$L6' 9='$L9' 10='$L10' 11='$L11')"
elif [ "$L6" -lt "$L9" ] && [ "$L9" -lt "$L10" ] && [ "$L10" -lt "$L11" ]; then
  pass "step lines in order (6=$L6 9=$L9 10=$L10 11=$L11)"
else
  fail "step lines out of order (6=$L6 9=$L9 10=$L10 11=$L11)"
fi

# Step 9 block: from the step 9 line up to the line before the step 10 line.
S9=""
if [ -n "$L9" ] && [ -n "$L10" ] && [ "$L9" -lt "$L10" ]; then
  S9="$(printf '%s\n' "$S25" | sed -n "${L9},$((L10 - 1))p")"
fi

echo "=== step 9 block is non-empty ==="
if [ -n "${S9//[[:space:]]/}" ]; then pass "step 9 block has content"; else fail "step 9 block is missing or empty"; fi

in_block "step 9 names the standard" "$S9" 'references/spec-review.md'
in_block "step 9 names the report path" "$S9" 'measure/tracks/<track_id>/spec-review.md'
in_block "step 9 gives the index line" "$S9" '- [Spec Review](./spec-review.md)'
in_block "step 9 gives the not-run message" "$S9" 'Spec review: not run (no subagent tool)'
in_block "step 9 forbids a review in this context" "$S9" 'Never run the review in this context.'
in_block "step 9 gives the re-review limit" "$S9" 'at most one re-review'
in_block "step 9 gives the author model line" "$S9" 'Author model:'
in_block "step 9 gives the no-history sentence" "$S9" 'Give the subagent no conversation history, no answers from the questioning phase, and no summary of your own.'
in_block "step 9 routes the not-run case to step 10" "$S9" 'step 10'

echo "=== step 9 sub-steps keep their order ==="
if [ -z "${S9//[[:space:]]/}" ]; then
  fail "sub-step order: step 9 block is missing or empty"
else
  prev=0
  bad=""
  for m in 'references/spec-review.md' 'Never run the review in this context.' 'Give the subagent no conversation history' 'at most one re-review'; do
    n=$(printf '%s\n' "$S9" | grep -nF -- "$m" | head -n 1 | cut -d: -f1)
    if [ -z "$n" ]; then bad+=" [absent: $m]"; continue; fi
    if [ "$n" -le "$prev" ]; then bad+=" [out of order: $m at $n after $prev]"; fi
    prev="$n"
  done
  if [ -z "$bad" ]; then pass "first occurrences are in contract order"; else fail "sub-step order:$bad"; fi
fi

# ---------------------------------------------------------------------------
echo "=== edge: each number 1 to 11 starts exactly one numbered line in §2.5 ==="
if [ -z "${S25//[[:space:]]/}" ]; then
  fail "numbering: §2.5 is missing or empty"
else
  numbered=$(printf '%s\n' "$S25" | awk '/^[[:space:]]*```/ { fence = !fence } !fence && /^[0-9]+\. / { sub(/\..*/, ""); print }')
  bad=""
  for n in 1 2 3 4 5 6 7 8 9 10 11; do
    c=$(printf '%s\n' "$numbered" | awk -v n="$n" '$1 == n { c++ } END { print c + 0 }')
    [ "$c" -eq 1 ] || bad+=" [$n occurs $c times]"
  done
  total=$(printf '%s\n' "$numbered" | awk 'NF { c++ } END { print c + 0 }')
  [ "$total" -eq 11 ] || bad+=" [numbered lines in total: $total, expected 11]"
  if [ -z "$bad" ]; then pass "numbers 1 to 11 occur once each, 11 numbered lines"; else fail "numbering:$bad"; fi
fi

echo "=== edge: steps 1 to 8 are unchanged from the track base ==="
if ! git -C "$ROOT" cat-file -e "$TRACK_BASE:skills/measure/references/new-track.md" 2>/dev/null; then
  fail "steps 1-8: the track base commit or file is not in the git history"
else
  base_s25="$(git -C "$ROOT" show "$TRACK_BASE:skills/measure/references/new-track.md" | section /dev/stdin '### 2.5 Create Artifacts' '^###? ')"
  base_1_8=$(printf '%s\n' "$base_s25" | awk '/^[[:space:]]*```/ { fence = !fence } !fence && /^9\. / { exit } { print }')
  cur_1_8=$(printf '%s\n' "$S25" | awk '/^[[:space:]]*```/ { fence = !fence } !fence && /^9\. / { exit } { print }')
  if [ -z "${base_1_8//[[:space:]]/}" ] || [ -z "${cur_1_8//[[:space:]]/}" ]; then
    fail "steps 1-8: an extract is empty"
  elif [ "$base_1_8" = "$cur_1_8" ]; then
    pass "steps 1 to 8 equal the track base"
  else
    fail "steps 1-8 differ from the track base"
  fi
fi

echo "=== edge: step 5 block has no spec-review ==="
S5=""
L5=""
if [ -n "${S25//[[:space:]]/}" ]; then
  L5=$(line_of "$S25" '5. **Create Track Index:**')
  if [ -n "$L5" ] && [ -n "$L6" ] && [ "$L5" -lt "$L6" ]; then
    S5="$(printf '%s\n' "$S25" | sed -n "${L5},$((L6 - 1))p")"
  fi
fi
if [ -z "${S5//[[:space:]]/}" ]; then
  fail "step 5 block is missing or empty"
elif ! grep -qF -- '[Specification](./spec.md)' <<< "$S5"; then
  fail "step 5 block is not the index template (no '[Specification](./spec.md)')"
elif grep -qF -- 'spec-review' <<< "$S5"; then
  fail "step 5 index template contains 'spec-review'"
else
  pass "step 5 block is non-empty and has no 'spec-review'"
fi

# ---------------------------------------------------------------------------
# new-track-set.md must not change
echo "=== edge: new-track-set.md has no spec-review ==="
if [ ! -s "$NTS" ]; then
  fail "new-track-set.md is missing or empty"
elif grep -qF -- 'spec-review' "$NTS"; then
  fail "new-track-set.md contains 'spec-review'"
else
  pass "new-track-set.md is non-empty and has no 'spec-review'"
fi

echo "=== edge: new-track-set.md keeps its step citations ==="
if [ ! -s "$NTS" ]; then
  fail "new-track-set.md is missing or empty"
else
  miss=""
  for s in '§2.5 step 5' '§2.5 step 4' '§2.5 step 8'; do
    grep -qF -- "$s" "$NTS" || miss+=" [$s]"
  done
  if [ -z "$miss" ]; then pass "new-track-set.md cites §2.5 steps 4, 5, and 8"; else fail "new-track-set.md lacks:$miss"; fi
fi

# ---------------------------------------------------------------------------
# SKILL.md
echo "=== SKILL.md New Track paragraph names the standard ==="
NEWSEC="$(section "$SK" '### New Track' '^###? ')"
if [ -z "${NEWSEC//[[:space:]]/}" ]; then
  fail "SKILL.md has no non-empty '### New Track' section"
elif grep -qF -- 'references/spec-review.md' <<< "$NEWSEC"; then
  pass "New Track paragraph contains references/spec-review.md"
else
  fail "New Track paragraph lacks references/spec-review.md"
fi

DIRSEC="$(section "$SK" '## Directory Structure' '^## ')"
echo "=== SKILL.md Directory Structure block lists spec-review.md ==="
if [ -z "${DIRSEC//[[:space:]]/}" ]; then
  fail "SKILL.md has no non-empty '## Directory Structure' section"
elif grep -qF -- 'spec-review.md' <<< "$DIRSEC"; then
  pass "Directory Structure block contains spec-review.md"
else
  fail "Directory Structure block lacks spec-review.md"
fi

echo "=== SKILL.md Directory Structure has the exact line after spec.md ==="
LINE='│       ├── spec-review.md  # Spec review report (fresh subagent)'
if [ -z "${DIRSEC//[[:space:]]/}" ]; then
  fail "Directory Structure block is missing or empty"
else
  lsp=$(printf '%s\n' "$DIRSEC" | grep -nF -- '├── spec.md ' | head -n 1 | cut -d: -f1)
  lrv=$(printf '%s\n' "$DIRSEC" | grep -nxF -- "$LINE" | head -n 1 | cut -d: -f1)
  lpl=$(printf '%s\n' "$DIRSEC" | grep -nF -- '└── plan.md ' | head -n 1 | cut -d: -f1)
  if [ -z "$lsp" ] || [ -z "$lrv" ] || [ -z "$lpl" ]; then
    fail "Directory Structure lines missing (spec.md='$lsp' spec-review.md='$lrv' plan.md='$lpl')"
  elif [ "$lsp" -lt "$lrv" ] && [ "$lrv" -lt "$lpl" ]; then
    pass "exact spec-review.md line sits between the spec.md and plan.md lines"
  else
    fail "spec-review.md line is out of place (spec.md=$lsp spec-review.md=$lrv plan.md=$lpl)"
  fi
fi

# ---------------------------------------------------------------------------
echo "=== bundle equality: diff -r skills/measure claude-skills/measure ==="
if [ ! -d "$ROOT/skills/measure" ] || [ ! -d "$ROOT/claude-skills/measure" ]; then
  fail "a bundle folder is missing"
else
  diff -r "$ROOT/skills/measure" "$ROOT/claude-skills/measure" > "$TMP/diff.out" 2>&1
  rc=$?
  if [ "$rc" -eq 0 ]; then pass "skills/measure equals claude-skills/measure"; else fail "bundle differs (diff exit $rc): $(head -n 3 "$TMP/diff.out" | tr '\n' ' ')"; fi
fi

# ---------------------------------------------------------------------------
# Runner behavior. These checks need the runner only, not the S1 deliverables.

# parse_summary TEXT: prints "N X Y" from the last line, or nothing when it is not a summary line
parse_summary() {
  printf '%s\n' "$1" | awk 'NF { last = $0 } END { print last }' |
    sed -nE 's/^=== spec_review_gate: ([0-9]+) suites \(PASS=([0-9]+), FAIL=([0-9]+)\) ===$/\1 \2 \3/p'
}

# summary_check LABEL TEXT N X Y: the last line has the labeled integers N, X, Y and N = X + Y
summary_check() {
  local label="$1" text="$2" en="$3" ex="$4" ey="$5" parsed n x y
  parsed=$(parse_summary "$text")
  if [ -z "$parsed" ]; then fail "$label: last line is not a summary line"; return; fi
  read -r n x y <<< "$parsed"
  if [ "$n" -ne $((x + y)) ]; then fail "$label: N=$n is not PASS=$x + FAIL=$y"; return; fi
  if [ "$n" -eq "$en" ] && [ "$x" -eq "$ex" ] && [ "$y" -eq "$ey" ]; then
    pass "$label: $n suites (PASS=$x, FAIL=$y)"
  else
    fail "$label: got $n suites (PASS=$x, FAIL=$y), expected $en (PASS=$ex, FAIL=$ey)"
  fi
}

# new_sandbox NAME: a temporary tree with a copy of the runner at tests/spec_review_gate/run.sh
new_sandbox() {
  SB="$TMP/$1"
  mkdir -p "$SB/tests/spec_review_gate"
  cp "$RUNNER" "$SB/tests/spec_review_gate/run.sh" 2>/dev/null
}

echo "=== runner exists ==="
if [ -s "$RUNNER" ]; then pass "tests/spec_review_gate/run.sh exists"; else fail "tests/spec_review_gate/run.sh is missing or empty"; fi

echo "=== runner: pattern test_none_*.sh exits 1 and prints 'no suites matched' ==="
out=$(bash "$RUNNER" 'test_none_*.sh' 2>&1)
rc=$?
if [ "$rc" -ne 1 ]; then
  fail "runner exit code is $rc for a pattern that matches nothing, expected 1"
elif ! grep -qxF -- 'no suites matched' <<< "$out"; then
  fail "runner output lacks the line 'no suites matched'"
else
  msg_ln=$(printf '%s\n' "$out" | grep -nxF -- 'no suites matched' | head -n 1 | cut -d: -f1)
  sum_ln=$(printf '%s\n' "$out" | grep -nE -- '^=== spec_review_gate: ' | tail -n 1 | cut -d: -f1)
  if [ -z "$sum_ln" ] || [ "$msg_ln" -ge "$sum_ln" ]; then
    fail "'no suites matched' does not come before the summary line"
  else
    pass "runner exits 1, prints 'no suites matched' before the summary"
  fi
fi

echo "=== runner: zero-match summary is 0 suites (PASS=0, FAIL=0) ==="
summary_check "zero-match summary" "$out" 0 0 0

echo "=== runner: one failing suite among passing suites gives exit 1 ==="
new_sandbox mix
S="$SB/tests/spec_review_gate"
printf '#!/usr/bin/env bash\necho SUITE-BBB\nexit 1\n' > "$S/test_b.sh"
printf '#!/usr/bin/env bash\necho SUITE-AAA\nexit 0\n' > "$S/test_a.sh"
out=$(bash "$S/run.sh" 2>&1)
rc=$?
if [ "$rc" -eq 1 ]; then pass "exit 1 when one suite fails (exit $rc)"; else fail "exit $rc when one suite fails, expected 1"; fi
summary_check "mixed summary" "$out" 2 1 1

echo "=== runner: suites run in sorted order ==="
a_ln=$(printf '%s\n' "$out" | grep -nxF -- 'SUITE-AAA' | head -n 1 | cut -d: -f1)
b_ln=$(printf '%s\n' "$out" | grep -nxF -- 'SUITE-BBB' | head -n 1 | cut -d: -f1)
if [ -z "$a_ln" ] || [ -z "$b_ln" ]; then
  fail "a suite did not run (a='$a_ln' b='$b_ln')"
elif [ "$a_ln" -lt "$b_ln" ]; then
  pass "test_a.sh ran before test_b.sh"
else
  fail "test_b.sh ran before test_a.sh"
fi

echo "=== runner: a pattern selects only matching suites ==="
out=$(bash "$S/run.sh" 'test_a*.sh' 2>&1)
rc=$?
if [ "$rc" -ne 0 ]; then fail "pattern test_a*.sh exits $rc, expected 0"; else pass "pattern test_a*.sh exits 0"; fi
summary_check "pattern summary" "$out" 1 1 0
if grep -qxF -- 'SUITE-BBB' <<< "$out"; then fail "pattern test_a*.sh also ran test_b.sh"; else pass "pattern test_a*.sh did not run test_b.sh"; fi

echo "=== runner: default patterns run .sh and .py suites ==="
new_sandbox defaults
S="$SB/tests/spec_review_gate"
printf '#!/usr/bin/env bash\nexit 0\n' > "$S/test_one.sh"
cat > "$S/test_two.py" <<'PY'
import unittest


class T(unittest.TestCase):
    def test_ok(self):
        self.assertTrue(True)


if __name__ == "__main__":
    unittest.main()
PY
out=$(bash "$S/run.sh" 2>&1)
rc=$?
if [ "$rc" -eq 0 ]; then pass "default patterns exit 0 for passing suites"; else fail "default patterns exit $rc for passing suites, expected 0"; fi
summary_check "default summary" "$out" 2 2 0

echo "=== runner: a .py suite with an import error counts as a failure ==="
new_sandbox pyfail
S="$SB/tests/spec_review_gate"
printf 'import module_that_does_not_exist_xyz\n' > "$S/test_bad.py"
out=$(bash "$S/run.sh" 'test_bad.py' 2>&1)
rc=$?
if [ "$rc" -eq 1 ]; then pass "import error gives exit 1"; else fail "import error gives exit $rc, expected 1"; fi
summary_check "import error summary" "$out" 1 0 1

echo "=== runner: a file name with a space runs ==="
new_sandbox space
S="$SB/tests/spec_review_gate"
printf '#!/usr/bin/env bash\necho SUITE-SPACE\nexit 0\n' > "$S/test_with space.sh"
out=$(bash "$S/run.sh" 2>&1)
rc=$?
if [ "$rc" -eq 0 ] && grep -qxF -- 'SUITE-SPACE' <<< "$out"; then pass "suite 'test_with space.sh' ran"; else fail "suite with a space did not run (exit $rc)"; fi
summary_check "space summary" "$out" 1 1 0

echo "=== runner: a pattern outside the suite folder runs nothing ==="
new_sandbox outside
S="$SB/tests/spec_review_gate"
printf '#!/usr/bin/env bash\ntouch "%s"\nexit 0\n' "$SB/MARKER" > "$SB/tests/outside.sh"
bash "$S/run.sh" '../outside.sh' > /dev/null 2>&1
bash "$S/run.sh" "$SB/tests/outside.sh" > /dev/null 2>&1
if [ -e "$SB/MARKER" ]; then fail "the runner ran a file outside tests/spec_review_gate/"; else pass "no file outside tests/spec_review_gate/ ran"; fi

# ---------------------------------------------------------------------------
echo ""
echo "=== Results ==="
for r in "${RESULTS[@]}"; do echo "$r"; done
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "=== Total: $TOTAL checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
