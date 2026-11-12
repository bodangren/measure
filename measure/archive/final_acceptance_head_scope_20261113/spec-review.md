# Spec Review: final_acceptance_head_scope_20261113

Author model: volcengine-agent-plan/glm-5.3-flash

## Round 1

Date: 2026-11-13
Reviewer: measure-spec-review, volcengine-agent-plan/kimi-k3.1-pro#high

### What this track proposes

The track replaces the current-HEAD rule in the final acceptance role with path-scoped coverage for later commits. It requires path-diff evidence in each final acceptance result. It adds role-document checks and runs five named documentation tests. It updates closeout records, archives the track, and opens a pull request without merging it.

### How the current system works, per this spec

Line 115 of `agents/measure-final-acceptance.md` requires the audited HEAD to equal current HEAD. A later commit from another track therefore blocks final acceptance, even when the track files stay unchanged. The inter-phase checker does not enforce this HEAD rule. The installed role file matches the repository file, and the hourly installer updates it after merge.

### Findings

No findings.

### Author Response
- No findings. After Round 1, the author changed FR-1: the Track scope reference now names `references/contracts.md` of the measure-orchestrator skill, because the role runs in other repositories. Round 2 reviews the change.

## Round 2

Date: 2026-11-13
Reviewer: measure-spec-review, volcengine-agent-plan/kimi-k3.1-pro#high

### What this track proposes

The track replaces the current-HEAD rule in the final acceptance role with path-scoped coverage for later commits. It defines track paths through the Track scope rule in the measure-orchestrator contracts. It requires path-diff evidence in each final acceptance result. It adds role-document checks, runs five documentation tests, updates closeout records, and opens a pull request.

### How the current system works, per this spec

Line 115 of `agents/measure-final-acceptance.md` requires the audited HEAD to equal current HEAD. A later commit from another track therefore blocks final acceptance, even when the track files stay unchanged. The inter-phase checker does not enforce this HEAD rule. The installed role file matches the repository file, and the hourly installer updates it after merge.

### Findings

No findings.
