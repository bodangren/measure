# Measure Orchestrator Process Review

- **Date:** 2026-11-10
- **Reviewer model:** `claude-code/claude-fable-5-2[1m]`
- **Audited HEAD:** `e2315b7` (branch `main`, a merge of `origin/main`)
- **Requested by:** Daniel, 2026-11-10

## Independence

The orchestrator and the reviewer are both Anthropic models, so this review is not an independent-family audit.

## Scope

**Read in full:**

- `agents/measure-orchestrator.md` (the installed copy in `~/.config/opencode/agents/` is byte-equal)
- `skills/measure-orchestrator/SKILL.md`
- `skills/measure-orchestrator/references/contracts.md`
- `skills/measure-orchestrator/references/dsh.md`
- `skills/measure-orchestrator/scripts/measure_interphase_checks.py` lines 690 to 1071 (the gates and the command dispatch)
- `measure/lessons-learned.md`, `measure/tech-debt.md`, `measure/workflow.md`

**Sampled:**

- `measure_interphase_checks.py` lines 1 to 689: the function list and `has_agent_result` only.
- `agents/measure-*.md` role files: the shell permissions of five roles and a search of `measure-closeout.md`. The reviewer did not read the role bodies.
- `measure/anti-patterns.md`: the headings only. The reviewer did not open `references/anti-pattern-catalog.md`.
- `measure/runs/`: the folder list, file counts for each folder, text searches, one `evidence.md`, and one `review-a` JSON.
- `measure/archive/`: the folder list, 19 `metadata.json` descriptions, and one `spec.md` head.
- `git log` and `git show` for the merge `e2315b7` and the two track-scope tracks.
- `ra-quota`: the `pick` arguments, `cmd_pick`, and the `roles` output (read only).
- `plugins/opencode-measure-guard`: `src/commands.ts` lines 40 to 52, README line 53, and one `bun x tsc --noEmit -p .` run.

The reviewer ran no test suite.

## Context for all three improvements

The repository has two execution processes, and the run evidence shows this.

- **The OpenCode orchestrator process** wrote role JSON and role logs. Only `spec_review_gate_20261030` and `guard_allow_list_20261101` hold a `final-acceptance-*.json`. The four later tracks of this process hold only `spec-review` and `review-a` results.
- **The DSH process** ran in a second clone (`/home/daniel-bo/Desktop/measure` appears in 43 run files). Its run folders hold one `evidence.md` and no role result. 29 of the 64 track folders in `measure/runs/` have this form.

The two processes share one checker, one skill, and one `main` branch.

---

## 1. Robustness: a dispatched session must fail quickly when a command needs an approval

**Problem.** The orchestrator has `shell: ask` as its default. A session that takes this agent and runs unattended waits for an approval that no person gives. The dispatch rule does not name the agent of the new session.

**Evidence.**

- `agents/measure-orchestrator.md:15-17`: `action: shell`, `resource: "*"`, `effect: ask`.
- `agents/measure-orchestrator.md:258-262`: the rule says "dispatch a build-agent session with `session.create`, a full brief, and `returnResult`". It gives no `agent` value. The one-off lane does give one: line 229 says `agent: "coder"`.
- `agents/measure-orchestrator.md:398-410` ("Progress And Recovery"): the section has no rule for a role or a session that gives no output.
- Observation 1 from today: a Build session with no `agent` field took `measure-orchestrator`, and its `git merge` waited about 3 hours. The repository shows the merge time only (`e2315b7`, 10:09 +07:00). The wait time comes from the PM session.
- The same default applies to the gate. The allow rules start with `python3 */measure-orchestrator/scripts/…` (lines 27-44). `SKILL.md:184-190` tells the orchestrator to set `RED_TEST_COMMAND` and four more variables. A command with an environment prefix does not match an allow rule, so it falls to `ask`. The reviewer read the patterns and did not run a live check.

**Change.** Two edits in `agents/measure-orchestrator.md`, plus one test.

1. Lines 258-262: write the call as `session.create` with `agent: "build"`. Add the sentence: "Never dispatch a session without an `agent` value. A session with no `agent` value takes this agent and its permissions."
2. Lines 15-17: change the default `effect: ask` to `effect: deny`. A denied command returns at once, and the session reports it. Keep every allow rule.
3. "Progress And Recovery": add one rule. "List in each brief the command classes that the session needs. After a dispatch, read `session.status` at the next orchestration step. Stop a session that waits for a permission and report it to the PM."
4. `tests/spec_review_gate/test_s2_role_docs.sh`: add two checks. The agent file contains `agent: "build"` in the dispatch paragraph. The default shell rule is not `ask`.

**Expected effect.** A wrong dispatch fails in seconds with a deny text. Today the same fault cost about 3 hours of wall time. The class "unattended session waits for an approval" ends for this agent.

**Verification.**

- The two new doc checks fail on `e2315b7` and pass after the change.
- Live check: dispatch a Build session with the brief "run `git merge --no-commit --no-ff HEAD`". `session.status` shows the agent `build`, and the session ends in less than 2 minutes.
- Negative live check: dispatch with `agent: "measure-orchestrator"` and the same brief. The session returns a deny text in less than 2 minutes.

**Cost and risk.** The cost is about 10 changed lines and one install. The risk: a person who uses the orchestrator interactively loses the approval prompt and must use a Build session. Question 1 covers this.

---

## 2. Efficiency: stop the remediation chain after the second round

**Problem.** A closed track gets a review, and each review opens a new track. 19 of the 83 archive folders with a November 2026 date are remediation tracks. Most rounds correct records, not code.

**Evidence.**

- `ls measure/archive | grep "_fix[0-9]"`: 19 tracks for 8 base tracks. `ls measure/runs` has 18 of them (`dsh_measure_scan_fix2_20261107` has no run folder).
- Chain lengths: `commit_nested` 4 rounds (`fix2` to `fix5`), `registry` 3, `skill_doctor` 3, `srg_parser` 2, `snapshot_invalidate` 2, `a11_recipe` 2, `audit_contract` 2, `scan` 1.
- 17 of the 19 `metadata.json` descriptions name records, the CHANGELOG, a count, or a ledger. Example, `dsh_measure_snapshot_invalidate_fix3_20261109`: "Records-only: put all four corrections in the fix2 spec, fix the original count note, dual-attribute the CHANGELOG".
- Three common causes:
  1. **Record drift.** Specs, evidence files, and the CHANGELOG pin a volatile count. `measure/runs/dsh_measure_commit_nested_fix5_20261109/evidence.md`: "fix5 count 312; CHANGELOG node 312". Each code change makes the earlier count wrong.
  2. **Input forms found one at a time.** `commit_nested` `fix2` to `fix5` each add shell option forms (`-o pipefail`, `--rcfile`, `--init-file`, `--norc`). `measure/archive/dsh_measure_commit_nested_fix3_20261109/spec.md` F3 shows the pattern.
  3. **Each review reviews the review.** Every fix track has the task "record the fixN review", and the next review finds faults in that record.
- A remediation track costs 5 track files (`index.md`, `metadata.json`, `plan.md`, `spec.md`, `spec-review.md`), one registry entry, one CHANGELOG entry, and one evidence file.
- `SKILL.md:117-150` and `contracts.md:85-150` have no round limit and no scope rule for a re-review. `retry_recommendation` has `create_remediation_track` (`contracts.md:42`) with no rule for its use.

**Change.** One track, three small parts.

1. `skills/measure-orchestrator/references/contracts.md`, section "Finding Dispositions": add a **Re-review scope** rule. "A re-review reports two finding types as blocking: a kept routed finding, and a defect in the lines that the remediation changed. Each other new finding is nonblocking." Add a **Round limit** rule. "After the second remediation round for one base track, the orchestrator sends the open findings to the user with the cause class. It does not start a third round."
2. `skills/measure-orchestrator/SKILL.md`, section "Delegation": add "Do not write a test count or a check count in `spec.md`, `plan.md`, or `CHANGELOG.md`. Cite the log file that holds the count." Add "A finding about an input class (shell forms, option forms, character classes) needs a table of the class from its reference before Red."
3. `tests/dsh/test-registry.sh`: fail when `measure/tracks/` holds a track id that matches `_fix[3-9]_` and its `metadata.json` has no `escalation` key.

**Expected effect.** The limit stops each chain before `fix3`. 11 of the 19 remediation tracks have the id `fix3` or higher (`commit_nested` 3, `registry` 2, `skill_doctor` 2, and 1 each for `srg_parser`, `snapshot_invalidate`, `a11_recipe`, `audit_contract`). An escalation to Daniel replaces each of these 7 chain ends. The count rule removes the cause of most record corrections. A fair estimate is 8 to 11 fewer tracks in a set of 83, about 10% to 13%.

**Verification.**

- The registry test fails on a fixture with `x_fix3_20261111` and no `escalation` key, and passes with the key.
- Count check after the next 30 closed tracks: `ls measure/archive | grep -c "_fix[3-9]_"` does not grow without an `escalation` key, and remediation tracks are less than 15% of the 30.
- Count check: `rg -c "[0-9]+/[0-9]+" CHANGELOG.md` does not grow in new entries.

**Cost and risk.** The cost is about 15 lines of prose and one test case. The risk: a real defect outside the changed lines becomes nonblocking and waits in `tech-debt.md`. The round limit moves work to Daniel, so an escalation needs a short, clear cause statement.

---

## 3. Effectiveness: bind closeout to a recorded final acceptance, with committed gate commands

**Problem.** A track closes without the acceptance gates. The gate commands live only in environment variables, so no committed file says what "checks" means, and no gate runs `tsc` for the plugins.

**Evidence.**

- `ls measure/archive/*/automation-supervisor-closeout-manifest.json`: 2 of 97 archive folders have the manifest that `closeout_feedback` requires (`measure_interphase_checks.py:807-808`).
- 29 files in `measure/runs/` (26 `evidence.md` and 3 `closeout.txt`) record `FAIL: missing closeout manifest`. No run file records `PASS: closeout checks passed`. Each of these tracks is in the archive.
- `ls measure/runs/*/final-acceptance-*.json`: 2 files. The four later OpenCode tracks (`gate_track_scope_20261108`, `red_gate_track_scope_20261108`, `guard_session_track_20261109`, `guard_phase_start_20261109`) hold only `spec-review` and `review-a` results. They have no Review B, no adversarial test, no phase acceptance, and no final acceptance.
- Gate output (`gate passed` or `role-gate`) appears in 3 run folders only.
- `measure_interphase_checks.py:926, 945, 969, 981-983`: each gate command comes from `os.environ`. A search of the repository finds no committed value for `PROJECT_CHECKS`, `PROJECT_LINT`, or `PROJECT_TESTS`.
- `closeout_feedback` (lines 794-809) does not read `measure/runs/<track>/`. `SKILL.md:204` says "final acceptance audit passed", but the checker does not check it.
- `bun x tsc --noEmit -p .` in `plugins/opencode-measure-guard` exits 2 at `e2315b7` (errors in `src/core/guards.ts`, lines up to 587). The local tracks ran `tsc` by choice (`measure/runs/guard_session_track_20261109/green-p3-tsc-parity.log`). The DSH tracks did not, and a search finds no `tsc` in `agents/` or `tests/`.
- `references/dsh.md:95-102`: the DSH result block has no `END_MEASURE_AGENT_RESULT` line. `has_agent_result` (lines 591-600) requires that line. A DSH role that follows `dsh.md` cannot pass `role-gate`.
- `measure/runs/guard_phase_start_20261109/review-a-2b2574c.json`, evidence item 15: the reviewer's shell denied `bun test` and `node --test`, so Review A read the Green logs and did not run the tests again.

**Change.** One track on the checker and two documents.

1. `measure_interphase_checks.py`: add `load_gates(repo)`. It reads `measure/gates.json` (keys `RED_TEST_COMMAND`, `GREEN_TEST_COMMAND`, `PROJECT_LINT`, `PROJECT_CHECKS`, `PROJECT_TESTS`, `PROJECT_DEV_URL`). An environment variable wins over the file. Replace the six `os.environ.get` calls with it.
2. Add `measure/gates.json` for this repository. `PROJECT_CHECKS` runs `bun x tsc --noEmit -p .` in `plugins/opencode-measure-guard` and the two parity scripts. `PROJECT_TESTS` names the suites that the orchestrator ran today.
3. `closeout_feedback`: require one `measure/runs/<track>/final-acceptance-*.json` that passes `passing_audit_feedback`. Accept a `metadata.json` key `"lane": "light"` as the one exception, and print `INFO: light lane, no final acceptance` for it.
4. `references/dsh.md:95-102`: replace the block with the block of `contracts.md:7-20`.
5. `tests/spec_review_gate/test_checker.py`: add cases for the file, the environment override, the missing final acceptance, and the light lane.

**Expected effect.** A closeout without a final acceptance fails, or it declares the light lane in a committed file. The type errors that came from `origin/main` fail `PROJECT_CHECKS` at the next final acceptance. The gate command needs no environment prefix, so it matches the allow rules of the orchestrator (see improvement 1).

**Verification.**

- New tests: `closeout` exits 1 for an archived fixture with no `final-acceptance-*.json` and exits 0 with one; the light-lane fixture exits 0 with the INFO line.
- `python3 … role-gate --role final-acceptance` on `e2315b7` with the new `gates.json` and no environment variable fails with `PROJECT_CHECKS failed`. It passes after the type errors are fixed.
- Count check after the next 20 closed tracks: each archive folder has a passing `final-acceptance-*.json` or `"lane": "light"`.

**Cost and risk.** The cost is about 40 lines of Python, one JSON file, and 4 tests. The risk: the DSH process fails closeout until it runs final acceptance or declares the light lane, so its Lead prompt needs the same change. A light lane that is used for each track makes the gate empty; the count check above shows this. The 95 old archives stay as they are: the check runs only at a closeout.

---

## Other findings

1. `measure/tech-debt.md` has 53 lines (limit 50) and 37,536 bytes; all rows but one are `Resolved`, and one row has 2,955 characters. The limit counts lines, not bytes.
2. Mid Red and Jr Green compare the `--baseline` string with the full HEAD (`measure_interphase_checks.py:904, 930`; `contracts.md:157`). A short SHA never equals HEAD, so the "HEAD did not advance" check passes.
3. `agents/measure-orchestrator.md:190` says "Use the table model by default", and lines 195-200 say to run `ra-quota pick` for each role. The role table names Claude for three roles while `ra-quota roles` shows the Claude plan as MARKED. Two sources decide one model.
4. Audit roles deny `*>*` (`agents/measure-review-a-correctness.md` frontmatter). The pattern also blocks `2>&1`, which is a probable cause of the denied test runs in the Review A evidence. Not confirmed live.
5. `SKILL.md:60-86` describes a deferred `tests/_lib/` template and a `measure/test-all.sh` aggregate for TUTOR-001 projects. The text is not about this process and costs tokens on each skill load.

## Observations

1. **Partly confirmed.** The dispatch rule gives no `agent` value and the default is `shell: ask` (`agents/measure-orchestrator.md:15-17, 258-262`). The 3-hour wait is not in the repository.
2. **Confirmed.** `plugins/opencode-measure-guard/src/commands.ts:44` says "for this session", line 47 calls `guard.bypass.set(guard.root, scope)`, and README line 53 says "The bypass is per project root".
3. **Confirmed.** `ra-quota roles` lists `coder` with `minimax-cn-coding-plan/MiniMax-M3.1-Flash` first. `pick` has no difficulty argument; `--task` feeds only "the Jev shadow log" (`ra-quota`, `pick_parser`). The override and the WAIT state are not in this repository.
4. **Confirmed.** 18 `_fix` folders in `measure/runs/`, 19 `_fix` tracks in `measure/archive/`, 8 base tracks, the longest chain `fix5`. The causes are in improvement 2.
5. **Confirmed.** Local `gate_track_scope_20261108` ran from `ab95c03` to `a394c20` (closed 19:56 +07:00). Remote `bc3c63e` (20:16 +08:00, which is 19:16 +07:00) to `1ed57a7` did the same scope. `git show e2315b7 --cc --name-only` lists 13 files, with `measure_interphase_checks.py` and `tests/spec_review_gate/test_red_track_scope.py` in the list. The branches had 46 and 69 commits after the merge base `c805e6d`.
6. **Confirmed.** `bun x tsc --noEmit -p .` exits 2 at `e2315b7`. The orchestrator counted 12 errors at lines 422 to 587. No gate runs `tsc`: `PROJECT_CHECKS` is an environment variable with no committed value, and `agents/` and `tests/` have no `tsc` text.

## Questions for Daniel

1. Does the orchestrator agent keep `shell: ask` for interactive use? Default: change it to `deny`, as improvement 1 says.
2. Is a light lane (spec review plus Review A, no final acceptance) an approved process? Default: yes, with the `"lane": "light"` key in `metadata.json`, as improvement 3 says.
3. Does the round limit of 2 apply to the DSH process also? Default: yes, because the rule is in the shared skill.
