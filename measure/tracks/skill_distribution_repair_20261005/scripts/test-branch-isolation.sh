#!/usr/bin/env bash
# FR-1: the installer reads the ref, never the working tree or the checked-out branch.
set -euo pipefail
source "$(dirname "$0")/lib.sh"
make_world

run_installer
assert_rc 0

# A commit on a feature branch, checked out, and an uncommitted edit on top.
git -C "$REPO" checkout -q -b feature
printf 'skill v2\n' >"$REPO/skills/measure/SKILL.md"
commit_all "feature change"
printf 'skill uncommitted\n' >"$REPO/skills/measure/SKILL.md"

run_installer
assert_rc 0
assert_content "$CLAUDE_T/SKILL.md" "skill v1"
assert_content "$AGENTS_T/SKILL.md" "skill v1"

# --ref selects another ref.
run_installer --ref feature
assert_rc 0
assert_content "$CLAUDE_T/SKILL.md" "skill v2"
grep -qE "^ref feature\$" "$CLAUDE_T/.measure-install" || fail_test "stamp does not name the ref"

pass_test
