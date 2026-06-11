#!/usr/bin/env bash
# run-tests.sh — bounded test runner for the Phase 1 verification suite.
#
# Usage:
#   ./run-tests.sh                 # run all test-*.sh in this directory
#   ./run-tests.sh test-cli-help.sh  # run a single test (bounded)
#
# The runner never auto-discovers anything outside this directory and
# never invokes a watch loop. It is a simple ordered list-and-execute
# driver, so an intentionally-Red file cannot be swept in by accident.
#
# Exit code: 0 if all matched tests pass, 1 otherwise.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default pattern: only the test files. The runner is itself excluded
# implicitly (it doesn't match test-*.sh) and lib.sh is sourced by
# each test, never executed directly.
pattern="${1:-test-*.sh}"

shopt -s nullglob
tests=("$SCRIPT_DIR"/$pattern)
shopt -u nullglob

if [[ ${#tests[@]} -eq 0 ]]; then
  echo "No tests match pattern: $pattern" >&2
  exit 2
fi

echo "Running ${#tests[@]} test(s) (pattern: $pattern)..." >&2

passed=0
failed=0
failures=()

for t in "${tests[@]}"; do
  name="$(basename "$t")"
  if bash "$t" >/dev/null 2>&1; then
    passed=$((passed + 1))
  else
    failed=$((failed + 1))
    failures+=("$name")
  fi
done

total=$((passed + failed))
echo "Summary: $passed passed, $failed failed ($total total)" >&2

if [[ $failed -gt 0 ]]; then
  printf '  Failed: %s\n' "${failures[@]}" >&2
  exit 1
fi

exit 0
