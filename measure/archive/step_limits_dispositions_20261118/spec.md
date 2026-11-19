# Specification: Step limits and dispositions

## Overview

The PM raised the step limits in the live agent files in a prior session. The repo source still holds the old limits. The installer copies the source with no transform. The source must match the live files.

Separately, the dispositions checker accepts only `F` finding IDs. Review findings also use other letter IDs. The checker must accept them.

Source: PM request 2026-11-18, two items.

## Decided change

Item 1: set the `steps:` field of each source file in `agents/measure-*.md` to the live value:

- reviews A/B/C, adversarial, jr-green, ux-browser: 96
- mid-red, phase-acceptance, final-acceptance, closeout: 80
- strategy: 72
- spec-review: 64
- orchestrator, orchestrator-audit: unchanged

Take only the step-limit change. Report any other live difference instead of folding it.

Item 2: widen the dispositions item regex in `skills/measure-orchestrator/scripts/measure_interphase_checks.py` so a finding ID is an uppercase letter followed by digits. Keep the existing `F` ID behavior.

## Tests

Item 1: run `tests/spec_review_gate/test_s2_role_docs.sh` and each grep hit for the limit field in `tests/`. Fix the source only where the step limit requires it.

Item 2: add cases under `tests/spec_review_gate/` for a dispositions line with `M1` and with mixed IDs. Confirm the new cases fail. Then change the regex and keep the old `F` behavior.

Then run the full `tests/spec_review_gate/run.sh` suite once through the heavy-run wrapper. Run `bin/install-measure-skill --ref chore/step-limits-dispositions --check` and report its output.
