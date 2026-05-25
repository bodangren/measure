# Tech Debt Registry

> This file is curated working memory, not an append-only log. Keep it at or below **50 lines**.
> Remove or summarize resolved items when they no longer need to influence near-term planning.
>
> **Severity:** `Critical` | `High` | `Medium` | `Low`
> **Status:** `Open` | `Resolved`

| Date | Track | Item | Severity | Status | Notes |
|------|-------|------|----------|--------|-------|
| 2026-05-25 | scrum_tracks_20260525 | `templates/` directory does not exist in this repo; if reintroduced, copies of `workflow.md`, `lessons-learned.md`, `tech-debt.md` must be re-synced with `claude-skills/measure/assets/` | Low | Open | Several workflow docs and the lessons_learned spec assume a `templates/` mirror of `claude-skills/measure/assets/`. Currently only `claude-skills/` exists, so parity instructions are no-ops. Either remove the parity language or restore the `templates/` dir. |
