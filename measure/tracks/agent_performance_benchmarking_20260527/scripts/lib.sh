# lib.sh — shared assertion helpers for the Phase 1 verification suite.
#
# Source this file from any test-*.sh. Each test must end with a call to
# `pass_test` or `fail_test` (or just `exit 0` / `exit 1`); the runner
# (`run-tests.sh`) treats anything that exits non-zero as a failure.
#
# The runner script itself never re-runs the assertions: each test is
# authoritative. The runner only counts pass/fail.

# Resolve the track root directory (parent of scripts/).
LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TRACK_DIR="$(cd "$LIB_DIR/.." && pwd)"
# REPO_ROOT is the project root (the dir that contains .git/, AGENTS.md,
# measure/, etc.). The track lives at <repo>/measure/tracks/<track_id>/,
# so we need three .. segments to climb out of: track -> tracks -> measure
# -> repo.
REPO_ROOT="$(cd "$TRACK_DIR/../../.." && pwd)"

# Default fixture location; can be overridden per-test.
FIXTURES_DIR_DEFAULT="${FIXTURES_DIR:-$TRACK_DIR/fixtures}"

# Path to the binary under test. Lives at the repo root per
# test-strategy.md §7.
BIN="${BIN:-$REPO_ROOT/bin/measure-benchmark}"

# Colors (only when stderr is a TTY — keeps test logs clean when piped).
if [[ -t 2 ]]; then
  C_RED=$'\033[31m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'; C_RESET=$'\033[0m'
else
  C_RED=""; C_GREEN=""; C_YELLOW=""; C_RESET=""
fi

# Log helpers — all go to stderr so they don't pollute test output that
# the runner or a human may capture via $(...).
log_info()  { echo "${C_YELLOW}[info]${C_RESET}  $*" >&2; }
log_warn()  { echo "${C_YELLOW}[warn]${C_RESET}  $*" >&2; }
log_error() { echo "${C_RED}[error]${C_RESET} $*" >&2; }

# Current test name (the script that sourced lib.sh, minus the .sh).
test_name() {
  local src="${BASH_SOURCE[1]:-$0}"
  basename "$src" .sh
}

# Test outcome reporters.
pass_test() {
  echo "${C_GREEN}[PASS]${C_RESET} $(test_name)" >&2
  exit 0
}
fail_test() {
  local reason="${1:-unspecified}"
  echo "${C_RED}[FAIL]${C_RESET} $(test_name): $reason" >&2
  exit 1
}

# Assertion: two strings are equal.
assert_eq() {
  local actual="$1" expected="$2" label="${3:-value}"
  if [[ "$actual" != "$expected" ]]; then
    fail_test "$label: expected [$expected], got [$actual]"
  fi
}

# Assertion: a command exits with a specific code.
# Captures stdout/stderr; on failure the captured output is included.
assert_exit() {
  local expected="$1"; shift
  local out actual
  out="$("$@" 2>&1)" && actual=0 || actual=$?
  if [[ "$actual" != "$expected" ]]; then
    log_info "captured output:"
    log_info "$out"
    fail_test "expected exit $expected, got $actual from: $*"
  fi
}

# Assertion: a command's stdout contains a regex.
assert_grep() {
  local pattern="$1"; shift
  local out
  out="$("$@" 2>&1)" || fail_test "command failed: $*"
  if ! grep -qE "$pattern" <<<"$out"; then
    log_info "output was: $out"
    fail_test "output did not match /$pattern/"
  fi
}

# Assertion: a file exists.
assert_file_exists() {
  local path="$1"
  if [[ ! -e "$path" ]]; then
    fail_test "expected file to exist: $path"
  fi
}

# Assertion: a file does not exist.
assert_file_absent() {
  local path="$1"
  if [[ -e "$path" ]]; then
    fail_test "expected file NOT to exist: $path"
  fi
}

# Assertion: a path is git-ignored (relative to repo root).
assert_git_ignored() {
  local relpath="$1"
  if ! git -C "$REPO_ROOT" check-ignore -q "$relpath"; then
    fail_test "expected path to be git-ignored: $relpath"
  fi
}

# Assertion: a path is NOT git-ignored (relative to repo root).
assert_not_git_ignored() {
  local relpath="$1"
  if git -C "$REPO_ROOT" check-ignore -q "$relpath"; then
    fail_test "expected path NOT to be git-ignored: $relpath"
  fi
}
