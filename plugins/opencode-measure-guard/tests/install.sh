#!/usr/bin/env bash
# The installer rows of the OpenCode plugin (Story S9). A temporary world with
# a fake home folder and a git repository that holds this plugin, its commands,
# the agents, the targets file, and a copy of the installer; the real home
# folder is never touched. Run: bash plugins/opencode-measure-guard/tests/install.sh
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
mkdir -p "$HOME/.config/opencode/agents"
printf '[user]\n\tname = Test\n\temail = test@example.com\n[commit]\n\tgpgsign = false\n[init]\n\tdefaultBranch = main\n' >"$HOME/.gitconfig"

# The repository: the plugin (from the working tree, without node_modules), the agents, the targets, the installer.
REPO="$W/repo"
mkdir -p "$REPO/bin" "$REPO/plugins" "$REPO/agents"
git -C "$REPO" init -q -b main
rsync -a --exclude node_modules --exclude bun.lock "$PLUGIN_DIR/" "$REPO/plugins/opencode-measure-guard/"
printf 'role a1\n' >"$REPO/agents/measure-a.md"
printf 'not a measure role\n' >"$REPO/agents/other.md"
grep -E '^(plugins/opencode-measure-guard|agents\t~/.config/opencode)' "$REPO_ROOT/bin/install-targets.tsv" >"$REPO/bin/install-targets.tsv" ||
  fail "bin/install-targets.tsv has no OpenCode rows"
cp "$INSTALLER" "$REPO/bin/install-measure-skill"
chmod 755 "$REPO/bin/install-measure-skill"
git -C "$REPO" add -A && git -C "$REPO" commit -q -m "initial"
RUN="$REPO/bin/install-measure-skill"

run() { set +e; OUT="$("$RUN" "$@" 2>&1)"; RC=$?; set -e; }

PLUGIN_T="$HOME/.config/opencode/plugins/opencode-measure-guard"
COMMANDS_T="$HOME/.config/opencode/commands"
AGENTS_T="$HOME/.config/opencode/agents"

# 1. The plugin folder's parent does not exist yet: the installer skips it and installs the rest.
mkdir -p "$HOME/.config/opencode/commands"
run
assert_rc 0
assert_out "skip .*plugins/opencode-measure-guard"
assert_file "$COMMANDS_T/measure-implement.md"
assert_file "$AGENTS_T/measure-a.md"
assert_absent "$AGENTS_T/other.md"

# 2. With the plugins folder present, the package lands without tests/.
mkdir -p "$HOME/.config/opencode/plugins"
run
assert_rc 0
assert_file "$PLUGIN_T/index.ts"
assert_file "$PLUGIN_T/tui.ts"
assert_file "$PLUGIN_T/src/index.ts"
assert_file "$PLUGIN_T/src/core/guards.ts"
assert_file "$PLUGIN_T/commands/measure-setup.md"
assert_file "$PLUGIN_T/package.json"
assert_absent "$PLUGIN_T/tests"
assert_absent "$PLUGIN_T/node_modules"
assert_file "$PLUGIN_T/.measure-install"

# 3. --check lists nothing after a clean install.
run --check
assert_rc 0

# 4. A local edit of an installed agent is kept, with a warning and exit 2.
printf 'my local edit\n' >"$AGENTS_T/measure-a.md"
printf 'role a2\n' >"$REPO/agents/measure-a.md"
git -C "$REPO" add -A && git -C "$REPO" commit -q -m "agent change"
run
assert_rc 2
[[ "$(cat "$AGENTS_T/measure-a.md")" == "my local edit" ]] || fail "the local agent edit was overwritten"
assert_out "measure-a.md"

# 5. --adopt replaces it.
run --adopt
assert_rc 0
[[ "$(cat "$AGENTS_T/measure-a.md")" == "role a2" ]] || fail "--adopt did not replace the agent"

# 6. A plugin file removed from main is removed from the target.
git -C "$REPO" rm -q plugins/opencode-measure-guard/commands/measure-doctor.md
git -C "$REPO" commit -q -m "drop a command"
run
assert_rc 0
assert_absent "$PLUGIN_T/commands/measure-doctor.md"
assert_absent "$COMMANDS_T/measure-doctor.md"

echo "[PASS] install.sh"
