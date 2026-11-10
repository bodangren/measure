# Band-strip install

Date: 2026-11-10

## What was copied

This track changes exactly one runtime file, `plugins/dsh-measure-guard/client.js`
(the Host half, the shared core, and the state route are untouched). The running
Web profile got that one file:

```
cp plugins/dsh-measure-guard/client.js \
   ~/.dsh/profiles/web/plugins/dsh-measure-guard/client.js
```

The installed copy carries unrelated local differences in `README.md`,
`src/core/parse.ts`, `src/core/guards.ts`, and `src/hooks.js` from earlier work;
this track deliberately did not overwrite them — only `client.js` is part of the
band change.

## Reload

```
bin/measure-dsh reload
PASS reload: incremented the reloadNonce in ~/.dsh/profiles/web/cordis.patch.yml (now 51)
reload complete: the running profile recomposes on the patch-file change.
```

The running profile is the main GUI at `http://127.0.0.1:3080`. A page reload
then serves the new client bundle (`dsh-measure-guard/client.js` inside the
plugin bundle URL; the served text contains `ProblemChip` and the `28px`
container style and no `ProblemList`).

## Restore

None needed: the profile keeps `idleMinutes` unrelated settings untouched, the
measure-guard row keeps `mode: guard`, and `reloadNonce: 51` is the current live
value.
