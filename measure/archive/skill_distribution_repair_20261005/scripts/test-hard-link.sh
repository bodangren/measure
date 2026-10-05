#!/usr/bin/env bash
# FR-3: an install writes in place, so a hard link to a target file stays
# (as ~/.agents/agents and ~/Desktop/pi-measure-harness/agents share files).
set -euo pipefail
source "$(dirname "$0")/lib.sh"
make_world

run_installer
assert_rc 0
assert_file "$ROLES_T/measure-a.md"
ln "$ROLES_T/measure-a.md" "$W/linked-role.md"
before="$(inode "$ROLES_T/measure-a.md")"

printf 'role a2\n' >"$REPO/agents/measure-a.md"
commit_all "role change"
run_installer
assert_rc 0

assert_eq "$(inode "$ROLES_T/measure-a.md")" "$before" "inode of the target file"
assert_content "$ROLES_T/measure-a.md" "role a2"
assert_content "$W/linked-role.md" "role a2"
assert_eq "$(stat -c %h "$ROLES_T/measure-a.md")" "2" "link count"

pass_test
