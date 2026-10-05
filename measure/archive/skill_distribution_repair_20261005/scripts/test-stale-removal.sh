#!/usr/bin/env bash
# FR-6: remove only the files that the installer installed and the source dropped.
set -euo pipefail
source "$(dirname "$0")/lib.sh"
make_world

run_installer
assert_rc 0
# A target file is a copy, never a hard link into the repository working tree.
if [[ "$(inode "$AGENTS_T/scripts/tool.sh")" == "$(inode "$REPO/skills/measure/scripts/tool.sh")" ]]; then
  fail_test "the target file is a hard link into the repository working tree"
fi
printf 'my notes\n' >"$CLAUDE_T/notes.md"          # never installed
printf 'local tool edit\n' >"$AGENTS_T/scripts/tool.sh"  # installed, then edited

git -C "$REPO" rm -q skills/measure/references/review.md skills/measure/scripts/tool.sh
commit_all "drop 2 files"

run_installer
assert_rc 2
assert_absent "$CLAUDE_T/references/review.md"
assert_absent "$AGENTS_T/references/review.md"
assert_absent "$CLAUDE_T/scripts/tool.sh"
assert_content "$CLAUDE_T/notes.md" "my notes"
# A dropped file with a local edit stays, with a warning.
assert_content "$AGENTS_T/scripts/tool.sh" "local tool edit"
assert_log "warn local-edit .*\\.agents/skills/measure/scripts/tool\\.sh"
if grep -q 'references/review.md' "$CLAUDE_T/.measure-install"; then
  fail_test "the stamp still lists a removed file"
fi

pass_test
