# Spec Review: dsh_measure_team_rehearsal_20261107

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-07
Reviewer: subagent (fresh context, default model)

### What this track proposes

One real Measure phase runs through DSH subagents, the guard is observed, and the orchestrator's role playbook and its limits are recorded: a disposable Measure fixture and its contract test, a Rehearsal section in the orchestrator reference, and one executed Red/Green run with the guard live. The spec (as corrected by the follow-up) also records what the run exposed: a subagent's `cwd` changes only its shell directory, not its guard root, so the fixture's strict override was never exercised and the protocol requires a session whose working directory is the fixture. It then updates docs, lessons, tech debt, and metadata and archives the track.

### How the current system works, per this spec

The orchestrator reference maps Measure roles to DSH subagents. The guard plugin enforces plan markers, keeps a per-agent Red record in strict mode, caches a per-repository mode override in `repos.json` (a reload is needed to read a change), and cannot run under `dsh --profile headless` (it injects `webServer`). The run established that a subagent spawned with the `subagent` `cwd` option keeps the parent session's guard root, so its fixture writes were outside the guard and the expected strict deny did not happen. The verification layers are `tests/dsh/run.sh`, the plugin's `node --test` suite, and two `check-parity.sh` gates.

### Findings

- F1 [Blocker] plan.md Phase 5: a cross-track Phase 5 ("Post-review correction for the archived band follow-up track") was added to this plan and executed; it belongs to another track and changed the shipped plugin, contradicting the Overview's "no shipped-runtime change except the docs".
- F2 [Blocker] spec.md Overview / FR-4: the Overview said one real Measure phase "with the guard live" was proven, while FR-4 and the evidence record that the fixture's strict deny path was not exercised.
- F3 [Blocker] plan.md Phase 3: the tasks prescribed `cwd` = fixture, omitted the isolated session and the Review spawn, and Task 3.2 said only to run the failing test although strict mode needs that agent's own test-file change too.
- F4 [Major] spec.md FR-3 (b): "the always-allowed `measure/` writes" was false — the closeout guard and the registry/shell denies still apply.
- F5 [Major] spec.md FR-3 / Rehearsal section: the section's closing "integration facts" still said the guard applies to child agents through their own working directory.
- F6 [Major] spec.md Acceptance Criteria: "the subagent targets" and "the observed guard behaviour" were undefined, so the evidence could satisfy the criterion without proving the strict rule.
- F7 [Major] spec.md NFR-4: cleanup (fixture gone, `repos.json` entry removed, reload, clean tree) was not in the acceptance criteria or evidence checks.
- F8 [Major] spec.md FR-2: the `loadSnapshot(io, root)` io seam the test must supply was not named.
- F9 [Major] spec.md FR-1: the fixture schema (track id, task text) was left open while the contract test hardcoded them.
- F10 [Major] plan.md Task 1.2: the contract test checked `.git/HEAD` (created by `git init`) rather than a commit.
- F11 [Nit] spec.md NFR-2: the two parity gate scripts were unnamed.

### Author Response

- F1: FIX (Phase 5 removed from the rehearsal plan; its work stays as commit `75f00f8`, checkpoint `5d9e270`, and the archived band-follow-up metadata records the cross-track correction)
- F2: CONTEST → Accepted Risk (the run proved the Red→Green→commit handoff with real subagents; it did not prove the strict deny path because a child keeps the parent session's guard root. The Overview and FR-4 now say exactly that, and the unproven part is an Accepted Risk below, not a claim)
- F3: FIX → Accepted Risk (the archived plan's Phase 3 tasks are annotated with what ran, the corrected FR-3, and the accepted risk; the isolated-session run is deferred)
- F4: FIX (FR-3 and the reference now state the edit/TDD skip plus the closeout, registry-tool, and shell-write exceptions)
- F5: FIX (the closing summary now says parent session's working directory)
- F6: FIX (the acceptance and evidence define the fields: fixture path, two subagent ids with roles, exact commands, guard output or "no deny" with the reason, failure/pass counts, commit SHA, cleanup results)
- F7: FIX (the evidence records the cleanup commands and results; the acceptance requires them)
- F8: FIX (FR-2 names the `loadSnapshot(io, root)` seam and the adapter methods)
- F9: FIX (FR-1 names the track id `rehearsal_20260101` and the task "Add the greeting function")
- F10: FIX (`test-rehearsal-fixture.sh` asserts `rev-parse --verify HEAD` and exactly one commit, and fails a repo with no commit)
- F11: FIX (NFR-2 names both scripts)

### Accepted Risk

- **Blockers F2/F3 (strict deny path):** the true isolated-session rehearsal was not executed. The fixture sessions must have their working directory set to the fixture, and the agent tool surface cannot do that: a `subagent`'s `cwd` changes only its shell directory, and the Host's `session.create` remote (which accepts a `cwd`) is reachable only through the authenticated GUI API (a bare HTTP request returns 401). The evidence records the attempted `dsh --profile headless` route and why it cannot host the guard (`webServer` inject pending, no stored credentials). The role handoff, the fixture contract, the per-agent Red rule, and the cleanup are proven; the strict deny in a disposable project is deferred to a future track that drives an isolated session.
- The follow-up track `dsh_measure_rehearsal_followup_20261107` corrects the records and hardens the fixture contract test to assert a real commit.
