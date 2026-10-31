"""Review A probe 2: dispositions_feedback over every real log under measure/runs/."""
import importlib.util
import sys
from pathlib import Path

ROOT = Path("/home/daniebo/Desktop/measure")
CHECKER = ROOT / "skills/measure-orchestrator/scripts/measure_interphase_checks.py"
spec = importlib.util.spec_from_file_location("mic", str(CHECKER))
mic = importlib.util.module_from_spec(spec)
sys.modules["mic"] = mic
spec.loader.exec_module(mic)

feedback_logs = []
total = 0
for log in sorted((ROOT / "measure/runs").rglob("*.log")):
    total += 1
    fb = mic.dispositions_feedback(str(log))
    if fb:
        feedback_logs.append((str(log.relative_to(ROOT)), fb))

print(f"logs scanned: {total}")
print(f"logs with feedback: {len(feedback_logs)}")
for path, fb in feedback_logs:
    print(path, fb)

# The known real dispositions line must pass.
r3 = ROOT / "measure/runs/spec_review_gate_20261030/jr-green-s2-r3.log"
text = r3.read_text(encoding="utf-8", errors="ignore")
line = [ln for ln in text.splitlines() if ln.strip().startswith("dispositions:")]
print("jr-green-s2-r3.log dispositions line:", line)
print("feedback for jr-green-s2-r3.log:", mic.dispositions_feedback(str(r3)))
sys.exit(1 if feedback_logs or not line else 0)
