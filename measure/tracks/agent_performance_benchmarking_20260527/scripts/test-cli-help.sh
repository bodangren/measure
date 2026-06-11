#!/usr/bin/env bash
# test-cli-help.sh — Phase 1 Task 1: targeted Red for `measure benchmark` CLI.
#
# Contract (test-strategy.md §7 P1 Red):
#   bin/measure-benchmark --help | diff - fixtures/expected/help.txt
#   must exit 0; the diff must be empty.
#
# At HEAD, BIN does not exist → the test fails with "command not found".
# That is a real Red: the implementation is missing, not the durable
# record (the golden help.txt is checked in alongside this test).
#
# This test does NOT invoke the full test suite. It is one of N
# independent, single-file Red tests run by run-tests.sh.

set -euo pipefail
source "$(dirname "$0")/lib.sh"

golden="$FIXTURES_DIR_DEFAULT/expected/help.txt"
if [[ ! -f "$golden" ]]; then
  fail_test "missing golden file: $golden"
fi

# Capture --help, but tolerate a missing binary (that's the Red).
out="$("$BIN" --help 2>&1)" || {
  log_info "captured: $out"
  fail_test "BIN --help failed (likely missing: $BIN) — this is the §7 P1 Red"
}

# Diff against the golden. `diff -` reads from stdin.
if ! diff -q <(printf '%s\n' "$out") "$golden" >/dev/null 2>&1; then
  log_info "diff (expected vs actual):"
  diff <(printf '%s\n' "$out") "$golden" >&2 || true
  fail_test "--help output did not match fixtures/expected/help.txt"
fi

pass_test
