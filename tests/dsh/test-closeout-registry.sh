#!/usr/bin/env bash
# Closeout checks the archived track's registry entry description
# (registry consolidations track): a metadata edit after archiving must not
# leave the measure/tracks.md description behind.
set -uo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

CHECKER="$REPO_ROOT/skills/measure-orchestrator/scripts/measure_interphase_checks.py"
[[ -f "$CHECKER" ]] || fail "missing checker: $CHECKER"
TRACK="demo_track"
DESC="Demo track does the demo work"

TMP="$(mktemp -d "${TMPDIR:-/tmp}/closeout-registry.XXXXXX")" || fail "mktemp failed"
trap 'rm -rf -- "$TMP"' EXIT

fixture() {
  rm -rf -- "$TMP/repo"
  mkdir -p -- "$TMP/repo/measure/archive/$TRACK"
  cat >"$TMP/repo/measure/archive/$TRACK/plan.md" <<'PLAN'
# Implementation Plan: Demo

## Phase 1: Do it

- [x] Task 1.1: do the work `abc1234`
PLAN
  cat >"$TMP/repo/measure/archive/$TRACK/metadata.json" <<JSON
{"track_id": "$TRACK", "status": "done", "completed": "2026-11-09", "description": "$DESC"}
JSON
  printf '# Project Tracks\n\n## Active Tracks\n\n- (none)\n\n## Archived Tracks\n\n- [x] **Track: Demo**\n  *Link: [./archive/%s/](./archive/%s/)*\n  *%s*\n' "$TRACK" "$TRACK" "$DESC" >"$TMP/repo/measure/tracks.md"
}

run_closeout() {
  set +e
  OUT="$(python3 "$CHECKER" closeout --repo "$TMP/repo" --track "$TRACK" 2>&1)"
  RC=$?
  set -e
}

# matching records: none of the three registry messages, the manifest FAIL is
# still reported (closeout always reports it when the manifest is absent)
fixture
run_closeout
assert_rc 1
assert_out 'missing closeout manifest'
assert_not_out 'missing registry entry'
assert_not_out 'has no description'
assert_not_out 'description differs from metadata'
echo "[PASS] matching records report no registry problem"

# metadata description changed after archiving
fixture
python3 - "$TMP/repo/measure/archive/$TRACK/metadata.json" <<'PY'
import json, sys
p = sys.argv[1]
m = json.load(open(p))
m['description'] = 'A different description'
json.dump(m, open(p, 'w'))
PY
run_closeout
assert_rc 1
assert_out "registry description differs from metadata for $TRACK"
echo "[PASS] a drifted metadata description is rejected"

# the registry entry lost its description line
fixture
python3 - "$TMP/repo/measure/tracks.md" <<'PY'
import sys
p = sys.argv[1]
lines = open(p).read().split('\n')
out = [ln for i, ln in enumerate(lines) if not (ln.startswith('  *') and ln.endswith('*') and '*Link:' not in ln)]
open(p, 'w').write('\n'.join(out))
PY
run_closeout
assert_rc 1
assert_out "registry entry has no description for $TRACK"
echo "[PASS] a registry entry without a description is rejected"

# the registry entry is gone
fixture
printf '# Project Tracks\n\n## Archived Tracks\n\n' >"$TMP/repo/measure/tracks.md"
run_closeout
assert_rc 1
assert_out "missing registry entry for $TRACK"
echo "[PASS] a missing registry entry is rejected"
