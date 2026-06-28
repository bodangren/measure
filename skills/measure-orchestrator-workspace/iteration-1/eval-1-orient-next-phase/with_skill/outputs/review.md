# Eval 1: Orient Next Phase

Prompt:

Use the Measure orchestrator to inspect this repo, identify the next incomplete phase, and describe exactly which subagent should run first and which mechanical check follows it. Do not edit files.

Expected output:

A repo-aware orchestration plan that reads Measure routing artifacts, selects the next phase from script output, names the correct subagent file, and names the exact inter-phase check command.

Review checks:

- Reads or instructs reading `measure/index.md`, `measure/tracks.md`, `spec.md`, and `plan.md` before acting.
- Uses `measure_interphase_checks.py status` to choose the next phase.
- Names one of the `~/.agents/agents/measure-*.md` subagents as the first delegated role.
- Does not propose editing product files during orientation.
