#!/usr/bin/env bash
# S3 contract test: the Finding Dispositions text in contracts.md, the Green role, the five
# audit roles, the orchestrator Delegation section, review.md, the spec review standard, and
# new-track step 9.
# Defenses: A4 (every extract is asserted non-empty before a compare or a search; a heading
# or a block that is missing fails the check), A3 (no bare-digit match), A7 (exact fixed
# strings, no exclusion filter), A9 (the test reads no track folder).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CONTRACTS="$ROOT/skills/measure-orchestrator/references/contracts.md"
ORCH_SKILL="$ROOT/skills/measure-orchestrator/SKILL.md"
GREEN="$ROOT/agents/measure-jr-green.md"
REVIEW_MD="$ROOT/skills/measure/references/review.md"
STANDARD="$ROOT/skills/measure/references/spec-review.md"
NEW_TRACK="$ROOT/skills/measure/references/new-track.md"
AUDIT_ROLES=(
  "$ROOT/agents/measure-review-a-correctness.md"
  "$ROOT/agents/measure-review-b-security.md"
  "$ROOT/agents/measure-review-c-ux-api.md"
  "$ROOT/agents/measure-phase-acceptance.md"
  "$ROOT/agents/measure-spec-review.md"
)

FAILED=0
PASS_COUNT=0
FAIL_COUNT=0
RESULTS=()
pass() { RESULTS+=("PASS: $1"); PASS_COUNT=$((PASS_COUNT + 1)); echo "PASS: $1"; }
fail() { RESULTS+=("FAIL: $1"); FAIL_COUNT=$((FAIL_COUNT + 1)); FAILED=1; echo "FAIL: $1"; }

TMP="$(mktemp -d)"
if [ -z "$TMP" ] || [ ! -d "$TMP" ]; then echo "mktemp -d did not return a folder" >&2; exit 1; fi
trap 'rm -rf "$TMP"' EXIT

blank() { [ -z "${1//[[:space:]]/}" ]; }

# section FILE HEADING STOP_REGEX: lines after HEADING up to the next line that matches
# STOP_REGEX (fence-aware; prints nothing when the heading is absent)
section() {
  awk -v h="$2" -v stop="$3" '
    /^[[:space:]]*```/ { fence = !fence }
    found == 0 { if (!fence && $0 == h) { found = 1 } ; next }
    !fence && $0 ~ stop { exit }
    { print }
  ' "$1" 2>/dev/null
}

# flat TEXT: collapse newlines and runs of spaces to single spaces
flat() { printf '%s\n' "$1" | tr '\n' ' ' | sed -E 's/[[:space:]]+/ /g'; }

# in_text LABEL TEXT STRING: pass when TEXT holds STRING (TEXT must be non-empty)
in_text() {
  echo "=== $1 ==="
  if blank "$2"; then fail "$1: the searched text is missing or empty"
  elif grep -qF -- "$3" <<< "$2"; then pass "$1"
  else fail "$1: missing [$3]"; fi
}

# in_flat LABEL TEXT STRING: like in_text, after whitespace collapse (for wrapped sentences)
in_flat() {
  echo "=== $1 ==="
  if blank "$2"; then fail "$1: the searched text is missing or empty"
  elif [[ "$(flat "$2")" == *"$3"* ]]; then pass "$1"
  else fail "$1: missing [$3]"; fi
}

# has_bullet LABEL TEXT PREFIX: pass when TEXT has a line that starts with PREFIX
has_bullet() {
  echo "=== $1 ==="
  if blank "$2"; then fail "$1: the searched text is missing or empty"
  elif printf '%s\n' "$2" | awk -v p="$3" 'index($0, p) == 1 { f = 1 } END { exit !f }'; then pass "$1"
  else fail "$1: no line starts with [$3]"; fi
}

# line_of FILE FIXED_LINE: first line number of an exact line, or nothing
line_of() { grep -nxF -- "$2" "$1" 2>/dev/null | head -n 1 | cut -d: -f1; }

# ---------------------------------------------------------------------------
# contracts.md: ## Finding Dispositions
echo "=== contracts.md: ## Finding Dispositions comes after ## Spec Review JSON ==="
lsr=$(line_of "$CONTRACTS" '## Spec Review JSON')
lfd=$(line_of "$CONTRACTS" '## Finding Dispositions')
if [ -z "$lsr" ]; then fail "contracts.md has no '## Spec Review JSON' heading"
elif [ -z "$lfd" ]; then fail "contracts.md has no '## Finding Dispositions' heading"
elif [ "$lsr" -lt "$lfd" ]; then pass "heading at line $lfd after Spec Review JSON at line $lsr"
else fail "heading (line $lfd) is not after Spec Review JSON (line $lsr)"; fi

FD="$(section "$CONTRACTS" '## Finding Dispositions' '^## ')"
in_text 'contracts.md: routed finding form' "$FD" 'F<n> [Blocker|Major|Nit] <scope>: <text>'
for scope in review-a review-b review-c adversarial-testing ux-browser-review phase-acceptance; do
  in_text "contracts.md: scope name $scope" "$FD" "\`$scope\`"
done
has_bullet 'contracts.md: bullet FIX' "$FD" '- **FIX**'
has_bullet 'contracts.md: bullet CONTEST' "$FD" '- **CONTEST**'
has_bullet 'contracts.md: bullet ESCALATE' "$FD" '- **ESCALATE**'
has_bullet 'contracts.md: bullet DECLINE' "$FD" '- **DECLINE**'
in_flat 'contracts.md: evidence sentence' "$FD" '"Intentional" or "by design" without a cited record is not evidence.'
in_text 'contracts.md: dispositions: none' "$FD" 'dispositions: none'
in_text 'contracts.md: dispositions line form' "$FD" 'dispositions: F1=FIX; F2=CONTEST('
in_text 'contracts.md: control/zero-width rejection' "$FD" 'invalid dispositions line: control or zero-width character'
in_flat 'contracts.md: control class names C1 controls' "$FD" 'C1 control'
in_text 'contracts.md: CONTEST kept form' "$FD" '| CONTEST kept:'
in_text 'contracts.md: withdrawn form' "$FD" 'withdrawn:'
in_text 'contracts.md: Comprehension gap rule' "$FD" 'Comprehension gap:'
in_flat 'contracts.md: no-FIX round rule' "$FD" 'no FIX item'

# ---------------------------------------------------------------------------
# Green role
echo "=== Green role: ## Routed findings comes directly before ## Fabricate-vs-block decision ==="
lrf=$(line_of "$GREEN" '## Routed findings')
if [ -z "$lrf" ]; then fail "measure-jr-green.md has no '## Routed findings' heading"
else
  next_heading=$(awk -v n="$lrf" 'NR > n && /^## / { print; exit }' "$GREEN")
  if [ "$next_heading" = '## Fabricate-vs-block decision' ]; then pass "the heading after '## Routed findings' is '## Fabricate-vs-block decision'"
  else fail "the heading after '## Routed findings' is [$next_heading]"; fi
fi
RF="$(section "$GREEN" '## Routed findings' '^## ')"
GREEN_ALL="$(cat "$GREEN" 2>/dev/null)"
in_text 'Green role: names Finding Dispositions' "$GREEN_ALL" 'Finding Dispositions'
in_text 'Green role: names the dispositions: line' "$GREEN_ALL" 'dispositions:'
in_flat 'Green role: Routed findings section names Finding Dispositions' "$RF" 'Finding Dispositions'
in_flat 'Green role: Routed findings section requires the dispositions: line' "$RF" 'dispositions:'
in_flat 'Green role: Routed findings section states the no-FIX rule' "$RF" 'no FIX item'

# ---------------------------------------------------------------------------
# The five audit roles: contested-item paragraph
for role_file in "${AUDIT_ROLES[@]}"; do
  name="${role_file##*/}"
  ALL="$(cat "$role_file" 2>/dev/null)"
  in_text "$name: withdrawn:" "$ALL" 'withdrawn:'
  in_text "$name: | CONTEST kept:" "$ALL" '| CONTEST kept:'
  in_text "$name: escalate_human" "$ALL" 'escalate_human'
  echo "=== $name: the contested-item paragraph is directly before the closing role paragraph ==="
  para=$(awk '
    function flush() { if (cur != "") { paras[++n] = cur; cur = "" } }
    NF { cur = (cur == "" ? $0 : cur " " $0); next }
    { flush() }
    END { flush(); for (i = 2; i <= n; i++) if (paras[i] ~ /^This is an? (audit-only|gate-only|report-only) role/) { print paras[i - 1]; exit } }
  ' "$role_file" 2>/dev/null)
  if [ ! -s "$role_file" ]; then fail "$name is missing or empty"
  elif blank "$para"; then fail "$name: no paragraph before the 'This is a ... role' paragraph"
  elif [[ "$para" == *'withdrawn:'* && "$para" == *'| CONTEST kept:'* && "$para" == *'escalate_human'* ]]; then pass "$name: the paragraph before the closing role paragraph holds the three strings"
  else fail "$name: the paragraph before the closing role paragraph lacks one of withdrawn:, | CONTEST kept:, escalate_human: [${para:0:140}]"; fi
done

# ---------------------------------------------------------------------------
# Orchestrator skill: Delegation section
DELEG="$(section "$ORCH_SKILL" '## Delegation' '^## ')"
in_flat 'orchestrator SKILL.md Delegation: Finding Dispositions' "$DELEG" 'Finding Dispositions'
in_flat 'orchestrator SKILL.md Delegation: ESCALATE' "$DELEG" 'ESCALATE'
in_flat 'orchestrator SKILL.md Delegation: no FIX item' "$DELEG" 'no FIX item'

# ---------------------------------------------------------------------------
# review.md
echo "=== review.md: finding heading of section 2.5 has the F<n> id ==="
S25="$(section "$REVIEW_MD" '### 2.5 Output Findings' '^### |^## ')"
if blank "$S25"; then fail "review.md has no non-empty '### 2.5 Output Findings' section"
elif grep -qxF -- '### F<n> [Critical/High/Medium/Low] Description of Issue' <<< "$S25"; then pass "section 2.5 has the heading '### F<n> [Critical/High/Medium/Low] Description of Issue'"
else fail "section 2.5 lacks the line '### F<n> [Critical/High/Medium/Low] Description of Issue'"; fi

S31="$(section "$REVIEW_MD" '### 3.1 Review Decision' '^### |^## ')"
echo "=== review.md: 3.1 item 3 Record Dispositions comes after item 2 ==="
l2=$(printf '%s\n' "$S31" | grep -nE -- '^2\. ' | head -n 1 | cut -d: -f1)
l3=$(printf '%s\n' "$S31" | grep -nF -- '3. **Record Dispositions:**' | head -n 1 | cut -d: -f1)
if blank "$S31"; then fail "review.md has no non-empty '### 3.1 Review Decision' section"
elif [ -z "$l2" ]; then fail "section 3.1 has no item 2"
elif [ -z "$l3" ]; then fail "section 3.1 has no item '3. **Record Dispositions:**'"
elif [ "$l2" -lt "$l3" ]; then pass "item 3 at line $l3 after item 2 at line $l2"
else fail "item 3 (line $l3) is not after item 2 (line $l2)"; fi
ITEM3="$(printf '%s\n' "$S31" | awk '/^3\. \*\*Record Dispositions:\*\*/ { f = 1 } f { print }')"
for word in FIX CONTEST ESCALATE DECLINE; do
  in_flat "review.md 3.1 item 3: $word" "$ITEM3" "$word"
done

# ---------------------------------------------------------------------------
# Spec review standard
echo "=== standard: ## Finding Dispositions comes before ## Report Layout ==="
lsf=$(line_of "$STANDARD" '## Finding Dispositions')
lrl=$(line_of "$STANDARD" '## Report Layout')
if [ -z "$lsf" ]; then fail "spec-review.md has no '## Finding Dispositions' heading"
elif [ -z "$lrl" ]; then fail "spec-review.md has no '## Report Layout' heading"
elif [ "$lsf" -lt "$lrl" ]; then pass "heading at line $lsf before Report Layout at line $lrl"
else fail "heading (line $lsf) is not before Report Layout (line $lrl)"; fi
SFD="$(section "$STANDARD" '## Finding Dispositions' '^## ')"
in_flat 'standard: a comprehension gap cannot be contested' "$SFD" 'cannot be contested'
RL="$(awk '$0 == "## Report Layout" { f = 1 } f { print }' "$STANDARD" 2>/dev/null)"
in_flat 'standard Report Layout: secret replacement exception' "$RL" 'without changes, except that the author replaces a secret value with its file and line'
for form in '- F<n>: FIX' '- F<n>: CONTEST(<evidence>)' '- F<n>: ESCALATE(<reason>)' '- F<n>: DECLINE'; do
  in_text "standard Report Layout: response form [$form]" "$RL" "$form"
done

# ---------------------------------------------------------------------------
# new-track.md step 9
S9="$(awk '
  index($0, "9. **Spec Review (fresh subagent):**") == 1 { f = 1 }
  index($0, "10. **Commit Changes:**") == 1 { f = 0 }
  f { print }
' "$NEW_TRACK" 2>/dev/null)"
in_text 'new-track step 9: CONTEST(' "$S9" 'CONTEST('
in_text 'new-track step 9: ESCALATE(' "$S9" 'ESCALATE('
echo "=== new-track step 9: exactly one sub-step 7 line ==="
if blank "$S9"; then fail "new-track.md has no step 9 block"
else
  n7=$(printf '%s\n' "$S9" | grep -cE -- '^   7\. ')
  if [ "$n7" -eq 1 ]; then pass "one line matches the sub-step 7 start"; else fail "lines that match the sub-step 7 start: $n7, expected 1"; fi
fi
LINE7="$(printf '%s\n' "$S9" | grep -E -- '^   7\. ' | head -n 1)"
in_text 'new-track sub-step 7: Round 2 secret check' "$LINE7" 'Before you append the Round 2 text, check it for a secret value'
in_text 'new-track sub-step 7: replace the value with its file and line' "$LINE7" 'replace the value with its file and line'
in_text 'new-track sub-step 7: secret sentences come directly before the Append sentence' "$LINE7" \
  'Before you append the Round 2 text, check it for a secret value (a key, a token, a password), as in sub-step 4. When one occurs, replace the value with its file and line. Append the returned sections under that heading, and show the result to the user.'

echo "=== bundle: diff -r skills/measure claude-skills/measure is empty ==="
if [ ! -d "$ROOT/skills/measure" ] || [ ! -d "$ROOT/claude-skills/measure" ]; then fail "a bundle folder is missing"
else
  d="$(diff -r "$ROOT/skills/measure" "$ROOT/claude-skills/measure" 2>&1)"
  if [ -z "$d" ]; then pass "no difference"; else fail "bundle differs: $(printf '%s\n' "$d" | head -n 3 | tr '\n' ' ')"; fi
fi

# ---------------------------------------------------------------------------
# Edge checks
echo "=== edge: the Agent Result Block template is unchanged ==="
TEMPLATE="$(awk '
  !done && $0 == "```text" { f = 1; next }
  f && $0 == "```" { done = 1; f = 0 }
  f { print }
' "$CONTRACTS" 2>/dev/null)"
EXPECT_TEMPLATE=$'MEASURE_AGENT_RESULT\nrole: <role>\nstatus: complete|blocked|partial\ntrack: <track id>\nphase: <phase heading or track setup/review>\ncommits: <short shas or none>\ntests_run: <commands and pass/fail result>\nfiles_changed: <brief list>\nplan_updates: <brief summary>\nknown_failures: <none or exact remaining failures>\nhandoff: <what the next role or orchestrator should know>\nEND_MEASURE_AGENT_RESULT'
if blank "$TEMPLATE"; then fail "contracts.md has no 'text' code block"
elif grep -qF -- 'dispositions' <<< "$TEMPLATE"; then fail "the template has a dispositions line"
elif [ "$(printf '%s\n' "$TEMPLATE" | wc -l)" -ne 12 ]; then fail "the template has $(printf '%s\n' "$TEMPLATE" | wc -l) lines, expected 12"
elif [ "$TEMPLATE" = "$EXPECT_TEMPLATE" ]; then pass "the template has the same 12 lines and no dispositions line"
else fail "the template differs from the 12 expected lines"; fi

echo "=== edge: no file in skills/ or agents/ contains 'not fixed —' ==="
if [ ! -d "$ROOT/skills" ] || [ ! -d "$ROOT/agents" ]; then fail "skills/ or agents/ is missing"
else
  hits="$(grep -rlF -- 'not fixed —' "$ROOT/skills" "$ROOT/agents" 2>/dev/null | sed "s|^$ROOT/||" | tr '\n' ' ')"
  if [ -z "$hits" ]; then pass "no file contains 'not fixed —'"; else fail "'not fixed —' occurs in: $hits"; fi
fi

echo "=== edge: the standard does not contain the old sentence ==="
if [ ! -s "$STANDARD" ]; then fail "spec-review.md is missing or empty"
elif grep -qF -- 'writes the returned text without changes:' "$STANDARD"; then fail "the standard still has 'writes the returned text without changes:'"
else pass "the old sentence is gone"; fi

# ---------------------------------------------------------------------------
echo ""
echo "=== Results ==="
for r in "${RESULTS[@]}"; do echo "$r"; done
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "=== Total: $TOTAL checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
