#!/usr/bin/env bash
# Shared temporary world for the bin/measure-dsh contract tests.
#
# Every test gets its own mktemp workspace: a fake HOME under it, a DSH home
# with the "web" profile, a fake repository that holds a copy of the CLI, a
# stub skill installer, a real copy of the guard plugin (without tests/), and
# the two skill trees. The real home folder is never touched.
#
# Usage:
#   source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
#   world_init
#   run install --no-skills
#   assert_rc 0
set -euo pipefail

TESTS_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$TESTS_DIR/../.." && pwd)"

# --- assertions ---------------------------------------------------------------

fail() {
  echo "[FAIL] $*" >&2
  if [[ -n "${OUT:-}" ]]; then printf '%s\n' "$OUT" >&2; fi
  exit 1
}

assert_rc() { [[ "${RC:-}" == "$1" ]] || fail "expected exit $1, got ${RC:-<unset>}"; }
assert_file() { [[ -f "$1" ]] || fail "expected file: $1"; }
assert_absent() { [[ ! -e "$1" ]] || fail "expected no file: $1"; }
assert_dir() { [[ -d "$1" ]] || fail "expected directory: $1"; }
assert_out() { grep -qE -- "$1" <<<"${OUT:-}" || fail "output does not match /$1/"; }
assert_not_out() { ! grep -qE -- "$1" <<<"${OUT:-}" || fail "output unexpectedly matches /$1/"; }
assert_line() { grep -qxE -- "$1" <<<"${OUT:-}" || fail "no output line matches /$1/"; }
assert_eq() { [[ "$1" == "$2" ]] || fail "expected '$2', got '$1'"; }

# --- the temporary world ------------------------------------------------------

world_cleanup() {
  [[ -n "${W:-}" && -d "${W:-}" ]] || return 0
  case "$W" in
    "${TMPDIR:-/tmp}"/* | /tmp/* | /var/folders/*) ;;
    *)
      echo "refusing to remove workspace outside the temporary folders: $W" >&2
      return 0
      ;;
  esac
  chmod -R u+rwX -- "$W" 2>/dev/null || true
  rm -rf -- "$W"
}

# Writes the stub installer. It copies the fake repository skills into the two
# skill roots the real installer targets, records the call, and returns
# $STUB_INSTALLER_EXIT so the CLI's exit-code mapping can be tested.
write_installer_stub() {
  cat >"$1" <<'STUB'
#!/usr/bin/env bash
# Stub of bin/install-measure-skill for the measure-dsh tests.
set -euo pipefail
repo="$(cd -- "$(dirname -- "$0")/.." && pwd)"
ref="main"
while (($#)); do
  case "$1" in
    --ref)
      [[ $# -ge 2 ]] || exit 3
      ref="$2"
      shift 2
      ;;
    *) shift ;;
  esac
done
log="${STUB_INSTALLER_LOG:-$HOME/.stub-installer.log}"
mkdir -p -- "$(dirname -- "$log")"
printf 'installer ref=%s home=%s\n' "$ref" "$HOME" >>"$log"
for skill in measure measure-orchestrator; do
  src="$repo/skills/$skill"
  [[ -d "$src" ]] || continue
  for base in "$HOME/.agents/skills" "$HOME/.claude/skills"; do
    mkdir -p -- "$base/$skill"
    cp -R -- "$src/." "$base/$skill/"
  done
done
exit "${STUB_INSTALLER_EXIT:-0}"
STUB
}

# Builds the fake repository: bin/measure-dsh, the installer stub, the plugin
# package (without tests/), and the skills trees.
build_fake_repo() {
  local skill
  mkdir -p -- "$W/repo/bin" "$W/repo/plugins" "$W/repo/skills"
  if [[ -f "$REPO_ROOT/bin/measure-dsh" ]]; then
    cp -- "$REPO_ROOT/bin/measure-dsh" "$W/repo/bin/measure-dsh"
    chmod 755 -- "$W/repo/bin/measure-dsh"
  fi
  cp -R -- "$REPO_ROOT/plugins/dsh-measure-guard" "$W/repo/plugins/dsh-measure-guard"
  rm -rf -- "$W/repo/plugins/dsh-measure-guard/tests"
  for skill in measure measure-orchestrator; do
    cp -R -- "$REPO_ROOT/skills/$skill" "$W/repo/skills/$skill"
  done
  write_installer_stub "$W/repo/bin/install-measure-skill"
  chmod 755 -- "$W/repo/bin/install-measure-skill"
}

# Seed both skill roots with complete copies (the installer stub would write
# the same files; this makes a world usable before the first install).
seed_skill_roots() {
  local skill target
  for skill in measure measure-orchestrator; do
    [[ -d "$REPO_ROOT/skills/$skill" ]] || fail "missing repository skill: skills/$skill"
    for target in "$HOME/.agents/skills/$skill" "$HOME/.claude/skills/$skill"; do
      mkdir -p -- "$target"
      cp -R -- "$REPO_ROOT/skills/$skill/." "$target/"
    done
  done
}

world_init() {
  W="$(mktemp -d -t measure-dsh.XXXXXX)"
  trap 'world_cleanup' EXIT
  export W
  export HOME="$W/home"
  export DSH_HOME="$W/dsh"
  export DSH_AGENTS_HOME="$HOME/.agents"
  export STUB_INSTALLER_LOG="$W/installer.log"
  export XDG_CONFIG_HOME="$HOME/.config"
  export XDG_STATE_HOME="$HOME/.local/state"
  export XDG_DATA_HOME="$HOME/.local/share"
  export XDG_CACHE_HOME="$HOME/.cache"
  export GIT_CONFIG_NOSYSTEM=1
  unset DSH_SESSION_ID DSH_WEB_URL STUB_INSTALLER_EXIT 2>/dev/null || true
  case "$HOME" in
    "$W"/*) ;;
    *)
      echo "unsafe HOME outside the temporary world: $HOME" >&2
      exit 1
      ;;
  esac
  mkdir -p -- "$HOME" "$DSH_HOME/profiles/web" "$W/project"
  seed_skill_roots
  build_fake_repo
  RUN="$W/repo/bin/measure-dsh"
  PROFILE="$DSH_HOME/profiles/web"
  PLUGIN_DST="$PROFILE/plugins/dsh-measure-guard"
  PATCH="$PROFILE/cordis.patch.yml"
  PLUGIN_SRC="$W/repo/plugins/dsh-measure-guard"
  SKILL_SRC="$W/repo/skills"
  REPO_BIN="$W/repo/bin"
  export RUN PROFILE PLUGIN_DST PATCH PLUGIN_SRC SKILL_SRC REPO_BIN
}

# --- helpers ------------------------------------------------------------------

# Runs the CLI under test; OUT and RC are the captured result. Never aborts the
# test on a non-zero exit, so an expected failure can be asserted.
run() {
  set +e
  OUT="$("$RUN" "$@" 2>&1)"
  RC=$?
  set -e
}

# Runs the CLI with a working directory (for --project or $PWD resolution).
run_in() {
  local dir="$1"
  shift
  set +e
  OUT="$(cd -- "$dir" && "$RUN" "$@" 2>&1)"
  RC=$?
  set -e
}

# A path-independent fingerprint of every file under the profile: relative
# path, size, and mtime in seconds (a write changes at least one of them).
profile_fingerprint() {
  (cd -- "$PROFILE" && find . -type f -printf '%p\t%s\t%T@\n' 2>/dev/null | sort)
}
