# Implementation Plan: Spec review gate, finding dispositions, and doc drift check

Track: `spec_review_gate_20261030`. Spec: [spec.md](./spec.md). Each story-phase follows the Contract-First order: the contract block (acceptance criteria and exact strings), Red (failing tests), Green (implementation), then docs and checks. The phase-acceptance role replaces the manual verification task (spec Decision 2).

## Rules for every phase

- Work on `main`. Make one commit for each task, then one plan-evidence commit with the task SHA.
- The cron job installs from `main` every hour. Commit a file or a checker role before the first file that names it. The task order in each phase obeys this rule.
- When a task changes a file in `skills/measure/`, copy that file to the same path in `claude-skills/measure/` in the same commit. Do not rebuild `claude-skills/measure.skill`.
- Bash tests use the harness of `agents/measure-mid-red.md`: `#!/usr/bin/env bash`, `set -uo pipefail`, `pass` and `fail` functions, one `=== <check> ===` line for each check, and the summary line `=== Total: N checks (PASS=X, FAIL=Y) ===`. A test exits 1 when a check fails.
- Each test finds the repository root as `ROOT="$(cd "$(dirname "$0")/../.." && pwd)"` and reads files below `$ROOT`.
- A check that looks for a heading or a block must fail when the heading or block is missing (anti-pattern A4).
- Python tests use only the standard library. They run the checker as a subprocess (`sys.executable`) in temporary git repositories.

## Test commands

| Phase | Red command (must fail at Red) and Green command (must pass at Green) |
| --- | --- |
| S1 | `bash tests/spec_review_gate/run.sh 'test_s1_*.sh'` |
| S2 | `bash tests/spec_review_gate/run.sh 'test_s2_*.sh' test_checker.py` |
| S3 | `bash tests/spec_review_gate/run.sh 'test_s3_*.sh' test_checker.py` |
| S4 | `bash tests/spec_review_gate/run.sh 'test_s4_*.sh'` |
| All (Green gate of each phase, after the phase command) | `bash tests/spec_review_gate/run.sh` and `diff -r skills/measure claude-skills/measure` |

## Phase S1: Spec review standard and the new-track review step
_Story ref: spec.md#story-s1_

**Contract (acceptance criteria).**

- Runner `tests/spec_review_gate/run.sh [pattern ...]`:
  - Each pattern is a glob relative to `tests/spec_review_gate/`. The default patterns are `test_*.sh` and `test_*.py`.
  - The runner runs each matching `.sh` file with `bash`, in sorted order. It runs each matching `.py` file with `python3 -m unittest discover -s "$ROOT/tests/spec_review_gate" -p <file name>`. Each file is one suite.
  - The last line is `=== spec_review_gate: N suites (PASS=X, FAIL=Y) ===`.
  - The exit code is 1 when a suite fails or when no file matches (the message `no suites matched` comes before the summary). Otherwise the exit code is 0.
- Standard `skills/measure/references/spec-review.md`:
  - Line 1 is `# Spec Review Standard`. The next paragraph credits EGM with the URL `https://github.com/google/elephant-goldfish-model` and the word `Apache-2.0`.
  - The level-2 headings come in this order: `## Reviewer Input`, `## Paraphrase First`, `## Zoom-Out Check`, `## Zero-Decision Check`, `## Severity`, `## Finding Format`, `## Re-Review Limit`, `## Report Layout`.
  - Reviewer Input: the reviewer reads `spec.md`, `plan.md`, the files that they link or name, and the resolved Product Definition, Tech Stack, and Workflow. It contains the sentence `The reviewer gets no conversation history.` The reviewer can search and read the repository to check claims about the current system, reuse, and placement (spec Decision 7).
  - Paraphrase First: the reviewer writes two sections, `What this track proposes` and `How the current system works, per this spec`, of `2 to 5 sentences` each, before any finding. A section that the reviewer cannot paraphrase is a Blocker finding. The author compares the paraphrase with the intent. A wrong paraphrase is a finding: the author adds it with the next free id, severity Major, and the misread section as scope.
  - Zoom-Out Check: six checks. The spec solves the root problem, not a symptom. It adds no speculative feature. It adds no premature optimization. It reuses existing code, and each reuse finding cites a file and a symbol. It puts new logic in the correct place. It stays at the requirement level.
  - Zero-Decision Check: the plan leaves no design choice to the implementer. The section names these five kinds: `schema`, `API or CLI shape`, `dependency`, `edge-case behavior`, `file location`. Each phase names the files to create or change and the test cases (normal and edge). Each phase leaves the repository in a working, testable state.
  - Severity: the three levels and their rules from spec Decision 11.
  - Finding Format: the literal line `F<n> [Blocker|Major|Nit] <scope>: <description> Rationale: <rationale>`. A finding from the paraphrase check or about an undefined term starts its description with `Comprehension gap:`. The section contains the sentence `Do not flag general engineering terms.` A re-review keeps the earlier ids and numbers new findings from the highest earlier id plus 1.
  - Re-Review Limit: the text `at most one re-review`. After the second round, each remaining Blocker and Major finding goes to the `## Accepted Risks` section of the report, and the user decides.
  - Report Layout: this template, with the reviewer part marked. The reviewer returns only the three `###` subsections of one round. The author writes the other lines.

    ```markdown
    # Spec Review: <track_id>

    Author model: <model id, or unknown>

    ## Round 1

    Date: <YYYY-MM-DD>
    Reviewer: <subagent type and model, or unknown>

    ### What this track proposes
    <2 to 5 sentences>

    ### How the current system works, per this spec
    <2 to 5 sentences>

    ### Findings
    - F1 [Blocker] <scope>: <description> Rationale: <rationale>

    ### Author Response
    - F1: fixed

    ## Round 2
    <the same subsections, only when a re-review ran>

    ## Accepted Risks
    - F<n>: <finding text> (accepted by the user on <YYYY-MM-DD>)
    ```

  - The template states the two response forms of S1: `- F<n>: fixed` and `- F<n>: not fixed — <reason of the user>`. A round without findings has the line `- None` under `### Findings`.
  - The not-run form of the file: the title line, the `Author model:` line, and the line `Spec review: not run (no subagent tool)`.
- `skills/measure/references/new-track.md` §2.5:
  - Steps 1 to 8 do not change. A new step 9 starts with `9. **Spec Review (fresh subagent):**`. The old step 9 becomes `10. **Commit Changes:**`, and the old step 10 becomes `11. Announce completion:`. Each number from 1 to 11 occurs once.
  - Step 9 contains these strings: `references/spec-review.md`, `measure/tracks/<track_id>/spec-review.md`, `- [Spec Review](./spec-review.md)`, `Spec review: not run (no subagent tool)`, `Never run the review in this context.`, `at most one re-review`, `Author model:`.
  - Step 9 sub-steps, in this order:
    1. Resolve the standard as `references/spec-review.md` in the base directory of this skill.
    2. When the harness has no tool that starts a subagent with a fresh context: tell the user, write the not-run form of the file, add the index line, and go to step 10. `Never run the review in this context.`
    3. Spawn one fresh subagent. Give it only the absolute paths of the standard, `spec.md`, `plan.md`, and the resolved Product Definition, Tech Stack, and Workflow. The step contains the sentence `Give the subagent no conversation history, no answers from the questioning phase, and no summary of your own.`
    4. Write the returned text without changes below the header lines of the Report Layout. The `Author model:` value is the model id that the harness reports for this session, or `unknown`. Add the line `- [Spec Review](./spec-review.md)` to the track `index.md`.
    5. Show the user the two paraphrase sections and each Blocker and Major finding. Ask the user to compare the paraphrase with the intent and to pick the findings to fix.
    6. Apply the picked fixes to `spec.md` and `plan.md`. Write one Author Response line for each finding. Nit findings get `not fixed — Nit` unless the user picks them.
    7. When `spec.md` or `plan.md` changed, run one second round with a new fresh subagent. Give it the same paths and the Round 1 findings with the author responses. Append its sections under `## Round 2`, and show the result to the user.
    8. There is `at most one re-review`. Write each remaining Blocker and Major finding under `## Accepted Risks`. Ask the user to approve the commit or to stop.
    9. When the plan changed, count its top-level tasks again and update `estimated_tasks`.
  - The index template of step 5 does not contain `spec-review`.
- `skills/measure/SKILL.md`: the "### New Track" paragraph names the review step and contains `references/spec-review.md`. The Directory Structure block gets the line `│       ├── spec-review.md  # Spec review report (fresh subagent)` after the `spec.md` line of the track folder.
- `skills/measure/references/new-track-set.md` does not change.

- [x] Task 1.1: Contract: add a Tooling Exceptions row for `spec_review_gate_20261030` to `measure/tech-stack.md`. Introduced CLI: `measure_interphase_checks.py role-gate --role spec-review` and the `dispositions:` check (extended, Python standard library only). Verification layer: bash contract tests and `python3 -m unittest` under `tests/spec_review_gate/`, runner `tests/spec_review_gate/run.sh`. Reason: the checker decides gate results, and a manual check cannot prove each rejection case. 59b548e
- [x] Task 1.2: Red: write `tests/spec_review_gate/run.sh`, `tests/spec_review_gate/test_s1_standard.sh`, and `tests/spec_review_gate/test_s1_new_track.sh`. Run `bash tests/spec_review_gate/run.sh 'test_s1_*.sh'`, and record the failures in the git note. Cases: dbd7127
    - `test_s1_standard.sh` normal: the file exists and line 1 is the title; the eight headings exist in the contract order; the EGM URL and `Apache-2.0`; `The reviewer gets no conversation history.`; both paraphrase heading strings and `2 to 5 sentences`; the five kinds in the Zero-Decision Check section; the literal finding line; `Comprehension gap:`; `Do not flag general engineering terms.`; `at most one re-review` and `## Accepted Risks`; `Spec review: not run (no subagent tool)`; the `spec_review_gate_20261030` row in `measure/tech-stack.md`.
    - `test_s1_standard.sh` edge: the order check fails when one heading is missing (the test builds a copy of the file without `## Severity` in a temporary folder and expects its order function to report FAIL).
    - `test_s1_new_track.sh` normal: the step 9 start line in §2.5; each step 9 marker string between the step 9 line and the step 10 line; line of `6. Write files:` < line of step 9 < line of `10. **Commit Changes:**`; `11. Announce completion:`; the SKILL.md New Track paragraph contains `references/spec-review.md`; the SKILL.md Directory Structure block contains `spec-review.md`; `diff -r skills/measure claude-skills/measure` is empty.
    - `test_s1_new_track.sh` edge: each number 1 to 11 starts exactly one numbered line in §2.5; the step 5 block (from `5. **Create Track Index:**` to `6. Write files:`) has no `spec-review`; `new-track-set.md` has no `spec-review` and still contains `§2.5 step 5`, `§2.5 step 4`, and `§2.5 step 8`; the runner exits 1 and prints `no suites matched` for the pattern `test_none_*.sh`.
    - Red evidence (commit dbd7127, git note attached): `bash tests/spec_review_gate/run.sh 'test_s1_*.sh'` exits 1 and prints `=== spec_review_gate: 2 suites (PASS=0, FAIL=2) ===`. `test_s1_standard.sh` gives 16 checks (PASS=2, FAIL=14): each failure is a missing `skills/measure/references/spec-review.md`. `test_s1_new_track.sh` gives 41 checks (PASS=22, FAIL=19): each failure is a missing step 9 and step 11 in §2.5 of `new-track.md`, or a missing line in `SKILL.md`. The runner works: `bash tests/spec_review_gate/run.sh 'test_none_*.sh'` exits 1 and prints `no suites matched`.
- [x] Task 1.3: Green: write `skills/measure/references/spec-review.md` as the contract states, and copy it to `claude-skills/measure/references/spec-review.md`. 1f9e753
- [x] Task 1.4: Green: add step 9 to §2.5 of `skills/measure/references/new-track.md` and renumber steps 10 and 11. Update the "### New Track" paragraph and the Directory Structure block of `skills/measure/SKILL.md`. Copy both files to `claude-skills/measure/`. 55fde72
- [~] Task 1.5: Docs and checks: change the New Track line of `measure/product.md` to name the independent spec review. Add `spec-review.md` to the `new-track` output in the command table of `README.md`. Add a line under "## Unreleased" / "### Features" of `CHANGELOG.md`. Run the S1 command and the full runner.

## Phase S2: The measure-spec-review orchestrator role
_Story ref: spec.md#story-s2_

**Contract (acceptance criteria).**

- Checker `skills/measure-orchestrator/scripts/measure_interphase_checks.py`:
  - `ROLE_ALIASES` gets `"spec-review": "spec-review"`, `"spec_review": "spec-review"`, and `"measure-spec-review": "spec-review"`.
  - A module constant `SPEC_REVIEW_FINDING_RE = re.compile(r"^F[1-9][0-9]* \[(Blocker|Major|Nit)\] .+?: .+")`.
  - A new function `validate_spec_review_payload(payload: dict[str, object]) -> list[str]`. `validate_audit_payload` calls it when `role == "spec-review"`, in the same way as `validate_ux_payload`. It skips a finding list that is not a list (`validate_string_list` reports that). Its messages:
    - `paraphrase must be an object with proposes and current_system`
    - `paraphrase.proposes must be a non-empty string`
    - `paraphrase.current_system must be a non-empty string`
    - `spec-review finding has an invalid format: <finding>`
    - `blocking_findings may contain only [Blocker] findings: <finding>`
    - `nonblocking_findings may contain only [Major] or [Nit] findings: <finding>`
    - `spec-review status pass requires empty blocking_findings`
    - `spec-review status fail requires retry_recommendation escalate_human`
  - `cmd_role_gate`: add `"spec-review"` to the set of audit roles, so the existing `--result-file` and `passing_audit_feedback` checks run. Add a `spec-review` block: without `--baseline`, the message is `--baseline is required for spec-review`. With `--baseline`, each path from `committed_files(repo, baseline)` that does not start with `measure/runs/` fails. The message is `spec-review committed files outside measure/runs/`, followed by one `- <path>` line for each path. The block does not read `plan.md` or `--phase`.
  - On success the output is `PASS: spec-review gate passed`.
- Role file `agents/measure-spec-review.md`:
  - Frontmatter: `description:` (one line), `mode: subagent`, `steps: 40`, `model: kimi-for-coding/k3`, `options:` with `reasoningEffort: max`. Under `permission:` the `edit` block has exactly `"*": deny`, `"measure/runs/**": allow`, and `"**/measure/runs/**": allow`. The `bash` block is the same, line for line, as in `agents/measure-review-a-correctness.md`. Then `skill: allow`, and `task:` with `"*": deny`.
  - The body starts with `You are the Measure Spec Review subagent.`
  - Inputs: `role_base_sha`, `audited_head_sha`, the track id, the result path, the log path, and the round (`1` or `2`). For round 2, the orchestrator also gives the round 1 findings. The role confirms that `audited_head_sha` equals HEAD.
  - Standard: the role reads `~/.agents/skills/measure/references/spec-review.md`. When that file does not exist and the repository has `skills/measure/references/spec-review.md`, it reads that file. When neither exists, it writes `status: inconclusive` with `retry_recommendation: infrastructure_retry`.
  - The role does not read `measure/tracks/<track>/spec-review.md` (spec Decision 15).
  - Artifacts: `measure/runs/<track>/spec-review-<short-head>.json` and `measure/runs/<track>/spec-review-<short-head>.log`. The role writes both first with a provisional `inconclusive` verdict, then refines them.
  - JSON: the audit schema of `references/contracts.md` plus `"paraphrase": {"proposes": "...", "current_system": "..."}`. Findings use the one-line format of the standard. Blockers go in `blocking_findings`. Majors and Nits go in `nonblocking_findings`. `status: pass` only without a Blocker. `retry_recommendation`: `none` on pass, `escalate_human` on fail, `infrastructure_retry` on inconclusive.
  - Report-only: the role edits no file outside its two artifacts and makes no commit. It ends with the `MEASURE_AGENT_RESULT` block, with `role: spec-review` and `phase: track setup`.
- `skills/measure-orchestrator/SKILL.md`:
  - The role list in the first paragraph starts with `measure-spec-review`.
  - Role Order: the line ``0. `measure-spec-review` (once per track, phase "track setup", before the first `measure-strategy`)`` before line 1. Directly after item 12, a paragraph that starts with `Spec review gate:` states the rules of spec Decision 14: the skip rule, the fail route (`escalate_human`, then the user or a build session revises and commits `spec.md` or `plan.md`, then one re-run), the second-fail rule, and the pass rule.
  - Model Selection: the bullet `The spec reviewer uses a family other than the family that wrote spec.md and plan.md.` The next sentence says: read the `Author model:` line of `measure/tracks/<track>/spec-review.md`. When the line is absent or `unknown`, use a family other than the family of the host build agent, and record the assumption as a deviation.
  - Inter-Phase Checks: the example line `python3 ~/.agents/skills/measure-orchestrator/scripts/measure_interphase_checks.py role-gate --repo . --role spec-review --track TRACK --phase "track setup" --baseline BASE_SHA --result-file RESULT.json --log-file LOG`.
- `skills/measure-orchestrator/references/contracts.md`: a new section `## Spec Review JSON` after the UX block. It shows the `paraphrase` object with `proposes` and `current_system`, the finding format, and the status and retry rules above.
- `agents/measure-orchestrator.md` (repository file): the first bullet of "## Role Handoff Rules" starts with `Run roles in the skill's order: spec review once per track before the first strategy, then strategy,`. No other section changes (spec Decision 22).
- `plugins/opencode-measure-guard/commands/measure-orchestrate.md`: the description becomes `"Measure: run the active track with the orchestrator and its subagents (spec review, strategy, red, green, reviews, acceptance)"`.
- `README.md`: in the role table, a row after `measure-orchestrator`: ``| `measure-spec-review` | Reviews spec.md and plan.md before Red starts: a paraphrase, a zoom-out check, and a zero-decision check. |``.
- `measure/product.md` says `14 role definitions`. `measure/tech-stack.md` says `# 14 measure-* role definitions`.

- [ ] Task 2.1: Red: write `tests/spec_review_gate/test_checker.py` (class `SpecReviewRoleGateTest`) and `tests/spec_review_gate/test_s2_role_docs.sh`. Run `bash tests/spec_review_gate/run.sh 'test_s2_*.sh' test_checker.py`, and record the failures in the git note. Cases:
    - Fixture: a temporary git repository with `measure/index.md`, `measure/tracks.md`, and `measure/tracks/demo_track/plan.md` (`## Phase S1: Fixture` and `- [x] Task 1.1: Fixture task abc1234`), one commit with `git -c user.name=test -c user.email=test@example.com`, and the baseline from `git rev-parse HEAD`. The result JSON goes to `measure/runs/demo_track/spec-review-test.json`.
    - Normal: a pass JSON with one `[Major]` and one `[Nit]` finding and a full paraphrase exits 0 with `PASS: spec-review gate passed`; the aliases `spec_review` and `measure-spec-review` exit 0; a commit that adds only `measure/runs/demo_track/note.txt` exits 0; `audit-result --role spec-review` on the pass JSON exits 0.
    - Edge, each exits 1 with its message: no `--result-file`; no `--baseline`; `status: fail` with a `[Blocker]` finding (the output contains the finding text); no `paraphrase`; an empty `proposes`; a `current_system` of spaces; the finding `Major: no id`; a `[Blocker]` in `nonblocking_findings`; a `[Major]` in `blocking_findings`; `status: pass` with a `[Blocker]` in `blocking_findings`; `status: fail` with `retry_recommendation: retry_implementation` (through `audit-result`); a commit that adds `src/app.py` (the output names `src/app.py`).
    - Backward compatibility: `audit-result --role review-a` on a valid JSON without `paraphrase` exits 0; `role-gate --role nope` prints a valid-role list that contains `spec-review`.
    - `test_s2_role_docs.sh` normal: the role file exists; its frontmatter values from the contract; its `edit` block has exactly the three lines; its `bash` block equals the block of review A (extracted from `  bash:` to `  skill:` in each file); the body strings `~/.agents/skills/measure/references/spec-review.md`, `skills/measure/references/spec-review.md`, `spec-review-<short-head>.json`, `escalate_human`, `paraphrase`, `track setup`, `MEASURE_AGENT_RESULT`; the SKILL.md strings (first paragraph, line `0.`, the model rule, the example line); `## Spec Review JSON` with `"proposes"` and `"current_system"` in `contracts.md`; the Role Handoff Rules bullet; the command description; the README row; `14` in `product.md` and `tech-stack.md`.
    - `test_s2_role_docs.sh` edge: `skills/measure/references/spec-review.md` exists (the fallback path of the role is real); for each `--role <name>` in `skills/measure-orchestrator/SKILL.md`, `python3 <checker> audit-result --role <name> --file /nonexistent` prints no `unknown role`; neither `product.md` nor `tech-stack.md` contains `13 role definitions` or `13 measure-*`.
- [ ] Task 2.2: Green: change `skills/measure-orchestrator/scripts/measure_interphase_checks.py` as the contract states (aliases, `SPEC_REVIEW_FINDING_RE`, `validate_spec_review_payload`, the `spec-review` block in `cmd_role_gate`).
- [ ] Task 2.3: Green: write `agents/measure-spec-review.md` as the contract states.
- [ ] Task 2.4: Green: update `skills/measure-orchestrator/SKILL.md`, `skills/measure-orchestrator/references/contracts.md`, `agents/measure-orchestrator.md`, and `plugins/opencode-measure-guard/commands/measure-orchestrate.md` as the contract states.
- [ ] Task 2.5: Docs and checks: add the README role row. Change the role count in `measure/product.md` and `measure/tech-stack.md` to 14. Add a `CHANGELOG.md` line. Run the S2 command, the full runner, and `bun test plugins/opencode-measure-guard/tests/commands.test.ts`.

## Phase S3: Finding dispositions
_Story ref: spec.md#story-s3_

**Contract (acceptance criteria).**

- `skills/measure-orchestrator/references/contracts.md`, a new section `## Finding Dispositions` after `## Spec Review JSON`:
  - Routed finding form `F<n> [Blocker|Major|Nit] <scope>: <text>`, with the id and severity rules of spec Decision 19. The scope names for other roles: `review-a`, `review-b`, `review-c`, `adversarial-testing`, `ux-browser-review`, `phase-acceptance`.
  - The owner: Green for code and tests; the user or a build session for `spec.md` and `plan.md`.
  - Four bullets that start with `- **FIX**`, `- **CONTEST**`, `- **ESCALATE**`, and `- **DECLINE**`. CONTEST cites evidence that the reviewer can read: a file path and symbol, a test, or a decision recorded in `spec.md`, `plan.md`, `tech-stack.md`, or `test-strategy.md`. ESCALATE is for evidence outside the files that the reviewer can read; the user decides. DECLINE is only for Nit findings.
  - The sentence `"Intentional" or "by design" without a cited record is not evidence.`
  - The rules: the owner does not change a severity, so a dispute of a Blocker is a CONTEST. A finding whose description starts with `Comprehension gap:` takes FIX or ESCALATE only.
  - The optional result line, below the block template: `dispositions: F1=FIX; F2=CONTEST(<evidence>); F3=ESCALATE(<reason>); F4=DECLINE`, or `dispositions: none`. The line is required when the brief of the role contained routed findings. The syntax rules of spec Decision 18. The Agent Result Block template itself does not change.
  - Re-review: the next run of the role that raised a finding receives each CONTEST item with its evidence. To withdraw an item, the reviewer omits the finding and adds the `evidence` entry `F<n> withdrawn: <what the reviewer checked>`. To keep an item, the reviewer writes the routed finding text plus ` | CONTEST kept: <reason>` in its earlier list and sets `retry_recommendation: escalate_human`. The orchestrator sends ESCALATE items and kept CONTEST items to the user.
  - The no-FIX round rule of spec Decision 20, with the words `no FIX item`.
- Checker `skills/measure-orchestrator/scripts/measure_interphase_checks.py`:
  - A new function `dispositions_feedback(log_path: str) -> list[str]`. It finds the last line that is exactly `MEASURE_AGENT_RESULT` (after `strip()`) and the next line that is exactly `END_MEASURE_AGENT_RESULT`. In that block, it reads the first line that starts with `dispositions:`. Without such a line, it returns no feedback.
  - The value `none` is valid. Any other value splits on `;`. Each item, after `strip()`, must match `^F[1-9][0-9]*=(FIX|DECLINE|(CONTEST|ESCALATE)\((.+)\))$`, and the text in the parentheses must contain a non-space character. An empty value, an empty item, or a repeated id is not valid.
  - Each message starts with `invalid dispositions line: `. A repeated id gives `invalid dispositions line: duplicate finding id F<n>`.
  - `cmd_role_gate` calls it for every role when `--log-file` is given and the file exists, after the `has_agent_result` check.
- `skills/measure/references/spec-review.md`: a new section `## Finding Dispositions` before `## Report Layout`. It defines the four words for the author of the spec, with the rule that a comprehension gap `cannot be contested`. The Author Response lines of the Report Layout become `- F<n>: FIX`, `- F<n>: CONTEST(<evidence>)`, `- F<n>: ESCALATE(<reason>)`, and `- F<n>: DECLINE`. The S1 form `not fixed —` goes away.
- `skills/measure/references/new-track.md` step 9: sub-step 6 records one disposition for each finding in the new Author Response form. Nit findings get `DECLINE` unless the user picks them. Sub-step 7 gives the second round the CONTEST items with their evidence.
- `skills/measure/references/review.md`: the finding heading of §2.5 becomes `### F<n> [Critical/High/Medium/Low] Description of Issue`. §3.1 gets item `3. **Record Dispositions:**` after item 2: the user or the implementer gives each finding one of the four dispositions. DECLINE is only for Low findings. A CONTEST item goes back to the reviewer, who withdraws it or keeps it; the user decides a kept item and each ESCALATE item.
- `agents/measure-jr-green.md`: a section `## Routed findings`, directly before `## Fabricate-vs-block decision`, that names `Finding Dispositions` in `references/contracts.md`, requires the `dispositions:` line when the brief has routed findings, and states the no-FIX round rule.
- `agents/measure-review-a-correctness.md`, `agents/measure-review-b-security.md`, `agents/measure-review-c-ux-api.md`, `agents/measure-phase-acceptance.md`, and `agents/measure-spec-review.md`: one paragraph each on contested items, with the strings `withdrawn:`, `| CONTEST kept:`, and `escalate_human`. The paragraph goes directly before the paragraph that starts with `This is an audit-only role` or `This is a gate-only role`. In `measure-spec-review.md`, it goes directly before the report-only paragraph.
- `skills/measure-orchestrator/SKILL.md`, "## Delegation": the orchestrator gives routed findings ids in the form of `Finding Dispositions`, sends CONTEST items to the next run of the role that raised them, sends ESCALATE and kept CONTEST items to the user, and applies the `no FIX item` rule.

- [ ] Task 3.1: Red: add the class `DispositionsLineTest` to `tests/spec_review_gate/test_checker.py`, and write `tests/spec_review_gate/test_s3_dispositions_docs.sh`. Run `bash tests/spec_review_gate/run.sh 'test_s3_*.sh' test_checker.py`, and record the failures in the git note. Cases:
    - Fixture: the S2 repository with a second commit that adds `src.txt`, `GREEN_TEST_COMMAND=true`, and `role-gate --role jr-green --phase "Phase S1: Fixture" --baseline <first commit> --log-file <log>`. The log holds a full `MEASURE_AGENT_RESULT` block.
    - Normal, each exits 0: no `dispositions:` line; `dispositions: none`; `dispositions: F1=FIX; F2=CONTEST(tests/test_x.py::test_empty covers the empty case); F3=ESCALATE(team rule from the 2026-10-01 call); F4=DECLINE`.
    - Edge, each exits 1 with `invalid dispositions line`: `F1=fix`; `F1=IGNORE`; `F2=CONTEST`; `F2=CONTEST()`; `F2=CONTEST(   )`; `F3=ESCALATE()`; `F1=FIX(done)`; `F1=FIX; F1=DECLINE` (the output has `duplicate finding id F1`); an empty value; `F0=FIX`; `X1=FIX`; `F1=FIX;`.
    - Edge, each exits 0: two blocks where the first has `dispositions: F1=bad` and the last has `dispositions: none`; a `dispositions: F1=bad` line after `END_MEASURE_AGENT_RESULT`.
    - `test_s3_dispositions_docs.sh` normal: the `contracts.md` section, its four bullets, the evidence sentence, `dispositions: none`, `dispositions: F1=FIX; F2=CONTEST(`, `| CONTEST kept:`, `withdrawn:`, `Comprehension gap:`, `no FIX item`; `Finding Dispositions` and `dispositions:` in the Green role; `| CONTEST kept:`, `withdrawn:`, and `escalate_human` in each of the five audit roles; `Finding Dispositions`, `ESCALATE`, and `no FIX item` in the Delegation section of the orchestrator skill; the `review.md` heading form and the four words in §3.1; `## Finding Dispositions` and `cannot be contested` in the standard; `CONTEST(` and `ESCALATE(` in new-track step 9; `diff -r skills/measure claude-skills/measure` is empty.
    - `test_s3_dispositions_docs.sh` edge: the Agent Result Block template in `contracts.md` (the first `text` code block) has no `dispositions` line and still has the same 12 lines from `MEASURE_AGENT_RESULT` to `END_MEASURE_AGENT_RESULT`; no file in `skills/` or `agents/` contains `not fixed —`.
- [ ] Task 3.2: Green: add `dispositions_feedback` to the checker and call it from `cmd_role_gate`, as the contract states.
- [ ] Task 3.3: Green: add `## Finding Dispositions` to `contracts.md`. Update `spec-review.md`, `new-track.md` step 9, and `review.md` as the contract states. Copy the changed `skills/measure/` files to `claude-skills/measure/`.
- [ ] Task 3.4: Green: update `agents/measure-jr-green.md`, the five audit role files, and the Delegation section of `skills/measure-orchestrator/SKILL.md` as the contract states.
- [ ] Task 3.5: Docs and checks: in the "## Multi-agent orchestration" section of `README.md`, add one sentence on the four dispositions after "Review and audit roles only report." Add a `CHANGELOG.md` line. Run the S3 command and the full runner.

## Phase S4: Doc drift check in the weekly audit
_Story ref: spec.md#story-s4_

**Contract (acceptance criteria).**

- Anti-pattern entry, the same text in `skills/measure-orchestrator/references/anti-pattern-catalog.md` and in `measure/anti-patterns.md`. It comes after the A10 entry and its `---` line, and before `## How projects extend this catalog`. It ends with its own `---` line. Text:

  ````markdown
  ## A11 — Doc-to-code drift after closeout

  **Class:** documentation truthfulness
  **Caught:** 2026-10-30, track `spec_review_gate_20261030` (adapted from the EGM drift report)
  **Detection:**
  ```bash
  for doc in measure/product.md measure/tech-stack.md; do
    grep -o '`[^`]*`' "$doc" | tr -d '`' | grep -E '^[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]*$' | sort -u |
    while read -r p; do [ -e "$p" ] || echo "$doc: DRIFT candidate: $p does not exist"; done
  done
  ```
  This recipe finds only path claims. The doc drift detector of `measure-orchestrator-audit` also checks symbols, commands, fields, counts, and behavior.

  **Symptoms:** A document that agents read names a file, a field, a command, a count, or a behavior that the code no longer has. Example: `product.md` says "13 role definitions" after a 14th role file was added.

  **Fix:** Update the document, or open a track that changes the code. The user picks one.

  **Guard:** The "Doc drift detector" section of `measure-orchestrator-audit` (weekly scheduled audit).
  ````

- `agents/measure-orchestrator-audit.md`:
  - A section `## Doc drift detector` after the A10 detector and before `## Outputs`. Its first sentence says that it runs only in the scheduled (weekly) audit.
  - Scope: `measure/product.md`, `measure/tech-stack.md`, and the `spec.md` of each track in scope by spec Decision 24 (the `completed` field, else the date part of `updated_at`; status `done`, `completed`, or `complete`; `cancelled` excluded; the last `30 days`). Older specs are history, and later tracks can replace them.
  - Procedure: run the A11 recipe. For each document, list each concrete claim with its line (file, symbol, command, field, count, behavior). Find the code. Compare.
  - Report only differences: a missing feature, a missing field, a fixed value where the document says computed, a different pattern or library. A difference that a later track spec explains is not drift. The sentence `Do not report code that no document covers.`
  - Output: one nonblocking finding for each difference: `DRIFT: <path>:<line> — claim: <claim> — code: <evidence> — options: update the document, or open a track`. The sentence `Drift alone does not fail the audit.`
  - The Inputs list gets item 5 for the drift scope (scheduled audit only). `A1–A10 today` becomes `A1–A11 today`.
- `agents/measure-strategy.md`: `(A1–A10 today)` becomes `(A1–A11 today)`.
- `skills/measure-orchestrator/SKILL.md`: `10 entries (A1–A10)` becomes `11 entries (A1–A11)`. Role Order item 10 becomes ``10. `measure-orchestrator-audit` (anytime; recommended weekly; the weekly run includes the doc drift detector)``.
- `CHANGELOG.md`: under "## Unreleased", a line for the drift check that credits EGM with `https://github.com/google/elephant-goldfish-model` and `Apache-2.0`, and names the three adapted ideas.
- `README.md`: the `measure-orchestrator-audit` row says `Audits the framework itself for known anti-patterns, and each week for doc-to-code drift.`

- [ ] Task 4.1: Red: write `tests/spec_review_gate/test_s4_doc_drift.sh`. Run `bash tests/spec_review_gate/run.sh 'test_s4_*.sh'`, and record the failures in the git note. Cases:
    - Normal: `## Doc drift detector` exists after `## A10` and before `## Outputs` in the audit role; the section has `measure/product.md`, `measure/tech-stack.md`, `30 days`, `completed`, `updated_at`, `cancelled`, `scheduled`, `DRIFT:`, `Drift alone does not fail the audit.`, and `Do not report code that no document covers.`; both catalogs have `## A11 — Doc-to-code drift after closeout` before `## How projects extend this catalog`; SKILL.md has `11 entries (A1–A11)` and `doc drift detector` in Role Order item 10; the "## Unreleased" section of `CHANGELOG.md` has `elephant-goldfish-model`; the README audit row has `doc-to-code drift`.
    - Edge: the A11 block (from its heading to the next `---` line) is the same in both catalogs; no file in `agents/` or `skills/measure-orchestrator/` contains `A1–A10`; the bash block of A11, extracted from the catalog and run with `bash` in the repository root, exits 0.
- [ ] Task 4.2: Green: add the A11 entry to `skills/measure-orchestrator/references/anti-pattern-catalog.md` and to `measure/anti-patterns.md`.
- [ ] Task 4.3: Green: add the doc drift detector and the count changes to `agents/measure-orchestrator-audit.md`. Change the count in `agents/measure-strategy.md`. Update `skills/measure-orchestrator/SKILL.md` as the contract states.
- [ ] Task 4.4: Docs and checks: add the `CHANGELOG.md` line with the EGM credit. Change the README audit row. Run the S4 command, the full runner, and `diff -r skills/measure claude-skills/measure`.
