#!/usr/bin/env bash
# Proof that every spec-review-gate suite fails cleanly when `mktemp` fails.
# A stub `mktemp` that exits 1 is put first on PATH; each other suite must exit 1
# with the guard message and a one-FAIL summary, and the repository must not
# change.
set -uo pipefail

DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DIR/../.." && pwd)"
GUARD="FAIL: mktemp -d failed; no fixture can be built"
SUMMARY="=== Total: 1 checks (PASS=0, FAIL=1) ==="

TMP="$(mktemp -d)" || TMP=""
if [ -z "$TMP" ] || [ ! -d "$TMP" ]; then
  echo "$GUARD"
  echo "$SUMMARY"
  exit 1
fi
trap 'rm -rf "$TMP"' EXIT

PASS_COUNT=0
FAIL_COUNT=0
FAILED=0
check() {
  if [ "$2" -eq 1 ]; then
    PASS_COUNT=$((PASS_COUNT + 1)); echo "PASS: $1"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1)); FAILED=1; echo "FAIL: $1"
  fi
}

mkdir -p "$TMP/bin"
printf '#!/usr/bin/env bash\nexit 1\n' > "$TMP/bin/mktemp"
chmod +x "$TMP/bin/mktemp"

git_status() {
  (cd "$ROOT" && git status --porcelain --untracked-files=all --ignored 2>/dev/null || true)
}
BEFORE="$(git_status)"

for suite in "$DIR"/test_*.sh; do
  name="$(basename -- "$suite")"
  [ "$name" = "test_mktemp_failure.sh" ] && continue
  if command -v timeout > /dev/null 2>&1; then
    OUT="$(PATH="$TMP/bin:$PATH" TMPDIR="$TMP/tmp" timeout 60 bash "$suite" 2>&1)"
    rc=$?
  else
    OUT="a failing mktemp cannot be proved without the timeout command"
    rc=0
  fi
  ok=0
  if [ "$rc" -eq 1 ] && grep -qxF -- "$GUARD" <<<"$OUT" && grep -qxF -- "$SUMMARY" <<<"$OUT"; then
    ok=1
  fi
  check "a stub mktemp makes $name exit 1 with the guard message" "$ok"
done

# The second half of the guard: mktemp succeeds but names a regular file, not a
# directory. A suite that only checked the empty string would not catch it.
mkdir -p "$TMP/bin2"
: > "$TMP/not-a-dir"
printf '#!/usr/bin/env bash\necho "$MKTEMP_FILE"\nexit 0\n' > "$TMP/bin2/mktemp"
chmod +x "$TMP/bin2/mktemp"
for suite in "$DIR"/test_*.sh; do
  name="$(basename -- "$suite")"
  [ "$name" = "test_mktemp_failure.sh" ] && continue
  OUT="$(PATH="$TMP/bin2:$PATH" MKTEMP_FILE="$TMP/not-a-dir" TMPDIR="$TMP/tmp" timeout 60 bash "$suite" 2>&1)"
  rc=$?
  ok=0
  if [ "$rc" -eq 1 ] && grep -qxF -- "$GUARD" <<<"$OUT" && grep -qxF -- "$SUMMARY" <<<"$OUT"; then
    ok=1
  fi
  check "a mktemp that returns a file makes $name exit 1 with the guard message" "$ok"
done

AFTER="$(git_status)"
ok=1
[ "$BEFORE" = "$AFTER" ] || ok=0
check "the stubbed runs leave the repository unchanged (including ignored paths)" "$ok"

echo "=== Total: $((PASS_COUNT + FAIL_COUNT)) checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
exit "$FAILED"
