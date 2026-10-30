#!/usr/bin/env bash
# S2 contract test: the role file agents/measure-spec-review.md, the orchestrator skill,
# contracts.md, the repository orchestrator agent file, the command description, the README
# row, and the role counts.
# Defenses: A4 (every extract is asserted non-empty before a compare or a search),
# A3 (labeled integers, no bare-digit match), A7 (exact fixed strings, no exclusion filter).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ROLE="$ROOT/agents/measure-spec-review.md"
REVIEW_A="$ROOT/agents/measure-review-a-correctness.md"
SKILL="$ROOT/skills/measure-orchestrator/SKILL.md"
CONTRACTS="$ROOT/skills/measure-orchestrator/references/contracts.md"
ORCH_AGENT="$ROOT/agents/measure-orchestrator.md"
COMMAND="$ROOT/plugins/opencode-measure-guard/commands/measure-orchestrate.md"
README="$ROOT/README.md"
PRODUCT="$ROOT/measure/product.md"
TECH="$ROOT/measure/tech-stack.md"
STANDARD="$ROOT/skills/measure/references/spec-review.md"
CHECKER="$ROOT/skills/measure-orchestrator/scripts/measure_interphase_checks.py"
PHASE_BASE=ccdaae22a965f06c64ecde9f735a1ed49db3ce5e

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

# has_line LABEL FILE LINE: pass when FILE has a line equal to LINE
has_line() {
  echo "=== $1 ==="
  if [ ! -s "$2" ]; then fail "$1: file is missing or empty ($2)"
  elif grep -qxF -- "$3" "$2"; then pass "$1"
  else fail "$1: missing line [$3]"; fi
}

# ---------------------------------------------------------------------------
# Role file
echo "=== role file exists ==="
FM="" BODY=""
if [ -s "$ROLE" ]; then
  pass "agents/measure-spec-review.md exists"
  FM="$(awk 'NR == 1 && $0 != "---" { exit } NR > 1 && $0 == "---" { exit } NR > 1 { print }' "$ROLE")"
  BODY="$(awk 'c >= 2 { print } $0 == "---" && c < 2 { c++ }' "$ROLE")"
else
  fail "agents/measure-spec-review.md is missing or empty"
fi

echo "=== role frontmatter exists ==="
if blank "$FM"; then fail "role frontmatter is missing or empty"; else pass "role frontmatter has content"; fi

echo "=== frontmatter: description is one non-empty line ==="
if blank "$FM"; then fail "frontmatter is missing"
else
  n=$(printf '%s\n' "$FM" | grep -cE '^description: ?[^[:space:]].*$')
  if [ "$n" -eq 1 ]; then pass "one description: line"; else fail "description: lines with text: $n, expected 1"; fi
fi

fm_line() {
  echo "=== frontmatter: $1 ==="
  if blank "$FM"; then fail "frontmatter is missing"
  elif grep -qxF -- "$1" <<< "$FM"; then pass "frontmatter line [$1]"
  else fail "frontmatter lacks the line [$1]"; fi
}
fm_line 'mode: subagent'
fm_line 'steps: 40'
fm_line 'model: kimi-for-coding/k3'
fm_line 'permission:'

echo "=== frontmatter: options has reasoningEffort: max ==="
if blank "$FM"; then fail "frontmatter is missing"
else
  opt=$(printf '%s\n' "$FM" | awk '$0 == "options:" { f = 1; next } f { print; exit }')
  if [ "$opt" = '  reasoningEffort: max' ]; then pass "options: followed by '  reasoningEffort: max'"; else fail "line after options: is [$opt]"; fi
fi

echo "=== frontmatter: permission keys are edit, bash, skill, task in order ==="
if blank "$FM"; then fail "frontmatter is missing"
else
  keys=$(printf '%s\n' "$FM" | awk '$0 == "permission:" { f = 1; next } f && /^  [a-z]+:/ { sub(/^  /, ""); sub(/:.*/, ""); printf "%s ", $0 }')
  if [ "$keys" = 'edit bash skill task ' ]; then pass "permission keys: $keys"; else fail "permission keys are [$keys], expected [edit bash skill task ]"; fi
fi

echo "=== edit block has exactly the three contract lines ==="
EDIT="$(printf '%s\n' "$FM" | awk '$0 == "  edit:" { f = 1; next } f && /^  [a-z]+:/ { exit } f { print }')"
EXPECT_EDIT=$'    "*": deny\n    "measure/runs/**": allow\n    "**/measure/runs/**": allow'
if blank "$EDIT"; then fail "edit block is missing or empty"
elif [ "$EDIT" = "$EXPECT_EDIT" ]; then pass "edit block equals the three contract lines"
else fail "edit block differs from the contract: [$(flat "$EDIT")]"; fi

echo "=== bash block equals the bash block of review A ==="
extract_bash() { awk '$0 == "  bash:" { f = 1 } $0 == "  skill: allow" { f = 0 } f { print }' "$1" 2>/dev/null; }
BASH_ROLE="$(extract_bash "$ROLE")"
BASH_A="$(extract_bash "$REVIEW_A")"
if blank "$BASH_A"; then fail "bash block of review A is missing or empty"
elif [ "$(printf '%s\n' "$BASH_A" | wc -l)" -lt 10 ]; then fail "bash block of review A has too few lines to be real"
elif blank "$BASH_ROLE"; then fail "bash block of the role file is missing or empty"
elif [ "$BASH_ROLE" = "$BASH_A" ]; then pass "bash blocks are equal ($(printf '%s\n' "$BASH_A" | wc -l) lines)"
else fail "bash block differs from review A: $(diff <(printf '%s\n' "$BASH_A") <(printf '%s\n' "$BASH_ROLE") | head -n 4 | tr '\n' ' ')"; fi

echo "=== frontmatter tail is skill: allow, then task with deny-all ==="
TAIL="$(printf '%s\n' "$FM" | awk '$0 == "  skill: allow" { f = 1 } f { print }')"
EXPECT_TAIL=$'  skill: allow\n  task:\n    "*": deny'
if blank "$TAIL"; then fail "frontmatter has no '  skill: allow' line"
elif [ "$TAIL" = "$EXPECT_TAIL" ]; then pass "tail equals skill: allow, task:, \"*\": deny"
else fail "frontmatter tail differs: [$(flat "$TAIL")]"; fi

echo "=== body starts with the role sentence ==="
first=$(printf '%s\n' "$BODY" | awk 'NF { print; exit }')
if [ -z "$first" ]; then fail "role body is missing or empty"
elif [[ "$first" == 'You are the Measure Spec Review subagent.'* ]]; then pass "body starts with 'You are the Measure Spec Review subagent.'"
else fail "body starts with [$first]"; fi

in_text 'body: installed standard path' "$BODY" '~/.agents/skills/measure/references/spec-review.md'
in_text 'body: repository standard path' "$BODY" 'skills/measure/references/spec-review.md'
in_text 'body: JSON artifact name' "$BODY" 'spec-review-<short-head>.json'
in_text 'body: log artifact name' "$BODY" 'spec-review-<short-head>.log'
in_text 'body: escalate_human' "$BODY" 'escalate_human'
in_text 'body: infrastructure_retry' "$BODY" 'infrastructure_retry'
in_text 'body: inconclusive status' "$BODY" 'status: inconclusive'
in_text 'body: paraphrase' "$BODY" 'paraphrase'
in_text 'body: role_base_sha' "$BODY" 'role_base_sha'
in_text 'body: audited_head_sha' "$BODY" 'audited_head_sha'
in_text 'body: track setup' "$BODY" 'track setup'
in_text 'body: MEASURE_AGENT_RESULT' "$BODY" 'MEASURE_AGENT_RESULT'
in_text 'body: result role' "$BODY" 'role: spec-review'

# ---------------------------------------------------------------------------
# Orchestrator skill
SK_FIRST="$(awk '/^# Measure Orchestrator$/ { f = 1; next } f && NF { p = 1 } f && p && !NF { exit } f && p { print }' "$SKILL")"
in_flat 'SKILL.md: first paragraph role list starts with measure-spec-review' "$SK_FIRST" '(`measure-spec-review`, `measure-strategy`, `measure-mid-red`'

ROLE_ORDER="$(section "$SKILL" '## Role Order' '^## ')"
echo "=== SKILL.md: Role Order item 0 comes before item 1 ==="
ITEM0='0. `measure-spec-review` (once per track, phase "track setup", before the first `measure-strategy`)'
l0=$(printf '%s\n' "$ROLE_ORDER" | grep -nxF -- "$ITEM0" | head -n 1 | cut -d: -f1)
l1=$(printf '%s\n' "$ROLE_ORDER" | grep -nE -- '^1\. ' | head -n 1 | cut -d: -f1)
if blank "$ROLE_ORDER"; then fail "SKILL.md has no non-empty '## Role Order' section"
elif [ -z "$l0" ] || [ -z "$l1" ]; then fail "item lines missing (0='$l0' 1='$l1')"
elif [ "$l0" -lt "$l1" ]; then pass "item 0 at line $l0 before item 1 at line $l1"
else fail "item 0 (line $l0) is not before item 1 (line $l1)"; fi

echo "=== SKILL.md: 'Spec review gate:' paragraph directly follows item 12 ==="
after12=$(printf '%s\n' "$ROLE_ORDER" | awk '/^12\. / { f = 1; next } f && NF { print; exit }')
if blank "$ROLE_ORDER"; then fail "Role Order section is missing"
elif [ -z "$after12" ]; then fail "no line follows item 12"
elif [[ "$after12" == 'Spec review gate:'* ]]; then pass "the first line after item 12 starts with 'Spec review gate:'"
else fail "the first line after item 12 is [$after12]"; fi

GATE_PARA="$(printf '%s\n' "$ROLE_ORDER" | awk '/^Spec review gate:/ { p = 1 } p && !NF { exit } p { print }')"
in_flat 'SKILL.md: gate paragraph names escalate_human' "$GATE_PARA" 'escalate_human'

MODEL_SEL="$(section "$SKILL" '## Model Selection' '^## ')"
in_flat 'SKILL.md: spec reviewer family rule' "$MODEL_SEL" 'The spec reviewer uses a family other than the family that wrote spec.md and plan.md.'
in_flat 'SKILL.md: Author model line source' "$MODEL_SEL" 'Author model:'
in_flat 'SKILL.md: spec-review.md path in the model rule' "$MODEL_SEL" 'measure/tracks/<track>/spec-review.md'
in_flat 'SKILL.md: unknown author model fallback' "$MODEL_SEL" 'family of the host build agent'
in_flat 'SKILL.md: deviation record in the model rule' "$MODEL_SEL" 'record the assumption as a deviation'

CHECKS_SEC="$(section "$SKILL" '## Inter-Phase Checks' '^## ')"
in_text 'SKILL.md: Inter-Phase Checks example line' "$CHECKS_SEC" \
  'python3 ~/.agents/skills/measure-orchestrator/scripts/measure_interphase_checks.py role-gate --repo . --role spec-review --track TRACK --phase "track setup" --baseline BASE_SHA --result-file RESULT.json --log-file LOG'

# ---------------------------------------------------------------------------
# contracts.md
echo "=== contracts.md: ## Spec Review JSON comes after the UX block ==="
lux=$(grep -nF -- 'UX audits add:' "$CONTRACTS" 2>/dev/null | head -n 1 | cut -d: -f1)
lsr=$(grep -nxF -- '## Spec Review JSON' "$CONTRACTS" 2>/dev/null | head -n 1 | cut -d: -f1)
if [ -z "$lux" ]; then fail "contracts.md has no 'UX audits add:' line"
elif [ -z "$lsr" ]; then fail "contracts.md has no '## Spec Review JSON' heading"
elif [ "$lux" -lt "$lsr" ]; then pass "heading at line $lsr after the UX block at line $lux"
else fail "heading (line $lsr) is not after the UX block (line $lux)"; fi
SR_JSON="$(section "$CONTRACTS" '## Spec Review JSON' '^## ')"
in_text 'contracts.md: Spec Review JSON has "paraphrase"' "$SR_JSON" '"paraphrase"'
in_text 'contracts.md: Spec Review JSON has "proposes"' "$SR_JSON" '"proposes"'
in_text 'contracts.md: Spec Review JSON has "current_system"' "$SR_JSON" '"current_system"'
in_text 'contracts.md: Spec Review JSON gives the finding format' "$SR_JSON" '[Blocker|Major|Nit]'
in_text 'contracts.md: Spec Review JSON gives the fail route' "$SR_JSON" 'escalate_human'

# ---------------------------------------------------------------------------
# Repository orchestrator agent file
HANDOFF="$(section "$ORCH_AGENT" '## Role Handoff Rules' '^## ')"
echo "=== agents/measure-orchestrator.md: first Role Handoff Rules bullet ==="
first_bullet="$(printf '%s\n' "$HANDOFF" | awk '/^- / { if (f) exit; f = 1 } f { print }')"
if blank "$first_bullet"; then fail "Role Handoff Rules has no first bullet"
elif [[ "$(flat "$first_bullet")" == "- Run roles in the skill's order: spec review once per track before the first strategy, then strategy,"* ]]; then pass "first bullet starts with the contract text"
else fail "first bullet starts with [$(flat "$first_bullet" | cut -c1-120)]"; fi

echo "=== agents/measure-orchestrator.md: no other section changed (Decision 22) ==="
outside() { awk '$0 == "## Role Handoff Rules" { skip = 1; next } skip && /^## / { skip = 0 } !skip { print }'; }
if ! git -C "$ROOT" cat-file -e "$PHASE_BASE:agents/measure-orchestrator.md" 2>/dev/null; then
  fail "the phase base commit or file is not in the git history"
else
  base_out="$(git -C "$ROOT" show "$PHASE_BASE:agents/measure-orchestrator.md" | outside)"
  cur_out="$(outside < "$ORCH_AGENT")"
  if blank "$base_out" || blank "$cur_out"; then fail "an extract is empty"
  elif [ "$base_out" = "$cur_out" ]; then pass "text outside Role Handoff Rules equals the phase base"
  else fail "text outside Role Handoff Rules differs from the phase base"; fi
fi

# ---------------------------------------------------------------------------
# Command description, README row
has_line 'command description' "$COMMAND" 'description: "Measure: run the active track with the orchestrator and its subagents (spec review, strategy, red, green, reviews, acceptance)"'

echo "=== README: measure-spec-review row follows the measure-orchestrator row ==="
ROW_ORCH='| `measure-orchestrator` | Runs the sequence and routes the handoffs. |'
ROW_SR='| `measure-spec-review` | Reviews spec.md and plan.md before Red starts: a paraphrase, a zoom-out check, and a zero-decision check. |'
lo=$(grep -nxF -- "$ROW_ORCH" "$README" 2>/dev/null | head -n 1 | cut -d: -f1)
ls=$(grep -nxF -- "$ROW_SR" "$README" 2>/dev/null | head -n 1 | cut -d: -f1)
if [ -z "$lo" ]; then fail "README has no measure-orchestrator row"
elif [ -z "$ls" ]; then fail "README has no measure-spec-review row"
elif [ "$ls" -eq $((lo + 1)) ]; then pass "spec-review row at line $ls directly after the orchestrator row at line $lo"
else fail "spec-review row at line $ls, expected line $((lo + 1))"; fi

# ---------------------------------------------------------------------------
# Role counts (A3: labeled integers)
FILES=$(find "$ROOT/agents" -maxdepth 1 -name 'measure-*.md' | wc -l)
labeled_int() { # FILE REGEX: first labeled integer, or nothing
  grep -oE -- "$2" "$1" 2>/dev/null | head -n 1 | grep -oE '[0-9]+' | head -n 1
}
count_check() { # LABEL FILE REGEX
  echo "=== $1 ==="
  local n
  n=$(labeled_int "$2" "$3")
  if [ -z "$n" ]; then fail "$1: no labeled count matches [$3] in $2"
  elif [ "$n" -ne 14 ]; then fail "$1: labeled count is $n, contract says 14"
  elif [ "$n" -ne "$FILES" ]; then fail "$1: labeled count $n, but agents/ holds $FILES measure-*.md files"
  else pass "$1: $n role definitions, $FILES files"; fi
}
count_check 'product.md role count' "$PRODUCT" '[0-9]+ role definitions'
count_check 'tech-stack.md role count' "$TECH" '[0-9]+ measure-\* role definitions'

# ---------------------------------------------------------------------------
# Edge checks
echo "=== edge: the fallback standard exists ==="
if [ -s "$STANDARD" ] && [ "$(sed -n 1p "$STANDARD")" = '# Spec Review Standard' ]; then pass "skills/measure/references/spec-review.md exists"; else fail "skills/measure/references/spec-review.md is missing or has no title"; fi

echo "=== edge: every --role name in the skill is accepted by audit-result ==="
NAMES=$(grep -oE -- '--role [A-Za-z0-9_-]+' "$SKILL" 2>/dev/null | awk '{ print $2 }' | sort -u)
if blank "$NAMES"; then fail "no --role name found in the orchestrator skill"
else
  bad=""
  for name in $NAMES; do
    out=$(env -i PATH="$PATH" python3 -I "$CHECKER" audit-result --role "$name" --file /nonexistent 2>&1)
    if grep -qF -- 'unknown role' <<< "$out"; then bad+=" [$name]"; fi
  done
  if [ -z "$bad" ]; then pass "no unknown role among: $(echo $NAMES)"; else fail "unknown role for:$bad"; fi
fi

echo "=== edge: the skill names spec-review in a --role example ==="
if blank "$NAMES"; then fail "no --role name found in the orchestrator skill"
elif grep -qxF -- 'spec-review' <<< "$NAMES"; then pass "--role spec-review occurs in the skill"
else fail "the skill has no --role spec-review example"; fi

echo "=== edge: no stale role count of 13 ==="
stale=""
for f in "$PRODUCT" "$TECH"; do
  if [ ! -s "$f" ]; then stale+=" [missing: $f]"; continue; fi
  grep -qF -- '13 role definitions' "$f" && stale+=" [13 role definitions in ${f##*/}]"
  grep -qF -- '13 measure-*' "$f" && stale+=" [13 measure-* in ${f##*/}]"
done
if [ -z "$stale" ]; then pass "neither file contains '13 role definitions' or '13 measure-*'"; else fail "stale count text:$stale"; fi

# ---------------------------------------------------------------------------
echo ""
echo "=== Results ==="
for r in "${RESULTS[@]}"; do echo "$r"; done
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "=== Total: $TOTAL checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
