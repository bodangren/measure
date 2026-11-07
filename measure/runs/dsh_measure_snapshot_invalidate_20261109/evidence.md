# Snapshot invalidation narrowing evidence

Date: 2026-11-10

repoMutationLikely(toolName) is false for read/grep/glob/read_image/web_search/web_fetch/todo_write; true for bash/write/edit/apply_patch/subagent/unknown/undefined.
index.js tools/result invalidates only when the predicate is true; pre-step invalidation unchanged.
Tests: predicate cases + plugin-level spy (read => 0 invalidations, bash => >=1) => node 317/317; parity ok (adapter-local); CLI 13/13; srg 11/11.
