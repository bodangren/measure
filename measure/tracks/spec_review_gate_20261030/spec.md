# Specification: Spec review gate, finding dispositions, and doc drift check

## Overview

**Sprint goal:** Every Measure track gets an independent review of `spec.md` and `plan.md` before Red starts, every routed review finding gets one checkable disposition, and the weekly audit finds documents that no longer agree with the code.

Measure has strong independent checks on code: separate Red and Green roles, three reviews, adversarial tests, and two acceptance gates. Measure has no independent check on `spec.md` and `plan.md` before Red starts. The session that interviews the user also writes the spec and the plan, and the only check is the Approve step of the user. When the plan leaves a design choice open, Green makes that choice, and Green runs on the lowest-cost model. Review findings have no dispute rules, so an implementer can dismiss a finding as "intentional". After closeout, nothing compares `product.md`, `tech-stack.md`, or recent specs with the code.

This track adapts three ideas from Google's Elephant-Goldfish Model (EGM), <https://github.com/google/elephant-goldfish-model>, licensed under Apache-2.0:

1. A fresh reviewer with no conversation history paraphrases the documents first, then checks them against a written standard (EGM `agents/comprehension.md`, `resources/document_standards/zoom-out-standard.md`, and `resources/document_standards/implementation-readiness-standard.md`). EGM states the plan rule as: "The plan must leave **zero design or architectural choices to the implementer**."
2. The owner of a document gives each finding one category: fix, contest with evidence, escalate, or decline (EGM `skills/egm-resolve/SKILL.md`). EGM states the main rule as: "A contest must be checkable."
3. A drift report compares design documents with the code and reports only the differences (EGM `skills/egm-drift-report/SKILL.md`).

Measure writes its own text for each of these ideas. The files of this track quote only the two short rules above, with this credit.

The track builds four parts, in this order: the spec review standard and a review step in `new-track` (S1), the `measure-spec-review` orchestrator role and its checker gate (S2), the four finding dispositions for every routed finding (S3), and a doc drift detector in the weekly audit (S4).

## Decisions

The orchestrator dispatched this track creation with a full brief and no user questions. Each decision below came from that brief or is the default that this session took. The owner can reverse each decision before Red starts.

1. **Spec format and type:** story-shaped feature track with a `sprint` object in `metadata.json`.
2. **No "User Manual Verification" task in each phase.** `workflow.md` defines the Phase Completion Verification Protocol, but the orchestrated `measure-phase-acceptance` role replaces the manual check for this track. The plan has no such task.
3. **Phase order S1, S2, S3, S4, on `main`.** The hourly cron job installs from `main`. In each phase, a file or checker role lands in an earlier commit than the first file that names it. Thus each commit on `main` leaves the installed files consistent.
4. **Claude bundle:** each commit that changes a file in `skills/measure/` also copies the file to the same path in `claude-skills/measure/`, as `track_sets_20261009` did (Task 4.3). `diff -r skills/measure claude-skills/measure` shows no difference after each commit. The zip file `claude-skills/measure.skill` (last changed 2026-04-25) is not rebuilt; no recent track rebuilt it.
5. **Contract location:** the contract of each phase (exact headings, marker strings, command behavior, and messages) is a block at the top of the phase in `plan.md`. The block is written at track creation, before any test. There is no separate `contract.md`.
6. **Test tooling:** bash contract tests in `tests/spec_review_gate/test_s<n>_*.sh` for the Markdown contracts, Python `unittest` (standard library only) in `tests/spec_review_gate/test_checker.py` for `role-gate`, and one runner `tests/spec_review_gate/run.sh`. Task 1.1 declares this tooling in the Tooling Exceptions table of `tech-stack.md` before the first test.
7. **Reviewer input:** the reviewer gets no conversation history. It starts from `spec.md`, `plan.md`, the files that they link or name, and `product.md`, `tech-stack.md`, and `workflow.md`. It can search and read the repository, because the zoom-out check must cite existing code for reuse and placement.
8. **Report writer in `new-track`:** the subagent returns its report as text. The `new-track` session writes the text without changes to `spec-review.md`, below header lines. The header line `Author model:` records the model that wrote the spec, or `unknown`.
9. **`spec-review.md` is always written.** When the harness has no subagent tool, the file holds the line `Spec review: not run (no subagent tool)`. The new step adds the index line `- [Spec Review](./spec-review.md)` itself. The index template of `new-track` §2.5 step 5 does not change, because `new-track-set.md` reuses that template and spec review in track sets is out of scope.
10. **Interim author response in S1.** Before S3, the author response says `fixed` or `not fixed` with the reason of the user. S3 replaces this text with the four dispositions. Thus no S1 file names a rule that does not exist yet.
11. **Severity rules.** Blocker: a section that the reviewer cannot paraphrase; a symptom fix instead of a root-problem fix; a design choice that the plan leaves to the implementer, including a file location; a phase that leaves the repository in a state that does not work or that no test can check. Major: a speculative feature or premature optimization; new code where cited existing code does the job; logic in the wrong place; a spec section at the implementation level; a phase without named normal and edge test cases; an undefined project-specific term. Nit: wording or format that does not change what the implementer builds.
12. **Finding format and ids.** A finding is one line: `F<n> [Blocker|Major|Nit] <scope>: <description> Rationale: <rationale>`. A finding from the paraphrase check or about an undefined term starts its description with `Comprehension gap:`. A re-review keeps the id of each earlier finding and numbers new findings from the highest earlier id plus 1.
13. **Re-review trigger.** A second round runs only when `spec.md` or `plan.md` changed after the first round. There is no third round.
14. **Orchestrated spec review.** The orchestrator runs `measure-spec-review` once per track, before the first `measure-strategy`. It skips the role for a track whose plan already has a `[x]` task or whose `measure/runs/<track>/` folder already has a passing `spec-review-*.json`. A re-run happens only after a committed revision of `spec.md` or `plan.md`. After a second fail, the user accepts the remaining findings as risks or stops the run. On a pass, the orchestrator lists the Major findings in its next update to the user and continues.
15. **Role independence.** The `measure-spec-review` role does not read the `new-track` `spec-review.md`. The orchestrator reads only its `Author model:` line to pick the reviewer family.
16. **Role file model line.** Like the other role files, `agents/measure-spec-review.md` has a `model:` line: `kimi-for-coding/k3` with `reasoningEffort: max` and `steps: 40`, the same as `measure-review-a-correctness`. The orchestrator passes a model on each spawn, so the host table decides.
17. **Checker design for `spec-review`.** The payload rules go into a function `validate_spec_review_payload`, called from `validate_audit_payload`, as `validate_ux_payload` is for UX audits. Thus `audit-result --role spec-review` checks the same rules. The rules: a non-empty `paraphrase` object; the finding format; only `[Blocker]` findings in `blocking_findings`; only `[Major]` or `[Nit]` findings in `nonblocking_findings`; `status: pass` only with an empty `blocking_findings`; `status: fail` only with `retry_recommendation: escalate_human`. `role-gate` also requires `--baseline` and checks only committed files for the scope rule. It does not read `--phase`; the orchestrator passes `--phase "track setup"`.
18. **Dispositions line syntax.** `FIX` and `DECLINE` take no text. `CONTEST(<evidence>)` and `ESCALATE(<reason>)` require non-empty text without `;`. Items are separated by `;`. An empty item, a duplicate id, or a word in lowercase fails. Only the last `MEASURE_AGENT_RESULT` block of a log counts.
19. **Routed finding form.** The orchestrator gives each routed finding an id that is unique in the phase: `F<n> [<severity>] <scope>: <text>`. A spec review finding keeps its own id, severity, and scope. For any other audit role, a blocking finding becomes `[Blocker]`, a nonblocking finding becomes `[Nit]`, and the scope is the role name, for example `review-b`.
20. **Remediation round without FIX.** When no routed finding gets FIX, Green makes no commit. The orchestrator does not run the `jr-green` role gate for that round. It checks that the result block has a disposition for each routed id, and it sends the CONTEST items to the re-review on the same HEAD.
21. **`review.md` severities.** The `review` workflow keeps its Critical, High, Medium, and Low levels. Its findings get `F<n>` ids. `DECLINE` is allowed only for Low findings.
22. **Orchestrator agent file in the repository.** The repository file `agents/measure-orchestrator.md` has no "Session Names" section; only the host file in `~/.config/opencode/agents/` has one. S2 adds the spec review to the role order of the repository file only. The session name `Spec Review` goes into the host file with the deploy step, which is out of scope.
23. **Files that stay unchanged.** `plugins/opencode-measure-guard/commands/measure-new-track.md` only loads the skill and does not repeat the steps. The `docs/explainer-video/` files record a video that was rendered on 2026-10-20. Neither changes.
24. **Drift scope.** The drift detector reads each track in `measure/archive/` and in `measure/tracks/` whose status is `done`, `completed`, or `complete`. The completion date is the `completed` field, or else the date part of `updated_at`. A track that completed in the 30 days before the audit date is in scope. Cancelled tracks are out of scope.
25. **Catalog count text.** S4 changes each "A1–A10" count text in the orchestrator skill and the role files to "A1–A11", so that the files agree with the catalog.
26. **Story S2 title without backticks.** The title is "The measure-spec-review orchestrator role". The phase heading is the `--phase` value of `role-gate`, and backticks in a shell argument need extra quotes.
27. **Unresolvable `--baseline` for `spec-review`.** The `spec-review` gate fails closed. Before the scope rule, the `spec-review` block runs `git rev-parse --verify --quiet <value>^{commit}`. When the value does not resolve to a commit, the message is `--baseline does not resolve to a commit: <value>`, and the gate fails. Without this check, `committed_files` returns an empty list when `git diff` fails, and the scope rule passes. The S1 strategy (`measure/runs/spec_review_gate_20261030/strategy-7d72b40.log`) listed this choice as option (b). The blocks of the other roles do not change.
28. **No-subagent path of `new-track` step 9.** Sub-step 2 goes to the step 10 commit without a new question, by design. The user already approved the spec and the plan in the earlier steps of `new-track`. The report records the line `Spec review: not run (no subagent tool)`. This decision answers the CONFIRM question of Review C at `ff361ff` (`measure/runs/spec_review_gate_20261030/review-c-s1-ff361ff.json`). No file changes.

## Stories

### Story S1: Spec review standard and the new-track review step
**As a** Measure user
**I want** a fresh subagent to review `spec.md` and `plan.md` against a written standard before the track commit
**So that** gaps and open design choices are found before the lowest-cost model must guess them

**Acceptance Criteria:**
- Given `skills/measure/references/spec-review.md`, When I read it, Then it defines the reviewer input (no conversation history), the paraphrase under "What this track proposes" and "How the current system works, per this spec", the zoom-out check, the zero-decision check, the severity rules, the finding format, the re-review limit, the report layout, and the EGM credit.
- Given `new-track.md` §2.5, When `spec.md` and `plan.md` are on disk and before the track commit, Then one new step spawns one fresh subagent with only the paths and the standard, writes `measure/tracks/<track_id>/spec-review.md`, and adds the line `- [Spec Review](./spec-review.md)` to the track `index.md`.
- Given a harness without a subagent tool, When the step runs, Then it tells the user, writes `Spec review: not run (no subagent tool)` in `spec-review.md`, and continues; it never runs the review in the same context.
- Given a report, When the step shows it, Then the user sees the paraphrase and each Blocker and Major finding, picks the findings to fix, and gets at most one re-review after a change.
- Given `skills/measure/SKILL.md` and `claude-skills/measure/`, When I read them, Then the New Track summary names the spec review and `diff -r skills/measure claude-skills/measure` shows no difference.

**Estimate:** M
**Priority:** Must

### Story S2: The measure-spec-review orchestrator role
**As a** Measure orchestrator user
**I want** a report-only spec review role with a mechanical gate before the first strategy role
**So that** no orchestrated track starts Red on a spec that an independent model could not paraphrase

**Acceptance Criteria:**
- Given `agents/measure-spec-review.md`, When I read it, Then it is a report-only subagent that can edit only `measure/runs/**`, has the same bash denies as `measure-review-a-correctness`, denies `task`, reads the standard from `~/.agents/skills/measure/references/spec-review.md` (fallback `skills/measure/references/spec-review.md`), and writes `measure/runs/<track>/spec-review-<short-head>.json` and `.log`, provisional artifact first.
- Given a spec review audit JSON with a non-empty `paraphrase.proposes` and `paraphrase.current_system`, no Blocker, and no commit outside `measure/runs/` since `--baseline`, When `role-gate --role spec-review` runs, Then it passes; the aliases `spec_review` and `measure-spec-review` give the same result.
- Given an empty paraphrase field, a Blocker, a finding in the wrong format, a missing `--baseline`, a `--baseline` that does not resolve to a commit, or a commit outside `measure/runs/`, When `role-gate --role spec-review` runs, Then it exits 1 and names the problem.
- Given the orchestrator skill, When I read it, Then the role list, Role Order step 0, the model rule for the spec reviewer, and `references/contracts.md` describe the role; the repository orchestrator agent, the `measure-orchestrate` command, `README.md`, `product.md`, and `tech-stack.md` agree.

**Estimate:** L
**Priority:** Must

### Story S3: Finding dispositions
**As a** Measure maintainer
**I want** every routed finding to get exactly one disposition with evidence that the reviewer can check
**So that** an implementer cannot dismiss a finding as "intentional" and the reviewer must answer each contest

**Acceptance Criteria:**
- Given `references/contracts.md`, When I read the section "Finding Dispositions", Then it defines FIX, CONTEST (with evidence that the reviewer can read), ESCALATE, and DECLINE (Nit only), the rule that the owner does not change a severity, and the rule that a comprehension gap cannot be contested.
- Given a result block with the optional line `dispositions: F1=FIX; F2=CONTEST(<evidence>)` or `dispositions: none`, When `role-gate` runs with `--log-file`, Then it passes; Given a line with another word, a lowercase word, empty evidence, or a duplicate id, Then it exits 1; Given a block without the line, Then it stays valid.
- Given a re-review on the new HEAD with routed CONTEST items, When the reviewer writes its JSON, Then it withdraws each item with an `evidence` entry or keeps it with `| CONTEST kept: <reason>`, and a kept item gives `retry_recommendation: escalate_human`.
- Given the Green role, Reviews A, B, and C, phase acceptance, the `review` workflow, and the spec review standard, When I read them, Then each uses the same four dispositions.

**Estimate:** M
**Priority:** Must

### Story S4: Doc drift check in the weekly audit
**As a** Measure maintainer
**I want** the weekly audit to compare `product.md`, `tech-stack.md`, and recent specs with the code
**So that** the documents that agents read stay true after closeout

**Acceptance Criteria:**
- Given `agents/measure-orchestrator-audit.md`, When I read the section "Doc drift detector", Then it covers `measure/product.md`, `measure/tech-stack.md`, and the `spec.md` of each track that completed in the last 30 days, and it applies only to the scheduled audit.
- Given a document claim that the code does not match, When the detector runs, Then the audit has a nonblocking finding that starts with `DRIFT:` and names the document path and line, the claim, the code evidence, and the two options; drift alone does not fail the audit.
- Given a difference that a later track spec explains, or code that no document covers, When the detector runs, Then it reports nothing for it.
- Given `skills/measure-orchestrator/references/anti-pattern-catalog.md` and `measure/anti-patterns.md`, When I read them, Then both have the same entry "A11 — Doc-to-code drift after closeout".
- Given the orchestrator skill and `CHANGELOG.md`, When I read them, Then the skill names the drift check under the audit role and the changelog credits EGM.

**Estimate:** M
**Priority:** Should

## Non-Functional Requirements

- **Backward compatible.** Existing tracks, `MEASURE_AGENT_RESULT` blocks, and audit JSON files stay valid. A block without a `dispositions:` line passes as before. An audit JSON for another role does not need a `paraphrase` field.
- **Consistent installs.** Each commit on `main` leaves the installed files consistent: no role file or skill file names a file or a checker role that does not exist at that commit.
- **No new runtime.** The checker uses the Python standard library only. The tests use bash and Python `unittest`.
- **Language.** All new prose obeys ASD-STE100, as `~/.config/opencode/AGENTS.md` requires.

## Acceptance Criteria (track level)

1. `bash tests/spec_review_gate/run.sh` exits 0.
2. `diff -r skills/measure claude-skills/measure` shows no difference.
3. `python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py audit-result --role review-a --file <an audit JSON without paraphrase>` passes, as before this track.
4. `git diff <track base> -- skills/measure/references/new-track-set.md` is empty.
5. Each orchestrator role that the skill names is accepted by `role-gate --role` (the S2 test checks each name).

## Out of Scope

- The 6-lens brainstorm swarm of EGM.
- EGM bootstrap READMEs (`egm-bootstrap`).
- Rules about chat dumps.
- Spec review in the track set workflow (`new-track-set.md`).
- Edits to the host model table in `~/.config/opencode/agents/measure-orchestrator.md`, and the session name list in that host file.
- Removal or renaming of an existing audit JSON field.
- Reports about code that no document covers.
- A rebuild of `claude-skills/measure.skill`.
