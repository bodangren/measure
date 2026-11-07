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
    # The runner never runs itself, even when a pattern matches it.
    [ "$f" = "run.sh" ] && continue
    # A symlinked suite is skipped rather than followed.
    if [ -L "$f" ]; then
      echo "ignored suite (symbolic link): $f" >&2
      continue
    fi
    # The name is also the unittest discovery pattern, so a glob metacharacter
    # in it is ambiguous: refuse the whole run instead of running something else.
    case "$f" in
      *'*'* | *'?'* | *'['*)
        echo "refusing a suite name with a glob metacharacter: $f" >&2
        exit 1
        ;;
    esac
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
    *.sh)
      bash "$SUITE_DIR/$f"
      rc=$?
      ;;
    *.py)
      # Capture the output: on Python <= 3.11 a zero-test file exits 0, and the
      # `Ran 0 tests` line is the only reliable evidence of that failure.
      out="$(python3 -m unittest discover -s "$SUITE_DIR" -p "$f" 2>&1)"
      rc=$?
      printf '%s\n' "$out"
      if grep -q '^Ran 0 tests' <<<"$out"; then
        rc=1
        printf 'zero tests ran in %s\n' "$f" >&2
      fi
      ;;
  esac
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
