# Specification: DSH Measure shell redirect safety

## Overview

The bounded shell-write grammar misses one documented redirect form: bash's noclobber
override `>|`. Measured on the current adapter, `echo hi >| measure/tracks.md` and
`echo hi >| measure/tracks/…/plan.md` return no write targets, so the closeout deny, the
edit guard, and the strict TDD guard never see the write (the end-of-turn check is only a
backstop). The same grammar also omits `ln`, which writes a destination path exactly like
`cp`/`mv`/`install`.

This track closes both: `>|` becomes a recognized redirect (with the same stream-device and
fd-duplication exclusions as `>`/`>>`), and `ln` joins the destination-word family
(`cp`, `mv`, `install`, `ln`), keeping the `-t`/`--target-directory` residual documented.

## Functional Requirements

- **FR-1 (`>|` redirect).** `redirectTargets` recognizes `>|target` like `>target`:
  `echo hi >| out.txt` contributes `out.txt`, `echo hi >| measure/tracks.md` contributes
  the registry, `/dev/null` stays excluded, `2>|` is the same form, and the heredoc/
  quote/comment masking keeps applying.
- **FR-2 (`ln` destination).** `ln` joins `cp`/`mv`/`install`: the last non-option word is
  the destination write target, and the `-t`/`--target-directory` forms stay with the
  end-of-turn backstop as documented.
- **FR-3 (tests).** `shell.test.js` covers `>|`, `>|` on a registry/plan path, `2>|`,
  `/dev/null`, the quoted/heredoc masking with `>|`, and the `ln` destination (including
  `-t` staying a residual).
- **FR-4 (docs).** The guard README and the DSH guide's bypass-closure section list `>|`
  and `ln`; `CHANGELOG.md` records it; tech-debt shell-grammar row notes the new forms.
- **FR-5 (verification).** node 331+ pass, both parity gates ok, srg 11/11, CLI 13/13, the
  installed plugin reloaded and the live check green, closeout manifest-only FAIL, archive
  pushed.

## Non-Functional Requirements

- **NFR-1 (bounded).** One regex branch and one word in the destination family; no shell
  parser, no new behavior for other commands.
- **NFR-2 (no regression).** `>`, `>>`, `&>`, `tee`, `sed -i`, `cp`, `mv`, `install`, and
  the masking rules keep their present behavior.

## Acceptance Criteria (track level)

- Given `echo hi >| measure/tracks.md`, Then the target is extracted and the closeout
  shell deny fires.
- Given `ln -s target plan.md`, Then the destination is a write target; `ln -t dir` stays
  a residual.
- Given the gates, Then node, parity, srg, and CLI are green, the live check passes, and
  the archive is pushed.
