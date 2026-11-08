# band poll pause: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The pause

`useStatusView` clears its 2 s interval while `document.visibilityState` is hidden, fetches once and restarts the interval on `visibilitychange` back to visible, removes the listener and aborts the request in cleanup, and keeps the plain poll when there is no `document`. No route or payload change.

## Tests

The render harness (which executes the shipped bundle) gained a fake `document` with `visibilitychange` dispatch and clear tracking: the initial poll, the pause on hide (interval cleared, no new interval), the resume on show (immediate fetch + new interval), and the no-document fallback. Client render tests 9 -> 11; node suite 346 -> 348.

## Live finding and the reload fix

After install + reload the live check reported the running host *stale* even though the installed digest was new: a change confined to `client.js` did not change the entry module's cache key, so the loader kept the old instance. Touching the installed `index.js` plus a reload made the loaded digest the new one (`sha256:bb579b907a89318e8` matches the installed copy). `bin/measure-dsh reload` now touches the installed entry itself; `tests/dsh/test-reload.sh` pins it (the installed entry mtime changes on reload).

## Live check

```
PASS live: HTTP 200 with a band field; digest sha256:bb579b907a89318e8 matches the installed copy
```

## Gates

- node: 348/348 pass
- parity: ok (both gates)
- spec-review-gate: 11 suites (PASS=11, FAIL=0)
- CLI: 13 passed, 0 failed
