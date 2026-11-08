# doc contract: evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## project metadata keys

`new-track.md` §2.5 carries the Project metadata keys note after step 11 (steps 1-8 are frozen against `TRACK_BASE`, the step-9 block is pinned): read every `metadata.json` in the Tracks Directory (or archive), add the keys every file has and the Measure schema does not with a value for this track, skip keys only some tracks have, fill fields a project rule requires, and cross-reference `new-track-set.md` §2.9 step 4 item 5. The bundle copy is identical (S3 bundle check). `test_s1_new_track.sh` pins the note (41 checks).

## inline code-span lint

The pre-fix parser found the OpenCode README span at line 99 (`an inline code span opened with 2 backticks never closes`); the span is rewritten, and `tests/dsh/test-docs.sh` now lints `docs/dsh.md` + both plugin READMEs: a backtick run opens a span that must close with an equal run (fenced blocks and escaped backticks skipped, a different run inside a span is content); an unbalanced-span fixture is proved rejected.

## Live check

```
PASS live: digest matches the installed copy (no plugin code change)
```
