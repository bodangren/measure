#!/usr/bin/env bash
# S4 contract test: the doc drift detector of the weekly audit, the A11 catalog entry in both
# catalogs, the A1-A11 count text, the CHANGELOG credit, and the README audit row.
# Defenses: A4 (every extract is asserted non-empty before a compare or a search; a heading or
# a block that is missing fails the check), A3 (labeled counts only, no bare-digit match),
# A7 (exact fixed strings, each searched inside its own section or row, no exclusion filter),
# A9 (the test reads no track folder), pipe lint (here-strings, no pipe into grep -q).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
AUDIT="$ROOT/agents/measure-orchestrator-audit.md"
STRATEGY="$ROOT/agents/measure-strategy.md"
ORCH_SKILL="$ROOT/skills/measure-orchestrator/SKILL.md"
CATALOG="$ROOT/skills/measure-orchestrator/references/anti-pattern-catalog.md"
PROJECT_CATALOG="$ROOT/measure/anti-patterns.md"
CHANGELOG="$ROOT/CHANGELOG.md"
README="$ROOT/README.md"

A11_HEADING='## A11 — Doc-to-code drift after closeout'
EXTEND_HEADING='## How projects extend this catalog'

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

# line_of FILE FIXED_LINE: first line number of an exact line, or nothing
line_of() { grep -nxF -- "$2" "$1" 2>/dev/null | head -n 1 | cut -d: -f1; }

# line_with_prefix FILE PREFIX: first line number of a line that starts with PREFIX, or nothing
line_with_prefix() { awk -v p="$2" 'index($0, p) == 1 { print NR; exit }' "$1" 2>/dev/null; }

# a11_block FILE: the A11 entry, from its heading up to and including the next '---' line.
# The extract stops before any other level-2 heading, so a missing terminator gives a block
# whose last line is not '---' (the caller checks that).
a11_block() {
  awk -v h="$A11_HEADING" '
    found == 0 { if ($0 == h) { found = 1; print } ; next }
    /^## / { exit }
    { print }
    $0 == "---" { exit }
  ' "$1" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Audit role: ## Doc drift detector
echo "=== audit role: the file exists ==="
if [ -s "$AUDIT" ]; then pass "agents/measure-orchestrator-audit.md exists"; else fail "agents/measure-orchestrator-audit.md is missing or empty"; fi

echo "=== audit role: ## Doc drift detector stands after ## A10 and before ## Outputs ==="
L_A10="$(line_with_prefix "$AUDIT" '## A10')"
L_DRIFT="$(line_of "$AUDIT" '## Doc drift detector')"
L_OUT="$(line_of "$AUDIT" '## Outputs')"
if [ -z "$L_A10" ]; then fail "the audit role has no '## A10' heading"
elif [ -z "$L_OUT" ]; then fail "the audit role has no '## Outputs' heading"
elif [ -z "$L_DRIFT" ]; then fail "the audit role has no '## Doc drift detector' heading (A10 at line $L_A10, Outputs at line $L_OUT)"
elif [ "$L_A10" -lt "$L_DRIFT" ] && [ "$L_DRIFT" -lt "$L_OUT" ]; then pass "A10 line $L_A10 < Doc drift detector line $L_DRIFT < Outputs line $L_OUT"
else fail "order is wrong: A10 line $L_A10, Doc drift detector line $L_DRIFT, Outputs line $L_OUT"; fi

DETECTOR="$(section "$AUDIT" '## Doc drift detector' '^## ')"
in_flat "detector section: states that it runs in the scheduled audit" "$DETECTOR" 'scheduled'
in_flat "detector section: names measure/product.md" "$DETECTOR" 'measure/product.md'
in_flat "detector section: names measure/tech-stack.md" "$DETECTOR" 'measure/tech-stack.md'
in_flat "detector section: has the 30 days window" "$DETECTOR" '30 days'
in_flat "detector section: names the completed field" "$DETECTOR" 'completed'
in_flat "detector section: names the updated_at field" "$DETECTOR" 'updated_at'
in_flat "detector section: excludes cancelled tracks" "$DETECTOR" 'cancelled'
in_flat "detector section: has the DRIFT: finding form" "$DETECTOR" 'DRIFT:'
in_flat "detector section: Drift alone does not fail the audit." "$DETECTOR" 'Drift alone does not fail the audit.'
in_flat "detector section: Do not report code that no document covers." "$DETECTOR" 'Do not report code that no document covers.'

# ---------------------------------------------------------------------------
# Both catalogs: the A11 entry
for entry in "$CATALOG|skills/measure-orchestrator/references/anti-pattern-catalog.md" "$PROJECT_CATALOG|measure/anti-patterns.md"; do
  file="${entry%%|*}"
  name="${entry##*|}"
  echo "=== catalog $name: A11 heading stands after A10 and before the extend heading ==="
  l_a10="$(line_with_prefix "$file" '## A10 — ')"
  l_a11="$(line_of "$file" "$A11_HEADING")"
  l_ext="$(line_of "$file" "$EXTEND_HEADING")"
  if [ ! -s "$file" ]; then fail "$name is missing or empty"
  elif [ -z "$l_a10" ]; then fail "$name has no '## A10 — ' heading"
  elif [ -z "$l_ext" ]; then fail "$name has no '$EXTEND_HEADING' heading"
  elif [ -z "$l_a11" ]; then fail "$name has no '$A11_HEADING' heading (A10 at line $l_a10, extend heading at line $l_ext)"
  elif [ "$l_a10" -lt "$l_a11" ] && [ "$l_a11" -lt "$l_ext" ]; then pass "$name: A10 line $l_a10 < A11 line $l_a11 < extend heading line $l_ext"
  else fail "$name: order is wrong (A10 line $l_a10, A11 line $l_a11, extend heading line $l_ext)"; fi

  echo "=== catalog $name: entry headings, labeled count ==="
  if [ ! -s "$file" ]; then fail "$name is missing or empty"
  else
    n="$(grep -cE '^## A[0-9]+ — ' "$file")"
    if [ "$n" -eq 11 ]; then pass "$name: A-entry headings: $n"
    else fail "$name: A-entry headings: $n, expected 11"; fi
  fi
done

# ---------------------------------------------------------------------------
# Count text and Role Order
REGISTRY="$(section "$ORCH_SKILL" '## Anti-Patterns Registry' '^## ')"
in_flat "orchestrator SKILL.md: Anti-Patterns Registry has '11 entries (A1–A11)'" "$REGISTRY" '11 entries (A1–A11)'

ROLE_ORDER="$(section "$ORCH_SKILL" '## Role Order' '^## ')"
ITEM10="$(grep -E '^10\. ' <<< "$ROLE_ORDER" 2>/dev/null | head -n 1)"
echo "=== orchestrator SKILL.md: Role Order item 10 is the audit role ==="
if blank "$ROLE_ORDER"; then fail "the '## Role Order' section is missing or empty"
elif blank "$ITEM10"; then fail "Role Order has no item 10"
elif grep -qF -- '`measure-orchestrator-audit`' <<< "$ITEM10"; then pass "item 10 names the audit role"
else fail "item 10 does not name the audit role: $ITEM10"; fi
in_flat "orchestrator SKILL.md: Role Order item 10 names the doc drift detector" "$ITEM10" 'doc drift detector'

echo "=== agents/measure-strategy.md: '(A1–A11 today)' ==="
if [ ! -s "$STRATEGY" ]; then fail "agents/measure-strategy.md is missing or empty"
elif grep -qF -- '(A1–A11 today)' "$STRATEGY"; then pass "the strategy role says (A1–A11 today)"
else fail "agents/measure-strategy.md lacks '(A1–A11 today)'"; fi

INPUTS="$(section "$AUDIT" '## Inputs' '^## ')"
in_flat "audit role: Inputs section says 'A1–A11 today'" "$INPUTS" 'A1–A11 today'

# ---------------------------------------------------------------------------
# CHANGELOG and README
UNRELEASED="$(section "$CHANGELOG" '## Unreleased' '^## ')"
in_text "CHANGELOG.md: the Unreleased section credits elephant-goldfish-model" "$UNRELEASED" 'elephant-goldfish-model'

echo "=== README.md: the measure-orchestrator-audit row says doc-to-code drift ==="
ROW="$(grep -F -- '| `measure-orchestrator-audit` |' "$README" 2>/dev/null | head -n 1)"
if blank "$ROW"; then fail "README.md has no measure-orchestrator-audit row"
elif grep -qF -- 'doc-to-code drift' <<< "$ROW"; then pass "the audit row says doc-to-code drift"
else fail "the audit row lacks 'doc-to-code drift': $ROW"; fi

# ---------------------------------------------------------------------------
# Edge checks
echo "=== edge: the A11 block is the same in both catalogs ==="
BLOCK_SKILL="$(a11_block "$CATALOG")"
BLOCK_PROJECT="$(a11_block "$PROJECT_CATALOG")"
if blank "$BLOCK_SKILL"; then fail "the A11 block of the skills catalog is empty (no A11 heading)"
elif blank "$BLOCK_PROJECT"; then fail "the A11 block of measure/anti-patterns.md is empty (no A11 heading)"
elif [ "$(printf '%s\n' "$BLOCK_SKILL" | tail -n 1)" != '---' ]; then fail "the A11 block of the skills catalog does not end with a '---' line"
elif [ "$(printf '%s\n' "$BLOCK_PROJECT" | tail -n 1)" != '---' ]; then fail "the A11 block of measure/anti-patterns.md does not end with a '---' line"
elif [ "$BLOCK_SKILL" = "$BLOCK_PROJECT" ]; then pass "the A11 block is the same in both catalogs ($(printf '%s\n' "$BLOCK_SKILL" | wc -l) lines)"
else fail "the A11 block differs between the catalogs"; fi

echo "=== edge: no file in agents/ or skills/measure-orchestrator/ contains 'A1–A10' ==="
n_agents="$(find "$ROOT/agents" -type f 2>/dev/null | wc -l)"
n_orch="$(find "$ROOT/skills/measure-orchestrator" -type f 2>/dev/null | wc -l)"
if [ "$n_agents" -eq 0 ]; then fail "agents/ holds no files"
elif [ "$n_orch" -eq 0 ]; then fail "skills/measure-orchestrator/ holds no files"
else
  hits="$(grep -rnF -- 'A1–A10' "$ROOT/agents" "$ROOT/skills/measure-orchestrator" 2>/dev/null | sed "s|^$ROOT/||" | cut -d: -f1,2 | tr '\n' ' ')"
  if [ -z "$hits" ]; then pass "no file contains 'A1–A10' (files scanned: agents $n_agents, skills/measure-orchestrator $n_orch)"
  else fail "'A1–A10' occurs at: $hits"; fi
fi

echo "=== edge: the A11 recipe, extracted from the catalog, parses and exits 0 in the repository root ==="
RECIPE="$(printf '%s\n' "$BLOCK_SKILL" | awk '
  !done && $0 == "```bash" { f = 1; next }
  f && $0 == "```" { done = 1; f = 0 }
  f { print }
')"
if blank "$BLOCK_SKILL"; then fail "the A11 block is empty, so no recipe can be extracted"
elif blank "$RECIPE"; then fail "the A11 block has no bash code block"
else
  printf '%s\n' "$RECIPE" > "$TMP/a11-recipe.sh"
  syntax="$(bash -n "$TMP/a11-recipe.sh" 2>&1)"
  if [ "$?" -ne 0 ]; then fail "the A11 recipe has a syntax error: $syntax"
  else
    out="$(cd "$ROOT" && bash "$TMP/a11-recipe.sh" 2>&1)"
    rc=$?
    if [ "$rc" -ne 0 ]; then fail "the A11 recipe exited $rc: $(printf '%s\n' "$out" | head -n 3 | tr '\n' ' ')"
    else
      if blank "$out"; then count=0; else count="$(printf '%s\n' "$out" | wc -l)"; fi
      pass "the A11 recipe parsed and exited 0 (A11 DRIFT candidates: $count; the value is not asserted)"
    fi
  fi
fi

# ---------------------------------------------------------------------------
echo ""
echo "=== Results ==="
for r in "${RESULTS[@]}"; do echo "$r"; done
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "=== Total: $TOTAL checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
