# Spec Review: dsh_measure_dev_20261107

Author model: deepseek-flash

Reviewed before implementation by three independent fresh reviewers from three
model families, each with no conversation history and no sight of the other
reports (standing directive for this session). Each reviewer followed
`skills/measure/references/spec-review.md` and wrote one round. Finding ids are
prefixed per reviewer (`A-`, `B-`, `C-`); the Author Response lines use the same
prefixed id. Review artifacts:
`measure/runs/dsh_measure_dev_20261107/spec-review-*.md`.

## Round 1 — Reviewer A

Date: 2026-11-07
Reviewer: MiniMax-M3.1-Flash (fresh subagent)
Report: `measure/runs/dsh_measure_dev_20261107/spec-review-minimax-m3.1-flash.md`

### What this track proposes

This track turns the hand-wired DeepSeek Harness setup on this workstation into a repeatable Measure development environment. It adds a POSIX bash CLI, `bin/measure-dsh`, that installs, checks and uninstalls one managed profile row plus the skill and plugin copies; eight Measure workflow slash commands (`measure-setup` … `measure-orchestrate`) registered by the existing `plugins/dsh-measure-guard` host plugin, each steering exactly one instruction message into the receiving agent; a `skills/measure-orchestrator/references/dsh.md` mapping of the Measure roles onto DSH subagents and the profile's model list; and a `docs/dsh.md` guide, a README/CHANGELOG entry, and a live migration of this machine's profile. The design fixes the CLI flags, exit codes and output format, the managed-block format and parsing, the check items and their pass conditions, the command messages, and the reference lookup roots; the plan names the test file and the normal and edge cases per task. The track does not change DSH, the installer contract, the skill content, or the guard's decision semantics.

### How the current system works, per this spec

Measure today ships as skills, 14 agent roles, a Claude Code mod and an OpenCode 2 plugin, and the DSH side is a single hand-written row in `~/.dsh/profiles/web/cordis.patch.yml` that points at the working tree with `mode: advise`; `bin/install-measure-skill` owns every skill and plugin target, reads them from a git ref, and copies them into `~/.claude/skills`, `~/.agents/skills` and `~/.dsh/profiles/web/plugins/dsh-measure-guard`, while the installed `measure` copy on this machine holds only `SKILL.md` and `measure-orchestrator` is absent from `~/.agents/skills`. The DSH plugin already registers three commands, the `measure_status` tool and the JSON route `GET /measure-guard/state`, and the platform supports the proposed surface: `ctx.commands.register` hands the receiving `Agent` to the handler and its result kinds are `success`/`error`, `agent.steer()` starts a turn on an idle driver (the `/plan [message]` precedent), the skill roots are `<projectRoot>/.dsh/skills`, `<projectRoot>/.agents/skills`, `<dshHome>/skills` and `<agentsHome>/skills`, and a patch-relative `./plugins/...` row is converted to a file URL whose client half is found through the nearest `package.json`. What is missing is the scripting, the verification, and the documentation around that hand-wiring: the mode, the incomplete skill copy and the absent workflow commands are each fixed by hand, and nothing tells a user whether an installation can develop with Measure.

### Findings

- A-F1 [Blocker] design.md §2 (install order, "Skill step delegation") with spec.md FR-2(c): the installer's DSH target is hard-coded to `~/.dsh/profiles/web/plugins/dsh-measure-guard` (`bin/install-targets.tsv:18`) and the installer takes neither `$DSH_HOME` nor a profile argument, so `measure-dsh install --profile X` writes the plugin copy into the `web` profile under `~/.dsh` while the managed block goes into profile `X`, and `--dsh-home Y` leaves the copy outside the effective home entirely. Rationale: the design states the target as `plugins/dsh-measure-guard -> <profile>/plugins/dsh-measure-guard` and promises "The plugin copy therefore exists after step 4"; the installation contradicts that for every value except the default, so the CLI's own flags produce an environment that `--check` then reports as broken.
- A-F2 [Blocker] spec.md FR-2(c) against design.md §2 ("Skill step delegation"): the spec has `measure-dsh` copy `plugins/dsh-measure-guard/` (without `tests/`) into the resolved profile and stamp it with `.measure-install`, while the design has `measure-dsh` copy nothing and lets the installer's target row produce the copy. Rationale: the two statements name two different writers for one file, and the stamp format (`ref`, `commit`, `installed_at`, `bundle`, per-file hashes; `bin/install-measure-skill:258-266`) is the installer's own, so the implementer must choose a writer the other document forbids.
- A-F3 [Blocker] plan.md Phase 3 Task 3.2 against Phase 4 Task 4.1 and design.md §7 rows 3-4: `tests/dsh/test-docs.sh` must resolve "every link in the guide", but `docs/dsh.md` is only created in Phase 4, and Phase 4 names no test file and no test case although design §7 gives Phase 4 the README, CHANGELOG and guide checks. Rationale: the phase gate `bash tests/dsh/run.sh` cannot pass at the end of Phase 3, and the Phase-4 checks land in no task.
- A-F4 [Major] spec.md FR-5 and the Acceptance Criteria against design.md §2 (`--prune`) and plan.md Task 1.4: the spec requires `uninstall` to remove "the managed block and the installed plugin copy it owns", while the design makes the copy removal opt-in behind `--prune`, a flag that FR-1's list never mentions. Rationale: the CLI shape is a Zero-Decision item and the two documents give opposite defaults for the same command.
- A-F5 [Major] design.md §8 (live migration): the first migration step, `bin/install-measure-skill --ref HEAD`, cannot install the plugin copy on this machine. Rationale: the installer skips a target whose immediate parent folder is missing (`bin/install-measure-skill:180-183`) and `~/.dsh/profiles/web/plugins/` does not exist, so the copy appears only later, inside `measure-dsh install` (design §2 step 3); the migration as written deletes the working hand-written row before any copy exists and claims the standalone installer step installs it.
- A-F6 [Major] design.md §5 ("The reference file is located under …"): the lookup names `~/.agents/skills/measure` and then `~/.claude/skills/measure` as two roots, and names no root at all for the orchestrator `SKILL.md` that `measure-orchestrate` points at. Rationale: on this machine `~/.agents/skills` is a symlink to `~/.claude/skills`, so the two roots are one directory, while the installer writes the orchestrator only to `~/.agents/skills/measure-orchestrator/` (`bin/install-targets.tsv:6`); the eighth command's guard-rail lookup and the "two roots" completeness rule are therefore undecided and, as written, would read the same directory twice.
- A-F7 [Major] design.md §5 (handler guard rails) with spec.md FR-7: the design does not say how a handler decides that "the session's project has no `measure/` folder", and fixes the exact text only for the missing-reference case. Rationale: the plugin already exposes two different answers, `deps.rootOf` (canonical work-tree root) and `deps.dirOf` (session directory) at `plugins/dsh-measure-guard/index.js:38-48`, and they differ for a linked worktree, so FR-7's rail has no defined subject or message.
- A-F8 [Major] spec.md FR-10 with design.md §8 (live evidence): the live proof depends on the loader re-importing the row whose `name` changed from the working-tree path to the profile-relative copy, and the fallback — a host restart — ends the operator's live session at `127.0.0.1:3080`, in which the track's own Phase-5 evidence cannot be produced. Rationale: the plugin README documents only that deleting a block recomposes through HMR and that host module files are not watched (`hmr.root: []`), and the previous track's live check used the absolute working-tree row, so the profile-relative row's re-import is unproven; the track must state the fallback it will use when the recomposition does not happen.
- A-F9 [Nit] spec.md NFR-5 against FR-4: NFR-5 states that "the script makes no network call", while `--check --live` performs an HTTP GET to the local profile. Rationale: the loopback route check is a network call, so NFR-5 should say "no external network call" or FR-4 should carve it out.
- A-F10 [Nit] design.md §4 (`skill-measure`): the check re-implements the installer's per-file missing-file detection in bash. Rationale: `bin/install-measure-skill --check` already reports `missing <path>` for every source file the target lacks (`bin/install-measure-skill:210-212`); if the working-tree comparison is why it cannot be reused, the design should say so.
- A-F11 [Nit] plan.md Task 1.2: `tests/dsh/run.sh`, the runner that every phase gate calls, is not named as a file to create; the task names only `tests/dsh/lib.sh` and `tests/dsh/test-install.sh` although design §1 lists the runner. Rationale: the Zero-Decision Check asks each phase to name the files it creates.
- A-F12 [Nit] spec.md FR-2(e) against design.md §2 step 6 and design.md §8: the checklist makes "restart DSH" the one operator action, while §8 states that the migration needs no restart because the module URL changed. Rationale: the checklist text and the migration note disagree about when the restart is actually required.
- A-F13 [Nit] design.md §4 (`live`): the route needs a session id and answers 404 for an unknown one, but nothing says where the operator gets a valid id. Rationale: `GET /measure-guard/state?sessionId=<id>` resolves the id through `ctx.agents.get` (`plugins/dsh-measure-guard/src/client-state.js:42-46`), so the check item should name the source of the id.

### Author Response

- A-F1: FIX (design.md §0 records one writer per artefact: the CLI copies into the resolved profile; the installer keeps only the skill targets; FR-2 and the new FR-11 remove the installer's DSH plugin row)
- A-F2: FIX (spec FR-2 and design.md §0/§2 agree: `bin/measure-dsh` is the plugin-copy writer with its own `.measure-dsh-install` stamp; the CLI no longer delegates that copy to the installer)
- A-F3: FIX (plan Phase 3 now owns only `tests/dsh/test-reference.sh`; the guide and `tests/dsh/test-docs.sh` are Phase 4 tasks, so every phase gate can pass)
- A-F4: FIX (spec FR-1/FR-5 and design.md §2: `uninstall` removes the owned copy by default; `--keep-copy` opts out; `--prune` is removed)
- A-F5: FIX (design.md §8: back up the patch, run the installer for the skills only, then `measure-dsh install`, which creates the parent and copies the plugin after the hand-written row is removed; no step claims the installer writes the plugin)
- A-F6: FIX (design.md §4: one root order with realpath de-duplication covers both skills; design.md §5 resolves the orchestrator reference by skill name `<measure-orchestrator>/SKILL.md`)
- A-F7: FIX (design.md §5 fixes the rail's subject (`deps.rootOf` + `deps.snapshots`) and the exact error text)
- A-F8: FIX (FR-10 and design.md §8 state that Phase 5 proves the re-import and records either outcome; the restart fallback is the recorded operator action, and the evidence then uses the file, record, and loaded-instance route checks)
- A-F9: FIX (NFR-5 now says "no external network call"; `--check --live` reads only the loopback route)
- A-F10: FIX (design.md §4 states why the installer's `--check` is not reused: it compares against a git ref, not the working tree, and the DSH row is removed in this track)
- A-F11: FIX (plan Task 1.2 names `tests/dsh/run.sh` and `tests/dsh/lib.sh` explicitly)
- A-F12: FIX (design.md §2/§8: the checklist's restart note is for host-code edits; the migration's new URL is expected to re-import, and Phase 5 records whether it did)
- A-F13: FIX (design.md §4: the live id is `--session`, else `$DSH_SESSION_ID`, else the item is `SKIP` with the hint)

## Round 1 — Reviewer B

Date: 2026-11-07
Reviewer: MiMo-V2.6-Pro (fresh subagent)
Report: `measure/runs/dsh_measure_dev_20261107/spec-review-mimo-v2.6-pro.md`

### What this track proposes

PENDING

### How the current system works, per this spec

PENDING

### Findings

PENDING

### Author Response

PENDING

## Round 1 — Reviewer C

Date: 2026-11-07
Reviewer: Kimi-K3.1-Pro (fresh subagent)
Report: `measure/runs/dsh_measure_dev_20261107/spec-review-k3.1-pro.md`

### What this track proposes

The track turns a hand-wired DeepSeek Harness setup into a repeatable Measure development environment: a POSIX CLI that installs, checks and uninstalls one managed profile row plus the skill and plugin copies, eight Measure workflow commands in the existing guard plugin, a DSH agent-team reference for the Measure roles, a guide, and a human-gated live migration.

### How the current system works, per this spec

`bin/install-measure-skill` owns every skill and plugin target, reads them from a git ref, and copies them with `cat >` plus a per-file hash stamp, appending a log under `~/.local/state/measure`; DSH loads skills from project and user roots, commands from `ctx.commands.register` with the receiving Agent available to a handler, and profile patches from `cordis.patch.yml`, where a comments-only document is not a valid patch.

### Findings

- C-F1 [Blocker] spec.md FR-2/NFR-2; design.md §2 install order: The mandatory unchanged installer cannot satisfy the write invariants: `put()` uses `cat >` and stamps use direct redirection (`bin/install-measure-skill:158-166,258-266`), and every install appends `$HOME/.local/state/measure/install.log` outside the permitted roots (`:280-285`), while uninstall deliberately keeps skill writes.
- C-F2 [Blocker] design.md §2; plan.md Tasks 1.2-1.3: `--source` is described as overriding the plugin source for both install and check and is assigned to the install implementation, but the install usage and spec omit it; the text also does not establish whether `DIR` is a repository root or a plugin directory or how it selects the skill-comparison source.
- C-F3 [Blocker] design.md §2 Output; plan.md Task 1.3: `--json` fixes only the top-level keys `ok`, `items[]`, and `actions[]`; neither the item nor action element schema is defined.
- C-F4 [Blocker] spec.md FR-2/FR-4/FR-5; design.md §2 Copy stamp: The design keeps a user-edited file during install but does not say what hash enters the new stamp, how removed source files are handled, or which edited files uninstall may delete, while check requires every stamped hash to match.
- C-F5 [Blocker] design.md §3; plan.md Task 1.4: The foreign-row parser misses valid YAML such as `- { id: measure-guard, name: other }`.
- C-F6 [Blocker] spec.md FR-5; design.md §§2-3: Install may create `cordis.patch.yml`, but uninstall has no rule for the resulting file after its sole managed block is removed; a comments-only patch is not a valid top-level array.
- C-F7 [Blocker] design.md §§4-5: The chosen skill order puts user-agents before user-DSH and project roots and omits custom roots, whereas DSH ranks project `.dsh`, project `.agents`, custom, user-DSH, then user-agents; `<cwd>` is also not tied to the session root used by the project rail.
- C-F8 [Blocker] design.md §5; plan.md Task 2.1: `measure-orchestrate` special-cases lookup of `measure-orchestrator/SKILL.md`, but the sole message template still says "Load the `measure` skill"; the OpenCode command loads `measure-orchestrator`.
- C-F9 [Blocker] design.md §5; plan.md Task 2.1: The command contract neither forwards nor rejects `invocation.rawInput`, and supplies no exact discovery descriptions although the test requires them to be exact; the OpenCode commands append `$ARGUMENTS`.
- C-F10 [Blocker] spec.md FR-8; design.md §6; plan.md Phase 3: The design lists candidate model ids and column headings but does not fix the role-to-model assignments, role prompt template, per-role restrictions, or three-family selections for the 14 roles.
- C-F11 [Blocker] spec.md FR-10; design.md §8; plan.md Task 5.1: When recomposition fails, the fallback permits a pending host restart and substitutes file/record checks plus a route response from the currently loaded old instance, which cannot prove the new copy or commands are live.
- C-F12 [Major] design.md §5 Reference rail: Caching reference existence per agent session for one minute is a premature optimization with no invalidation rule.
- C-F13 [Major] design.md §4 `plugin`; plan.md Task 1.3: The shown dynamic `import()` only evaluates the host module; it never asserts that `name`, `inject`, and `apply` are exported, and the named check tests omit that failure.

### Author Response

- C-F1: FIX (design.md §0 and spec NFR-2/FR-5: the installer's write contract is the installer's own and is not claimed by the CLI; the CLI's atomicity, confinement, and reversal guarantees cover its own writes, the skill step is delegated as-is, and `--no-skills` removes it)
- C-F2: FIX (spec FR-1 and design.md §2: `--source DIR` is a plugin package directory used by `install` and the `plugin` check only; the skill checks always compare against `<repo>/skills` from the script location; a test covers a non-package `--source`)
- C-F3: FIX (design.md §2 fixes the exact JSON object and the item and action element schemas)
- C-F4: FIX (design.md §2 fixes the source/destination/stamp rules, the kept edited hash, stale-file removal and pruning, the check status per case, and stamped-only uninstall; the plan names each edge test)
- C-F5: FIX (design.md §3 and plan Task 1.4: the scan matches block and flow mappings with quoted or plain values, and the test names those forms)
- C-F6: FIX (spec FR-5 and design.md §2: when only comments remain, the CLI writes `[]`; a test covers a CLI-created patch after uninstall)
- C-F7: FIX (design.md §4: the order mirrors DSH ranks 100, 200, 400, 500 plus a deduplicated Claude-home compatibility path; `<sessionRoot>` is `deps.rootOf` for a command and `--project` for `--check`; the custom root is not read and the guide says so)
- C-F8: FIX (each workflow carries its own `skill`; the template loads it; the orchestrate test asserts `measure-orchestrator`)
- C-F9: FIX (design.md §5 and spec FR-7: the trimmed `rawInput` is forwarded as an `Arguments:` line; the eight exact descriptions are fixed; the test asserts both)
- C-F10: FIX (design.md §6 now fixes the 14-role table, the prompt template, the per-role restrictions, and the three-family assignments; `test-reference.sh` checks all 14 plus the distinct review families)
- C-F11: FIX (spec FR-10 and design.md §8 make the runtime proof human-gated in two stages; stale-instance evidence is explicitly not acceptance, and a pending restart is recorded as pending)
- C-F12: FIX (design.md §5: no cache; existence is read per command)
- C-F13: FIX (design.md §4 and plan Task 1.3: a node one-liner imports the module and exits 0 only when `name`, `inject`, and `apply` have the right shapes; the failure is a named test case)
