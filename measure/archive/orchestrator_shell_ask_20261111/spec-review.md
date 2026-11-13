# Spec Review: orchestrator_shell_ask_20261111

Author model: volcengine-agent-plan/glm-5.3-flash

## Round 1

Date: 2026-11-11
Reviewer: measure-spec-review, minimax-cn-coding-plan/MiniMax-M3.1-Flash

### What this track proposes

The track restores the default shell permission of the orchestrator agent file from `deny` back to `ask` in `agents/measure-orchestrator.md` (line 17). It keeps the rest of commit 72e20d3 and flips the matching pin in `tests/spec_review_gate/test_s2_role_docs.sh` from `deny` to `ask`. The work lands as one commit with two files, checked by the five doc tests and by the installer check. The track then archives itself, updates the registry, and opens a pull request from `fix/orchestrator-shell-ask` to main without merging it. The installed copies keep `ask`; their one remaining difference, the Substitution paragraph, stays out of scope until the PM decides it.

### How the current system works, per this spec

`agents/measure-orchestrator.md` lists its permissions in the frontmatter. The first shell rule (action `shell`, resource `*`) is the default for every other shell command, and commit 72e20d3 set its effect to `deny`. The rules after it allow the read-only commands (`git status --short`, `git rev-parse HEAD`, the inter-phase checker) and deny the destructive ones (`git commit*`, `rm *`, the redirects). The doc test `tests/spec_review_gate/test_s2_role_docs.sh` reads that first shell rule and pins its effect, so it expects `deny` today and fails on any other value. The installer copies the agent files into `~/.config/opencode/agents/` and `~/.agents/agents/` and protects local edits with a stamp, so both installed copies hold `ask` now and differ from the repository only in the Substitution paragraph.

### Findings

- F1 [Major] spec.md FR-5 and plan.md Task 1.1: the spec and the plan pin a test count. Rationale: `skills/measure-orchestrator/SKILL.md` line 124 forbids a test count or a check count in `spec.md`, `plan.md`, or `CHANGELOG.md` and asks for the log file that holds the count. That rule (commit 3ffcc37, 2026-11-11 21:22) is older than this spec. The pinned "5 doc tests" drifts with the next change. Name the five test paths without the number and cite the log file that holds the count.
- F2 [Major] plan.md Task 1.2: the metadata finalization names the status and the actual task count but not the completed date, so the closeout check named in the same task fails. Rationale: `skills/measure-orchestrator/scripts/measure_interphase_checks.py` line 843 (metadata_closeout_feedback) reports "metadata must include a completed date" when the key is missing, and every archived track carries it (see `measure/archive/role_file_edits_20261111/metadata.json`). Name the completed date in Task 1.2.
- F3 [Major] plan.md Task 1.2 and spec.md FR-7: the archive step updates neither the README status line nor the CHANGELOG entry, so two shipped documents state what this track reverses. Rationale: `README.md` line 33 names the latest archived track and would still name "Implement the orchestrator process review" after this track archives (71 of the 87 archive commits update that line, for example f8091e3), and `CHANGELOG.md` line 7 in Unreleased says "the default shell effect is `deny` (all allow rules kept)" although the shipped file says ask. Name both files in Task 1.2 or add a functional requirement.
- F4 [Nit] plan.md Task 1.1: the task says "the default shell entry" and "the test pin", while the two paths live only in spec.md FR-1 and FR-3. Rationale: the standard asks each phase to name the files to create or change, so the phase reader must resolve both names through the spec link. Name `agents/measure-orchestrator.md` and `tests/spec_review_gate/test_s2_role_docs.sh` in the task.
- F5 [Nit] plan.md Task 1.2: the task says to add the registry entry, while the entry sits in the Active Tracks section and has to move to the Archived Tracks section with the metadata description. Rationale: the closeout check reports "track is still listed in the active section of measure/tracks.md" (`skills/measure-orchestrator/scripts/measure_interphase_checks.py` line 883) and `tests/dsh/test-registry.sh` requires the archived entry's description to equal the archive metadata description. Say that the task moves the entry to the Archived Tracks section with the metadata description.
- F6 [Nit] spec.md FR-6: "shows local-edit rows for these 2 files only" can be read as the two changed files, but the installer never installs the test file (`bin/install-targets.tsv` lists the agents bundle only). Rationale: the two rows are the two installed copies, `~/.config/opencode/agents/measure-orchestrator.md` and `~/.agents/agents/measure-orchestrator.md`. Name those two paths so the check has one reading.

### Author Response
- F1: FIX
- F2: FIX
- F3: FIX
- F4: FIX
- F5: FIX
- F6: FIX

## Round 2

Date: 2026-11-11
Reviewer: measure-spec-review, minimax-cn-coding-plan/MiniMax-M3.1-Flash

### What this track proposes

The track restores the default shell permission of the orchestrator agent file from `deny` back to `ask` in `agents/measure-orchestrator.md` (line 17). It keeps the rest of commit 72e20d3 and flips the matching pin in `tests/spec_review_gate/test_s2_role_docs.sh` to `ask`. The work lands as one commit with two files, checked by the doc tests of FR-5 and by the installer check. The track then archives itself, updates the registry, README and CHANGELOG, and opens a pull request to main without merging it. The installed copies keep `ask`; their one remaining difference, the Substitution paragraph, stays out of scope until the PM decides it.

### How the current system works, per this spec

`agents/measure-orchestrator.md` lists its permissions in the frontmatter; the first shell rule (action `shell`, resource `*`) is the default for every other shell command. Commit 72e20d3 set its effect to `deny`; the rules after it allow the read-only commands and deny the destructive ones. The doc test `tests/spec_review_gate/test_s2_role_docs.sh` reads that first shell rule and pins its effect, so it expects `deny` today. The installer copies the agent files into two folders and protects local edits with a stamp. Both installed copies hold `ask` now and differ from the repository only in the Substitution paragraph.

### Findings

- F7 [Nit] plan.md Task 1.2: the metadata finalization names the completion date in prose, as "completed date", not the key that the closeout check reads. Rationale: `skills/measure-orchestrator/scripts/measure_interphase_checks.py` line 843 requires the key `completed` in `metadata.json`, and every archived track carries `"completed": "2026-11-11"`; a key such as `completed_at` gives the closeout check a second failure besides the missing manifest that FR-7 names. Name the key `completed`.

### Author Response
- F7: FIX
