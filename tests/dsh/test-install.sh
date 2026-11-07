#!/usr/bin/env bash
# Task 1.2: install, idempotency, the copy/stamp rules, dry-run, prerequisites.
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
world_init

# 1. The first install writes the copy, its stamp, the managed block, and the
#    skill copies through the installer stub.
run install --ref t1
assert_rc 0
assert_file "$PLUGIN_DST/index.js"
assert_file "$PLUGIN_DST/client.js"
assert_file "$PLUGIN_DST/package.json"
assert_file "$PLUGIN_DST/cordis.patch.yml"
assert_file "$PLUGIN_DST/icon.svg"
assert_file "$PLUGIN_DST/README.md"
assert_file "$PLUGIN_DST/scripts/check-parity.sh"
assert_file "$PLUGIN_DST/src/commands.js"
assert_file "$PLUGIN_DST/locale/en.json"
assert_file "$PLUGIN_DST/.measure-dsh-install"
assert_absent "$PLUGIN_DST/tests"
assert_file "$PATCH"
assert_out '^PASS dsh-install:'
assert_out '^PASS node:'
assert_out '^PASS plugin:'
assert_out '^PASS record:'
assert_line "WRITE $PLUGIN_DST/index.js"
assert_line "WRITE $PLUGIN_DST/scripts/check-parity.sh"
assert_line "WRITE $PATCH"
assert_out '^MKDIR '
assert_out 'no restart'
grep -q 'mode: guard' "$PATCH" || fail "the managed block does not carry mode: guard"
grep -q 'name: ./plugins/dsh-measure-guard/index.js' "$PATCH" || fail "the managed block name is wrong"
grep -q '^# >>> measure-dsh managed block (id: measure-guard) >>>$' "$PATCH" || fail "missing the opening marker"
grep -q '^# <<< measure-dsh managed block <<<$' "$PATCH" || fail "missing the closing marker"
assert_eq "$(head -n 1 "$PLUGIN_DST/.measure-dsh-install")" '# measure-dsh install stamp v1'
src_hash="$(sha256sum -- "$PLUGIN_SRC/index.js" | cut -d' ' -f1)"
grep -q "^file $src_hash  index.js$" "$PLUGIN_DST/.measure-dsh-install" || fail "index.js is not stamped with its source hash"
grep -q "^# >>> measure-dsh managed block" "$PATCH" || fail "the patch has no managed block"
assert_file "$HOME/.agents/skills/measure/references/implement.md"
assert_file "$HOME/.claude/skills/measure-orchestrator/SKILL.md"
assert_out '^PASS skill-install:'
grep -q 'installer ref=t1' "$STUB_INSTALLER_LOG" || fail "the installer stub did not receive --ref t1"

# 2. A second install rewrites only the patch as the recompose trigger: the
#    plugin files, stamp, and skills are unchanged and every YAML entry stays
#    equal (only the trailing-newline count moves).
before="$(profile_fingerprint)"
run install --no-skills
assert_rc 0
assert_out 'recompose marker toggled to trigger a live recompose'
assert_not_out '^WRITE .*plugins/'
assert_not_out '^REMOVE '
assert_not_out '^MKDIR '
grep -qxF '# measure-dsh reload marker' "$PATCH" || fail "the second install did not toggle the recompose marker"
[[ "$(profile_fingerprint)" != "$before" ]] || fail "the second install did not rewrite the patch"

# 3. A locally edited destination is kept, warned about, and keeps its old
#    stamped hash even when the source moves on.
printf '\n// local edit\n' >>"$PLUGIN_DST/index.js"
printf '\n// source moved on\n' >>"$PLUGIN_SRC/index.js"
run install --no-skills
assert_rc 0
assert_out '^WARN plugin:.*index\.js'
grep -q 'local edit' "$PLUGIN_DST/index.js" || fail "the local edit was overwritten"
if grep -q 'source moved on' "$PLUGIN_DST/index.js"; then fail "the edited file was overwritten by the new source"; fi
grep -q "^file $src_hash  index.js$" "$PLUGIN_DST/.measure-dsh-install" || fail "the old stamp hash was not kept for the edited file"
assert_line "KEEP $PLUGIN_DST/index.js"

# Reset the edited file so the stale-file cases start from a clean stamp.
cp -- "$PLUGIN_SRC/index.js" "$PLUGIN_DST/index.js"
run install --no-skills
assert_rc 0

# 4. A stale stamped file whose source is gone is removed and pruned.
printf 'stale\n' >"$PLUGIN_SRC/obsolete.txt"
run install --no-skills
assert_rc 0
assert_file "$PLUGIN_DST/obsolete.txt"
rm -- "$PLUGIN_SRC/obsolete.txt"
run install --no-skills
assert_rc 0
assert_absent "$PLUGIN_DST/obsolete.txt"
assert_line "REMOVE $PLUGIN_DST/obsolete.txt"

# A stale stamped file the user edited is kept with a warning.
printf 'stale edited\n' >"$PLUGIN_SRC/stale-edited.txt"
run install --no-skills
assert_rc 0
printf 'user change\n' >"$PLUGIN_DST/stale-edited.txt"
rm -- "$PLUGIN_SRC/stale-edited.txt"
run install --no-skills
assert_rc 0
assert_file "$PLUGIN_DST/stale-edited.txt"
assert_out '^WARN plugin:.*stale-edited\.txt'
rm -- "$PLUGIN_DST/stale-edited.txt"
grep -v 'stale-edited.txt' "$PLUGIN_DST/.measure-dsh-install" >"$PLUGIN_DST/.measure-dsh-install.new"
mv -- "$PLUGIN_DST/.measure-dsh-install.new" "$PLUGIN_DST/.measure-dsh-install"

# 5. --dry-run prints the actions it would take and writes nothing.
printf 'dry run\n' >"$PLUGIN_SRC/dry.txt"
before="$(profile_fingerprint)"
run install --no-skills --dry-run
assert_rc 0
assert_absent "$PLUGIN_DST/dry.txt"
assert_eq "$(profile_fingerprint)" "$before"
assert_line "WRITE $PLUGIN_DST/dry.txt"
assert_out 'dry run'
rm -- "$PLUGIN_SRC/dry.txt"

# 6. A missing profile folder is an environment error.
run install --profile nope --no-skills
assert_rc 3
assert_out '^FAIL dsh-install:'

# 7. A bad mode is a usage error; uninstall does not take --mode.
run install --mode nope --no-skills
assert_rc 2
run uninstall --mode guard
assert_rc 2

# 8. The installer's exit 2 (local edits kept) becomes WARN and still succeeds.
export STUB_INSTALLER_EXIT=2
run install
assert_rc 0
assert_out '^WARN skill-install:.*exit 2'
unset STUB_INSTALLER_EXIT

# 9. Any other installer exit is a FAIL and an incomplete install.
export STUB_INSTALLER_EXIT=1
run install
assert_rc 1
assert_out '^FAIL skill-install:.*exited 1'
unset STUB_INSTALLER_EXIT

# 10. --no-skills does not call the installer.
rm -f -- "$STUB_INSTALLER_LOG"
run install --no-skills
assert_rc 0
assert_absent "$STUB_INSTALLER_LOG"

# 11. --source must name a plugin package directory.
mkdir -p -- "$W/not-a-package"
run install --source "$W/not-a-package" --no-skills
assert_rc 3
assert_out '^FAIL source:'

# 12. The installer no longer carries the DSH plugin row: bin/measure-dsh owns
# that copy, so a second writer cannot race it.
if grep -q 'dsh-measure-guard' "$REPO_ROOT/bin/install-targets.tsv"; then
  fail "bin/install-targets.tsv still carries a DSH plugin row"
fi
echo "[PASS] the installer carries no DSH plugin row"

echo "[PASS] test-install.sh"
