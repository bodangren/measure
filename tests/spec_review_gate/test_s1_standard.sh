#!/usr/bin/env bash
# S1 contract test: the Spec Review Standard (skills/measure/references/spec-review.md)
# and the Tooling Exceptions row of measure/tech-stack.md.
# Defenses: A3 (labeled integers), A4 (missing heading or section fails), A7 (exact strings,
# no bare-word filter). Each string check runs inside its own section only.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STD="$ROOT/skills/measure/references/spec-review.md"
TECH="$ROOT/measure/tech-stack.md"

FAILED=0
PASS_COUNT=0
FAIL_COUNT=0
RESULTS=()
pass() { RESULTS+=("PASS: $1"); PASS_COUNT=$((PASS_COUNT + 1)); echo "PASS: $1"; }
fail() { RESULTS+=("FAIL: $1"); FAIL_COUNT=$((FAIL_COUNT + 1)); FAILED=1; echo "FAIL: $1"; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

HEADINGS=(
  '## Reviewer Input'
  '## Paraphrase First'
  '## Zoom-Out Check'
  '## Zero-Decision Check'
  '## Severity'
  '## Finding Format'
  '## Re-Review Limit'
  '## Report Layout'
)

# section FILE HEADING STOP_REGEX
# Prints the lines after the exact heading line up to the next heading that matches STOP_REGEX.
# Lines inside code fences never start or end a section. Prints nothing when the heading is absent.
section() {
  awk -v h="$2" -v stop="$3" '
    /^[[:space:]]*```/ { fence = !fence }
    found == 0 { if (!fence && $0 == h) { found = 1 } ; next }
    !fence && $0 ~ stop { exit }
    { print }
  ' "$1" 2>/dev/null
}

# order_check FILE
# Returns 0 when each required heading occurs exactly once outside code fences, in contract order.
# Other level-2 headings may sit between them. Prints the reason and returns 1 otherwise.
order_check() {
  local file="$1" prev=0 h count ln heads
  if [ ! -s "$file" ]; then
    echo "file is missing or empty: $file"
    return 1
  fi
  heads=$(awk '/^[[:space:]]*```/ { fence = !fence } !fence && /^## / { print NR "\t" $0 }' "$file")
  for h in "${HEADINGS[@]}"; do
    count=$(printf '%s\n' "$heads" | awk -F '\t' -v h="$h" '$2 == h { n++ } END { print n + 0 }')
    if [ "$count" -ne 1 ]; then
      echo "heading '$h' occurs $count times, expected 1"
      return 1
    fi
    ln=$(printf '%s\n' "$heads" | awk -F '\t' -v h="$h" '$2 == h { print $1 }')
    if [ "$ln" -le "$prev" ]; then
      echo "heading '$h' is out of order (line $ln, previous heading at line $prev)"
      return 1
    fi
    prev="$ln"
  done
  return 0
}

# sec_check LABEL HEADING STRING...   (fixed strings, case-sensitive)
sec_check() {
  local label="$1" heading="$2" sec missing="" s
  shift 2
  echo "=== $label ==="
  sec=$(section "$STD" "$heading" '^## ')
  if [ -z "${sec//[[:space:]]/}" ]; then
    fail "$label: section '$heading' is missing or empty"
    return
  fi
  for s in "$@"; do
    printf '%s\n' "$sec" | grep -qF -- "$s" || missing+=" [$s]"
  done
  if [ -z "$missing" ]; then pass "$label"; else fail "$label: missing in '$heading':$missing"; fi
}

# sec_check_i: same as sec_check, case-insensitive (for phrases taken from contract prose)
sec_check_i() {
  local label="$1" heading="$2" sec missing="" s
  shift 2
  echo "=== $label ==="
  sec=$(section "$STD" "$heading" '^## ')
  if [ -z "${sec//[[:space:]]/}" ]; then
    fail "$label: section '$heading' is missing or empty"
    return
  fi
  for s in "$@"; do
    printf '%s\n' "$sec" | grep -qiF -- "$s" || missing+=" [$s]"
  done
  if [ -z "$missing" ]; then pass "$label"; else fail "$label: missing in '$heading':$missing"; fi
}

# ---------------------------------------------------------------------------
echo "=== standard file exists ==="
if [ -s "$STD" ]; then pass "standard file exists and is non-empty"; else fail "skills/measure/references/spec-review.md is missing or empty"; fi

echo "=== line 1 is the title ==="
first=$(head -n 1 "$STD" 2>/dev/null)
if [ "$first" = '# Spec Review Standard' ]; then pass "line 1 is '# Spec Review Standard'"; else fail "line 1 is '$first', expected '# Spec Review Standard'"; fi

echo "=== EGM credit in the intro paragraph ==="
intro=$(awk 'NR > 1 && /^## / { exit } NR > 1 { print }' "$STD" 2>/dev/null)
if [ -z "${intro//[[:space:]]/}" ]; then
  fail "intro between the title and the first heading is missing or empty"
else
  miss=""
  for s in 'https://github.com/google/elephant-goldfish-model' 'Apache-2.0'; do
    printf '%s\n' "$intro" | grep -qF -- "$s" || miss+=" [$s]"
  done
  if [ -z "$miss" ]; then pass "intro credits EGM with the URL and Apache-2.0"; else fail "intro lacks:$miss"; fi
fi

echo "=== eight level-2 headings in contract order ==="
if reason=$(order_check "$STD"); then pass "eight headings in contract order"; else fail "heading order: $reason"; fi

sec_check "Reviewer Input: sources and the no-history sentence" '## Reviewer Input' \
  'spec.md' 'plan.md' 'Product Definition' 'Tech Stack' 'Workflow' \
  'The reviewer gets no conversation history.'

sec_check "Paraphrase First: two sections, size, Blocker rule" '## Paraphrase First' \
  'What this track proposes' \
  'How the current system works, per this spec' \
  '2 to 5 sentences' \
  'Blocker' 'Major'

sec_check_i "Zoom-Out Check: six checks" '## Zoom-Out Check' \
  'root problem' 'symptom' 'speculative' 'premature optimization' 'symbol' 'correct place' 'requirement level'

sec_check "Zero-Decision Check: five kinds" '## Zero-Decision Check' \
  'schema' 'API or CLI shape' 'dependency' 'edge-case behavior' 'file location'

sec_check "Severity: three levels and Decision 11 rules" '## Severity' \
  'Blocker' 'Major' 'Nit' 'premature optimization' 'undefined project-specific term'

sec_check "Finding Format: literal line, comprehension gap, term rule" '## Finding Format' \
  'F<n> [Blocker|Major|Nit] <scope>: <description> Rationale: <rationale>' \
  'Comprehension gap:' \
  'Do not flag general engineering terms.'

sec_check "Re-Review Limit: one re-review and Accepted Risks" '## Re-Review Limit' \
  'at most one re-review' \
  '## Accepted Risks'

sec_check "Report Layout: template lines" '## Report Layout' \
  '# Spec Review: <track_id>' \
  'Author model: <model id, or unknown>' \
  '## Round 1' \
  'Date: <YYYY-MM-DD>' \
  'Reviewer: <subagent type and model, or unknown>' \
  '### What this track proposes' \
  '### How the current system works, per this spec' \
  '### Findings' \
  '### Author Response' \
  '## Round 2' \
  '## Accepted Risks' \
  '- None'

echo "=== not-run form in the standard ==="
if [ -s "$STD" ] && grep -qF -- 'Spec review: not run (no subagent tool)' "$STD"; then
  pass "standard has 'Spec review: not run (no subagent tool)'"
else
  fail "standard lacks 'Spec review: not run (no subagent tool)'"
fi

echo "=== Tooling Exceptions row in measure/tech-stack.md ==="
tool=$(section "$TECH" '### Tooling Exceptions (track-scoped)' '^###? ')
if [ -z "${tool//[[:space:]]/}" ]; then
  fail "tech-stack.md has no Tooling Exceptions section"
else
  row=$(printf '%s\n' "$tool" | grep -F -- '| `spec_review_gate_20261030`' | head -n 1)
  if [ -z "$row" ]; then
    fail "Tooling Exceptions table has no row for spec_review_gate_20261030"
  else
    miss=""
    for s in 'role-gate --role spec-review' 'dispositions:' 'tests/spec_review_gate/run.sh'; do
      printf '%s\n' "$row" | grep -qF -- "$s" || miss+=" [$s]"
    done
    if [ -z "$miss" ]; then pass "Tooling Exceptions row for spec_review_gate_20261030 is complete"; else fail "row lacks:$miss"; fi
  fi
fi

# ---------------------------------------------------------------------------
# Edge: the order function must report FAIL when a heading is missing.
echo "=== edge: order check fails for a copy without '## Severity' ==="
if [ ! -s "$STD" ]; then
  fail "cannot build the copy: the standard file is missing"
elif ! order_check "$STD" >/dev/null; then
  fail "cannot prove the edge: the real standard does not pass the order check"
else
  grep -vxF -- '## Severity' "$STD" > "$TMP/no-severity.md"
  before=$(wc -l < "$STD")
  after=$(wc -l < "$TMP/no-severity.md")
  removed=$((before - after))
  if [ "$removed" -ne 1 ]; then
    fail "copy removed $removed lines, expected exactly 1 ('## Severity')"
  elif reason=$(order_check "$TMP/no-severity.md"); then
    fail "order check returned PASS for a copy without '## Severity'"
  elif printf '%s\n' "$reason" | grep -qF -- '## Severity'; then
    pass "order check reports FAIL for the copy: $reason"
  else
    fail "order check failed for the wrong reason: $reason"
  fi
fi

# Harness self-test: the order function on synthetic files. It passes before the standard
# exists, so it shows that the harness itself is sound.
echo "=== harness: order function on synthetic fixtures ==="
{
  echo '# Spec Review Standard'
  for h in "${HEADINGS[@]}"; do echo; echo "$h"; echo 'body'; done
} > "$TMP/good.md"
{
  echo '# Spec Review Standard'
  echo '## Extra Section'
  for h in "${HEADINGS[@]}"; do echo; echo "$h"; echo 'body'; done
} > "$TMP/extra.md"
grep -vxF -- '## Severity' "$TMP/good.md" > "$TMP/missing.md"
{
  echo '# Spec Review Standard'
  swapped=("${HEADINGS[@]}")
  swapped[4]='## Finding Format'
  swapped[5]='## Severity'
  for h in "${swapped[@]}"; do echo; echo "$h"; echo 'body'; done
} > "$TMP/swapped.md"
{ cat "$TMP/good.md"; echo '## Severity'; } > "$TMP/dup.md"
{
  echo '# Spec Review Standard'
  for h in "${HEADINGS[@]}"; do
    if [ "$h" = '## Severity' ]; then
      echo; echo '```markdown'; echo "$h"; echo '```'
    else
      echo; echo "$h"; echo 'body'
    fi
  done
} > "$TMP/fenced.md"
: > "$TMP/empty.md"
self=""
order_check "$TMP/good.md" >/dev/null || self+=" [good file rejected]"
order_check "$TMP/extra.md" >/dev/null || self+=" [extra heading rejected]"
order_check "$TMP/missing.md" >/dev/null && self+=" [missing heading accepted]"
order_check "$TMP/swapped.md" >/dev/null && self+=" [swapped headings accepted]"
order_check "$TMP/dup.md" >/dev/null && self+=" [duplicate heading accepted]"
order_check "$TMP/fenced.md" >/dev/null && self+=" [heading inside a fence accepted]"
order_check "$TMP/empty.md" >/dev/null && self+=" [empty file accepted]"
if [ -z "$self" ]; then pass "order function accepts the two good fixtures and rejects the five bad ones"; else fail "order function defects:$self"; fi

# ---------------------------------------------------------------------------
echo ""
echo "=== Results ==="
for r in "${RESULTS[@]}"; do echo "$r"; done
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "=== Total: $TOTAL checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
