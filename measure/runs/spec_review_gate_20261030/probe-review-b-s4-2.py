"""Review B S4 probe 2: the S4 Red suite writes nothing in the repository."""
import hashlib, os, subprocess, sys

ROOT = "/home/daniebo/Desktop/measure"
SELF_DIR = os.path.join(ROOT, "measure/runs/spec_review_gate_20261030")


def snapshot():
    out = {}
    for base, dirs, files in os.walk(ROOT):
        if base == ROOT:
            dirs[:] = [x for x in dirs if x != ".git"]
        for n in files:
            p = os.path.join(base, n)
            try:
                st = os.lstat(p)
            except OSError:
                continue
            out[os.path.relpath(p, ROOT)] = (st.st_size, st.st_mtime_ns)
        for n in dirs:
            p = os.path.join(base, n)
            out[os.path.relpath(p, ROOT) + "/"] = (0, os.lstat(p).st_mtime_ns)
    return out


def git_status():
    return subprocess.run(["git", "-C", ROOT, "status", "--porcelain", "--ignored", "--untracked-files=all"],
                          capture_output=True, text=True).stdout


s0, g0 = snapshot(), git_status()
p = subprocess.run(["bash", "tests/spec_review_gate/test_s4_doc_drift.sh"], cwd=ROOT, capture_output=True, text=True, timeout=120)
s1, g1 = snapshot(), git_status()
print("suite exit:", p.returncode)
print(p.stdout.strip().splitlines()[-1])
print("git status unchanged:", g0 == g1)
added = sorted(set(s1) - set(s0)); removed = sorted(set(s0) - set(s1))
changed = sorted(k for k in set(s0) & set(s1) if s0[k] != s1[k])
print("added:", added or "none"); print("removed:", removed or "none"); print("changed:", changed or "none")
print("files scanned:", len(s0))
sys.exit(0)
