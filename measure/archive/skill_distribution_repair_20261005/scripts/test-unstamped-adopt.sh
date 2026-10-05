#!/usr/bin/env bash
# FR-5: a target with no stamp keeps each different file until --adopt.
set -euo pipefail
source "$(dirname "$0")/lib.sh"
make_world

# An old install with no stamp: 1 file differs, 1 file is equal.
mkdir -p "$CLAUDE_T/references"
printf 'skill old\n' >"$CLAUDE_T/SKILL.md"
printf 'review r1\n' >"$CLAUDE_T/references/review.md"

run_installer
assert_rc 2
assert_content "$CLAUDE_T/SKILL.md" "skill old"
assert_out "unstamped"
assert_log "warn unstamped .*\\.claude/skills/measure/SKILL\\.md"
# A target with no old files installs normally.
assert_content "$AGENTS_T/SKILL.md" "skill v1"

run_installer --adopt
assert_rc 0
assert_content "$CLAUDE_T/SKILL.md" "skill v1"
assert_file "$CLAUDE_T/.measure-install"

# After the adopt, a normal run has nothing to keep.
run_installer
assert_rc 0

pass_test
