#!/usr/bin/env bash
# The installer row of the DSH plugin. A temporary world with a fake home
# folder and a git repository that holds this plugin, the targets file, and a
# copy of the installer; the real home folder is never touched.
# Run: bash plugins/dsh-measure-guard/tests/install.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$HERE/.." && pwd)"
REPO_ROOT="$(cd "$PLUGIN_DIR/../.." && pwd)"
INSTALLER="${INSTALLER:-$REPO_ROOT/bin/install-measure-skill}"

fail() { echo "[FAIL] install.sh: $*" >&2; [[ -n "${OUT:-}" ]] && echo "$OUT" >&2; exit 1; }
assert_file() { [[ -f "$1" ]] || fail "expected file: $1"; }
assert_absent() { [[ ! -e "$1" ]] || fail "expected no file: $1"; }
assert_rc() { [[ "$RC" == "$1" ]] || fail "expected exit $1, got $RC"; }
assert_out() { grep -qE -- "$1" <<<"$OUT" || fail "output does not match /$1/"; }

W="$(mktemp -d -t measure-plugin-install.XXXXXX)"
trap 'rm -rf "$W"' EXIT
export HOME="$W/home"
export XDG_CONFIG_HOME="$HOME/.config" XDG_STATE_HOME="$HOME/.local/state" XDG_DATA_HOME="$HOME/.local/share" XDG_CACHE_HOME="$HOME/.cache"
export GIT_CONFIG_NOSYSTEM=1
case "$HOME" in "$W"/*) ;; *) echo "unsafe HOME: $HOME" >&2; exit 1 ;; esac
mkdir -p "$HOME"
printf '[user]\n\tname = Test\n\temail = test@example.com\n[commit]\n\tgpgsign = false\n[init]\n\tdefaultBranch = main\n' >"$HOME/.gitconfig"

# The repository: the plugin (from the working tree), the targets, the installer.
REPO="$W/repo"
mkdir -p "$REPO/bin" "$REPO/plugins"
git -C "$REPO" init -q -b main
rsync -a "$PLUGIN_DIR/" "$REPO/plugins/dsh-measure-guard/"
TAB="$(printf '\t')"
grep -E "^(plugins/dsh-measure-guard${TAB}~/\.dsh/profiles/web)" "$REPO_ROOT/bin/install-targets.tsv" >"$REPO/bin/install-targets.tsv" ||
  fail "bin/install-targets.tsv has no DSH rows"
cp "$INSTALLER" "$REPO/bin/install-measure-skill"
chmod 755 "$REPO/bin/install-measure-skill"
git -C "$REPO" add -A && git -C "$REPO" commit -q -m "initial"
RUN="$REPO/bin/install-measure-skill"

run() { set +e; OUT="$("$RUN" "$@" 2>&1)"; RC=$?; set -e; }

# The target of the DSH row; the installer skips the row while its parent
# folder (~/.dsh/profiles/web/plugins) does not exist.
PLUGIN_T="$HOME/.dsh/profiles/web/plugins/dsh-measure-guard"

# 1. The profile folder does not exist yet: the installer skips the row.
run
assert_rc 0
assert_out "skip .*plugins/dsh-measure-guard"
assert_absent "$PLUGIN_T"

# 2. With the profile folder present, the plugin lands without tests/.
mkdir -p "$HOME/.dsh/profiles/web/plugins"
run
assert_rc 0
assert_file "$PLUGIN_T/index.js"
assert_file "$PLUGIN_T/client.js"
assert_file "$PLUGIN_T/package.json"
assert_file "$PLUGIN_T/cordis.patch.yml"
assert_file "$PLUGIN_T/locale/en.json"
assert_file "$PLUGIN_T/icon.svg"
assert_absent "$PLUGIN_T/tests"
assert_file "$PLUGIN_T/.measure-install"

# 3. --check lists nothing after a clean install.
run --check
assert_rc 0

# 4. A local edit of an installed plugin file is kept, with a warning and exit 2.
printf 'my local edit\n' >"$PLUGIN_T/index.js"
printf '\n// changed in the ref\n' >>"$REPO/plugins/dsh-measure-guard/index.js"
git -C "$REPO" add -A && git -C "$REPO" commit -q -m "plugin change"
run
assert_rc 2
[[ "$(cat "$PLUGIN_T/index.js")" == "my local edit" ]] || fail "the local plugin edit was overwritten"
assert_out "index.js"

# 5. A file with no stamp (an older copy) is kept too; --adopt replaces it.
rm "$PLUGIN_T/.measure-install"
run
assert_rc 2
[[ "$(cat "$PLUGIN_T/index.js")" == "my local edit" ]] || fail "the unstamped plugin file was overwritten"
assert_out "unstamped .*index.js"
run --adopt
assert_rc 0
[[ "$(cat "$PLUGIN_T/index.js")" == "$(cat "$REPO/plugins/dsh-measure-guard/index.js")" ]] ||
  fail "--adopt did not replace the plugin file"
run --check
assert_rc 0

# 6. A plugin file removed from the ref is removed from the target.
git -C "$REPO" rm -q plugins/dsh-measure-guard/locale/zh.json
git -C "$REPO" commit -q -m "drop a locale"
run
assert_rc 0
assert_absent "$PLUGIN_T/locale/zh.json"
assert_file "$PLUGIN_T/locale/en.json"

echo "[PASS] install.sh"
