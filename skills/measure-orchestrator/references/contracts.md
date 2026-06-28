# Measure Orchestrator Contracts

## Agent Result Block

Every role must end with this block:

```text
MEASURE_AGENT_RESULT
role: <role>
status: complete|blocked|partial
track: <track id>
phase: <phase heading or track setup/review>
commits: <short shas or none>
tests_run: <commands and pass/fail result>
files_changed: <brief list>
plan_updates: <brief summary>
known_failures: <none or exact remaining failures>
handoff: <what the next role or orchestrator should know>
END_MEASURE_AGENT_RESULT
```

Use `blocked` for product judgment, unresolved unrelated dirty work, missing credentials, missing required runtime, or repeated gate failures. Use `partial` only when useful work was committed but the role did not satisfy its gate.

## Audit Result JSON

Audit roles write JSON at the result path supplied by the orchestrator:

```json
{
  "schema_version": 1,
  "status": "pass|fail|inconclusive",
  "summary": "concise evidence-based conclusion",
  "blocking_findings": [],
  "nonblocking_findings": [],
  "evidence": [],
  "commands": [],
  "changed_files": [],
  "test_strategy_violations": [],
  "live_contract_violations": [],
  "prod_wiring_violations": [],
  "route_parity_violations": [],
  "retry_recommendation": "none|retry_tests|retry_implementation|retry_audit|escalate_human|create_remediation_track|infrastructure_retry",
  "confidence": "low|medium|high"
}
```

Only write `status: "pass"` when `blocking_findings` and all `*_violations` arrays are empty. Use `inconclusive` for infrastructure/tooling failures that should not count as acceptance.

UX audits add:

```json
{
  "ux_applicability": "applicable|not_applicable",
  "webbridge_status": "healthy|unhealthy|not_run",
  "webbridge_evidence": {
    "screenshots": [],
    "accessibility_snapshots": [],
    "interactions": []
  }
}
```
