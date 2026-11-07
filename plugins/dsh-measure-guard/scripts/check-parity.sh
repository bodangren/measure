#!/usr/bin/env bash
# The plugin's core is a copy of the Claude Code mod's pure modules. This check
# fails when a copy differs from its source. types.ts is the mod's types file
# without the `declare module 'claude-code'` block and with the DSH header note.
# It lives at src/types.ts so the copies keep their `../types` import unchanged.
set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
PKG=$(cd "$HERE/.." && pwd)
ROOT=$(cd "$PKG/../.." && pwd)
MOD=$ROOT/mods/measure-guard
CORE=$PKG/src/core
TYPES=$PKG/src/types.ts
TMP=$(mktemp -d "${TMPDIR:-/tmp}/dsh-measure-guard-parity.XXXXXX")
trap 'rm -rf "$TMP"' EXIT

status=0
fail() {
  echo "parity: $1"
  status=1
}

# 1. parse.ts is a byte-for-byte copy.
if ! cmp -s "$MOD/hooks/parse.ts" "$CORE/parse.ts"; then
  fail "$CORE/parse.ts differs from $MOD/hooks/parse.ts"
fi

# 2. guards.ts is a copy after one mechanical transform: its only extensionless
#    value import gains the .ts extension that Node ESM requires.
sed "s|from './parse'|from './parse.ts'|" "$MOD/hooks/guards.ts" > "$TMP/guards.ts"
if ! cmp -s "$TMP/guards.ts" "$CORE/guards.ts"; then
  fail "$CORE/guards.ts differs from $MOD/hooks/guards.ts after the ./parse -> ./parse.ts transform"
fi

# 3. types.ts is the mod's types without the `declare module 'claude-code'`
#    block, with the two-line header note replaced by the DSH note.
if ! grep -q "^declare module 'claude-code'" "$MOD/types/index.d.ts"; then
  fail "$MOD/types/index.d.ts has no declare module 'claude-code' block"
fi
{
  cat <<'HEADER'
// The measure-guard contract: the parse model of the Measure files and the
// values the mod keeps in $.state. DSH copy of
// mods/measure-guard/types/index.d.ts without its `declare module 'claude-code'`
// block (scripts/check-parity.sh).
HEADER
  awk '
    /^declare module / { exit }
    NR > 2 { lines[++n] = $0 }
    END {
      while (n > 0 && lines[n] ~ /^[[:space:]]*$/) n--
      for (i = 1; i <= n; i++) print lines[i]
    }
  ' "$MOD/types/index.d.ts"
} > "$TMP/types.ts"
if ! cmp -s "$TMP/types.ts" "$TYPES"; then
  fail "$TYPES differs from $MOD/types/index.d.ts (without the declare module block and with the DSH header note)"
fi

if [ "$status" -eq 0 ]; then
  echo 'parity: ok'
fi
exit "$status"
