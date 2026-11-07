#!/usr/bin/env bash
# The tracks registry structure (registry consolidation track): one layout —
# Active, Cancelled, Archived — with one three-line entry per archive directory
# (title, its own link, one full description) and at most one active track.
#
# Usage: test-registry.sh [registry-path] [archive-dir]
set -uo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

REGISTRY="${1:-$REPO_ROOT/measure/tracks.md}"
ARCHIVE="${2:-$REPO_ROOT/measure/archive}"
[[ -f "$REGISTRY" ]] || fail "missing repository: $REGISTRY"
[[ -d "$ARCHIVE" ]] || fail "missing archive: $ARCHIVE"

# Returns 0 when the registry is structurally sound; prints every violation to
# stderr and returns the number of violations.
check_registry() {
  local file="$1" archive="$2" problems=0 i dir count line
  local -a lines=()
  mapfile -t lines <"$file"
  local total=${#lines[@]}

  for ((i = 0; i < total; i++)); do
    line="${lines[i]}"
    # 1. A bold title has its own link line directly after it, and the link is
    #    followed by exactly one description line.
    if [[ "$line" == '- [x] **Track:'* ]]; then
      if [[ "${lines[i + 1]:-}" != *'*Link:'* ]]; then
        printf 'title without its own link at line %s\n' "$((i + 1))" >&2
        problems=$((problems + 1))
      elif [[ "${lines[i + 2]:-}" != '  *'* || "${lines[i + 2]:-}" == *'*Link:'* ]]; then
        printf 'missing description after line %s\n' "$((i + 1))" >&2
        problems=$((problems + 1))
      elif [[ "${lines[i + 3]:-}" == '  *'* && "${lines[i + 3]:-}" != *'*Link:'* ]]; then
        printf 'more than one description after line %s\n' "$((i + 1))" >&2
        problems=$((problems + 1))
      fi
    fi
    # 2. No orphan description line: a description must follow a link line.
    if [[ "$line" == '  *'* && "$line" != *'*Link:'* && "${lines[i - 1]:-}" != *'*Link:'* ]]; then
      printf 'orphan description line at %s\n' "$((i + 1))" >&2
      problems=$((problems + 1))
    fi
  done

  # 3. Every archive directory has exactly one tracked entry in the whole file
  #    (a bold entry's own link line or a cancelled single-line link).
  for dir in "$archive"/*/; do
    [[ -d "$dir" ]] || continue
    count=0
    for ((i = 0; i < total; i++)); do
      if [[ "${lines[i]}" == *"archive/$(basename "$dir")/"* ]]; then
        if [[ "${lines[i]}" == *'*Link:'* || "${lines[i]}" == '- [x] ['* ]]; then
          count=$((count + 1))
        fi
      fi
    done
    if [[ "$count" -ne 1 ]]; then
      printf 'archive directory %s has %s tracked entries (expected 1)\n' "$(basename "$dir")" "$count" >&2
      problems=$((problems + 1))
    fi
  done

  # 4. At most one active track.
  local active
  active="$(grep -c -- '^- \[~\] \*\*Track:' "$file")"
  if [[ "$active" -gt 1 ]]; then
    printf '%s active tracks (expected at most 1)\n' "$active" >&2
    problems=$((problems + 1))
  fi
  return "$problems"
}

OUT="$(check_registry "$REGISTRY" "$ARCHIVE" 2>&1)" || fail "the registry is not structurally sound:
$OUT"
echo "[PASS] the registry has one three-line entry per archive directory"

TMP="$(mktemp -d "${TMPDIR:-/tmp}/registry-neg.XXXXXX")"
trap 'rm -rf -- "$TMP"' EXIT
mkdir -p "$TMP/archive/demo_track" "$TMP/archive/extra_track"

fixture() {
  printf '%s\n' "$@" >"$TMP/tracks.md"
}

# Each fixture writes only inside $TMP; the production archive is not read.
fixture \
  '- [x] **Track: Demo**' \
  '  *Link: [./archive/demo_track/](./archive/demo_track/)*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "missing-description fixture was accepted"
fi
[[ "$OUT" == *'missing description'* ]] || fail "missing-description message absent: $OUT"
echo "[PASS] a missing description is rejected"

fixture \
  '- [x] **Track: Demo**' \
  '  *Link: [./archive/demo_track/](./archive/demo_track/)*' \
  '  *Description.*' \
  '' \
  '  *Orphan.*' \
  '- [x] **Track: Extra**' \
  '  *Link: [./archive/extra_track/](./archive/extra_track/)*' \
  '  *Description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "orphan-description fixture was accepted"
fi
[[ "$OUT" == *'orphan description'* ]] || fail "orphan-description message absent: $OUT"
echo "[PASS] an orphan description is rejected"

fixture \
  '- [x] **Track: Demo**' \
  '- [x] **Track: Extra**' \
  '  *Link: [./archive/extra_track/](./archive/extra_track/)*' \
  '  *Description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "missing-link fixture was accepted"
fi
[[ "$OUT" == *'title without its own link'* ]] || fail "missing-link message absent: $OUT"
echo "[PASS] a title without its own link is rejected"

fixture \
  '- [x] **Track: Demo**' \
  '  *Link: [./archive/demo_track/](./archive/demo_track/)*' \
  '  *Description.*' \
  '- [x] **Track: Demo again**' \
  '  *Link: [./archive/demo_track/](./archive/demo_track/)*' \
  '  *Description.*' \
  '- [x] **Track: Extra**' \
  '  *Link: [./archive/extra_track/](./archive/extra_track/)*' \
  '  *Description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "duplicate-entry fixture was accepted"
fi
[[ "$OUT" == *'has 2 tracked entries'* ]] || fail "duplicate-entry message absent: $OUT"
echo "[PASS] a duplicate entry is rejected"

fixture \
  '- [x] **Track: Demo**' \
  '  *Link: [./archive/demo_track/](./archive/demo_track/)*' \
  '  *Description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "unreferenced-directory fixture was accepted"
fi
[[ "$OUT" == *'has 0 tracked entries'* ]] || fail "unreferenced-directory message absent: $OUT"
echo "[PASS] an unreferenced archive directory is rejected"

fixture \
  '- [~] **Track: Demo**' \
  '  *Link: [./tracks/demo_track/](./tracks/demo_track/)*' \
  '  *Description.*' \
  '- [~] **Track: Extra**' \
  '  *Link: [./tracks/extra_track/](./tracks/extra_track/)*' \
  '  *Description.*' \
  '- [x] **Track: Demo**' \
  '  *Link: [./archive/demo_track/](./archive/demo_track/)*' \
  '  *Description.*' \
  '- [x] **Track: Extra**' \
  '  *Link: [./archive/extra_track/](./archive/extra_track/)*' \
  '  *Description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "two-active fixture was accepted"
fi
[[ "$OUT" == *'active tracks'* ]] || fail "two-active message absent: $OUT"
echo "[PASS] two active tracks are rejected"
