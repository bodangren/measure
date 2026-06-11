#!/usr/bin/env bash
# echo-model.sh — deterministic plumbing-only fake model adapter.
#
# This is intentionally NOT a substitute for the live-proof gate in
# test-strategy.md §7. It exists so the Phase 1 harness can exercise its
# argument wiring, temp-dir creation, and tool-call capture without
# touching a real model API. Selection is by explicit `--models echo`
# only; the harness must `exit 3` if `--models` is empty.
#
# Usage: echo-model.sh <track-dir> <out-dir>
#
# Contract (asserted by Phase 2/3 fixture tests, not Phase 1):
#   - Exits 0.
#   - Writes <out-dir>/<model>.json with a deterministic schema.
#   - Emits 3 fixed tool calls to stdout (one per line) so the harness
#     can count them.

set -euo pipefail

track_dir="${1:-}"
out_dir="${2:-}"

if [[ -z "$track_dir" || -z "$out_dir" ]]; then
  echo "echo-model: usage: echo-model.sh <track-dir> <out-dir>" >&2
  exit 2
fi

mkdir -p "$out_dir"

# Deterministic tool-call trace. Pinned, not generated.
printf '%s\n' '{"tool":"read_file","path":"plan.md"}'
printf '%s\n' '{"tool":"write_file","path":"plan.md","diff_size":17}'
printf '%s\n' '{"tool":"run_command","cmd":"git commit -m feat: mini"}'

# Write the run.json contract that Phase 2 scorer will consume.
# Pinned numeric values so the test-strategy §7 P1 Green jq assertion
# (`.wall_ms>0 and (.tool_calls|type=="number")`) can pass without
# the harness having to time anything.
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cat > "$out_dir/echo.json" <<JSON
{
  "model": "echo",
  "track": "$track_dir",
  "started_at": "$ts",
  "wall_ms": 42,
  "tool_calls": 3,
  "commits": ["deadbeef00000000000000000000000000000000"],
  "final_sha": "deadbeef00000000000000000000000000000000",
  "fake": true
}
JSON

exit 0
