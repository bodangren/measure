#!/usr/bin/env bash
# S1 adversarial tests: the runner tests/spec_review_gate/run.sh, and the sensitivity of the
# S1 contract tests (test_s1_standard.sh, test_s1_new_track.sh) to mutated copies.
# Defenses: A4 (each mutation must turn its target check from PASS to FAIL; a baseline copy
# must give PASS first), A7 (negated text keeps a banned-word hit), A3 (labeled integers).
# Every fixture is a copy in a mktemp folder. This file never runs the real runner, because a
# real-runner pattern can select this file again.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SUITE="$ROOT/tests/spec_review_gate"
RUNNER="$SUITE/run.sh"

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
export GIT_CEILING_DIRECTORIES="$TMP"

# ---------------------------------------------------------------------------
# Helpers

# parse_summary TEXT: prints "N X Y" from the last non-empty line, or nothing
parse_summary() {
  printf '%s\n' "$1" | awk 'NF { last = $0 } END { print last }' |
    sed -nE 's/^=== spec_review_gate: ([0-9]+) suites \(PASS=([0-9]+), FAIL=([0-9]+)\) ===$/\1 \2 \3/p'
}

# summary_check LABEL TEXT N X Y
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

# rc_check LABEL GOT WANT
rc_check() {
  if [ "$2" -eq "$3" ]; then pass "$1: exit $2"; else fail "$1: exit $2, expected $3"; fi
}

# has_line TEXT LINE: TEXT holds LINE as a whole line
has_line() { grep -qxF -- "$2" <<< "$1"; }

# runner_sandbox NAME: prints the suite folder of a new tree with a copy of the runner
runner_sandbox() {
  local d="$TMP/$1/tests/spec_review_gate"
  mkdir -p "$d" && cp "$RUNNER" "$d/run.sh" && printf '%s\n' "$d"
}

# replace_fixed FILE OLD NEW: replaces each occurrence of the fixed string OLD; returns 1 when
# OLD is absent, so a mutation that changes nothing cannot give a vacuous result
replace_fixed() {
  local file="$1" old="$2" new="$3"
  grep -qF -- "$old" "$file" || return 1
  OLD="$old" NEW="$new" awk '
    BEGIN { o = ENVIRON["OLD"]; n = ENVIRON["NEW"] }
    {
      out = ""; s = $0
      while ((i = index(s, o)) > 0) { out = out substr(s, 1, i - 1) n; s = substr(s, i + length(o)) }
      print out s
    }
  ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
}

# insert_after FILE PREFIX LINE: inserts LINE after the first line that starts with PREFIX;
# returns 1 when no line starts with PREFIX
insert_after() {
  local file="$1"
  P="$2" L="$3" awk '
    BEGIN { p = ENVIRON["P"]; l = ENVIRON["L"] }
    { print } !done && index($0, p) == 1 { print l; done = 1 }
    END { exit done ? 0 : 1 }
  ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
}

# report_state OUT LABEL: prints PASS when OUT has a line "PASS: LABEL..." and no line
# "FAIL: LABEL..."; FAIL for the reverse; MIXED or ABSENT otherwise
report_state() {
  local p f
  p=$(printf '%s\n' "$1" | L="PASS: $2" awk 'index($0, ENVIRON["L"]) == 1 { c++ } END { print c + 0 }')
  f=$(printf '%s\n' "$1" | L="FAIL: $2" awk 'index($0, ENVIRON["L"]) == 1 { c++ } END { print c + 0 }')
  if [ "$p" -gt 0 ] && [ "$f" -eq 0 ]; then echo PASS
  elif [ "$f" -gt 0 ] && [ "$p" -eq 0 ]; then echo FAIL
  elif [ "$p" -gt 0 ]; then echo MIXED
  else echo ABSENT; fi
}

# expect_state LABEL OUT CHECK_LABEL WANT
expect_state() {
  local got
  got=$(report_state "$2" "$3")
  if [ "$got" = "$4" ]; then pass "$1: '$3' is $got"; else fail "$1: '$3' is $got, expected $4"; fi
}

# ---------------------------------------------------------------------------
# Part 1: runner probes. Each probe uses a copy of the runner in its own tree.

echo "=== runner: a pattern that matches nothing ==="
S=$(runner_sandbox zero)
printf 'exit 0\n' > "$S/test_a.sh"
out=$(bash "$S/run.sh" 'test_none_*.sh' 2>&1); rc=$?
rc_check "zero match" "$rc" 1
if has_line "$out" 'no suites matched'; then pass "zero match prints 'no suites matched'"; else fail "zero match lacks 'no suites matched'"; fi
summary_check "zero match summary" "$out" 0 0 0

echo "=== runner: a pattern that matches only files that are not .sh or .py ==="
printf 'exit 0\n' > "$S/test_note.txt"
out=$(bash "$S/run.sh" 'test_note*' 2>&1); rc=$?
rc_check "non-suite match" "$rc" 1
if has_line "$out" 'no suites matched'; then pass "non-suite match prints 'no suites matched'"; else fail "non-suite match lacks 'no suites matched'"; fi
summary_check "non-suite match summary" "$out" 0 0 0

echo "=== runner: patterns with '..' or '/' run nothing and exit 1 ==="
S=$(runner_sandbox outside)
SB="$TMP/outside"
printf '#!/usr/bin/env bash\ntouch "%s"\nexit 0\n' "$SB/MARKER" > "$SB/tests/test_out.sh"
mkdir -p "$S/sub"
printf '#!/usr/bin/env bash\ntouch "%s"\nexit 0\n' "$SB/MARKER" > "$S/sub/test_in.sh"
for p in '../test_out.sh' '../*.sh' "$SB/tests/test_out.sh" 'sub/test_in.sh' 'sub/*.sh' './test_none.sh' '..'; do
  out=$(bash "$S/run.sh" "$p" 2>&1); rc=$?
  if [ -e "$SB/MARKER" ]; then
    fail "pattern '$p' ran a file it must not run"
    rm -f "$SB/MARKER"
  elif [ "$rc" -ne 1 ] || ! has_line "$out" 'no suites matched'; then
    fail "pattern '$p': exit $rc, or no 'no suites matched' line"
  else
    pass "pattern '$p' runs nothing, exits 1, prints 'no suites matched'"
  fi
done

echo "=== runner: a bad pattern next to a good pattern runs only the good suite ==="
printf '#!/usr/bin/env bash\necho SUITE-GOOD\nexit 0\n' > "$S/test_good.sh"
out=$(bash "$S/run.sh" '../test_out.sh' 'test_good.sh' 2>&1); rc=$?
rc_check "bad and good pattern" "$rc" 0
if [ -e "$SB/MARKER" ]; then fail "the bad pattern ran its file"; else pass "the bad pattern ran nothing"; fi
summary_check "bad and good pattern summary" "$out" 1 1 0

echo "=== runner: a pattern with shell syntax is not executed ==="
S=$(runner_sandbox inject)
SB="$TMP/inject"
printf 'exit 0\n' > "$S/test_a.sh"
bash "$S/run.sh" "test_\$(touch $SB/INJ1).sh" 'test_`touch INJ2`.sh' 'test_a.sh;touch INJ3' > /dev/null 2>&1
if [ -e "$SB/INJ1" ] || [ -e "$S/INJ2" ] || [ -e "$S/INJ3" ] || [ -e "$SB/INJ2" ] || [ -e "$SB/INJ3" ]; then
  fail "a pattern with shell syntax ran a command"
else
  pass "no pattern with shell syntax ran a command"
fi

echo "=== runner: one failing suite among three passing suites ==="
S=$(runner_sandbox mixed)
for n in a b d; do printf '#!/usr/bin/env bash\necho SUITE-%s\nexit 0\n' "$n" > "$S/test_$n.sh"; done
printf '#!/usr/bin/env bash\necho SUITE-c\nexit 1\n' > "$S/test_c.sh"
out=$(bash "$S/run.sh" 2>&1); rc=$?
rc_check "one failing suite of four" "$rc" 1
summary_check "one failing suite of four summary" "$out" 4 3 1
ran=""
for n in a b c d; do has_line "$out" "SUITE-$n" || ran+=" [test_$n.sh did not run]"; done
if [ -z "$ran" ]; then pass "all four suites ran after the failing suite"; else fail "suites missing:$ran"; fi

echo "=== runner: suite exit codes other than 1 count as FAIL, and the runner exits 1 ==="
S=$(runner_sandbox codes)
printf '#!/usr/bin/env bash\nexit 0\n' > "$S/test_a.sh"
printf '#!/usr/bin/env bash\nexit 7\n' > "$S/test_b.sh"
printf '#!/usr/bin/env bash\nkill -9 $$\n' > "$S/test_c.sh"
out=$(bash "$S/run.sh" 2>&1); rc=$?
rc_check "exit 7 and a killed suite" "$rc" 1
summary_check "exit 7 and a killed suite summary" "$out" 3 1 2

echo "=== runner: a suite that prints a false summary line cannot change the result ==="
S=$(runner_sandbox fake)
printf '#!/usr/bin/env bash\necho "=== spec_review_gate: 9 suites (PASS=9, FAIL=0) ==="\nexit 1\n' > "$S/test_fake.sh"
out=$(bash "$S/run.sh" 2>&1); rc=$?
rc_check "false summary suite" "$rc" 1
summary_check "false summary suite summary" "$out" 1 0 1

echo "=== runner: file names with a space ==="
S=$(runner_sandbox space)
SB="$TMP/space"
printf '#!/usr/bin/env bash\necho SUITE-SPACE-FAIL\nexit 1\n' > "$S/test_x y.sh"
printf '#!/usr/bin/env bash\ntouch "%s"\nexit 0\n' "$SB/SPLIT" > "$S/y.sh"
printf '#!/usr/bin/env bash\ntouch "%s"\nexit 0\n' "$SB/SPLIT" > "$S/test_x"
printf '#!/usr/bin/env bash\necho SUITE-SPACE-PASS\nexit 0\n' > "$S/test_ok two.sh"
out=$(bash "$S/run.sh" 2>&1); rc=$?
rc_check "space names, one fails" "$rc" 1
summary_check "space names summary" "$out" 2 1 1
if [ -e "$SB/SPLIT" ]; then fail "a space name was split into two words"; else pass "no space name was split"; fi
if has_line "$out" 'SUITE-SPACE-FAIL' && has_line "$out" 'SUITE-SPACE-PASS'; then pass "both space-name suites ran"; else fail "a space-name suite did not run"; fi
out=$(bash "$S/run.sh" 'test_ok two.sh' 2>&1); rc=$?
rc_check "explicit pattern with a space" "$rc" 0
summary_check "explicit pattern with a space summary" "$out" 1 1 0

echo "=== runner: .py suites with an import error or a syntax error, among passing suites ==="
S=$(runner_sandbox pyerr)
printf '#!/usr/bin/env bash\nexit 0\n' > "$S/test_a.sh"
cat > "$S/test_good.py" <<'PY'
import unittest


class T(unittest.TestCase):
    def test_ok(self):
        self.assertTrue(True)
PY
printf 'import module_that_does_not_exist_s1adv\n' > "$S/test_imp.py"
printf 'def broken(:\n' > "$S/test_syn.py"
out=$(bash "$S/run.sh" 2>&1); rc=$?
rc_check "import and syntax errors" "$rc" 1
summary_check "import and syntax errors summary" "$out" 4 2 2
for f in test_imp.py test_syn.py; do
  if grep -qF -- "--- suite result: FAIL: $f " <<< "$out"; then pass "$f is reported as FAIL"; else fail "$f is not reported as FAIL"; fi
done

echo "=== runner: a failing .py test fails the suite ==="
S=$(runner_sandbox pyfail)
cat > "$S/test_red.py" <<'PY'
import unittest


class T(unittest.TestCase):
    def test_red(self):
        self.fail("red")
PY
out=$(bash "$S/run.sh" 'test_red.py' 2>&1); rc=$?
rc_check "failing .py test" "$rc" 1
summary_check "failing .py test summary" "$out" 1 0 1

echo "=== runner: duplicate and overlapping patterns run each file once ==="
S=$(runner_sandbox dup)
printf '#!/usr/bin/env bash\necho SUITE-DUP\nexit 0\n' > "$S/test_a.sh"
out=$(bash "$S/run.sh" 'test_a.sh' 'test_a*' 'test_*.sh' 'test_a.sh' 2>&1); rc=$?
rc_check "duplicate patterns" "$rc" 0
summary_check "duplicate patterns summary" "$out" 1 1 0
c=$(printf '%s\n' "$out" | grep -cxF -- 'SUITE-DUP')
if [ "$c" -eq 1 ]; then pass "test_a.sh ran once"; else fail "test_a.sh ran $c times"; fi

echo "=== runner: default patterns do not select run.sh ==="
S=$(runner_sandbox self)
printf '#!/usr/bin/env bash\nexit 0\n' > "$S/test_a.sh"
out=$(bash "$S/run.sh" 2>&1); rc=$?
rc_check "default patterns" "$rc" 0
summary_check "default patterns summary" "$out" 1 1 0
if grep -qF -- '--- suite: run.sh ---' <<< "$out"; then fail "default patterns selected run.sh"; else pass "default patterns did not select run.sh"; fi

echo "=== runner: a pattern that selects run.sh ends, and N = PASS + FAIL ==="
if command -v timeout > /dev/null 2>&1; then
  out=$(timeout 60 bash "$S/run.sh" '*.sh' 2>&1); rc=$?
  if [ "$rc" -eq 124 ]; then
    fail "pattern '*.sh' did not end in 60 seconds"
  else
    rc_check "pattern '*.sh'" "$rc" 0
    parsed=$(parse_summary "$out")
    if [ -z "$parsed" ]; then
      fail "pattern '*.sh': last line is not a summary line"
    else
      read -r n x y <<< "$parsed"
      if [ "$n" -eq $((x + y)) ] && [ "$y" -eq 0 ]; then pass "pattern '*.sh': $n suites (PASS=$x, FAIL=$y)"; else fail "pattern '*.sh': $n suites (PASS=$x, FAIL=$y)"; fi
    fi
  fi
else
  fail "the timeout command is not available"
fi

echo "=== runner: the runner works from another working folder ==="
out=$(cd / && bash "$S/run.sh" 'test_a.sh' 2>&1); rc=$?
rc_check "run from /" "$rc" 0
summary_check "run from / summary" "$out" 1 1 0

# ---------------------------------------------------------------------------
# Part 2: mutation probes of the S1 contract tests. Each probe copies the test and its inputs
# into a new tree, changes one input, and runs the copy. The baseline copy must give PASS for
# each target check, so a FAIL after the mutation comes from the mutation.

std_tree() {
  local d="$TMP/$1"
  mkdir -p "$d/tests/spec_review_gate" "$d/skills/measure/references" "$d/measure" &&
    cp "$SUITE/test_s1_standard.sh" "$d/tests/spec_review_gate/" &&
    cp "$ROOT/skills/measure/references/spec-review.md" "$d/skills/measure/references/" &&
    cp "$ROOT/measure/tech-stack.md" "$d/measure/" &&
    printf '%s\n' "$d"
}

nt_tree() {
  local d="$TMP/$1"
  mkdir -p "$d/tests/spec_review_gate" "$d/claude-skills" &&
    cp "$SUITE/test_s1_new_track.sh" "$RUNNER" "$d/tests/spec_review_gate/" &&
    cp -R "$ROOT/skills" "$d/skills" &&
    cp -R "$ROOT/claude-skills/measure" "$d/claude-skills/measure" &&
    printf '%s\n' "$d"
}

run_std() { bash "$1/tests/spec_review_gate/test_s1_standard.sh" 2>&1; }
run_nt() { bash "$1/tests/spec_review_gate/test_s1_new_track.sh" 2>&1; }

STD_TARGETS=(
  'Reviewer Input: sources and the no-history sentence'
  'eight headings in contract order'
  'Severity: three levels and Decision 11 rules'
  "standard has 'Spec review: not run (no subagent tool)'"
  "line 1 is '# Spec Review Standard'"
  'intro credits EGM with the URL and Apache-2.0'
  'Tooling Exceptions row for spec_review_gate_20261030 is complete'
)
NT_TARGETS=(
  "step 9 line '9. **Spec Review (fresh subagent):**'"
  'step 9 forbids a review in this context'
  'step 9 gives the re-review limit'
  "step 5 block is non-empty and has no 'spec-review'"
  "new-track-set.md is non-empty and has no 'spec-review'"
  'numbers 1 to 11 occur once each'
  'exact spec-review.md line sits between'
  'skills/measure equals claude-skills/measure'
  "runner exits 1, prints 'no suites matched' before the summary"
  'exit 1 when one suite fails'
  'default patterns exit 0 for passing suites'
)

echo "=== mutation baseline: test_s1_standard.sh copy ==="
if B=$(std_tree std_base); then
  out=$(run_std "$B"); rc=$?
  rc_check "standard baseline copy" "$rc" 0
  for t in "${STD_TARGETS[@]}"; do expect_state "standard baseline" "$out" "$t" PASS; done
else
  fail "cannot build the standard baseline tree"
fi

echo "=== mutation baseline: test_s1_new_track.sh copy ==="
if B=$(nt_tree nt_base); then
  out=$(run_nt "$B")
  for t in "${NT_TARGETS[@]}"; do expect_state "new-track baseline" "$out" "$t" PASS; done
else
  fail "cannot build the new-track baseline tree"
fi

# mutation KIND LABEL TARGET_PASS_LABEL FAIL_LABEL_PREFIX MUTATION
# KIND is std or nt. MUTATION is shell text that runs with $D set to the new tree; it must
# return 0. The target PASS line must disappear, and the FAIL line must appear.
mutation() {
  local kind="$1" label="$2" target="$3" failp="$4" mut="$5" D out name got
  echo "=== mutation: $label ==="
  name="m_$(printf '%s' "$label" | tr -c 'a-zA-Z0-9' '_')"
  if ! D=$("${kind}_tree" "$name"); then fail "$label: cannot build the tree"; return; fi
  if ! (D="$D"; eval "$mut"); then fail "$label: the mutation did not apply"; return; fi
  out=$("run_$kind" "$D")
  got=$(report_state "$out" "$target")
  if [ "$got" = PASS ] || [ "$got" = MIXED ]; then fail "$label: '$target' still has a PASS line ($got)"; else pass "$label: '$target' has no PASS line"; fi
  expect_state "$label" "$out" "$failp" FAIL
}

SR='"$D/skills/measure/references/spec-review.md"'
TS='"$D/measure/tech-stack.md"'
NT='"$D/skills/measure/references/new-track.md"'
NTS='"$D/skills/measure/references/new-track-set.md"'
SK='"$D/skills/measure/SKILL.md"'
RN='"$D/tests/spec_review_gate/run.sh"'

mutation std "A7 no-history sentence only outside Reviewer Input" \
  'Reviewer Input: sources and the no-history sentence' 'Reviewer Input: sources and the no-history sentence' \
  "replace_fixed $SR 'The reviewer gets no conversation history.' 'The reviewer reads only files.' && printf '%s\n' 'The reviewer gets no conversation history.' >> $SR"

mutation std "A4 Severity heading renamed" \
  'eight headings in contract order' 'heading order:' \
  "replace_fixed $SR '## Severity' '## Severity Levels'"

mutation std "A4 Severity section absent" \
  'Severity: three levels and Decision 11 rules' 'Severity: three levels and Decision 11 rules' \
  "replace_fixed $SR '## Severity' '## Severity Levels'"

mutation std "not-run line changed" \
  "standard has 'Spec review: not run (no subagent tool)'" "standard lacks 'Spec review: not run (no subagent tool)'" \
  "replace_fixed $SR 'Spec review: not run (no subagent tool)' 'Spec review: skipped'"

mutation std "title changed" \
  "line 1 is '# Spec Review Standard'" "line 1 is '" \
  "replace_fixed $SR '# Spec Review Standard' '# Spec review standard'"

mutation std "A7 Apache-2.0 only outside the intro" \
  'intro credits EGM with the URL and Apache-2.0' 'intro lacks:' \
  "replace_fixed $SR 'licensed under Apache-2.0.' 'licensed openly.' && printf '%s\n' 'Apache-2.0' >> $SR"

mutation std "A7 row command only outside the row" \
  'Tooling Exceptions row for spec_review_gate_20261030 is complete' 'row lacks:' \
  "replace_fixed $TS 'role-gate --role spec-review' 'role-gate' && printf '%s\n' 'role-gate --role spec-review' >> $TS"

mutation std "A3 track id only outside the table" \
  'Tooling Exceptions row for spec_review_gate_20261030 is complete' 'Tooling Exceptions table has no row' \
  "replace_fixed $TS '| \`spec_review_gate_20261030\` |' '| \`other_track_20261030\` |' && printf '%s\n' '\`spec_review_gate_20261030\` role-gate --role spec-review dispositions: tests/spec_review_gate/run.sh' >> $TS"

mutation nt "A4 step 9 title changed" \
  "step 9 line '9. **Spec Review (fresh subagent):**'" "§2.5 has no line starting '9. **Spec Review (fresh subagent):**'" \
  "replace_fixed $NT '9. **Spec Review (fresh subagent):**' '9. **Spec Review:**'"

mutation nt "A7 forbid sentence only in the step 10 block" \
  'step 9 forbids a review in this context' 'step 9 forbids a review in this context' \
  "replace_fixed $NT 'Never run the review in this context.' 'Run it.' && insert_after $NT '10. **Commit Changes:**' '    Never run the review in this context.'"

mutation nt "re-review limit removed" \
  'step 9 gives the re-review limit' 'step 9 gives the re-review limit' \
  "replace_fixed $NT 'at most one re-review' 'one more review'"

mutation nt "A7 negated spec-review line in the step 5 block" \
  "step 5 block is non-empty and has no 'spec-review'" "step 5 index template contains 'spec-review'" \
  "insert_after $NT '5. **Create Track Index:**' '   Never add a spec-review line to this index.'"

mutation nt "A7 negated spec-review line in new-track-set.md" \
  "new-track-set.md is non-empty and has no 'spec-review'" "new-track-set.md contains 'spec-review'" \
  "printf '%s\n' 'Do not run spec-review in a track set.' >> $NTS"

mutation nt "A4 a twelfth numbered step" \
  'numbers 1 to 11 occur once each' 'numbering:' \
  "insert_after $NT '11. Announce completion:' '12. Extra step.'"

mutation nt "A4 directory line changed" \
  'exact spec-review.md line sits between' 'Directory Structure lines missing' \
  "replace_fixed $SK '├── spec-review.md  # Spec review report (fresh subagent)' '├── review.md  # Review'"

mutation nt "A5 one byte differs in the bundle" \
  'skills/measure equals claude-skills/measure' 'bundle differs' \
  "printf 'x' >> \"\$D/claude-skills/measure/SKILL.md\""

STUB_PASS="printf '%s\n' '#!/usr/bin/env bash' 'echo \"=== spec_review_gate: 0 suites (PASS=0, FAIL=0) ===\"' 'exit 0' > $RN"
STUB_NONE="printf '%s\n' '#!/usr/bin/env bash' 'echo \"no suites matched\"' 'echo \"=== spec_review_gate: 0 suites (PASS=0, FAIL=0) ===\"' 'exit 1' > $RN"

mutation nt "A4 runner stub that always exits 0, zero match" \
  "runner exits 1, prints 'no suites matched' before the summary" 'runner exit code is 0 for a pattern that matches nothing' \
  "$STUB_PASS"

mutation nt "A4 runner stub that always exits 0, mixed suites" \
  'exit 1 when one suite fails' 'exit 0 when one suite fails' \
  "$STUB_PASS"

mutation nt "A4 runner stub that always reports no suites" \
  'default patterns exit 0 for passing suites' 'default patterns exit 1 for passing suites' \
  "$STUB_NONE"

# ---------------------------------------------------------------------------
echo ""
echo "=== Results ==="
for r in "${RESULTS[@]}"; do echo "$r"; done
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "=== Total: $TOTAL checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
