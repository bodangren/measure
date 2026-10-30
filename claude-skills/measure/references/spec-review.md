# Spec Review Standard

This standard adapts the comprehension, zoom-out, and implementation-readiness standards of Google's Elephant-Goldfish Model (EGM), <https://github.com/google/elephant-goldfish-model>, licensed under Apache-2.0. A fresh reviewer reads the track documents against this standard before Red starts. The reviewer writes no code and edits no track document.

## Reviewer Input

The reviewer gets no conversation history. The reviewer reads these inputs:

1. `spec.md` and `plan.md` of the track.
2. Each file that `spec.md` or `plan.md` links or names.
3. The resolved Product Definition, Tech Stack, and Workflow.

The reviewer can search and read the repository. The reviewer needs the repository to check the claims of the spec about the current system, reuse, and placement (spec Decision 7).

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

A review has `at most one re-review`. A second round runs only when `spec.md` or `plan.md` changed after the first round. After the second round, each remaining Blocker and Major finding goes to this section of the report, and the user decides:

```markdown
## Accepted Risks
- F<n>: <finding text> (accepted by the user on <YYYY-MM-DD>)
```

## Report Layout

The reviewer returns only the three `###` subsections of one round:

- `### What this track proposes`
- `### How the current system works, per this spec`
- `### Findings`

The author writes the other lines of this template, and writes the returned text without changes:

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

A round without findings has the line `- None` under `### Findings`. The Author Response has one line for each finding, in one of these two S1 forms:

- `- F<n>: fixed`
- `- F<n>: not fixed — <reason of the user>`

A harness without a subagent tool writes this not-run form instead:

```markdown
# Spec Review: <track_id>
Author model: <model id, or unknown>
Spec review: not run (no subagent tool)
```
