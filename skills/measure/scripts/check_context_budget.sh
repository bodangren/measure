#!/usr/bin/env bash
# Check context budget for measure memory artifacts.
# Reports line counts and whether each file is within the 50-line limit.
# Exits 0 even when files do not exist.

BUDGET=50

check_file() {
  local file="$1"
  local label="$2"

  if [ ! -f "$file" ]; then
    echo "$label: 0 lines (file not found) — OK"
    return
  fi

  local lines
  lines=$(wc -l < "$file")

  if [ "$lines" -gt "$BUDGET" ]; then
    echo "$label: $lines lines — OVER_LIMIT (max $BUDGET)"
  else
    echo "$label: $lines lines — OK"
  fi
}

check_file "measure/lessons-learned.md" "lessons-learned.md"
check_file "measure/tech-debt.md"       "tech-debt.md"
