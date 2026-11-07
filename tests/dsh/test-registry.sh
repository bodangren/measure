#!/usr/bin/env bash
# The tracks registry structure (DSH Measure registry cleanup track): the file is
# the first thing every Measure session reads, so a merged description block or an
# unreferenced archive directory is a real defect.
set -uo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

REGISTRY="$REPO_ROOT/measure/tracks.md"
ARCHIVE="$REPO_ROOT/measure/archive"
[[ -f "$REGISTRY" ]] || fail "missing repository: $REGISTRY"

# Returns 0 when the file is structurally sound; prints each violation to stderr.
check_registry() {
  local file="$1" problems=0 line dir count
  local -a lines=()
  mapfile -t lines <"$file"
  for ((i = 0; i < ${#lines[@]}; i++)); do
    line="${lines[i]}"
    if [[ "$line" == '- [x] **Track:'* ]]; then
      if ! { [[ "${lines[i + 1]:-}" == *'*Link:'* ]] || [[ "${lines[i + 2]:-}" == *'*Link:'* ]]; }; then
        printf 'entry without a link line at %s\n' "$((i + 1))" >&2
        problems=$((problems + 1))
      fi
    fi
    if [[ "$line" == '  *'* && "$line" != *'*Link:'* ]]; then
      if [[ "${lines[i + 1]:-}" == '  *'* && "${lines[i + 1]:-}" != *'*Link:'* ]]; then
        printf 'merged description block at %s\n' "$((i + 1))" >&2
        problems=$((problems + 1))
      fi
    fi
  done
  if [[ -d "$ARCHIVE" ]]; then
    for dir in "$ARCHIVE"/*/; do
      [[ -d "$dir" ]] || continue
      count="$(grep -c -- "\*Link: .*archive/$(basename "$dir")/" "$file")"
      if [[ "$count" -ne 1 ]]; then
        printf 'archive entry %s has %s link lines (expected 1)\n' "$(basename "$dir")" "$count" >&2
        problems=$((problems + 1))
      fi
    done
  fi
  local active
  active="$(grep -c -- '^- \[~\] \*\*Track:' "$file")"
  if [[ "$active" -gt 1 ]]; then
    printf '%s active tracks (expected at most 1)\n' "$active" >&2
    problems=$((problems + 1))
  fi
  return "$problems"
}

OUT="$(check_registry "$REGISTRY" 2>&1)" || fail "the registry is not structurally sound:
$OUT"
echo "[PASS] the registry has one linked entry per archive directory"

# The check must catch a merged description block and an unreferenced entry.
TMP_BAD="$(mktemp -d "${TMPDIR:-/tmp}/registry-neg.XXXXXX")"
trap 'rm -rf -- "$TMP_BAD"' EXIT
mkdir -p "$TMP_BAD/archive/demo_track"
{
  printf '%s\n' '# Project Tracks'
  printf '%s\n' '- [x] **Track: Demo**'
  printf '%s\n' '  *Link: [./archive/demo_track/](./archive/demo_track/)*'
  printf '%s\n' '  *First description line.*'
  printf '%s\n' '  *Second description line (the merged block).*'
} >"$TMP_BAD/tracks.md"
if OUT="$(check_registry "$TMP_BAD/tracks.md" 2>&1)"; then
  fail "the registry check accepted a merged description block"
fi
[[ "$OUT" == *'merged description block'* ]] || fail "the merged-block message is missing: $OUT"
echo "[PASS] a merged description block is rejected"

{
  printf '%s\n' '# Project Tracks'
} >"$TMP_BAD/tracks.md"
if OUT="$(check_registry "$TMP_BAD/tracks.md" 2>&1)"; then
  fail "the registry check accepted an archive directory with no entry"
fi
[[ "$OUT" == *'has 0 link lines'* ]] || fail "the missing-entry message is missing: $OUT"
echo "[PASS] an unreferenced archive directory is rejected"
