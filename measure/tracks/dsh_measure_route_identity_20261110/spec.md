# Specification: DSH Measure route identity

## Overview

The client-state routes attach their install identity (`x-measure-guard-module`,
`x-measure-guard-digest`) only to the successful 200 responses. A 404 from the state route
is a bare `not found` with no headers, and the setup route's 400/404/405/500 JSON errors
carry none either, so a caller cannot tell "this route is missing or the plugin is not
loaded" (no identity) from "the route is present and the request failed" (identity
present). The live check only reads the 200 path, so the gap is latent — but it is exactly
the signal a stale-install diagnosis needs.

This track makes both routes attach the identity to **every** response they produce, for
every status, and pins the behavior in the route tests.

## Functional Requirements

- **FR-1 (state route).** `clientStateResponse` attaches the identity headers to the 200
  view, the plain-text 404 `not found`, and the 500 JSON error; when the deps provide no
  module URL or digest the headers are absent (never empty strings).
- **FR-2 (setup route).** `setupResponse` attaches the identity headers to every JSON
  response: 200, 400 (malformed body and invalid answer), 404 (unknown session),
  405 (non-POST), and 500.
- **FR-3 (tests).** `client-state.test.js` asserts the headers on each of those statuses
  and their absence without identity deps; the existing 200 assertions stay.
- **FR-4 (records).** The guard README's route paragraph notes the every-response identity;
  the tech-debt row 43 becomes `Resolved`; `CHANGELOG.md` records it; the installed plugin
  is reloaded and the live check passes.
- **FR-5 (verification).** node suite green with the new cases, both parity gates ok,
  srg 11/11, CLI 13/13; the track is archived with a manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (wire-compatible).** The statuses and bodies are unchanged; only headers are
  added to responses that lacked them.
- **NFR-2 (no header when unknown).** A missing identity value adds no header (no empty
  header values).

## Acceptance Criteria (track level)

- Given a state-route 404, Then it carries the identity headers and the body stays
  `not found`.
- Given a setup-route 400/404/405/500, Then each carries the identity headers.
- Given deps without a module URL or digest, Then no identity header appears.
