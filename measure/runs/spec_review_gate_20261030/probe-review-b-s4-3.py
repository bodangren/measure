"""Review B S4 probe 3: the A11 recipe at e8fbd18 on hostile fixtures and on odd document paths."""
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
new_line = [l for l in r0.splitlines() if "[ -f" in l]
print("new line:", new_line)
static = {k: bool(re.search(v, r0)) for k, v in {
    "eval": r"\beval\b", "source": r"\bsource\b", "redirect >": r">", "command substitution $(": r"\$\(",
    "rm/mv/cp/tee/touch/sed -i": r"\b(rm|mv|cp|tee|touch|sed -i)\b"}.items()}
print("static hits:", static)

HOSTILE = ["`-rf/x`", "`--help/x`", "`$(touch PWNED_SUB)/x`", "`a/$(touch PWNED_SUB2)`",
           "`a/`touch PWNED_BT`/b`", "`tests/*.sh`", "`a b/c`", "`../../../../etc/passwd`",
           "`a/b;touch PWNED_SEMI`", "`a/b|touch PWNED_PIPE`", "`a/\x1b[31mred`",
           "`span starts/x", "ends/here`", "`crlf/path`\r", "`exists/file`", "`missing/file`"]


def run(d, script, flags=()):
    before = sorted(os.listdir(d)) + sorted(os.listdir(os.path.join(d, "measure")))
    t = time.time()
    try:
        p = subprocess.run(["bash", *flags, script], cwd=d, capture_output=True, timeout=10)
    except subprocess.TimeoutExpired:
        return "TIMEOUT", "", "", False, 10.0
    after = sorted(os.listdir(d)) + sorted(os.listdir(os.path.join(d, "measure")))
    return p.returncode, p.stdout.decode("utf-8", "replace"), p.stderr.decode("utf-8", "replace"), before == after, time.time() - t


def case(name, setup, flags=()):
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, "measure")); os.makedirs(os.path.join(d, "exists"))
        open(os.path.join(d, "exists/file"), "w").close()
        rp = os.path.join(d, "a11.sh"); open(rp, "w").write(r0)
        setup(d)
        rc, out, err, same, sec = run(d, rp, flags)
        pw = [n for n in os.listdir(d) if n.startswith("PWNED")]
        print("=== %s: exit %s, folder unchanged %s, PWNED %s, %.2fs" % (name, rc, same, pw or "none", sec))
        print(out, end=""); print("stderr:", err.strip() or "(empty)")


def hostile(d):
    body = "\n".join("- " + h for h in HOSTILE) + "\n"
    open(os.path.join(d, "measure/product.md"), "w", newline="").write(body)
    open(os.path.join(d, "measure/tech-stack.md"), "w", newline="").write(body.replace("\n", "\r\n"))


def missing(d):
    open(os.path.join(d, "measure/product.md"), "w").write("`exists/file`\n")


def folder(d):
    os.makedirs(os.path.join(d, "measure/product.md"))
    open(os.path.join(d, "measure/product.md/inner.md"), "w").write("`missing/inner`\n")
    open(os.path.join(d, "measure/tech-stack.md"), "w").write("`exists/file`\n")


def links(d):
    target = os.path.join(d, "outside.md"); open(target, "w").write("`missing/via_link`\n")
    os.symlink(target, os.path.join(d, "measure/product.md"))
    os.symlink(os.path.join(d, "no_such_target.md"), os.path.join(d, "measure/tech-stack.md"))


def fifo(d):
    os.mkfifo(os.path.join(d, "measure/product.md"))
    os.symlink("/dev/zero", os.path.join(d, "measure/tech-stack.md"))


case("hostile text", hostile)
case("missing tech-stack.md", missing)
case("missing tech-stack.md under pipefail", missing, ("-o", "pipefail"))
case("both documents missing", lambda d: None)
case("product.md is a folder", folder)
case("product.md is a symlink to a file; tech-stack.md is a dangling symlink", links)
case("product.md is a FIFO; tech-stack.md is a symlink to /dev/zero", fifo)
with tempfile.TemporaryDirectory() as d:
    os.makedirs(os.path.join(d, "measure"))
    rp = os.path.join(d, "a11.sh"); open(rp, "w").write(r0)
    open(os.path.join(d, "measure/product.md"), "w").write("".join("`p%d/x`\n" % i for i in range(10000)))
    rc, out, err, same, sec = run(d, rp)
    print("=== 10000 claims: exit %s, lines %d, %.2fs" % (rc, out.count("\n"), sec))
sys.exit(0)
