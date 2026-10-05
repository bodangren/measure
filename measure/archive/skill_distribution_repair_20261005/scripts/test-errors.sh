#!/usr/bin/env bash
# Contract exit code 3: errors write nothing.
set -euo pipefail
source "$(dirname "$0")/lib.sh"
make_world

before="$(home_state)"

run_installer --no-such-option
assert_rc 3

run_installer --ref no-such-ref
assert_rc 3

# 2 lines for one target folder.
printf 'skills/measure\t~/.agents/skills/measure\t*\n' >>"$REPO/bin/install-targets.tsv"
commit_all "duplicate target"
run_installer
assert_rc 3

assert_eq "$(home_state)" "$before" "home folder after the errors"
assert_absent "$CLAUDE_T"

pass_test
