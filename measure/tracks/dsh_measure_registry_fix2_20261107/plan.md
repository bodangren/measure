# Implementation Plan: DSH Measure registry consolidation

Track: `dsh_measure_registry_fix2_20261107`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: One layout and full descriptions [checkpoint: 6ec2ef8]

- [x] Task 1.1: rebuild `measure/tracks.md` — Active section, Cancelled section (the four cancelled directories with their reasons and links), and Archived Tracks with every other archive directory exactly once as `title / *Link:* / one description` (the full `metadata.json` description, collapsed to one line); remove the old single-link entries and the duplicate `visual_refresh` entry `8dc44d9`
- [x] Task 1.2: verify the result with a one-off count (archive directories = entries across the file = entries in Archived + cancelled), record it, and confirm the active and cancelled text is unchanged otherwise `8dc44d9`
- [x] Task: Measure - User Manual Verification 'Phase 1: One layout and full descriptions' (Protocol in workflow.md) `6ec2ef8`

## Phase 2: The hardened checker [checkpoint: a42c993]

- [x] Task 2.1: `tests/dsh/test-registry.sh` takes the registry path and archive directory (sensible defaults), and enforces own-link, one-description-attribution (directly after the entry's link), no-orphan-description, exactly-one-entry-per-directory across the file (including cancelled), and at-most-one-active; each rule has a synthetic negative fixture (missing description, orphan description, missing link, duplicate entry, unreferenced directory) built in its own archive directory `8dc44d9`
- [x] Task 2.2: run `bash tests/dsh/test-registry.sh`, the node suite (301/301), both parity scripts, and `bash tests/dsh/run.sh`; record the results `8dc44d9`
- [x] Task: Measure - User Manual Verification 'Phase 2: The hardened checker' (Protocol in workflow.md) `a42c993`

## Phase 3: Record corrections and gates

- [x] Task 3.1: correct `measure/archive/dsh_measure_registry_20261107/{spec.md,plan.md,metadata.json}` (full-description rule, the cancelled exemption, the SHA trail pointing at `b314321` for the rebuild) and add its `spec-review.md` with the review's findings and one disposition each
- [ ] Task: Measure - User Manual Verification 'Phase 3: Record corrections and gates' (Protocol in workflow.md)

## Phase 4: Closeout

- [ ] Task 4.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_registry_fix2_20261107` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 4: Closeout' (Protocol in workflow.md)
