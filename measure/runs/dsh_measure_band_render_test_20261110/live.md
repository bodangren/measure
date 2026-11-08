# band render test: live and gate evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The harness

`tests/client-render.test.js` reads the shipped `client.js`, executes it with a stub `window.__ModuleLoader__`, renders the captured components with a dependency-free miniature React (createElement, useState, useEffect with dependency comparison, class components, state-settling loop), and stubs `fetch`/`setInterval`/`clearInterval`. No jsdom, no build step, no production change.

## What the nine tests assert

- the module-loader id and the factory contract;
- `apply(ctx)`: the band slot (id measure-guard, order 20), the keyed main panel, the sidebar entry (id measure), the en/zh locale registration, the `measure-status` action whose `run()` selects the panel, and every `slots.inject` callback (including the generator one);
- the band: host line, full-text `title`, guards/mode/goal rows, setup buttons with their POST body, problem rows;
- the state route request (`/measure-guard/state?sessionId=session-1`) and the 2000 ms poll;
- a failed fetch rendering nothing and the null-band setup sentence;
- the zh labels (设置 Measure / 本会话关闭 / 守卫 / 问题) while the host line stays English;
- the panel: empty state with disabled refresh, and a session select + guards row + status `pre` with enabled refresh;
- the sidebar icon artwork (20 px svg, rect + path).

## Live install and digest

`bin/measure-dsh install` re-synced the copies and `reload` (nonce 19) recomposed; the check passed every item:

```
PASS live: HTTP 200 with a band field; digest sha256:b165cc649f4e31f96 matches the installed copy
```

## Gates

- node: 342/342 pass (333 -> 342: the nine render tests)
- parity: ok (both gates)
- spec-review-gate: 11 suites (PASS=11, FAIL=0)
- CLI: 13 passed, 0 failed
