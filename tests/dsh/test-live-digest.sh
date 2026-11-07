#!/usr/bin/env bash
# Story S1: --check --live compares the loaded plugin digest with the source.
# A matching digest passes; a mismatched or absent digest cannot pass.
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
world_init

run install --ref t
assert_rc 0

# The digest helpers are part of the CLI under test; eval them so the test
# computes the expected value with the same code path.
eval "$(grep -m1 '^sha_of()' "$RUN")"
eval "$(sed -n '/^source_digest()/,/^}/p' "$RUN")"
INSTALLED_DIGEST="sha256:$(source_digest "$PLUGIN_DST")"
[[ "$INSTALLED_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || fail "the installed digest has the wrong shape: $INSTALLED_DIGEST"

# The two implementations (bash in the CLI, Node in the plugin) must agree on
# the same file list and framing; this is the property every live check rests on.
NODE_DIGEST="$(PLUGIN_DIR="$PLUGIN_DST" node --experimental-strip-types --input-type=module -e '
const { computeDigest } = await import("file://" + process.env.PLUGIN_DIR + "/src/digest.js")
process.stdout.write(computeDigest(process.env.PLUGIN_DIR))
')"
assert_eq "$NODE_DIGEST" "$INSTALLED_DIGEST"

cat >"$W/server.js" <<'SERVER'
const http = require('node:http')
const body = JSON.stringify({
  band: 'Measure · test · Phase 1/1 · Task 1/1 [~] Task: Test',
  status: 'Tracks: 1 in progress',
  guardsOff: null,
  problems: [],
  updatedAt: '2026-11-07T00:00:00.000Z',
  goal: null,
  setup: { choice: null, text: null },
})
const server = http.createServer((request, response) => {
  const headers = { 'content-type': 'application/json', 'x-measure-guard-module': `file://${process.env.PLUGIN_INDEX}` }
  if (process.env.DIGEST) headers['x-measure-guard-digest'] = process.env.DIGEST
  response.writeHead(200, headers)
  response.end(body)
})
server.listen(Number(process.env.PORT), '127.0.0.1', () => process.stdout.write('ready\n'))
SERVER

SERVER_PID=""
cleanup() { [[ -n "$SERVER_PID" ]] && kill "$SERVER_PID" 2>/dev/null || true; }
trap 'cleanup; world_cleanup' EXIT

DIGEST_MODE=""
start_server() { # digest ("" = absent header)
  local digest="$1" port tries
  port=$(( (RANDOM % 20000) + 20000 ))
  DIGEST="$digest" PORT="$port" PLUGIN_INDEX="$PLUGIN_DST/index.js" node "$W/server.js" >/dev/null &
  SERVER_PID=$!
  export DSH_WEB_URL="http://127.0.0.1:$port"
  for tries in $(seq 1 100); do
    if curl -s -o /dev/null "${DSH_WEB_URL}/measure-guard/state?sessionId=s1"; then return 0; fi
    sleep 0.05
  done
  fail "the digest server did not start"
}

stop_server() {
  if [[ -n "$SERVER_PID" ]]; then kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; fi
  SERVER_PID=""
}

live() { run --check --live --session s1 --dsh-home "$DSH_HOME" --profile web --project "$W/project"; }

# 1. A matching digest passes and names the digest prefix.
start_server "$INSTALLED_DIGEST"
live
assert_rc 0
assert_out '^PASS live:.*digest sha256:'
assert_not_out '^FAIL '
stop_server

# 2. A stale loaded digest fails and names the remediation.
start_server "sha256:0000000000000000000000000000000000000000000000000000000000000000"
live
assert_rc 1
assert_out '^FAIL live: the running host loaded stale plugin code'
assert_out "installed $INSTALLED_DIGEST"
assert_out 'bin/measure-dsh reload'
stop_server

# 3. An absent digest header warns (a pre-digest instance cannot be proven).
start_server ""
live
assert_rc 0
assert_out '^WARN live:.*predates the digest header'
assert_out 'bin/measure-dsh reload'
stop_server
