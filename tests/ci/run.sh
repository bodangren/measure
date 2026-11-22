#!/usr/bin/env bash
# Runs every tests/ci/test-*.sh and prints a summary.
# Mirrors tests/dsh/run.sh: exit 0 only when every test passes.
set -uo pipefail

DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

files=()
shopt -s nullglob
for path in "$DIR"/test-*.sh; do
  files+=("$path")
done
shopt -u nullglob

if ((${#files[@]} == 0)); then
  echo "no tests found in $DIR" >&2
  exit 1
fi

passed=0
failed=0
failed_names=()

for path in "${files[@]}"; do
  name="$(basename -- "$path")"
  printf '\n== %s ==\n' "$name"
  if bash "$path"; then
    passed=$((passed + 1))
  else
    failed=$((failed + 1))
    failed_names+=("$name")
    echo "[FAIL] $name" >&2
  fi
done

printf '\n== summary: %d passed, %d failed ==\n' "$passed" "$failed"
if ((${#failed_names[@]} > 0)); then
  printf 'failed: %s\n' "${failed_names[*]}" >&2
  exit 1
fi
exit 0
