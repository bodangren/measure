# Specification: DSH Measure limits documentation

## Overview

Six open rows are Host/runtime constraints rather than fixable defects: the guard root comes
from the working directory (a subagent with a `cwd` keeps the parent session's root, and
`dsh --profile headless` cannot host the plugin), the TDD/commit guards are name-based, the
OpenCode 2.0.32 plugin has three runtime limits (the synthetic command reply arrives with
the next prompt, the end-of-turn trigger runs on `session.execution.*` with a 1-second
debounce because `session.idle` does not reach plugin subscriptions, and `multiedit` is
listed though 2.0.32 has no such tool), and an extremely wide allow list costs memory. The
DSH README documents some limits but not the root/allow-list ones, and the OpenCode README
documents none; a user cannot see these constraints.

This track makes the constraints visible: the DSH README's Known limits gains the root
resolution and allow-list memory bullets, the OpenCode README gains a Known limitations
section with its three runtime limits, `test-docs.sh` pins both sections (a heading and at
least two bullets; a fixture without the section is rejected), and the six rows become
`Resolved` as documented constraints, so an operator reads the limit in the adapter's own
documentation instead of the project's tech-debt list.

## Functional Requirements

- **FR-1 (DSH limits).** `plugins/dsh-measure-guard/README.md` Known limits gains: (a) the
  root comes from the working directory, a subagent with a `cwd` keeps the parent session's
  root (its project is outside the guard), and a headless profile cannot host the plugin
  (the band and panel are web-client surfaces); (b) an extremely wide allow list is read
  into memory (an operator file; the memory cost is the operator's).
- **FR-2 (OpenCode limits).** `plugins/opencode-measure-guard/README.md` gains
  `## Known limitations (OpenCode 2.0.32)` with the three runtime constraints, each naming
  the workaround or the recheck condition.
- **FR-3 (doc pin).** `tests/dsh/test-docs.sh` checks both adapter READMEs: the limits
  section exists with at least two bullets, and a fixture copy with the section removed is
  rejected.
- **FR-4 (rows).** The six rows become `Resolved` with the document reference and the
  reason the constraint is accepted (or the recheck condition).
- **FR-5 (records).** `CHANGELOG.md` records the documentation; the live check passes (no
  plugin code change).
- **FR-6 (verification).** node 354/354, both parity gates, srg 12/12, CLI 14/14 (with the
  new doc checks); the track is archived with a manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (no behavior change).** Documentation, one test, and records only.
- **NFR-2 (honest).** Each row names the constraint and its mitigation; nothing is claimed
  as fixed that was not.

## Acceptance Criteria (track level)

- Given the DSH README, Then it names the root/headless and allow-list memory limits.
- Given the OpenCode README, Then it names its three 2.0.32 limits.
- Given a fixture missing the limits section, Then the docs test fails.
