#!/usr/bin/env bash
# Test-only builder for a disposable Measure project (DSH agent-team rehearsal).
#
# Usage:
#   make-project.sh                 print the canonical root of a fresh fixture
#   make-project.sh --cleanup DIR   remove a fixture under the temp folder
#
# The fixture is a git repository with the minimal Measure files: one active
# track, one phase, one [~] task, and a metadata.json. Nothing outside the temp
# folder is touched.
set -euo pipefail

fail() {
  printf 'make-project.sh: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  local dir="$1"
  [[ -n "$dir" && -e "$dir" ]] || return 0
  local real
  real="$(realpath -m -- "$dir")"
  case "$real" in
    "${TMPDIR:-/tmp}"/* | /tmp/* | /var/folders/*) ;;
    *)
      fail "refusing to remove a directory outside the temp folder: $real"
      ;;
  esac
  rm -rf -- "$real"
}

if [[ "${1:-}" == "--cleanup" ]]; then
  [[ $# -eq 2 && -n "${2:-}" ]] || fail "usage: make-project.sh --cleanup <dir>"
  cleanup "$2"
  exit 0
fi
[[ $# -eq 0 ]] || fail "usage: make-project.sh | make-project.sh --cleanup <dir>"

ROOT="$(mktemp -d "${TMPDIR:-/tmp}/dsh-measure-rehearsal.XXXXXX")"
TRACK="rehearsal_20260101"

mkdir -p -- "$ROOT/measure/tracks/$TRACK"

cat >"$ROOT/measure/index.md" <<'EOF'
# Measure Index

## Tracks

- **Tracks Registry**: [./tracks.md](./tracks.md)
- **Tracks Directory**: [./tracks/](./tracks/)
EOF

cat >"$ROOT/measure/tracks.md" <<'EOF'
# Project Tracks

- [~] **Track: Rehearsal track**
  *Link: [./tracks/rehearsal_20260101/](./tracks/rehearsal_20260101/)*
EOF

cat >"$ROOT/measure/tracks/rehearsal_20260101/plan.md" <<'EOF'
# Implementation Plan: Rehearsal track

## Phase 1: Rehearsal

- [~] Task: Add the greeting function
EOF

cat >"$ROOT/measure/tracks/rehearsal_20260101/metadata.json" <<'EOF'
{
  "track_id": "rehearsal_20260101",
  "type": "feature",
  "status": "new",
  "created_at": "2026-11-07T00:00:00Z",
  "updated_at": "2026-11-07T00:00:00Z",
  "description": "Disposable rehearsal fixture",
  "estimated_tasks": 1,
  "actual_tasks": 0,
  "deviation_notes": ""
}
EOF

git -C "$ROOT" init -q
git -C "$ROOT" config user.email "rehearsal@example.com"
git -C "$ROOT" config user.name "Rehearsal Fixture"
git -C "$ROOT" add .
git -C "$ROOT" commit -qm "fixture: disposable Measure project"

realpath -- "$ROOT"
