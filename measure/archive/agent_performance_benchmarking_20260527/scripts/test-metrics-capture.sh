#!/usr/bin/env bash
# test-metrics-capture.sh — Phase 1 Task 3: targeted Red for metrics
# capture.
#
# Contract (test-strategy.md §7 P1 Green, executed as Red):
#   bin/measure-benchmark run --track <fixture>/tracks/mini-feature \
#       --models echo --out <tmp> \
#     && jq -e '.wall_ms>0 and (.tool_calls|type=="number")' <tmp>/echo.json
#
# At HEAD, BIN does not exist → the test fails with "command not
# found". The jq assertion is the live-behavior proof: the harness
# must write a <model>.json whose wall_ms is a positive number and
# whose tool_calls is a JSON number (not a string).
#
# The fake adapter (fixtures/adapters/echo-model.sh) is deterministic
# and writes the metric fields; the harness's job is to wire it up
# inside a temp directory, time the run, and copy/merge the JSON.

set -euo pipefail
source "$(dirname "$0")/lib.sh"

tmp="$(mktemp -d -t bm-metrics.XXXXXX)"
trap "rm -rf '$tmp'" EXIT

set +e
"$BIN" run \
  --track "$FIXTURES_DIR_DEFAULT/tracks/mini-feature" \
  --models echo \
  --out "$tmp" \
  >"$tmp/stdout.log" 2>"$tmp/stderr.log"
rc=$?
set -e

if [[ "$rc" -ne 0 ]]; then
  log_info "stdout: $(cat "$tmp/stdout.log")"
  log_info "stderr: $(cat "$tmp/stderr.log")"
  fail_test "run exited $rc, expected 0"
fi

assert_file_exists "$tmp/echo.json"

# The pinned live-behavior assertion from test-strategy.md §7.
if ! jq -e '.wall_ms > 0 and (.tool_calls | type == "number")' "$tmp/echo.json" >/dev/null; then
  log_info "echo.json contents:"
  cat "$tmp/echo.json" >&2 || true
  fail_test "metrics missing or wrong type (need .wall_ms>0 and .tool_calls:number)"
fi

pass_test
