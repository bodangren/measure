import os, subprocess, sys, tempfile, time, importlib.util
from pathlib import Path

REPO = "/home/daniebo/Desktop/measure"
CHECKER = REPO + "/skills/measure-orchestrator/scripts/measure_interphase_checks.py"
ENV = dict(os.environ, GIT_CONFIG_GLOBAL="/dev/null", GIT_CONFIG_NOSYSTEM="1")
S, E = "MEASURE_AGENT_RESULT", "END_MEASURE_AGENT_RESULT"
BAD = "dispositions: F1=BOGUS"
tmp = tempfile.mkdtemp(prefix="rb_probe2_")

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod

cur = load("mic_cur", CHECKER)
old_src = subprocess.run(["git", "show", "b1d1530:skills/measure-orchestrator/scripts/measure_interphase_checks.py"],
                         cwd=REPO, env=ENV, text=True, stdout=subprocess.PIPE, check=True).stdout
old_path = Path(tmp) / "old_checker.py"
old_path.write_text(old_src)
old = load("mic_old", str(old_path))

def timed(name, text, limit_note=""):
    log = Path(tmp) / "big.log"
    log.write_text(text, encoding="utf-8")
    t = time.perf_counter()
    fb = cur.dispositions_feedback(str(log))
    print(f"time {name}: {time.perf_counter() - t:.3f}s feedback={fb[:1]}", flush=True)

timed("ends then starts 2k/2k", (E + "\n") * 2000 + (S + "\n") * 2000)
timed("ends then starts 5k/5k", (E + "\n") * 5000 + (S + "\n") * 5000)
timed("ends then starts 10k/10k", (E + "\n") * 10000 + (S + "\n") * 10000)
timed("ends then starts 20k/20k", (E + "\n") * 20000 + (S + "\n") * 20000)
timed("1M starts one end", (S + "\n") * 1000000 + E + "\n")
timed("500k blocks", (S + "\n" + E + "\n") * 500000)
timed("start, 2M lines", S + "\n" + "x\n" * 2000000 + E + "\n")
timed("200k disp lines", S + "\n" + (BAD + "\n") * 200000 + E + "\n")
timed("one 50 MB line in block", S + "\ndispositions: " + "F1=FIX; " * 6000000 + "\n" + E + "\n")

# CR inside a line, LF log
log = Path(tmp) / "cr.log"
log.write_bytes(("\n".join([S, "role: x\r" + BAD, E]) + "\n").encode())
print("embedded CR before disp:", cur.dispositions_feedback(str(log)), flush=True)

# old-log rescan
PRUNE = {"node_modules", ".git", ".cache", ".npm", ".cargo", ".rustup", "snap", ".venv", "venv", "__pycache__", "Trash", ".mozilla", ".config"}
logs = set()
t0 = time.perf_counter()
for root, dirs, files in os.walk("/home/daniebo"):
    dirs[:] = [d for d in dirs if d not in PRUNE]
    parts = Path(root).parts
    inside = any(parts[i] == "measure" and i + 1 < len(parts) and parts[i + 1] in ("runs", "archive") for i in range(len(parts)))
    if inside:
        for f in files:
            if f.endswith(".log"):
                logs.add(os.path.join(root, f))
for f in Path(REPO, "measure/runs").rglob("*.log"):
    logs.add(str(f))
roots = set()
nonempty, diffs, errors, withline = [], [], [], 0
for p in sorted(logs):
    parts = Path(p).parts
    idx = max(i for i in range(len(parts)) if parts[i] == "measure")
    roots.add(os.path.join(*parts[:idx]))
    try:
        a = cur.dispositions_feedback(p)
        b = old.dispositions_feedback(p)
    except Exception as exc:
        errors.append(f"{p}: {exc!r}")
        continue
    try:
        txt = Path(p).read_text(encoding="utf-8", errors="ignore")
        if any(l.strip().startswith("dispositions:") for l in txt.split("\n")):
            withline += 1
    except Exception:
        pass
    if a:
        nonempty.append(f"{p}: {a}")
    if a != b:
        diffs.append(f"{p}: cur={a} old={b}")
print(f"scan: {len(logs)} logs, {len(roots)} roots, {withline} logs with a dispositions line, {time.perf_counter() - t0:.1f}s")
print("roots:", sorted(roots))
print("nonempty:", nonempty)
print("diffs:", diffs)
print("errors:", errors)
print("this repo logs:", sum(1 for p in logs if p.startswith(REPO + "/measure/runs/")))
