# lib.sh — shared setup and assertions for the installer tests (contract.md).
#
# Source this file from each test-*.sh, then call `make_world`. A world is a
# temporary folder with:
#   $HOME      a fake home folder (the installer targets go here)
#   $REPO      a git repository with a `main` branch, the bundles, the targets
#              file, and a copy of the installer under test in bin/
#   $RUN       the installer in $REPO/bin
#   $CRONTAB   the file that the fake `crontab` reads and writes
#
# Safety: the real home folder and the real crontab are never used. `make_world`
# sets HOME and every XDG_* folder inside the world, puts a fake `crontab` first
# on PATH, and refuses to continue if HOME is outside the world.

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TRACK_DIR="$(cd "$LIB_DIR/.." && pwd)"
REPO_ROOT="$(cd "$TRACK_DIR/../../.." && pwd)"
INSTALLER="${INSTALLER:-$REPO_ROOT/bin/install-measure-skill}"

test_name() { basename "${BASH_SOURCE[-1]:-$0}" .sh; }
log_info() { echo "[info]  $*" >&2; }
pass_test() { echo "[PASS] $(test_name)" >&2; exit 0; }
fail_test() {
  echo "[FAIL] $(test_name): ${1:-unspecified}" >&2
  if [[ -n "${OUT:-}" ]]; then log_info "last installer output:"; log_info "$OUT"; fi
  exit 1
}

make_world() {
  W="$(mktemp -d -t measure-install-test.XXXXXX)"
  trap 'rm -rf "$W"' EXIT
  export HOME="$W/home"
  export XDG_CONFIG_HOME="$HOME/.config" XDG_STATE_HOME="$HOME/.local/state"
  export XDG_DATA_HOME="$HOME/.local/share" XDG_CACHE_HOME="$HOME/.cache"
  export GIT_CONFIG_NOSYSTEM=1
  case "$HOME" in "$W"/*) ;; *) echo "unsafe HOME: $HOME" >&2; exit 1 ;; esac
  mkdir -p "$HOME/.claude/skills" "$HOME/.agents/skills" "$HOME/.agents/agents"
  printf '[user]\n\tname = Test\n\temail = test@example.com\n[commit]\n\tgpgsign = false\n[init]\n\tdefaultBranch = main\n' >"$HOME/.gitconfig"

  # Fake crontab: `crontab -l` prints $CRONTAB (exit 1 if none); `crontab -`
  # or `crontab <file>` replaces it.
  CRONTAB="$W/crontab.txt"
  mkdir -p "$W/fakebin"
  cat >"$W/fakebin/crontab" <<EOF
#!/usr/bin/env bash
case "\${1:-}" in
  -l) [[ -f "$CRONTAB" ]] || { echo "no crontab for test" >&2; exit 1; }; cat "$CRONTAB" ;;
  -) cat >"$CRONTAB" ;;
  -r) rm -f "$CRONTAB" ;;
  *) cat "\$1" >"$CRONTAB" ;;
esac
EOF
  chmod +x "$W/fakebin/crontab"
  export PATH="$W/fakebin:$PATH"
  export CRONTAB

  REPO="$W/repo"
  mkdir -p "$REPO/bin" "$REPO/skills/measure/references" "$REPO/skills/measure/scripts" "$REPO/agents"
  git -C "$REPO" init -q -b main
  printf 'skill v1\n' >"$REPO/skills/measure/SKILL.md"
  printf 'review r1\n' >"$REPO/skills/measure/references/review.md"
  printf '#!/usr/bin/env bash\necho tool\n' >"$REPO/skills/measure/scripts/tool.sh"
  chmod 755 "$REPO/skills/measure/scripts/tool.sh"
  printf 'role a1\n' >"$REPO/agents/measure-a.md"
  printf 'not a measure role\n' >"$REPO/agents/other.md"
  printf '%s\n' \
    '# bundle	target	files' \
    'skills/measure	~/.claude/skills/measure	*' \
    'skills/measure	~/.agents/skills/measure	*' \
    'skills/measure	~/.codex/skills/measure	*' \
    'agents	~/.agents/agents	measure-*.md' >"$REPO/bin/install-targets.tsv"
  cp "$INSTALLER" "$REPO/bin/install-measure-skill"
  chmod 755 "$REPO/bin/install-measure-skill"
  commit_all "initial"
  RUN="$REPO/bin/install-measure-skill"
  LOG="$HOME/.local/state/measure/install.log"
  CLAUDE_T="$HOME/.claude/skills/measure"
  AGENTS_T="$HOME/.agents/skills/measure"
  ROLES_T="$HOME/.agents/agents"
}

commit_all() { git -C "$REPO" add -A && git -C "$REPO" commit -q -m "$1"; }

# Runs the installer. Sets RC (exit code) and OUT (stdout and stderr).
run_installer() {
  set +e
  OUT="$("$RUN" "$@" 2>&1)"
  RC=$?
  set -e
}

sha() { sha256sum "$1" | cut -d' ' -f1; }
inode() { stat -c %i "$1"; }

# A hash of every file (path, mode, content) under the fake home folder.
home_state() { (cd "$HOME" && find . -type f -print0 | sort -z | xargs -0 -r stat -c '%n %a' && find . -type f -print0 | sort -z | xargs -0 -r sha256sum) | sha256sum | cut -d' ' -f1; }

assert_eq() { [[ "$1" == "$2" ]] || fail_test "${3:-value}: expected [$2], got [$1]"; }
assert_rc() { [[ "$RC" == "$1" ]] || fail_test "expected exit $1, got $RC"; }
assert_file() { [[ -f "$1" ]] || fail_test "expected file: $1"; }
assert_absent() { [[ ! -e "$1" ]] || fail_test "expected no file: $1"; }
assert_content() { assert_file "$1"; [[ "$(cat "$1")" == "$2" ]] || fail_test "content of $1: expected [$2], got [$(cat "$1")]"; }
assert_out() { grep -qE -- "$1" <<<"$OUT" || fail_test "output does not match /$1/"; }
assert_log() { [[ -f "$LOG" ]] && grep -qE -- "$1" "$LOG" || fail_test "log does not match /$1/"; }
