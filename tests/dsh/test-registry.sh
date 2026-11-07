#!/usr/bin/env bash
# The tracks registry structure (registry checker completeness): one layout —
# Active, Cancelled, Archived — with one three-line entry per archive directory
# (title, its own link, one description equal to the archive's metadata) and at
# most one active track.
#
# Usage: test-registry.sh [registry-path] [archive-dir]
set -uo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

REGISTRY="${1:-$REPO_ROOT/measure/tracks.md}"
ARCHIVE="${2:-$REPO_ROOT/measure/archive}"
[[ -f "$REGISTRY" ]] || fail "missing repository: $REGISTRY"
[[ -d "$ARCHIVE" ]] || fail "missing archive: $ARCHIVE"

# Prints "dir<TAB>collapsed metadata description" for every archive directory.
archive_descriptions() {
  local archive="$1"
  python3 - "$archive" <<'PY'
import json, sys
from pathlib import Path
root = Path(sys.argv[1])
for d in sorted(p.name for p in root.iterdir() if p.is_dir()):
    meta = root / d / 'metadata.json'
    desc = ''
    if meta.exists():
        try:
            desc = ' '.join(str(json.loads(meta.read_text()).get('description', '')).split())
        except Exception:
            desc = ''
    print(d + '\t' + desc)
PY
}

# Returns 0 when the registry is structurally sound; prints each violation to
# stderr and returns the number of violations.
check_registry() {
  local file="$1" archive="$2" problems=0 i dir count line title desc dirname expected
  local -a lines=()
  mapfile -t lines <"$file"
  local total=${#lines[@]}

  local archived_heading=-1
  for ((i = 0; i < total; i++)); do
    if [[ "${lines[i]}" == '## Archived Tracks' ]]; then archived_heading=$i; fi
  done
  if [[ "$archived_heading" -lt 0 ]]; then
    printf 'missing ## Archived Tracks heading\n' >&2
    return 1
  fi

  local -A meta_desc=()
  local key value
  while IFS=$'\t' read -r key value; do
    meta_desc["$key"]="$value"
  done < <(archive_descriptions "$archive")

  for ((i = 0; i < total; i++)); do
    line="${lines[i]}"
    # 1. A bold archived entry must be inside the Archived Tracks section, have
    #    its own link directly after it, and exactly one description that equals
    #    the archive's metadata description (or the title when that is empty).
    if [[ "$line" == '- [x] **Track:'* ]]; then
      if ((i < archived_heading)); then
        printf 'archived entry outside the Archived Tracks section at line %s\n' "$((i + 1))" >&2
        problems=$((problems + 1))
      fi
      if [[ "${lines[i + 1]:-}" != *'*Link:'* ]]; then
        printf 'title without its own link at line %s\n' "$((i + 1))" >&2
        problems=$((problems + 1))
      else
        title="${line#- \[x\] \*\*Track: }"
        title="${title%\*\*}"
        desc="${lines[i + 2]:-}"
        desc="${desc#  \*}"
        desc="${desc%\*}"
        dirname="$(sed -E 's#.*archive/([^/]+)/.*#\1#' <<<"${lines[i + 1]}")"
        expected="${meta_desc[$dirname]:-}"
        if [[ -z "$expected" ]]; then
          expected="$title"
        fi
        if [[ "$desc" != "$expected" ]]; then
          printf 'description differs from metadata for %s\n  registry: %s\n  expected: %s\n' "$dirname" "$desc" "$expected" >&2
          problems=$((problems + 1))
        fi
        if [[ "${lines[i + 3]:-}" == '  *'* && "${lines[i + 3]:-}" != *'*Link:'* ]]; then
          printf 'more than one description after line %s\n' "$((i + 1))" >&2
          problems=$((problems + 1))
        fi
      fi
    fi
    # 2. The old one-line link shape is rejected.
    if [[ "$line" == '- [x] ['*']('*'archive/'*')' ]]; then
      printf 'old single-line entry at line %s\n' "$((i + 1))" >&2
      problems=$((problems + 1))
    fi
    # 3. No orphan description line: a description must follow a link line.
    if [[ "$line" == '  *'* && "$line" != *'*Link:'* && "${lines[i - 1]:-}" != *'*Link:'* ]]; then
      printf 'orphan description line at %s\n' "$((i + 1))" >&2
      problems=$((problems + 1))
    fi
  done

  # 4. Every archive directory has exactly one archive-referencing entry.
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

  # 5. At most one active track.
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
echo "[PASS] the registry has one complete three-line entry per archive directory"

TMP="$(mktemp -d "${TMPDIR:-/tmp}/registry-neg.XXXXXX")"
trap 'rm -rf -- "$TMP"' EXIT
mkdir -p "$TMP/archive/demo_track" "$TMP/archive/extra_track"
printf '{"description": "Real description."}\n' >"$TMP/archive/demo_track/metadata.json"
printf '{"description": "Extra description."}\n' >"$TMP/archive/extra_track/metadata.json"

fixture() {
  printf '%s\n' "$@" >"$TMP/tracks.md"
}

fixture '## Active Tracks' '- (none)' '## Archived Tracks'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "empty-archive fixture was accepted"
fi
[[ "$OUT" == *'has 0 tracked entries'* ]] || fail "empty-archive message absent: $OUT"
echo "[PASS] archive directories without entries are rejected"

fixture '## Active Tracks' '- (none)' '## Cancelled Tracks' '- [x] **Track: Demo**' '  *Link: [./archive/demo_track/](./archive/demo_track/)*' '  *Real description.*' '## Archived Tracks' '- [x] **Track: Extra**' '  *Link: [./archive/extra_track/](./archive/extra_track/)*' '  *Extra description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "outside-section fixture was accepted"
fi
[[ "$OUT" == *'outside the Archived Tracks section'* ]] || fail "outside-section message absent: $OUT"
echo "[PASS] an archived entry outside the section is rejected"

fixture '## Archived Tracks' '- [x] **Track: Demo**' '  *Link: [./archive/demo_track/](./archive/demo_track/)*' '  *Different description.*' '- [x] **Track: Extra**' '  *Link: [./archive/extra_track/](./archive/extra_track/)*' '  *Extra description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "metadata-mismatch fixture was accepted"
fi
[[ "$OUT" == *'description differs from metadata'* ]] || fail "metadata-mismatch message absent: $OUT"
echo "[PASS] a description that differs from metadata is rejected"

fixture '## Archived Tracks' '- [x] **Track: Demo**' '  *Link: [./archive/demo_track/](./archive/demo_track/)*' '  *Real desc…*' '- [x] **Track: Extra**' '  *Link: [./archive/extra_track/](./archive/extra_track/)*' '  *Extra description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "clipped-description fixture was accepted"
fi
[[ "$OUT" == *'description differs from metadata'* ]] || fail "clipped-description message absent: $OUT"
echo "[PASS] a clipped description is rejected"

fixture '## Archived Tracks' '- [x] [Demo](archive/demo_track/index.md)' '- [x] **Track: Extra**' '  *Link: [./archive/extra_track/](./archive/extra_track/)*' '  *Extra description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "old-shape fixture was accepted"
fi
[[ "$OUT" == *'old single-line entry'* ]] || fail "old-shape message absent: $OUT"
echo "[PASS] the old single-line entry shape is rejected"

fixture '## Archived Tracks' '- [x] **Track: Demo**' '  *Link: [./archive/demo_track/](./archive/demo_track/)*' '' '- [x] **Track: Extra**' '  *Link: [./archive/extra_track/](./archive/extra_track/)*' '  *Extra description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "missing-description fixture was accepted"
fi
[[ "$OUT" == *'description differs from metadata'* ]] || fail "missing-description message absent: $OUT"
echo "[PASS] a missing description is rejected"

fixture '## Archived Tracks' '- [x] **Track: Demo**' '  *Link: [./archive/demo_track/](./archive/demo_track/)*' '  *Real description.*' '' '  *Orphan.*' '- [x] **Track: Extra**' '  *Link: [./archive/extra_track/](./archive/extra_track/)*' '  *Extra description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "orphan-description fixture was accepted"
fi
[[ "$OUT" == *'orphan description'* ]] || fail "orphan-description message absent: $OUT"
echo "[PASS] an orphan description is rejected"

fixture '## Archived Tracks' '- [x] **Track: Demo**' '- [x] **Track: Extra**' '  *Link: [./archive/extra_track/](./archive/extra_track/)*' '  *Extra description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "missing-link fixture was accepted"
fi
[[ "$OUT" == *'title without its own link'* ]] || fail "missing-link message absent: $OUT"
echo "[PASS] a title without its own link is rejected"

fixture '## Archived Tracks' '- [x] **Track: Demo**' '  *Link: [./archive/demo_track/](./archive/demo_track/)*' '  *Real description.*' '- [x] **Track: Demo again**' '  *Link: [./archive/demo_track/](./archive/demo_track/)*' '  *Real description.*' '- [x] **Track: Extra**' '  *Link: [./archive/extra_track/](./archive/extra_track/)*' '  *Extra description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "duplicate-entry fixture was accepted"
fi
[[ "$OUT" == *'has 2 tracked entries'* ]] || fail "duplicate-entry message absent: $OUT"
echo "[PASS] a duplicate entry is rejected"

fixture '## Active Tracks' '- [~] **Track: Demo**' '  *Link: [./tracks/demo_track/](./tracks/demo_track/)*' '  *Description.*' '- [~] **Track: Extra**' '  *Link: [./tracks/extra_track/](./tracks/extra_track/)*' '  *Description.*' '## Archived Tracks' '- [x] **Track: Demo**' '  *Link: [./archive/demo_track/](./archive/demo_track/)*' '  *Real description.*' '- [x] **Track: Extra**' '  *Link: [./archive/extra_track/](./archive/extra_track/)*' '  *Extra description.*'
if OUT="$(check_registry "$TMP/tracks.md" "$TMP/archive" 2>&1)"; then
  fail "two-active fixture was accepted"
fi
[[ "$OUT" == *'active tracks'* ]] || fail "two-active message absent: $OUT"
echo "[PASS] two active tracks are rejected"
