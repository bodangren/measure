#!/usr/bin/env bash
# test-dry-run.sh — Phase 1 Task 2: targeted Red for the isolated
# temp-directory runner.
#
# Contract (test-strategy.md §1 Phase 1 row 1):
#   bin/measure-benchmark --dry-run <fixture-track> exits 0, writes
#   expected file paths.
#
# We pin the "expected file paths" to <out>/dry-run.json containing a
# `{track, models, plan_tasks, dry_run: true}` shape — a minimal
# summary of what would be run. The implementation is free to write
# additional files, but must at minimum write dry-run.json with
# `.dry_run == true`.

set -euo pipefail
source "$(dirname "$0")/lib.sh"

tmp="$(mktemp -d -t bm-dryrun.XXXXXX)"
trap "rm -rf '$tmp'" EXIT

set +e
"$BIN" run --dry-run \
  --track "$FIXTURES_DIR_DEFAULT/tracks/mini-feature" \
  --models echo \
  --out "$tmp" \
  >"$tmp/stdout.log" 2>"$tmp/stderr.log"
rc=$?
set -e

if [[ "$rc" -ne 0 ]]; then
  log_info "stdout: $(cat "$tmp/stdout.log")"
  log_info "stderr: $(cat "$tmp/stderr.log")"
  fail_test "run --dry-run exited $rc, expected 0"
fi

assert_file_exists "$tmp/dry-run.json"

if ! jq -e '.dry_run == true' "$tmp/dry-run.json" >/dev/null; then
  fail_test "dry-run.json missing or .dry_run != true"
fi

# Sanity: dry-run must not have invoked the model adapter, so no
# per-model output JSON should exist.
assert_file_absent "$tmp/echo.json"

pass_test
