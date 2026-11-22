#!/usr/bin/env bash
# S5 contract test: the late-finding stop rule of the measure-orchestrator skill.
# Red state: none of the text below exists in contracts.md, SKILL.md, or the four
# role files, so every case fails until Green writes the rule.
#
# Pinned phrases Green must write (exact fixed strings; the cases below match
# these and nothing older):
#   contracts.md (one paragraph directly after the **Round limit.** paragraph):
#   - `**Late-finding stop rule.**`
#   - `A round is one audit cycle on one audited HEAD.`
#   - `Reviews A, B, and C that run in parallel on the same HEAD form one round together.`
#   - `The adversarial pass is its own round.`
#   - `Each re-review after a remediation commit adds one round.`
#   - `A finding that a role raises in round 3 or later of a phase is a late finding.`
#   - `Reviews A/B/C on HEAD1 form round 1. The re-review on HEAD2 is round 2, and the adversarial pass on HEAD2 is round 3`
#   - `Review A alone is round 1. The adversarial pass is round 2, and the re-review after the fix is round 3`
#   - `goes to `measure/tech-debt.md` instead of Green`
#   - `gets exactly one fix round`
#   - `states the wrong output that a user`
#   - `- Late finding <id>: <tech-debt|one-fix-round> (<reason>)` (exact line)
#   - `The Round limit bounds fix rounds that already started.`
#   - `The stop rule stops new fix rounds from starting late in a phase.`
#   - `A one-fix-round finding under the wrong-result exception counts toward the Round limit count.`
#   - `The Round limit wins.`
#   - `A fourth-round finding on the phase's own gate script`
#   - `the delivered dashboard number is wrong gets one fix round`
#   SKILL.md (one pointer line under `## Contracts`):
#   - a line with `Late-finding stop rule` and `references/contracts.md`
#   Each of agents/measure-review-a-correctness.md,
#   agents/measure-review-b-security.md, agents/measure-review-c-ux-api.md,
#   agents/measure-adversarial-testing.md (one pointer line each):
#   - a line with `Late-finding stop rule` and
#     `skills/measure-orchestrator/references/contracts.md`
#
# Defenses: A4 (every extract is asserted non-empty before a compare or a search;
# a missing heading or block fails the check), A3 (no count assertions at all),
# A7 (exact fixed strings, each searched inside its own section or file, no
# exclusion filter).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CONTRACTS="$ROOT/skills/measure-orchestrator/references/contracts.md"
SKILL="$ROOT/skills/measure-orchestrator/SKILL.md"
REVIEW_A="$ROOT/agents/measure-review-a-correctness.md"
REVIEW_B="$ROOT/agents/measure-review-b-security.md"
REVIEW_C="$ROOT/agents/measure-review-c-ux-api.md"
ADVERSARIAL="$ROOT/agents/measure-adversarial-testing.md"

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

# section FILE HEADING STOP_REGEX: lines after the exact HEADING line up to the next line that
# matches STOP_REGEX (fence-aware; prints nothing when the heading is absent)
section() {
  awk -v h="$2" -v stop="$3" '
    /^[[:space:]]*```/ { fence = !fence }
    found == 0 { if (!fence && $0 == h) { found = 1 } ; next }
    !fence && $0 ~ stop { exit }
    { print }
  ' "$1" 2>/dev/null
}

# stop_rule: the stop-rule paragraph, from the first line holding the bold heading
# up to the next level-2 heading (prints nothing when the heading is absent)
stop_rule() {
  awk '
    /^[[:space:]]*```/ { fence = !fence }
    !fence && index($0, "**Late-finding stop rule.**") > 0 { found = 1 }
    found { if (!fence && $0 ~ /^## /) { exit }; print }
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

# has_line LABEL FILE LINE: pass when FILE has a line equal to LINE
has_line() {
  echo "=== $1 ==="
  if [ ! -s "$2" ]; then fail "$1: file is missing or empty ($2)"
  elif grep -qxF -- "$3" "$2"; then pass "$1"
  else fail "$1: missing line [$3]"; fi
}

# line_of FILE FIXED: first line number holding FIXED, or nothing
line_of() { grep -nF -- "$2" "$1" 2>/dev/null | head -n 1 | cut -d: -f1; }

# ---------------------------------------------------------------------------
# contracts.md: files exist, the rule heading exists
echo "=== contracts.md exists ==="
if [ -s "$CONTRACTS" ]; then pass "skills/measure-orchestrator/references/contracts.md exists"; else fail "contracts.md is missing or empty"; fi

CONTRACTS_ALL="$(cat "$CONTRACTS" 2>/dev/null)"
in_text 'contracts.md: the bold stop-rule heading' "$CONTRACTS_ALL" '**Late-finding stop rule.**'

# ---------------------------------------------------------------------------
# contracts.md: the heading sits directly after the Round limit paragraph
echo "=== contracts.md: the stop rule directly follows the Round limit paragraph ==="
L_ROUND="$(line_of "$CONTRACTS" '**Round limit.**')"
L_LATE="$(line_of "$CONTRACTS" '**Late-finding stop rule.**')"
L_GAP="$(grep -nxF -- '## Gap-Closing Red' "$CONTRACTS" 2>/dev/null | head -n 1 | cut -d: -f1)"
if [ -z "$L_ROUND" ]; then fail "contracts.md has no '**Round limit.**' line"
elif [ -z "$L_LATE" ]; then fail "contracts.md has no '**Late-finding stop rule.**' line (Round limit at line $L_ROUND)"
elif [ -z "$L_GAP" ]; then fail "contracts.md has no '## Gap-Closing Red' heading"
elif [ "$L_ROUND" -lt "$L_LATE" ] && [ "$L_LATE" -lt "$L_GAP" ]; then pass "Round limit line $L_ROUND < stop rule line $L_LATE < Gap-Closing Red line $L_GAP"
else fail "order is wrong: Round limit line $L_ROUND, stop rule line $L_LATE, Gap-Closing Red line $L_GAP"; fi

STOP="$(stop_rule "$CONTRACTS")"

# ---------------------------------------------------------------------------
# FR-1: the round count
in_flat 'stop rule: one audit cycle on one audited HEAD' "$STOP" 'A round is one audit cycle on one audited HEAD.'
in_flat 'stop rule: parallel Reviews A/B/C share one round' "$STOP" 'form one round together.'
in_flat 'stop rule: the adversarial pass is its own round' "$STOP" 'The adversarial pass is its own round.'
in_flat 'stop rule: each re-review after a remediation commit adds one round' "$STOP" 'Each re-review after a remediation commit adds one round.'
in_flat 'stop rule: round 3 or later is late' "$STOP" 'round 3 or later of a phase is a late finding.'
in_flat 'stop rule: worked count (a), adversarial pass on HEAD2 is round 3' "$STOP" 'the adversarial pass on HEAD2 is round 3'
in_flat 'stop rule: worked count (b), re-review after the fix is round 3' "$STOP" 'the re-review after the fix is round 3'

# ---------------------------------------------------------------------------
# FR-1/FR-2: tech-debt routing and the wrong-result exception
in_flat 'stop rule: late findings go to measure/tech-debt.md instead of Green' "$STOP" 'goes to `measure/tech-debt.md` instead of Green'
in_flat 'stop rule: the exception gets exactly one fix round' "$STOP" 'gets exactly one fix round'
in_flat 'stop rule: the exception states the wrong output a user sees' "$STOP" 'states the wrong output that a user'

# ---------------------------------------------------------------------------
# FR-4: the exact record-line form
has_line 'contracts.md: the exact record-line form' "$CONTRACTS" '- Late finding <id>: <tech-debt|one-fix-round> (<reason>)'

# ---------------------------------------------------------------------------
# FR-3: the two-rule fit
in_flat 'stop rule: the Round limit bounds started fix rounds' "$STOP" 'The Round limit bounds fix rounds that already started.'
in_flat 'stop rule: the stop rule stops new fix rounds late in a phase' "$STOP" 'The stop rule stops new fix rounds from starting late in a phase.'
in_flat 'stop rule: a one-fix-round finding counts toward the Round limit' "$STOP" 'A one-fix-round finding under the wrong-result exception counts toward the Round limit count.'
in_flat 'stop rule: the Round limit wins' "$STOP" 'The Round limit wins.'

# ---------------------------------------------------------------------------
# FR-5: the worked example
in_flat 'stop rule: the fourth-round gate-script example' "$STOP" "A fourth-round finding on the phase's own gate script"
in_flat 'stop rule: the wrong-dashboard-number example' "$STOP" 'the delivered dashboard number is wrong gets one fix round'

# ---------------------------------------------------------------------------
# FR-6: the SKILL.md pointer line under ## Contracts
SKILL_CONTRACTS="$(section "$SKILL" '## Contracts' '^## ')"
in_flat 'SKILL.md: ## Contracts names the Late-finding stop rule' "$SKILL_CONTRACTS" 'Late-finding stop rule'
echo "=== SKILL.md: one pointer line names the rule and points to references/contracts.md ==="
if blank "$SKILL_CONTRACTS"; then fail "SKILL.md has no non-empty '## Contracts' section"
elif awk 'index($0, "Late-finding stop rule") > 0 && index($0, "references/contracts.md") > 0 { found = 1 } END { exit !found }' <<< "$SKILL_CONTRACTS"; then
  pass "one ## Contracts line holds both 'Late-finding stop rule' and 'references/contracts.md'"
else
  fail "no ## Contracts line holds both 'Late-finding stop rule' and 'references/contracts.md'"
fi

# ---------------------------------------------------------------------------
# FR-6: one pointer line in each of the four role files
role_pointer() {
  echo "=== $1: the Late-finding stop rule pointer line ==="
  if [ ! -s "$2" ]; then fail "$1 is missing or empty ($2)"
  elif awk 'index($0, "Late-finding stop rule") > 0 && index($0, "skills/measure-orchestrator/references/contracts.md") > 0 { found = 1 } END { exit !found }' "$2"; then
    pass "$1 holds one line naming the rule with the contracts.md pointer"
  else fail "$1 has no line holding both 'Late-finding stop rule' and 'skills/measure-orchestrator/references/contracts.md'"; fi
}
role_pointer 'agents/measure-review-a-correctness.md' "$REVIEW_A"
role_pointer 'agents/measure-review-b-security.md' "$REVIEW_B"
role_pointer 'agents/measure-review-c-ux-api.md' "$REVIEW_C"
role_pointer 'agents/measure-adversarial-testing.md' "$ADVERSARIAL"

# ---------------------------------------------------------------------------
echo ""
echo "=== Results ==="
for r in "${RESULTS[@]}"; do echo "$r"; done
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "=== Total: $TOTAL checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
