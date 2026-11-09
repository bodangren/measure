# Specification: Guard phase start

Author model: claude-code/claude-opus-5-5 (Claude family).

## Overview

The PM sent this request on 2026-11-09. The PM's words:

> What: measure-guard refused a task status edit ('[ ]' to '[~]' of Task 6.1) in Workbooks track storytime_l2_unit2_20261106, plan.md, because the Phase 5 heading has no checkpoint yet. Starting a task in a phase that has no checkpoint is the normal case, so this is a false block. The Workbooks role then made the edit through the shell, outside the guard (recorded). Why: a false block teaches roles to go around the guard, and that loses the guard's protection. Done when: the guard allows a task status change to [~] or [x] in a phase with no checkpoint (it can still block an invented checkpoint marker), with a test, and the fix is installed. Date: by 11-12. Reply: one status line when it is installed.

The change removes the phase-start rule from the closeout guard. After the change, the guard allows each task status change in `plan.md`, also when an earlier phase has no `[checkpoint: <sha>]`. The track-close part of the closeout guard does not change.

## Current system

- `mods/measure-guard/hooks/guards.ts`, `phaseStartDecision(context, before, after)`: in guard and strict modes, it denies a `plan.md` edit that changes a task to `[~]` in phase N+1 while the heading of phase N has no `[checkpoint: <sha>]`. The deny text is `measure-guard: "<phase N+1>" cannot start, because the heading of "<phase N>" has no [checkpoint: <sha>]. ...`. A task that was `[~]` before the edit does not count. A change to `[x]` is not checked.
- The rule has three call sites. They are the closeout functions of the Claude Code mod (`mods/measure-guard/hooks/register.tsx`), the OpenCode plugin (`plugins/opencode-measure-guard/src/guard.ts`), and the DSH plugin (`plugins/dsh-measure-guard/src/guard.js`). For a `plan.md` edit, each function calls only `phaseStartDecision`.
- `plugins/opencode-measure-guard/src/core/guards.ts` and `plugins/dsh-measure-guard/src/core/guards.ts` are copies of the mod file. Each plugin has a `scripts/check-parity.sh` that fails when its copy differs from the source.
- No guard checks a `[checkpoint: <sha>]` marker against the commits of the repository.
- The Workbooks plan of `storytime_l2_unit2_20261106` has dated phases that overlap: Phase 5 (2026-12-01 to 2026-12-08) and Phase 6 (2026-12-01 to 2026-12-09). Phase 5 has no started task and no checkpoint. Task 6.1 can start now, and the rule denied it.
- On this machine, `bin/install-measure-skill` installs the OpenCode plugin to `~/.config/opencode/plugins/opencode-measure-guard/`. The DSH plugin is not installed (`bin/measure-dsh --check` reports the plugin as missing). The mod loads with `claude --plugin-dir` and has no install target.

## Decisions

- **D1 (remove the rule).** `phaseStartDecision` and its call sites go away. The guard does not check the order of phases. Reason: a plan can have phases that run at the same time, and the guard cannot know this from the plan. The orchestrator gates still check each phase of an orchestrated track (the `role-gate` phase check and the phase acceptance).
- **D2 (plan.md edits).** After D1, the closeout guard checks only edits of `tracks.md`. Each adapter returns "allow" for a `plan.md` edit before it reads the file.
- **D3 (no new checkpoint check).** The PM's request permits a block of an invented checkpoint marker. The guard has no such check today, and this track adds none.
- **D4 (shared core).** The change goes into the mod source first. The two plugin copies get the change by the copy rule of each parity check.
- **D5 (distribution).** The change lands on the local `main`. `bin/install-measure-skill` installs the OpenCode plugin and the docs of the skills. The DSH plugin stays not installed. Nothing is pushed without the PM's word.

## Functional requirements

- **FR-1.** `mods/measure-guard/hooks/guards.ts` has no `phaseStartDecision`. An import that only this function used goes away.
- **FR-2.** The closeout functions of the mod, the OpenCode plugin, and the DSH plugin do not call `phaseStartDecision`. They return allow for a `plan.md` edit (D2).
- **FR-3.** The two plugin copies of `guards.ts` follow the source, and each `check-parity.sh` passes.
- **FR-4.** The docs that describe the rule state the new behavior: the README of the mod, of the OpenCode plugin, and of the DSH plugin, and `skills/measure-orchestrator/references/dsh.md`. `CHANGELOG.md` gets one entry.

## Acceptance criteria

- **AC-1 (the PM case, OpenCode).** In `plugins/opencode-measure-guard/tests/closeout.test.ts`, a plan has Phase 5 with only `[ ]` tasks and no checkpoint, and Phase 6 with `- [ ] Task 6.1: Song audio`. In guard mode and in strict mode, `onToolBefore` of an `edit` that changes the line to `- [~] Task 6.1: Song audio` resolves with no deny.
- **AC-2 (the old case, OpenCode).** The old case of the `phase start` block (Task 2.1 of the fixture plan with no checkpoint in the plan) now expects `onToolBefore` to resolve with no deny for `[~]` and for `[x]`.
- **AC-3 (the mod).** In `mods/measure-guard/tests/closeout.test.ts`, the old case `a task in phase N+1 cannot start before phase N has a checkpoint` becomes `a task in phase N+1 can start or close before phase N has a checkpoint`. The `Edit` to `[~]` and the `Edit` to `[x]` of `Task: Two` each get no deny.
- **AC-4 (the DSH plugin).** In `plugins/dsh-measure-guard/tests/closeout.test.js`, the old case `starting a task in phase N+1 without a checkpoint is denied naming the phase` becomes `a task in phase N+1 can start or close without a checkpoint`. `closeoutGuardFor` gives `decision` `null` for the `[~]` and the `[x]` edit.
- **AC-5 (the track close).** The old track-close cases of the three suites pass with no change.
- **AC-6 (the suites).** `bun test`, `bun x tsc --noEmit -p .`, and `check-parity.sh` of the OpenCode plugin; `claude plugin test mods/measure-guard`; and `node --test tests/*.test.js` with `check-parity.sh` of the DSH plugin pass. The only allowed failure is the old V18 case of the OpenCode plugin (tech-debt row of 2026-11-09).
- **AC-7 (install).** `bin/install-measure-skill` exits 0, and `bin/install-measure-skill --check` exits 0. The installed `src/core/guards.ts` and `src/guard.ts` equal `main`, and the installed guard has no `phaseStartDecision`.

## Out of scope

- A check that a `[checkpoint: <sha>]` marker names a real commit (D3).
- The shell-write guard of the DSH plugin still denies a shell write to `plan.md` and tells the role to use `edit` or `write`. That tool then works.
- The Workbooks plan and its recorded shell edit. This repository does not write in the Workbooks repository.

## Known limits

- The guard no longer stops a role that starts the next phase before it runs the checkpoint protocol of the previous phase. For an orchestrated track, the orchestrator gates still stop it.
