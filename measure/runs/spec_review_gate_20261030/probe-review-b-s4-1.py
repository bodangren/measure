"""Review B S4 probe 1: the A11 recipe on hostile fixture text, in a temporary folder only."""
import os, re, subprocess, sys, tempfile, time

ROOT = "/home/daniebo/Desktop/measure"
CATS = [os.path.join(ROOT, "skills/measure-orchestrator/references/anti-pattern-catalog.md"),
        os.path.join(ROOT, "measure/anti-patterns.md")]


def recipe(path):
    text = open(path, encoding="utf-8").read()
    block = text.split("## A11 — Doc-to-code drift after closeout", 1)[1].split("\n---\n", 1)[0]
    return block.split("```bash\n", 1)[1].split("\n```", 1)[0] + "\n"


r0, r1 = recipe(CATS[0]), recipe(CATS[1])
print("recipes identical:", r0 == r1)
print("--- recipe ---"); print(r0, end="")
static = {k: bool(re.search(v, r0)) for k, v in {
    "eval": r"\beval\b", "source": r"\bsource\b|^\s*\.\s", "redirect >": r">",
    "command substitution $(": r"\$\(", "backtick substitution": r"`[^']*`(?![^']*')",
    "rm/mv/cp/tee": r"\b(rm|mv|cp|tee|touch|sed -i)\b", "unquoted $p": r"[^\"]\$p\b"}.items()}
print("static hits:", static)

HOSTILE = [
    "`-rf/x`", "`--help/x`", "`-e/x`",
    "`$(touch PWNED_SUB)/x`", "`a/$(touch PWNED_SUB2)`", "`a/`touch PWNED_BT`/b`",
    "`tests/*.sh`", "`a b/c`", "`../../../../etc/passwd`", "`../no_such_dir_zz/x`",
    "`a/b;touch PWNED_SEMI`", "`a/b|touch PWNED_PIPE`", "`a/b&&touch PWNED_AND`",
    "`a/\x1b[31mred`", "`span starts here/x", "and ends/here`",
    "`crlf/path`\r", "`exists/file`", "`missing/file`", "`a/b\\nc`",
]
with tempfile.TemporaryDirectory() as d:
    os.makedirs(os.path.join(d, "measure"))
    os.makedirs(os.path.join(d, "exists"))
    open(os.path.join(d, "exists/file"), "w").close()
    body = "\n".join("- item " + h for h in HOSTILE) + "\n"
    with open(os.path.join(d, "measure/product.md"), "w", newline="") as f:
        f.write(body)
    with open(os.path.join(d, "measure/tech-stack.md"), "w", newline="") as f:
        f.write(body.replace("\n", "\r\n"))
    rp = os.path.join(d, "a11.sh")
    open(rp, "w").write(r0)
    before = sorted(os.listdir(d))
    p = subprocess.run(["bash", rp], cwd=d, capture_output=True, timeout=10)
    after = sorted(os.listdir(d))
    print("exit:", p.returncode)
    print("stdout:"); print(p.stdout.decode("utf-8", "replace"), end="")
    print("stderr:", p.stderr.decode("utf-8", "replace") or "(empty)")
    print("folder unchanged:", before == after, after)
    pwned = [n for n in after if n.startswith("PWNED")]
    print("PWNED markers:", pwned or "none")
    print("ESC byte in stdout:", b"\x1b" in p.stdout, "CR byte in stdout:", b"\r" in p.stdout)

    # time limit: 10,000 path claims
    with open(os.path.join(d, "measure/product.md"), "w") as f:
        f.write("".join("`p%d/x`\n" % i for i in range(10000)))
    t = time.time()
    p = subprocess.run(["bash", rp], cwd=d, capture_output=True, timeout=30)
    print("10000 claims: exit", p.returncode, "lines", p.stdout.count(b"\n"), "seconds %.2f" % (time.time() - t))
sys.exit(0)
