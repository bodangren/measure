# Specification: Installer adopt and guard exception

## Overview

The installer keeps a target with a local edit. No flag adopts it when the target already matches the source. The guard blocks writes under `~/.config` with no `[~]` task, so the installer needs a fake track.

## Decided change

Item A: extend `bin/install-measure-skill` with `--adopt-matching`. A plain install adopts by default when `dst` equals `src` (line 229 already updates the stamp). The flag makes the adopt explicit and `--check` hints at it. Report `adopted <path>` for each adopted file.

Item B: let a shell command that runs `bin/install-measure-skill` pass the guard with no active track. Other writes under `~/.config` stay blocked. Change all three `guards.ts` copies and keep parity.

Note: `agents/measure-spec-review.md` lines 16-19 already hold the spec-review edit rules (PR #34). Change nothing there.

## Tests

Installer tests under `tests/` with temp HOME. Guard tests in all three packages: installer command passes with no track, `cp` into `~/.config/opencode/agents` still blocks. Then `bun test`, parity scripts, `node --test`, `claude plugin test`, installer tests, and the two heavy-run suites.
