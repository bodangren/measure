# Measure Orchestrator Contracts

## Agent Result Block

Every role must end with this block:

```text
MEASURE_AGENT_RESULT
role: <role>
status: complete|blocked|partial
track: <track id>
phase: <phase heading or track setup/review>
commits: <short shas or none>
tests_run: <commands and pass/fail result>
files_changed: <brief list>
plan_updates: <brief summary>
known_failures: <none or exact remaining failures>
handoff: <what the next role or orchestrator should know>
END_MEASURE_AGENT_RESULT
```

Use `blocked` for product judgment, unresolved unrelated dirty work, missing credentials, missing required runtime, or repeated gate failures. Use `partial` only when useful work was committed but the role did not satisfy its gate.

## Audit Result JSON

Audit roles write JSON at the result path supplied by the orchestrator:

```json
{
  "schema_version": 1,
  "status": "pass|fail|inconclusive",
  "summary": "concise evidence-based conclusion",
  "blocking_findings": [],
  "nonblocking_findings": [],
  "evidence": [],
  "commands": [],
  "changed_files": [],
  "test_strategy_violations": [],
  "live_contract_violations": [],
  "prod_wiring_violations": [],
  "route_parity_violations": [],
  "retry_recommendation": "none|retry_tests|retry_implementation|retry_audit|escalate_human|create_remediation_track|infrastructure_retry",
  "confidence": "low|medium|high"
}
```

Only write `status: "pass"` when `blocking_findings` and all `*_violations` arrays are empty. Use `inconclusive` for infrastructure/tooling failures that should not count as acceptance.

UX audits add:

```json
{
  "ux_applicability": "applicable|not_applicable",
  "webbridge_status": "healthy|unhealthy|not_run",
  "webbridge_evidence": {
    "screenshots": [],
    "accessibility_snapshots": [],
    "interactions": []
  }
}
```

## Spec Review JSON

Spec review audits add this object to the audit schema above. Both fields must be non-empty strings:

```json
{
  "paraphrase": {
    "proposes": "What this track proposes, in 2 to 5 sentences.",
    "current_system": "How the current system works, per this spec, in 2 to 5 sentences."
  }
}
```

Write each finding in one line: `F<n> [Blocker|Major|Nit] <scope>: <description> Rationale: <rationale>`.

- Put each Blocker finding in `blocking_findings`. Put each Major finding and each Nit finding in `nonblocking_findings`.
- Write `status: "pass"` only when `blocking_findings` is empty.
- Write `status: "fail"` only with `retry_recommendation: "escalate_human"`.
- Use `retry_recommendation: "none"` on pass and `"infrastructure_retry"` on inconclusive.

The `role-gate --role spec-review` check also requires `--baseline`. The baseline must resolve to a commit, and every committed file in `<baseline>..HEAD` must start with `measure/runs/`.

## Finding Dispositions

The orchestrator routes an audit finding to the role that owns the fix. Each routed finding has one id, and the form is:

`F<n> [Blocker|Major|Nit] <scope>: <text>`

- The id is unique in the phase. A spec review finding keeps its own id, severity, and scope.
- A blocking finding of another audit role becomes `[Blocker]`. A nonblocking finding becomes `[Nit]`. The scope is the role name: `review-a`, `review-b`, `review-c`, `adversarial-testing`, `ux-browser-review`, or `phase-acceptance`.
- The owner of a code finding or a test finding is Green. The owner of a `spec.md` finding or a `plan.md` finding is the user or a build session.

The owner gives each routed finding one of four dispositions:

- **FIX**: the owner changes the code, the test, or the document. Green commits the change.
- **CONTEST**: the owner cites evidence that the reviewer can read. The evidence is a file path and a symbol, a test, or a decision that `spec.md`, `plan.md`, `tech-stack.md`, or `test-strategy.md` records.
- **ESCALATE**: the evidence is outside the files that the reviewer can read, for example a team rule or a call. The user decides.
- **DECLINE**: the owner declines a Nit finding. DECLINE is not valid for a Blocker finding or a Major finding.

`skills/measure/references/review.md` uses the scale Critical, High, Medium, Low; there DECLINE applies only to Low, the lowest level, as Nit is the lowest level here.

"Intentional" or "by design" without a cited record is not evidence.

The owner does not change a severity. A dispute of a Blocker finding is therefore a CONTEST. A finding whose description starts with `Comprehension gap:` takes FIX or ESCALATE only.

Put the optional `dispositions:` line inside the result block, before `END_MEASURE_AGENT_RESULT`:

```
dispositions: F1=FIX; F2=CONTEST(<evidence>); F3=ESCALATE(<reason>); F4=DECLINE
```

Write `dispositions: none` when the role gets routed findings and marks none of them. The line is optional in general and required when the brief of the role held routed findings. The Agent Result Block template does not change.

- `FIX` and `DECLINE` take no text. `CONTEST(<evidence>)` and `ESCALATE(<reason>)` need non-empty text without `;`.
- The `CONTEST`/`ESCALATE` text must not contain a control character (C0 except tab, DEL), a C1 control, a line or paragraph separator (U+2028/U+2029), a bidi control, or a zero-width character; such a line fails the `role-gate` check with `invalid dispositions line: control or zero-width character`.
- Items are separated by `;`. An empty value, an empty item, a repeated id, or a word in lowercase fails the `role-gate` check with `invalid dispositions line`.
- The check reads only the last result block of the log. The block ends at the last `END_MEASURE_AGENT_RESULT` line that has a `MEASURE_AGENT_RESULT` line above it.
- The block starts at the first `MEASURE_AGENT_RESULT` line after the last `END_MEASURE_AGENT_RESULT` line that comes before the last start line of the block, or at the first start line of the log when no such end line exists.
- The check reads every `dispositions:` line in that range, so a second start line inside the block cannot hide a line above it. A log with no end line gives no feedback.
- The block holds one dispositions line. A second dispositions line fails the check with `invalid dispositions line: more than one dispositions line`.
- A `dispositions:` line after the block end does not count.

**Worked example.** The orchestrator routes three findings to Green, `F1`, `F2`, and `F3`. Green fixes `F1` and contests `F2` and `F3` with a test as the evidence:

```markdown
MEASURE_AGENT_RESULT
role: jr-green
status: complete
...
dispositions: F1=FIX; F2=CONTEST(tests/test_empty.py::test_empty covers the empty case); F3=CONTEST(tests/test_retry.py::test_retry covers the retry case)
END_MEASURE_AGENT_RESULT
```

The re-review reads the evidence and withdraws `F2`. It keeps the routed item `F3` and reports:

```json
"evidence": ["F2 withdrawn: tests/test_empty.py::test_empty covers the empty case"],
"blocking_findings": ["F3 [Blocker] review-b: <text> | CONTEST kept: <reason>"],
"retry_recommendation": "escalate_human"
```

A re-review runs on the new HEAD. The next run of the role that raised a finding receives each CONTEST item with its evidence.

- To withdraw an item, the reviewer omits the finding and adds the `evidence` entry `F<n> withdrawn: <what the reviewer checked>`.
- To keep an item, the reviewer writes the routed finding text plus ` | CONTEST kept: <reason>` in that run's result, in the same list that held the finding before (`blocking_findings` or `nonblocking_findings`), and sets `retry_recommendation: escalate_human`.
- The orchestrator sends each ESCALATE item and each kept CONTEST item to the user.

**No FIX item.** A round with no FIX item makes no Green commit. The orchestrator does not run the `jr-green` role gate for that round. It checks that the result block has a disposition for each routed id. Then it sends the CONTEST items to the re-review on the same HEAD. It handles each CONTEST item the same way as in a round with a new commit.

## Marker Matching and Baseline

- **Marker lines.** The `MEASURE_AGENT_RESULT` and `END_MEASURE_AGENT_RESULT` lines are recognized only as whole lines after stripping the surrounding whitespace. A marker word inside another word or sentence does not count: a log whose only marker-like text is inside another word has no result block, and the role gate reports the missing block.
- **The value.** The dispositions value is read exactly as written after the `dispositions:` prefix, with one trailing CR of a CRLF log ignored; the `;`-separated items are then stripped before matching. The control/format rejection above applies to the raw value.
- **Scope.** An audit finding's scope is the role name: `review-a`, `review-b`, `review-c`, `adversarial-testing`, `ux-browser-review`, or `phase-acceptance`. A spec-review finding's scope names the section of `spec.md` or `plan.md` that the finding concerns, and a re-review keeps the id of each earlier finding. Severities are `Blocker`, `Major`, and `Nit`; a blocking finding is a Blocker and a nonblocking finding is a Nit in the routed form.
- **Baseline.** The `spec-review` gate resolves `--baseline` to a commit (`rev-parse --verify <sha>^{commit}`) and rejects an unresolvable value; the baseline need not be an ancestor of HEAD. Mid Red and Jr Green compare the baseline string with HEAD instead of resolving it. A gate's committed-file set is the tree diff between the baseline and HEAD unioned with every path any commit in `baseline..HEAD` touched, including a path one commit added and a later commit removed; a role that reads the working tree (for example the UX review) also unions the unstaged and staged diffs. The one exception is the Mid Red track scope below.
- **HEAD advance.** Mid Red and Jr Green fail when HEAD still equals the baseline: the role must commit its change before its gate can pass. In the Mid Red track scope, Mid Red fails instead when `baseline..HEAD` has no commit of the track.
- **Track scope (Mid Red).** A commit names its track with the subject tag `(track_id: <id>)` or with a body line whose whole text is `track_id: <id>`; `<id>` matches `[A-Za-z0-9][A-Za-z0-9_.-]*`, with exactly one space after the colon. A commit belongs to another track when it has one or more ids, no id is `--track`, and each id names a folder in `measure/tracks/` or `measure/archive/`. Every other commit belongs to the track, including a commit with no id or with an unknown id. When the range has a commit of another track, the Mid Red gate reads only the paths of the commits of the track (`git diff-tree -r --root --cc --no-renames` for each commit, so a merge gives only the paths it changed itself). When `diff-tree` fails for a commit, the gate fails with `mid-red could not list the files of commit <sha>`; when `git log` cannot list the range, the gate keeps the full committed-file set. It prints `INFO: mid-red skipped <n> commits of other tracks` and one `INFO: - <sha> <ids>` line for each skipped commit. A range with no commit of another track keeps the full committed-file set and the output stays the same. The commit message is the claim of the role, so the reviews compare each skipped commit with the other track.
- **Commit detection.** The strict commit guard detects a commit through the documented git global options between `git` and `commit`, so `git --no-pager commit …`, `git -p commit …`, `git --bare commit …`, `git --literal-pathspecs commit …`, `git --git-dir=<dir> commit …`, `git -C <dir> commit …`, and `git -c <name=value> commit …` cannot skip the message-format and no-task rules. A form outside that documented table keeps the detector's old behavior.
