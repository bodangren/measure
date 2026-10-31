import os, subprocess, sys, tempfile, threading
from pathlib import Path

REPO = "/home/daniebo/Desktop/measure"
CHECKER = REPO + "/skills/measure-orchestrator/scripts/measure_interphase_checks.py"
ENV = dict(os.environ, GIT_CONFIG_GLOBAL="/dev/null", GIT_CONFIG_NOSYSTEM="1")
S, E = "MEASURE_AGENT_RESULT", "END_MEASURE_AGENT_RESULT"
tmp = Path(tempfile.mkdtemp(prefix="rb_probe4_"))
repo = tmp / "repo"
(repo / "measure/tracks/t").mkdir(parents=True)
(repo / "measure/index.md").write_text("# M\n")
(repo / "measure/tracks.md").write_text("# T\n")
(repo / "measure/tracks/t/test-strategy.md").write_text("# S\n")
(repo / "measure/tracks/t/plan.md").write_text("# P\n")
subprocess.run(["git", "init", "-q"], cwd=repo, env=ENV, check=True)

good = tmp / "good.log"
good.write_text(f"{S}\nrole: x\n{E}\n")
bad = tmp / "bad.log"
bad.write_text(f"{S}\ndispositions: F1=BOGUS\n{E}\n")
folder = tmp / "folder"
folder.mkdir()
(folder / f"{S}").write_text("x")
os.symlink(good, tmp / "link-good")
os.symlink(bad, tmp / "link-bad")
os.symlink(tmp / "nothing", tmp / "link-dangling")
os.symlink(folder, tmp / "link-folder")
fifo = tmp / "fifo"
os.mkfifo(fifo)
fifo_full = tmp / "fifo-full"
os.mkfifo(fifo_full)

def writer(path, data):
    # Opens the FIFO for writing; this blocks until a reader opens it, so it only
    # unblocks if the checker reads the FIFO.
    try:
        fd = os.open(path, os.O_WRONLY)
        os.write(fd, data)
        os.close(fd)
    except OSError:
        pass

threading.Thread(target=writer, args=(fifo_full, f"{S}\nrole: x\n{E}\n".encode()), daemon=True).start()

def gate(path):
    try:
        p = subprocess.run([sys.executable, "-I", CHECKER, "role-gate", "--repo", str(repo), "--role", "strategy",
                            "--track", "t", "--phase", "P", "--log-file", str(path)],
                           env=ENV, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=10)
    except subprocess.TimeoutExpired:
        return "TIMEOUT", ""
    lines = [l for l in p.stdout.splitlines() if l.startswith(("FAIL", "PASS")) or "Traceback" in l or "Error" in l]
    return p.returncode, " | ".join(lines)[:200]

cases = [("good file", good), ("bad file", bad), ("folder", folder), ("missing", tmp / "nothing"),
         ("symlink to good file", tmp / "link-good"), ("symlink to bad file", tmp / "link-bad"),
         ("dangling symlink", tmp / "link-dangling"), ("symlink to folder", tmp / "link-folder"),
         ("FIFO, no writer", fifo), ("FIFO with a valid block writer", fifo_full), ("/dev/null", "/dev/null"),
         ("/dev/zero", "/dev/zero"), ("empty string", "")]
for name, path in cases:
    code, out = gate(path)
    print(f"{code} {name}: {out}", flush=True)
