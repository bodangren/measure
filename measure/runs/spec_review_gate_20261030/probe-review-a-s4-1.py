import os
import shutil
import subprocess
import tempfile

ROOT = "/home/daniebo/Desktop/measure"
OLD = "8f584ba"
CAT = "skills/measure-orchestrator/references/anti-pattern-catalog.md"
ANTI = "measure/anti-patterns.md"
PLAN = "measure/tracks/spec_review_gate_20261030/plan.md"
HEADING = "## A11 — Doc-to-code drift after closeout"


def git_show(rev, rel):
    res = subprocess.run(["git", "-C", ROOT, "show", rev + ":" + rel], capture_output=True, text=True, timeout=60)
    return res.stdout.split("\n")


def read_lines(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read().split("\n")


def a11_block(lines):
    idx = None
    for i, line in enumerate(lines):
        if line.strip() == HEADING:
            idx = i
            break
    if idx is None:
        return None, "no heading", None
    start = None
    for j in range(idx, len(lines)):
        if lines[j].strip() == "```bash":
            start = j
            break
    if start is None:
        return None, "no bash fence", None
    end = None
    for k in range(start + 1, len(lines)):
        if lines[k].strip() == "```":
            end = k
            break
    fence_indent = len(lines[start]) - len(lines[start].lstrip())
    body = []
    for line in lines[start + 1:end]:
        n = min(fence_indent, len(line) - len(line.lstrip(" ")))
        body.append(line[n:])
    return body, None, lines[idx:end + 1]


def block_section(lines):
    idx = None
    for i, line in enumerate(lines):
        if line.strip() == HEADING:
            idx = i
            break
    if idx is None:
        return []
    out = []
    for line in lines[idx:]:
        if line.strip() == "---" and out:
            break
        out.append(line)
    return out


def run_recipe(block, cwd, files):
    work = cwd
    tmp = None
    if files is not None:
        tmp = tempfile.mkdtemp(prefix="a11-root-")
        work = tmp
        for rel, text in files.items():
            full = os.path.join(work, rel)
            os.makedirs(os.path.dirname(full), exist_ok=True)
            with open(full, "w", encoding="utf-8") as f:
                f.write(text)
    script_dir = tempfile.mkdtemp(prefix="a11-script-")
    sp = os.path.join(script_dir, "recipe.sh")
    with open(sp, "w", encoding="utf-8") as f:
        f.write("\n".join(block) + "\n")
    res = subprocess.run(["bash", sp], cwd=work, capture_output=True, text=True, timeout=120)
    shutil.rmtree(script_dir, ignore_errors=True)
    if tmp is not None:
        shutil.rmtree(tmp, ignore_errors=True)
    return res.returncode, res.stdout.split("\n"), res.stderr


cat_lines = read_lines(CAT)
anti_lines = read_lines(ANTI)
plan_lines = read_lines(PLAN)
old_cat_lines = git_show(OLD, CAT)

new_block, err1, raw_cat = a11_block(cat_lines)
anti_block, err2, raw_anti = a11_block(anti_lines)
plan_block, err3, raw_plan = a11_block(plan_lines)
old_block, err4, raw_old = a11_block(old_cat_lines)

print("== EXTRACT ==")
print("errors", err1, err2, err3, err4)
print("catalog block lines", len(new_block or []), "anti block lines", len(anti_block or []), "plan block lines", len(plan_block or []), "old block lines", len(old_block or []))
print("catalog vs anti identical (raw section)", block_section(cat_lines) == block_section(anti_lines))
print("catalog vs anti identical (recipe body)", new_block == anti_block)
print("catalog vs plan identical (recipe body, fence indent removed)", new_block == plan_block)
print("== RECIPE TEXT ==")
for line in (new_block or []):
    print("|" + line)
print("== OLD RECIPE TEXT ==")
for line in (old_block or []):
    print("|" + line)
print("old vs new recipe body identical", old_block == new_block)

print("== EXIT AND OUTPUT: LIVE REPO ==")
if new_block:
    rc_new, out_new, err_new = run_recipe(new_block, ROOT, None)
    rc_old, out_old, err_old = run_recipe(old_block or [], ROOT, None)
    print("live new rc", rc_new, "stderr", repr(err_new))
    print("live new candidates", [l for l in out_new if l.strip()])
    print("live old rc", rc_old, "stderr", repr(err_old))
    print("live old candidates", [l for l in out_old if l.strip()])
    print("live candidate sets equal", [l for l in out_new if l.strip()] == [l for l in out_old if l.strip()])

print("== FIXTURES ==")
both_present = {
    "measure/product.md": "# Product\n\n- Uses `measure/anti-patterns.md` for the catalog.\n- Reads `tests/spec_review_gate/run.sh`.\n- Points at `missing/only-here.md` in prose.\n",
    "measure/tech-stack.md": "# Tech\n\n- Config in `measure/tracks.md`.\n- Old path `measure/absent-thing.md`.\n",
}
product_missing = {
    "measure/tech-stack.md": "# Tech\n\n- Config in `measure/tracks.md`.\n",
}
tech_missing = {
    "measure/product.md": "# Product\n\n- Uses `measure/anti-patterns.md`.\n",
}
both_missing = {
    "measure/other.md": "# Other\n",
}
cases = [
    ("both present", both_present),
    ("product missing", product_missing),
    ("tech-stack missing", tech_missing),
    ("both missing", both_missing),
]
for name, files in cases:
    if new_block is None or old_block is None:
        print(name, "no block")
        continue
    rc_new, out_new, err_new = run_recipe(new_block, None, files)
    rc_old, out_old, err_old = run_recipe(old_block, None, files)
    cand_new = [l for l in out_new if l.strip()]
    cand_old = [l for l in out_old if l.strip()]
    print("CASE", name)
    print("  new rc", rc_new, "stderr", repr(err_new), "lines", len(cand_new))
    for l in cand_new:
        print("    new:", l)
    print("  old rc", rc_old, "stderr", repr(err_old), "lines", len(cand_old))
    for l in cand_old:
        print("    old:", l)
    print("  same as old recipe", cand_new == cand_old)

print("== STRUCTURE ==")
print("plan heading present", any(l.strip() == HEADING for l in plan_lines))
print("orphan 'finds only path claims' in catalog", any("finds only path claims and missing documents" in l for l in cat_lines))
print("orphan 'finds only path claims' in anti", any("finds only path claims and missing documents" in l for l in anti_lines))
print("orphan 'finds only path claims' in plan", any("finds only path claims and missing documents" in l for l in plan_lines))
