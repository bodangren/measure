# Implementation Plan: README videos

Track: `readme_videos_20261105`. Spec: [spec.md](./spec.md).

## Rules for every phase

- Work on `main` in `/home/daniebo/Desktop/measure`. Never stage `extensions/`.
- The task commit changes only `README.md`. Attach a git note to it.
- Run no test suite. The change has no code. The PM limit of 2026-11-05 allows one light slot and no heavy run.

## Phase 1: Videos in the README

- [~] Task 1.1: Add the section `## Videos` to `README.md` (FR-1 to FR-3). Verify each thumbnail URL with `curl -s -o /dev/null -w '%{http_code} %{content_type}'`. Verify with `git show --stat` that the commit changes only `README.md`.
