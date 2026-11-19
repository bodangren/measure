# Specification: Guard UX browser route

## Overview

The spawn-route guard has no entry for `measure-ux-browser-review`, so the
spawn passes with a warning. It must map to the `review-c` role for text
checks, and also accept the `vision-review` role when the brief reads
pictures.

Source: PM add-on, 2026-11-18 (from the Math report).

## Decided change

In `ROLE_OF_AGENT`, map `measure-ux-browser-review` to `review-c`.
`KNOWN_ROLES` already holds `vision-review`. Change all three copies:

- `mods/measure-guard/hooks/guards.ts`
- `plugins/dsh-measure-guard/src/core/guards.ts`
- `plugins/opencode-measure-guard/src/core/guards.ts`

## Picture-brief rule (design default)

The brief "reads pictures" when the spawn prompt holds one of these,
case-insensitive: `screenshot`, `image`, `picture`, `.png`, `vision`.
Then the approved list is the union of the `review-c` and `vision-review`
routes. Otherwise only `review-c`. Read how the guard reads the prompt and
the model today (role-spawn code near `ROLE_OF_AGENT`) and follow its style.

## Tests

Extend the role-spawn tests of all three packages first:

- ux-browser-review with a text brief accepts a `review-c` route
- ux-browser-review with a text brief refuses a `vision-review`-only route
- ux-browser-review with a picture brief accepts a `vision-review` route

Confirm they fail, then change. Run each package test command, both
`scripts/check-parity.sh`, and the mod test command.

## Records

Add a short `CHANGELOG.md` line. It records the picture-keyword default.
No test counts in CHANGELOG, spec, or plan.
