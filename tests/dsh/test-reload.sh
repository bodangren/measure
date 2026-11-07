#!/usr/bin/env bash
# Story S1: the reload action rewrites only the trailing newlines of the patch
# file (a recompose trigger), every YAML entry stays equal, and a dry run or an
# absent profile never writes.
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
world_init

run install --ref t
assert_rc 0

patch_bytes_before="$(wc -c <"$PATCH")"
patch_text_before="$(cat -- "$PATCH")"
fingerprint_before="$(profile_fingerprint)"

# 1. reload --dry-run writes nothing and says what it would do.
run reload --dry-run
assert_rc 0
assert_out '^PASS reload: would rewrite .*cordis\.patch\.yml'
assert_eq "$(profile_fingerprint)" "$fingerprint_before"

# 2. reload toggles the trailing newlines only: the YAML text is unchanged
#    (cat strips trailing newlines) while the file bytes differ.
run reload
assert_rc 0
assert_out '^PASS reload: rewrote .*cordis\.patch\.yml'
assert_out 'reload complete'
assert_eq "$(cat -- "$PATCH")" "$patch_text_before"
[[ "$(wc -c <"$PATCH")" != "$patch_bytes_before" ]] || fail "reload did not change the patch bytes"
grep -q '# >>> measure-dsh managed block' "$PATCH" || fail "managed block opener missing"
grep -q '# <<< measure-dsh managed block' "$PATCH" || fail "managed block closer missing"

# 3. A second reload toggles back; the YAML text is still equal.
run reload
assert_rc 0
assert_eq "$(cat -- "$PATCH")" "$patch_text_before"

# 4. An absent profile is an environment error.
run reload --profile nope
assert_rc 3
assert_out '^FAIL reload: profile folder does not exist'

# 5. A dry-run install keeps the patch when the managed block is unchanged.
run install --no-skills --dry-run
assert_rc 0
assert_out 'KEEP .*cordis\.patch\.yml'

# 6. A second real install rewrites the patch for a recompose, no plugin files.
run install --no-skills
assert_rc 0
assert_out 'patch rewritten to trigger a live recompose'
assert_not_out '^WRITE .*plugins/'
