#!/usr/bin/env bash
# test-fixtures-dir-flag.sh — Phase 1 Task 1 boundary: prove the
# `--fixtures-dir` flag is exposed.
#
# Contract (test-strategy.md §4):
#   All CLI entrypoints accept --fixtures-dir so live and contract
#   tests share the same code path.
#
# We pin the substring "--fixtures-dir" in --help output, which is the
# cheapest live-behavior proof that the harness documented the flag
# (and, by extension, accepts it on the command line).

set -euo pipefail
source "$(dirname "$0")/lib.sh"

set +e
out="$("$BIN" --help 2>&1)"
rc=$?
set -e

if [[ "$rc" -ne 0 ]]; then
  log_info "captured: $out"
  fail_test "--help exited $rc, expected 0"
fi

if ! grep -q -- "--fixtures-dir" <<<"$out"; then
  log_info "--help output was:"
  echo "$out" >&2
  fail_test "--help does not document --fixtures-dir"
fi

pass_test
