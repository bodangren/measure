#!/usr/bin/env bash
# Task 1.4: the patch replacement is atomic, preserves the file mode and the
# bytes outside the managed block, and refuses a read-only target with 3.
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
world_init

install_clean() {
  run install --no-skills
  assert_rc 0
}

# 1. A patch without a trailing newline is normalised once, not mangled.
printf '%s' '- insert:
    - id: other
      name: other-plugin' >"$PATCH"
[[ "$(tail -c 1 -- "$PATCH" | od -An -tu1 | tr -d ' \n')" == "10" ]] && fail "the fixture already ends with a newline"
install_clean
grep -qF 'name: other-plugin' "$PATCH" || fail "install lost the pre-existing row"
[[ "$(tail -c 1 -- "$PATCH" | od -An -tu1 | tr -d ' \n')" == "10" ]] || fail "install did not normalise the trailing newline"
assert_out '^PASS record:.*normalised'
assert_absent "$PATCH.measure-dsh.tmp"
run uninstall
assert_rc 0
grep -qF 'name: other-plugin' "$PATCH" || fail "uninstall lost the pre-existing row"
[[ "$(tail -c 1 -- "$PATCH" | od -An -tu1 | tr -d ' \n')" == "10" ]] || fail "uninstall left no trailing newline"
assert_eq "$(cat -- "$PATCH")" "- insert:
    - id: other
      name: other-plugin"

# 2. A block replacement preserves the text before and after it exactly.
install_clean
printf '%s\n' 'tail: keep me' >>"$PATCH"
run install --mode strict --no-skills
assert_rc 0
grep -q 'mode: strict' "$PATCH" || fail "the mode change did not reach the block"
grep -qF 'tail: keep me' "$PATCH" || fail "the text after the block was lost"
assert_eq "$(grep -c 'measure-dsh managed block' "$PATCH")" "2"

# 3. A read-only patch refuses with 3, leaves the bytes intact, and copies
#    nothing.
run uninstall
assert_rc 0
printf '%s\n' '- insert:' '    - id: other' '      name: other-plugin' >"$PATCH"
chmod 444 -- "$PATCH"
before_sum="$(sha256sum -- "$PATCH" | cut -d' ' -f1)"
before_mode="$(stat -c %a -- "$PATCH")"
run install --no-skills
assert_rc 3
assert_out '^FAIL record:.*not writable'
assert_eq "$(sha256sum -- "$PATCH" | cut -d' ' -f1)" "$before_sum"
assert_eq "$(stat -c %a -- "$PATCH")" "$before_mode"
assert_absent "$PLUGIN_DST"
chmod 644 -- "$PATCH"

# 4. A read-only profile refuses with 3 and writes nothing.
rm -rf -- "$PLUGIN_DST"
chmod 555 -- "$PROFILE"
run install --no-skills
assert_rc 3
assert_out '^FAIL record:.*not writable'
assert_absent "$PLUGIN_DST"
chmod 755 -- "$PROFILE"

# 5. The file mode survives install and uninstall.
install_clean
chmod 600 -- "$PATCH"
run install --mode strict --no-skills
assert_rc 0
assert_eq "$(stat -c %a -- "$PATCH")" "600"
run uninstall
assert_rc 0
assert_eq "$(stat -c %a -- "$PATCH")" "600"

# 6. Copied files keep their source modes and no temp file is left behind.
install_clean
assert_eq "$(stat -c %a -- "$PLUGIN_DST/scripts/check-parity.sh")" "$(stat -c %a -- "$PLUGIN_SRC/scripts/check-parity.sh")"
assert_eq "$(stat -c %a -- "$PLUGIN_DST/index.js")" "$(stat -c %a -- "$PLUGIN_SRC/index.js")"
if find "$PROFILE" -name '*.measure-dsh.tmp' | grep -q .; then fail "a temporary file was left behind"; fi

echo "[PASS] test-atomic-write.sh"
