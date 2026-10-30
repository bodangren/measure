# Test Strategy: Spec review gate, finding dispositions, and doc drift check

Track: `spec_review_gate_20261030`. Spec: [spec.md](./spec.md). Plan: [plan.md](./plan.md).
Written at `role_base_sha` `7d72b40` for Phase S1. Refreshed at `role_base_sha` `1c24539` for Phase S2, and at `role_base_sha` `25b9064` for Phase S3. It covers all four phases. Later phases need only a refresh commit.

The S3 refresh changes: the S3 section (targeted Red command, Red evidence rules, full Review B and Review C scopes, the S3 adversarial probes, the backward-compatibility probe), the S2 status (accepted, rename gap closed), the environment facts at `25b9064`, the guardrails of the parser, and the S2 lessons (section 10). S4 does not change.

The "Rules for every phase" section and the "Test commands" table of `plan.md` are binding. This strategy adds gates, ownership, risk, review applicability, and anti-pattern defenses. It does not change a contract block.

## 1. Environment facts

- **measure-guard denies edits outside `measure/`.** The OpenCode plugin allows an edit outside `measure/` only when `measure/tracks.md` marks a track `[~]` and `plan.md` marks a task `[~]`. At `25b9064`, the track line is `- [~]`, and no task is `[~]`.
- **Red must set the task marker before it writes `tests/`.** In S3, Red marks Task 3.1 `[~]` in `plan.md` first. In S1, Red also changed the track line; that step is complete.
- **Adversarial testing also meets the guard.** When no task is `[~]`, a role that must write `tests/` writes its draft under `measure/runs/spec_review_gate_20261030/` and moves it with the shell (S2 lesson). The role states the move in `handoff`.
- **The guard also blocks remediation rounds.** When every phase task is `[x]`, Green cannot edit outside `measure/`. In S1, Green set the task `[~]` only in the working tree, made the edits, and restored `[x]` with the SHA before each commit. Use the same method in S2 and S3 remediation. No commit may carry the temporary `[~]`.
- **The cron job installs from `main` every hour.** Each commit goes live in `~/.agents/` and `~/.config/opencode/`. The orchestrator gates use `~/.agents/skills/measure-orchestrator/scripts/measure_interphase_checks.py`, so the gate checker can change during S2 and S3. Record the output of `bin/install-measure-skill --check` when a gate result is not consistent with the repository checker.
- **The tests use the repository checker.** Every Python test runs `$ROOT/skills/measure-orchestrator/scripts/measure_interphase_checks.py`. No test reads the installed copy in `~/.agents/`.
- **`measure/doctor.sh` does not exist** at `7d72b40`. See section 7.
- **`measure/runs/` is in `.gitignore`.** No role commits a run artifact.
- **Baselines at `7d72b40`:** `diff -r skills/measure claude-skills/measure` is empty, `check-parity.sh` prints `parity: ok`, and `bun test plugins/opencode-measure-guard` gives `85 pass, 0 fail`.
- **Baselines at `1c24539`:** `bash tests/spec_review_gate/run.sh` gives `3 suites (PASS=3, FAIL=0)` (`test_s1_adversarial.sh`, `test_s1_new_track.sh`, `test_s1_standard.sh`). `bun test plugins/opencode-measure-guard` gives `85 pass, 0 fail`. The host has Python 3.14.4 and git 2.53.0.
- **Baselines at `25b9064`** (run by this refresh): `bash tests/spec_review_gate/run.sh` gives `6 suites (PASS=6, FAIL=0)`. The S2 suites are `test_checker.py` (class `SpecReviewRoleGateTest`), `test_s2_role_docs.sh`, and `test_s2_adversarial.sh` (96 checks). `bun test plugins/opencode-measure-guard` gives `85 pass, 0 fail`. Adversarial testing in S2 saw one flake in `test_s1_adversarial.sh` that did not repeat. A second flake is a finding.
- **Run logs at `25b9064`:** `measure/runs/` holds 37 `*.log` files; 28 have an exact `MEASURE_AGENT_RESULT` line and an exact `END_MEASURE_AGENT_RESULT` line. `measure/archive/` holds 0 `*.log` files. One log has a `dispositions:` line: `jr-green-s2-r3.log` with `dispositions: F1=FIX; F2=FIX`.
- **The S2 checkpoint is not in `plan.md` yet.** The `## Phase S2` heading has no `[checkpoint: ...]`. The orchestrator records it (phase acceptance at `25b9064`).
- **The checker inherits the git configuration of the host.** `git()` in the checker adds no `-c` option. Thus `diff.renames` and `core.quotePath` change the output of `committed_files`. Each S2 fixture and probe sets `GIT_CONFIG_GLOBAL=/dev/null` and `GIT_CONFIG_NOSYSTEM=1`, so the result does not depend on the host.
- **This track cannot use `measure-spec-review` on itself.** The role does not exist before S2. After S2, the skip rule of spec Decision 14 applies, because the plan has `[x]` tasks.

## 2. Capture of `phase_base_sha`

- **S1:** run `git rev-parse HEAD` directly after the commit `measure(strategy): Test strategy for track 'Spec review gate'` lands. Do this before Red makes its first edit. That SHA is the S1 `phase_base_sha`.
- **S2, S3, S4:** the strategy role commits a refresh of this file at the start of each phase. Run `git rev-parse HEAD` directly after that refresh commit, before Red starts. That SHA is the `phase_base_sha` of the phase.
- **S3 now:** the S3 refresh commit is `measure(strategy): Refresh the test strategy for Phase S3`. Its parent is `25b9064`. Capture `phase_base_sha` with `git rev-parse HEAD` directly after this commit lands, before Red marks Task 3.1 `[~]`. When the orchestrator records the S2 checkpoint in `plan.md` after this commit, capture `phase_base_sha` after that checkpoint commit. Do this still before Red marks Task 3.1 `[~]`. Both commits change only `measure/`. Do not use `25b9064`, `ccdaae2`, or any SHA of S1 or S2.
- Do not use `7d72b40` or a SHA of an earlier phase as `phase_base_sha`. This file contains no `phase_base_sha` value.

## 3. Task ownership and gate markers

The Red gate accepts only commits to `tests/` and `measure/`, and it needs at least one current-phase task `[~]`. The Green gate needs every phase task `[x]` with a SHA.

| Phase | Red owns | Green owns | Handoff marker that Red leaves |
| --- | --- | --- | --- |
| S1 | Task 1.1 (`measure/tech-stack.md`, a Measure file), Task 1.2 | Tasks 1.3, 1.4, 1.5 | Tasks 1.1 and 1.2 `[x]` with SHA; Task 1.3 `[~]` |
| S2 | Task 2.1 | Tasks 2.2, 2.3, 2.4, 2.5 | Task 2.1 `[x]` with SHA; Task 2.2 `[~]` |
| S3 | Task 3.1 | Tasks 3.2, 3.3, 3.4, 3.5 | Task 3.1 `[x]` with SHA; Task 3.2 `[~]` |
| S4 | Task 4.1 | Tasks 4.2, 4.3, 4.4 | Task 4.1 `[x]` with SHA; Task 4.2 `[~]` |

- Red marks the first Green task `[~]` as its last plan edit. This keeps the Red task record true (A5), satisfies the Red gate, and lets Green edit outside `measure/`.
- The docs tasks (1.5, 2.5, 3.5, 4.4) change `README.md` and `CHANGELOG.md`. These files are outside `measure/` and `tests/`, so Green owns them.
- Task 2.5 and Task 4.2 also change `measure/` files. Green owns them, because the same task changes files outside `measure/` or the phase contract assigns them to Green.
- Each task gets one commit, then one plan-evidence commit with the task SHA (plan rule).
- In S2, Red marks only Task 2.1 `[~]` before its first edit. The track line is already `[~]`.

## 4. Phase gates

`RUN` means `bash tests/spec_review_gate/run.sh`. `BUNDLE` means `diff -r skills/measure claude-skills/measure`.

| Phase | `RED_TEST_COMMAND` (must exit non-zero) | `GREEN_TEST_COMMAND` (must exit 0) |
| --- | --- | --- |
| S1 | `bash tests/spec_review_gate/run.sh 'test_s1_*.sh'` | `bash tests/spec_review_gate/run.sh 'test_s1_*.sh' && bash tests/spec_review_gate/run.sh && diff -r skills/measure claude-skills/measure` |
| S2 | `bash tests/spec_review_gate/run.sh 'test_s2_*.sh' test_checker.py` | `bash tests/spec_review_gate/run.sh 'test_s2_*.sh' test_checker.py && bash tests/spec_review_gate/run.sh && diff -r skills/measure claude-skills/measure && bun test plugins/opencode-measure-guard/tests/commands.test.ts` |
| S3 | `bash tests/spec_review_gate/run.sh 'test_s3_*.sh' test_checker.py` | `bash tests/spec_review_gate/run.sh 'test_s3_*.sh' test_checker.py && bash tests/spec_review_gate/run.sh && diff -r skills/measure claude-skills/measure` |
| S4 | `bash tests/spec_review_gate/run.sh 'test_s4_*.sh'` | `bash tests/spec_review_gate/run.sh 'test_s4_*.sh' && bash tests/spec_review_gate/run.sh && diff -r skills/measure claude-skills/measure` |

**Red evidence.** A non-zero exit is not sufficient. Red records in the git note the name of each failing check and the reason. Each failure must come from a missing deliverable of the phase, not from a harness defect. A syntax error, a missing runner, or a wrong `$ROOT` is a false Red.

**Closeout gate of each phase** (phase acceptance runs it on the immutable HEAD):

```bash
bash -c "$GREEN_TEST_COMMAND"
python3 -m py_compile skills/measure-orchestrator/scripts/measure_interphase_checks.py
python3 -m py_compile tests/spec_review_gate/test_checker.py   # S2 and later
bash -c 'for f in tests/spec_review_gate/*.sh; do bash -n "$f" || exit 1; done'
bash plugins/opencode-measure-guard/scripts/check-parity.sh
bun test plugins/opencode-measure-guard
git diff --quiet 7d72b40665074a89f5be606935cad94a1ef1e4e9 -- skills/measure/references/new-track-set.md
python3 skills/measure-orchestrator/scripts/measure_interphase_checks.py ux-paths --repo . --baseline <phase_base_sha>
```

`7d72b40` here is the track base of spec acceptance criterion 4, not a `phase_base_sha`. The `ux-paths` line must print nothing. Output from it means a UX-relevant file changed, and browser review becomes applicable.

**Intentionally red aggregate.** No suite is intentionally red at a Green gate or at a closeout gate. Each phase adds its suites only in its own Red task. In S2, the S1 suites (including `test_s1_adversarial.sh`) must stay green at Red, at Green, and at closeout. A failing S1 suite at S2 Red is a regression, not Red evidence. Thus `RUN` with the default patterns fails only between the Red commit and the Green commit of the current phase. In S3, `test_checker.py` holds the green `SpecReviewRoleGateTest` and the red `DispositionsLineTest`, so the file fails as one suite at Red. The Red git note must show that each `SpecReviewRoleGateTest` case still passes (`python3 -m unittest -v` output). At S3 Red, `test_s1_*.sh`, `test_s2_role_docs.sh`, and `test_s2_adversarial.sh` must pass; a failure there is a regression. At S3 Red, `RUN` with the default patterns gives 7 suites with exactly 2 failures: `test_checker.py` and `test_s3_dispositions_docs.sh`. No test may skip a check, mark it as expected to fail, or add a `skip-aggregate` header. `bun test plugins/opencode-measure-guard` stays at `0 fail` in every phase.

## 5. Phase strategies

### Phase S1: Spec review standard and the new-track review step

- **Risk:** `medium`. The change is Markdown and a bash runner, but `new-track` is the entry workflow of every Measure user, and the cron job installs it within one hour.
- **Review B (security):** applicable, short scope. Check that step 9 gives the subagent only paths and no conversation history, secrets, or credentials. Check that `run.sh` quotes its patterns and runs only files below `tests/spec_review_gate/`.
- **Review C (UX/API):** applicable. Check the user prompts of step 9, the not-run message, the runner summary line, and the `no suites matched` message.
- **Adversarial testing:** applicable, limited to `run.sh`. Probes: a pattern that matches nothing, a pattern with `..` or `/`, a suite that exits 1 among passing suites, a file name with a space, and a `.py` suite with an import error.
- **Browser review:** not applicable. There is no UI and no UX-relevant path. Set `UX_REQUIRED=never`.
- **Live behavior proof:** the runner is live behavior. `test_s1_new_track.sh` runs it with `test_none_*.sh` and parses its exit code and summary line. The standard and step 9 are agent prose. The contract tests prove only that the strings and the order exist. Phase acceptance must read step 9 and confirm that an agent can do each sub-step without a guess.
- **Changed-contract risks:** the renumbering of §2.5 steps 9 to 11. `new-track-set.md` cites `§2.5 step 4`, `§2.5 step 5`, and `§2.5 step 8`; these numbers do not change. Step 9 sub-steps are an indented list, so the "each number 1 to 11 once" check counts only lines that start in column 0 (`^[0-9]+\. `).

| Test group | Defends against | Defense | Falsification condition |
| --- | --- | --- | --- |
| Runner (`run.sh`) behavior | A4 | Exit 1 and `no suites matched` when no file matches. Parse `N suites (PASS=X, FAIL=Y)` as labeled integers and require `N = X + Y`. | The check fails when the runner exits 0 on zero suites, or when one failing suite gives exit 0. |
| Standard headings and order | A4 | The order function reports FAIL for the temporary copy without `## Severity`. | The edge check fails when the order function returns PASS for the copy. |
| Standard marker strings | A3, A7 | Use `grep -F` for each exact string. Search only inside the correct section, from its heading to the next `## ` heading. | Each check fails when its string is absent from its section, even when the string occurs in another section. |
| Step 9 position and markers | A4 | Find the line numbers of `6. Write files:`, step 9, and `10. **Commit Changes:**`. Fail when a line is missing (number empty) before the compare. | The check fails when step 9 is absent, when step 10 is absent, or when a marker occurs only outside the step 9 block. |
| Negative checks (step 5 block, `new-track-set.md`) | A4, A7 | First assert that the block or file is non-empty. Then use `grep -F 'spec-review'` with no exclusion filter. | The check fails when the block extraction returns nothing, so a missing block cannot give a vacuous PASS. |
| Tech-stack row | A3 | Match the row by the literal `` `spec_review_gate_20261030` `` in the Tooling Exceptions table. | The check fails when the track id occurs only outside the table. |
| Bundle equality | A5 | Run `diff -r skills/measure claude-skills/measure` and require exit 0. | The check fails on any byte difference. |

### Phase S2: The measure-spec-review orchestrator role

**Status:** accepted at `25b9064` (`measure/runs/spec_review_gate_20261030/phase-acceptance-s2-25b9064.json`). Plan amendment `ccdaae2` closed the rename gap (spec Decision 29, `--no-renames`). Remediation `b955a3e` made multi-line findings invalid (`fullmatch` and a `splitlines()` check). It also made the scope check read NUL-separated paths (`-z`) without `strip()`. The text below is the S2 record. The "Open item (rename gap)" and the rename "Report" row are closed: `test_s2_adversarial.sh` asserts exit 1 and the old path.

- **Risk:** `high`. The checker decides a gate, and the new role file sets agent permissions. A defect lets a track start Red on a failed review, or gives a report-only role write access.
- **Targeted Red command:** `bash tests/spec_review_gate/run.sh 'test_s2_*.sh' test_checker.py`. It must exit 1. At Red, the checker prints `unknown role 'spec-review'` for each `spec-review` case. Each Python case asserts its own message, so that output fails each case for the correct reason.
- **Green gate:** the S2 `GREEN_TEST_COMMAND` of section 4. **Closeout gate:** the block of section 4 with `--baseline <phase_base_sha>` on the immutable HEAD.
- **Review B (security):** applicable, full scope.
  - Compare the permission blocks with review A. Run `diff <(sed -n '/^  edit:/,/^  skill:/p' agents/measure-review-a-correctness.md) <(sed -n '/^  edit:/,/^  skill:/p' agents/measure-spec-review.md)`. The output must be empty. This compares the three `edit` lines and every `bash` line.
  - Check that the `edit` block has exactly `"*": deny`, `"measure/runs/**": allow`, and `"**/measure/runs/**": allow`. Check `skill: allow` and `task:` with `"*": deny`.
  - Check that the frontmatter has no permission key that review A does not have, for example `webfetch` or `external_directory`.
  - Check that the role body allows no commit and no edit outside its two artifacts. Check that it does not tell the reviewer to quote a secret value.
  - Check the checker: the `--baseline` value goes to git as one argv item, with no shell. The `rev-parse --verify` check runs before `committed_files`, so an option-like value (`--output=<path>`) cannot reach `git diff`.
  - Check that the scope rule fails closed for every unresolvable `--baseline` (spec Decision 27). Review the rename gap of the open item below.
- **Review C (UX/API):** applicable. Check the CLI shape of `role-gate --role spec-review`, the three aliases, the eight payload messages, and the three gate messages: `--baseline is required for spec-review`, `--baseline does not resolve to a commit: <value>`, and `spec-review committed files outside measure/runs/`. Check that the skill, `contracts.md`, the Inter-Phase Checks example line, and the command description agree. Check that a failure message names the value or the path that failed.
- **Adversarial testing:** applicable, full scope on the checker. The suite is `tests/spec_review_gate/test_s2_adversarial.sh`. The probes are in the table "S2 adversarial probes" below.
- **Browser review:** not applicable. No UX-relevant path changes. `measure-orchestrate.md` is Markdown, and `ux-paths` excludes `.md`. Set `UX_REQUIRED=never`.
- **Live behavior proof:** `test_checker.py` runs the real checker as a subprocess against real temporary git repositories. This is live proof of the gate. The role file is agent prose. Its contract tests prove only frontmatter and strings. A live run of the role on this track is not required, because the skip rule applies. A live run needs approval from the user.
- **Changed-contract risks:** `ROLE_ALIASES` gets new keys, and `validate_audit_payload` gets a role branch. Audit JSON files of other roles must stay valid (spec acceptance criterion 3). The role count changes from 13 to 14 in `product.md` and `tech-stack.md`. The `rev-parse --verify` check is only in the `spec-review` block; the blocks of the other roles do not change (spec Decision 27).
- **Closed item:** an unresolvable `--baseline` fails closed (spec Decision 27, plan amendment `1c24539`). The S1 default (Red adds no case, the orchestrator escalates a pass) no longer applies. Red covers `0000000000000000000000000000000000000000` and `not-a-ref`. Adversarial testing covers the other values.
- **Open item (rename gap):** with rename detection, `git diff --name-only` lists only the new path of a rename. A commit that renames `src/a.py` to `measure/runs/demo_track/a.py` lists only `measure/runs/demo_track/a.py`. Thus the scope rule passes, but the commit removed `src/a.py`. Git 2.53.0 on this host gives this result with `GIT_CONFIG_GLOBAL=/dev/null`. With `--no-renames` or `diff.renames=false`, the list also has `src/a.py`. The plan contract does not define this case. Default: Red adds no case outside the contract. Adversarial testing probes it and reports the result. The orchestrator routes it to the user as an ESCALATE item. A fix (for example `--no-renames` in the `spec-review` scope call) needs a plan amendment.

| Test group | Defends against | Defense | Falsification condition |
| --- | --- | --- | --- |
| Gate rejection cases (each exit 1) | A4 | Assert the exit code and the exact contract message in the output. At Red, `role-gate --role spec-review` exits 1 with `unknown role`, so an exit-code-only test passes for the wrong reason. | Each case fails when the output does not contain its own message, even when the exit code is 1. |
| Gate pass cases and aliases | A4 | Assert exit 0 and the literal `PASS: spec-review gate passed`. | The case fails when the checker rejects a valid JSON or prints another PASS line. |
| Baseline resolution (`0000…0000`, `not-a-ref`) | A4 | Use the pass JSON, so only the baseline can fail. Assert exit 1 and `--baseline does not resolve to a commit: <value>` with the exact value. | Each case fails when the gate exits 0, or when the message lacks the value. |
| Scope rule | A4 | One commit adds only `measure/runs/demo_track/note.txt` (pass). One commit adds `src/app.py` (fail, output names `src/app.py`). | The check fails when the `src/app.py` case passes or does not name the path. |
| Backward compatibility | A5 | `audit-result --role review-a` on a JSON without `paraphrase` exits 0. `role-gate --role nope` lists `spec-review` (read stderr and stdout). | The check fails when an old JSON fails, or when the role list omits `spec-review`. |
| Role names in the skill | A4 | For each `--role <name>` in the orchestrator `SKILL.md`, require at least one name found, then check for `unknown role` in stderr and stdout. | The check fails when zero names are extracted, or when one name gives `unknown role`. |
| Role file frontmatter and blocks | A4, A7 | Extract the `bash` block from `  bash:` to `  skill:` in both files. Require both extracts non-empty before the compare. Extract the `edit` block from `  edit:` to `  bash:` and require exactly three lines. | The check fails when an extract is empty, when one line differs, or when the `edit` block has a fourth line. |
| Role counts | A3 | Match `14 role definitions` and `# 14 measure-* role definitions` as labeled strings. Compare the integer with the count of `agents/measure-*.md`. Do not match a bare `14`. | The check fails when the label is absent, or when the labeled integer differs from the file count. |
| Doc strings (skill, contracts, README, command) | A7 | Use `grep -F` for each exact contract string. | Each check fails when its exact string is absent. |

**Fixture rules for S2 and S3.** Each Python test creates a temporary folder with `tempfile` and removes it after. Each git call uses `-c user.name=test -c user.email=test@example.com -c commit.gpgsign=false`. Each subprocess gets an explicit environment. It sets `GIT_CONFIG_GLOBAL=/dev/null` and `GIT_CONFIG_NOSYSTEM=1`. It sets `GREEN_TEST_COMMAND` and `RED_TEST_COMMAND` only when the case needs them, and it removes `PROJECT_LINT`, `PROJECT_CHECKS`, `PROJECT_TESTS`, and inherited gate variables. Without this rule, the orchestrator `GREEN_TEST_COMMAND` runs again inside the fixture. No test writes in the real repository. No test reads `measure/tracks/spec_review_gate_20261030/` (A9); the fixture uses `demo_track`. A bash suite checks that `mktemp -d` returned a folder before it writes (S1 finding MKTEMP). `test_checker.py` must hold at least one test; on Python 3.11 or earlier, a file with zero tests gives a vacuous PASS (S1 finding PYZERO).

**S2 adversarial probes.** The suite `test_s2_adversarial.sh` runs the checker on temporary repositories with the fixture rules above. "Contract" means the plan defines the result; the suite asserts it. "Report" means the plan does not define the result; the suite asserts only exit 1 or exit 0 with no `Traceback`, and the JSON reports the observed result as a finding. A `Traceback` in any probe is a finding.

| Probe group | Inputs | Expected result | Defends against |
| --- | --- | --- | --- |
| Bad `--baseline` values | a tree SHA (`HEAD^{tree}`); a blob SHA; a commit SHA from another repository; `A..HEAD`; `--all`; `-h`; `--output=<tmp>/x`; a single space | Contract: exit 1 and `--baseline does not resolve to a commit: <value>`. For `--output=<tmp>/x`, no file `<tmp>/x` exists after the run. Each `git rev-parse --verify --quiet <value>^{commit}` gives exit 1 on this host. | A4 |
| Empty `--baseline ""` | the pass JSON | Contract: exit 1 with `--baseline is required for spec-review` or the resolve message. | A4 |
| Bad baseline skips the scope check | `--baseline not-a-ref`, and a commit that adds `src/app.py` | Contract: exit 1, the resolve message, and no `spec-review committed files outside measure/runs/` line. | A4, A7 |
| Good baseline forms | a short SHA; an annotated tag on the baseline; `HEAD` with no new commit | Contract: exit 0 and `PASS: spec-review gate passed`. | A4 |
| Finding formats | `F01 [Major] x: y`; `F1 [Major] x:`; `F1 [Major] x: ` (trailing space); ` F1 [Major] x: y` (leading space); `F1 [major] x: y`; `F1 [Major]x: y`; `F1 [Critical] x: y`; `F１ [Major] x: y` (full-width digit); `""` | Contract: exit 1 with `spec-review finding has an invalid format:` or `must contain only non-empty strings` for `""`. | A4, A7 |
| Finding with a newline | `"F1 [Major] x: y\nF2 junk"` | Report. `SPEC_REVIEW_FINDING_RE` has no `$`, so `re.match` accepts it. | A4 |
| Non-string finding items | `5`, `null`, `{}`, `["F1 [Major] x: y"]` in `nonblocking_findings` | Contract: exit 1 with `nonblocking_findings must contain only non-empty strings`. A `TypeError` traceback from the regex is a finding. | A4 |
| `paraphrase` types | a list `["a", "b"]`; a number `5`; a string; `null`; `{}` | Contract: exit 1 with `paraphrase must be an object with proposes and current_system`, and no traceback. | A4 |
| `paraphrase` field types | `proposes: 5`; `proposes: ["a"]`; `current_system: null`; `proposes: "\u00a0"` | Contract: exit 1 with the `paraphrase.<field> must be a non-empty string` message. Python `str.strip()` removes U+00A0. | A4 |
| Unicode edge text | `proposes: "\u200b"` (zero-width space); extra keys in `paraphrase` | Report. `str.strip()` keeps U+200B, so the value passes. | A4 |
| Huge and unicode strings | `proposes` of 5 MB; one finding of 1 MB with no `: `; emoji and right-to-left text in a scope and a description | Contract: exit 0 for valid text, exit 1 for the 1 MB finding. Each run ends in less than 5 seconds. | A4 |
| Result file not JSON | plain text; an empty file; `[]`; `null`; a missing path | Contract: exit 1 with `invalid audit JSON:`, `audit result must be a JSON object`, or `missing audit result:`. | A4 |
| Result file not readable as text | bytes `\xff\xfe\x00`; a folder as `--result-file` | Report. `read_audit` catches only `json.JSONDecodeError`, so these give a traceback with exit 1. The gate fails closed. This behavior is older than this track. | A4 |
| Scope: renames and deletions | rename `measure/runs/demo_track/a.txt` to `src/a.txt`; delete `src/b.py`; add `measure/runsX/a`; add `Measure/runs/a` | Contract: exit 1, and the output names each path outside `measure/runs/`. | A4, A7 |
| Scope: rename into `measure/runs/` | rename `src/a.py` to `measure/runs/demo_track/a.py`, once with the pinned config and once with `GIT_CONFIG_COUNT=1`, `GIT_CONFIG_KEY_0=diff.renames`, `GIT_CONFIG_VALUE_0=false` | Report (open item above). The pinned run gives exit 0. The `diff.renames=false` run gives exit 1 and names `src/a.py`. Thus the result depends on the host config. | A4 |
| Scope: non-ASCII name | add `measure/runs/demo_track/ü.txt` | Report. `core.quotePath` prints `"measure/runs/demo_track/\303\274.txt"`, so the gate fails a valid commit. The gate fails closed. | A4 |
| Scope: uncommitted file | an uncommitted `src/x.py` | Contract (Decision 17): exit 0, because the rule checks only committed files. | A5 |
| Alias case | `--role SPEC-REVIEW` | Report. `ROLE_ALIASES` is case-sensitive. | A4 |
| Sensitivity | copies of the checker with one defect each: no `rev-parse` check; `startswith("measure/runs")` with no `/`; no `paraphrase` type check | Each broken copy makes at least one probe fail. This proves that the probes can fail. | A4 |

The suite passes at its commit. A probe marked "Report" never asserts the defect as the expected result, so a later fix does not make the suite fail.

### Phase S3: Finding dispositions

- **Risk:** `high`. `dispositions_feedback` runs for every role when `--log-file` is given. A defect breaks the gates of every orchestrated track in each project after the cron install. A fail-open defect lets a Green round with a bad `dispositions:` line pass its gate.
- **Targeted Red command:** `bash tests/spec_review_gate/run.sh 'test_s3_*.sh' test_checker.py`. It must exit 1. At Red, the checker ignores the `dispositions:` line. Thus each invalid-line case exits 0 and fails, and each valid-line case passes.
- **Green gate:** the S3 `GREEN_TEST_COMMAND` of section 4. **Closeout gate:** the block of section 4 with `--baseline <phase_base_sha>` on the immutable HEAD.
- **Red evidence must name the reason.** Each `DispositionsLineTest` invalid case fails because the output lacks `invalid dispositions line`. A case that fails for another reason (a missing fixture file, `could not find phase`, a non-zero `GREEN_TEST_COMMAND`) is a false Red. The `test_s3_dispositions_docs.sh` failures each name one missing S3 string. The edge checks `not fixed —` absent and `writes the returned text without changes:` absent fail at Red, because the S1 text still has both strings. The 12-line template check passes at Red.
- **Fixture control case (A4).** The no-line case (exit 0 and `PASS: jr-green gate passed`) is the control. It proves that the fixture passes every other jr-green check. Each invalid case also asserts that each `FAIL:` line of the output starts with `FAIL: invalid dispositions line`. Thus an exit 1 from a fixture defect cannot count as a parser rejection.
- **Review B (security):** applicable, full scope on the parser and its call. The question: can the parser make a gate pass that must fail, or fail a valid old log?
  - Fail open: check that `dispositions_feedback` catches no exception and returns no empty list on an error. Check that its feedback is added to `feedback` and does not replace it or return early. A log with a valid line and a failing `GREEN_TEST_COMMAND` must still exit 1.
  - Every role: check that the call is outside the role branches of `cmd_role_gate`, so `strategy`, `mid-red`, the audit roles, and `spec-review` also run it.
  - Block selection: check the last-block rule, a last start line without an end line after it, a start line embedded in another line, and the effect of `str.splitlines()` against `split("\n")`. `Path.read_text` changes a lone CR to `\n`; `str.splitlines()` also splits on U+2028, U+0085, `\x0b`, `\x0c`, and `\x1c` to `\x1e`. Each choice can split one `dispositions:` line into two.
  - Read path: check that the parser reads only `--log-file`, opens no other path, and runs no shell. Check the read mode. `has_agent_result` reads with `errors="ignore"`. A strict read gives a traceback on a log that the gate accepted before S3.
  - Cost: check the cost of the duplicate check. A list scan per item is quadratic. S2 found the same class (QUADRATIC).
  - Report each result of the adversarial "Report" rows with a severity. Route a fail-open result as a Blocker.
- **Review C (UX/API):** applicable. Compare the contract text of the four dispositions in each of these files:
  - `skills/measure-orchestrator/references/contracts.md` (`## Finding Dispositions`, the line syntax, the re-review rules, the no-FIX rule);
  - `agents/measure-jr-green.md` (`## Routed findings`);
  - the five audit roles: `measure-review-a-correctness.md`, `measure-review-b-security.md`, `measure-review-c-ux-api.md`, `measure-phase-acceptance.md`, `measure-spec-review.md`;
  - `skills/measure/references/review.md` (§2.5 heading, §3.1 item 3);
  - `skills/measure/references/spec-review.md` (`## Finding Dispositions`, the Author Response lines, the Report Layout sentence);
  - `skills/measure/references/new-track.md` step 9 (sub-steps 6 and 7, the Round 2 secret check);
  - `skills/measure-orchestrator/SKILL.md` "## Delegation".
  - Check that each file uses the four words in uppercase, with the same meaning. DECLINE is for Nit in the Measure severity scale and for Low in `review.md` (spec Decision 21). Check that no file allows CONTEST or DECLINE for a `Comprehension gap:` finding. Check that the `contracts.md` example line passes the checker. Check that each message names the bad item or the duplicate id. Check that the README sentence and the CHANGELOG line agree with `contracts.md`.
- **Adversarial testing:** applicable, full scope on the parser. The suite is `tests/spec_review_gate/test_s3_adversarial.sh`. It uses the fixture rules of S2. The probes are in the table "S3 adversarial probes" below.
- **Browser review:** not applicable. There is no UI, and no UX-relevant path changes. Set `UX_REQUIRED=never`.
- **Live behavior proof:** `DispositionsLineTest` runs the real `role-gate --role jr-green` in a temporary repository with real log files. That is live proof of the parser. The backward-compatibility probe runs the real checker on the real logs of this host. The role prose, the re-review rules, and the no-FIX round rule are agent prose. The contract tests prove only the strings. Phase acceptance must read the Green role and one audit role, and confirm that an agent can apply each disposition without a guess.
- **Changed-contract risks:**
  - The Agent Result Block template must not change (12 lines). The `dispositions:` line is optional and goes below the template.
  - Existing logs without the line must pass (spec NFR). The log `measure/runs/spec_review_gate_20261030/jr-green-s2-r3.log` already has `dispositions: F1=FIX; F2=FIX`. It must pass.
  - The S1 form `not fixed —` goes away from `spec-review.md` and `new-track.md`, in `skills/measure/` and in `claude-skills/measure/`.
  - Amendment `1c24539`: the Report Layout sentence becomes `The author writes the other lines of this template, and writes the returned text without changes, except that the author replaces a secret value with its file and line:`. Sub-step 7 of step 9 gets, directly before `Append the returned sections under that heading, and show the result to the user.`, the two sentences `Before you append the Round 2 text, check it for a secret value (a key, a token, a password), as in sub-step 4. When one occurs, replace the value with its file and line.` The S1 suites must still pass after these edits. Check that no S1 check matches the old sentence `writes the returned text without changes:`.
  - `review.md` §2.5 heading becomes `### F<n> [Critical/High/Medium/Low] Description of Issue`. §3.1 gets item `3. **Record Dispositions:**`. Check that later items of §3.1 renumber and that no other file cites the old item numbers.
  - The S2 suites pass no `--log-file`. They prove that the parser does not run without `--log-file`. They must stay green.

| Test group | Defends against | Defense | Falsification condition |
| --- | --- | --- | --- |
| Control case (no `dispositions:` line) | A4 | Assert exit 0 and `PASS: jr-green gate passed`. | The case fails when the fixture fails another jr-green check. Then each invalid case is suspect. |
| Invalid lines (each exit 1) | A4 | Assert exit 1, `invalid dispositions line`, and no `FAIL:` line without that prefix. The duplicate case also asserts `duplicate finding id F1`. | Each case fails when the gate exits 0, when the message is absent, or when another check also fails. At Red, the old checker exits 0, so these cases fail. |
| Valid lines (each exit 0) | A4 | Assert exit 0 and `PASS: jr-green gate passed`. These cases pass at Red. They prove at Green that the parser does not reject valid input. | Each case fails when the new parser rejects a valid line. |
| Last-block rule | A4 | Two blocks: the first has `dispositions: F1=bad`, the last has `dispositions: none`. A `dispositions: F1=bad` line after `END_MEASURE_AGENT_RESULT`. Both exit 0. | Each case fails when the parser reads the first block or text after the end line. The invalid cases put the line inside the last block, so they show that the parser reads that block. |
| Result block template | A4 | Extract the first `text` code block of `contracts.md`. Require it non-empty. Count 12 lines from `MEASURE_AGENT_RESULT` to `END_MEASURE_AGENT_RESULT`. | The check fails when the block is absent, has a `dispositions` line, or has another line count. |
| `not fixed —` absent | A4, A7 | Use `grep -rF 'not fixed —' skills agents`. First assert that both folders exist and hold files. | The check fails when a folder is empty or missing, or when one file contains the string. |
| Doc strings in the six role files, the skill, `review.md`, and the standard | A7 | Use `grep -F` per file, per string. Check the `Delegation` strings only from `## Delegation` to the next `## ` heading. Check the §3.1 words only inside §3.1. | Each check fails when one file lacks one string, or when a string occurs only outside its section. |
| Secret check strings (amendment `1c24539`) | A4, A7 | Search the Report Layout string only from `## Report Layout` to the end of the standard. Search the Round 2 strings only in the step 9 line that matches `^   7\. `. Require each extract non-empty first. Assert that the standard lacks `writes the returned text without changes:`. | Each check fails when an extract is empty, when a string occurs only outside its block, or when the old sentence remains. |
| Bundle equality | A5 | `diff -r skills/measure claude-skills/measure` exits 0. | The check fails on any difference. |

**S3 adversarial probes.** The suite `test_s3_adversarial.sh` uses the jr-green fixture of Task 3.1 (`GREEN_TEST_COMMAND=true`) unless a row names another role. The "Contract" and "Report" rules of the S2 probes apply. A `Traceback` in any probe is a finding. Each probe writes the log as bytes (Python `write_bytes`), so the probe controls each CR, NUL, and non-UTF-8 byte.

| Probe group | Inputs (the `dispositions:` value, or the log shape) | Expected result | Defends against |
| --- | --- | --- | --- |
| Line ends | the whole log in CRLF with `dispositions: none`; CRLF with `F1=FIX; F2=DECLINE` | Contract (spec NFR, `strip()` rule): exit 0. | A4 |
| Embedded CR | `F1=FIX\rF2=CONTEST()`; `F1=FIX\r; F2=DECLINE` | Report. `Path.read_text` changes a lone CR to a line end, so the text after CR can leave the line. | A4 |
| Unicode line separators | `F1=FIX F2=CONTEST()`; `F1=FIX\u0085F2=bad`; a `handoff:` value `x MEASURE_AGENT_RESULT` before a real block | Report. The result depends on `splitlines()` against `split("\n")`. Record which items the parser read. | A4 |
| NUL | `F1=FIX\x00`; `F2=CONTEST(\x00)` | `F1=FIX\x00`: contract, exit 1. `CONTEST(\x00)`: report (NUL is not a space character). | A4 |
| `;` inside parentheses | `F2=CONTEST(a; b)`; `F3=ESCALATE(x;)` | Contract (spec Decision 18): exit 1 with `invalid dispositions line`. | A4, A7 |
| Nested and unbalanced parentheses | `F2=CONTEST(a(b))`; `F2=CONTEST(a)b)`; `F2=CONTEST((a)` | Contract (the plan regex `\((.+)\)$`): exit 0. | A4 |
| Spaces | `F1=FIX ;F2=DECLINE`; `  F1=FIX  `; `F2=CONTEST( )`; `F2=CONTEST(​)`; `dispositions:none`; `dispositions:    ` | First two: contract, exit 0. U+00A0: contract, exit 1 (Python treats it as a space). The other three: report. | A4 |
| Id forms | `F01=FIX`; `F１=FIX` (full-width digit); `f1=FIX`; `F1=Fix`; `F1 = FIX`; `F1=FIX; F1=FIX` | Contract: exit 1. The duplicate case prints `duplicate finding id F1`. | A4 |
| Very long input | one line with 50,000 items `F<n>=FIX`; one `CONTEST(` item with 5 MB of evidence; 50,000 items with one duplicate at the end | Contract: exit 0, exit 0, exit 1. Report the time of each run. A run above 5 seconds is a finding (quadratic duplicate check). The probe timeout is 120 seconds. | A4 |
| Several blocks | the last block valid and an earlier block invalid; the last block invalid and an earlier block valid; two `dispositions:` lines in the last block (`none`, then `F1=bad`) | Contract: exit 0, exit 1, exit 0 (the first `dispositions:` line counts). | A4 |
| Unclosed last start line | a full block with `dispositions: F1=bad`, then one more `MEASURE_AGENT_RESULT` line with no end line after it | Report. A literal reading of the contract finds no block and gives exit 0. That hides the invalid line. Route the result to the user as an ESCALATE item. | A4 |
| Start line as a substring | `handoff: see MEASURE_AGENT_RESULT` inside the block; an indented `  dispositions: F1=bad` line | First: contract, exit 0 (not an exact line). Indented line: report. | A4, A7 |
| Log not UTF-8 | bytes `\xff\xfe` outside the block, with a valid block; the same bytes inside the `dispositions:` line | First: contract (spec NFR; `has_agent_result` accepts this log at `25b9064`), exit 0. Second: report. | A4, A5 |
| Log is a folder; log is missing | `--log-file <tmp>/dir`; `--log-file <tmp>/none.log` | Report for the folder (`has_agent_result` gives a traceback before S3; the gate fails closed). Missing file: contract, exit 1 with `missing MEASURE_AGENT_RESULT block` and no `invalid dispositions line`. | A4 |
| Every role | the invalid value `F1=fix` with `--role strategy`, `mid-red`, `review-a`, and `spec-review` | Contract (the call is for every role): each output contains `invalid dispositions line`. Other `FAIL:` lines are allowed. | A4 |
| Fail-open order | a valid line and `GREEN_TEST_COMMAND=false` | Contract: exit 1 with the `GREEN_TEST_COMMAND` failure. | A4 |
| Documented example | the `dispositions:` example line of `contracts.md`, extracted with `grep -F 'dispositions: F1=FIX; F2=CONTEST('` | Contract: exactly one line found, and the gate exits 0 on it. | A4, A5 |
| Backward compatibility, frozen corpus | blocks in the shape of the S1 and S2 logs, written by the suite: no `dispositions:` line; `dispositions: F1=FIX; F2=FIX`; a log with a JSON summary above the block | Contract: exit 0 with `PASS: jr-green gate passed`. | A4, A5 |
| Backward compatibility, live corpus | every `*.log` under `$ROOT/measure/runs/` and `$ROOT/measure/archive/*/`, given as `--log-file` to the jr-green fixture; the suite reads each log and writes nothing to it | Contract: no output has `invalid dispositions line` or `Traceback`. Each log with an exact `MEASURE_AGENT_RESULT` line and an exact `END_MEASURE_AGENT_RESULT` line exits 0. At `25b9064` this host has 37 logs under `measure/runs/` (28 with both exact lines) and 0 under `measure/archive/`. The check fails when `measure/runs/` exists and holds 0 logs. Print the counts. | A4, A5 |
| Sensitivity | copies of the checker with one defect each: the first block, not the last; no duplicate check; `re.match` without the end anchor; `re.IGNORECASE`; no `strip()` of each item; the call only in the jr-green branch; no call at all | Each broken copy makes at least one probe fail. | A4 |

`measure/runs/` is in `.gitignore`. On a fresh clone the folder does not exist. Then the live-corpus check prints one PASS line that names the absent folder, and the frozen corpus carries the backward-compatibility proof. This is the only conditional check of the suite. The adversarial JSON records the counts of the host run.

### Phase S4: Doc drift check in the weekly audit

- **Risk:** `low`. The change is prose in one audit role, one catalog entry in two files, and count text. No checker code changes.
- **Review B (security):** applicable, short scope. Check that the A11 recipe only reads files and runs `[ -e ]`. Check that it has no `eval` and no write.
- **Review C (UX/API):** applicable. Check the `DRIFT:` finding form and the statement that drift alone does not fail the audit.
- **Adversarial testing:** applicable, limited to the A11 recipe. The suite is `tests/spec_review_gate/test_s4_adversarial.sh`. Probes: a backtick path with a space, a backtick command such as `` `git log` ``, a path with `..`, and a missing document.
- **Browser review:** not applicable. There is no UI.
- **Live behavior proof:** the A11 recipe is live behavior. The test runs it with `bash` in the repository root. The recipe always exits 0, because the last command of the pipeline is the `while` loop. Thus the exit check proves only that the recipe parses and runs. It does not prove that the documents have no drift. At `7d72b40`, the recipe prints 4 candidates from `measure/tech-stack.md` (`claude-code/testing`, `commands/`, `node_modules/`, `tests/`). These are path-like text, not path claims. Phase acceptance must not read this output as a pass or a fail.
- **Changed-contract risks:** `A1–A10` becomes `A1–A11` in `agents/measure-strategy.md`, `agents/measure-orchestrator-audit.md`, and the orchestrator `SKILL.md`. The catalog text `A2–A10 keep their numbers` is a different string and stays.

| Test group | Defends against | Defense | Falsification condition |
| --- | --- | --- | --- |
| Detector section position | A4 | Find the line numbers of `## A10`, `## Doc drift detector`, and `## Outputs`. Fail when one is missing before the compare. | The check fails when the section is absent or out of order. |
| Detector strings | A7 | `grep -F` each string inside the section only. | Each check fails when its string occurs only outside the section. |
| A11 block equality | A4 | Extract from `## A11 —` to the next `---` line in both catalogs. Require both non-empty, then compare. | The check fails when one block is empty or when one line differs. |
| `A1–A10` absent | A4, A7 | `grep -rF 'A1–A10' agents skills/measure-orchestrator`. First assert that both folders hold files. | The check fails when a folder is empty, or when one file still contains the string. |
| Count text | A3 | Match `11 entries (A1–A11)` as a labeled string. Count `## A[0-9]+ —` headings in the catalog and require 11. | The check fails when the label is absent, or when the heading count differs from 11. |
| A11 recipe | A4 | Extract the bash block. Require it non-empty. Run `bash -n`, then run it and require exit 0. | The check fails when the extract is empty, has a syntax error, or exits non-zero. |
| CHANGELOG and README | A7 | Check `elephant-goldfish-model` only inside `## Unreleased`. Check `doc-to-code drift` only in the `measure-orchestrator-audit` row. | Each check fails when the string occurs only outside its section or row. |

## 6. Anti-pattern applicability (A1–A10)

| Id | Status in this track | Where the defense is |
| --- | --- | --- |
| A1 | Retired. Not applicable. | — |
| A2 | Not applicable. The track has no publish gate. | — |
| A3 | Applicable: role counts, entry counts, runner summary. | S1 runner, S2 counts, S4 counts. |
| A4 | Applicable: every heading, block, and negative check, and every exit-1 case. | All phases. |
| A5 | Applicable: plan evidence, git notes, CHANGELOG lines. Do not write "all checks pass" unless the cited command exits 0. | All phases; final acceptance. |
| A6 | Applicable at closeout: the `measure/tracks.md` note must match the test state. | Final acceptance, closeout. |
| A7 | Applicable: negative greps use exact fixed strings with no bare-word exclusion. | All phases. |
| A8 | Retired. Not applicable. | — |
| A9 | Applicable: no test reads `measure/tracks/spec_review_gate_20261030/`. The tests read only stable project files and temporary fixtures. | All phases. |
| A10 | Not applicable. The project has no `measure/doctor.sh` and no `measure/generated/`. | — |

Known long-term brittleness: the tests check `## Unreleased` in `CHANGELOG.md` and the counts 14 and 11. A release or a new role or entry later makes these checks fail. This is acceptable for the track. Final acceptance records it in `measure/tech-debt.md` as a candidate for A11-style drift.

## 7. Track-level gates

Use these values for `measure-adversarial-testing` and `measure-final-acceptance`. Each command exists at `7d72b40` or after S1.

```bash
PROJECT_LINT='python3 -m py_compile skills/measure-orchestrator/scripts/measure_interphase_checks.py tests/spec_review_gate/test_checker.py && for f in tests/spec_review_gate/*.sh; do bash -n "$f" || exit 1; done'
PROJECT_CHECKS='diff -r skills/measure claude-skills/measure && bash plugins/opencode-measure-guard/scripts/check-parity.sh && git diff --quiet 7d72b40665074a89f5be606935cad94a1ef1e4e9 -- skills/measure/references/new-track-set.md'
PROJECT_TESTS='bash tests/spec_review_gate/run.sh && bun test plugins/opencode-measure-guard'
UX_REQUIRED=never
```

- `PROJECT_LINT` names `test_checker.py`, which exists only after S2 Red. Adversarial testing in S1 used `PROJECT_TESTS` only, as `cmd_role_gate` requires. From S2 on, all three commands resolve.
- `PROJECT_TESTS` runs every adversarial suite (`test_s<n>_adversarial.sh`), because the runner selects `test_*.sh`. Each adversarial suite thus becomes part of each later gate.
- `py_compile` writes `__pycache__/`, which `.gitignore` covers.
- **`measure/doctor.sh` does not exist.** The final-acceptance role file has the line "`bash measure/doctor.sh` exits 0". Final acceptance records this line as not applicable in `evidence`, with the reason "no `measure/doctor.sh` in this repository". It is not a blocking finding. `PROJECT_CHECKS` replaces it. Final acceptance must not create the file.
- Final acceptance also checks spec acceptance criteria 1 to 5 directly, and A5, A6, and A9 as its role file requires.

## 8. Artifact tests and live behavior tests

- **Artifact tests** (the `test_s<n>_*.sh` files except the runner and recipe checks) prove that exact strings, headings, and order exist in Markdown. They do not prove that an agent obeys the text. Phase acceptance and Review C read the prose for that.
- **Live behavior tests** run real code: `run.sh` (S1), the checker in `test_checker.py` (S2, S3), and the A11 recipe (S4). They use real subprocesses and real temporary git repositories, with no mocks.
- No mock replaces git or the checker. The only fixture data are the temporary repositories, the JSON files, and the log files that the tests write.

## 9. Architecture guardrails

- The checker uses the Python standard library only. No new import outside the standard library.
- `validate_spec_review_payload` is called only from `validate_audit_payload`, in the form of `validate_ux_payload`. No second copy of the rules goes into `cmd_role_gate`.
- `dispositions_feedback` reads only the `--log-file` path. It does not change `has_agent_result`.
- `dispositions_feedback` reads the log in the same mode as `has_agent_result` (`encoding="utf-8", errors="ignore"`). Then a log that passed before S3 cannot give a decode traceback. The plan does not state the mode, so a strict read is a Review B finding, not a contract break.
- `cmd_role_gate` calls `dispositions_feedback` once, after the `has_agent_result` check and outside the role branches. It adds the messages to `feedback`. It catches no exception.
- The duplicate check uses a `set`, not a list scan.
- No change to an existing audit JSON field or to the Agent Result Block template.
- `skills/measure/references/new-track-set.md` and `claude-skills/measure.skill` do not change.
- Each commit keeps the installed files consistent: a file or a checker role lands before the first file that names it.
- Green does not edit `tests/spec_review_gate/` except to fix a harness defect that Red confirms. A Green test edit is a finding for Review A.

## 10. Lessons from S1 and S2 (binding for S3 and S4)

- **Remediation under the guard.** See section 1. Green sets the task `[~]` only in the working tree, and each commit carries `[x]` with the SHA. The Green log states this in `handoff`.
- **Audit artifact format.** Each audit JSON list field holds strings only. A finding is one string, not an object. Each audit log holds one full block from `MEASURE_AGENT_RESULT` to `END_MEASURE_AGENT_RESULT`. `role-gate` fails a log without both lines.
- **Adversarial suites.** Adversarial testing commits `tests/spec_review_gate/test_s<n>_adversarial.sh`. The runner selects it with the phase pattern `test_s<n>_*.sh` and with the default patterns. Thus it runs in the phase closeout gate and in every later gate. The suite must pass at its commit (see the S2 probe rules).
- **Runner tech debt.** `measure/tech-debt.md` records SELF, SYMLINK, PYGLOB, MKTEMP, and PYZERO. S2 and S3 do not change `run.sh`. The S2 and S3 suites avoid these cases: no suite name has a glob character, and each bash suite checks `mktemp -d`.
- **Parsers need text-edge probes (S2).** Review B found two real bypasses in the S2 checker: a multi-line finding and whitespace stripping of paths. Each new parser gets probes for CR, U+2028, NUL, leading and trailing spaces, non-UTF-8 bytes, a folder in place of a file, very long input with a time limit, and several blocks. Section 5 lists the S3 probes.
- **Sensitivity copies (S2).** Each adversarial suite runs broken copies of the checker, and each copy must fail at least one probe. The S2 suite used 10 copies. The S3 suite uses the 7 copies of section 5.
- **Model availability (S2).** The Muse model failed to start two times for phase acceptance. Opus 5.5 took its place, and the log recorded the deviation. When a role model fails to start two times, the orchestrator picks a model of another family and records the deviation in `handoff`. The orchestrator does not wait.
- **Drafts under the guard (S2).** See section 1. Adversarial testing wrote its suite under `measure/runs/` and moved it into `tests/spec_review_gate/`. Only the moved file goes into the commit.
