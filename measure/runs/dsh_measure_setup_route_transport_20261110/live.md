# setup route transport: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The gap (found live last round)

`webServer` resource routes answer only GET/HEAD (`RESOURCE_METHODS = "GET, HEAD"` in the host), so on the running Host `POST /measure-guard/setup` was answered by the web server with 405 `allow: GET, HEAD` — `setupResponse` never ran and the band setup buttons could not record an answer. Unit tests called `setupResponse` directly and could not see it.

## The fix

The setup route is registered as a `handler`; `setupHandler(deps)` reads at most 8 KiB of the request body, replays the exchange as a Fetch `Request`, answers it with `setupResponse`, and writes status/headers/body to the node response (oversized 413; a throw 500; everything carries the identity headers). The state route stays a resource (GET poll).

## Live proof (running Host, after install + reload nonce 25)

```
$ curl -X POST --data "not json" /measure-guard/setup
HTTP/1.1 400 Bad Request
x-measure-guard-digest: sha256:6160f004bce180b6dd5bd7c4992296ef9c62a1f58ea1d7651a3f40b208f504ac

$ curl -X POST --data "{\"sessionId\":\"nope\",\"choice\":\"off\"}" /measure-guard/setup
HTTP/1.1 404 Not Found
x-measure-guard-digest: sha256:6160f004bce180b6dd5bd7c4992296ef9c62a1f58ea1d7651a3f40b208f504ac

$ curl -X POST --data-binary @big.txt /measure-guard/setup
HTTP/1.1 413 Payload Too Large
x-measure-guard-digest: sha256:6160f004bce180b6dd5bd7c4992296ef9c62a1f58ea1d7651a3f40b208f504ac
```

Before the fix all three answers were the server 405 `allow: GET, HEAD` without plugin identity.

## Gates

- node: 346/346 pass (344 -> 346: handler transport cases)
- parity: ok (both gates)
- spec-review-gate: 11 suites (PASS=11, FAIL=0)
- CLI: 13 passed, 0 failed
