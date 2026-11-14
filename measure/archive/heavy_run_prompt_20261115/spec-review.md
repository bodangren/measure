# Spec Review: heavy_run_prompt_20261115

Author model: volcengine-agent-plan/glm-5.3-flash

## Round 1

Date: 2026-11-15
Reviewer: measure-spec-review, kimi-code-plan-cn/kimi-for-coding#high

### What this track proposes

This track adds one prompt paragraph to five audit role files: review A, review B, review C, phase acceptance, and final acceptance. The paragraph tells each role to run tests with no shell redirection, also through a wrapper such as heavy-run.sh, and to read the test output in the tool result. A new section in tests/spec_review_gate/test_s2_role_docs.sh pins the paragraph: it occurs exactly once, directly after the "Do not use the question tool." paragraph, and the three other audit roles do not hold it. The track also updates CHANGELOG.md and README.md, archives the track, and opens a pull request that stacks on PR #15.

### How the current system works, per this spec

The eight audit role files deny the shell redirection patterns `* > *`, `* >*`, `*>>*`, and `*tee *` in their frontmatter, so a test command with a redirect gets permission.rejected. Monorepo review B and phase acceptance hit this deny when they ran tests through heavy-run.sh; review B round 2 ran the command with no redirection and it worked. The PM decision of 2026-11-15 keeps the deny rules unchanged and adds the prompt line instead. The S2 suite tests/spec_review_gate/test_s2_role_docs.sh pins role-doc contracts, including the narrowed redirect denies, and its "# Edge checks" block closes the file.

### Findings

- None
