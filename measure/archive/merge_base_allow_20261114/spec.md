# Specification: Merge base allow

## Overview

Eight audit role files hold the shell deny rule `*git merge*`. The pattern also
matches the read-only command `git merge-base`. Acceptance roles therefore
cannot run `git merge-base --is-ancestor A B`. The final acceptance of the
Graph project (round 2) used `git rev-list --count HEAD..X` as a work-around
on 2026-11-14.

The eight files, each with the rule at lines 42 to 44:

- `agents/measure-final-acceptance.md`
- `agents/measure-phase-acceptance.md`
- `agents/measure-review-a-correctness.md`
- `agents/measure-review-b-security.md`
- `agents/measure-review-c-ux-api.md`
- `agents/measure-orchestrator-audit.md`
- `agents/measure-spec-review.md`
- `agents/measure-ux-browser-review.md`

Source: PM request, 2026-11-14.

## Functional Requirements

- **FR-1 (the role files).** In each of the eight files, the `*git merge*` deny
  rule stays unchanged. Directly after it, the file gets this rule:

  ```
  - action: shell
    resource: "git merge-base *"
    effect: allow
  ```

  No other permission line changes. Reasons, from
  https://opencode.ai/v2/docs/permissions/ :

  - "OpenCode combines rules in order and uses the last match." The allow comes
    after the deny, so the allow wins for a `git merge-base` command.
  - "A shell pattern ending in ` *` also matches the command without arguments."
  - The shell resource is a "Scanner-produced command string; compound commands
    may produce several", and "Any `deny` denies the operation". So
    `git merge-base A B && git merge X` is still refused.
  - The allow has no leading `*`. So a command such as
    `git merge X git merge-base Y` still ends on the deny.
  - The later write denies (`* > *`, `* >*`, `*>>*`, and the others) stay after
    the new rule, so they still win over it.
  - A narrower deny such as `*git merge *` is rejected: it would let
    `git merge-file` run, and `git merge-file` writes files.

- **FR-2 (the new S2 section).** `tests/spec_review_gate/test_s2_role_docs.sh`
  gets one new section after the section "audit roles narrow the redirect deny
  so 2>&1 is not blocked" and before the `# Edge checks` block. The section
  uses the existing `AUDIT_ROLES` list and the existing `rules()` function. For
  each role, the section evaluates the shell rules in order with the OpenCode
  V2 rules: whole-value wildcard match (`*` is zero or more characters, `?` is
  one character, other characters are literal; the evaluation strips the quotes
  of the resource); a pattern that ends in " *" also matches the value without
  that suffix; the last matching rule gives the effect; no match gives ask. For
  each of the eight roles, the section asserts:

  - `git merge-base --is-ancestor A B` gives allow
  - `git merge X` gives deny
  - `git merge-file a b c` gives deny

  The S2 test already requires that the shell rules of
  `agents/measure-spec-review.md` equal the shell rules of
  `agents/measure-review-a-correctness.md`. The eight files must get the same
  rule at the same place.

- **FR-3 (the checks).** `bash tests/spec_review_gate/run.sh` exits 0.
  `bash tests/dsh/test-registry.sh` exits 0.

- **FR-4 (the light lane).** `metadata.json` declares `"lane": "light"`,
  because this track runs no final acceptance. The closeout check then fails
  only on the missing closeout manifest, as in the last light-lane track.

- **FR-5 (the records).** `CHANGELOG.md` gets one entry at the top of
  "## Unreleased" / "### Bug Fixes", with no test count. `README.md` line 33
  gets a new first sentence that names "Merge base allow" as the latest
  archived track, with the date 2026-11-14 and a short reason in brackets. The
  rest of line 33 stays unchanged.

## Acceptance Criteria

- The new S2 section fails before the fix: `git merge-base --is-ancestor A B`
  gives deny in all eight roles.
- The new S2 section passes after the fix.
- `bash tests/spec_review_gate/run.sh` exits 0.
- `bash tests/dsh/test-registry.sh` exits 0.
- The closeout check fails only on the missing closeout manifest.
- `CHANGELOG.md` gets one entry at the top of "## Unreleased" / "### Bug
  Fixes".
- `README.md` line 33 names "Merge base allow" as the latest archived track,
  with the date 2026-11-14 and a short reason in brackets.

## Out of scope

The installed copies in `~/.config/opencode/agents/` and `~/.agents/agents/`
(the orchestrator installs them after Daniel merges); the live check; other
deny patterns, for example `git -C <dir> merge`; a merge into main.
