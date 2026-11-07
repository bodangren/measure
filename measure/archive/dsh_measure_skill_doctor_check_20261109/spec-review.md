# Spec Review: dsh_measure_skill_doctor_check_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-09
Reviewer: subagent (fresh context, default model)

### What this track proposes

Adding `tests/dsh/test-skill-docs.sh`: parse every `skills/*/SKILL.md`
frontmatter description (inline or `|`/`>` block, whitespace-collapsed), fail
above 1024 characters or on a `<`/`>` character, and fail on a symbolic link
under `claude-skills/`; temporary fixtures prove each rule; the real repository
must pass; the skill_doctor tech-debt row is resolved.

### How the current system works, per this spec

`tests/dsh/run.sh` discovers `test-*.sh` (12 tests before this track). The three
`SKILL.md` files use two block descriptions and one inline scalar (462, 337, 375
collapsed characters), with no `<`/`>` and no symlink in `claude-skills/`; no test
parses a description. The archived track's finding N3 describes a `SKILL.md`
Markdown link to the folder `assets/code_styleguides/` (npm
`skill.referenced-directory`), not a filesystem link.

### Findings

- F1 [Major] FR-3: "folder links" was undefined and read as filesystem symlinks, while the record's N3 is a Markdown link whose target is a folder; the symlink scan guards nothing for that regression.
- F2 [Major] FR-4/Task 1.2: no fixture used a `|`/`>` block description although the real files are block scalars, so a parser that misreads the block could pass.
- F3 [Major] FR-4/Task 1.2: no 1024/1025 boundary fixture; the acceptance used 1200.
- F4 [Major] FR-4/Task 1.2: the angle-bracket fixture tripped both characters at once, so a `<`-only checker would pass.
- F5 [Major] FR-1: a missing description key was undefined and uncovered.
- F6 [Nit] FR-2: "the skill format's disallowed characters" had no repository record.
- F7 [Nit] NFR-2: "unchanged" read as a contradiction with the 13/13 requirement.
- F8 [Nit] FR-3/Overview: the link-rule scope (bundle `measure/` vs all of `claude-skills/`) disagreed and the wider scope was untested.

### Author Response

- F1: FIX (the check now enforces the real N3 rule: a Markdown link target that is empty, ends with `/`, or resolves to a directory relative to the SKILL.md folder is reported as `skill <name> links to a folder: <target>`; the bundle symlink rule remains as a separate, correctly named rule)
- F2: FIX (a `|` block description of 1025 characters fails and a short block passes)
- F3: FIX (a 1024-character description passes and 1025 fails)
- F4: FIX (`<`-only and `>`-only descriptions each fail)
- F5: FIX (a frontmatter without a description is reported as `skill <name> has no description`)
- F6: FIX (the record names npm rule `skill.referenced-directory` and archived finding N3)
- F7: FIX (the existing 12 tests keep their behavior; the suite gains one and is 13/13)
- F8: FIX (the folder-link rule covers every `skills/*/SKILL.md`; the symlink rule covers all of `claude-skills/`; fixtures cover a link under a skill and a symlink in the bundle)

Delivered by `dsh_measure_skill_doctor_fix2_20261109`; the upgraded test prints 10
PASS lines, CLI is 13/13, srg 11/11.
