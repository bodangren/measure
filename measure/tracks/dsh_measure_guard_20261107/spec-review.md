# Spec Review: dsh_measure_guard_20261107

Author model: deepseek-flash

This track was reviewed before implementation by three independent fresh
reviewers from three model families, each with no conversation history and no
sight of the other reports (Daniel's directive of 2026-11-07). Each reviewer
followed `skills/measure/references/spec-review.md` and wrote one round. The
finding ids are prefixed per reviewer (`A-`, `B-`, `C-`) because the reviewers
worked independently; the Author Response lines use the same prefixed id.
Review artifacts: `measure/runs/dsh_measure_guard_20261107/spec-review-*.md`.

## Round 1 — Reviewer A

Date: 2026-11-07
Reviewer: MiniMax-M3.1-Flash (fresh subagent)
Report: `measure/runs/dsh_measure_guard_20261107/spec-review-minimax-m3.1-flash.md`

### What this track proposes

This track adds a third measure-guard adapter for the DeepSeek Harness: a Cordis-based DSH plugin bundle that sits beside the existing Claude Code mod and OpenCode plugin and reuses their pure decision core by copy. The bundle reads the project's `measure/` files, keeps the agent oriented with a fixed system-prompt section plus a task note sent through `agent.inject()`, and exposes a `measure_status` tool, five slash commands, a status panel, and a band in the composer. Its guard layer computes deny decisions in the asynchronous `tools/pre-execute` waterfall, stores them by execution token, and returns the stored denial from the synchronous `ctx.tools.guard`. The spec also fixes the state model (repository config, root snapshot, agent state, turn state), the guard behaviours (edit, closeout, end-of-turn, allow list), the deferred strict-mode and subagent work, and the accepted risks.

### How the current system works, per this spec

Measure already enforces its workflow in two harnesses: `mods/measure-guard/` (a Claude Code function-hook mod) and `plugins/opencode-measure-guard/` (an OpenCode 2 server and terminal plugin). Both share one pure core — `mods/measure-guard/hooks/parse.ts` and `hooks/guards.ts` — copied byte-for-byte into the OpenCode package, with `plugins/opencode-measure-guard/scripts/check-parity.sh` as the gate that compares the copies and the transformed `types.ts` (it passes today). That core already implements the marker semantics this track wants: the rule section, note key and note text, band line, status lines, allow-list parsing, the edit guard, the track-close and phase-start guards, and the end-of-turn problems and stop action. The adapters around it differ per harness, so the DSH adapter has to supply the snapshot, the state, the tool/command/UI wiring and the guard plumbing that the DSH runtime exposes, while the marker semantics stay in the shared core.

### Findings

- A-F1 [Blocker] plan.md (all phases): The plan never names the directory of the new DSH package nor the path of any module it adds; it names only `package.json`, `cordis.patch.yml`, `index.js`, `locale/en.json`, `locale/zh.json`, `icon.svg`, `README.md`, `bin/install-targets.tsv` and `measure/tech-stack.md`. Rationale: the Zero-Decision Check requires every phase to name the files to create or change; the repository's own precedent names them one by one (`measure/archive/opencode_plugin_20261021/plan.md:13-19`), so the implementer would otherwise invent the package home, the module boundaries and the test layout.
- A-F2 [Blocker] spec.md NFR-2 and NFR-3, plan.md Phase 1 "Copy the shared core with parity": the byte-identical TypeScript core cannot be loaded by the DSH runtime, and the two NFRs forbid both ways out. Rationale: `mods/measure-guard/hooks/guards.ts:18` imports `./parse` as a value import with no file extension; Node's ESM resolver does not resolve extensionless relative specifiers, and NFR-2 forbids a build step while NFR-3 forbids changing the copy.
- A-F3 [Blocker] spec.md NFR-2, plan.md Phase 4 "Client surface": the client half cannot be "plain JavaScript" with "no build step". Rationale: the reviewer read the client-modules README's build-requirements note, which targets packages built by this repository's tsdown toolchain.
- A-F4 [Major] plan.md Phases 2-5: only Phase 1 names a test; the later phases name neither test files nor normal and edge cases. Rationale: the Zero-Decision Check requires each phase to name the test cases, normal and edge.
- A-F5 [Major] plan.md Phase 1 "Record the plugin runtime in the tech stack", spec.md NFR-3: the verification layer is named neither in the plan nor in the tech-stack task. Rationale: the repo's rule is that a track with executable verification states it in the Tooling Exceptions table with its commands.
- A-F6 [Major] spec.md FR-11, plan.md Phase 2 "Repository config store": persisting the repository configuration on `ctx.storageDomain` adds the runtime dependency NFR-2 forbids. Rationale: the domain form validates records with zod (`defineDomain`/`domainTable` take `ZodType` values) and does not re-export it.
- A-F7 [Major] spec.md FR-6 and FR-7, plan.md Phase 3: the plan puts `bash` and `pwsh` into the one mutation contract but never says how a shell command's touched paths are derived. Rationale: the shared core has no shell-path extraction, so "a call that touches several paths is denied when any path is denied" has no defined meaning for a shell call.
- A-F8 [Major] plan.md Phase 5 "Distribution": the installer row names no target path and no bundle-registration step, and a copied folder is not a DSH bundle by itself. Rationale: the installer copies files from a git ref into a directory under `$HOME`, while DSH resolves a bundle as an installed package that the profile manifest selects.
- A-F9 [Major] spec.md FR-1 to FR-10, plan.md Phases 2 and 3: the documents claim the shared core is reused but map no requirement to the core symbol that implements it. Rationale: the Zoom-Out Check asks a reuse finding to cite file and symbol; without the mapping the tool and commands can drift into a second implementation.
- A-F10 [Nit] spec.md FR-1: the fixed system-prompt section names neither its section name nor its order. Rationale: `ctx.systemPrompt.section` requires a unique `name` and a numeric `order`.
- A-F11 [Nit] spec.md FR-4: the five commands are listed as if they were five registrations. Rationale: `ctx.commands.register` takes one lowercase name and leaves the rest of the line to the command's own grammar.

### Author Response

- A-F1: FIX (design.md §1 fixes the package path and every module file; plan.md rewritten to name file and test per task)
- A-F2: FIX (NFR-3 amended: parity covers `parse.ts` byte-identical, `guards.ts` identical after its one extensionless value import gains `.ts`; design.md §9 and the tech-stack row name the loading mechanism, Node >= 24.9 type stripping outside `node_modules`)
- A-F3: FIX (NFR-2 amended and the tech-stack row records the documented no-build path: the shipped `cordis-plugin-development` skill's hand-written `client.js` template; the client-modules "build requirements" note targets tsdown-built repo packages, and the Host only reads the bytes at `exports["./client"]`)
- A-F4: FIX (plan.md names the test file and the normal and edge case of every task)
- A-F5: FIX (tech-stack Tooling Exceptions row names `node --test plugins/dsh-measure-guard/tests/` and the parity script)
- A-F6: FIX (FR-11 amended: repository configuration persists in `~/.local/state/measure/dsh-guard/repos.json`; `ctx.storageDomain` rejected for its zod dependency)
- A-F7: FIX (FR-6 amended: `bash`/`pwsh` are classified as shell calls with unknown paths, never path-checked; the end-of-turn check is the backstop; no shell extraction is invented)
- A-F8: FIX (plan.md Phase 5 names the installer target `~/.dsh/profiles/web/plugins/dsh-measure-guard` and the one selection step, a profile `cordis.patch.yml` insert row; design.md §11 records why a path row still loads both halves — the client half is found through the nearest `package.json`)
- A-F9: FIX (design.md §12 maps each FR to its shared-core symbol; the adapter calls those symbols and re-implements none)
- A-F10: FIX (FR-1 fixes `name: 'measure:rule'`, `order: 5000`)
- A-F11: FIX (FR-4 lists three registrations and their argument grammar)

## Round 1 — Reviewer B

Date: 2026-11-07
Reviewer: MiMo-V2.6-Pro (fresh subagent)
Report: `measure/runs/dsh_measure_guard_20261107/spec-review-mimo-v2.6-pro.md`

### What this track proposes

The track adds a third measure-guard adapter — a DeepSeek Harness (DSH) plugin bundle — beside the existing Claude Code mod (`mods/measure-guard/`) and OpenCode plugin (`plugins/opencode-measure-guard/`), reusing the shared pure decision core (`parse.ts`, `guards.ts`, transformed `types.ts`) copied byte-identically with the parity gate extended. The bundle reads the project's `measure/` files, keeps the agent oriented through one fixed system-prompt section and task notes sent with `agent.inject()`, exposes a `measure_status` tool and five slash commands, and denies plan-uncovered writes through a synchronous `ToolGuard` whose decisions are computed asynchronously in `tools/pre-execute`, stored by the call token, and cleared on `tools/result`. It adds edit and closeout guards, an end-of-turn check with mode-dependent escalation, an allow list, four state classes, and a client band and panel; strict-mode TDD/commit guards and subagent inheritance/goal binding are deferred to follow-up tracks.

### How the current system works, per this spec

Measure enforces its workflow in two harnesses today: a Claude Code function-hook mod and an OpenCode 2 plugin, which share one pure decision core copied byte-for-byte and kept equal by `plugins/opencode-measure-guard/scripts/check-parity.sh`. The core parses `measure/index.md`, `measure/tracks.md`, `plan.md`, and `measure/guard-allow`, selects the first `[~]` track and its current task, and decides edit, closeout, TDD, and commit outcomes plus a progress band line and end-of-turn problems. Neither adapter can run on DSH, whose Cordis-based plugin runtime guards tools with a synchronous `ToolGuard` behind an async `tools/pre-execute` waterfall, so the DSH adapter must prepare guard state asynchronously and deliver context through the DSH agent, session, command, and client-UI surfaces.

### Findings

- B-F1 [Blocker] plan.md (all phases): The plan never names the directory of the new bundle package and never names the file for each new module (repository config store, agent/turn state, snapshot service, mutation normalization, edit/closeout guards, `measure_status` tool, commands, band, panel client code). Rationale: a file location left to the implementer is a Blocker under the Zero-Decision Check.
- B-F2 [Blocker] spec.md NFR-2 / plan.md Phase 1 and Phase 4: The plan's `package.json` field list omits the `dsh.client` declaration, and NFR-2's "the Client half is plain JavaScript. No build step" conflicts with the platform contract where a browser plugin declares `dsh.client` with `platform: 'web'` and the Host serves a built `./client` Lazy-CJS bundle. Rationale: the reviewer read the client-modules build-requirements note; the client packaging format was a choice the plan left open.
- B-F3 [Blocker] plan.md Phase 4 (Band) / spec.md FR-9: "Host stream method" names no platform API for the Host-to-Client band data channel. Rationale: `ctx.remote.$on` accepts only a fixed event allowlist, so a custom channel must be a Typert Remote contribution or repeated RPC; the API shape was left to the implementer.
- B-F4 [Blocker] spec.md FR-9 vs FR-13 / plan.md Phase 3: FR-9 gives `strict` an end-of-turn hold, FR-13 says the `strict` mode value "behaves as `guard`", and plan Phase 3 implements only the guard-mode reminder. Rationale: the end-of-turn behaviour of `strict` was left undecided between two contradictory statements.
- B-F5 [Blocker] plan.md Phase 1 (Test harness) / measure/tech-stack.md: The plan's "the package test command" names no test runner, and Phase 1 adds only "one dated line" to tech-stack.md instead of the Tooling Exceptions declaration. Rationale: the runner and verification layer were a dependency choice left open.
- B-F6 [Blocker] spec.md NFR-2 / plan.md Phase 2 (State model): The plan stores repository config "on `ctx.storageDomain`", but `defineDomain`/`domainTable` require zod record schemas, while NFR-2 forbids a new runtime dependency. Rationale: under pnpm's isolated layout the plugin cannot even resolve zod undeclared.
- B-F7 [Major] plan.md Phases 2-5: only Phase 1 names a test case; Phases 2-5 name no normal and no edge test cases. Rationale: the standard requires each phase to name its test cases.
- B-F8 [Major] plan.md Phases 2-4 vs spec.md FR-12 and NFR-1: No task implements FR-12's second-writer detection or NFR-1's setup offer through the band and the `SETUP_DENY` edit denial. Rationale: stated requirements land in no phase task, so the track would ship without them.
- B-F9 [Major] spec.md FR-9 and NFR-1 (Comprehension gap): the spec references "the band" but no FR defines what it shows or when it updates. Rationale: "band" is a project-specific term defined only in the sibling adapters.
- B-F10 [Nit] spec.md Overview: the pre-implementation review narrative and the inline `((execution) => string | undefined)` signature restate design history and FR-5's content. Rationale: wording only.

### Author Response

- B-F1: FIX (design.md §1; plan.md rewritten per task)
- B-F2: FIX (plan.md and design.md §1/§8 add the `dsh.client` declaration and `exports["./client"]`; NFR-2 amended to name the hand-written Lazy-CJS client half)
- B-F3: FIX (new FR-15 fixes the channel: one exact HTTP resource `GET /measure-guard/state?sessionId=` through `ctx.webServer.register`; design.md §8 records that a projection or Remote was rejected for the named reasons)
- B-F4: FIX (FR-13 amended: strict keeps the FR-9 end-of-turn hold; only the TDD and commit guards are deferred; plan Phase 3 has the hold task and its test)
- B-F5: FIX (tech-stack Tooling Exceptions row names `node --test plugins/dsh-measure-guard/tests/` and the parity script; plan Phase 1 states the runner)
- B-F6: FIX (FR-11 amended to the JSON state file)
- B-F7: FIX (plan.md names the normal and edge cases per task)
- B-F8: FIX (plan Phase 2 gains the setup-offer task and the second-writer task with tests; NFR-1 and FR-12 cite them; acceptance criteria added)
- B-F9: FIX (FR-9 now defines the band; FR-16 defines its content and the panel's)
- B-F10: FIX (Overview rewritten; the review history moved to this report)

## Round 1 — Reviewer C

Date: 2026-11-07
Reviewer: Kimi-K3.1-Pro (fresh subagent)
Report: `measure/runs/dsh_measure_guard_20261107/spec-review-k3.1-pro.md`

### What this track proposes

PENDING

### How the current system works, per this spec

PENDING

### Findings

PENDING

### Author Response

PENDING
