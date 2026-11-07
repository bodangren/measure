#!/usr/bin/env bash
# Task 1.4: uninstall removes the managed block and the copy it owns, keeps
# edited files and foreign rows, and writes [] when only comments would remain.
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
world_init

install_clean() {
  run install --no-skills
  assert_rc 0
}

# 1. The block and the copy are removed; a CLI-created patch becomes [].
install_clean
assert_file "$PLUGIN_DST/index.js"
assert_file "$PATCH"
run uninstall
assert_rc 0
assert_absent "$PLUGIN_DST"
assert_file "$PATCH"
assert_eq "$(cat -- "$PATCH")" "[]"
if grep -q 'measure-dsh managed block' "$PATCH"; then fail "the managed block survived uninstall"; fi
assert_file "$HOME/.agents/skills/measure/references/implement.md"
assert_file "$HOME/.claude/skills/measure-orchestrator/SKILL.md"

# 2. --keep-copy keeps the copy but still removes the block.
install_clean
if [[ "$(head -n 1 "$PATCH")" == "[]" ]]; then fail "reinstall appended a block after the [] placeholder"; fi
run uninstall --keep-copy
assert_rc 0
assert_dir "$PLUGIN_DST"
assert_file "$PLUGIN_DST/index.js"
assert_file "$PLUGIN_DST/.measure-dsh-install"
if grep -q 'measure-dsh managed block' "$PATCH"; then fail "--keep-copy left the managed block"; fi
run uninstall
assert_rc 0
assert_absent "$PLUGIN_DST"

# 3. An edited copy file is kept, warned about, and leaves the folder in place;
#    the unedited files and the stamp are still removed.
install_clean
printf '\n// local edit\n' >>"$PLUGIN_DST/index.js"
run uninstall
assert_rc 0
assert_file "$PLUGIN_DST/index.js"
grep -q 'local edit' "$PLUGIN_DST/index.js" || fail "the edited file was overwritten"
assert_out '^WARN plugin:.*index\.js'
assert_absent "$PLUGIN_DST/client.js"
assert_absent "$PLUGIN_DST/src"
assert_eq "$(cat -- "$PATCH")" "[]"
rm -rf -- "$PLUGIN_DST"
install_clean

# 4. A foreign row is left alone; only the managed block goes.
GOOD="$W/good.patch"
cp -- "$PATCH" "$GOOD"
printf '%s\n' '- { id: measure-guard, name: other }' >>"$PATCH"
run uninstall
assert_rc 0
grep -qF 'name: other' "$PATCH" || fail "uninstall removed the foreign row"
if grep -q 'measure-dsh managed block' "$PATCH"; then fail "uninstall left the managed block"; fi
assert_out '^WARN foreign-row:.*left'
assert_absent "$PLUGIN_DST"
cp -- "$GOOD" "$PATCH"
install_clean

# 5. --dry-run prints the actions and writes nothing.
before="$(profile_fingerprint)"
run uninstall --dry-run
assert_rc 0
assert_eq "$(profile_fingerprint)" "$before"
assert_out '^WRITE .*cordis\.patch\.yml'
assert_out '^REMOVE .*index\.js'
assert_file "$PLUGIN_DST/index.js"
assert_file "$PATCH"

# 6. Other rows are preserved byte for byte and the result stays a valid array.
install_clean
{
  printf '%s\n' '- insert:'
  printf '%s\n' '    - id: other'
  printf '%s\n' '      name: other-plugin'
} >"$W/other.patch"
cat -- "$PATCH" >>"$W/other.patch"
cp -- "$W/other.patch" "$PATCH"
run uninstall
assert_rc 0
grep -qF 'name: other-plugin' "$PATCH" || fail "the other row was lost"
if grep -q 'measure-dsh managed block' "$PATCH"; then fail "the managed block survived"; fi

# 7. When only comments and blank lines would remain, the file is [].
rm -f -- "$PATCH"
install_clean
printf '%s\n' '# keep me' >>"$PATCH"
run uninstall
assert_rc 0
assert_eq "$(cat -- "$PATCH")" "[]"
assert_absent "$PLUGIN_DST"

echo "[PASS] test-uninstall.sh"
