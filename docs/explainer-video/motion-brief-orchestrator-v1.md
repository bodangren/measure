# Measure orchestrator video: motion brief

Version 1, 2026-10-20. Follows `orchestrator-plan.md` version 2. Where this brief and the plan differ, the plan wins. Section 10 lists each place where this brief could not follow the plan word for word, and the reason.

Format, world, palette, type, actors, and hard rules come from `motion-brief-v2.md` (the first video). This brief repeats a rule only when the second video uses it in a new way.

Title on screen and in the index: "Measure Orchestrator: how a track runs". 1920 × 1080, 60 fps. Reading Advantage brand: light canvas, one accent (Sky 400).

## 0. Decisions in brief

| Topic | Decision |
|---|---|
| Thesis | The orchestrator is a control plane. It gives each step to one role. A mechanical gate, not the role's own report, decides if the step passed. |
| World | The Tape of the first video, unchanged. The case, the blade, the ticks, the phase marks, the pins, the commits, and the tags keep their sizes and places. |
| New elements | Seven World elements for the control plane (section 3.4). They are the control lane, the orchestrator glyph, role chips, and the go/no-go gauge with its readout plate. The others are baseline stamps, the runs tray with run tags, and the archive slot in the Case. |
| Example track | `password_reset_20261019`, Phase 3 "Hardening". The first video reverted this phase in S9. This video runs it again under the orchestrator and archives the track. |
| Look | Unchanged. Canvas `#F5F5F7`, ink `#1e293b`, one accent: Sky 400 `#38bdf8`. Only the plan uses the accent. |
| Type | Unchanged. Inter Tight (display), Inter (text), JetBrains Mono (files, SHAs, skill names, checker output). |
| Structure | 16 scenes, O1–O16, in five chapters. The voiceover sets each scene length. |
| Length | About 243 s at the planning estimate of 150 words per minute. About 232 s with the recorded takes (section 4.1). |
| Voice | Recorded. `public/voiceover-orchestrator/O01.mp3` … `O16.mp3`, `speech-2.8-hd`, `English_Trustworthy_Man`, one take per line. |
| Music | The Reading Advantage jingle, cut at bar boundaries. Two seams make it long enough. Its natural ending falls on the last seconds of the video (section 7.3). |
| Build | Remotion 4.0.512 in `/home/daniebo/Desktop/advantage-pr`. Composition `MeasureOrchestrator` in `src/measure-orchestrator/`. It shares the World code, actors, theme, captions, and audio layers with `MeasureExplainer`. |
| Output | `assets/videos/2026-10-2x-measure-orchestrator-1920x1080.mp4`, with the render date. |

## 1. Facts that the video shows

The video shows only true behavior. This table links each point to its source and to its scene. Paths are in the Measure repository.

| Point | Source | Scene |
|---|---|---|
| The orchestrator is a control plane. It writes no code, tests, plans, registry entries, audit results, or closeout artifacts. | `agents/measure-orchestrator.md`, opening and "Delegation Rules" | O2 |
| At start, it reads `measure/index.md`, `measure/tracks.md`, `measure/anti-patterns.md`, the track spec and plan, and `test-strategy.md`. | `skills/measure-orchestrator/SKILL.md`, "Start Here" | O2 |
| `status` lists the open phases. The first listed phase is the default next phase. | `SKILL.md`, "Start Here"; script `cmd_status()` | O3 |
| A `[b]` task with `deferred:<owner>` does not count as incomplete. The checker counts only `[ ]`, `[~]`, and `[x]` lines. | `SKILL.md`, "Marker Vocabulary"; script `phase_counts()` regex `^- \[([ ~x])\] (.+)` | O3 |
| The orchestrator captures a `role_base_sha` before every role. It captures the phase baseline after the strategy commit. | `agents/measure-orchestrator.md`, "Managed Track Procedure" 5; `agents/measure-strategy.md` | O4, O5 |
| Strategy writes `test-strategy.md`. It states if security review, UX/API review, adversarial testing, and browser review apply. | `agents/measure-strategy.md` | O5 |
| The orchestrator runs the role gate after every role. A task response alone is not acceptance evidence. | `agents/measure-orchestrator.md`, "Managed Track Procedure" 7 | O6 |
| Every role ends with a `MEASURE_AGENT_RESULT` block. The gate fails when the block is missing. | `references/contracts.md`; script `has_agent_result()` | O6 |
| The gate prints `PASS: <role> gate passed` or one `FAIL: <reason>` line for each problem. | script `cmd_role_gate()` | O6–O15 |
| Mid Red marks every open task of the phase `[~]`, writes failing tests, and commits. Its gate expects `RED_TEST_COMMAND` to fail and allows only test files and `measure/` files in the commit. | `agents/measure-mid-red.md`; script, mid-red branch and `non_test_committed_files()` | O7 |
| Jr Green commits the implementation, then records that SHA in `plan.md` in a second commit. Its gate checks no incomplete task, a SHA on every `[x]` task, and `GREEN_TEST_COMMAND`. | `agents/measure-jr-green.md`; script, jr-green branch | O8 |
| Reviews A, B, and C can run in parallel. They are report-only. Each writes a result JSON in `measure/runs/<track>/`. | `SKILL.md`, "Role Order" and "Delegation"; `references/contracts.md` | O9 |
| A review gate fails when the JSON `status` is not `pass`. The reason line names the blocking findings. | script `passing_audit_feedback()` | O10 |
| A remediation commit makes reviews bound to an older HEAD stale. The reviews run again on the new HEAD. | `SKILL.md`, "Role Order" and "Delegation" | O10 |
| Adversarial testing attacks with boundary, failure-path, and regression tests. It may commit tests. It does not fix production code. | `agents/measure-adversarial-testing.md` | O11 |
| UX browser review applies when user-facing files changed. Its JSON records screenshots, accessibility snapshots, and interactions. | `agents/measure-ux-browser-review.md`; script `ux_paths()`; `references/contracts.md` | O11 |
| Phase acceptance runs last in the phase, on the audited HEAD. Its family differs from Red. A blocker goes to the owning role, and acceptance runs again. | `agents/measure-phase-acceptance.md`; `SKILL.md`, "Model Selection" | O12 |
| Model rules. Red ≠ Green. An auditor ≠ the family it audits. Review A ≠ Review B. Phase acceptance ≠ Red. Final acceptance ≠ Review A, and ≠ phase acceptance. | `SKILL.md`, "Model Selection" | O13 |
| The audit role checks the framework: test scripts and plan truthfulness. It uses `measure/anti-patterns.md` (A1–A10) and appends new entries. The checker has no role gate for it. | `SKILL.md`, "Anti-Patterns Registry"; `agents/measure-orchestrator-audit.md`; script `ROLE_ALIASES` | O14 |
| Final acceptance needs no incomplete task in the track and runs `PROJECT_LINT`, `PROJECT_CHECKS`, and `PROJECT_TESTS`. | script, final-acceptance branch | O15 |
| Closeout is the only role that moves files. It moves the track to `measure/archive/`, removes it from the active registry, sets `status: "done"` with a `completed` date, and commits `measure/runs/<track>/` with the archive. | `SKILL.md`, "Closeout Standard"; `agents/measure-closeout.md`; `agents/measure-orchestrator.md`; script `closeout_feedback()` | O15 |
| Twelve roles, in one order. | `SKILL.md`, "Role Order" | O16 |

## 2. Visual concept

### 2.1 The same Tape

The second video opens in the world where the first video ended. The case is `measure/`. The blade is the plan of the active track. Commits hang below the blade. Heads are models. Nothing about these parts changes.

The new idea is a second constant above the blade: the control plane. The orchestrator works in a thin lane above the work zone. It never touches the blade. It sends roles down into the work zone, and it measures each result with a gauge at the end of the blade. Run records collect in a tray under the history.

### 2.2 New elements

Each new element has an anchor in the measuring-tool family, as the plan requires.

| Element | Stands for | Real-world anchor | Layer |
|---|---|---|---|
| Control lane | The orchestrator's control plane | The rail of a marking gauge | World |
| Orchestrator glyph | The orchestrator agent (read-only) | A hollow ring with a center dot, like a center punch mark | World |
| Read-only chip | `edit: deny` in the orchestrator's permissions | A label on the rail | World |
| Role chip | The skill that the orchestrator delegates to | A label on the rail | World |
| Go/no-go gauge | `measure_interphase_checks.py role-gate` | A machinist's go/no-go gauge | World |
| Readout plate | The checker's printed lines | The dial plate of a gauge | World |
| Gate token | The result that the gate reads | A part that goes through a gauge | World (inside the gauge) |
| Result card | The `MEASURE_AGENT_RESULT` block | A filled-in job card | Scene |
| Baseline stamp | `role_base_sha`, `phase_base_sha`, `audited_head_sha` | A stamp mark on a part | World |
| Runs tray | `measure/runs/<track>/` | A parts tray | World |
| Run tag | One run file: a role's log, or an audit result JSON | The Tag of the first video, a smaller variant | World |
| Archive slot | `measure/archive/` | A second slot in the case | World |

### 2.3 Vocabulary

Production uses these terms with one meaning each. The terms of `motion-brief-v2.md` section 2.3 stay valid.

| Term | Meaning |
|---|---|
| Control lane | The band y 192–264 above the work zone, with a 2 px graphite hairline at y 264. |
| Orchestrator glyph | The hollow ring with a dot at the left end of the control lane. Never a Head. |
| Role chip | A pill on the control lane with one real skill name, for example `measure-mid-red`. |
| Lane readout | One line of mono text on the control lane: a command that the orchestrator runs. |
| Stage | The work zone under the control lane, y 272–656. Heads and Cards work here. |
| Gauge | The go/no-go gauge right of the blade end. |
| GO channel, NO GO channel | The two openings in the gauge. |
| Token | The small card that goes through the gauge during a gate. |
| Readout plate | The plate above the gauge. It lists the checks and prints the checker output. |
| Gate | One run of `role-gate` for one role. |
| Stamp | A ring around a Commit that marks a baseline SHA. |
| Tray | The runs tray under the History lane. |
| Run tag | One file in `measure/runs/<track>/`, shown as a small tag that hangs in the tray. |
| Column | The run tags that hang under one Commit. |
| Stale | A run tag bound to a Commit that is no longer HEAD after a remediation commit. |
| Family | A model family. A Head glyph and a letter show it: `model A` … `model E`. |

### 2.4 Screen zones and reserved y-bands

The first video's zones stay. The second video divides the work zone into the control lane and the stage, and it adds the tray under the History lane.

| Band | y (px) | Contents | Changes? |
|---|---|---|---|
| Captions (social cut only) | 96–176 | Captions. Nothing else. | — |
| Control lane | 192–264 | Orchestrator glyph, read-only chip, role chips, lane readout. Hairline at y 264. | State changes only. World layer. |
| Stage | 272–656 | Heads, Cards, terminal, callouts, browser Frame, checkpoint Card, O16 lockup | Yes. Scene layer. |
| Gauge column | x 1456–1776; plate y 276–520, gauge y 536–696 | Gauge, readout plate, token | State changes only. World layer. |
| Blade gap | 656–704 | Stems, Markers, Pins | As in the first video. |
| Blade | 704–752 | Unchanged | Only state changes. |
| History lane | 784–900 | Commits (y 808–832), SHAs, first-video Tags (y 840–900), stamp rings and stamp labels (y 758–792) | Only additions. |
| Runs tray | 904–1056 | Run tags (y 904–1044), chains, tray floor at y 1052, tray label | Additions and state changes only. |

Collision rules:
- The control lane and everything on it stay above y 264. No element of the control lane reaches y 704.
- A dotted line that starts at the control lane (a handoff line or a pointer) ends at y 696 or higher on the screen.
- The gauge column starts right of the blade end (x 1400). The blade of `password_reset_20261019` never reaches it.
- The readout plate shows only during a gate. Heads and Cards leave the plate area (x ≥ 883, y 276–520) before a gate prints.
- Run tags hang at x ≥ 1256. The first video's Tags end at x 1264 and y 900. The tags start at y 904.

### 2.5 Hard rules

The three rules of the first video stay, without change:

1. **The Blade line never moves.** It stays at y 704 for the full video. This video uses no zoom. The only scroll is in O1, before any new element shows.
2. **The World layer has no idle motion.** This includes every new World element. The control lane, the glyph, the chips, the gauge, and the plate are still between state changes. The stamps, the tray, and the run tags are also still. Heads float 2 px at 0.5 Hz, as before.
3. **The accent marks only the plan.** Sky 400 appears on the Blade, the Pins, and the `[~]` Markers only. The new elements use ink, graphite, hairline, and paper.

Four rules for this video:

4. **The control lane never crosses the blade line.** Its hairline is at y 264. Its pointers end at y 696 or higher.
5. **Nothing disappears from the History lane.** The O15 archive dims Commits to 30 %. It does not hide them. Only the first video's git-note Tags fade, by the first video's archive rule (section 4.3, O15). O16 keeps the History lane and the tray on screen.
6. **A stale run tag stays on screen.** It changes to hairline with a diagonal mark. It does not move, fade out, or leave the tray.
7. **Gate text is real checker text.** Every `PASS:` and `FAIL:` line is a string that `measure_interphase_checks.py` prints. Plate check rows are labels in Inter, not checker output.

No vendor marks: Heads keep the five abstract glyphs and the letter labels. No model name, vendor name, vendor color, or logo other than the Reading Advantage logo appears on screen.

## 3. Visual language

### 3.1 Palette

Unchanged: `motion-brief-v2.md` section 3.1. Use for the new elements:

| Element | Fill | Line | Text |
|---|---|---|---|
| Control lane | — | `graphite` 2 px | — |
| Orchestrator glyph | — (dot: `ink`) | `ink` 4 px | — |
| Read-only chip | `paper` | `graphite` 2 px | `graphite` |
| Role chip | `paper` | `ink` 2 px | `ink` |
| Lane readout | — | — | `ink`; the part not in focus `graphite` |
| Gauge frame | `paper` | `ink` 6 px | `ink` (GO, NO GO) |
| Gauge channels | `canvas` | — | — |
| Token | `paper` | `ink` 2 px | Head glyph in `ink` |
| Readout plate | `paper` | `ink` 2 px | `ink`; unused rows `graphite` |
| Stamp, current | — | `ink` 3 px | Label `ink` on a `paper` pill with a `hairline` border |
| Stamp, earlier | — | `hairline` 2 px | — |
| Phase stamp | — | two `ink` rings, 2 px | Label as above |
| Run tag | `paper` | `hairline` 2 px | Glyph and icon in `ink` |
| Run tag, stale | `canvas` | `hairline` 2 px; diagonal `graphite` 2 px | Glyph and icon in `hairline` |
| Chain | — | `graphite` 2 px dotted, 25 % at rest | — |
| Tray | — | `hairline` 2 px; `ink` after the closeout commit | Label `graphite` |
| Terminal (O3) | `ink` | — | `canvas`; highlight row: `canvas` bar, `ink` text |

The `pass` and `fail` colors stay on the Chip only (the test indicator of the first video). The gauge, the plate, and the run tags show the gate result by shape. The token goes through or stops. The tag gets a Lucide `check` or `x` in ink.

### 3.2 Typography

Unchanged: `motion-brief-v2.md` section 3.2. Sizes for the new text:

| Text | Font | Size |
|---|---|---|
| Role chips, read-only chip, lane readout | JetBrains Mono 500 | 28 px |
| Readout plate, checker output | JetBrains Mono 500 | 32 px, line height 42 px |
| Readout plate, check rows | Inter 500 | 32 px, row height 44 px; mono sub-label 28 px |
| Terminal (O3) | JetBrains Mono 500 | 32 px, line height 41.6 px |
| Result card (O6) | JetBrains Mono 500 | 28 px, line height 30 px |
| JSON callouts (O9, O10) | JetBrains Mono 500 | 28 px, line height 34 px |
| Stamp labels, tray label | JetBrains Mono 500 | 28 px |
| GO, NO GO | Inter Tight 700 | 28 px |
| Title (O1) | Inter Tight 700 | 96 px |
| Support lines | Inter 500 | 64 px, or 44 px where the stage is full |

Rules: disable ligatures in JetBrains Mono. Keep file names, skill names, and SHAs lowercase and exact. Text at 28 px is detail. A viewer must not need it to follow the story; the voice carries it.

### 3.3 Heads, families, and role chips

A Head is the first video's Head actor. It is a paper capsule, 144 × 88 px, with a 4 px ink stroke and one 48 px glyph. The mono label `model X` is above it. The glyph and the letter show the model family. The role chip on the control lane shows the role's real skill name. The voice says the short name.

| # | Voice says | Role chip (skill name) | Checker role | Family | Glyph |
|---|---|---|---|---|---|
| 1 | strategy | `measure-strategy` | `strategy` | A | ring |
| 2 | Red | `measure-mid-red` | `mid-red` | B | triangle |
| 3 | Green | `measure-jr-green` | `jr-green` | C | rounded square |
| 4 | Review A (correctness) | `measure-review-a-correctness` | `review-a` | A | ring |
| 5 | Review B (security) | `measure-review-b-security` | `review-b` | D | pentagon |
| 6 | Review C (API and user flow) | `measure-review-c-ux-api` | `review-c` | E | three bars |
| 7 | adversarial testing | `measure-adversarial-testing` | `adversarial-testing` | A | ring |
| 8 | browser review | `measure-ux-browser-review` | `ux-browser-review` | D | pentagon |
| 9 | phase acceptance | `measure-phase-acceptance` | `phase-acceptance` | D | pentagon |
| 10 | audit | `measure-orchestrator-audit` | none (no role gate) | E | three bars |
| 11 | final acceptance | `measure-final-acceptance` | `final-acceptance` | E | three bars |
| 12 | closeout | `measure-closeout` | `closeout` | A | ring |

The table obeys every rule in `SKILL.md`, "Model Selection":

| Rule | Check |
|---|---|
| Red and Green use different families. | B ≠ C |
| An auditor uses a family other than the family it audits. | Green wrote the code (C). Red wrote the tests (B). The reviews (A, D, E) and adversarial testing (A) are outside B and C. Browser review (D), phase acceptance (D), audit (E), final acceptance (E), and closeout (A) are also outside B and C. |
| Review A and Review B differ. | A ≠ D |
| Phase acceptance differs from Red. | D ≠ B. It also differs from adversarial testing (A), so "a model that did not write the tests" stays true. |
| Final acceptance differs from Review A and from phase acceptance. | E ≠ A and E ≠ D |

O13 swaps the Red and Green families (Red → C, Green → B). All rules still hold after the swap. Red and Green do not run again after O13.

The letters for strategy (A), Red (B), and Green (C) come from plan section 4 (O5, O7, O8). The first video's S7c used Green A; this video follows the plan.

Do not use the first video's S7 role labels ("Red · model B") in this video. The role chip and the Head label replace them.

### 3.4 New World actors

All positions are screen pixels at scroll 0 and zoom 1. All new World elements use World x. They follow `scroll`, but the only scroll is in O1, before they appear.

**Control lane** (`world/ControlLane.tsx`)
- Band y 192–264. A 2 px `graphite` hairline at y 264, x 120–1800.
- Draws from left to right with `evolvePath`, 36 frames, `ease.ui`.
- Holds the glyph, the read-only chip, and the role chips. The lane readout and the O16 roll are scene text that the scene clips to this band.
- WorldState exposes `control.lane.bottomY = 264` for the test in section 6.7.

**Orchestrator glyph** (part of the control lane)
- Center (160, 232). Ring: outer diameter 56 px, 4 px `ink` stroke, no fill. Dot: 14 px `ink` disc in the center.
- Stamps in: scale 1.4 → 1, `spring.stamp`, 18 frames.
- It has no capsule, no jaws, and no stem. Never draw it inside a Head. It is not a model.

**Read-only chip** (part of the control lane)
- x 204–379, y 212–252, 20 px radius, `paper` fill, 2 px `graphite` border. Text `read-only`, mono 28 px, `graphite`.
- Slides out of the glyph to its place, 24 frames, `ease.ui`.

**Role chip** (`world/RoleChip.tsx`)
- Height 40 px (y 212–252), 20 px radius, `paper` fill, 2 px `ink` border, 16 px side padding. Text: the skill name, mono 28 px, `ink`. Width = text width + 32 px (for example `measure-strategy` 301 px, `measure-review-a-correctness` 502 px).
- `x` is the chip center. Clamp the chip to x 392–1800.
- On: the chip slides from the glyph (x 188) along the lane to `x`, 24 frames, `ease.ui`. Off: fades, 15 frames, `ease.exit`.
- The scene draws a dotted handoff line (2 px `graphite`, dash 2/6). It goes from the chip bottom (y 252) to the top of the Head label (about y 330). The line ends above y 696.
- A new `roleChip on` clears the readout plate.

**Go/no-go gauge** (`world/Gauge.tsx`)
- Frame: x 1456–1776, y 536–696 (320 × 160), 20 px radius, 6 px `ink` stroke, `paper` fill. The frame bottom is 8 px above the Blade line.
- GO channel: y 560–608, open at both ends (x 1456 to 1776). NO GO channel: y 624–672, open at the left end only; an 8 px `ink` stop block at x 1680–1688 closes it.
- Labels: Inter Tight 700, 28 px, `ink`, right-aligned at x 1440, left of the entrances. "GO" is at the GO channel center (y 584). "NO GO" is at the NO GO channel center (y 648).
- Draws in: `evolvePath` on the frame, 24 frames; labels fade in after it, 12 frames. Off: fades, 15 frames.

**Token** (drawn by the gauge)
- 64 × 36 px, 6 px radius, `paper`, 2 px `ink` border, the role's Head glyph at 16 px in the center.
- Pass: the token appears at the GO entrance (x 1392) and slides to the channel middle (x 1616). It waits while the check rows tick. Then it exits right to x 1808 (`ease.ui`, 30 frames) and fades (12 frames).
- Fail: the token enters the NO GO channel, hits the stop (`Easing.in(Easing.cubic)`, 18 frames), recoils 12 px (`spring.stamp`), waits 30 frames, and fades.

**Readout plate** (`world/ReadoutPlate.tsx`)
- Right edge x 1776, bottom edge y 520. It grows up and to the left with its content. Top limit y 276; left limit x 883.
- `paper` fill, 2 px `ink` border, 12 px radius, 12 px top and bottom padding, 24 px side padding.
- Check rows (optional, per gate): Inter 500 32 px, row height 44 px. Each row has a 28 px icon at the left. A Lucide `check` in `ink` marks a check that ran. An em dash in `graphite` marks a check that this role's gate does not use. An optional mono sub-label (28 px) follows the label.
- Output lines: JetBrains Mono 500 32 px, line height 42 px, `ink`. Types at 2 characters per frame. A long line wraps only at the `; ` separator. Never shorten or change a checker string.
- The plate shows the output of every gate since the last `roleChip on`, newest at the bottom. A `gauge` cue with `clear: true` also clears it.
- Most plates are 600–720 px wide (left edge about x 1060). Only the wrapped O10 FAIL line makes the plate reach the left limit, x 883.

**Result card** (`actors/ResultCard.tsx`, scene layer)
- The `MEASURE_AGENT_RESULT` block as text. 600 × 384 px, x 160–760, y 272–656. `paper`, 2 px `hairline` border, 16 px radius, 12 px padding.
- 12 lines, mono 28 px, line height 30 px. Field names are verbatim from `references/contracts.md`.
- It can shrink into the gate token. It ends at the GO entrance on the frame that the gate cue gives (`tokenAt`).

**Baseline stamp** (`world/Stamp.tsx`)
- Role stamp: a 40 px ring, 3 px `ink`, centered on the Commit square (y 820). It stamps in: scale 1.4 → 1, `spring.stamp`, 18 frames.
- When a new role stamp lands, the earlier role ring changes to 2 px `hairline` and stays.
- Phase stamp: two rings, 40 px and 52 px, 2 px `ink` each. It stays `ink` for the rest of the phase.
- Label: mono 28 px `ink` on a `paper` pill with a 2 px `hairline` border, at y 758–792. The left edge is at the Commit x − 12. If the pill would pass x 1800, its right edge goes to the Commit x + 12. It shows for 120 frames, then fades in 15 frames. The ring stays.
- A stamp on a Commit that already has a ring adds no ring. Only the label shows.
- Stamp rings follow the opacity of their Commit. After the O15 archive, they show at 30 %.

**Runs tray** (`world/RunsTray.tsx`)
- Floor: 2 px `hairline` line at y 1052, x 296–1800. End walls: 2 px, y 1028–1052, at x 296 and x 1800.
- Label inside the tray at x 312, baseline y 1040: `measure/runs/password_reset_20261019/`, mono 28 px, `graphite`.
- Draws in: `evolvePath`, 30 frames. After the closeout commit, the floor and walls change to `ink` (12 frames). A dotted chain then draws from (1700, 1028) to the closeout Commit (1672, 832).

**Run tag** (`world/RunTag.tsx`; a variant of the first video's Tag)
- 48 × 32 px, 6 px radius, `paper`, 2 px `hairline` border.
- Face before its gate: the role glyph (16 px, 2 px stroke) at the left and two short `hairline` Bars at the right. After its gate: the Bars change to a 16 px Lucide `check` (gate PASS) or `x` (gate FAIL). The icon shows the gate result, not the role's own report.
- Column: tags hang under the Commit of their `boundSha`, at the Commit x. Slots: tops at y 904, 940, 976, 1012. At most four tags per column. A fifth tag starts a second column 56 px to the right; a short dotted bus at y 896 joins the two columns.
- Chain: a 2 px dotted `graphite` line from the Commit bottom (y 832) to the first tag (y 904). Short 4 px links join the tags in a column. A new chain draws at 100 % (`evolvePath`, 12 frames), holds 90 frames, and settles at 25 %.
- Drop: the tag falls 24 px into its slot, `spring.drop`, 24 frames.
- Reserved (O4 only): a 2 px dashed `hairline` outline of the tag in its slot, with no glyph. It is the log path that the orchestrator gives the role at dispatch. The role's own tag later drops into this slot.
- Stale: the strokes, the glyph, and the icon change to `hairline`, and the fill changes to `canvas`. A 2 px `graphite` diagonal draws from the bottom left to the top right (12 frames). The tag stays in its slot to the last frame.
- Stale applies to audit results (reviews and acceptance), because each one judges one HEAD. Strategy, Red, and Green logs record work. They do not go stale.
- The `archive` cue does not change run tags or the tray. They stay at 100 %.
- Flip (O10): `rotateY` 0 → 180°, 18 frames, as the first video's Tag flip. The scene callout then shows the JSON.

**Archive slot** (`world/CaseSlots.tsx`, part of the Case)
- Two slots on the Case face: `tracks/` slot x 144–200, y 662–670; `archive/` slot x 216–272, y 662–670. 8 px tall, 4 px radius, `ink`. The `archive/` slot is right of the `tracks/` slot.
- The slots draw in when the `archive` cue has `slot: 'archive'` (fade in, 18 frames). They are not visible before O15, so the Case matches the first video until then.
- When the track Card is in, a 4 px `paper` edge with a 2 px `ink` outline shows above the `archive/` slot (y 658–662).

### 3.5 Scene actors

| Actor | Use | Specification |
|---|---|---|
| `Terminal` (new) | O3 `status` | x 120–1416, y 288–656, 16 px radius, `ink` fill, 40 px title strip with three hollow `canvas` dots (as the cli Frame). Text mono 32 px `canvas`, 7 visible rows, 65 columns. Soft wrap at column 65. New lines scroll the rows up. |
| `ResultCard` (new) | O6 | Section 3.4. |
| `JsonCard` (new) | O9, O10 callouts | Glass `paper` (72 %, 24 px blur), 2 px `hairline`, 16 px radius. Mono 28 px, line height 34 px. Field names verbatim. An excerpt ends with a `…` line. |
| `Card` + `Bars` (first video) | `test-strategy.md`, `reset.test.ts`, `reset.ts`, `plan.md`, `tests/*.sh`, `anti-patterns.md`, `tracks.md`, `metadata.json` | As in the first video. Real words where this brief gives them. |
| `Chip` (first video) | O7, O8, O11 test result | FAIL and PASS faces. Center (1060, 470). |
| `Head` (first video) | All roles | Stem Heads: anchor y 552, as in the first video. Stemless Heads: anchor y 494 (label about y 330–377, capsule y 390–478). |
| `Frame` (first video) | O11 browser | Variant `app`, scale 0.45 (576 × 234), top-left (840, 296), label off. |
| `Cursor` (first video) | O12 checkpoint only | The human. Never use it for an agent action. |
| Verify Card (S5) | O12 | "Verify Phase 3", three checkbox Bars, a "Yes" pill. |
| `Bracket` (first video) | O13 rule pairs | Side `right`, 2 px `ink`. |
| `Lockup` (first video) | O16 | New layout values in section 3.6. `showCase={false}`. |

### 3.6 Layout and positions

**History lane x positions.** New Commits append 56 px apart to the right of the first video's history. The first video's last Commit is the revert Commit `e7f3a90` at x 1168. The archived OAuth Commits reach x 1224. Each new Commit is a `commit` cue anchored on `reset:P3` (x 1112) with a `dx`.

| Commit | x | `dx` from `reset:P3` | When |
|---|---|---|---|
| `4c7e2b9` (re-plan) | 1280 | 168 | Before O1 (prelude) |
| `3a1f9d2` (strategy) | 1336 | 224 | O5 |
| `8b2e4c1` (Red) | 1392 | 280 | O7 |
| `5c1d8e2` (Green, code) | 1448 | 336 | O8 |
| `9a4f2c7` (Green, plan) | 1504 | 392 | O8 |
| `2d7b5e3` (Green, fix) | 1560 | 448 | O10 |
| (no Commit; second tag column of `2d7b5e3`) | 1616 | — | — |
| `f1b8d06` (closeout) | 1672 | 560 | O15 |

Commits right of the blade end (x > 1400) have no plumb line. A Commit drop there starts at y 728 and shows in full.

**Stage positions.**

| Thing | Position |
|---|---|
| Red and Green Heads | On the stem of the first `[~]` Tick. Tick 3.1 is at x 864. |
| Stemless single Heads | x 640, 864, or 988 (per scene), anchor y 494 |
| O9 and O10 review Heads | Under their chips: x 639, 1132, 1583 (the three chips fill x 392–1788) |
| Test Card `reset.test.ts` | x 200–480, y 330–530 |
| Code Card `reset.ts` | x 500–780, y 330–530 |
| Chip (test result) | Center (1060, 470) |
| Result card (O6) | x 160–760, y 272–656 |
| Plan Card (O8) | x 160–720, y 330–560 |
| JSON callout (O9) | x 160–1100, y 296–642 |
| JSON callout (O10) | x 160–830, y 296–626 (left of the readout plate) |

**O16 lockup layout** (center x 960, in the stage; the World stays below):

| Item | Position |
|---|---|
| Reading Advantage logo | 96 px tall, 258 px wide, x 831–1089, y 296–392 |
| Logo clear space | 30 px on all sides: x 801–1119, y 266–422. The control lane hairline (y 264) is outside it. |
| Separator | 2 px `hairline`, 480 px wide, y 432 |
| "Measure" wordmark | Inter Tight 700, 120 px, `ink`, centered on x 960, baseline y 540 |
| URL | `github.com/bodangren/measure`, mono 44 px, `ink`, centered, baseline y 600 |
| Origin line | "Open source · Apache-2.0", Inter 500 32 px, `graphite`, centered, baseline y 648. The text stays above y 656. |

### 3.7 Line weights

| Element | Weight |
|---|---|
| Control lane hairline | 2 px `graphite` |
| Orchestrator glyph ring | 4 px `ink` |
| Chips, plate, token, Cards | 2 px |
| Gauge frame | 6 px `ink` |
| NO GO stop block | 8 px `ink` |
| Role stamp ring | 3 px `ink`; earlier rings 2 px `hairline` |
| Phase stamp rings | 2 × 2 px `ink` |
| Chains, handoff lines, pointers | 2 px `graphite`, dotted (dash 2/6) |
| Stale diagonal | 2 px `graphite` |
| Selection outlines (O3, O15) | 2 px `ink`, 12 px radius |
| Accent | Never a line. Unchanged. |

### 3.8 Motion tokens

The tokens of `motion-brief-v2.md` section 3.6 stay. New default durations (frames at 60 fps):

| Motion | Method | Frames |
|---|---|---|
| Control lane draw | `evolvePath`, `ease.ui` | 36 |
| Glyph stamp, stamp ring | `spring.stamp`, scale 1.4 → 1 | 18 |
| Role chip slide in / out | `ease.ui` / `ease.exit` | 24 / 15 |
| Gauge draw / off | `evolvePath` / `ease.exit` | 24 / 15 |
| Token to channel middle | `ease.ui` | 18 |
| Token exit (GO) | `ease.ui`, then fade | 30 + 12 |
| Token stop (NO GO) | `Easing.in(Easing.cubic)`, then `spring.stamp` recoil 12 px | 18 + 12 |
| Plate row in | `ease.ui`, opacity and 8 px rise | 12 |
| Output typing | linear, 2 characters per frame | — |
| Run tag drop | `spring.drop`, 24 px | 24 |
| Chain draw | `evolvePath`, then settle to 25 % | 12 + 90 hold + 24 |
| Stale change | `interpolateColors`, diagonal `evolvePath` | 12 |
| Tray draw | `evolvePath` | 30 |
| Case slots in | opacity | 18 |

Rules from the first video stay: one primary motion per zone at a time; hold each new idea still for 1 s or more.

## 4. Scene-by-scene breakdown

### 4.1 Timing

The planning estimate reads each line at 150 words per minute: 0.4 s for each word, with no added pauses. Scene length = fixed non-VO time + VO length + 0.6 s tail. Three scenes have fixed non-VO time. O1 has a 1.0 s pre-roll before the VO. O10 has a 2.5 s coda after the VO. O16 has a 3.0 s lockup hold after the VO.

| # | Scene | Words | VO at 150 wpm (s) | Scene, estimate (s) | Start, estimate | Recorded VO (s) | Scene, recorded (s) | Start, recorded |
|---|---|---|---|---|---|---|---|---|
| O1 | Cold open | 22 | 8.8 | 10.4 | 0:00.0 | 7.47 | 9.1 | 0:00.0 |
| O2 | Control plane | 41 | 16.4 | 17.0 | 0:10.4 | 14.12 | 14.8 | 0:09.1 |
| O3 | Status | 38 | 15.2 | 15.8 | 0:27.4 | 15.49 | 16.1 | 0:23.9 |
| O4 | Baseline | 25 | 10.0 | 10.6 | 0:43.2 | 9.38 | 10.0 | 0:40.0 |
| O5 | Strategy | 26 | 10.4 | 11.0 | 0:53.8 | 9.00 | 9.6 | 0:50.0 |
| O6 | The gate | 34 | 13.6 | 14.2 | 1:04.8 | 12.54 | 13.2 | 0:59.6 |
| O7 | Red | 34 | 13.6 | 14.2 | 1:19.0 | 13.48 | 14.1 | 1:12.8 |
| O8 | Green | 51 | 20.4 | 21.0 | 1:33.2 | 20.88 | 21.5 | 1:26.9 |
| O9 | Three reviews | 40 | 16.0 | 16.6 | 1:54.2 | 18.68 | 19.3 | 1:48.4 |
| O10 | The loop | 31 | 12.4 | 15.5 | 2:10.8 | 9.72 | 12.9 | 2:07.7 |
| O11 | Adversarial and browser | 40 | 16.0 | 16.6 | 2:26.3 | 16.38 | 17.0 | 2:20.6 |
| O12 | Phase acceptance | 48 | 19.2 | 19.8 | 2:42.9 | 16.92 | 17.6 | 2:37.6 |
| O13 | Model independence | 32 | 12.8 | 13.4 | 3:02.7 | 10.70 | 11.3 | 2:55.2 |
| O14 | Audit | 38 | 15.2 | 15.8 | 3:16.1 | 13.74 | 14.4 | 3:06.5 |
| O15 | Final acceptance and closeout | 45 | 18.0 | 18.6 | 3:31.9 | 17.06 | 17.7 | 3:20.9 |
| O16 | Lockup | 23 | 9.2 | 12.8 | 3:50.5 | 10.40 | 14.0 | 3:38.6 |
| | **Total** | **568** | **227.2** | **243.3 (4:03.3)** | | **215.95** | **232.6 (3:52.6)** | |

The recorded takes exist in `public/voiceover-orchestrator/`. The recorded column uses the scene lengths in `src/measure-orchestrator/timeline.ts` (VO + 0.6 s, rounded up to 0.1 s). Add the O10 coda to that file: set `SCENE_VO_FIXED_SECONDS.O10 = 2.5` and `planSeconds` and `beatSeconds` of O10 to 12.9. Without the coda, the re-run reviews and their three gates have no time (section 4.3, O10).

**How to read the beat tables.**
- `t` is seconds from the start of the scene's VO line, at the 150 wpm estimate. Negative `t` is before the VO (O1 only).
- The "Anchor" column names the VO word that the beat follows. The build re-keys each beat to the recorded take. It finds the caption page in `data/captions.json` that holds the anchor word. Then it interpolates by the word position in the page. Beats without an anchor keep their offset from the beat above.
- The `at` value of a `SceneCue` is scene seconds: `at = t + SCENE_VO_START_SECONDS[scene]` (1.0 for O1, 0 for the others).
- Code font in the "World cue or scene action" column is a World cue (section 6.4). Plain text is a scene-layer action.
- The "SFX" column gives the file in `public/sfx/` and the level in dB below the VO peak. A dash means no sound.
- The "On-screen text" column gives every new string, verbatim. A dash means no new text.
- Cue fields in the tables are short forms. `...` stands for the fields in section 4.2 or in the row above. In `checks`, each row's `at` is the time of its beat row. Its `state` is `ok`, or `unused` when the row shows an em dash.

### 4.2 The example track and the history

The video continues the first video's track `password_reset_20261019`, "Add password reset". The first video reverted its Phase 3, "Hardening", in S9. This video runs Phase 3 again under the orchestrator, then closes the track.

**Prelude (before frame 0, never on screen).** `buildCues` for this composition starts with every resolved cue of the first video. It shifts them so that the last one is before frame 0. Then `worldAt(0)` returns the S10 end state: zoom 1, scroll −503 (the Case at screen x 623), Blade length 0, and History lane opacity 0. The lockup is scene layer, so it is gone. Two more prelude cues follow, also before frame 0:
1. `tickStatus {tickId: 'reset:3.4', status: 'b'}`. Task 3.4 "Add the audit report" becomes `[b]` with `deferred:phikul`.
2. `commit {tickId: 'reset:P3', dx: 168, sha: '4c7e2b9', head: null, kind: 'plan', message: 'measure(plan): defer Task 3.4 to phikul'}`. This is the re-plan commit, at x 1280. It becomes visible when the History lane returns in O1.

**State at the start of Phase 3.** Phases 1 and 2 are `[x]` with Pins. Ticks 3.1–3.3 are `[ ]`. Tick 3.4 is `[b]` (`hairline`). Pin 3 is out (the S9 revert pulled it). HEAD is `4c7e2b9`.

**Second active track.** `session_timeout_20261020` exists only in the O3 terminal and the O15 `tracks.md` Card. It has no Blade.

**New Commits.** Every new Commit anchors on the Phase 3 mark `reset:P3` (x 1112) with `dx`, 56 px apart. No new Commit has a git note, so no new Tag hangs on the history.

| x | `dx` | SHA | Message | `kind` | `head` | Scene |
|---|---|---|---|---|---|---|
| 1280 | 168 | `4c7e2b9` | `measure(plan): defer Task 3.4 to phikul` | `plan` | `null` | Prelude |
| 1336 | 224 | `3a1f9d2` | `docs(measure): refresh the Phase 3 test strategy` | `plan` | `ring` (A) | O5 |
| 1392 | 280 | `8b2e4c1` | `test(reset): add failing Phase 3 tests` | `task` | `triangle` (B) | O7 |
| 1448 | 336 | `5c1d8e2` | `feat(reset): harden reset requests and tokens` | `task` | `square` (C) | O8 |
| 1504 | 392 | `9a4f2c7` | `measure(plan): record Phase 3 SHAs` | `plan` | `square` (C) | O8 |
| 1560 | 448 | `2d7b5e3` | `fix(reset): compare tokens in constant time` | `task` | `square` (C) | O10 |
| 1672 | 560 | `f1b8d06` | `chore(measure): Archive track 'Add password reset'` | `project` | `ring` (A) | O15 |

No SHA repeats a SHA of the first video. Adversarial testing makes no commit in this run (section 10).

**Baselines.**

| Role | `role_base_sha` | Stamp |
|---|---|---|
| strategy | `4c7e2b9` | Role ring (O4) |
| (phase) | `3a1f9d2` | Phase double ring, `phase_base_sha` (O5) |
| Red | `3a1f9d2` | Label only (O7) |
| Green | `8b2e4c1` | Role ring (O8) |
| Reviews A, B, C (first round) | `9a4f2c7` | Role ring (O9) |
| Green (fix) | `9a4f2c7` | Label only (O10) |
| Reviews A, B, C (second round), adversarial testing, browser review, audit, final acceptance, closeout | `2d7b5e3` | Role ring (O10), then labels only |
| Phase acceptance | `2d7b5e3` | Label only, `audited_head_sha` (O12) |

**Run tags.** One tag for each run record in `measure/runs/password_reset_20261019/`. For an audit role, the tag stands for the result JSON. The role also writes a `.log` beside it, which the tag does not draw (section 10).

| Column x | Slot | `id` | File | Role | Glyph | Dropped | Gate |
|---|---|---|---|---|---|---|---|
| 1280 | 1 | `t-strategy` | `strategy-4c7e2b9.log` | strategy | `ring` | O4 reserved, O5 drop | O6 PASS |
| 1336 | 1 | `t-red` | `mid-red-3a1f9d2.log` | mid-red | `triangle` | O7 | O7 PASS |
| 1392 | 1 | `t-green` | `jr-green-8b2e4c1.log` | jr-green | `square` | O8 | O8 PASS |
| 1504 | 1 | `t-review-a-1` | `review-a-correctness-9a4f2c7.json` | review-a | `ring` | O9 | O10 PASS, then stale |
| 1504 | 2 | `t-review-b-1` | `review-b-security-9a4f2c7.json` | review-b | `pentagon` | O9 | O10 FAIL, then stale |
| 1504 | 3 | `t-review-c-1` | `review-c-ux-api-9a4f2c7.json` | review-c | `bars` | O9 | O10 PASS, then stale |
| 1504 | 4 | `t-green-fix` | `jr-green-9a4f2c7.log` | jr-green | `square` | O10 | O10 PASS |
| 1560 | 1 | `t-review-a-2` | `review-a-correctness-2d7b5e3.json` | review-a | `ring` | O10 | O10 PASS |
| 1560 | 2 | `t-review-b-2` | `review-b-security-2d7b5e3.json` | review-b | `pentagon` | O10 | O10 PASS |
| 1560 | 3 | `t-review-c-2` | `review-c-ux-api-2d7b5e3.json` | review-c | `bars` | O10 | O10 PASS |
| 1560 | 4 | `t-adversarial` | `adversarial-testing-2d7b5e3.json` | adversarial-testing | `ring` | O11 | O11 PASS |
| 1616 (bus) | 1 | `t-ux` | `ux-browser-review-2d7b5e3.json` | ux-browser-review | `pentagon` | O11 | O11 PASS |
| 1616 (bus) | 2 | `t-phase-acceptance` | `phase-acceptance-2d7b5e3.json` | phase-acceptance | `pentagon` | O12 | O12 PASS |
| 1616 (bus) | 3 | `t-final-acceptance` | `final-acceptance-2d7b5e3.json` | final-acceptance | `bars` | O15 | O15 PASS |
| 1616 (bus) | 4 | `t-closeout` | `closeout-2d7b5e3.json` | closeout | `ring` | O15 | O15 PASS |

File names use `<role>-<short-head>`, where `<role>` is the skill name without the `measure-` prefix. The file name is data in the cue. The screen does not show it, except for `strategy-4c7e2b9.log` in O4. The audit role in O14 adds no tag (section 10).

### 4.3 Beat tables

#### O1. Cold open (estimate 10.4 s)

On screen: the first video's last World state, without the lockup. The Case moves back to its place, the history returns, and the control lane draws above the stage.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| −1.0 | (pre-roll) | Frame 0 is the S10 end state. `scroll {toX: 0, durationFrames: 60, easing: 'camera'}`: the Case moves from x 623 to x 120. The jingle starts at video time 0. | — | — |
| 1.6 | "tape" | `caseClick` | lock-click −10 | — |
| 2.4 | "spec" | A `spec.md` Card slides out of the Case tab to x 360–640, y 330–530 (`ease.ui`, 24 f). | — | `spec.md` |
| 3.2 | "plan" | A `plan.md` Card slides out to x 680–960. | — | `plan.md` |
| 4.0 | "one task" | `historyOpacity {to: 1, durationFrames: 36}`. The first video's Commits return, one for each task, and `4c7e2b9` with them. | — | — |
| 5.2 | "a time" | Both Cards go back into the Case (`ease.exit`, stagger 3 f). | — | — |
| 6.4 | "who" | `controlLane {part: 'lane', on: true, durationFrames: 36}`. The hairline draws from x 120 to x 1800 at y 264. | line-draw −16 | — |
| 7.6 | "The" | The title rises 16 px into the stage center (`ease.ui`, 24 f). Inter Tight 700, 96 px, two lines, baselines y 430 and y 540. | — | "Measure Orchestrator:" / "how a track runs" |
| 8.4 | "orchestrator" | `controlLane {part: 'glyph', on: true}`. The glyph stamps in at (160, 232). | commit-stamp −12 | — |
| 8.8–9.4 | (tail) | Hold. | — | — |

Transition out: the title leaves at O2 t 0.0. The World does not change at the cut.

VO (from 1.0 s): "You have seen the tape: a spec, a plan, and one task at a time. Now, who runs it? The Measure orchestrator."

#### O2. Control plane (estimate 17.0 s)

On screen: the orchestrator glyph reads the Case and gives steps to roles in the stage. It never writes. Plan section 4 says that it "points at the roles below the blade". This brief puts the roles in the stage, below the control lane and above the Blade (section 10).

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "The orchestrator" | The title leaves (`ease.exit`, 15 f). | — | — |
| 1.6 | "control plane" | Support line, Inter 500 64 px, centered, baseline y 490. | — | "Control plane, not a coder." |
| 2.8 | "coder" | `controlLane {part: 'readOnly', on: true}`. The chip slides out of the glyph. | tick −18 | `read-only` |
| 3.6 | "It" | The support line leaves. | — | — |
| 4.0 | "reads" | `caseClick`. Five Cards at 0.8 scale (224 × 160) fan out of the Case tab, stagger 4 f. They stop at y 330–490, at x 200, 448, 696, 944, and 1192. A dotted pointer draws from the glyph (160, 260) to the Case tab (176, 636). | lock-click −10 | `index.md`, `tracks.md`, `anti-patterns.md`, `spec.md`, `plan.md` |
| 5.6 | "picks" | A 2 px `ink` outline draws around the `tracks.md` Card. | — | — |
| 6.8 | "phase" | The Cards go back into the Case in reverse order (`ease.exit`, stagger 3 f). The pointer undraws. | — | — |
| 8.0 | "each step" | `roleChip {role: 'strategy', on: true, x: 640}`. Head A drops at x 640 (stemless). The handoff line draws from the chip to the Head label. | tick −18, head-clip −12 | `measure-strategy`, `model A` |
| 10.4 | "one role" | `roleChip {role: 'strategy', on: false}`, `roleChip {role: 'mid-red', on: true, x: 640}`. The Head changes from A to B (the first video's swap: out `Easing.in(Easing.cubic)` 24 f, in `spring.drop`). | head-clip −12 | `measure-mid-red`, `model B` |
| 11.2 | "at a time" | `roleChip {role: 'mid-red', on: false}`, `roleChip {role: 'jr-green', on: true, x: 640}`. Head B changes to Head C. | head-clip −12 | `measure-jr-green`, `model C` |
| 12.4 | "It writes" | `roleChip {role: 'jr-green', on: false}`. Head C lifts out (`ease.exit`). | — | — |
| 13.6 | "code" | A `reset.ts` Card appears at x 500–780, y 330–530, with empty `hairline` Bars. | — | `reset.ts` |
| 14.4 | "tests" | A `reset.test.ts` Card appears at x 200–480. | — | `reset.test.ts` |
| 15.6 | "plans" | A `plan.md` Card appears at x 800–1080. | — | `plan.md` |
| 16.0 | "itself" | A 2 px `ink` outline draws around the read-only chip (`evolvePath`, 18 f). The three Cards keep empty Bars: the orchestrator writes none of them. | — | — |
| 16.4–17.0 | (tail) | The three Cards leave (`ease.exit`, stagger 3 f). | — | — |

The O2 role chips are a preview of the role order. They make no stamp, tag, or gate.

VO: "The orchestrator is a control plane, not a coder. It reads the measure folder, picks the next phase, and hands each step to one focused subagent, one role at a time. It writes no code, no tests, and no plans itself."

#### O3. Status (estimate 15.8 s)

On screen: a terminal runs `status`. The open phases list. The reset Blade pulls out, and Phase 3 is next. The `[b]` task stays grey and does not count.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "First" | The read-only outline fades. The lane readout types (2 characters per frame). | — | `measure_interphase_checks.py status` |
| 0.8 | "runs status" | The Terminal opens at x 120–1416, y 288–656 (scale 0.96 → 1 and fade, `ease.ui`, 18 f). The command types and wraps to 2 rows. | — | `$ python3 ~/.agents/skills/measure-orchestrator/scripts/measure_interphase_checks.py status --repo .` |
| 1.6 | "The checker" | The output prints, one line every 4 frames. The rows scroll up; 7 rows show. | — | The 8 output lines below |
| 4.0 | "lists" | `bladePull {toLength: 1104, durationFrames: 54, easing: 'blade'}`. The reset Blade pulls out: Phases 1 and 2 `[x]` with Pins, Ticks 3.1–3.3 `[ ]`, Tick 3.4 `hairline`. | tape-pull −8 | — |
| 7.2 | "first open phase" | The `[1]` row gets the highlight bar (12 f). A 2 px `ink` selection outline draws around Phase 3 on the Blade: x 800–1128, y 690–762 (`evolvePath`, 24 f). | — | — |
| 8.8 | "next" | The `next_phase:` row gets the highlight bar. | — | — |
| 9.2 | "A task" | The other rows fade (12 f). The Terminal shrinks to the `[1]` row only: x 120–1416, y 288–352 (`ease.ui`, 24 f). | — | — |
| 10.8 | "blocked" | A plan-line callout appears: `paper` Card, x 160–1250, y 420–480, mono 32. A dotted leader draws to Tick 3.4 (1032, 696). | — | `- [b] Task 3.4: Add the audit report — deferred:phikul` |
| 12.4 | "does not count" | A 2 px `ink` underline draws under `(3/3 remaining)` in the `[1]` row. | — | — |
| 13.6 | "Markers decide" | 2 px `ink` outlines draw around `[b]` and `deferred:phikul`. The task title changes to `graphite`. | — | — |
| 15.2–15.8 | (tail) | Hold. | — | — |

Terminal output, verbatim (format of `cmd_status()`; values are example data):

```text
repo: /home/dev/app
head: 4c7e2b9d1a8f3e6c5b0a9d2e7f1c4b8a3e6d9f20
worktree: clean
incomplete_phases: 2
[1] password_reset_20261019 -- Phase 3: Hardening (3/3 remaining)
[2] session_timeout_20261020 -- Phase 1: Contract (2/2 remaining)
next_phase: password_reset_20261019 -- Phase 3: Hardening
closeout_candidates: 0
```

The two `[n]` rows are exactly 65 characters, the Terminal width. Phase 3 has 3 tasks in the count, because the checker regex `^- \[([ ~x])\] (.+)` does not match a `[b]` line.

Transition out: the Terminal, the callout, and the Phase 3 outline leave at O4 t 0.0 (`ease.exit`, 15 f).

VO: "First, it runs status. The checker reads every plan and lists the phases that are still open. The first open phase is next. A task that is blocked, with an owner, does not count. Markers decide, not prose."

#### O4. Baseline (estimate 10.6 s)

On screen: before the strategy role starts, the orchestrator stamps HEAD. The tray draws, and a reserved slot chains to the stamped Commit. A small legend shows what "stale" will look like.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "Before every role" | O3 content leaves. `roleChip {role: 'strategy', on: true, x: 640}`. | tick −18 | `measure-strategy` |
| 0.8 | "role" | The lane readout types. | — | `git rev-parse HEAD` |
| 1.6 | "records" | `baselineStamp {sha: '4c7e2b9', label: 'role_base_sha'}` | commit-stamp −18 | `role_base_sha` |
| 4.0 | "Each result" | `tray {action: 'show'}` (30 f). | line-draw −16 | `measure/runs/password_reset_20261019/` |
| 5.2 | "bound" | `runTag {state: 'reserved', id: 't-strategy', role: 'strategy', file: 'strategy-4c7e2b9.log', boundSha: '4c7e2b9', glyph: 'ring', retry: null}`. The chain draws from `4c7e2b9` to slot 1. The file name shows right of the slot: mono 28 `graphite`, x 1316, baseline 928, until O5 t 7.6. | — | `strategy-4c7e2b9.log` |
| 6.8 | "If the code" | A legend Card appears at x 1000–1400, y 400–600: one Commit square with a run tag under it, at 2× scale. | — | — |
| 8.0 | "moves" | In the legend, a second Commit square drops right of the first. | — | — |
| 9.6 | "stale" | In the legend, the tag changes to the stale state: `hairline` and the diagonal (12 f). The label appears under it, Inter 32. | tick −18 | "stale" |
| 10.0–10.6 | (tail) | Hold. | — | — |

The legend is scene layer. It shows the stale state before O10 uses it. It never changes the World.

VO: "Before every role, it records the commit it starts from. Each result is bound to that revision. If the code moves, the result is stale."

#### O5. Strategy (estimate 11.0 s)

On screen: Head A writes `test-strategy.md`, which goes into the Case. One Commit lands. The strategy log drops into its slot. The phase baseline stamp lands on the new Commit.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "Role one" | The legend leaves. The lane readout clears. | — | — |
| 0.8 | "strategy" | Head A drops at x 640 (stemless). The handoff line draws. | head-clip −12 | `model A` |
| 1.6 | "writes" | A `test-strategy.md` Card appears at x 760–1280, y 330–610. Its Bars type on. | — | `test-strategy.md` |
| 4.8 | "names" | Four rows type into the Card (Inter 32, stagger 0.4 s). Each row has a Lucide `check` in `ink`. | tick −20 for each row | "security review", "UX/API review", "adversarial testing", "browser review" |
| 6.4 | "apply" | The Card moves into the Case tab (`Easing.in(Easing.cubic)`, 24 f). `caseClick` at 6.8. | lock-click −10 | — |
| 7.2 | "orchestrator" | `commit {tickId: 'reset:P3', dx: 224, sha: '3a1f9d2', head: 'ring', kind: 'plan', message: 'docs(measure): refresh the Phase 3 test strategy'}` | commit-stamp −10 | `3a1f9d2` |
| 7.6 | "takes" | `runTag {state: 'complete', id: 't-strategy', role: 'strategy', file: 'strategy-4c7e2b9.log', boundSha: '4c7e2b9', glyph: 'ring', retry: null}`. The tag drops into the reserved slot. The file name fades. Head A lifts out. | tag-flutter −16 | — |
| 8.8 | "baseline" | `baselineStamp {sha: '3a1f9d2', label: 'phase_base_sha'}` (double ring). | commit-stamp −18 | `phase_base_sha` |
| 10.4–11.0 | (tail) | Hold. | — | — |

The four row labels are the four applicability items of `agents/measure-strategy.md`. In this run, all four apply.

VO: "Role one: strategy. It writes a test strategy for the track and names the reviews that apply. The orchestrator takes the phase baseline after that commit."

#### O6. The gate (estimate 14.2 s)

On screen: the gauge draws at the Blade end. The strategy role's own report appears and shrinks into the token. The plate lists what this gate checks, and the gate prints PASS. The verdict goes onto the run tag.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "After every role" | `gauge {on: true}`. The frame draws (24 f), then the labels fade in (12 f). | line-draw −16 | "GO", "NO GO" |
| 1.6 | "orchestrator runs" | The lane readout types. | — | `role-gate --role measure-strategy` |
| 3.6 | "A role's own report" | The ResultCard slides in to x 160–760, y 272–656 (`ease.ui`, 24 f). | — | The 12 block lines below |
| 4.8 | "report" | A 2 px `graphite` outline draws around the `status: complete` line. | — | — |
| 6.0 | "evidence" | The ResultCard shrinks into the token and moves to the GO entrance (1392, 584) (`Easing.in(Easing.cubic)`, 30 f). | — | — |
| 6.5 | — | `gate {role: 'strategy', result: 'pass', glyph: 'ring', runTagId: 't-strategy', output: ['PASS: strategy gate passed'], checks: [...], outputAt: 5.5}`. The token slides to the channel middle (18 f) and waits. | — | — |
| 8.0 | "result block" | Check row 1, with a `check`. | tick −20 | "result block" |
| 8.6 | — | Check row 2, with a `check`. | tick −20 | `test-strategy.md` |
| 9.2 | "plan" | Check row 3 starts, with an em dash in `graphite`. The words add one at a time: "plan" (9.2), "· git" (9.6), "· test command" (10.8). | — | "plan · git · test command" |
| 11.4 | — | A footnote line, Inter 28 `graphite`. | — | "checks differ per role" |
| 12.0 | "prints" | The output line types. | — | `PASS: strategy gate passed` |
| 12.4 | "pass" | The token goes out through GO. A `check` appears on `t-strategy`. | gauge-pass −10 | — |
| 13.2 | "fail" | Hold. The NO GO channel stays empty. | — | — |
| 13.6–14.2 | (tail) | Hold. | — | — |

ResultCard text (field names from `references/contracts.md`; values are example data):

```text
MEASURE_AGENT_RESULT
role: measure-strategy
status: complete
track: password_reset_20261019
phase: Phase 3: Hardening
commits: 3a1f9d2
tests_run: none
files_changed: test-strategy.md
plan_updates: none
known_failures: none
handoff: Red covers Tasks 3.1–3.3
END_MEASURE_AGENT_RESULT
```

The VO lists four inputs: the result block, the plan, git, and the test command. The strategy gate reads the result block and checks for `test-strategy.md` only. Row 3 shows the other three inputs with a dash, and the footnote says why. This keeps the plate true to `cmd_role_gate()`.

VO: "After every role, the orchestrator runs the mechanical gate. A role's own report is not evidence. The gate reads the result block, the plan, git, and the test command, and prints pass or fail."

#### O7. Red (estimate 14.2 s)

On screen: Head B takes Tick 3.1. Red writes failing tests, marks the open tasks `[~]`, and commits. The gate checks that the tests fail and that only test and Measure files changed.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "Role two" | `roleChip {role: 'strategy', on: false}`, `roleChip {role: 'mid-red', on: true, x: 864}`. The plate clears. | tick −18 | `measure-mid-red` |
| 0.4 | — | `baselineStamp {sha: '3a1f9d2', label: 'role_base_sha'}` (ring exists; label only). | — | `role_base_sha` |
| 0.8 | "Red" | `headSwap {glyph: 'triangle'}`. Head B drops over Tick 3.1 at anchor y 494. | head-clip −10 | `model B` |
| 2.8 | "writes" | A `reset.test.ts` Card appears at x 200–480, y 330–530. Its Bars type on. | — | `reset.test.ts` |
| 3.6 | "failing tests" | The Chip shows FAIL at (1060, 470). The test Card shakes once. | fail-thud −12 | "FAIL" |
| 5.6 | "marks the task" | `tickStatus` → `~` for `reset:3.1`, `reset:3.2`, `reset:3.3` (5.6, 5.67, 5.73). Head B moves down onto the stem of Tick 3.1 (anchor y 552, `spring.drop`, 18 f). | tick −20 | — |
| 8.0 | "commits" | The test Card shrinks to the Commit. The Chip leaves. `commit {tickId: 'reset:P3', dx: 280, sha: '8b2e4c1', head: 'triangle', kind: 'task', message: 'test(reset): add failing Phase 3 tests'}` | commit-stamp −10 | `8b2e4c1` |
| 8.2 | — | `runTag {state: 'complete', id: 't-red', role: 'mid-red', file: 'mid-red-3a1f9d2.log', boundSha: '3a1f9d2', glyph: 'triangle', retry: null}` | tag-flutter −16 | — |
| 8.4 | "The gate" | The lane readout types. `gate {role: 'mid-red', result: 'pass', glyph: 'triangle', runTagId: 't-red', output: ['PASS: mid-red gate passed'], checks: [...], outputAt: 4.8}` at 8.4. | — | `role-gate --role measure-mid-red` |
| 10.8 | "fail" | Check row 1. | tick −20 | "tests fail" `RED_TEST_COMMAND` |
| 12.8 | "files" | Check row 2. | tick −20 | "only test and Measure files changed" |
| 13.2 | "changed" | The output types. The token goes out through GO. A `check` appears on `t-red`. | gauge-pass −10 | `PASS: mid-red gate passed` |
| 13.6–14.2 | (tail) | Hold. Head B stays on the stem. | — | — |

The VO says "marks the task". `agents/measure-mid-red.md` marks every open task of the phase, so three Ticks go `[~]` (section 10). Each `[~]` Tick shows its Marker. Only Tick 3.1 has the stem.

VO: "Role two: Red. A different model family writes the failing tests for the phase, marks the task in progress, and commits. The gate checks that the tests fail, and that only test files changed."

#### O8. Green (estimate 21.0 s)

On screen: Head C replaces Head B on the same stem. The tests pass, and the code commits. Then the plan records the SHA in a second Commit. The gate checks three things and prints PASS.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "Role three" | `roleChip {role: 'mid-red', on: false}`, `roleChip {role: 'jr-green', on: true, x: 864}`. | tick −18 | `measure-jr-green` |
| 0.4 | — | `baselineStamp {sha: '8b2e4c1', label: 'role_base_sha'}` | commit-stamp −18 | `role_base_sha` |
| 0.8 | "Green" | `headSwap {glyph: 'square'}`. Head B leaves; Head C lands on the same stem. | head-clip −10 | `model C` |
| 2.8 | "makes the tests pass" | The `reset.test.ts` Card (x 200–480) and the `reset.ts` Card (x 500–780) appear. The code Bars type on. The Chip shows FAIL at (1060, 470). | — | `reset.test.ts`, `reset.ts`, "FAIL" |
| 4.0 | "pass" | The Chip flips to PASS. | pass-notes −12 | "PASS" |
| 4.8 | "commits the code" | The two Cards merge into the Commit. The Chip leaves. `commit {tickId: 'reset:P3', dx: 336, sha: '5c1d8e2', head: 'square', kind: 'task', message: 'feat(reset): harden reset requests and tokens'}` | commit-stamp −10 | `5c1d8e2` |
| 6.0 | "Then it writes" | A Plan Card appears at x 160–760, y 330–560, with four lines (below). | — | `plan.md`, `## Phase 3: Hardening`, three task lines |
| 7.6 | "commit hash" | `` `5c1d8e2` `` types at the end of each task line (stagger 6 f). `[~]` changes to `[x]` in each line. | — | `` `5c1d8e2` `` |
| 8.4 | "into the plan" | `tickStatus` → `x` for `reset:3.1`, `reset:3.2`, `reset:3.3` (8.4, 8.5, 8.6). No `[~]` Tick is left, so Head C lifts out. | tick −16 for each Tick | — |
| 10.0 | "in a second" | The Plan Card moves into the Case tab. `caseClick` at 10.2. | lock-click −10 | — |
| 10.4 | "second commit" | `commit {tickId: 'reset:P3', dx: 392, sha: '9a4f2c7', head: 'square', kind: 'plan', message: 'measure(plan): record Phase 3 SHAs'}` | commit-stamp −10 | `9a4f2c7` |
| 11.2 | "because" | A dotted `ink` arc draws from Commit `9a4f2c7` back to Commit `5c1d8e2`, above them (peak y 770), with an arrowhead at `5c1d8e2` (`evolvePath`, 24 f). | — | — |
| 14.0 | "own hash" | The arc fades. | — | — |
| 14.2 | — | `runTag {state: 'complete', id: 't-green', role: 'jr-green', file: 'jr-green-8b2e4c1.log', boundSha: '8b2e4c1', glyph: 'square', retry: null}` | tag-flutter −16 | — |
| 14.4 | "The gate checks" | The lane readout types. `gate {role: 'jr-green', result: 'pass', glyph: 'square', runTagId: 't-green', output: ['PASS: jr-green gate passed'], checks: [...], outputAt: 5.8}` at 14.4. | — | `role-gate --role measure-jr-green` |
| 16.4 | "done" | Check row 1. | tick −20 | "every task done" |
| 18.4 | "hash" | Check row 2. | tick −20 | "every task with a hash" |
| 20.0 | "green" | Check row 3. | tick −20 | "tests green" `GREEN_TEST_COMMAND` |
| 20.2 | — | The output types. The token goes out through GO. A `check` appears on `t-green`. | gauge-pass −10 | `PASS: jr-green gate passed` |
| 20.4–21.0 | (tail) | Hold. | — | — |

Plan Card lines (mono 28; each task title is a Bar, by the first video's Markdown rule):

```text
## Phase 3: Hardening
- [~] Task 3.1: ▬▬▬▬
- [~] Task 3.2: ▬▬▬▬
- [~] Task 3.3: ▬▬▬
```

After t 7.6, each line reads `- [x] Task 3.n: ▬▬▬▬ `5c1d8e2``. One implementation Commit closes all three tasks, so all three lines carry the same SHA. The `[b]` line of Task 3.4 is not on this Card. The `jr-green` gate does not count it.

VO: "Role three: Green, on another family. It makes the tests pass and commits the code. Then it writes the commit hash into the plan, in a second commit, because a commit cannot contain its own hash. The gate checks: every task done, every task with a hash, and the tests green."

#### O9. Three reviews (estimate 16.6 s)

On screen: three role chips and three Heads of three families work on the same Commit. Each review drops one JSON run tag into the tray. One JSON shows its fields. The code stays locked.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "Then three reviews" | `roleChip {role: 'jr-green', on: false}`. `roleChip` on for `review-a` (x 644), `review-b` (x 1133), `review-c` (x 1580), stagger 6 f. The lane readout stays off while the three chips show. | tick −18 for each chip | `measure-review-a-correctness`, `measure-review-b-security`, `measure-review-c-ux-api` |
| 0.4 | "three" | Heads A, D, and E drop under their chips (stemless, anchor y 494), stagger 6 f. Three handoff lines draw. | head-clip −12 for each Head | `model A`, `model D`, `model E` |
| 3.2 | "same commit" | `baselineStamp {sha: '9a4f2c7', label: 'role_base_sha'}`. The SHA types under each Head capsule, mono 28 `graphite`, baseline y 520. | commit-stamp −18 | `role_base_sha`, `9a4f2c7` (three times) |
| 4.0 | "correctness" | A 2 px `ink` underline draws under the Review A chip. | — | — |
| 4.4 | "security" | The same under the Review B chip. | — | — |
| 5.6 | "API" | The same under the Review C chip. | — | — |
| 7.2 | "Each review" | The underlines fade. A `reset.ts` Card appears at x 160–400, y 330–530. | — | `reset.ts` |
| 8.4 | "report-only" | A 28 px Lucide `lock` in `ink` appears at the top right of the `reset.ts` Card. | — | — |
| 10.0 | "JSON" | Three `runTag {state: 'complete', ...}` cues: `t-review-a-1`, `t-review-b-1`, `t-review-c-1` (files in section 4.2, `boundSha: '9a4f2c7'`, `retry: null` until the JSON shows), stagger 6 f. The chain draws from `9a4f2c7`. | tag-flutter −16 for each tag | — |
| 11.2 | "runs folder" | The Heads lift out (`ease.exit`, stagger 4 f). The `reset.ts` Card leaves. A 2 px `ink` underline draws under the tray label (scene layer, 18 f) and fades after 1.2 s. | — | — |
| 12.0 | "with findings" | A JSON callout grows out of `t-review-a-1` to x 160–1100, y 296–626 (`ease.ui`, 24 f). | — | The JSON lines below |
| 12.8 | "findings" | A 2 px `graphite` outline draws around the `"nonblocking_findings"` line. | — | — |
| 14.0 | "retry recommendation" | The same around the `"retry_recommendation"` line. | — | — |
| 15.2 | "fixes nothing" | The callout folds back into `t-review-a-1` (`ease.exit`, 18 f). | — | — |
| 16.0–16.6 | (tail) | Hold. The three chips stay on. | — | — |

JSON callout (field names from `references/contracts.md`; values are example data; `…` marks the fields that the excerpt leaves out):

```text
{
  "schema_version": 1,
  "status": "pass",
  "blocking_findings": [],
  "nonblocking_findings": ["no request id in logs"],
  …
  "retry_recommendation": "none",
  "confidence": "high"
}
```

The three run tags have no `check` or `x` yet. Their gates run in O10.

VO: "Then three reviews run in parallel on the same commit: correctness, security, and the API and user-flow contracts. Each review is report-only. It writes one JSON result into the runs folder, with findings and a retry recommendation. It fixes nothing."

#### O10. The loop (estimate 15.5 s, with a 2.5 s coda)

On screen: the three review gates run. Review B fails. Its tag flips and shows the blocking finding and `retry_implementation`. The evidence goes to Green, which commits a fix. The three old review tags go stale and stay. The reviews run again on the new HEAD, and the coda shows their three gates pass.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "A blocking finding" | `gate {role: 'review-a', result: 'pass', glyph: 'ring', runTagId: 't-review-a-1', output: ['PASS: review-a gate passed'], outputAt: 0.3}` | gauge-pass −10 | `PASS: review-a gate passed` |
| 0.4 | "blocking" | `gate {role: 'review-b', result: 'fail', glyph: 'pentagon', runTagId: 't-review-b-1', output: ["FAIL: audit status must be pass, got 'fail'; token compare not constant-time"], outputAt: 0.3}`. The token stops at the NO GO stop and recoils. An `x` appears on `t-review-b-1`. | gauge-fail −8 | `FAIL: audit status must be pass, got 'fail';` / `token compare not constant-time` (one line, wrapped after `; `) |
| 1.2 | "goes" | `gate {role: 'review-c', result: 'pass', glyph: 'bars', runTagId: 't-review-c-1', output: ['PASS: review-c gate passed'], outputAt: 0.2}` | gauge-pass −10 | `PASS: review-c gate passed` |
| 1.6 | "back" | `tagFlip {runTagId: 't-review-b-1'}` (`rotateY`, 18 f). | tag-flip −14 | — |
| 2.0 | "to Green" | A JSON callout grows out of the flipped tag to x 160–830, y 296–626. | — | The JSON lines below |
| 2.8 | "exact" | A 2 px `ink` outline draws around the `blocking_findings` value. | — | — |
| 3.6 | "evidence" | A 2 px `ink` outline draws around `"retry_implementation"`. The review chips go off. `roleChip {role: 'jr-green', on: true, x: 1060}`. The plate clears. | tick −18 | `measure-jr-green` |
| 3.8 | — | `baselineStamp {sha: '9a4f2c7', label: 'role_base_sha'}` (ring exists; label only). | — | `role_base_sha` |
| 4.0 | "Green" | The callout shrinks into a small evidence Card (96 × 64, Bars and an `x`). The Card moves to Head C, which drops at x 1060 (stemless). The tag flips back (18 f). | head-clip −12, tag-flip −14 | `model C` |
| 4.8 | "commits a fix" | `commit {tickId: 'reset:P3', dx: 448, sha: '2d7b5e3', head: 'square', kind: 'task', message: 'fix(reset): compare tokens in constant time'}` | commit-stamp −10 | `2d7b5e3` |
| 5.2 | — | `runTag {state: 'complete', id: 't-green-fix', role: 'jr-green', file: 'jr-green-9a4f2c7.log', boundSha: '9a4f2c7', glyph: 'square', retry: null}`. Head C lifts out. | tag-flutter −16 | — |
| 5.4 | — | The lane readout types. `gate {role: 'jr-green', result: 'pass', glyph: 'square', runTagId: 't-green-fix', output: ['PASS: jr-green gate passed'], outputAt: 0.2}` | gauge-pass −10 | `role-gate --role measure-jr-green`, `PASS: jr-green gate passed` |
| 8.4 | "stale" | `runTag {state: 'stale', ids: ['t-review-a-1', 't-review-b-1', 't-review-c-1']}`. The three diagonals draw, stagger 4 f. The tags stay in their slots. | tick −18 for each tag | — |
| 8.8 | "so the reviews" | `roleChip {role: 'jr-green', on: false}`. The three review chips go on again at x 644, 1133, 1580. The lane readout clears. | tick −18 for each chip | (the three review skill names) |
| 9.2 | "reviews" | `baselineStamp {sha: '2d7b5e3', label: 'role_base_sha'}`. The ring on `9a4f2c7` changes to `hairline`. | commit-stamp −18 | `role_base_sha` |
| 9.6 | "run again" | Heads A, D, and E drop under their chips, stagger 4 f. | head-clip −12 | `model A`, `model D`, `model E` |
| 10.8 | "new head" | Three `runTag {state: 'complete', ...}` cues: `t-review-a-2`, `t-review-b-2`, `t-review-c-2` (`boundSha: '2d7b5e3'`), stagger 6 f, in column 1560. | tag-flutter −16 for each tag | — |
| 11.6 | — | The Heads lift out, stagger 4 f. | — | — |
| 12.4 | (coda) | `gate {role: 'review-a', result: 'pass', runTagId: 't-review-a-2', ...}`. The plate is empty since t 8.8. | gauge-pass −10 | `PASS: review-a gate passed` |
| 13.0 | (coda) | `gate {role: 'review-b', result: 'pass', runTagId: 't-review-b-2', ...}` | gauge-pass −10 | `PASS: review-b gate passed` |
| 13.6 | (coda) | `gate {role: 'review-c', result: 'pass', runTagId: 't-review-c-2', ...}` | gauge-pass −10 | `PASS: review-c gate passed` |
| 14.1–15.5 | (coda, tail) | Hold. The plate shows the three PASS lines. | — | — |

JSON callout (field names verbatim; the arrays wrap so that the callout stays left of the plate):

```text
{
  "status": "fail",
  "blocking_findings": [
    "token compare not constant-time"
  ],
  "retry_recommendation":
    "retry_implementation",
  "confidence": "high"
}
```

The FAIL line is the real format of `passing_audit_feedback()`: `audit status must be pass, got {status!r}; {blocking findings joined by "; "}`, after the `FAIL: ` prefix of `cmd_role_gate()`. The `x` on `t-review-b-1` is the gate verdict. The JSON `status` agrees with it, but the tag shows the gate.

Green's fix log (`t-green-fix`) and the strategy, Red, and Green logs do not go stale. Stale marks only the audit results bound to `9a4f2c7`.

VO: "A blocking finding goes back to Green with the exact evidence. Green commits a fix. That new commit makes every review stale, so the reviews run again on the new head."

#### O11. Adversarial and browser (estimate 16.6 s)

On screen: Head A attacks the tests with three kinds of input. The tests still pass. The code stays locked. Then Head D checks the running app in a browser Frame. Screenshots become the evidence in its run tag.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "Next" | The review chips go off. `roleChip {role: 'adversarial-testing', on: true, x: 640}`. | tick −18 | `measure-adversarial-testing` |
| 0.4 | "adversarial" | `baselineStamp {sha: '2d7b5e3', label: 'role_base_sha'}` (label only). Head A drops at x 640 (stemless). | head-clip −12 | `role_base_sha`, `model A` |
| 0.8 | "testing" | A `reset.test.ts` Card appears at x 160–440, y 330–530. | — | `reset.test.ts` |
| 3.6 | "boundary" | A pill flies from the Head into the test Card and becomes a new Bar (`ease.ui`, 18 f). | tick −20 | "boundary" |
| 4.0 | "failure-path" | The second pill, the same motion. | tick −20 | "failure-path" |
| 4.8 | "regression" | The third pill, the same motion. | tick −20 | "regression" |
| 5.2 | "tests" | The Chip shows PASS at (1060, 470). | pass-notes −12 | "PASS" |
| 6.0 | "may commit tests" | The three new Bars change from `graphite` to `ink`. | — | — |
| 7.2 | "never fixes" | The Chip leaves. A `reset.ts` Card appears at x 860–1140, y 330–530. At 8.0, a Lucide `lock` appears at its top right. | — | `reset.ts` |
| 8.4 | "code" | Head A lifts out. Both Cards leave (15 f). `runTag {state: 'complete', id: 't-adversarial', role: 'adversarial-testing', file: 'adversarial-testing-2d7b5e3.json', boundSha: '2d7b5e3', glyph: 'ring', retry: 'none'}` | tag-flutter −16 | — |
| 8.6 | — | The lane readout types. `gate {role: 'adversarial-testing', result: 'pass', glyph: 'ring', runTagId: 't-adversarial', output: ['PASS: adversarial-testing gate passed'], checks: [{label: 'result JSON: pass'}, {label: 'full test suite', mono: 'PROJECT_TESTS'}], outputAt: 0.5}` | gauge-pass −10 | `role-gate --role measure-adversarial-testing`, "result JSON: pass", "full test suite" `PROJECT_TESTS`, `PASS: adversarial-testing gate passed` |
| 10.8 | "user interface" | `roleChip {role: 'adversarial-testing', on: false}`, `roleChip {role: 'ux-browser-review', on: true, x: 640}`. The plate clears. `baselineStamp {sha: '2d7b5e3', label: 'role_base_sha'}` (label only). | tick −18 | `measure-ux-browser-review`, `role_base_sha` |
| 11.6 | "a browser review" | Head D drops at x 640. A Frame, variant `app`, scale 0.45, draws at x 840–1416, y 296–530 (`evolvePath`, 24 f). Its content is a reset form stand-in: a title Bar, one field, one button pill. | head-clip −12 | `model D` |
| 12.8 | "checks" | An `ink` ring (24 px, 2 px) marks a click on the field. At 13.6, a second ring marks a click on the button. No Cursor: the Cursor is the human. | tick −20 for each ring | — |
| 14.8 | "screenshots" | Three thumbnails come off the Frame and stack at x 840–1240, y 560–628. Each one is a small copy of the Frame: 120 × 68, `paper`, 2 px `hairline`. | — | — |
| 15.6 | "evidence" | The Frame leaves. The thumbnails shrink into the new tag. Head D lifts out. `runTag {state: 'complete', id: 't-ux', role: 'ux-browser-review', file: 'ux-browser-review-2d7b5e3.json', boundSha: '2d7b5e3', glyph: 'pentagon', retry: 'none'}`. Column 1560 is full, so the tag opens column 1616 and the bus draws. | tag-flutter −16 | — |
| 15.8 | — | The lane readout types. `gate {role: 'ux-browser-review', result: 'pass', glyph: 'pentagon', runTagId: 't-ux', output: ['PASS: ux-browser-review gate passed'], checks: [{label: 'result JSON: pass'}, {label: 'dev URL set', mono: 'PROJECT_DEV_URL'}], outputAt: 0.4}` | gauge-pass −10 | `role-gate --role measure-ux-browser-review`, "result JSON: pass", "dev URL set" `PROJECT_DEV_URL`, `PASS: ux-browser-review gate passed` |
| 16.6 | (end) | The gate finishes. | — | — |

The browser review applies because `reset.ts` is under `src/`, a default UX prefix of `ux_paths()`. In this run, adversarial testing commits no tests (section 10).

VO: "Next, adversarial testing tries to break the work with boundary, failure-path, and regression tests. It may commit tests. It never fixes code. When the change touches the user interface, a browser review checks the running app, with screenshots as evidence."

#### O12. Phase acceptance (estimate 19.8 s)

On screen: a Head of a family other than Red reads the frozen HEAD. Every phase result chains to the same Commit. The gate passes, and Pin 3 goes in. The orchestrator stops, and the human gives the checkpoint yes. A dashed diagram shows the path of a blocker.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "Last in the phase" | Hold. The ux gate output stays on the plate. | — | — |
| 0.8 | "phase" | `roleChip {role: 'ux-browser-review', on: false}`, `roleChip {role: 'phase-acceptance', on: true, x: 864}`. The plate clears. | tick −18 | `measure-phase-acceptance` |
| 1.6 | "acceptance" | Head D drops at x 864 (stemless). | head-clip −12 | `model D` |
| 3.2 | "frozen head" | `baselineStamp {sha: '2d7b5e3', label: 'audited_head_sha'}` (label only). `tray {action: 'highlight', sha: '2d7b5e3'}`: the chains of columns 1560 and 1616 draw at 100 % for 90 f, then settle. | — | `audited_head_sha` |
| 4.0 | "by a model" | A ghost Head B (`hairline`) appears at x 640. A "≠" sign, Inter Tight 700 44 px `ink`, appears between it and Head D. | — | `model B`, "≠" |
| 6.8 | "tests" | The ghost Head B and the "≠" fade. | — | — |
| 7.0 | — | `runTag {state: 'complete', id: 't-phase-acceptance', role: 'phase-acceptance', file: 'phase-acceptance-2d7b5e3.json', boundSha: '2d7b5e3', glyph: 'pentagon', retry: 'none'}` | tag-flutter −16 | — |
| 7.2 | "Pass" | The lane readout types. `gate {role: 'phase-acceptance', result: 'pass', glyph: 'pentagon', runTagId: 't-phase-acceptance', output: ['PASS: phase-acceptance gate passed'], checks: [{label: 'result JSON: pass'}, {label: 'every task done'}], outputAt: 0.3}` | gauge-pass −10 | `role-gate --role measure-phase-acceptance`, "result JSON: pass", "every task done", `PASS: phase-acceptance gate passed` |
| 8.8 | "pin" | `phasePin {n: 3, sha: '2d7b5e3'}` | pin-thunk −8 | — |
| 9.6 | "in" | Head D lifts out. `roleChip {role: 'phase-acceptance', on: false}`. | — | — |
| 10.4 | "orchestrator stops" | `gauge {on: true, clear: true}`: the plate clears. The Verify Card (S5 style) appears at x 200–640, y 330–560. A dotted pointer draws from the glyph to the top of the Card. | — | "Verify Phase 3", "Yes" |
| 13.6 | "checkpoint" | The Cursor moves to "Yes" and clicks. "Yes" fills `ink`, with `paper` text. | mouse-click −12 | — |
| 14.0 | "Any blocker" | The Verify Card and the pointer leave. A dashed `graphite` diagram draws in the stage (x 600–1320, y 320–600). It has a chip copy of `measure-phase-acceptance` at the top and an "owner" pill at the bottom left. | — | `measure-phase-acceptance`, "owner" |
| 15.2 | "back" | A dashed arrow draws from the acceptance chip to the owner pill, with the label "blocker" (Inter 28). | — | "blocker" |
| 18.0 | "acceptance runs again" | A dashed arrow draws from the owner pill back to the acceptance chip. | — | — |
| 18.8–19.8 | (tail) | Hold. | — | — |

The diagram is dashed and `graphite` because it shows a possible path, not this run. The World does not change for it. The VO puts the pin before the checkpoint, and the beats follow the VO (section 10).

VO: "Last in the phase: acceptance, on a frozen head, by a model that did not write the tests. Pass, and the phase pin goes in. Then the orchestrator stops and asks you for the checkpoint. Any blocker sends the work back to its owner, and acceptance runs again."

#### O13. Model independence (estimate 13.4 s)

On screen: the twelve roles in a table, each with its family glyph and letter. The rules show one pair at a time. Then Red and Green swap families, and every rule still holds. The World does not change.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "Each role" | The O12 diagram leaves. `gauge {on: false}` (15 f). The table appears in role order, stagger 3 f. A header sits at baseline y 300. Two columns of 6 rows follow, at x 200–860 and x 1000–1660, with 48 px rows from y 330. Each row: the Head glyph (32 px), `model X` (mono 28), the skill name (mono 28). | — | "role → model, set by the host"; the 12 skill names; `model A` … `model E` |
| 3.6 | "Red and Green" | The `measure-mid-red` and `measure-jr-green` rows stay `ink`; the other rows change to `graphite`. A Bracket draws at x 880 across the two rows. The label strip shows a line: Inter 32 `ink`, centered, baseline y 630. | — | "Red ≠ Green" |
| 6.4 | "An auditor" | The highlight and the Bracket move to `measure-jr-green` (C) and `measure-review-a-correctness` (A). | — | "auditor ≠ audited" |
| 8.4 | "own family" | The highlight and the Bracket move to `measure-review-a-correctness` (A) and `measure-review-b-security` (D). | — | "Review A ≠ Review B" |
| 9.2 | "The plan" | All rows go back to `ink`. The Bracket and the label fade. The glyphs and letters of the Red and Green rows swap (B ↔ C) with `spring.swing`, 24 f. | head-clip −10 | `model C` on the Red row, `model B` on the Green row |
| 12.4–13.4 | (tail) | Hold. | — | — |

No World cue runs in O13. The Blade, the history, and the tray stay still while the table changes. The gauge goes off because the right column overlaps the gauge rectangle. It comes back in O15.

VO: "Each role runs on the model the host assigns. Red and Green never share a family. An auditor never audits its own family. The plan does not care which model it is."

#### O14. Audit (estimate 15.8 s)

On screen: the audit role checks the test scripts and the plan. Then it opens the anti-patterns catalog and appends a new entry. The audit role has no checker gate, so the gauge stays off.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "At any time" | The table leaves. `roleChip {role: 'orchestrator-audit', on: true, x: 640}`. | tick −18 | `measure-orchestrator-audit` |
| 0.8 | "time" | `baselineStamp {sha: '2d7b5e3', label: 'role_base_sha'}` (label only). Head E drops at x 640. | head-clip −12 | `role_base_sha`, `model E` |
| 1.6 | "the audit role" | Two Cards appear: `tests/*.sh` at x 860–1140 and `plan.md` at x 1180–1460, y 330–530. | — | `tests/*.sh`, `plan.md` |
| 4.8 | "test scripts" | A 2 px `ink` outline draws around `tests/*.sh`. At 5.6 ("honest"), a Lucide `check` appears on it. | tick −20 | — |
| 7.2 | "plan" | The same for `plan.md`. The `check` appears at 7.6 ("truthful"). | tick −20 | — |
| 8.0 | "It keeps" | Both Cards leave. An `anti-patterns.md` Card appears at x 860–1640, y 290–650: IDs `A1`–`A5` left and `A6`–`A10` right (mono 28 `ink`, each with a Bar). `A1` and `A8` are `graphite`, with "(retired)". | — | `anti-patterns.md`, `A1` … `A10`, "(retired)" |
| 11.6 | "entry" | Row `A11` types at the bottom of the right column. Its Bar grows. | tick −16 | `A11` |
| 13.6 | "a new way" | Head E lifts out. | — | — |
| 15.2–15.8 | (tail) | Hold. | — | — |

The two retired entries match `references/anti-pattern-catalog.md`, where A1 and A8 have "(retired)" in their headings. The O14 run adds no run tag and no Commit. The scene shows a check that runs "at any time", outside the phase flow (section 10).

VO: "At any time, the audit role checks the framework itself: are the test scripts honest, and is the plan truthful? It keeps a catalog of anti-patterns, and adds an entry when it finds a new way to fail."

#### O15. Final acceptance and closeout (estimate 18.6 s)

On screen: all three Pins are in. Final acceptance runs lint, checks, and the full test suite on the whole track. Then closeout moves the track into the `archive/` slot, updates the registry and the metadata, and commits the run records. The closeout gate passes.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "When every phase" | `roleChip {role: 'orchestrator-audit', on: false}`. The catalog Card leaves. `gauge {on: true}`. | line-draw −16 | "GO", "NO GO" |
| 0.8 | "phase has its pin" | A 2 px `ink` selection outline draws around the Blade and its three Pins (x 288–1408, y 640–762, `evolvePath`, 30 f). | — | — |
| 2.4 | "final acceptance" | The outline fades. `roleChip {role: 'final-acceptance', on: true, x: 864}`. `baselineStamp {sha: '2d7b5e3', label: 'role_base_sha'}` (label only). Head E drops at x 864. | tick −18, head-clip −12 | `measure-final-acceptance`, `role_base_sha`, `model E` |
| 3.2 | "runs" | `runTag {state: 'complete', id: 't-final-acceptance', role: 'final-acceptance', file: 'final-acceptance-2d7b5e3.json', boundSha: '2d7b5e3', glyph: 'bars', retry: 'none'}`. The lane readout types. `gate {role: 'final-acceptance', result: 'pass', glyph: 'bars', runTagId: 't-final-acceptance', output: ['PASS: final-acceptance gate passed'], checks: [...], outputAt: 4.4}` at 3.2. | tag-flutter −16 | `role-gate --role measure-final-acceptance` |
| 3.6 | "lint" | Check row 1. | tick −20 | "lint" `PROJECT_LINT` |
| 4.0 | "checks" | Check row 2. | tick −20 | "checks" `PROJECT_CHECKS` |
| 6.0 | "suite" | Check row 3. | tick −20 | "full test suite" `PROJECT_TESTS` |
| 7.2 | "whole track" | Check row 4. | tick −20 | "every task in the track done" |
| 7.6 | "track" | The output types. The token goes out through GO. A `check` appears on `t-final-acceptance`. Head E lifts out. | gauge-pass −10 | `PASS: final-acceptance gate passed` |
| 8.4 | "closeout" | `roleChip {role: 'final-acceptance', on: false}`, `roleChip {role: 'closeout', on: true, x: 640}`. The plate clears. Head A drops at x 640 at 8.8. | tick −18, head-clip −12 | `measure-closeout`, `model A` |
| 9.2 | "the only role" | A track Card (`paper`, 2 px `ink`, 12 px radius, mono 28) appears at x 760–1300, y 400–460. | — | `tracks/password_reset_20261019/` |
| 11.6 | "archives" | `tracks/` in the Card types over to `archive/` (12 f). | — | `archive/password_reset_20261019/` |
| 11.8 | — | `archive {slot: 'archive', durationFrames: 36}`. The Blade retracts into the Case. The reset Commits go to 30 %. The Case slots fade in. The Card shrinks into the `archive/` slot (x 216–272, y 662–670). `caseClick` at 12.4. | tape-pull −12, lock-click −10 | — |
| 12.8 | "updates the registry" | A `tracks.md` Card appears at x 760–1300, y 330–560 (lines below). At 13.2 ("registry"), the `password_reset_20261019` line moves under `## Archived Tracks` (`ease.ui`, 24 f). | — | The `tracks.md` lines below |
| 14.0 | "marks it done" | The `tracks.md` Card leaves. A `metadata.json` Card appears at x 760–1300, y 360–540. Its lines type at 14.4. | — | The `metadata.json` lines below |
| 15.2 | "and commits" | The `metadata.json` Card leaves. `runTag {state: 'complete', id: 't-closeout', role: 'closeout', file: 'closeout-2d7b5e3.json', boundSha: '2d7b5e3', glyph: 'ring', retry: 'none'}` | tag-flutter −16 | — |
| 15.6 | "commits" | `commit {tickId: 'reset:P3', dx: 560, sha: 'f1b8d06', head: 'ring', kind: 'project', message: "chore(measure): Archive track 'Add password reset'"}` | commit-stamp −10 | `f1b8d06` |
| 16.4 | "run records" | `tray {action: 'commit', sha: 'f1b8d06'}`. The tray floor and walls change to `ink`. A dotted chain draws from the tray (1700, 1028) to the Commit (1672, 832). Head A lifts out. | line-draw −16 | — |
| 16.8 | "with it" | The lane readout types. `gate {role: 'closeout', result: 'pass', glyph: 'ring', runTagId: 't-closeout', output: ['PASS: closeout gate passed'], checks: [...], outputAt: 0.6}`. Four check rows tick at 0.1 s intervals. | tick −20 for each row, gauge-pass −10 | `role-gate --role measure-closeout`; "track in `archive/`", "not in the active registry", "`metadata.json`: done, with a date", "closeout manifest"; `PASS: closeout gate passed` |
| 18.0–18.6 | (tail) | Hold. | — | — |

`tracks.md` Card (simplified; the real file adds a title and a link line for each track):

```text
# Project Tracks
- session_timeout_20261020
- password_reset_20261019
## Archived Tracks
```

`metadata.json` Card (the two fields that `metadata_closeout_feedback()` checks):

```text
{
  …
  "status": "done",
  "completed": "2026-10-20"
}
```

The closeout gate runs `closeout_feedback()`, which checks five things:
1. The track is in `archive/` and not in `tracks/`.
2. The active registry section does not list it.
3. The plan is complete.
4. The metadata has `status: "done"` and a `completed` date.
5. The closeout manifest exists.

The plate shows checks 1, 2, 4, and 5 as rows. The plan check skips the `[b]` line of Task 3.4, because its regex does not match `[b]`.

The `archive` cue keeps its first-video behavior: Commit squares go to 30 %, and their git-note Tags and plumb lines fade out (BUILD-NOTES item 11). The new Commits have no git notes. Run tags, stamp rings (at their Commit's opacity), and the tray stay.

VO: "When every phase has its pin, final acceptance runs lint, checks, and the full test suite on the whole track. Then closeout, the only role that moves files. It archives the track, updates the registry, marks it done, and commits the run records with it."

#### O16. Lockup (estimate 12.8 s)

On screen: the twelve role names roll up the control lane in order, one on each beat. The chains light. The Reading Advantage lockup appears in the stage. The World stays on screen to the last frame, with the stale tags visible.

| t (s) | Anchor | World cue or scene action | SFX | On-screen text |
|---|---|---|---|---|
| 0.0 | "Twelve roles" | `roleChip {role: 'closeout', on: false}`. The lane readout clears. The roll starts at the lane center (x 960). Each name enters from y 252, holds, and leaves at y 192 (8 f in, 8 f out). The lane band clips the names. One name shows on each jingle beat (about 0.5 s), in role order. The 12th name stays. | tick −20 on each name | `1  measure-strategy`, `2  measure-mid-red`, `3  measure-jr-green`, `4  measure-review-a-correctness`, `5  measure-review-b-security`, `6  measure-review-c-ux-api`, `7  measure-adversarial-testing`, `8  measure-ux-browser-review`, `9  measure-phase-acceptance`, `10  measure-orchestrator-audit`, `11  measure-final-acceptance`, `12  measure-closeout` |
| 5.2 | "bound" | `tray {action: 'highlight'}`. Every chain draws to 100 % (12 f) and stays. | — | — |
| 6.8 | "The Measure orchestrator" | `gauge {on: false}`. The 12th name leaves the lane. The lockup builds in the stage (`ease.ui`, stagger 6 f): logo, separator, wordmark, URL, origin line (section 3.6). | lock-click −10 | "Measure", `github.com/bodangren/measure`, "Open source · Apache-2.0" |
| 8.0 | "From Reading Advantage" | Hold. The Reading Advantage logo is on screen. | — | — |
| 9.2–12.8 | (hold) | The last frame shows the full World. It has the Case with two slots, the retracted Blade, and the stamps. The history has the reset Commits at 30 % and `f1b8d06` at 100 %. The tray holds all 15 run tags, and the three stale tags stay visible. The jingle's natural ending fades under this hold. | — | — |

The roll takes 12 beats, about 6.0 s. Snap each name to `MUSIC_BEATS_MS` (section 7.3). The lockup uses `showCase={false}`. The World Case stays at x 120. History opacity stays at 1, unlike the first video's S10.

VO: "Twelve roles. One order. A mechanical gate between every two, and a result bound to every commit. The Measure orchestrator. From Reading Advantage."

## 5. Motion techniques

The techniques of `motion-brief-v2.md` section 5 stay: the swap, the Red → Green → Commit loop, Markdown as Bars, and git notes. This section adds the techniques of the control plane.

### 5.1 The gate

Goal: the viewer must see that the gate, not the role, decides.

1. **The report becomes the token.** In O6, the role's own `MEASURE_AGENT_RESULT` card shrinks into the token. From then on, the report is only an input. The gauge gives the verdict.
2. **Physics, not color.** PASS and FAIL differ by motion and sound. A pass token goes through the GO channel and out. A fail token hits the stop in the NO GO channel and recoils 12 px. The gauge stays `ink` and `paper`. The `pass` and `fail` colors stay on the test Chip.
3. **Rows, then output.** The check rows tick first, keyed to the VO. The output line types last. The token waits still in the channel while the rows tick.
4. **The verdict goes on the run tag.** After the token leaves, the tag of that run gets a `check` or an `x`. A tag never shows a verdict before its gate.
5. **One token at a time.** The gauge runs one gate at a time, also for the parallel reviews. The checker runs one `role-gate` call for each role, so this is true.
6. **Real strings only.** The output is a string from section 9.1. The rows are short labels in Inter. They name what the gate checks; they are not checker output.

### 5.2 Baseline and binding

1. **Stamp first.** Each role starts with a stamp on its `role_base_sha`. The label tells which baseline it is. The ring stays after the label fades.
2. **Chain to the Commit.** Each run tag hangs under the Commit of its baseline, on a dotted chain. A viewer can follow every result to one Commit.
3. **Stale is a mark, not a removal.** A stale tag keeps its place and its shape. It changes to `hairline` and gets a diagonal. The diagonal reads in grayscale and at small size.
4. **Frozen head.** In O12, the chains of the audited Commit draw at full strength for 1.5 s. Every phase result points at the same SHA.

### 5.3 The control lane

1. **Above, never across.** The control lane and its chips stay in y 192–264. Handoff lines and pointers start at the lane and end above y 696. Nothing from the lane touches the Blade.
2. **Chips come from the glyph.** Each role chip slides out of the orchestrator glyph to its place. The viewer sees that the orchestrator assigns each role.
3. **Glyph, not Head.** The orchestrator glyph has no capsule, no jaws, and no family letter. The orchestrator is not a model in the role table.
4. **One readout line.** The lane readout shows one real command at a time. It is off while three review chips fill the lane.
5. **The roll.** In O16, the twelve names rise through the lane one beat at a time. The lane band clips them, so the roll never leaves the lane.

### 5.4 Parallel reviews

1. **Three chips, three Heads, one SHA.** Three Heads of three families show the same SHA. This shows "in parallel on the same commit" without a split screen.
2. **One column.** The three review tags drop into one column under the same Commit, stagger 6 f.
3. **The loop as a column change.** After the fix, the new review tags hang in the next column. The old column keeps its stale tags. The tray shows the history of the loop.

### 5.5 Closeout and archive

1. **Text first, then motion.** The track Card types `archive/` over `tracks/` before it moves. The viewer reads the move before the motion shows it.
2. **The archive slot.** The Case gets its two slots only in O15. Before O15, the Case matches the first video.
3. **Records go with the track.** The tray changes to `ink` and chains to the closeout Commit. The run records are part of the archive commit.

### 5.6 Real text without walls of text

1. **Excerpts with `…`.** The JSON callouts show the fields that the VO names, with `…` for the rest. Field names stay verbatim.
2. **Wrap rules.** A checker output line wraps only after `; `. A JSON callout wraps only at JSON whitespace. Never shorten or change a string.
3. **Markdown as Bars.** Task titles on Cards are Bars, as in the first video. The markers, the task numbers, the SHAs, and `deferred:phikul` are real text.

## 6. Remotion implementation

### 6.1 Composition settings

The composition exists: `src/measure-orchestrator/MeasureOrchestrator.tsx`, registered in `src/Root.tsx`, with one composition for each scene (`MeasureOrchestrator-O01` … `O16`).

| Setting | Value |
|---|---|
| Composition ID | `MeasureOrchestrator` |
| Size, fps | 1920 × 1080, 60 fps (same as the first video) |
| Duration | `calculateMetadata` measures the 16 VO files and applies the scene length rule (section 4.1) |
| Video | H.264, CRF 16, `yuv420p`, rendered with `--muted` |
| Output | `assets/videos/<render date>-measure-orchestrator-1920x1080.mp4` |

### 6.2 Architecture

The three layers of the first video stay: scenes Back, the World layer, scenes Front. The second composition imports `world/`, `actors/`, `theme/`, `captions/`, and `audio/` in place from `src/measure-explainer/`. The new World elements go into the shared `world/` folder. The first video never fires the new cues, so its frames do not change.

Draw order of the World layer, back to front:

1. History lane: Commits, SHAs, first-video Tags.
2. Runs tray: floor, walls, label, chains, run tags.
3. Stamp rings and stamp labels.
4. Blade, Ticks, Phase marks, Pins, Markers.
5. Case, with its two slots.
6. Control lane: hairline, glyph, read-only chip, role chips.
7. Gauge, token, readout plate.

The scene layer draws the Heads, with `world.head` for the stem Head, as in the first video. It also draws the Cards, the Terminal, the ResultCard, the JsonCards, the Frame, and the Cursor. The lane readout, the handoff lines, the O16 roll, and the lockup are scene layer too.

### 6.3 New and changed cues

Add these types and cues to `src/measure-explainer/timeline.ts`. Put the role tables in a new `src/measure-orchestrator/roles.ts`.

```ts
// roles.ts
export type GateRole =
  | 'strategy' | 'mid-red' | 'jr-green' | 'review-a' | 'review-b' | 'review-c'
  | 'adversarial-testing' | 'ux-browser-review' | 'phase-acceptance' | 'final-acceptance' | 'closeout';
/** The checker's normalized role names (ROLE_ALIASES values), plus the audit role, which has no gate. */
export type RoleKey = GateRole | 'orchestrator-audit';

export const ROLE_ORDER: readonly RoleKey[] = [
  'strategy', 'mid-red', 'jr-green', 'review-a', 'review-b', 'review-c', 'adversarial-testing',
  'ux-browser-review', 'phase-acceptance', 'orchestrator-audit', 'final-acceptance', 'closeout',
];
export const ROLE_SKILL: Record<RoleKey, string> = {
  strategy: 'measure-strategy', 'mid-red': 'measure-mid-red', 'jr-green': 'measure-jr-green',
  'review-a': 'measure-review-a-correctness', 'review-b': 'measure-review-b-security',
  'review-c': 'measure-review-c-ux-api', 'adversarial-testing': 'measure-adversarial-testing',
  'ux-browser-review': 'measure-ux-browser-review', 'phase-acceptance': 'measure-phase-acceptance',
  'orchestrator-audit': 'measure-orchestrator-audit', 'final-acceptance': 'measure-final-acceptance',
  closeout: 'measure-closeout',
};
/** Family glyph per role (section 3.3). ring = A, triangle = B, square = C, pentagon = D, bars = E. */
export const ROLE_FAMILY: Record<RoleKey, Glyph> = {
  strategy: 'ring', 'mid-red': 'triangle', 'jr-green': 'square', 'review-a': 'ring',
  'review-b': 'pentagon', 'review-c': 'bars', 'adversarial-testing': 'ring',
  'ux-browser-review': 'pentagon', 'phase-acceptance': 'pentagon', 'orchestrator-audit': 'bars',
  'final-acceptance': 'bars', closeout: 'ring',
};
export type RetryRecommendation =
  | 'none' | 'retry_tests' | 'retry_implementation' | 'retry_audit'
  | 'escalate_human' | 'create_remediation_track' | 'infrastructure_retry';
/** Every gate output line that the video may show (section 9.1). */
export const GATE_LINES: readonly string[] = [/* section 9.1, verbatim */];
```

```ts
// timeline.ts: CueBody additions
export type GateCheck = {label: string; mono?: string; state: 'ok' | 'unused'; at: number}; // at: s after the gate cue
export type BaselineLabel = 'role_base_sha' | 'phase_base_sha' | 'audited_head_sha';

  | {type: 'controlLane'; part: 'lane' | 'glyph' | 'readOnly'; on: boolean; durationFrames?: number}
  | {type: 'roleChip'; role: RoleKey; on: boolean; x?: number}            // x: chip center, clamped to 392–1800
  | {type: 'gauge'; on: boolean; clear?: boolean; durationFrames?: number}
  | {type: 'baselineStamp'; sha: string; label: BaselineLabel}
  | {
      type: 'gate';
      role: GateRole;
      result: 'pass' | 'fail';
      glyph: Glyph;                      // the token face: the role's family glyph
      output: readonly string[];         // each line is in GATE_LINES
      runTagId?: string;                 // the tag that gets the verdict
      checks?: readonly GateCheck[];
      outputAt: number;                  // s after the gate cue
    }
  | {type: 'runTag'; state: 'reserved' | 'complete'; id: string; role: RoleKey; file: string;
     boundSha: string; glyph: Glyph; retry: RetryRecommendation | null}
  | {type: 'runTag'; state: 'pass' | 'fail' | 'stale'; ids: readonly string[]}
  | {type: 'tray'; action: 'show' | 'highlight' | 'commit'; sha?: string; durationFrames?: number}

// Changed cues (old fields keep their meaning):
  | {type: 'tagFlip'; sha?: string; runTagId?: string}                   // runTagId flips a run tag; a second flip turns it back
  | {type: 'archive'; durationFrames?: number; slot?: 'archive'}          // slot: show the Case slots and fill archive/
```

`TickStatus` already has `'b'`, and `world/Tick.tsx` already draws a `b` Tick in `hairline`.

Rules for `worldAt`:
- `controlLane`, `roleChip`, `gauge`, `baselineStamp`, `gate`, `runTag`, and `tray` change only `control`. They never change `ticks`, `phaseMarks`, `commits`, `blade`, `scroll`, or `zoom`.
- `roleChip {on: true}` clears the plate. `gauge {clear: true}` also clears it.
- `gate`: the token enters at the cue frame. Row `i` shows at `checks[i].at`. The output types from `outputAt`. The token exits (pass) or stops (fail) at `outputAt` + typing time. Then the verdict goes to `runTagId`. The plan's "runTag pass/fail" states are this verdict. The `runTag {state: 'pass' | 'fail'}` form sets the verdict without a gate, for tests and for a gate that a scene does not show.
- `runTag {state: 'reserved' | 'complete'}`: the tag takes its reserved slot, or the next free slot of the column under `boundSha`. A full column (4 tags) opens a column 56 px to the right, with a bus.
- `runTag {state: 'stale'}`: the state changes. The position, the size, and the opacity do not change.
- `baselineStamp`: a SHA without a ring gets one; the earlier current role ring changes to `hairline`. `phase_base_sha` adds the double ring. Every stamp shows its label for 120 f.
- `archive {slot: 'archive'}`: the first-video behavior, plus `control.caseSlots`. It does not change `control.runTags` or `control.tray`.

### 6.4 WorldState additions

```ts
export type RunTagState = 'reserved' | 'complete' | 'pass' | 'fail' | 'stale';

export type ControlState = {
  lane: {progress: number; bottomY: number};          // bottomY is 264 on every frame
  glyph: {scale: number; opacity: number};
  readOnly: {progress: number};
  roleChips: {role: RoleKey; label: string; x: number; y: number; width: number; progress: number}[];
  gauge: {drawProgress: number; opacity: number};
  token: null | {glyph: Glyph; x: number; y: number; opacity: number; channel: 'go' | 'nogo'};
  plate: {rows: {label: string; mono?: string; state: 'ok' | 'unused'; opacity: number}[];
          lines: {text: string; chars: number}[]};
  stamps: {sha: string; x: number; kind: 'role' | 'phase'; current: boolean; scale: number;
           opacity: number; label: BaselineLabel | null; labelOpacity: number}[];
  runTags: {id: string; role: RoleKey; file: string; boundSha: string; glyph: Glyph;
            retry: RetryRecommendation | null; column: number; slot: number; x: number; y: number;
            state: RunTagState; verdict: 'pass' | 'fail' | null; staleProgress: number;
            dropProgress: number; flip: number}[];
  chains: {sha: string; x: number; opacity: number}[];
  tray: {progress: number; committed: number; highlight: number};
  caseSlots: {opacity: number; archiveFilled: boolean};
};
// WorldState gains: control: ControlState
```

### 6.5 Cues for each scene

| Scene | Reused cues of the first video | New cues |
|---|---|---|
| Prelude | Every cue of the first video (with `newTrack`, `bladePull`, `tickStatus`, `phasePin`, `commit`, `revertPhase`, `archive`, `zoom`, `scroll`), plus `tickStatus` (3.4 → `b`) and `commit` (`4c7e2b9`) | — |
| O1 | `scroll`, `historyOpacity`, `caseClick` | `controlLane` (lane, glyph) |
| O2 | `caseClick` | `controlLane` (readOnly), `roleChip` |
| O3 | `bladePull` | — |
| O4 | — | `roleChip`, `baselineStamp`, `tray` (show), `runTag` (reserved) |
| O5 | `caseClick`, `commit` | `runTag` (complete), `baselineStamp` (phase) |
| O6 | — | `gauge`, `gate` (pass) |
| O7 | `headSwap`, `tickStatus`, `commit` | `roleChip`, `baselineStamp`, `runTag`, `gate` (pass) |
| O8 | `headSwap`, `tickStatus`, `commit`, `caseClick` | `roleChip`, `baselineStamp`, `runTag`, `gate` (pass) |
| O9 | — | `roleChip`, `baselineStamp`, `runTag` |
| O10 | `tagFlip` (changed), `commit` | `gate` (pass, fail), `roleChip`, `baselineStamp`, `runTag` (complete, stale) |
| O11 | — | `roleChip`, `baselineStamp`, `runTag`, `gate` (pass) |
| O12 | `phasePin` | `roleChip`, `baselineStamp`, `tray` (highlight), `runTag`, `gate` (pass), `gauge` (clear) |
| O13 | — | `gauge` (off) |
| O14 | — | `roleChip`, `baselineStamp` |
| O15 | `archive` (changed), `commit`, `caseClick` | `gauge`, `roleChip`, `baselineStamp`, `runTag`, `gate` (pass), `tray` (commit) |
| O16 | — | `roleChip` (off), `tray` (highlight), `gauge` (off) |

Not used in the O scenes: `newTrack`, `zoom`, `revertPhase`, `reveal`, `baseline`, and `caseShow`. The track exists from the first video, so no `newTrack` is necessary. This video has no zoom, so the Blade line cannot move. `phasePin` in O12 has no checkpoint Commit; the pin records `2d7b5e3`.

### 6.6 Prelude and continuity

```ts
// src/measure-orchestrator/timeline.ts
import {SCENES as EXPLAINER_SCENES, buildCues as buildExplainerCues, totalFrames} from '../measure-explainer/timeline.ts';

const EXPLAINER_END = totalFrames(EXPLAINER_SCENES);
const PRELUDE: Cue[] = [
  ...buildExplainerCues(EXPLAINER_SCENES).map((c) => ({...c, frame: c.frame - EXPLAINER_END - 120, scene: 'prelude'})),
  {frame: -60, scene: 'prelude', type: 'tickStatus', tickId: 'reset:3.4', status: 'b'},
  {frame: -30, scene: 'prelude', type: 'commit', tickId: 'reset:P3', dx: 168, sha: '4c7e2b9', head: null,
   kind: 'plan', message: 'measure(plan): defer Task 3.4 to phikul'},
];
export const buildCues = (scenes) => [...PRELUDE, ...buildCuesFor(SCENE_DEFS, scenes, SCENE_CUES)];
```

The plan lengths of the first video are enough for the prelude, because only the settled end state matters. Every S10 transition ends before the S10 end.

### 6.7 File tree

```text
src/measure-orchestrator/
  MeasureOrchestrator.tsx, calculateMetadata.ts, pipeline.ts, videoConfig.ts   (exist)
  timeline.ts            (exists: add PRELUDE, SCENE_CUES, the O10 coda)
  roles.ts               (new: section 6.3)
  timeline.test.ts       (new: section 6.8)
  data/captions.json, data/voiceover-lines.tsv                                  (exist)
  scenes/O01ColdOpen.tsx … O16Lockup.tsx, index.ts                              (replace Placeholder.tsx)
  scripts/jingle-loop.sh, register-index.py, render-all.sh                      (exist)
src/measure-explainer/
  timeline.ts            (CueBody additions)
  world/worldAt.ts       (ControlState)
  world/ControlLane.tsx, RoleChip.tsx, Gauge.tsx, ReadoutPlate.tsx,
        Stamp.tsx, RunsTray.tsx, RunTag.tsx, CaseSlots.tsx                       (new)
  world/WorldLayer.tsx   (draw order, section 6.2)
  world/control.test.ts  (new: section 6.8)
  actors/Terminal.tsx, ResultCard.tsx, JsonCard.tsx                              (new)
```

### 6.8 Tests and check frames

Put the rules into tests. Run them with the Node test runner, as in the first video. Add both files to `tests/run-all.sh`.

| Test | Method |
|---|---|
| A stale tag never leaves the screen. | Find each tag in a `runTag {state: 'stale'}` cue. On every frame from that cue to the last frame, check five things. The tag is in `control.runTags`. Its state is `stale`. Its opacity is 1. Its x and y equal the values at the stale frame. Its box is inside 1920 × 1080. |
| The control lane never crosses the blade line. | For every frame: `control.lane.bottomY < BLADE_Y`, every role chip `y + 40 < BLADE_Y`, and the glyph bottom `< BLADE_Y`. The scene helper for handoff lines returns an end y of 696 or less. |
| A gate pass changes no tick. | For each `gate` cue: `worldAt` with and without the cue gives equal `ticks`, `phaseMarks`, and `commits` on every frame from the cue to the end. Run it for the fail gate too. |
| The Blade line stays at y 704. | `bladeTopY === 704` at every cue frame. No `zoom` cue exists in `SCENE_CUES`. |
| Continuity with the first video. | `worldAt(0)` equals the last frame of `MeasureExplainer` for `track`, `bladeLength`, `scrollX`, `zoom`, `phaseMarks`, and `historyOpacity`. `ticks` differ only in 3.4 (`b`). `commits` differ only by `4c7e2b9`. |
| Gate strings are real. | Every `gate.output` line is in `GATE_LINES`. Every line matches `^(PASS|FAIL): `. |
| History only grows. | The number of Commits never decreases. After `archive`, Commits are at 30 % or more. |
| Run tags do not overlap. | No two tag boxes intersect. Every tag box is inside y 904–1044. |
| Family rules hold. | `ROLE_FAMILY` passes the five rules of section 3.3, before and after the O13 swap. |
| The first video does not change. | For the cues of `MeasureExplainer`, `control` is empty on every frame. The existing `worldAt.test.ts` passes. |
| Text rules. | A script scans `roles.ts`, `timeline.ts`, and the scene files for the banned words of section 9 and for vendor names. |

```bash
node --test src/measure-explainer/world/worldAt.test.ts src/measure-explainer/world/control.test.ts src/measure-orchestrator/timeline.test.ts
```

Render one check still at each of these moments:
- O3 at t 7.2
- O6 at t 12.4
- O10 at t 1.0 (the FAIL)
- O10 at t 8.6 (stale)
- O12 at t 9.0 (the pin)
- O15 at t 17.6 (closeout PASS)
- the last frame of O16

### 6.9 Deliverables and render steps

1. Master: `assets/videos/<date>-measure-orchestrator-1920x1080.mp4`, 1080p60.
2. Captioned social cut: `assets/videos/<date>-measure-orchestrator-captions-1920x1080.mp4`, captions at the top (y 96–176).
3. Poster: `assets/videos/<date>-measure-orchestrator-poster-1920x1080.jpg`, from O15 at t 17.6. It shows the archive, the tray, the stale tags, and the closeout PASS.
4. Register each file in `assets/video-assets/index.json` with `scripts/register-index.py`. Title: "Measure Orchestrator: how a track runs".

Render steps (`out/measure-orchestrator/` is a work folder outside git):

```bash
# 1. Silent video
npm run render -- MeasureOrchestrator out/measure-orchestrator/video.mp4 --muted --codec=h264 --crf=16
# 2. Music bed: two bar-boundary seams (section 7.3); the target is the video length in seconds
bash src/measure-orchestrator/scripts/jingle-loop.sh <video seconds> out/measure-orchestrator/jingle.wav
# 3. Cues and mix: the first video's export-cues and build-mix chain, with the jingle bed from step 2
# 4. Mux, the social cut, and the poster: as in motion-brief-v2.md section 6.7
```

`scripts/render-all.sh` runs these steps.

## 7. Voiceover and sound

### 7.1 Script

Plan section 6, word for word. The 16 lines are in `src/measure-orchestrator/data/voiceover-lines.tsv`.

| Scene | Line |
|---|---|
| O1 | "You have seen the tape: a spec, a plan, and one task at a time. Now, who runs it? The Measure orchestrator." |
| O2 | "The orchestrator is a control plane, not a coder. It reads the measure folder, picks the next phase, and hands each step to one focused subagent, one role at a time. It writes no code, no tests, and no plans itself." |
| O3 | "First, it runs status. The checker reads every plan and lists the phases that are still open. The first open phase is next. A task that is blocked, with an owner, does not count. Markers decide, not prose." |
| O4 | "Before every role, it records the commit it starts from. Each result is bound to that revision. If the code moves, the result is stale." |
| O5 | "Role one: strategy. It writes a test strategy for the track and names the reviews that apply. The orchestrator takes the phase baseline after that commit." |
| O6 | "After every role, the orchestrator runs the mechanical gate. A role's own report is not evidence. The gate reads the result block, the plan, git, and the test command, and prints pass or fail." |
| O7 | "Role two: Red. A different model family writes the failing tests for the phase, marks the task in progress, and commits. The gate checks that the tests fail, and that only test files changed." |
| O8 | "Role three: Green, on another family. It makes the tests pass and commits the code. Then it writes the commit hash into the plan, in a second commit, because a commit cannot contain its own hash. The gate checks: every task done, every task with a hash, and the tests green." |
| O9 | "Then three reviews run in parallel on the same commit: correctness, security, and the API and user-flow contracts. Each review is report-only. It writes one JSON result into the runs folder, with findings and a retry recommendation. It fixes nothing." |
| O10 | "A blocking finding goes back to Green with the exact evidence. Green commits a fix. That new commit makes every review stale, so the reviews run again on the new head." |
| O11 | "Next, adversarial testing tries to break the work with boundary, failure-path, and regression tests. It may commit tests. It never fixes code. When the change touches the user interface, a browser review checks the running app, with screenshots as evidence." |
| O12 | "Last in the phase: acceptance, on a frozen head, by a model that did not write the tests. Pass, and the phase pin goes in. Then the orchestrator stops and asks you for the checkpoint. Any blocker sends the work back to its owner, and acceptance runs again." |
| O13 | "Each role runs on the model the host assigns. Red and Green never share a family. An auditor never audits its own family. The plan does not care which model it is." |
| O14 | "At any time, the audit role checks the framework itself: are the test scripts honest, and is the plan truthful? It keeps a catalog of anti-patterns, and adds an entry when it finds a new way to fail." |
| O15 | "When every phase has its pin, final acceptance runs lint, checks, and the full test suite on the whole track. Then closeout, the only role that moves files. It archives the track, updates the registry, marks it done, and commits the run records with it." |
| O16 | "Twelve roles. One order. A mechanical gate between every two, and a result bound to every commit. The Measure orchestrator. From Reading Advantage." |

### 7.2 Voice

| Item | Decision |
|---|---|
| Engine | `mmx speech synthesize`, model `speech-2.8-hd` |
| Voice | `English_Trustworthy_Man`, the narrator of the first video |
| Calls | 16 calls, one take for each line (plan section 9) |
| Files | `public/voiceover-orchestrator/O01.mp3` … `O16.mp3` (recorded; 215.95 s in total) |
| Scene lengths | `calculateMetadata` reads the 16 files (section 4.1) |

### 7.3 Music

| Item | Decision |
|---|---|
| File | `assets/video-assets/music/reading-advantage-jingle.mp3`. The file is 131.1 s, but the music stops at 112.55 s. Full level runs to about 99 s; the natural fade runs from about 100 s to 112.5 s; then the file is silent. |
| Beat grid | `src/measure-explainer/data/jingle-beats.json`: 120.19 BPM, first beat at 360 ms, 263 beats. A bar boundary is a beat index that divides by 4. |
| Method | `src/measure-orchestrator/scripts/jingle-loop.sh <target s> <out.wav>`. It picks the bar beat `L` nearest to (target − 112) / 2 s. The bed is: 0 → `L`, then the first beat → `L`, then the first beat → the end. Each seam is a 0.5 s crossfade centered on the beat, so the beat grid continues. |
| Values for 232.6 s | `L` = beat 120 at 59.849 s. Seam 1 at video 59.85 s (O6, 0.25 s after its start). Seam 2 at video 119.34 s (O9, about 10.9 s after its start). The music stops at about 231.5 s, 1.1 s before the last frame. The natural fade plays under O16. |
| Level and ducking | Volume 0.24, sidechain on the voice stem, as in the first video. Do not add the 2 s end fade: the natural ending does that work. |
| Studio preview | `videoConfig.ts` plays a plain loop. Only the ffmpeg mix has the seams. |

The plan says "loop the jingle once". One seam cannot fill the video. The latest useful seam is near 99 s, so one seam gives about 211 s of music. The video is about 232.6 s. Two seams are necessary (section 10).

**Beat snapping.** Map the jingle beats to video time through the seams, as `MUSIC_BEATS_MS`:
- Pass 1: video = beat time, for beats before `L`.
- Pass 2: video = `L` + (beat time − 360 ms), for beats from beat 0 to beat `L`.
- Pass 3: video = 2 `L` − 360 ms + (beat time − 360 ms), for beats from beat 0 to the end.

Snap these cues to the nearest mapped beat: the O16 roll names, the Commit drops in O7, O8, and O10, and the O12 Pin.

**Alternative seams.** The jump from beat 120 back to beat 0 can sound wrong. If it does, use seams on 8-bar phrases:
- Seam 1: out at beat 160 (79.702 s), in at beat 32 (16.219 s).
- Seam 2: out at beat 176 (87.620 s), in at beat 64 (32.090 s).

The music then stops at 231.56 s, with the same end. A second alternative is the plan's voice-only end: no seams, and the music stops at 112.5 s, in O9.

### 7.4 Sound effects

The first video's set in `public/sfx/`, plus three new files. The placeholder script (`src/measure-explainer/scripts/placeholder-sfx.py`) already writes `gauge-pass.wav`, `gauge-fail.wav`, and `tag-flip.wav`. Replace all placeholders with foley or Freesound CC0 files before the final render, and keep the file names.

| Event | File | Level below VO peak |
|---|---|---|
| Blade pull (O3) | `tape-pull.wav` | −8 dB |
| Blade retract in the archive (O15) | `tape-pull.wav` | −12 dB |
| Case click, lockup in (O16) | `lock-click.wav` | −10 dB |
| World Head swap on the stem (O7, O8) | `head-clip.wav` | −10 dB |
| Stemless Head arrives, O13 family swap | `head-clip.wav` | −12 dB, −10 dB |
| Tick to `[x]` | `tick.wav` | −16 dB |
| Role chip in, stale mark, legend stale | `tick.wav` | −18 dB |
| Check row, attack pill, click ring, Tick to `[~]`, O16 roll name | `tick.wav` | −20 dB |
| Commit drop | `commit-stamp.wav` | −10 dB |
| Orchestrator glyph stamp (O1) | `commit-stamp.wav` | −12 dB |
| Baseline stamp (new ring) | `commit-stamp.wav` | −18 dB |
| Run tag drop | `tag-flutter.wav` | −16 dB |
| Pin (O12) | `pin-thunk.wav` | −8 dB |
| Test Chip FAIL | `fail-thud.wav` | −12 dB |
| Test Chip PASS | `pass-notes.wav` | −12 dB |
| Cursor click (O12, the human) | `mouse-click.wav` | −12 dB |
| Control lane, gauge, tray, closeout chain draw | `line-draw.wav` | −16 dB |
| **Gate pass: token out through GO** | **`gauge-pass.wav`** (new) | −10 dB |
| **Gate fail: token stops at NO GO** | **`gauge-fail.wav`** (new) | −8 dB |
| **Run tag flip (O10)** | **`tag-flip.wav`** (new) | −14 dB |

Not used: `retract-snap.wav` (no revert) and `gate-clunk.wav` (the Band's deny sound in the first video). A label-only stamp makes no sound. When more than three sounds fall within 0.25 s, keep the gauge sound and the Commit sound, and drop the ticks.

### 7.5 Mix

The chain of `motion-brief-v2.md` section 7.5, with one change: the music input is the bed from `jingle-loop.sh`, not the raw jingle. The voice stem is −16 LUFS. The master is −14 LUFS integrated, −1 dBTP.

### 7.6 Captions

`src/measure-orchestrator/data/captions.json` has 95 caption pages from the recorded takes. The social cut burns them in at y 96–176, above the control lane (y 192). YouTube gets an SRT file.

## 8. Production effort

For one experienced motion developer who knows React, Remotion, and the first video's code:

| Phase | Work | Person-days |
|---|---|---|
| System | `ControlState` in `worldAt` with tests; 8 World components; Terminal, ResultCard, JsonCard; prelude | 4–5 |
| Scenes | O6, O10, and O15: 1–1.5 days each. The other 13 scenes: 0.5–1 day each. | 10–13 |
| Audio | Seam check by ear, SFX placement, mix | 1 |
| Review | Two rounds of notes | 2–3 |
| Deliverables | Captions cut, poster, index entries | 1 |
| **Total** | | **18–23** |

An agent can write most of the components and scenes, as in the first video. Build order:
1. `roles.ts` and the cue types.
2. `worldAt` with the tests of section 6.8.
3. O6 and O10 (the gate and the loop).
4. The other scenes.

## 9. Rules for accuracy and brand voice

### 9.1 Allowed gate output

The video may show only these checker lines. Each one is a string that `measure_interphase_checks.py` prints: `print(f"PASS: {role} gate passed")` and `print(f"FAIL: {item}")` in `cmd_role_gate()`, with the item from `passing_audit_feedback()`.

```text
PASS: strategy gate passed
PASS: mid-red gate passed
PASS: jr-green gate passed
PASS: review-a gate passed
PASS: review-b gate passed
PASS: review-c gate passed
PASS: adversarial-testing gate passed
PASS: ux-browser-review gate passed
PASS: phase-acceptance gate passed
PASS: final-acceptance gate passed
PASS: closeout gate passed
FAIL: audit status must be pass, got 'fail'; token compare not constant-time
```

The FAIL line has example data (`token compare not constant-time`) in the place where the checker puts the blocking findings. The `{role}` value is the normalized role name from `ROLE_ALIASES`, not the skill name. The audit role has no gate line.

### 9.2 Other real strings

| String | Source |
|---|---|
| `status` output lines (O3) | `cmd_status()` format |
| `MEASURE_AGENT_RESULT` field names (O6) | `references/contracts.md` |
| Audit JSON field names and `retry_recommendation` values (O9, O10) | `references/contracts.md`; `RetryRecommendation` in section 6.3 |
| `RED_TEST_COMMAND`, `GREEN_TEST_COMMAND`, `PROJECT_LINT`, `PROJECT_CHECKS`, `PROJECT_TESTS`, `PROJECT_DEV_URL` | `SKILL.md` and `cmd_role_gate()` |
| `role_base_sha`, `phase_base_sha`, `audited_head_sha` | `agents/measure-orchestrator.md`, `agents/measure-phase-acceptance.md` |
| `measure/runs/<track>/<role>-<short-head>.json` and `.log` | `SKILL.md`, "Delegation" |
| `role-gate --role <skill name>` | the `role-gate` argument parser (`--role`, help text "e.g. measure-jr-green") |
| `[b]` with `deferred:<owner>` | `SKILL.md`, "Marker Vocabulary" |
| `## Archived Tracks`, `"status": "done"`, `"completed"` | `closeout_feedback()`, `metadata_closeout_feedback()` |
| The 12 skill names | `SKILL.md`, "Role Order" |
| A1–A10, "(retired)" on A1 and A8 | `references/anti-pattern-catalog.md` |

### 9.3 Brand rules

1. **No vendor names, vendor colors, or logos on screen**, other than the Reading Advantage logo in O16. Models are the five abstract glyphs with `model A` … `model E`. The phrase "set by the host" names no host. The O16 origin line drops the first video's "a community fork of Google's Conductor" for this reason (section 10).
2. **Nothing disappears from the History lane or the tray.** Revert, remediation, and archive add marks and Commits. Stale tags stay. The only fade is the first video's archive rule for git-note Tags (section 4.3, O15).
3. **No SF Pro font.**
4. **Banned words**: "guaranteed", "leading", "#1", "best", "revolutionary", "disruptive", "game-changing", and any unsourced percentage. They must not appear in the script or on screen. Run `npm run lint` in `advantage-pr` on the scene files.
5. **Write the Reading Advantage name in full.** Never shorten it to its initials. Do not use those two capital letters as an ID or a label anywhere in the code or on screen.
6. **The Cursor is the human.** Agents click with an `ink` ring, never with the Cursor.
7. **The accent marks only the plan.** The control plane is `ink`, `graphite`, `hairline`, and `paper`.

## 10. Deviations from the plan, and open points

| # | Plan text | This brief | Reason |
|---|---|---|---|
| 1 | Section 7: "loop the jingle once … end on the natural ending" | Two seams at bar boundaries; the natural ending stays | The music stops at 112.55 s, not at 131 s (the file has 18.5 s of silence). One seam gives about 211 s; the video is about 232.6 s. |
| 2 | O2: "points at the roles below the blade" | The roles are in the stage, below the control lane and above the Blade | Below the Blade is the History lane. A pointer there would cross the blade line, and the plan also says the lane never crosses it. |
| 3 | O3: "The next phase lights on the blade" | An `ink` selection outline around Phase 3 | The Blade is already Sky 400. A brighter accent would be a second accent. |
| 4 | O4: "A result tag chains to that commit" | A dashed reserved slot in O4; the strategy tag drops into it in O5 | At O4 the strategy role has not run, so no record exists. The slot is the log path that the orchestrator gives at dispatch. |
| 5 | O6: "Checklist lines tick" for the result block, the plan, git, and the test command | Only the strategy gate's real checks tick; plan, git, and test command show a dash, with "checks differ per role" | The strategy branch of `cmd_role_gate()` checks only the result block and `test-strategy.md`. |
| 6 | O7: "A task goes `[~]`" | Three Ticks go `[~]` | `agents/measure-mid-red.md` marks every non-deferred open task of the phase. |
| 7 | O7 VO: "only test files changed" | Check row: "only test and Measure files changed" | The checker allows test files and `measure/` files (`non_test_committed_files()`). The VO stays unchanged. |
| 8 | O11: "It may commit tests" | No adversarial commit in this run | A commit would move HEAD after the reviews. The brief would then need a second review round, or it would break the rule that phase acceptance needs every result on the same HEAD. |
| 9 | O12: pin, then checkpoint | The beats follow the VO order | In the first video, the checkpoint and the pin came together. Here the VO puts "the phase pin goes in" before "asks you for the checkpoint". |
| 10 | O13: "The heads swap" | The table glyphs swap; no World cue | No `[~]` Tick exists in O13, so the World has no stem Head to swap. |
| 11 | O14: the audit | No gauge, no run tag, no Commit | The checker has no gate for `measure-orchestrator-audit`, and the scene shows a check at "any time", outside the phase flow. |
| 12 | Section 5: run tag with "`status` and `retry_recommendation` lines" | The tag face shows the glyph and the gate verdict; the JSON callout shows `status` and `retry_recommendation` | At 48 × 32 px, text lines cannot be read. The tag sits in a tray with 15 tags. |
| 13 | Section 5: a tag "for each audit result" | One tag for each run record; audit roles also write a `.log` that the tag does not draw | Two tags for each audit role would need 26 slots. |
| 14 | O16: the lockup | The lockup moves into the stage band; the origin line is "Open source · Apache-2.0" | The World stays on screen, so the first video's lockup positions (y 474–936) would cover the Blade and the history. The fork phrase names a vendor. |
| 15 | Plan section 8: "new world cues `baselineStamp`, `gate`, `runTag`, `tray`" | Four more cues: `controlLane`, `roleChip`, `gauge`, and the `reserved` run tag state; two changed cues: `tagFlip`, `archive` | The lane, the chips, and the gauge are World elements with state changes, so they need cues. |

Open points for the owner:
1. **SKILL.md and the script disagree on free-text "deferred".** `SKILL.md` says that a free-text "deferred" does not drop a task from the count. `phase_counts()` and `track_incomplete()` skip any task whose text contains "deferred". The video shows only a structural `[b]` line, which both agree on. Fix the script or the text.
2. **The `[b]` task needs a re-plan commit.** The first video completed Task 3.4 in S8. This video defers it, so the prelude adds `4c7e2b9`. It is visible in the history from O1.
3. **The first video's music.** The first video is about 127 s with recorded VO, and the jingle music stops at 112.5 s. The end of S9 and all of S10 probably have no music. Check by ear.
4. **The plan figure "131 s".** Plan section 7 calls the jingle 131 s. The music is 112.5 s. Correct the plan.
5. **The `.log` beside each audit JSON.** If the owner wants both files on screen, the tray needs a second row.
