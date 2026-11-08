# gate timing: load and blowup evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The flake

While archiving the commit-wrapper track the S4 adversarial suite failed G5 at 5.62 s against the fixed 5 s constant while another suite ran; no code regression (the suite passed alone). A new tech-debt row recorded it and this track fixes the class.

## Calibrated budget (S4 G5)

The A11 recipe runs on a tenth-size fixture, then the 10k budget is `max(20, calibration x 10 x 5)` seconds and the message prints both. Idle:

```
time: calibration 0.123s for 1000/document -> budget 20.0s; 10000 path claims in each document: 1.254s, candidate lines: 20000
PASS: G5 time: 10000 path claims in each document end in less than 20 seconds (calibrated)
```

## Load proof (eight busy loops beside the suite)

```
time: calibration 0.564s for 1000/document -> budget 28.2s; 10000 path claims in each document: 5.137s, candidate lines: 20000
PASS: G5 time: ... less than 28 seconds (calibrated)
```

5.137 s would have failed the old fixed 5 s constant; the calibrated budget is 28.2 s on the loaded machine.

## Blowup still caught

A recipe stub with a per-line `sleep 0.0006` (a stand-in for per-item work) timed out at the 10 s `RUN_TIMEOUT` (rc None), so the G5 condition fails: the budget catches algorithmic blowups, not scheduler noise. The S3 G18 budget is 30 s (a quadratic loop or per-item subprocess is orders of magnitude slower; the old quadratic `any(...)` mutant was killed by it).

## Live check

No plugin code changed; the installed-copy check still passes:

```
PASS live: HTTP 200 with a band field; digest matches the installed copy
```

## Generated-artifact fix (found live during this track)

`bin/measure-dsh --check --live` failed `skill-orchestrator: incomplete copy ... missing scripts/__pycache__/...` because a closeout run recreated the repository bytecode cache; `skill_check` now prunes `__pycache__`/`*.pyc` from the expected list (the installer copies tracked files from the ref), and `tests/dsh/test-check.sh` pins the case. The live check then passed:

```
PASS live: HTTP 200 with a band field; digest sha256:0809cb69a4b4f97d3 matches the installed copy
```
