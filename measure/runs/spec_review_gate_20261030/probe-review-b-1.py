import os, subprocess, sys, tempfile, time, importlib.util
from pathlib import Path

CHECKER = "/home/daniebo/Desktop/measure/skills/measure-orchestrator/scripts/measure_interphase_checks.py"
ENV = dict(os.environ, GIT_CONFIG_GLOBAL="/dev/null", GIT_CONFIG_NOSYSTEM="1")
S, E = "MEASURE_AGENT_RESULT", "END_MEASURE_AGENT_RESULT"
BAD, GOOD = "dispositions: F1=BOGUS", "dispositions: F1=FIX; F2=CONTEST(x)"

tmp = tempfile.mkdtemp(prefix="rb_probe_")
repo = Path(tmp) / "repo"
(repo / "measure/tracks/t").mkdir(parents=True)
(repo / "measure/index.md").write_text("# M\n")
(repo / "measure/tracks.md").write_text("# T\n")
(repo / "measure/tracks/t/test-strategy.md").write_text("# S\n")
(repo / "measure/tracks/t/plan.md").write_text("# P\n")
subprocess.run(["git", "init", "-q"], cwd=repo, env=ENV, check=True)

def gate(data: bytes):
    log = Path(tmp) / "x.log"
    log.write_bytes(data)
    p = subprocess.run([sys.executable, "-I", CHECKER, "role-gate", "--repo", str(repo), "--role", "strategy",
                        "--track", "t", "--phase", "P", "--log-file", str(log)],
                       env=ENV, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    lines = [l for l in p.stdout.splitlines() if l.startswith(("FAIL", "PASS")) or "Traceback" in l or "Error" in l]
    return p.returncode, " | ".join(lines)[:160]

def L(*ls, sep="\n"):
    return (sep.join(ls) + sep).encode("utf-8")

cases = {
    "control bad": L(S, "role: x", BAD, E),
    "control good": L(S, "role: x", GOOD, E),
    "old trailing start": L(S, "role: x", BAD, E, S),
    "old inner start": L(S, "role: x", BAD, S, E),
    "old inner start fields": L(S, "role: x", BAD, S, "status: complete", E),
    "start bad start end end": L(S, BAD, S, "role: x", E, E),
    "start end bad end": L(S, "role: x", E, BAD, E),
    "two dispositions lines": L(S, "dispositions: none", BAD, E),
    "two valid lines": L(S, "dispositions: none", "dispositions: none", E),
    "nested S S bad E E": L(S, S, BAD, E, E),
    "two blocks first invalid": L(S, BAD, E, S, GOOD, E),
    "two blocks second invalid": L(S, GOOD, E, S, BAD, E),
    "bad block then empty block": L(S, BAD, E, S, E),
    "end before start": L(E, S, "role: x", BAD, E),
    "end before start, no later end": L(E, S, BAD),
    "end only": L(BAD, E),
    "line after end (Red case)": L(S, "role: x", E, BAD),
    "line after end then start": L(S, "role: x", E, BAD, S),
    "CRLF": L(S, "role: x", BAD, E, sep="\r\n"),
    "CR only": L(S, "role: x", BAD, E, sep="\r"),
    "end trailing spaces": L(S, BAD, E + "   \t"),
    "start trailing spaces": L(S + "  ", BAD, E),
    "disp leading spaces": L(S, "    " + BAD, E),
    "disp leading tab": L(S, "\t" + BAD, E),
    "Dispositions capital": L(S, "Dispositions: F1=BOGUS", E),
    "dispositions space colon": L(S, "dispositions : F1=BOGUS", E),
    "cyrillic E in end": L(S, BAD, "ЕND_MEASURE_AGENT_RESULT", "text END_MEASURE_AGENT_RESULT"),
    "cyrillic M in start, real end": L("МEASURE_AGENT_RESULT", BAD, E),
    "cyrillic o in prefix": L(S, "dispоsitions: F1=BOGUS", E),
    "fullwidth colon": L(S, "dispositions： F1=BOGUS", E),
    "BOM start line 1": b"\xef\xbb\xbf" + L(S, BAD, E),
    "NUL after start": L(S + "\x00", BAD, E),
    "start in line": L("x " + S, BAD, E),
    "U+2028 before disp": L(S, "role: x " + BAD, E),
    "U+0085 split": L(S, "role: x\u0085" + BAD, E),
    "VT before disp": L(S, "role: x\x0b" + BAD, E),
    "FF in end line": L(S, BAD, "\x0c" + E),
    "NBSP before end": L(S, BAD, " " + E),
    "ZWSP before end": L(S, BAD, "​" + E),
    "invalid utf8 in value": L(S, "dispositions: F1=FI", E).replace(b"FI\n", b"FI\xffX\n"),
    "CONTEST with U+2028": L(S, "dispositions: F1=CONTEST(a b)", E),
    "md fence quoted block then real": L("```", S, "dispositions: F1=FIX", E, "```", S, GOOD, E),
}
for name, data in cases.items():
    code, out = gate(data)
    print(f"{code} {name}: {out}")

# timing: direct calls of dispositions_feedback
spec = importlib.util.spec_from_file_location("mic", CHECKER)
mod = importlib.util.module_from_spec(spec)
sys.modules["mic"] = mod
spec.loader.exec_module(mod)
def timed(name, text):
    log = Path(tmp) / "big.log"
    log.write_text(text, encoding="utf-8")
    t = time.perf_counter()
    fb = mod.dispositions_feedback(str(log))
    print(f"time {name}: {time.perf_counter() - t:.3f}s feedback={fb[:1]}")
timed("ends then starts 5k/5k", (E + "\n") * 5000 + (S + "\n") * 5000)
timed("ends then starts 20k/20k", (E + "\n") * 20000 + (S + "\n") * 20000)
timed("1M starts one end", (S + "\n") * 1000000 + E + "\n")
timed("500k blocks", (S + "\n" + E + "\n") * 500000)
timed("start, 2M lines", S + "\n" + "x\n" * 2000000 + E + "\n")
timed("200k disp lines", S + "\n" + (BAD + "\n") * 200000 + E + "\n")
