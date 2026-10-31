import os, random, subprocess, sys, tempfile, time, importlib.util
from pathlib import Path

REPO = "/home/daniebo/Desktop/measure"
CHECKER = REPO + "/skills/measure-orchestrator/scripts/measure_interphase_checks.py"
ENV = dict(os.environ, GIT_CONFIG_GLOBAL="/dev/null", GIT_CONFIG_NOSYSTEM="1")
S, E = "MEASURE_AGENT_RESULT", "END_MEASURE_AGENT_RESULT"
tmp = tempfile.mkdtemp(prefix="rb_probe3_")

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod

cur = load("mic_cur3", CHECKER)
src = subprocess.run(["git", "show", "0b6670d:skills/measure-orchestrator/scripts/measure_interphase_checks.py"],
                     cwd=REPO, env=ENV, text=True, stdout=subprocess.PIPE, check=True).stdout
p = Path(tmp) / "prev_checker.py"
p.write_text(src)
prev = load("mic_prev3", str(p))

log = Path(tmp) / "t.log"
def run(mod, text):
    log.write_text(text, encoding="utf-8")
    t = time.perf_counter()
    fb = mod.dispositions_feedback(str(log))
    return time.perf_counter() - t, fb

for n in (20000, 100000, 1000000):
    text = (E + "\n") * n + (S + "\n") * n + S + "\nrole: x\ndispositions: F1=BOGUS\n" + E + "\n"
    dt, fb = run(cur, text)
    print(f"cur ends/starts {n}/{n} + bad block: {dt:.3f}s {fb}", flush=True)
dt, fb = run(prev, (E + "\n") * 20000 + (S + "\n") * 20000 + S + "\ndispositions: F1=BOGUS\n" + E + "\n")
print(f"prev ends/starts 20000/20000 + bad block: {dt:.3f}s {fb}", flush=True)
dt, fb = run(cur, (E + "\n" + S + "\n") * 500000 + "dispositions: F1=BOGUS\n" + E + "\n")
print(f"cur 500k end/start pairs + bad: {dt:.3f}s {fb}", flush=True)

rng = random.Random(4242)
pool = [S, E, "  " + S, E + " ", "dispositions: F1=BOGUS", "dispositions: F1=FIX", "role: x", "", "\t" + E]
diff = 0
for i in range(20000):
    lines = [rng.choice(pool) for _ in range(rng.randint(0, 14))]
    text = "\n".join(lines) + ("\n" if rng.random() < 0.5 else "")
    a = run(cur, text)[1]
    b = run(prev, text)[1]
    if a != b:
        diff += 1
        if diff < 4:
            print("DIFF", lines, a, b)
print(f"random equivalence cur vs 0b6670d: 20000 logs, {diff} differences", flush=True)

lines = (Path(REPO) / "skills/measure-orchestrator/references/contracts.md").read_text().split("\n")
want118 = "- The check reads only the last result block of the log. The block ends at the last `END_MEASURE_AGENT_RESULT` line that has a `MEASURE_AGENT_RESULT` line above it."
want119 = "- The block starts at the first `MEASURE_AGENT_RESULT` line after the last `END_MEASURE_AGENT_RESULT` line that comes before the last start line of the block, or at the first start line of the log when no such end line exists."
print("contracts.md:118 exact:", lines[117] == want118)
print("contracts.md:119 exact:", lines[118] == want119)

# contract cases from item 4
cases = {
    "start on line 1, bad": "\n".join([S, "dispositions: F1=BOGUS", E]) + "\n",
    "S/x/E/bad/E (stricter)": "\n".join([S, "role: x", E, "dispositions: F1=BOGUS", E]) + "\n",
    "E/S/bad/E": "\n".join([E, S, "dispositions: F1=BOGUS", E]) + "\n",
    "bad after last end": "\n".join([S, "role: x", E, "dispositions: F1=BOGUS"]) + "\n",
}
for k, v in cases.items():
    print(f"case {k}: cur={run(cur, v)[1]} prev={run(prev, v)[1]}")
