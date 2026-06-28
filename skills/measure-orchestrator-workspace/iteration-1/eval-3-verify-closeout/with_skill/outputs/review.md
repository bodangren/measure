# Eval 3: Verify Closeout

Prompt:

A Measure track claims it is complete. Use the orchestrator skill to verify whether closeout can happen and list the checks that must pass before archiving.

Expected output:

A closeout verification plan that runs final acceptance first, then validates archive location, active registry removal, metadata, plan SHA evidence, closeout manifest, and configured project gates.

Review checks:

- Runs or proposes final acceptance before closeout.
- Uses `measure-closeout` only after acceptance passes.
- Names the closeout script command.
- Checks archive path, active registry removal, metadata status, completion date, and closeout manifest.
