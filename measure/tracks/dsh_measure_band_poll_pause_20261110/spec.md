# Specification: DSH Measure band poll pause

## Overview

The band and the panel poll `GET /measure-guard/state` every 2 s for as long as they are
mounted, including while the page is hidden in a background tab. The polling channel itself
was a deliberate choice (the alternatives need zod wire schemas or codegen, rejected by
NFR-2), but the *cost* can be bounded without changing the channel: a hidden page does not
need the poll. Today a backgrounded GUI keeps two timers and a fetch every 2 s per open
panel/band.

This track pauses the poll while the page is hidden and refreshes once on return to
visibility, using the standard `document.visibilityState`/`visibilitychange` API, with no
new dependency and no change to the route. The render harness (which already executes the
shipped bundle) is extended with a fake `document` and proves pause/resume; a host without
`document` (or without the event API) keeps the plain 2 s poll.

## Functional Requirements

- **FR-1 (pause and resume).** `useStatusView` clears its interval while
  `document.visibilityState === 'hidden'`, and on a `visibilitychange` back to visible it
  fetches once immediately and restarts the 2 s interval; the cleanup removes the listener,
  the interval, and aborts the request.
- **FR-2 (no-document fallback).** When `document` is absent or lacks `addEventListener`,
  the poll behaves exactly as today (2 s interval, no listener).
- **FR-3 (tests).** `client-render.test.js` stubs `document`/`visibilitychange` and asserts:
  the initial poll, a pause on hide (interval cleared, no further interval), a resume on
  show (immediate fetch + a new interval), and the no-document fallback; the existing render
  assertions keep passing.
- **FR-4 (records).** The guard README's poll paragraph states the pause; the band-polling
  tech-debt row becomes `Resolved` with the channel decision unchanged; `CHANGELOG.md`
  records it; the installed plugin is reloaded and the live check passes.
- **FR-5 (verification).** node suite green with the new cases, both parity gates ok,
  srg 11/11, CLI 13/13; the track is archived with a manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (no dependency, no channel change).** Only the standard visibility API; the route
  and its payload are unchanged.
- **NFR-2 (no leaked timer).** Every path clears the interval it started; the effect cleanup
  is idempotent.

## Acceptance Criteria (track level)

- Given a hidden page with a mounted band, Then the interval is cleared and no timer
  remains; on visibility the band fetches once and polls again at 2 s.
- Given no `document`, Then the band polls every 2 s as before.
- Given the gates, Then node, parity, srg, and CLI are green and the track is archived.
