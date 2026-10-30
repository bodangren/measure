# Spec Review Standard

This standard adapts the comprehension, zoom-out, and implementation-readiness standards of Google's Elephant-Goldfish Model (EGM), <https://github.com/google/elephant-goldfish-model>, licensed under Apache-2.0. A fresh reviewer reads the track documents against this standard before Red starts. The reviewer writes no code and edits no track document.

## Reviewer Input

The reviewer gets no conversation history. The reviewer reads these inputs:

1. `spec.md` and `plan.md` of the track.
2. Each file that `spec.md` or `plan.md` links or names.
3. The resolved Product Definition, Tech Stack, and Workflow.

The reviewer can search and read the repository. The reviewer needs the repository to check the claims of the spec about the current system, reuse, and placement (spec Decision 7).

The reviewer does not quote a secret value (a key, a token, a password) in the report, because the author commits the report. The reviewer names the file and the line instead.

## Paraphrase First

Before any finding, the reviewer writes two sections:

- `What this track proposes` in `2 to 5 sentences`.
- `How the current system works, per this spec` in `2 to 5 sentences`.

A section that the reviewer cannot paraphrase is a Blocker finding. The author compares the paraphrase with the intent. A wrong paraphrase is a finding: the author adds it with the next free id, severity Major, and the misread section as scope.

## Zoom-Out Check

The reviewer runs six checks:

1. The spec solves the root problem, not a symptom.
2. The spec adds no speculative feature.
3. The spec adds no premature optimization.
4. The spec reuses existing code. Each reuse finding cites a file and a symbol.
5. The spec puts new logic in the correct place.
6. The spec stays at the requirement level.

## Zero-Decision Check

The plan leaves no design choice to the implementer. The reviewer checks these five kinds of choice:

1. `schema`
2. `API or CLI shape`
3. `dependency`
4. `edge-case behavior`
5. `file location`

Each phase names the files to create or change and the test cases, normal and edge. Each phase leaves the repository in a working, testable state.

## Severity

The reviewer gives each finding one of three levels:

- **Blocker:** a section that the reviewer cannot paraphrase; a symptom fix instead of a root-problem fix; a design choice that the plan leaves to the implementer, including a file location; a phase that leaves the repository in a state that does not work or that no test can check.
- **Major:** a speculative feature or premature optimization; new code where cited existing code does the job; logic in the wrong place; a spec section at the implementation level; a phase without named normal and edge test cases; an undefined project-specific term.
- **Nit:** wording or format that does not change what the implementer builds.

## Finding Format

Write each finding on one line:

`F<n> [Blocker|Major|Nit] <scope>: <description> Rationale: <rationale>`

A finding from the paraphrase check or about an undefined term starts its description with `Comprehension gap:`. Do not flag general engineering terms.

The scope names the section of `spec.md` or `plan.md` that the finding concerns. A re-review keeps the id of each earlier finding. It numbers new findings from the highest earlier id plus 1.

## Re-Review Limit

A review has at most one re-review. A second round runs when `spec.md` or `plan.md` changed after the first round, and also when an Author Response has a `CONTEST` item, even when neither file changed. In the second case the reviewer withdraws or keeps each CONTEST item. After the second round, each remaining Blocker and Major finding goes to this section of the report, and the user decides:

```markdown
## Accepted Risks
- F<n>: <finding text> (accepted by the user on <YYYY-MM-DD>)
```

The author writes the `## Accepted Risks` lines only after the user approves the commit. Until then, the remaining findings stay in the round sections.

## Finding Dispositions

The author of the spec gives each finding one of four dispositions:

- **FIX**: the author changes `spec.md` or `plan.md` as the finding asks.
- **CONTEST**: the author cites a record that the reviewer can read. The record is a file path and a symbol, a test, or a decision in `spec.md`, `plan.md`, `tech-stack.md`, or `test-strategy.md`. A claim of "intentional" or "by design" without a record is not evidence.
- **ESCALATE**: the record is outside the files that the reviewer can read. The user decides.
- **DECLINE**: the author declines a Nit finding. DECLINE is not valid for a Blocker finding or a Major finding.

A finding whose description starts with `Comprehension gap:` cannot be contested. It takes FIX or ESCALATE only. The author does not change a severity, so a dispute of a Blocker finding is a CONTEST.

## Report Layout

The reviewer returns only the three `###` subsections of one round:

- `### What this track proposes`
- `### How the current system works, per this spec`
- `### Findings`

The author writes the other lines of this template, and writes the returned text without changes, except that the author replaces a secret value with its file and line:

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
- F1: FIX

## Round 2
<the same subsections, only when a re-review ran>

## Accepted Risks
- F<n>: <finding text> (accepted by the user on <YYYY-MM-DD>)
```

The author (the main agent) writes these lines:

- `Author model:` (the model id that the harness reports for this session, or `unknown`)
- `Date:`
- `Reviewer:` (the subagent type and the model id that it was given, or `unknown`)
- the `## Round 2` heading
- the `### Author Response` lines
- `## Accepted Risks`

The reviewer writes only the three `###` subsections of one round.

A round without findings has the line `- None` under `### Findings`. The Author Response has one line for each finding, in one of these four forms:

- `- F<n>: FIX`
- `- F<n>: CONTEST(<evidence>)`
- `- F<n>: ESCALATE(<reason>)`
- `- F<n>: DECLINE`

A harness without a subagent tool writes this not-run form instead:

```markdown
# Spec Review: <track_id>

Author model: <model id, or unknown>

Spec review: not run (no subagent tool)
```
