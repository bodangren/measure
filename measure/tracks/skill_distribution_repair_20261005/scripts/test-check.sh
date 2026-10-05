#!/usr/bin/env bash
# FR-7: --check writes nothing and reports each difference; exit 0 or 1.
set -euo pipefail
source "$(dirname "$0")/lib.sh"
make_world

# Before any install: missing files, exit 1, nothing written.
before="$(home_state)"
run_installer --check
assert_rc 1
assert_out "missing .*\\.claude/skills/measure/SKILL\\.md"
assert_eq "$(home_state)" "$before" "home folder after --check"

run_installer
assert_rc 0
run_installer --check
assert_rc 0

# A source change and a local edit.
printf 'skill v2\n' >"$REPO/skills/measure/SKILL.md"
commit_all "source change"
printf 'review local edit\n' >"$AGENTS_T/references/review.md"
before="$(home_state)"
run_installer --check
assert_rc 1
assert_out "different .*\\.claude/skills/measure/SKILL\\.md"
assert_out "local-edit .*\\.agents/skills/measure/references/review\\.md"
assert_eq "$(home_state)" "$before" "home folder after --check"

pass_test
