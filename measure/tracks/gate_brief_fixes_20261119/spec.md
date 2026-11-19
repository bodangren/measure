# Specification: Gate brief fixes

## Overview

The Graph Phase 5 report names four gaps in the role gates and the role briefs. The mid-red gate rejects a Red round that only closes adversarial test gaps, because the new tests already pass. Reviewers omit the `END_MEASURE_AGENT_RESULT` line, because no brief states the exact block form. Some role results still use the old `findings` key, and the checker rejects them. The dispositions regex accepts only single-letter IDs, but routed findings use compound and slug IDs.

Source: PM request 2026-11-19, four items, due 11-21.

## Decided change

Item 1: allow a gap-closing Red round. The role declares `red_kind: gap_closing` in its result block and lists the gaps. It records proof that each new test fails when the covered code is broken. The proof is a recorded mutation or a neutralized-code run. The gate then expects the Red command to pass. Every other Red round keeps the rule that tests must fail first.

Item 2: state the exact result block form in every audit role brief and in `contracts.md`. Name the opening `MEASURE_AGENT_RESULT` line, the fields, and the closing `END_MEASURE_AGENT_RESULT` line. Name the exact missing line in the gate message when the end line is absent, and show the form.

Item 3: accept a legacy `findings` list with a warning that names the new keys (`blocking_findings` and `nonblocking_findings`). Map each entry by its severity tag the way the contract says. Reject only an entry that carries no severity tag, with a clear message.

Item 4: widen the dispositions ID pattern to every form found in the Desktop repos' `measure/runs/` logs that names a finding. Keep rejecting the malformed forms.

## Tests

Item 1: add a Red gate suite under `tests/spec_review_gate/` that covers a gap-closing round and the normal failing-first round. Item 2: add a suite that covers a log with a start line but no end line. Item 3: add a suite that covers a mappable legacy list and an unmappable entry. Item 4: add a suite that covers each found form and each malformed form.

Confirm each new suite fails before the change. Then change the checker, the briefs, and the contract. Then run the full `tests/spec_review_gate/run.sh` suite and `tests/dsh/test-registry.sh` through the heavy-run wrapper.
