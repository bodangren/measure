# Specification: DSH Measure apply_patch visibility

## Overview

The DSH guard's closeout check reads the plan and registry *after* a write to verify
markers, so it needs the text the call will leave behind. `edit` and `write` provide it,
but `apply_patch` and `str_replace_editor` do not: `normalizeMutation` returns their paths
with no after-text, and `afterTextToolDeny` fails closed — the tools are denied even when
the patch is legitimate. That is a documented blind spot in the shared adapter surface
(the goal's "apply_patch/shell-write" gap): safe, but it blocks valid work and hides a
check that could run.

This track reconstructs the after-text of those two tools with a bounded, fail-closed
applier (and the existing `applyEdit` semantics for `str_replace_editor`), so the
closeout guard verifies them like `edit`/`write` and only denies when the reconstruction
is unavailable. It also closes the matching shell-write gap: the bounded grammar sees redirects, `tee`,
and `sed -i`, but not `cp`, `mv`, or `install`, so `cp /tmp/p plan.md` reaches a plan
without the closeout deny (the registry and plan deny itself already exists for the
recognized forms).

## Functional Requirements

- **FR-1 (bounded applier).** `hooks.js` reconstructs, from an `apply_patch` input, the
  after-text of each `*** Add File:`, `*** Delete File:`, and `*** Update File:` in the
  patch: add gives its `+` lines, delete gives the empty text, update applies the `@@`
  hunks against the current text with exact context matching; a hunk that does not apply
  yields no after-text (fail closed). Duplicate target paths are applied once each, in
  order.
- **FR-2 (str_replace_editor).** The after-text is reconstructed for `create`
  (`file_text`), `str_replace` (`old_str` → `new_str`), and `insert` (`insert_line`),
  reusing the core's `applyEdit` semantics where they agree; a call that cannot be
  reconstructed yields no after-text.
- **FR-3 (closeout guard).** `afterTextToolDeny` denies only when the after-text is
  unavailable; when it is available, the closeout guard runs on it (a legitimate
  `apply_patch`/`str_replace_editor` edit of a plan whose markers stay valid is allowed; a
  patch that removes the active task marker is denied).
- **FR-4 (shell-write grammar).** A shell command whose `cp`, `mv`, or `install` writes a
  `measure/tracks.md` or a `measure/**/plan.md` is denied by the existing closeout shell
  rule (the same message the redirect/`tee`/`sed -i` forms give); the `-t`/`--target-directory`
  forms stay with the end-of-turn backstop instead of a guess. Other `measure/` targets
  keep their current behavior.
- **FR-5 (verification).** node suite (grammar + reconstruction + closeout cases), both
  parity gates, srg 11/11, CLI 13/13; installed-plugin behavior checked on the live Host;
  records (READMEs, tech-debt rows, CHANGELOG, evidence) updated.

## Non-Functional Requirements

- **NFR-1 (bounded).** No shell parser and no general diff engine: exact context matching,
  one heredoc-free format, no fuzz factor; anything unrecognized fails closed.
- **NFR-2 (parity).** The shared core files stay byte-identical across the three adapters
  (the parity gates decide).

## Acceptance Criteria (track level)

- Given an `apply_patch` that adds, updates, or deletes a plan file, Then the closeout
  guard sees the after-text and allows a marker-preserving patch and denies a marker-breaking
  one.
- Given an `str_replace_editor` `create`/`str_replace`/`insert`, Then the after-text is
  reconstructed; a `view` stays a non-mutation.
- Given an apply_patch hunk whose context does not match, Then the call is denied as
  unreadable rather than allowed or checked against stale text.
- Given `cp`, `mv`, or `install` writing a plan or the registry, Then it is denied with the
  use-edit-or-write message, while `-t` forms stay documented as the backstop.
- Given the gates, Then node, parity, srg, CLI are green and the checkpoint is pushed.
