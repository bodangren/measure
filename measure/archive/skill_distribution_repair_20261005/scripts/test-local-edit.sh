#!/usr/bin/env bash
# FR-5, FR-9: a local edit in a target file stays, the log warns, exit 2.
set -euo pipefail
source "$(dirname "$0")/lib.sh"
make_world

run_installer
assert_rc 0

printf 'review local edit\n' >"$AGENTS_T/references/review.md"
printf 'review r2\n' >"$REPO/skills/measure/references/review.md"
printf 'skill v2\n' >"$REPO/skills/measure/SKILL.md"
commit_all "source changes"

run_installer
assert_rc 2
assert_content "$AGENTS_T/references/review.md" "review local edit"
# The other files and the other target are installed.
assert_content "$AGENTS_T/SKILL.md" "skill v2"
assert_content "$CLAUDE_T/references/review.md" "review r2"
assert_log "warn local-edit .*\\.agents/skills/measure/references/review\\.md"
assert_log " kept=1 exit=2\$"

# The next run gives the same result: the stamp keeps the old hash.
run_installer
assert_rc 2
assert_content "$AGENTS_T/references/review.md" "review local edit"

pass_test
