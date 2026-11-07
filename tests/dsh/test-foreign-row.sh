#!/usr/bin/env bash
# Task 1.4: a measure-guard row outside the managed block refuses install and
# check with its line number, leaves the file byte-identical, and survives
# uninstall.
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
world_init

run install --no-skills
assert_rc 0
GOOD="$W/good.patch"
cp -- "$PATCH" "$GOOD"
check() { run --check --dsh-home "$DSH_HOME" --profile web --project "$W/project"; }
restore() { cp -- "$GOOD" "$PATCH"; }

# Each case: append a hand-written measure-guard row after the managed block,
# then prove check and install refuse with the 1-based line number and write
# nothing, and that uninstall removes only the managed block.
case_row() {
  local label="$1" row="$2" offset="$3" needle="$4"
  restore
  local base expected
  base="$(wc -l <"$PATCH")"
  printf '%s\n' "$row" >>"$PATCH"
  expected=$((base + offset))
  cp -- "$PATCH" "$W/case.before"

  check
  assert_rc 1 || fail "$label: check did not fail"
  assert_out "^FAIL foreign-row:.*line $expected"
  assert_out '^FAIL foreign-row:.*delete'
  cmp -s -- "$W/case.before" "$PATCH" || fail "$label: check changed the patch"
  assert_out '^PASS record:.*mode guard'

  run install --no-skills
  assert_rc 1 || fail "$label: install did not refuse"
  assert_out "^FAIL foreign-row:.*line $expected"
  cmp -s -- "$W/case.before" "$PATCH" || fail "$label: install changed the patch"

  run uninstall
  assert_rc 0 || fail "$label: uninstall failed"
  grep -qF -- "$needle" "$PATCH" || fail "$label: uninstall removed the foreign row"
  if grep -q 'measure-dsh managed block' "$PATCH"; then fail "$label: uninstall left the managed block"; fi
  restore
  run install --no-skills
  assert_rc 0 || fail "$label: could not reinstall after the case"
}

# 1. A block-mapping row (indented "- id:").
case_row "block row" $'- insert:\n    - id: measure-guard\n      name: other' 2 'id: measure-guard'

# 2. A flow mapping with a quoted id.
case_row "flow row" '- { id: measure-guard, name: other }' 1 'id: measure-guard'

# 3. A quoted name row for the plugin package.
case_row "quoted name row" $'- insert:\n    - id: other\n      name: "./plugins/dsh-measure-guard/index.js"' 3 'dsh-measure-guard'

# 4. A comment that mentions the row is not a foreign row.
restore
printf '%s\n' '# id: measure-guard (a comment, not a row)' >>"$PATCH"
check
assert_rc 0
assert_out '^PASS foreign-row:'
run install --no-skills
assert_rc 0

echo "[PASS] test-foreign-row.sh"
