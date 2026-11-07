#!/usr/bin/env bash
# Semantic reload (track dsh_measure_reload_20261107): reload and the unchanged
# install increment the managed entry's reloadNonce config value (a composed-
# config change the loader reacts to); every other YAML line stays byte-equal.
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
world_init

nonce_of() {
  sed -n 's/^        reloadNonce: \([0-9][0-9]*\)$/\1/p' "$PATCH" | head -n 1
}

without_nonce() {
  grep -v '^        reloadNonce: ' -- "$PATCH" | sed -e :a -e '/^$/{$d;N;ba' -e '}'
}

run install --ref t
assert_rc 0

patch_text_before="$(without_nonce)"
nonce_before="$(nonce_of)"
[[ -n "$nonce_before" ]] || fail "the managed block has no reloadNonce"
fingerprint_before="$(profile_fingerprint)"

# 1. reload --dry-run writes nothing and says what it would do.
run reload --dry-run
assert_rc 0
assert_out '^PASS reload: would increment the reloadNonce in .*cordis\.patch\.yml'
assert_eq "$(profile_fingerprint)" "$fingerprint_before"

# 2. reload increments the config value; every other line stays equal.
run reload
assert_rc 0
assert_out '^PASS reload: incremented the reloadNonce in .*cordis\.patch\.yml'
assert_out 'reload complete'
nonce_after="$(nonce_of)"
[[ "$nonce_after" -eq $((nonce_before + 1)) ]] || fail "reload did not increment reloadNonce ($nonce_before -> $nonce_after)"
assert_eq "$(without_nonce)" "$patch_text_before"
! grep -qxF '# measure-dsh reload marker' "$PATCH" || fail "a legacy comment marker was kept"
grep -q '# >>> measure-dsh managed block' "$PATCH" || fail "managed block opener missing"
grep -q '# <<< measure-dsh managed block' "$PATCH" || fail "managed block closer missing"

# 3. A second reload increments it again.
run reload
assert_rc 0
nonce_again="$(nonce_of)"
[[ "$nonce_again" -eq $((nonce_before + 2)) ]] || fail "the second reload did not increment reloadNonce ($nonce_again)"
assert_eq "$(without_nonce)" "$patch_text_before"

# 4. An absent profile is an environment error.
run reload --profile nope
assert_rc 3
assert_out '^FAIL reload: profile folder does not exist'

# 5. A dry-run install keeps the patch when the managed block is unchanged.
run install --no-skills --dry-run
assert_rc 0
assert_out 'KEEP .*cordis\.patch\.yml'

# 6. A second real install bumps the nonce for a recompose, no plugin files.
run install --no-skills
assert_rc 0
assert_out 'reloadNonce incremented to trigger a live recompose'
assert_not_out '^WRITE .*plugins/'
nonce_install="$(nonce_of)"
[[ "$nonce_install" -eq $((nonce_before + 3)) ]] || fail "the unchanged install did not increment reloadNonce ($nonce_install)"
assert_eq "$(without_nonce)" "$patch_text_before"

# 7. A patch with a complete managed block but no reloadNonce (an old install)
#    is tolerated: the nonce defaults to 0 and the reload writes 1.
python3 - "$PATCH" <<'PYEOF'
import sys
path = sys.argv[1]
text = open(path).read()
text = text.replace('        reloadNonce: ', '        # removed nonce: ')
open(path, 'w').write(text)
PYEOF
removed_nonce="$(nonce_of)"
[[ -z "$removed_nonce" ]] || fail "the nonce removal fixture failed"
run reload
assert_rc 0
assert_out '^PASS reload: incremented the reloadNonce'
assert_eq "$(nonce_of)" "1"
