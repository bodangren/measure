# route identity: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The gap

Only the 200 view carried `x-measure-guard-module`/`x-measure-guard-digest`; the state 404 (plain-text `not found`), the state 500 JSON error, and every setup-route error carried none, so a caller could not tell a missing route from a failed request.

## Fix

A `respond(deps, value, status)` helper adds the identity to every JSON response of both routes, and a `textResponse(deps, text, status)` does the same for the state 404 while keeping the `not found` body. Statuses and bodies are unchanged; a missing identity value still adds no header.

## Live proof (running Host, after install + reload nonce 23)

```
$ curl -s -D - -o /dev/null "http://127.0.0.1:3080/measure-guard/state?sessionId=nope"
HTTP/1.1 404 Not Found
x-measure-guard-digest: sha256:cf3a5ac2c6152810a8a4f8e194d24226ab3b3b57b93d05aaeeaf653eee08efbf
x-measure-guard-module: file:///home/daniel-bo/.dsh/profiles/web/plugins/dsh-measure-guard/index.js
```

A GET on the setup route now also answers 405 with the identity headers (it previously had none).

Live finding recorded for the next track: a POST to `/measure-guard/setup` is answered by the Host web server with 405 `allow: GET, HEAD` — the `webServer` resource route answers only GET/HEAD (WebResourceRoute type), so the setup buttons cannot reach the plugin handler on this host. That is a compatibility gap outside this track and is carried forward.

## Gates

- node: 344/344 pass (342 -> 344: state 404/500 and setup 400/404/405 identity cases)
- parity: ok (both gates)
- spec-review-gate: 11 suites (PASS=11, FAIL=0)
- CLI: 13 passed, 0 failed
