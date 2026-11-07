# Specification: DSH Measure allow-list parse hardening

## Overview

The allow-list parser (`parseAllowList` in the shared core) deduplicates folders
with `folders.includes(folder)` inside the line loop — O(n²) for a wide list —
and accepts entries containing control characters, so a binary or NUL-corrupted
`measure/guard-allow` can put a nonsensical path into the allow list. The
tech-debt row records both as availability/operator risks.

This track makes the dedupe O(n) with a `Set`, ignores entries containing a
control character with an explicit reason, and pins both with tests (plus a wide
list count check). The wide-list memory cap stays an accepted operator risk.

## Functional Requirements

- **FR-1 (linear dedupe).** The parser keeps one copy of each joined folder using a
  visited set; the result order is the first-seen order, and duplicates are not
  reported as ignored entries (they are the same folder).
- **FR-2 (control characters).** An entry containing a C0 control character
  (U+0000–U+001F) is ignored with the reason `has a control character`, so a NUL
  or binary-corrupted list cannot admit a path.
- **FR-3 (the tests).** `plugins/dsh-measure-guard/tests/core.test.js` gains:
  `src/` three times (plain, `./src/`, duplicate) yields one folder;
  `bi\x00nary/` is ignored with `has a control character`; a 2000-line list of
  distinct folders yields 2000 folders (a count check, not a timing assertion).
- **FR-4 (records).** The `guard_allow_list_20261101` dedupe/binary row is updated:
  the O(n²) and binary entry items are resolved, and the wide-list size remains
  the accepted operator risk; `CHANGELOG.md` has a bug-fix entry.
- **FR-5 (verification).** node suite 315/315, both parity gates ok (the core is
  shared, so `check-parity.sh` must stay green), CLI 13/13, srg 11/11.

## Non-Functional Requirements

- **NFR-1 (bounded).** One additional regex test per entry; no new dependency.
- **NFR-2 (contract preserved).** Valid entries, ignored reasons, order, and the
  `AllowList` shape are unchanged; the shared-core parity stays byte-identical.

## Acceptance Criteria (track level)

- Given a list with duplicate folders, Then one folder is kept in first-seen
  order.
- Given an entry with a NUL, Then it is ignored with `has a control character`.
- Given the gates, Then node 315/315, CLI 13/13, srg 11/11, parity ok; each phase
  checkpoint is pushed.

## Out of Scope

- A memory cap for an extremely wide list (accepted operator risk).

> **Follow-up note (2026-11-09, before the review):** the control-character rule
> intentionally supersedes the OpenCode adapter's V6 (CR-only line ends) and V7
> (NUL in an entry) expectations: both entries are now ignored with `has a control
> character`, and the two cases were updated. The ordered ignore-rule tables in
> `mods/measure-guard/README.md` and `plugins/opencode-measure-guard/README.md`
> list the control-character rule as order 1 (the later rules shift to 2–6).
