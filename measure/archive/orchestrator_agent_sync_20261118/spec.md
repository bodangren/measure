# Specification: Orchestrator agent sync

## Overview

The installed copy `~/.config/opencode/agents/measure-orchestrator.md` holds a PM-accepted edit (2026-11-18, item 3). The repo source `agents/measure-orchestrator.md` still holds the old text. The installer copies the source file with no transform. The source must match the live file.

Source: PM decision 2026-11-18, item 3. Route every role from `ra-quota pick`. Ark plans are out.

## Decided change

Copy the four live hunks into `agents/measure-orchestrator.md`:

- Plan tiers: mark both Ark plans as out per Daniel 2026-11-16.
- Role models: route every role by pick, with the `phase-acceptance`, `acceptance`, and `record` roles.
- Substitution: route each role from `ra-quota pick <role> --why` with `--not-family` flags. Never pass a table default.
- One-off coder models: route the migration, feature, and visual shapes by `ra-quota pick coder`.

Change no other line. Change no live file.

## Tests

Run `tests/spec_review_gate/test_s2_role_docs.sh`. It pins the orchestrator agent file. Fix the source only where the PM edit requires it. Report each change.

Run `bin/install-measure-skill --ref chore/orchestrator-agent-sync --check`. Report exit code and output.
