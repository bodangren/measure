# Spec Review: dsh_measure_skill_doctor_fix2_20261109

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-09
Reviewer: subagent (fresh context, default model)

### What this track proposes

Replacing the misread symlink rule with the real N3 Markdown folder-link rule
over every `skills/*/SKILL.md` (empty, scheme, trailing-slash, or
directory-resolving targets), keeping the `claude-skills/` symlink scan as a
separate rule, reporting a missing description, and adding fixtures (directory
link, trailing slash, bundle symlink, missing description, 1024/1025 boundary,
`|` block, `<`-only and `>`-only, file link pass); plus the fix1 review record.

### How the current system works, per this spec

The check parsed every description (inline/block), failed above 1024 or on
`<`/`>`, and separately rejected bundle symlinks with three fixtures. The real
`skills/measure/SKILL.md` has seven in-page anchors and many relative file links.
Archived finding N3 is npm `skill.referenced-directory` for a Markdown link to a
folder.

### Findings

- F1 [Blocker] FR-1: an anchor-stripped empty target and a scheme-bearing target were named as folder-link reports, but the real `skills/measure/SKILL.md` anchors must pass and `https://…` is not a folder; no fixture pinned a scheme target as passing.
- F2 [Major] Overview/FR-2: only the `|` block form had a fixture; the folded `>` form was unverified although the parser accepts both.
- F3 [Nit] FR-3: the tech-debt row and CHANGELOG still credited the bundle-symlink scan for the folder-link debt.
- F4 [Nit] NFR-2: "the suite gains this one" was stale — 13 tests before and after.
- F5 [Nit] FR-2: the named message `missing description` differed from the check's `has no description`.

### Author Response

- F1: FIX (the record now states the shipped rule: `#anchor`-only links are skipped and scheme targets are not folder claims; the fixtures include an anchor-only file and the real repository passes)
- F2: FIX (a folded `description: >` fixture was added: a 1025-character folded description fails, a short folded description passes)
- F3: FIX (the tech-debt row and CHANGELOG name the Markdown folder-link rule (N3, `skill.referenced-directory`) and keep the bundle-symlink rule separate)
- F4: FIX (the record says the existing 13 tests keep their behavior; no test file is added)
- F5: FIX (the record uses the shipped message `skill <name> has no description`)

Delivered by `dsh_measure_skill_doctor_fix3_20261109`; the test prints 12 PASS
lines, CLI 13/13, srg 11/11.
