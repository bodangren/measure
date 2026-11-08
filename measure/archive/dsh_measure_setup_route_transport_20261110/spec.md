# Specification: DSH Measure setup route transport

## Overview

The band's setup buttons POST `{ sessionId, choice }` to `/measure-guard/setup`, but the
route is registered as a `webServer` **resource**, and the Host answers a resource only
for GET and HEAD — every other method receives `405 allow: GET, HEAD` from the web server
before the resource runs. Proven live this session: `POST /measure-guard/setup` answers
405 with `allow: GET, HEAD` and no plugin identity, while a GET reaches `setupResponse`
(405 with the identity headers). So the setup answer cannot be recorded through the band
on this Host, and the unit tests cannot see it because they call `setupResponse` directly.

This track registers the setup route as a `handler` route instead (the Host hands it the
raw `IncomingMessage`/`ServerResponse`, so it can read the POST body and write the
response), with a bounded body read, the same `setupResponse` logic and identity headers,
and tests of the transport plus a live POST proof.

## Functional Requirements

- **FR-1 (handler route).** `registerClientState` registers `SETUP_PATH` with a `handler`
  (not a `resource`); the state route stays a resource (GET-only for the band's poll).
- **FR-2 (adapter).** `setupHandler(deps)` reads at most 8 KiB of the request body, builds
  a Fetch `Request` (`method`, headers, body) and answers it with `setupResponse`, then
  writes the status, every header, and the body to the `ServerResponse`; a body over the
  limit answers `413 { error: 'request body too large' }` with the identity headers; a read
  or write throw answers `500` with the identity headers and never throws out.
- **FR-3 (behavior preserved).** POST with a valid answer is 200 `{ choice }`; malformed
  JSON 400; invalid choice 400; unknown session 404; GET/HEAD 405; every response keeps
  the module identity headers (the route-identity contract).
- **FR-4 (tests).** `client-state.test.js` covers the handler: POST 200 (and the recorded
  choice), malformed 400, unknown session 404, GET 405, oversized 413, and the identity
  headers on each; the registration test asserts the setup route is a `handler` with no
  `resource`.
- **FR-5 (live proof).** After install + reload, `curl -X POST` with a malformed body and
  with an unknown session answers 400/404 (not the web server's 405), each with the
  identity headers; the evidence is recorded.
- **FR-6 (records).** The Medium tech-debt row is Resolved; the README route paragraph
  states the handler transport; `CHANGELOG.md` records it; the track is archived with a
  manifest-only closeout FAIL and the gates are green.

## Non-Functional Requirements

- **NFR-1 (bounded).** The body read streams with an 8 KiB cap; no buffering of arbitrary
  input.
- **NFR-2 (no wire change).** Statuses, bodies, and headers of the answers are unchanged;
  only the transport (handler vs resource) changes.

## Acceptance Criteria (track level)

- Given a live `POST /measure-guard/setup` with a malformed body, Then the answer is 400
  with `x-measure-guard-digest` (previously the web server answered 405).
- Given the registration, Then the setup route carries a `handler` and no `resource`.
- Given the node suite and the gates, Then all are green and the track is archived.
