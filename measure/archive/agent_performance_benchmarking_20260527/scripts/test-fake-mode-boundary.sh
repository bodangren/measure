#!/usr/bin/env bash
# test-fake-mode-boundary.sh — Phase 1 Task 3 boundary: prove the fake
# mode intercepts the exact command path.
#
# Contract (test-strategy.md §7 Fake-harness boundary):
#   the harness must `exit 3` if --models is empty, so a missing flag
#   cannot silently fall through into a full-suite run.
#
# This is the contract the user instructions warn about: a "shell
# runner or fake harness" must NOT accidentally run the real full
# suite. We pin the exact exit code (3) and assert that no per-model
# output is produced when --models is omitted.

set -euo pipefail
source "$(dirname "$0")/lib.sh"

tmp="$(mktemp -d -t bm-fake.XXXXXX)"
trap "rm -rf '$tmp'" EXIT

set +e
"$BIN" run \
  --track "$FIXTURES_DIR_DEFAULT/tracks/mini-feature" \
  --out "$tmp" \
  >"$tmp/stdout.log" 2>"$tmp/stderr.log"
rc=$?
set -e

if [[ "$rc" -ne 3 ]]; then
  log_info "stdout: $(cat "$tmp/stdout.log")"
  log_info "stderr: $(cat "$tmp/stderr.log")"
  fail_test "run with no --models exited $rc, expected 3 (fake-mode boundary)"
fi

# And it must not have started any real run.
assert_file_absent "$tmp/echo.json"
assert_file_absent "$tmp/dry-run.json"

# Stderr must mention --models so a human can debug the rejection.
if ! grep -qi -- "--models" "$tmp/stderr.log"; then
  fail_test "rejection stderr did not mention --models"
fi

pass_test
