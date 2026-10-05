#!/usr/bin/env bash
# run-tests.sh — runs the installer tests in this folder (contract.md).
#
# Usage:
#   ./run-tests.sh                  # all test-*.sh files
#   ./run-tests.sh test-check.sh    # one test
#
# Each test makes its own temporary world (lib.sh), so the tests never touch
# the real home folder or the real crontab. Exit code: 0 if all tests pass.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pattern="${1:-test-*.sh}"

shopt -s nullglob
tests=("$SCRIPT_DIR"/$pattern)
shopt -u nullglob
if [[ ${#tests[@]} -eq 0 ]]; then
  echo "No tests match pattern: $pattern" >&2
  exit 2
fi

passed=0
failed=0
for t in "${tests[@]}"; do
  if bash "$t"; then passed=$((passed + 1)); else failed=$((failed + 1)); fi
done
echo "Summary: $passed passed, $failed failed ($((passed + failed)) total)" >&2
[[ $failed -eq 0 ]]
