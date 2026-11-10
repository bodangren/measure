# Band-strip live proof

Date: 2026-11-10

## The reported view (before)

The owner's complaint came from the main GUI at `http://127.0.0.1:3080`, on the
session whose Measure state is the "Migrate Hermes Media Automation to DSH +
Mediarr" track with eleven end-of-turn problems. Measured on the live DOM:

```
band {x: 280, y: -84, w: 1079, h: 503}   viewport 559
text: Measure · Migrate Hermes … · Mode: guard (config) · Problems: <11 items>
```

The problems column wrapped all eleven entries (726 px wide, 480 px tall), so the
band was taller than the viewport and the position line was squeezed to ~59 px.
`before.jpg` is that view.

## After the fix, same view, same session

After the copy and `reloadNonce: 51` (see `install.md`), a page reload served the
new bundle. Measured on the same element:

```
band {x: 280, y: 390, w: 1079, h: 28}    viewport 558
text: Measure · Migrate Hermes … · Mode: guard (config)
buttons inside the band: 0
```

The band is one 28 px row; the position line uses the remaining width, and no
"Set up Measure" / "Turn off for session" buttons render in a `measure/`
project. `after-main.jpg` is that view. The host problems array was empty at
this point because the profile recompose resets the per-session end-of-turn
state.

## The problem count, live

To prove the chip on a session that actually has problems, an isolated DSH home
(`/tmp/dsh-idle-proof-home`, Web profile copy, port 3099) was pointed at a real
git project with a `measure/` folder and an active proof track. A fresh GUI
session was asked to mark a task `[x]` without a SHA; the end-of-turn guard
recorded the problem. The live band then measured:

```
band: 28 px row
text: Measure · Proof track · all tasks closed · Mode: guard (config) · Problems: 1
chip: <button> "Problems: 1", title = "\"Task 1.2: a new finished task with no SHA\" is [x] but has no commit SHA. Commit the task, and add the 7-character SHA to its line in plan.md."
state route problems: [the same one problem]
```

`live-chip.jpg` shows that session. The same session proves the setup gating the
other way: a project with `measure/` shows no setup buttons.

## Evidence files

- `before.jpg` — the 1079 x 503 px band with the inline problem dump.
- `after-main.jpg` — the 1079 x 28 px band in the reported view.
- `live-chip.jpg` — the isolated live session with the `Problems: 1` chip.
