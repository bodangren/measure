#!/usr/bin/env bash
# The plugin's core is a copy of the Claude Code mod's pure modules. This check
# fails when a copy differs from its source. types.ts is the mod's types file
# without the `declare module 'claude-code'` block and with a two-line header note.
# It lives at src/types.ts so the copies keep their `../types` import unchanged.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../../.." && pwd)
MOD=$ROOT/mods/measure-guard
CORE=$ROOT/plugins/opencode-measure-guard/src/core
TYPES=$ROOT/plugins/opencode-measure-guard/src/types.ts
status=0
check() { # source copy
  if ! diff -q "$1" "$2" >/dev/null; then echo "parity: $2 differs from $1"; status=1; fi
}
check "$MOD/hooks/parse.ts" "$CORE/parse.ts"
check "$MOD/hooks/guards.ts" "$CORE/guards.ts"
expected=$(python3 - "$MOD/types/index.d.ts" <<'PY'
import sys
src=open(sys.argv[1]).read()
out=src[:src.index("declare module 'claude-code'")].rstrip('\n')+'\n'
out=out.replace("// The measure-guard contract: the parse model of the Measure files and the\n// values the mod keeps in $.state.","// The measure-guard contract: the parse model of the Measure files and the\n// values the mod keeps in $.state. Copy of mods/measure-guard/types/index.d.ts\n// without its `declare module 'claude-code'` block (scripts/check-parity.sh).",1)
sys.stdout.write(out)
PY
)
if [ "$expected" != "$(cat "$TYPES")" ]; then echo "parity: $CORE/types.ts differs from $MOD/types/index.d.ts (without the declare module block)"; status=1; fi
[ $status -eq 0 ] && echo "parity: ok"
exit $status
