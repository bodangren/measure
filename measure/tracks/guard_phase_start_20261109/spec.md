# Specification: Guard phase start

Author model: claude-code/claude-opus-5-5 (Claude family).

## Overview

The PM sent this request on 2026-11-09. The PM's words:

> What: measure-guard refused a task status edit ('[ ]' to '[~]' of Task 6.1) in Workbooks track storytime_l2_unit2_20261106, plan.md, because the Phase 5 heading has no checkpoint yet. Starting a task in a phase that has no checkpoint is the normal case, so this is a false block. The Workbooks role then made the edit through the shell, outside the guard (recorded). Why: a false block teaches roles to go around the guard, and that loses the guard's protection. Done when: the guard allows a task status change to [~] or [x] in a phase with no checkpoint (it can still block an invented checkpoint marker), with a test, and the fix is installed. Date: by 11-12. Reply: one status line when it is installed.

The change makes the phase-start rule of the closeout guard a note, not a deny. After the change, the guard allows each task status change in `plan.md`, also when an earlier phase has no `[checkpoint: <sha>]`. When a task of phase N+1 starts while phase N has no checkpoint, the agent gets a note that names the checkpoint protocol. The track-close part of the closeout guard does not change.

## Current system

- `mods/measure-guard/hooks/guards.ts`, `phaseStartDecision(context, before, after)`: in guard and strict modes, it denies a `plan.md` edit that changes a task to `[~]` in phase N+1 while the heading of phase N has no `[checkpoint: <sha>]`. The deny text is `measure-guard: "<phase N+1>" cannot start, because the heading of "<phase N>" has no [checkpoint: <sha>]. ...`. A task that was `[~]` before the edit does not count. A change to `[x]` is not checked.
- The rule has three call sites. They are the closeout functions of the Claude Code mod (`mods/measure-guard/hooks/register.tsx`), the OpenCode plugin (`plugins/opencode-measure-guard/src/guard.ts`), and the DSH plugin (`plugins/dsh-measure-guard/src/guard.js`). For a `plan.md` edit, each function calls only `phaseStartDecision`.
- `plugins/opencode-measure-guard/src/core/guards.ts` and `plugins/dsh-measure-guard/src/core/guards.ts` are copies of the mod file. Each plugin has a `scripts/check-parity.sh` that fails when its copy differs from the source.
- Each closeout function already returns `{ decision, note }`, and each adapter gives the note of an allowed call to the agent: the mod in `context` of the tool result, the OpenCode plugin in the tool result, and the DSH plugin in the post-execute append. The track-close `[b]` list uses this channel today.
- No guard checks a `[checkpoint: <sha>]` marker against the commits of the repository.
- The Workbooks plan of `storytime_l2_unit2_20261106` has dated phases that overlap: Phase 5 (2026-12-01 to 2026-12-08) and Phase 6 (2026-12-01 to 2026-12-09). Phase 5 has no started task and no checkpoint. Task 6.1 can start now, and the rule denied it.
- On this machine, `bin/install-measure-skill` installs the OpenCode plugin to `~/.config/opencode/plugins/opencode-measure-guard/`. The DSH plugin is not installed (`bin/measure-dsh --check` reports the plugin as missing). The mod loads with `claude --plugin-dir` and has no install target.

## Decisions

- **D1 (a note, not a deny).** `phaseStartDecision` becomes `phaseStartNote(context, before, after): string | null`. It finds the phase with the same rule as before: the first phase N+1 with a task that is `[~]` after the edit and not before it, while the heading of phase N has no `[checkpoint: <sha>]`. It gives the note text, and `null` when no phase matches, in advise mode, and with the bypass. The guard does not deny a task status change. Reason: a plan can have phases that run at the same time, and the guard cannot know this from the plan. The note keeps the reminder of the checkpoint protocol. The orchestrator gates still check each phase of an orchestrated track.
- **D2 (the note text).** The note is:

  ```text
  measure-guard: "<phase N+1>" starts while the heading of "<phase N>" has no [checkpoint: <sha>]. This is correct when the two phases run at the same time. When "<phase N>" is complete, run the Phase Completion Verification and Checkpointing Protocol in measure/workflow.md for it.
  ```

  `<phase N+1>` and `<phase N>` are the phase titles without the checkpoint marker. Each closeout function returns `{ decision: null, note: phaseStartNote(...) }` for a `plan.md` edit. The adapters give the note to the agent only when the call does not fail, as for the `[b]` list.
- **D3 (no new checkpoint check).** The PM's request permits a block of an invented checkpoint marker. The guard has no such check today, and this track adds none.
- **D4 (shared core).** The change goes into the mod source first. The two plugin copies get the change by the copy rule of each parity check.
- **D5 (distribution).** The change lands on the local `main`. `bin/install-measure-skill` installs the OpenCode plugin and the docs of the skills. The DSH plugin stays not installed. Nothing is pushed without the PM's word.

## Functional requirements

- **FR-1.** `mods/measure-guard/hooks/guards.ts` has `phaseStartNote` (D1, D2) and no `phaseStartDecision`.
- **FR-2.** The closeout functions of the mod (`register.tsx`), the OpenCode plugin (`src/guard.ts`), and the DSH plugin (`src/guard.js`) call `phaseStartNote` for a `plan.md` edit and return its text as the note, with no decision (D2).
- **FR-3.** The two plugin copies of `guards.ts` follow the source, and each `check-parity.sh` passes.
- **FR-4.** These docs state the new behavior: the README of the mod, of the OpenCode plugin, and of the DSH plugin, item 6 of `mods/measure-guard/DESIGN.md`, and item 3 of `skills/measure-orchestrator/references/dsh.md`. `CHANGELOG.md` gets one entry.

## Acceptance criteria

`<note>` below is the D2 text for the phases of the case.

- **AC-1 (the PM case, OpenCode).** In `plugins/opencode-measure-guard/tests/closeout.test.ts`, the plan of the fixture track gets Phase 5 with only `[ ]` tasks and no checkpoint, and Phase 6 with `- [ ] Task 6.1: Song audio`. In guard mode and in strict mode, `onToolBefore` of an `edit` that changes the line to `- [~] Task 6.1: Song audio` resolves with no deny. `onToolAfter` of the completed call gives a result that contains `<note>` for Phase 6 and Phase 5.
- **AC-2 (the old case, OpenCode).** The old case of the `phase start` block (Task 2.1 of the fixture plan with no checkpoint in the plan) expects `onToolBefore` to resolve with no deny and the result to contain `<note>`. A change of the same line to `[x]` resolves, and its result has no `measure-guard: "` phase note.
- **AC-3 (the mod).** In `mods/measure-guard/tests/closeout.test.ts`, the old case `a task in phase N+1 cannot start before phase N has a checkpoint` becomes `a task in phase N+1 can start before phase N has a checkpoint, with a note`. The `Edit` to `[~]` of `Task: Two` gets no deny, and its `context` contains `<note>` for `Phase 2: B` and `Phase 1: A`. With the checkpoint on `Phase 1: A`, the same `Edit` gets no deny and no phase note. An `Edit` to `[x]` gets no deny and no phase note.
- **AC-4 (the DSH plugin).** In `plugins/dsh-measure-guard/tests/closeout.test.js`, the old case `starting a task in phase N+1 without a checkpoint is denied naming the phase` becomes `starting a task in phase N+1 without a checkpoint passes with a note`. `closeoutGuardFor` gives `decision` `null` and a `note` equal to `<note>` for `Phase 2: Adapter` and `Phase 1: Skeleton`. The `[x]` edit gives `decision` `null` and `note` `null`. The old case `starting a task in phase N+1 with a checkpoint passes` also asserts `note` `null`.
- **AC-5 (the track close).** The old track-close cases of the three suites pass with no change.
- **AC-6 (the suites).** These commands pass:
  - In `plugins/opencode-measure-guard`: `bun test`, `bun x tsc --noEmit -p .`, and `bash scripts/check-parity.sh`. The only allowed failure is the old V18 case (tech-debt row of 2026-11-09).
  - In the repository root: `claude plugin test mods/measure-guard`.
  - In `plugins/dsh-measure-guard`: `node --test tests/*.test.js` and `bash scripts/check-parity.sh`.
- **AC-7 (install).** `bin/install-measure-skill` exits 0, and `bin/install-measure-skill --check` exits 0. The installed `src/core/guards.ts` and `src/guard.ts` equal these files at the commit that the install stamp `.measure-install` names, and that commit is the `main` of the install.

## Out of scope

- A check that a `[checkpoint: <sha>]` marker names a real commit (D3).
- A note in advise mode or with the bypass (D1 keeps the old mode rule).
- The shell-write guard of the DSH plugin still denies a shell write to `plan.md` and tells the role to use `edit` or `write`. That tool then works.
- The Workbooks plan and its recorded shell edit. This repository does not write in the Workbooks repository.

## Known limits

- The guard no longer stops a role that starts the next phase before it runs the checkpoint protocol of the previous phase. The note tells the role, and for an orchestrated track the orchestrator gates still stop it.
