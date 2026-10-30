#!/usr/bin/env bash
# Runner for the spec_review_gate suites.
# Usage: bash tests/spec_review_gate/run.sh [pattern ...]
# Each pattern is a glob relative to tests/spec_review_gate/. The default patterns
# are 'test_*.sh' and 'test_*.py'. Each matching file is one suite.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SUITE_DIR="$ROOT/tests/spec_review_gate"

if [ "$#" -eq 0 ]; then
  set -- 'test_*.sh' 'test_*.py'
fi

cd "$SUITE_DIR" || { echo "cannot enter $SUITE_DIR" >&2; exit 1; }
shopt -s nullglob

matched=()
for pattern in "$@"; do
  case "$pattern" in
    */* | *..*)
      echo "ignored pattern (not relative to the suite folder): $pattern" >&2
      continue
      ;;
  esac
  old_ifs="$IFS"
  IFS=
  # shellcheck disable=SC2206 # the glob must expand; an empty IFS keeps spaces in names
  files=( $pattern )
  IFS="$old_ifs"
  for f in "${files[@]+"${files[@]}"}"; do
    [ -f "$f" ] || continue
    case "$f" in
      *.sh | *.py) matched+=("$f") ;;
    esac
  done
done

suites=()
if [ "${#matched[@]}" -gt 0 ]; then
  while IFS= read -r -d '' f; do
    suites+=("$f")
  done < <(printf '%s\0' "${matched[@]}" | LC_ALL=C sort -zu)
fi

cd "$ROOT" || exit 1

pass_n=0
fail_n=0
for f in "${suites[@]+"${suites[@]}"}"; do
  echo "--- suite: $f ---"
  case "$f" in
    *.sh) bash "$SUITE_DIR/$f" ;;
    *.py) python3 -m unittest discover -s "$SUITE_DIR" -p "$f" ;;
  esac
  rc=$?
  if [ "$rc" -eq 0 ]; then
    pass_n=$((pass_n + 1))
    echo "--- suite result: PASS: $f ---"
  else
    fail_n=$((fail_n + 1))
    echo "--- suite result: FAIL: $f (exit $rc) ---"
  fi
done

total=$((pass_n + fail_n))
if [ "$total" -eq 0 ]; then
  echo "no suites matched"
fi
echo "=== spec_review_gate: $total suites (PASS=$pass_n, FAIL=$fail_n) ==="

if [ "$total" -eq 0 ] || [ "$fail_n" -gt 0 ]; then
  exit 1
fi
exit 0
