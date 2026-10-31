import sys, tempfile, time, importlib.util
from pathlib import Path

CHECKER = "/home/daniebo/Desktop/measure/skills/measure-orchestrator/scripts/measure_interphase_checks.py"
S, E = "MEASURE_AGENT_RESULT", "END_MEASURE_AGENT_RESULT"
spec = importlib.util.spec_from_file_location("mic6", CHECKER)
mod = importlib.util.module_from_spec(spec)
sys.modules["mic6"] = mod
spec.loader.exec_module(mod)
log = Path(tempfile.mkdtemp(prefix="rb_probe6_")) / "big.log"
log.write_text(S + "\ndispositions: " + "F1=FIX; " * 6000000 + "\n" + E + "\n", encoding="utf-8")
for _ in range(2):
    t = time.perf_counter()
    fb = mod.dispositions_feedback(str(log))
    print(f"one 50 MB line in block: {time.perf_counter() - t:.3f}s {fb[:1]}", flush=True)
