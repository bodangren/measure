# Spec Review: role_file_edits_20261111

Author model: volcengine-agent-plan/glm-5.3-flash

## Round 1

Date: 2026-11-11
Reviewer: measure-spec-review, kimi-code-plan-cn/kimi-for-coding#high

### What this track proposes

This track copies 9 edited Measure role files from the installed OpenCode agents folder into the repository `agents/` folder, byte for byte. The edits raise the frontmatter `steps` value, add a "## Rating rubric v1 (optional result keys)" section, and add one Route-line rule to measure-orchestrator.md. The track verifies the copy with `cmp`, a numstat table, 5 doc tests, and the installer check. It then commits on local-changes-20261111 and pushes to update draft PR #9. A merge into main stays out of scope.

### How the current system works, per this spec

`bin/install-measure-skill` installs `agents/measure-*.md` from the ref into `~/.agents/agents` and `~/.config/opencode/agents`. A stamp file in each target protects local edits. Right now the 9 installed copies in `~/.config/opencode/agents` hold local edits that the repository does not have. `bin/install-measure-skill --ref HEAD --check` reports these 9 files as local-edit and exits 1. The installed roles already use the edited content.

### Findings

- F1 [Nit] spec.md FR-3: FR-3(a) says the frontmatter change is "steps: 40" to "steps: 56", but the installed copies show steps: 48 to 64 in measure-adversarial-testing.md and steps: 48 to 72 in measure-ux-browser-review.md. Rationale: FR-1 (byte-for-byte copy) and FR-4 (the numstat table, which matches the actual diffs) govern the build, so the wrong example values do not change what the implementer builds; a literal reading of FR-3(a) alone could wrongly flag a correct copy.

### Author Response
- F1: FIX

## Round 2

Date: 2026-11-11
Reviewer: measure-spec-review, kimi-code-plan-cn/kimi-for-coding#high

### What this track proposes

This track copies 9 edited Measure role files from the installed OpenCode agents folder into the repository `agents/` folder, byte for byte. The edits raise the frontmatter `steps` value in 6 files, add a "## Rating rubric v1 (optional result keys)" section to 6 audit role files, and add one Route-line rule to measure-orchestrator.md. The track verifies the copy with `cmp`, a numstat table, 5 doc tests, and the installer check. It then commits on local-changes-20261111 and pushes to update draft PR #9. A merge into main stays out of scope.

### How the current system works, per this spec

`bin/install-measure-skill` installs `agents/measure-*.md` from the ref into `~/.agents/agents` and `~/.config/opencode/agents`. A stamp file in each target protects local edits. Right now the 9 installed copies in `~/.config/opencode/agents` hold local edits that the repository does not have. `bin/install-measure-skill --ref HEAD --check` reports these 9 files as local-edit and exits 1. The installed roles already use the edited content.

### Findings

No findings.

F1 withdrawn: the author changed spec.md FR-3(a) as F1 asked. The new text says 40 to 56 in measure-closeout.md, measure-review-a-correctness.md, measure-review-b-security.md, and measure-review-c-ux-api.md; 48 to 64 in measure-adversarial-testing.md; 48 to 72 in measure-ux-browser-review.md; the other 3 files keep their steps value. I checked each value against the installed copies in `/home/daniebo/.config/opencode/agents/` and against `git diff --numstat`, which equals the FR-4 table. The FIX is correct.
