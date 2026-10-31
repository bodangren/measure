# Spec Review: skill_doctor_fixes_20261031

Author model: claude-code/claude-opus-5-5[1m]

## Round 1

Date: 2026-10-31
Reviewer: coder, kimi-code-plan-cn/k3.1-pro#high

### What this track proposes
This chore shortens the `measure` and `build-graph` skill descriptions. It replaces a directory link with eight file links, moves orchestrator usage guidance, and removes harness-specific delegation syntax. It keeps the Claude bundle equal to the canonical Measure skill, then verifies, merges, installs, and archives the track.

### How the current system works, per this spec
The canonical Measure skill and Claude bundle contain long descriptions and a directory link. The orchestrator skill puts usage guidance after four sections and names OpenCode 1 delegation syntax. The `build-graph` description costs about 240 tokens in each Claude Code turn. The installer copies skills from `main` into user skill folders.

### Findings
- F1 [Major] plan.md Phase 2: Add normal and edge acceptance checks for Phase 2. Rationale: Task 2.1 has no acceptance check, and Phase 2 names no edge case.

### Author Response
- F1: FIX

## Round 2

Date: 2026-10-31
Reviewer: coder, kimi-code-plan-cn/k3.1-pro#high

### What this track proposes
This track shortens the `measure` and `build-graph` skill descriptions to reduce validation findings and context cost. It replaces a directory link with eight file links, moves and renames the orchestrator quick-start section, and removes harness-specific delegation wording. It then validates both skill bundles, archives the track, merges the branch, installs the skills, and checks the new context costs.

### How the current system works, per this spec
The current `measure` description exceeds the Agent Skills limit and has the highest listing context cost among loaded skills. The `build-graph` description also has a high context cost, while `measure-orchestrator` lacks recognized usage guidance and names OpenCode 1 delegation syntax. The `measure` skill links a styleguide directory, and the installer distributes the canonical skills and bundle after merge.

### Findings
- None
