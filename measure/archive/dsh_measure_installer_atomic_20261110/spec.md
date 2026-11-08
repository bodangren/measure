# Specification: DSH Measure installer atomicity

## Overview

`bin/install-measure-skill` is the documented skill writer, and its `put()` writes each
installed file **in place** (`cat -- "$src" >"$dst"`). An interrupted install therefore
leaves a truncated skill file, and the stamp file is written the same way; row 42 of the
tech-debt list records it. The earlier choice preserved inode/hard links, but no test or
documented requirement depends on that, and a truncated skill file breaks the agent.

This track makes each file replacement atomic: write a sibling temporary file with the
source mode and rename it over the target, so an interrupted install leaves the previous
file intact; the stamp file is written the same way; a write failure is a clear error
(exit 3) instead of a `set -e` abort. A new CLI test builds a real fixture repository (the
real installer, a custom targets file, and a small bundle) and proves the behavior: a
read-only target folder fails the install without changing the target (an in-place writer
would have succeeded), no temporary file is left behind, and a normal install reproduces
the source exactly.

## Functional Requirements

- **FR-1 (atomic put).** `put()` writes `"$dst.measure-install.tmp.$$"` in the target's
  folder, applies the source mode, and `mv -f`s it over the target; any failure cleans the
  temporary file and returns non-zero, and callers report `cannot write <path>` and exit 3.
- **FR-2 (atomic stamp).** The stamp file is written through a sibling temporary file and
  renamed; a failure reports the same error instead of a partial stamp.
- **FR-3 (doc).** The installer header states the atomic replacement and the hard-link
  trade-off.
- **FR-4 (test).** `tests/dsh/test-skill-install.sh` (new) covers: install into an empty
  target; content equality and the stamp header; no temporary leftovers; a read-only target
  folder fails the install without changing the target (the atomic path cannot create its
  sibling, where an in-place write would succeed); restoring the mode and re-running with a
  changed source installs the new content; no temporary leftovers after the failure.
- **FR-5 (records).** The installer tech-debt row records the resolved atomicity/log part
  and the untouched shared-skill uninstall design; `CHANGELOG.md` records it; the live check
  passes (no plugin code change).
- **FR-6 (verification).** CLI 14/14 (new test), srg 11/11, node 352/352, both parity gates,
  a registry pass; the track is archived with a manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (bounded).** One temp file per write in the same folder; no new dependency.
- **NFR-2 (no behavior change for normal installs).** Files, modes, stamps, warnings, and
  exit codes are unchanged on the success path.

## Acceptance Criteria (track level)

- Given a read-only target folder, Then the install fails and the target file is unchanged.
- Given a normal install, Then each target equals its source and the stamp is complete.
