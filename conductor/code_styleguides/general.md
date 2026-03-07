# General Style Principles for Conductor Skill Files

This document outlines style principles for all Markdown and JSON files in the conductor skill.

## Readability

- Workflow steps must be readable by both humans and AI agents.
- Avoid ambiguous pronouns. Be explicit: "Read `plan.md`" not "Read it."
- Use parallel structure within lists: if one item starts with a verb, all items start with a verb.

## Consistency

- Follow existing patterns in all reference files (`setup.md`, `implement.md`, etc.).
- Use the same section numbering format: `## 1.0 Section Name`, `### 1.1 Sub-Section`.
- Status markers are always `[ ]`, `[~]`, `[x]` — never alternatives like `[-]` or `[/]`.

## Simplicity

- Prefer simple, direct instructions over elaborate conditional logic.
- If a workflow step has more than 5 sub-steps, consider whether it should be its own protocol.
- Do not introduce new terminology when existing terms suffice.

## Maintainability

- Changes to one reference file should not require changes to others unless explicitly extending a protocol.
- Document *why* a step exists, not just what it does — especially for HALT conditions.

## Formatting

- Use `**bold**` for critical instructions, file names, and defined terms.
- Use backticks for file names, commands, and code: `` `plan.md` ``, `` `git notes add` ``.
- Use `>` blockquotes for user-facing messages that the AI should speak verbatim.
- Separate major sections with a blank line above and below headings.
