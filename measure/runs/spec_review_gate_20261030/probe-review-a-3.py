"""Review A probe 3 (S3, 33f608d): old vs new block selection, new text, linear cost."""
import importlib.util
import random
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path("/home/daniebo/Desktop/measure")
CHECKER = ROOT / "skills/measure-orchestrator/scripts/measure_interphase_checks.py"
CONTRACTS = ROOT / "skills/measure-orchestrator/references/contracts.md"
OLD_REF = "0b6670d:skills/measure-orchestrator/scripts/measure_interphase_checks.py"

TMP = Path(tempfile.mkdtemp(prefix="probe-review-a-3-", dir="/tmp/opencode"))

FAILURES = []


def check(name, ok, detail=""):
    print(("PASS: " if ok else "FAIL: ") + name + ((" -- " + str(detail)) if detail else ""))
    if not ok:
        FAILURES.append(name)


def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, str(path))
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


mic = load_module(CHECKER, "mic_new")

old_src = subprocess.run(
    ["git", "-C", str(ROOT), "show", OLD_REF],
    text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=True,
).stdout
old_path = TMP / "mic_old.py"
old_path.write_text(old_src, encoding="utf-8")
mic_old = load_module(old_path, "mic_old")

S = "MEASURE_AGENT_RESULT"
E = "END_MEASURE_AGENT_RESULT"
LOG = TMP / "probe.log"


def both(lines):
    LOG.write_bytes(("\n".join(lines) + "\n").encode("utf-8"))
    return mic.dispositions_feedback(str(LOG)), mic_old.dispositions_feedback(str(LOG))


# ---- Part 1: exhaustive equivalence over a 4-token alphabet, lengths 0..7.
alphabet = [S, E, "dispositions: F1=bad", "role: x"]
total = 0
diffs = []


def gen(length, prefix):
    if length == 0:
        yield prefix
        return
    for token in alphabet:
        yield from gen(length - 1, prefix + [token])


for length in range(0, 8):
    for lines in gen(length, []):
        total += 1
        new, old = both(lines)
        if new != old:
            diffs.append((lines, old, new))
check("exhaustive 0..7 token logs: old and new selection give the same feedback ({} logs)".format(total),
      not diffs, diffs[:3])

# ---- Part 2: random larger logs over a richer alphabet.
rng = random.Random(20261031)
rich = [S, E, "dispositions: F1=bad", "dispositions: none", "dispositions: F1=FIX; F2=CONTEST(t)",
        "role: jr-green", "status: complete", "  " + S, E + " ", "dispositions : F1=bad",
        "dispositions: F1=bad\r=FIX", "plain text"]
random_diffs = []
for _ in range(3000):
    length = rng.randrange(0, 80)
    lines = [rng.choice(rich) for _ in range(length)]
    new, old = both(lines)
    if new != old:
        random_diffs.append((lines, old, new))
check("3000 random logs (length 0..79, 12 line kinds): same feedback", not random_diffs, random_diffs[:3])

# ---- Part 3: the new contracts.md and docstring text is present.
text = CONTRACTS.read_text(encoding="utf-8")
docstring = mic.dispositions_feedback.__doc__
flat_doc = " ".join(docstring.split())
new_rules = [
    "The check reads only the last result block of the log. The block ends at the last `END_MEASURE_AGENT_RESULT` line that has a `MEASURE_AGENT_RESULT` line above it.",
    "The block starts at the first `MEASURE_AGENT_RESULT` line after the last `END_MEASURE_AGENT_RESULT` line that comes before the last start line of the block, or at the first start line of the log when no such end line exists.",
]
for rule in new_rules:
    check("contracts.md states: " + rule[:60] + "...", rule in text)
doc_rules = [
    "The block ends at the last `END_MEASURE_AGENT_RESULT` line that has a `MEASURE_AGENT_RESULT` line above it.",
    "It starts at the first `MEASURE_AGENT_RESULT` line after the last `END_MEASURE_AGENT_RESULT` line that comes before the last start line of the block, or at the first start line of the log when no such end line exists.",
]
for rule in doc_rules:
    check("the docstring states: " + rule[:60] + "...", rule in flat_doc)
check("the docstring states the linear cost",
      "Each line list is scanned a fixed number of times, so the cost grows linearly with the number of log lines." in flat_doc)

# ---- Part 4: behavior matches the new text sentence by sentence.
# End: last END line that has a start line above it (earlier end lines without a start do not end the block).
new, _ = both([E, "dispositions: F1=bad", S, "role: x", E])
check("an end line before any start line is not the block end", new == [], new)
# Start on line 1 counts (the old text said 'after the first line of the log').
new, _ = both([S, "dispositions: F1=bad", E])
check("a start line on line 1 starts the block", new == ["invalid dispositions line: F1=bad"], new)
# Review B case: START / role / END / bad / END exits 1, per the new text.
new, _ = both([S, "role: x", E, "dispositions: F1=BOGUS", E])
check("START / role / END / bad / END gives feedback", new == ["invalid dispositions line: F1=BOGUS"], new)
# Start: first start after the last end before the last start of the block.
new, _ = both([S, "dispositions: F1=bad", E, S, "dispositions: none", E])
check("an invalid line above the block start does not count", new == [], new)
new, _ = both([S, "dispositions: F1=bad", S, "role: x", E])
check("a second start line inside the block cannot hide a line above it",
      new == ["invalid dispositions line: F1=bad"], new)
new, _ = both([S, "role: x"])
check("a log with no end line gives no feedback", new == [], new)
new, _ = both([*("x",), S, "role: x", E, "dispositions: F1=bad"])
check("a dispositions line after the block end does not count", new == [], new)

# ---- Part 5: the selection is linear now; the old one was not.
big = [E] * 20000 + [S, "role: jr-green", "dispositions: none", E]
LOG.write_bytes(("\n".join(big) + "\n").encode("utf-8"))
t0 = time.perf_counter()
mic.dispositions_feedback(str(LOG))
new_time = time.perf_counter() - t0
check("new selection on 20003 lines runs in less than 1 s (linear)", new_time < 1.0, "{:.3f} s".format(new_time))

small = [E] * 2000 + [S, "role: jr-green", "dispositions: none", E]
LOG.write_bytes(("\n".join(small) + "\n").encode("utf-8"))
t0 = time.perf_counter()
mic_old.dispositions_feedback(str(LOG))
old_time = time.perf_counter() - t0
t0 = time.perf_counter()
mic.dispositions_feedback(str(LOG))
new_small = time.perf_counter() - t0
check("on 2003 end-heavy lines the new run is not slower than the old run", new_small <= old_time + 0.05,
      "old {:.3f} s, new {:.3f} s".format(old_time, new_small))

print()
print("probe failures: " + str(len(FAILURES)))
for f in FAILURES:
    print("  - " + f)
shutil.rmtree(TMP, ignore_errors=True)
sys.exit(1 if FAILURES else 0)
