#!/usr/bin/env bash
# FR-1, FR-2, FR-3 (mode), FR-4, FR-9: a first install from main.
set -euo pipefail
source "$(dirname "$0")/lib.sh"
make_world

run_installer
assert_rc 0

for t in "$CLAUDE_T" "$AGENTS_T"; do
  assert_content "$t/SKILL.md" "skill v1"
  assert_content "$t/references/review.md" "review r1"
  assert_eq "$(stat -c %a "$t/scripts/tool.sh")" "755" "mode of $t/scripts/tool.sh"
  assert_file "$t/.measure-install"
  grep -qE "^commit $(git -C "$REPO" rev-parse main)\$" "$t/.measure-install" || fail_test "stamp has no commit line for main"
  grep -qE "^file $(sha "$REPO/skills/measure/SKILL.md")  SKILL.md\$" "$t/.measure-install" || fail_test "stamp has no hash line for SKILL.md"
done

# The files pattern: only measure-*.md from agents/.
assert_content "$ROLES_T/measure-a.md" "role a1"
assert_absent "$ROLES_T/other.md"

# FR-2: the parent of ~/.codex/skills/measure does not exist, so that target is skipped.
assert_absent "$HOME/.codex"
assert_out "codex"

# FR-9: one summary line.
assert_log "^[0-9TZ:-]+ ref=main commit=$(git -C "$REPO" rev-parse --short=7 main) written=[0-9]+ removed=0 kept=0 exit=0\$"

pass_test
