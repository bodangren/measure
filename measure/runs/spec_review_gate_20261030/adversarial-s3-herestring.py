"""Replace `printf '%s\n' "$x" | grep -q... -- PAT` conditions with here-strings (F14)."""
import re, sys
from pathlib import Path
RX = re.compile(r"""printf '%s\\n' ("\$[A-Za-z0-9_]+") \| (grep -q[A-Za-z]* -- (?:"[^"]*"|'[^']*'))""")
total = 0
for name in sys.argv[1:]:
    p = Path(name)
    text = p.read_text(encoding="utf-8")
    new, n = RX.subn(lambda m: f"{m.group(2)} <<< {m.group(1)}", text)
    p.write_text(new, encoding="utf-8")
    print(f"{name}: {n}")
    total += n
print(f"total: {total}")
