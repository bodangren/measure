# Eval 2: Prepare Role Prompts

Prompt:

Convert the next Measure phase into delegated work: prepare prompts for Red, Green, and phase acceptance agents, including model-specific agent names and gate commands. Do not run the agents.

Expected output:

Three role-specific prompts that point to the correct subagent files, preserve write boundaries, require `MEASURE_AGENT_RESULT`, and include the role-gate commands for Mid, Jr, and Phase Acceptance.

Review checks:

- Uses `measure-mid-red`, `measure-jr-green`, and `measure-phase-acceptance`.
- Includes baseline SHA and phase heading placeholders.
- Requires `MEASURE_AGENT_RESULT` for each role.
- Includes `role-gate` commands with `--role mid-red`, `--role jr-green`, and `--role phase-acceptance`.
