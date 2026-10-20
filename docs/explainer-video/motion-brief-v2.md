# Measure explainer: motion design brief

Version 2, 2026-10-19. Follows `plan.md` version 4. Where this brief and the plan differ, the plan wins.

Length 110–120 s. 1920 × 1080, 60 fps. Reading Advantage brand: light canvas, one accent (Sky 400).

## 0. Decisions in brief

| Topic | Decision |
|---|---|
| Central metaphor | **The Tape**: a flat, geometric tape measure. The case is the `measure/` folder. The blade is the plan of the active track. |
| Thesis device | The blade stays on one fixed screen line for the full video. Models and harnesses change above it. Nothing on that line moves vertically. |
| Look | Reading Advantage brand. Canvas `#F5F5F7`, ink `#1e293b`, one accent: Sky 400 `#38bdf8`. Only the plan uses the accent. |
| Type | Inter Tight (display), Inter (text), JetBrains Mono (files, hashes, the band). All OFL. |
| Structure | 10 scenes, 110–120 s. Voiceover script from plan section 6. |
| Voice | `mmx speech synthesize`, model `speech-2.8-hd`, voice `English_Trustworthy_Man`. |
| Music | The Reading Advantage jingle, mixed as the daily reels do. Never synthesized. |
| End lockup | The Reading Advantage horizontal logo, a separator, then the Measure wordmark and the GitHub URL. The VO ends with "From Reading Advantage." |
| Build | Remotion 4.0.512 in `/home/daniebo/Desktop/advantage-pr`. Code in `src/measure-explainer/`. Composition `MeasureExplainer` in `src/Root.tsx`. A pure, tested function `worldAt(frame)` drives the constant layer. |
| Output | `assets/videos/2026-10-19-measure-explainer-1920x1080.mp4` |
| Effort | 19–25 person-days for one motion developer. 4–5 weeks elapsed with two review rounds. |

## 1. Facts that the video shows

The video shows only true behavior. This table links each point to its source and to its scene.

| Point | Source | Treatment |
|---|---|---|
| Project context lives in `measure/` inside the repository. Every session reads it first. | README.md, "What Measure adds" | S2: the Case and six Cards; lines from the Cards to the Head |
| A track is a `spec.md` plus a phased `plan.md`. Task markers are `[ ]`, `[~]`, `[x]`, and `[b]`. | skills/measure/SKILL.md | S3: two Cards; the plan unrolls into Phase marks and Ticks |
| One task is one failing test, then the code, then one commit with a git note. | skills/measure/assets/workflow.md, step 8 | S4: Chip, Commit, Tag |
| The agent stops at the end of each phase and waits for a human "yes". | README.md; workflow.md, checkpoint section | S5: Gate, Cursor, Pin |
| `lessons-learned.md` and `tech-debt.md` stay at 50 lines or less. | measure/lessons-learned.md:3; measure/tech-debt.md:3 | S6: line meters |
| Revert works by track, phase, or task. It uses `git revert`, so the history stays. | skills/measure/references/revert.md | S9: Blade snap, gray Commits, one new revert Commit |
| The orchestrator runs 13 roles. Each role can use its own model. Red and Green use different model families. | skills/measure-orchestrator/SKILL.md, "Model Selection" | S7c: three Heads on one plan |
| A model swap is a one-line edit of a `model:` field in a role file. | agents/measure-*.md; git commit 3ac4340 | S7a: one line in a role Card changes |
| The skills are plain markdown with no external tool dependency. | measure/tech-stack.md:5, 74–76 | S7b: one `SKILL.md` Card |
| The installer copies the skills to `~/.claude/skills` and `~/.agents/skills`. | bin/install-targets.tsv | S7b: two folder slots |
| In Claude Code, the measure-guard mod adds a plan band above the prompt and an edit guard. | mods/measure-guard/README.md | S8 |
| Band format and deny text. | `mods/measure-guard/hooks/parse.ts` `bandLine()`; `guards.ts` | S8: exact strings |
| Measure is an open-source community fork of Google's Conductor, Apache-2.0. | README.md, "Origin" | S10: origin line |

## 2. Visual concept and metaphor system

### 2.1 Candidate metaphors

**A. The Tape (selected).** The video draws a tape measure with flat shapes. The Case holds the project context. The Blade pulls out to show the plan. Ticks on the Blade are tasks. Commits hang below the Blade on thin lines. Models and harnesses work above the Blade and can change at any time. A revert retracts the Blade to a phase mark.
- Strengths: it uses the product name and the tagline. A blade is linear and ordered, like phases, tasks, and commits. The retract gives revert a clear physical action and a strong sound.
- Risk: the object can look childish. Control: never draw a realistic tape measure, a hand, or a carpenter. Use only rounded rectangles and lines.

**B. The Blueprint.** The `measure/` folder is a blueprint sheet on a drafting table. Models are drafting tools. Harnesses are different tables.
- Strengths: "spec first" is clear at once. The style is precise.
- Weaknesses: a sheet has no time axis, so tasks and commits have no natural place. Revert has no physical action. Many developer tools already use this look.

**C. The Railway.** The plan is the rails in front of a train. The model is the locomotive. The harness is the carriage.
- Strengths: progress and stations (phases) are easy to read.
- Weaknesses: "track" already means a unit of work in Measure, so "rail" and "track" will confuse viewers. Locomotive and carriage do not map clearly to model and harness. A train moves backward slowly, but a revert must be fast and exact.

### 2.2 Why The Tape

1. One object shows the thesis. The Blade sits on a fixed screen line from the end of S1 to the last frame. Everything that changes moves above it. The viewer sees the constant because it does not move.
2. All ten scenes map to a part or an action of the tape (table below).
3. The tape gives a sound signature: pull, lock click, retract snap. These sounds are cheap to record.
4. No AI vendor owns the object.

| Measure concept | Part or action of the Tape |
|---|---|
| `measure/` folder | Case (rounded square with a folder tab) |
| Track plan | Blade (Sky 400 strip) |
| Phase | Phase mark (tall tick with a number) |
| Task | Tick |
| Phase checkpoint | Pin on a Phase mark |
| Commit | Commit (ink square that hangs below a Tick) |
| Git note | Tag (paper tag on a thread from a Commit) |
| New track | The Blade pulls out of the Case |
| Archive | The finished Blade folds into a Card and goes into the Case |
| Revert | The Blade retracts to a Phase mark |
| Memory | Two Cards stored in the Case |
| Model | Head (marking unit above the Blade) |
| Harness | Frame (window around the work zone) |

### 2.3 Vocabulary

Production must use these terms with one meaning each.

| Term | Meaning |
|---|---|
| Case | The `measure/` folder stand-in. |
| Blade | The plan of the active track. A Sky 400 strip. |
| Blade line | The screen line y = 704 px. The top edge of the Blade. |
| Tick | One task on the Blade. |
| Phase mark | One phase boundary on the Blade, with its number. |
| Pin | A checkpoint on a Phase mark. |
| Marker | The `[~]` pill on the active Tick. |
| Commit | One git commit. An ink square below a Tick. |
| Tag | One git note, attached to a Commit. |
| Head | A model stand-in. |
| Frame | A harness stand-in. |
| Card | A markdown file stand-in. |
| Bar | One line of markdown inside a Card. |
| Chip | The test result indicator (FAIL or PASS). |
| Band | The measure-guard plan line above the prompt. |
| Cursor | The human stand-in. |
| World layer | The Case, the Blade, and the History lane. The constant layer. |
| Lockup | The end card: the Reading Advantage logo, the separator, the Case, the Measure wordmark, and the URL. |
| Jingle | The Reading Advantage jingle, the only music in the video. |
| Beat | One short timed part of a scene. |

### 2.4 Screen zones

The frame has three horizontal zones. Each zone has one job.

| Zone | y range (px) | Contents | Changes? |
|---|---|---|---|
| Work zone | 96–656 | Heads, Frames, Cards, Chips, text | Yes. Everything here can change. |
| Blade | 704–752 | Case, Blade, Ticks, Phase marks, Pins, Marker | Only state changes. No idle motion. |
| History lane | 784–984 | Commits, Tags, SHAs | Only additions. Nothing goes away. |

### 2.5 Three hard rules

1. **The Blade line never moves.** It stays at y = 704 px from the end of S1 to the last frame. Zooms and pull-backs use a transform origin on the Blade line. The Blade can scroll horizontally.
2. **The World layer has no idle motion.** Heads and Frames have a small idle motion (2 px float at 0.5 Hz). The World layer is fully still between state changes. Viewers read the still layer as the constant layer.
3. **The accent marks only the plan.** Sky 400 appears on the Blade, on Pins, and on the `[~]` Marker (on the Tick and in the Band). Heads, Frames, Cards, and the Cursor never use it.

## 3. Visual language

### 3.1 Palette: Reading Advantage brand, light background

The video follows the Reading Advantage brand (`advantage-pr/02-brand/visual-identity.md`). Sky 400 is the Reading Advantage product accent and the corporate default. Brand rule: an accent is a highlight only, and it never replaces the neutrals.

Use a light canvas, for three reasons:
- The end lockup uses the Reading Advantage horizontal logo, which is the light-background variant.
- A dark terminal interior then means "harness" (it changes), and the light canvas means "Measure" (it stays).
- Most AI tool videos use dark screens. A light video looks different in a feed.

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F5F5F7` | Background |
| `paper` | `#FFFFFF` | Card fill, Tag fill. At 72 % opacity with a 24 px backdrop blur: Cards over the Blade, Frame chrome. |
| `ink` | `#1e293b` (Slate 800) | Text, Ticks, strokes, Commits, terminal interior |
| `graphite` | `#64748b` | Secondary text, SHAs, inactive labels |
| `hairline` | `#cbd5e1` (Slate 300) | Card borders, Bars, grid, reverted Commits, Band text in the terminal |
| `accent` | `#38bdf8` (Sky 400) | Blade fill, Pin fill, `[~]` Marker fill |
| `accent-edge` | `#0284c7` (Sky 600) | Bottom edge of the Blade |
| `fail` | `#ef4444` | FAIL Chip only |
| `pass` | `#22c55e` | PASS Chip only |

Terminal colors use the same tokens: interior `ink`, normal text `canvas`, Band text `hairline`.

Logo colors (tile `#00aef0`, mark `#2f3192`, word `#272162`) appear only inside the logo file. Never use them for other elements.

Ghost Heads and ghost Frames are `ink` at 20–25 % opacity. They need no extra token.

Contrast:
- Ink on Sky 400: 6.8:1. Use ink for all text, Ticks, and outlines on the Blade, on Pins, and on the Marker.
- Sky 400 on canvas: 2.0:1. This is too low for a line. The accent is a fill only, never a line. Use it only as a fill that is 24 px or taller.
- Sky 600 on canvas: 3.8:1. The Blade has a 2 px ink top edge and a 2 px Sky 600 bottom edge, so the strip reads at both edges.
- White on Sky 400: 2.1:1. Never put white text on the accent.
- Ink on canvas: 13.4:1. Graphite on canvas: 4.4:1, so use graphite only at 28 px or larger.
- FAIL red on canvas: 3.5:1, for the outline and the ✕ only. The FAIL label is ink.
- Ink on PASS green: 6.4:1. White on PASS green is 2.3:1, so the ✓ and the PASS label are ink.
- Hairline on ink (Band text): 9.9:1. Canvas on ink (terminal text): 13.4:1. Ink on the Sky 400 Marker in the Band: 6.8:1.
- Red and green also use a shape code for color-blind viewers. FAIL is a hollow pill with ✕. PASS is a filled pill with ✓.

### 3.2 Typography

The owner approved this set on 2026-10-19. The brand type system is still open. The brand file says "likely a humanist sans like Inter" and names JetBrains Mono for data.

| Role | Font | Weight | Size at 1080p | Tracking | Line height |
|---|---|---|---|---|---|
| Tagline | Inter Tight | 700 | 144 px | −0.03 em | 1.0 |
| Scene title | Inter Tight | 700 | 96 px | −0.02 em | 1.05 |
| Measure wordmark (lockup) | Inter Tight | 700 | 120 px | −0.02 em | 1.0 |
| Support line | Inter | 500 | 64 px | −0.01 em | 1.15 |
| Label | Inter | 500 | 44 px | 0 | 1.2 |
| File names, SHAs, Band, URL | JetBrains Mono | 500 | 36–44 px (32 px inside a terminal) | 0 | 1.3 |
| Detail (not required reading) | JetBrains Mono or Inter | 400–500 | 28–36 px | 0 | 1.3 |

Rules:
- Text that the viewer must read is 44 px or larger. Use 28–36 px only for details, for example SHAs.
- Disable ligatures in JetBrains Mono (`fontVariantLigatures: 'none'`). If you do not, `->` becomes an arrow.
- File names stay lowercase: `measure/`, `plan.md`. Titles use sentence case. Only Chip labels use capitals.
- Show one support line at a time.

### 3.3 Iconography and stand-ins

**Icons.** Lucide, `strokeWidth={1.5}` (1.5 units on the 24-unit grid), rounded caps and joins. Six icons only: folder, file, git commit, user, check, x.

**Heads (model stand-ins).** A Head is a paper capsule, 144 × 88 px, with a 4 px ink stroke. A 3 px ink stem goes down from the Head to the Marker on the active Tick. Two small jaws at the bottom of the Head hold the stem. One 48 px glyph in the center identifies the model.

| Head | Glyph | Label |
|---|---|---|
| A | Ring | `model A` |
| B | Triangle | `model B` |
| C | Rounded square | `model C` |
| D | Pentagon | `model D` |
| E | Three horizontal bars | `model E` |

Do not use glyphs that look like vendor marks: no starbursts or asterisks, no four-point sparkles, no knots or hexagonal rosettes, no animals, no letter marks. All Heads are ink on paper. Labels use letters, not real model names.

**Frames (harness stand-ins).** A Frame is the window around the work zone, 1280 × 520 px. The four types differ by geometry only.

| Frame | Corner radius | Chrome | Prompt glyph | Label |
|---|---|---|---|---|
| F1 | 8 px | Ink title strip, 40 px, three hollow dots | `$` | `cli` |
| F2 | 24 px | Double 2 px border, left rail with three squares | `›` | `tui` |
| F3 | 16 px | Two tabs on top, file-tree column of Bars, bottom terminal strip | `▸` | `editor` |
| F4 | 32 px | Paper chrome at 72 % with blur, right rail panel, prompt pill at the bottom | none | `app` |

Do not copy real harness details: no vendor accent colors, spinners, banners, or wordmarks. Harness names appear as plain text only.

**Cards (markdown files).** White, 2 px hairline border, 16 px radius, 280 × 200 px by default. The file name is at the top in JetBrains Mono 32 px. Bars are below. Section 5.4 gives the rules.

**Cursor (human).** A plain ink arrow pointer, 48 px, with a 24 px circle badge that holds the Lucide `user` icon. It moves on curved paths.

**Marker (`[~]`).** A Sky 400 pill, 40 × 24 px, with a 2 px ink outline. It sits on the Blade line above the active Tick. The Head stem ends on it.

### 3.4 Grid and layout

- Canvas 1920 × 1080. Margins: 120 px left and right, 96 px top and bottom.
- 12 columns: 118 px column, 24 px gutter.
- 8 px base unit for all spacing.
- Case: 176 × 176 px, 32 px radius, x 120–296, centered on y 728 (the Blade center).
- Blade: starts at x 296. Maximum end x 1800 (1504 px). Height 48 px, y 704–752.
- Commit: 24 px square, 4 px radius, center at y 820, on a 2 px plumb line from the Blade bottom edge.
- Tag: 96 × 60 px. It hangs on a thread from its Commit to about y 900.
- Captions (social cut only): top safe area, y 96–176. The History lane uses the bottom of the frame.
- Lockup: section S10 gives the positions.

### 3.5 Line weights

| Element | Weight |
|---|---|
| Hairline (grid, Card border, Bar fill) | 2 px |
| Icon stroke at 64 px | 4 px (Lucide 1.5 units) |
| Head and Frame outline | 4 px |
| Open Tick `[ ]` | 3 × 16 px |
| Done Tick `[x]` | 5 × 24 px |
| Marker `[~]` | 40 × 24 px Sky 400 fill, 2 px ink outline |
| Phase mark | 5 × 32 px; number in Inter Tight 700, 28 px |
| Blade edges | 2 px ink top, 2 px Sky 600 bottom |
| Plumb line, Tag thread | 2 px ink at 60 % opacity |
| Head glyph | 5 px stroke |
| Accent | Never a line. Fill only, 24 px or taller. |

### 3.6 Motion tokens

Frame counts are at 60 fps.

| Token | Definition | Use |
|---|---|---|
| `ease.ui` | `Easing.bezier(0.16, 1, 0.3, 1)` | Entrances of Cards, text, labels. 18–30 frames. |
| `ease.exit` | `Easing.bezier(0.7, 0, 0.84, 0)` | Exits. 12–18 frames. |
| `ease.camera` | `Easing.bezier(0.65, 0, 0.35, 1)` | Pans and zooms. 36–60 frames. |
| `spring.blade` | damping 18, stiffness 120, mass 1 | Blade pull-out. Small overshoot, about 3 %. |
| `spring.drop` | damping 14 | Head arrival, Commit drop. |
| `spring.swing` | damping 7 | Tag pendulum. |
| `spring.stamp` | damping 10, stiffness 300 | Pin, recoil, the stop after a snap. |
| Stagger | 3–5 frames between siblings | Fans, Bars, Ticks. |

Rules:
- Use linear motion only for time-based draws: the drift path, meters, typing.
- Use one primary motion per zone at a time.
- Hold each new idea still for at least 1 s before the next motion starts.

## 4. Scene-by-scene breakdown

### 4.1 Timing

| # | Scene | Start | Plan length | Frames at 60 fps (plan length) |
|---|---|---|---|---|
| S1 | Teaser and drift | 0:00 | 12 s | 720 |
| S2 | The Case (`measure/`) | 0:12 | 10 s | 600 |
| S3 | A track: spec and plan | 0:22 | 11 s | 660 |
| S4 | Red, Green, Commit, Tag | 0:33 | 14 s | 840 |
| S5 | Phase checkpoint | 0:47 | 8 s | 480 |
| S6 | Memory | 0:55 | 9 s | 540 |
| S7 | Swap: model, harness, roles | 1:04 | 18 s | 1080 |
| S8 | Guard rails: the Band in Claude Code | 1:22 | 11 s | 660 |
| S9 | Revert by meaning | 1:33 | 9 s | 540 |
| S10 | Close | 1:42 | 10 s | 600 |

**Scene lengths.** The plan lengths are minimums. `calculateMetadata` measures the ten VO files and sets each scene length to the larger of two values: the plan length, or the fixed non-VO time plus the VO length plus 0.6 s. Fixed non-VO time is the S1 teaser (2.5 s), the S7c coda (3.5 s), and the S10 lockup hold (3.0 s).

The S7 and S8 lines in plan section 6 have 51 and 35 words. At about 160 words per minute, S7 is about 22.5 s and S8 is about 13.7 s. There is no cap on the total length. The voiceover sets it. With the recorded takes the total is about 127 s.

In the beat tables, times are seconds from the start of the scene, at the plan length. When the VO makes a scene longer, extend its last beat (the hold). Do not stretch the motion. S1, S7, S8, and S10 key their beats to VO phrases. Their times assume about 160 words per minute; the build syncs them to the measured VO.

### S1. Teaser and drift (plan 12 s)

On screen: a 2.5 s teaser that shows the thesis, then one agent that loses its context between sessions and drifts off course.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–2.5 | Teaser | A finished Blade at the Blade line. Heads A, B, C swap on one Tick, one every 0.6 s. Text: "Change the model. Keep the plan." | Head drop `spring.drop`; text `ease.ui` |
| 2.5 | Cut | Hard cut to an empty canvas. The jingle continues. A lock click marks the cut. | 0 frames |
| 2.5–3.5 | Frame F1 | The outline draws. The title dots fade in. | `evolvePath` 0→1, `ease.ui`, 40 frames |
| 3.5–6.5 | Head A, drift path | Head A moves toward a target ring with the label "the goal". The path wanders more as it goes. It misses the target by 160 px. Three gray context Cards float next to the Head. | Path draw linear; wander from `noise2D`; the amplitude increases with x |
| 6.5–7.1 | Session end | The Frame blinks off and on. The context Cards fall 120 px and fade. Label `session 2` in mono. | Blink with `posterize: 2`; fall `Easing.in(Easing.cubic)`, 30 frames |
| 7.1–10.0 | Head A again | The same Head A starts again from a wrong point. A second path wanders the other way. The two paths cross. | As above |
| 3.5–10.0 | Support line | "Fast code." → "Lost context." → "Drift." | `ease.ui` in, `ease.exit` out |
| On "and the work drifts" (≈10.0–12.0) | Transition | All content changes to `hairline` gray and blurs 6 px. An ink line draws from left to right across the full width at y 704. | Line `ease.camera`, 48 frames; tape pull sound |

Use the same Head in both sessions. The problem is the lost session, not the model.

Transition out: the ink line becomes the top edge of the Blade. From this frame on, the Blade line does not move.

VO (from 2.5 s): "Agents write code fast. But each session starts from zero. The plan was in the chat. Now the chat is gone, and the work drifts."

### S2. The Case (plan 10 s)

On screen: the Case appears at the left end of the line. The project context Cards fan out of it, and a new session reads them.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–0.8 | Case | Scales in at the left end of the line. Label `measure/` above it. | Scale 0.6→1, `spring.drop` |
| 0.8–3.5 | Six Cards | Fan out of the Case into the work zone, in two rows of three: `product.md`, `product-guidelines.md`, `tech-stack.md`, `workflow.md`, `code_styleguides/`, `index.md`. Each Card turns from −6° to 0°. Each Card shows one keyword in ink text; the other lines are Bars. | `Easing.spring({damping: 14})`, 30 frames each, stagger 4 frames |
| 3.5–6.0 | Commit | The Case drops one Commit into the History lane. Label: "versioned with your code". Support line: "Project context, in your repo." | `spring.drop` |
| 6.0–8.5 | Head A | Head A drops in with the label `session 3`. Six thin lines draw from the Cards to the Head. Support line: "Every session reads it first." | Lines `evolvePath`, stagger 4 frames |
| 8.5–10.0 | Cards | The Cards go back into the Case in reverse order. The Case clicks. | `ease.exit`, stagger 3 frames; click scale 1→0.94→1, 8 frames |

Transition out: the Case click starts the Blade pull-out in S3.

VO: "Measure puts the context in your repository. A measure folder holds the product, the tech stack, the workflow, and the style guides. Every session reads it first."

### S3. A track: spec and plan (plan 11 s)

On screen: a request goes into the Case. A spec and a plan come out. The plan unrolls onto the Blade as Phase marks and Ticks.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–1.5 | Request pill | "Add OAuth login" drops into the work zone. | `ease.ui` |
| 1.5–2.5 | Request pill | Moves on an arc into the tab of the Case and shrinks. The Case clicks. | `Easing.in(Easing.cubic)`, 30 frames |
| 2.5–4.5 | Two Cards | The Case ejects `spec.md` (left) and `plan.md` (right). The spec shows the keyword "Acceptance criteria" and four checkbox Bars. The plan shows three heading Bars, with 3–4 task Bars under each. Track ID label: `oauth_login_20261019`. | `ease.ui`, stagger 6 frames |
| 4.5–5.4 | Blade | Pulls out of the Case to x 1800. The Sky 400 fill appears. | `spring.blade`, 54 frames |
| 5.0–8.0 | Bars → Ticks | Each plan Bar moves on an arc to its place on the Blade. Heading Bars become Phase marks 1, 2, 3. Task Bars become Ticks. In flight, each Bar changes from horizontal (120 × 12 px) to vertical (3 × 16 px). | `ease.ui`, 30 frames each, stagger 3 frames |
| 8.0–11.0 | Labels, Head A | Labels: "spec.md — what and why", "plan.md — phases and tasks". Head A drops above Tick 1.1. The Marker appears on Tick 1.1. | `spring.drop`; Marker scale 0→1, `ease.ui`, 12 frames |

Transition out: the camera zooms to Tick 1.1, scale 1→1.8, with the origin at (Tick 1.1 x, 704). The Blade line stays at y 704. `ease.camera`, 48 frames.

VO: "Each piece of work is a track. The spec says what to build, and why. The plan splits it into phases and tasks."

### S4. Red, Green, Commit, Tag (plan 14 s)

On screen: at 1.8× zoom, Head A is above Tick 1.1. The test Card `auth.test.ts` is on the left. The code Card `auth.ts` is on the right. The Chip is between them.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–2.5 | Red | The test Card Bars type on. The Chip appears: hollow pill with a 4 px `fail` outline, a `fail` ✕, and the label "FAIL" in ink. The test Card shakes once. | Bars `scaleX` 0→1 from the left, stagger 4 frames; shake `8·sin(f·0.7)·e^(−f/6)` px, 20 frames |
| 2.5–5.0 | Green | The code Card Bars type on. The Chip flips to a filled `pass` pill with an ink ✓ and the label "PASS" in ink. | Flip `rotateY` 0→180°, 18 frames; face change at 90° |
| 5.0–7.0 | Commit | Both Cards shrink and move together to the Tick x. They merge into one Commit. The Commit drops behind the Blade into the History lane. The SHA types on: `a1c9e30`. The message is below in 28 px mono: `feat(auth): add token exchange`. | Merge `Easing.in(Easing.cubic)`, 24 frames; drop `spring.drop`, 36 frames; SHA 1 character per frame |
| 7.0–8.5 | Tag | The thread draws from the Commit. The Tag swings in and settles. The Tag flips once to show two lines: "Task 1.1 · what changed" and "why". Label: "git note: what changed, and why". | Thread `evolvePath`, 18 frames; swing −28°→0° with `spring.swing` |
| 8.5–9.5 | Tick | Tick 1.1 changes from `[~]` to `[x]`: the Marker shrinks into the thick ink Tick. | `ease.ui`, 12 frames |
| 9.5–10.1 | Camera | Zoom back to 1.0, with the origin on the Blade line. | `ease.camera`, 36 frames |
| 10.1–14.0 | Rhythm | The loop runs for Ticks 1.2, 1.3, 1.4. Each cycle is shorter: 1.6 s, 1.0 s, 0.7 s. Each Commit arrives on a jingle beat (section 7.3). The Commits and Tags make an even row. | Same motions, time-scaled |

Transition out: Head A reaches Phase mark 1 and stops hard.

VO: "The agent works one task at a time. First, a failing test. Then, the code that makes it pass. Then one commit, with a git note that says what changed and why."

### S5. Phase checkpoint (plan 8 s)

On screen: a gate stops Head A at the end of Phase 1. The human checks the work, says yes, and a Pin marks the checkpoint.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–1.0 | Gate | Phase mark 1 rises into a 4 px ink gate bar, 200 px tall. Head A touches it and recoils 12 px. | Gate `ease.ui`, 18 frames; recoil `spring.stamp` |
| 1.0–3.5 | Verification Card | Card "Verify Phase 1" with three checkbox Bars. The Cursor enters on a curve from the lower right. The three boxes tick, 12 frames apart. | Card scale 0.9→1, `ease.ui`; Cursor path `ease.camera`, 48 frames |
| 3.5–5.0 | Yes | The Cursor clicks a "Yes" pill. A ring ripples out. The gate bar goes down. | Press scale 0.92, 4 frames; ripple scale 1→2.2, opacity 0.6→0, 24 frames; gate 15 frames |
| 5.0–6.5 | Pin | A Sky 400 Pin with an ink outline stamps on Phase mark 1. Label: `[checkpoint: 5d2b7e1]`. A checkpoint Commit drops with the Tag "verified: user". | Pin scale 1.4→1, `spring.stamp` |
| 6.5–8.0 | Head A | Moves on to Phase 2. Support line: "You stay in the loop." | `ease.camera` |

Optional label at 1.0 s, 28 px mono: "measure-guard blocks Phase 2 until Phase 1 has a checkpoint."

Transition out: a fast pan to the right. The World scrolls 1200 px to the left in 48 frames, `Easing.bezier(0.7, 0, 0.3, 1)`. The Ticks get a short motion trail. Phases 2 and 3 complete in a time-lapse: Ticks change to `[x]`, Commits fill the History lane, and Pins stamp on marks 2 and 3 on jingle beats.

VO: "At the end of each phase, the agent stops, shows you how to check the work, and waits for your yes."

### S6. Memory (plan 9 s)

On screen: the finished track goes into the archive. The two memory Cards update, and the next track reads them before it starts.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–2.0 | Archive | The finished Blade lifts 16 px, folds into a thin Card `archive/oauth_login_20261019/`, and slides into the Case. The Commits stay in the History lane at 30 % opacity. | Fold: width to Card size, `ease.ui`, 36 frames |
| 2.0–5.0 | Memory Cards | `lessons-learned.md` and `tech-debt.md` rise from the Case. Each has a line meter on its right edge: "41 / 50". A new Bar writes into lessons-learned in ink; the older Bars are hairline. The meter rises to 44 / 50. One old Bar shrinks to half length and fades to 50 %. Support line: "Under 50 lines each." | Meter linear; shrink `ease.ui`, 24 frames |
| 5.0–7.0 | New track | Request pill "Add password reset". The Blade pulls out again, shorter. | `spring.blade`, 36 frames |
| 6.0–8.0 | Connectors | Two lines draw from the memory Cards to the new `plan.md` Card. Small dots move along them. One new Tick gets a small ink dot with the label "lesson applied". | `evolvePath`, 24 frames; dots `getPointAtLength`, 48 frames |
| 8.0–9.0 | Freeze | Head A works two Ticks at 4× speed. Then all motion stops. Text, 96 px: "Now change the model." | All motions ease out within 12 frames |

Transition out: the freeze holds for 0.5 s. All sound effects stop. The jingle continues. S7 starts on the next jingle beat.

VO: "When a track closes, Measure keeps what it learned: lessons and known debt, under fifty lines each. The next track reads them first."

### S7. Swap: model, harness, roles (plan 18 s, expected about 22.5 s)

On screen: the model changes, then the harness changes, then three roles on different models work on the same plan. The Blade, the Case, and the History lane do not change. This scene shows the thesis. It has three beats. The VO runs through 7a and 7b. 7c has no VO.

**7a. Model swap (≈0–6.4 s)**

| Time | VO cue | Element | Motion | Easing / timing |
|---|---|---|---|---|
| 0.0–0.6 | — | Constant brackets | Three thin ink brackets draw, with mono labels: `plan` (around the Blade), `memory` (around the Case), `history` (around the History lane). They stay to the end of S7 and never move. | `evolvePath`, 24 frames, stagger 6 frames |
| ≈0.6–1.6 | "change the model" | Head A out | The jaws open 20°. Head A rises 220 px and leaves the frame. The Marker on Tick 2.2 stays on. It does not blink. | Jaws 9 frames; rise `Easing.in(Easing.cubic)`, 24 frames |
| ≈1.6–2.4 | "The plan stays" | Head B in | Head B drops onto the same stem. The jaws close with a click. The label rolls from `model A` to `model B`. At the top right, a small role Card shows one line that changes from `model: A` to `model: B`. | `spring.drop`, 30 frames; label roll 15 frames |
| ≈2.4–4.4 | "the next task starts where the last one stopped" | Work | Head B completes Tick 2.2 with a short loop. The new Tag has a 16 px triangle glyph of its Head. Everything else about the Tag is identical. | S4 loop at 3× |
| ≈4.4–6.4 | — | Fast swaps | Heads C, D, E swap in, one per Tick, about 0.65 s each. Each makes one Commit and one Tag. The History lane stays one even row. Support line: "Change the model. The plan stays." | Same motions |

**7b. Harness swap (≈6.4–19.1 s)**

| Time | VO cue | Element | Motion | Easing / timing |
|---|---|---|---|---|
| ≈6.4–7.5 | "Change the harness." | F1 → F2 | The F1 outline un-draws while the F2 outline draws. The Head, the Cards, and the Marker do not move. The label rolls from `cli` to `tui`. | Un-draw `evolvePath` 1→0, 18 frames; draw 0→1, 24 frames, offset 6 frames |
| ≈7.5–9.8 | "Same skills, same files, same history." | F2 → F3 → F4 | One Frame swap on "same skills", one on "same files". On "same history", an ink underline draws under the `history` bracket label. The Head continues to work on Tick 2.3 during every swap. | Same as above; underline 18 frames |
| ≈9.8–12.4 | "Measure is plain markdown and skill files," | Install slots | One `SKILL.md` Card makes a copy. The two Cards slide into two slots with mono labels: `~/.claude/skills` and `~/.agents/skills`. | Offset clone, `ease.ui`, 18 frames, stagger 4 frames |
| ≈12.4–15.8 | "so it runs in any harness that supports skills:" | Small Frames | The large Frame shrinks away. Four small Frame outlines (cli, tui, editor, app) appear in a row above the slots. A dotted line connects each small Frame to the slots. | `ease.ui`, stagger 5 frames; lines `evolvePath` |
| ≈15.8–19.1 | "Claude Code, Gemini CLI, Codex CLI, OpenCode, and more." | Roster | The roster line appears under the small Frames, one name as each is spoken: "Claude Code · Gemini CLI · Codex CLI · OpenCode · Pi". "Pi" appears on "and more". Inter 500, 44 px, graphite. The names do not map to particular Frames. Support line: "Plain markdown. Any harness." | Each name `ease.ui`, 15 frames |

**7c. Roles (≈19.1–22.6 s, no VO)**

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| ≈19.1–19.6 | Clear | The small Frames, slots, and roster fade. The camera pulls back to 0.9×, with the origin on the Blade line. | `ease.exit`; `ease.camera`, 30 frames |
| ≈19.6–21.6 | Three Heads, relay | Three Heads drop above three Ticks of Phase 3: "Red · model B", "Green · model A", "Review · model C". Red writes a test, and the Chip shows FAIL. A small Card moves on an arc to Green. Green changes the Chip to PASS. A scan line from the Review Head moves across the Card. One Commit with a Tag drops. Support line: "Red and Green use different model families." | `spring.drop`, stagger 9 frames; arc 18 frames; scan 24 frames, linear |
| ≈21.6–22.6 | Hold | The Heads fade to 25 %. The World layer and the brackets stay at full strength. | `ease.ui` |

Transition out: the work-zone content fades in 18 frames. One Frame stays, and its interior fills with the dark terminal for S8.

VO: "Now, change the model. The plan stays, and the next task starts where the last one stopped. Change the harness. Same skills, same files, same history. Measure is plain markdown and skill files, so it runs in any harness that supports skills: Claude Code, Gemini CLI, Codex CLI, OpenCode, and more."

### S8. Guard rails: the Band in Claude Code (plan 11 s, expected about 13.7 s)

On screen: the core is the same in every harness. One harness adds its own guard rails. In Claude Code, the Band shows the plan above the prompt and the edit guard blocks an edit that no task covers.

The terminal Frame is 1280 × 520 px with an `ink` interior. The label above it is "Claude Code + measure-guard", 44 px. A prompt line with a block cursor is at the bottom. The Band is one line above the prompt, JetBrains Mono 32 px, `hairline`.

| Time | VO cue | Element | Motion | Easing / timing |
|---|---|---|---|---|
| ≈0.0–2.2 | "The core is the same everywhere." | Four Frames | Four small Frame outlines (cli, tui, editor, app) in a row in the work zone. A dotted line goes from each Frame down to the same Marker on the Blade. | `ease.ui`, stagger 5 frames; lines `evolvePath`, 18 frames |
| ≈2.2–5.2 | "A harness can add its own guard rails." | One Frame grows | The cli Frame grows to 1280 × 520 px and fills with the ink interior. The other three fade. Two thin `hairline` rails draw along the inside of the Frame, just above the prompt line. They mark the Band slot. The label "Claude Code + measure-guard" appears. | Grow `ease.camera`, 36 frames; rails `evolvePath`, 24 frames |
| ≈5.2–9.3 | "In Claude Code, the measure-guard mod puts the plan above the prompt," | Band assembly | Five chips lift from the Blade and move up into the Band slot: the track name, "Phase 2/3", "Task 2/4", the Marker, and the task title. The `·` separators fade in. A dotted line stays between the Band Marker and the active Tick. Support line at ≈7.0: "The plan, above the prompt." | Arcs `ease.ui`, 30 frames, stagger 5 frames |
| ≈9.3–9.7 | — | No task | The Marker leaves the Tick. The Band changes to the "no task in progress" form. | Text cross-fade, 12 frames |
| ≈9.7–11.8 | "and it stops any edit that no task covers." | Deny | A tool-call Card slides in: `Edit src/billing.ts`. A gate bar drops in front of it. The Card hits the gate and recoils 24 px. The deny text types into the terminal. | Slide `ease.ui`; gate 9 frames; recoil `spring.stamp`; text 2 characters per frame |
| ≈11.8–13.7 | — | Allow | The Marker returns to the Tick. The Band updates. The gate lifts. The Edit Card goes through. Optional: a 2 s inset of a real screen capture, cropped to the Band and the prompt. | Gate 12 frames; Card 24 frames |

Exact strings, from `mods/measure-guard/hooks/parse.ts` and `guards.ts`:

```text
Measure · Add password reset · Phase 2/3 · Task 2/4 [~] Add reset token expiry
Measure · Add password reset · Phase 2/3 · Task 2/4 [ ] Add reset token expiry · no task in progress
```

```text
measure-guard: no task in the track "Add password reset" is in progress. Mark the next task `[~]` in measure/tracks/password_reset_20261019/plan.md (Add reset token expiry). Then do the edit again. If this block is wrong, the user can run /measure-off.
```

The Band shows `[b] n` only when n is more than 0, so do not show `[b] 0`. To keep it readable, type only the first two sentences of the deny text. In the Band, the `[~]` sits on a Sky 400 pill with ink text.

Transition out: the terminal Frame moves up 40 px and fades in 24 frames. The camera shows the full Blade and the History lane.

VO: "The core is the same everywhere. A harness can add its own guard rails. In Claude Code, the measure-guard mod puts the plan above the prompt, and it stops any edit that no task covers."

### S9. Revert by meaning (plan 9 s)

On screen: the user asks to revert the last phase. Measure selects the commits for that phase. The Blade retracts, and one revert Commit is added to the history.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–1.5 | Request | Prompt pill: "revert the last phase" (the phrase is from README.md). | `ease.ui` |
| 1.5–3.0 | Contrast | A row of SHAs types in at the left, in graphite mono: `9c4e1a2 77b0d3f 3e91c55 d02aa6b …`. A strike line draws through them. "Phase 3" in ink replaces them. | Strike 18 frames; cross-fade 12 frames |
| 3.0–5.0 | Selection | An ink outline marks the Phase 3 part of the Blade. Brackets mark every Commit under it, including one plan-update Commit that is out of order. A pill: "Revert 6 commits for Phase 3?" The Cursor clicks "Yes". | `ease.ui`; Cursor as in S5 |
| 5.0–7.0 | Snap | The Blade retracts from its end to Phase mark 3. It stops hard and recoils. The Phase 3 Ticks change to `[ ]`. The Phase 3 Commits change to `hairline` but stay in place. One new revert Commit drops at the end of the History lane with the Tag "Revert Phase 3". | Retract `Easing.in(Easing.quad)`, 15 frames; recoil ±10 px, `spring.stamp`; drop `spring.drop` |
| 7.0–9.0 | Lines | Support line: "Undo by task, phase, or track." Label, 44 px: "git revert — the history stays." | `ease.ui` |

Transition out: pull back to 0.7×, with the origin on the Blade line. `ease.camera`, 48 frames. The work zone empties.

VO: "Need to undo? Ask by meaning: a task, a phase, or a whole track. Measure finds the commits and reverts them as one unit."

### S10. Close (plan 10 s)

On screen: the Case and a short Blade with ghost Heads and Frames above them. The thesis line and the tagline appear. The Blade retracts into the Case, and the Reading Advantage lockup builds around the Case.

| Time | VO cue | Element | Motion | Easing / timing |
|---|---|---|---|---|
| ≈0.0–1.0 | "Measure." | Wide | The Case and a short Blade move to the horizontal center. The Blade line stays at y 704. Five ghost Heads at 20 % and four ghost Frame outlines are above, and they change slowly. | Horizontal move `ease.camera` |
| ≈0.6–3.0 | "Same plan. Any model. Any harness." | Thesis line | "Same plan. Any model. Any harness." at 96 px. Each phrase appears with its VO words. | `ease.ui`, 18 frames per phrase |
| ≈3.0–5.0 | "Measure twice, code once." | Tagline | The thesis line fades. "Measure twice, code once." appears at 144 px. The words rise 24 px and fade in. Two ticks draw under "twice". One tick draws under "once". | `ease.ui`, stagger 4 frames per word; ticks 9 frames each |
| ≈5.0–5.5 | — | Retract | The tagline and the ghosts fade. The Blade retracts fully into the Case with a final click. | Retract `Easing.in(Easing.cubic)`, 30 frames |
| ≈5.0–6.2 | "From Reading Advantage." | Logo | The Reading Advantage logo fades in above the Case and rises 16 px. Opacity and position only. | `ease.ui`, 24 frames |
| ≈6.2–7.0 | — | Lockup | The separator draws from the center outward. The "Measure" wordmark, the URL, and the origin line fade in. | Separator `evolvePath`, 18 frames; text `ease.ui`, stagger 4 frames |
| ≈7.0–10.0 | — | Hold | The lockup holds. The jingle fades out over the last 2 s of the video. | — |

Lockup layout (center x = 960):

| Item | Specification | Position |
|---|---|---|
| Reading Advantage logo | `assets/logos/vector/horizontal/reading-advantage.svg`, 96 px tall, 258 px wide (the SVG ratio). On the light canvas. No recolor, stretch, skew, or rotation. Uniform size only. | x 831–1089, y 474–570 |
| Logo clear space | Equal to the height of the "R": 30 px at a 96 px logo height. Nothing enters this zone. | x 801–1119, y 444–600 |
| Separator | 2 px `hairline` line, 480 px wide | y 612 |
| Case | 176 × 176 px, on the Blade line (rule 1) | y 640–816, at the left of the wordmark |
| "Measure" wordmark | Inter Tight 700, 120 px, ink, 32 px right of the Case. Center the Case and the wordmark as one group. | Baseline about y 770 |
| URL | `github.com/bodangren/measure`, JetBrains Mono 500, 44 px, ink | About y 880 |
| Origin line | "Open source · Apache-2.0 · a community fork of Google's Conductor", Inter 500, 36 px, graphite | About y 936 |

The "R" measurement: the "R" of "Reading" is 157.3 units tall in the SVG, and the viewBox is 505.11 units tall. At 96 px, the "R" is 30 px. The 30 px clear space starts at the edge of the SVG box, which already has about 5 px of padding around the artwork.

VO: "Measure. Same plan. Any model. Any harness. Measure twice, code once. From Reading Advantage."

## 5. Motion techniques

### 5.1 The swap

Goal: the viewer must see that a swap changes nothing in the World layer.

1. **Socket.** The stem and the Marker are part of the World layer. The Head is part of the scene layer. A swap replaces only the Head. The stem stays, so the next Head continues at the same Tick.
2. **Stillness contrast.** During a swap, the World layer has zero motion. The outgoing Head moves fast (`Easing.in(Easing.cubic)`, 24 frames). The incoming Head arrives with `spring.drop`.
3. **Constant brackets.** Three ink brackets label `plan`, `memory`, and `history`. They draw once and stay still through every swap.
4. **Signature on the Tag.** Each Tag has a 16 px glyph of the Head that made it. The shape, size, and position of the Tag do not change. The viewer sees that the history records who did the work, and that the format stays the same.
5. **One-line edit.** In 7a, a small role Card shows the `model:` line change from `A` to `B`. The swap is one line in one file.
6. **Frame swap by redraw.** Un-draw the old Frame outline and draw the new one, in 24 frames. The center and the size stay the same, so the content stays in place. Do not slide or scale the content inside the Frame.
7. **Sound.** Only the Head makes a sound during a swap: a short magnetic clip. The jingle continues unchanged. The World layer makes no sound.

### 5.2 The Red → Green → Commit loop

1. **Stations.** Three stations are in the work zone: the test Card, the Chip, and the code Card. The Commit forms under the active Tick. The eye moves left, center, right, then down.
2. **Red.** The Bars type on, the Chip shows FAIL, and the test Card shakes once. Use a damped sine, not a spring, so that the shake is exact and short.
3. **Green.** The Chip flips on the Y axis. Change the face at 90°. The shape change (hollow to filled) and the color change occur together.
4. **Commit.** The two Cards merge into the Commit, and the Commit drops through the Blade. Render the Commit under the World layer during the drop, so that it goes behind the Blade.
5. **Rhythm.** After one full-speed cycle, repeat the loop at 1.6 s, 1.0 s, and 0.7 s per cycle. Put each Commit on a measured jingle beat. The increasing speed tells the viewer that this loop is the normal rhythm of the work.

### 5.3 The Band

1. **The Band is the Blade, seen through a harness.** Labels lift off the Blade and move into the Band slot. A dotted line connects the Band Marker to the active Tick for the whole scene.
2. **Use the real string format** from `bandLine()`. The real Band uses dim text. The only stylization in the video is the Sky 400 pill behind `[~]`.
3. **Fit the line.** Use `measureText()` from `@remotion/layout-utils` to fit the Band into 1180 px at 32 px. If the Band does not fit, use a shorter task title.
4. **Show the deny as physics.** The tool-call Card hits a gate and recoils. Then the deny text types in. The viewer sees the block before reading it.

### 5.4 Markdown without walls of text

1. **Bars, not text.** Each markdown line is a rounded Bar, 14 px tall, with a `hairline` fill. Headings are 20 px ink Bars. Checkbox lines get a 20 px square in front of the Bar.
2. **Real silhouettes.** A build script reads a real Measure plan, for example `measure/archive/measure_guard_20261004/plan.md` in the Measure repository. It writes a JSON list of line types and lengths into `src/measure-explainer/data/`. The Bar lengths follow the real lines, so each Card has a true shape. The JSON is committed, so the render does not read the Measure repository.
3. **Three real words at most.** Each Card shows at most three real words: the file name and one keyword in ink. Each Card shows at most eight Bars.
4. **Typing.** The Bars grow from the left with `scaleX` 0→1, stagger 4 frames.
5. **Bar-to-text resolve.** To show one real line, size a Bar to the real text width with `measureText()`. Cross-fade the Bar into the text at the same position, over 12 frames.
6. **Bar-to-Tick morph.** For the plan unroll in S3, animate the width, the height, and the position of each Bar together on an arc. A horizontal Bar becomes a vertical Tick.

### 5.5 Git notes

1. **Commit.** A 24 px ink square on a 2 px plumb line below its Tick. The 7-character SHA is to the right, in 28 px graphite mono.
2. **Tag.** A white paper tag, 96 × 60 px, with a 2 px hairline border and a punched hole at the top left. A thread connects it to the Commit. The thread is a quadratic curve with a 12 px sag.
3. **Attach.** Draw the thread with `evolvePath` in 18 frames. Then swing the Tag from −28° to 0° with `spring.swing`. The rotation origin is the punched hole.
4. **Read.** During a zoom, flip the Tag (`rotateY`, 18 frames) to show two lines of a real note. Example source: the note on Measure commit `25a653b` ("Verification report: Phase S5 …").
5. **Message versus note.** The short commit message prints under the Commit. The long note is on the Tag. This difference shows what a git note adds.

### 5.6 The revert snap

1. The selection outline and the brackets come first, so the viewer knows the unit before the action.
2. The Blade retracts in 15 frames with `Easing.in(Easing.quad)`. It stops hard at the Phase mark and recoils with `spring.stamp`.
3. The reverted Commits change to `hairline` and stay. One new revert Commit appears. The History lane only gets longer. This matches `git revert`.

## 6. Remotion implementation

### 6.1 Composition settings

The composition lives in the existing Remotion project at `/home/daniebo/Desktop/advantage-pr` (Remotion 4.0.512, entry `src/index.ts`, root `src/Root.tsx`). `npm run studio` opens Studio. `npm run render` runs `remotion render src/index.ts`.

| Setting | Value | Reason |
|---|---|---|
| Composition ID | `MeasureExplainer`, registered in `src/Root.tsx` | One composition next to the existing `MasteryAdvantage` |
| Size | 1920 × 1080 | Main delivery: README, website, YouTube, social feeds |
| fps | 60 | At 30 fps, thin Ticks strobe during horizontal pans. Vector scenes render fast, so 60 fps costs little. The existing composition uses 25 fps; each composition sets its own value. |
| Duration | Set by `calculateMetadata` from the VO files (section 4.1) | Target 110–120 s |
| Video | H.264, CRF 16, `yuv420p`, rendered without audio (`--muted`) | The final audio comes from the ffmpeg mix (section 7.5) |
| Output | `assets/videos/2026-10-19-measure-explainer-1920x1080.mp4` | Video-assets naming rule 9 |

Write every time as `seconds * fps`. Then a change of fps does not change the timing.

Register the composition and one composition per scene in a folder:

```tsx
// src/Root.tsx, inside RemotionRoot
<Folder name="MeasureExplainer">
  <Composition
    id="MeasureExplainer"
    component={MeasureExplainer}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    calculateMetadata={calculateMeasureMetadata}
    defaultProps={{ captions: false }}
  />
  {/* MeasureExplainer-S01 ... MeasureExplainer-S10 */}
</Folder>
```

### 6.2 Architecture: three layers

The World layer must not move during scene transitions, so it renders outside the scene sequences.

1. **Scenes, back layer.** The work-zone content of each scene.
2. **World layer.** The Case, the Blade, and the History lane. It reads only `worldAt(frame)`.
3. **Scenes, front layer.** Content that must pass in front of the Blade, for example the Bars that move onto the Blade in S3, the Band chips in S8, and the lockup in S10.

Each scene exports a `Back` component and a `Front` component. Use `<Sequence from durationInFrames>` with values from one `SCENES` table. Scenes place their actors with `toScreen(worldX)`, so that the actors follow the World zoom and scroll.

Use `TransitionSeries` only inside the work zone, if at all. A `TransitionSeries` transition overlaps two scenes and makes the total shorter. The World layer would then need the same calculation, and errors are probable.

`worldAt(frame)` is a pure function. It reads a sorted list of cues (Blade pull-out, Tick status change, Commit added, revert) and returns a `WorldState`:

```ts
type WorldState = {
  bladeLength: number;                       // px, after springs
  scrollX: number;                           // horizontal only
  zoom: { scale: number; originX: number };  // originY is always BLADE_Y
  ticks: { id: string; x: number; status: ' ' | '~' | 'x' }[];
  phaseMarks: { n: number; x: number; pinned: boolean }[];
  commits: { tickId: string; sha: string; head: Glyph; reverted: boolean; t: number }[];
};
```

You cannot edit the World values in Studio. This is intentional. Scene-local motion (Cards, text, Heads, Frames) uses inline `interpolate()` in `style`, so you can edit it in Studio. This split matches the thesis: the constant layer is locked, and the changing layer is flexible.

```tsx
export const MeasureExplainer: React.FC<{ captions: boolean }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const world = worldAt(frame);
  return (
    <AbsoluteFill style={{ backgroundColor: T.canvas }}>
      <ScenesLayer slot="back" />
      <WorldLayer world={world} />
      <ScenesLayer slot="front" />
      {captions ? <CaptionLayer /> : null}
      <PreviewSoundtrack />
    </AbsoluteFill>
  );
};
```

### 6.3 File tree

```text
advantage-pr/
  src/
    Root.tsx                     # add the MeasureExplainer <Folder> and compositions
    measure-explainer/
      MeasureExplainer.tsx
      calculateMetadata.ts       # scene lengths from the VO files (section 4.1)
      timeline.ts                # SCENES, CUES, JINGLE_BEATS_MS, in frames and ms
      theme/
        tokens.ts                # colors, sizes, BLADE_Y = 704
        fonts.ts                 # loadFont: Inter Tight, Inter, JetBrains Mono
        motion.ts                # ease.ui, ease.exit, ease.camera, spring configs
      world/
        worldAt.ts               # pure function; exports toScreen()
        worldAt.test.ts          # node --test
        WorldLayer.tsx
        Case.tsx  Blade.tsx  Tick.tsx  Marker.tsx  PhaseMark.tsx  Pin.tsx
        HistoryLane.tsx  Commit.tsx  Tag.tsx
      actors/
        Head.tsx                 # prop glyph: 'ring' | 'triangle' | 'square' | 'pentagon' | 'bars'
        Frame.tsx                # prop variant: 'cli' | 'tui' | 'editor' | 'app'
        Card.tsx  Bars.tsx  Chip.tsx  Band.tsx  Cursor.tsx  Gate.tsx  Bracket.tsx
        Lockup.tsx               # logo, clear space, separator, wordmark, URL
      scenes/
        S01Teaser.tsx ... S10Close.tsx   # each exports Back and Front
      captions/
        CaptionLayer.tsx         # social cut only
      audio/
        PreviewSoundtrack.tsx    # Studio preview: VO, jingle at 0.24, SFX
      data/
        plan-silhouette.json     # from scripts/silhouette.ts
      scripts/
        silhouette.ts            # Measure plan.md -> Bar data
        voiceover.sh             # mmx takes for S01..S10
        export-cues.ts           # timeline -> cues.json (VO starts, SFX times, in ms)
        build-mix.sh             # ffmpeg mix, the reel chain (section 7.5)
  public/
    video-assets -> ../assets/video-assets          # exists; the jingle is in music/
    brand/reading-advantage-horizontal.svg          # new symlink to ../../assets/logos/vector/horizontal/reading-advantage.svg
    voiceover/S01.mp3 ... S10.mp3                   # selected takes, with subtitle data
    sfx/                                            # foley files
  assets/videos/2026-10-19-measure-explainer-1920x1080.mp4
```

Use a symlink for the logo, so that the logo master stays the only source. Load it with `<Img src={staticFile('brand/reading-advantage-horizontal.svg')} style={{ height: 96 }} />`. Set only the height, so the SVG keeps its ratio. Do not copy the SVG paths into React.

Load the jingle with `staticFile('video-assets/music/reading-advantage-jingle.mp3')`.

### 6.4 `spring()` versus `interpolate()`

Remotion 4.0.512 in `advantage-pr` has `Easing.spring()`, the `posterize` option, and `output: 'perceptual-scale'`. Use `interpolate()` with `Easing.bezier()` or `Easing.spring()`, inline in `style`, with the `scale`, `translate`, and `rotate` CSS properties. Use `output: 'perceptual-scale'` for scale. Use raw `spring()` only where the natural settle time is acceptable.

| Motion | Method | Settings |
|---|---|---|
| Card, text, and label entrances and exits | `interpolate` + `Easing.bezier` | `ease.ui` / `ease.exit`, 12–30 frames |
| Camera pan and zoom | `interpolate` + `Easing.bezier` | `ease.camera`, 36–60 frames, originY = `BLADE_Y` |
| Drift path, meters, typing, scan line | `interpolate`, linear | — |
| Blade pull-out | `interpolate` + `Easing.spring({damping: 18})` | 54 frames, fixed for VO sync |
| Blade snap (revert) | `interpolate` + `Easing.in(Easing.quad)`, then a `spring.stamp` recoil | 15 + 18 frames |
| Head and Commit arrival | `interpolate` + `Easing.spring({damping: 14})` | 30–36 frames |
| Tag swing | raw `spring({ fps, frame, config: { damping: 7 } })` | Natural settle, about 70 frames |
| Pin stamp, gate recoil | `spring({ config: { damping: 10, stiffness: 300 } })` | 15–20 frames |
| Chip flip | `interpolate` + `ease.ui`, `rotateY` 0→180° | 18 frames |
| Fail shake | Plain math: `8 * Math.sin(f * 0.7) * Math.exp(-f / 6)` | 20 frames |
| Logo entrance | `interpolate` + `ease.ui`, opacity and `translate` only | 24 frames |

### 6.5 Libraries

Install each Remotion package with `npx remotion add <package>`, so that the version matches 4.0.512.

| Package | Use |
|---|---|
| `@remotion/paths` | `evolvePath` (outlines, threads, brackets, separator), `getPointAtLength` (dots, arcs), `interpolatePath` (Head glyph morph in the teaser) |
| `@remotion/shapes` | `makeCircle`, `makeTriangle`, `makeRect`, `makePolygon` for Head glyphs |
| `@remotion/noise` | `noise2D` for the S1 drift path |
| `@remotion/google-fonts` | Inter Tight, Inter, JetBrains Mono. Load only weights 400, 500, 700 and the latin subset. |
| `@remotion/layout-utils` | `measureText` for the Band fit and the Bar-to-text resolve |
| `@remotion/motion-blur` | `<Trail>` for the S5 → S6 fast pan only |
| `@remotion/transitions` | Optional, work zone only |
| `@remotion/captions` | Already installed. Caption type and pages for the social cut. |
| `lucide-react` | Six icons. `npm install -D lucide-react`. |
| `Audio` from `remotion` | Studio preview only. The final audio comes from ffmpeg. |

Do not use:
- **Lottie.** All shapes are simple vectors in React. Lottie adds a round trip through After Effects.
- **`@remotion/rough-notation`.** Its hand-drawn style conflicts with the flat style.
- **Three.js.** The video has no 3D.

### 6.6 Tests and check frames

Put the thesis into tests:
- The Blade top edge is at y 704 at every cue frame after S1.
- A Head swap cue changes no Tick, Phase mark, or Commit.
- In each phase, the number of `[x]` Ticks is equal to the number of non-revert Commits.
- A revert cue adds one Commit and removes none.

Run the tests with the Node test runner. Node 24 strips TypeScript types, so no build step and no new dependency is necessary:

```bash
node --test src/measure-explainer/world/worldAt.test.ts
```

Write relative imports in `worldAt.ts` and `timeline.ts` with the `.ts` extension. Import nothing other than `remotion`. Add the command to `tests/run-all.sh`, so that `npm test` runs it.

Render a check still at the key frame of each scene:

```bash
npx remotion still src/index.ts MeasureExplainer --frame=2400 --scale=0.25
```

### 6.7 Deliverables and render steps

Deliverables:
1. Master: `assets/videos/2026-10-19-measure-explainer-1920x1080.mp4`, 1080p60.
2. Captioned social cut: `assets/videos/2026-10-19-measure-explainer-captions-1920x1080.mp4`, captions burned in at the top.
3. Poster still: `assets/videos/2026-10-19-measure-explainer-poster-1920x1080.jpg`, from the S7c hold.
4. Optional 60 s cut: S1, S2, S4, S7, S8, S10.

Register each deliverable file in `assets/video-assets/index.json`.

Render steps (`out/measure-explainer/` is a work folder outside git):

```bash
# 1. Silent video
npm run render -- MeasureExplainer out/measure-explainer/video.mp4 --muted --codec=h264 --crf=16

# 2. Audio mix: the reel chain (section 7.5)
node src/measure-explainer/scripts/export-cues.ts > out/measure-explainer/cues.json
bash src/measure-explainer/scripts/build-mix.sh out/measure-explainer/cues.json out/measure-explainer/mix.wav

# 3. Mux
ffmpeg -i out/measure-explainer/video.mp4 -i out/measure-explainer/mix.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart \
  assets/videos/2026-10-19-measure-explainer-1920x1080.mp4

# 4. Social cut: render again with --props='{"captions":true}', then mux the same mix.
# 5. Poster
npx remotion still src/index.ts MeasureExplainer assets/videos/2026-10-19-measure-explainer-poster-1920x1080.jpg --frame=<S7c hold frame>
```

## 7. Voiceover and sound

### 7.1 Script

Plan section 6, word for word. One narrator, 140–150 words per minute. The voice does not change in S7, because a constant voice supports the thesis.

| Scene | Line |
|---|---|
| S1 | "Agents write code fast. But each session starts from zero. The plan was in the chat. Now the chat is gone, and the work drifts." |
| S2 | "Measure puts the context in your repository. A measure folder holds the product, the tech stack, the workflow, and the style guides. Every session reads it first." |
| S3 | "Each piece of work is a track. The spec says what to build, and why. The plan splits it into phases and tasks." |
| S4 | "The agent works one task at a time. First, a failing test. Then, the code that makes it pass. Then one commit, with a git note that says what changed and why." |
| S5 | "At the end of each phase, the agent stops, shows you how to check the work, and waits for your yes." |
| S6 | "When a track closes, Measure keeps what it learned: lessons and known debt, under fifty lines each. The next track reads them first." |
| S7 | "Now, change the model. The plan stays, and the next task starts where the last one stopped. Change the harness. Same skills, same files, same history. Measure is plain markdown and skill files, so it runs in any harness that supports skills: Claude Code, Gemini CLI, Codex CLI, OpenCode, and more." |
| S8 | "The core is the same everywhere. A harness can add its own guard rails. In Claude Code, the measure-guard mod puts the plan above the prompt, and it stops any edit that no task covers." |
| S9 | "Need to undo? Ask by meaning: a task, a phase, or a whole track. Measure finds the commits and reverts them as one unit." |
| S10 | "Measure. Same plan. Any model. Any harness. Measure twice, code once. From Reading Advantage." |

On-screen roster in S7b: "Claude Code · Gemini CLI · Codex CLI · OpenCode · Pi", with the folder names `~/.claude/skills` and `~/.agents/skills`.

### 7.2 Voice

| Item | Decision |
|---|---|
| Engine | `mmx speech synthesize`, model `speech-2.8-hd` |
| Voice | `English_Trustworthy_Man`, one narrator for the full video |
| Calls | One call per scene line, three takes each: 30 calls |
| Quota | Speech shares the daily MiniMax bucket. Get the owner's approval before the first batch. |
| Files | Takes `public/voiceover/takes/S01-t1.mp3` … `S10-t3.mp3`. Copy the selected take to `public/voiceover/S01.mp3` … `S10.mp3`. |
| Scene lengths | `calculateMetadata` reads the ten selected files and sets the scene lengths (section 4.1). |

One call, as in `scripts/daily-reel/build_audio.sh`:

```bash
mmx speech synthesize --model speech-2.8-hd --voice English_Trustworthy_Man \
  --language English --text "<S01 line>" --subtitles \
  --out public/voiceover/takes/S01-t1.mp3 --quiet
```

`--subtitles` gives the timing data for the captions (section 7.6). Listen to the three takes of each line and pick one. Keep the same `--speed` value for all lines (section 4.1).

### 7.3 Music

| Item | Decision |
|---|---|
| File | `assets/video-assets/music/reading-advantage-jingle.mp3`, 131 s, 48 kHz stereo. It covers the full video. |
| Rule | Do not synthesize music. |
| Level | Volume 0.24, from 0 s. |
| Ducking | Sidechain compression, keyed by the voice stem, ratio 6: `sidechaincompress=threshold=0.02:ratio=6:attack=30:release=450:makeup=1`, as in the daily reels. |
| End | Trim the jingle at the video end. Fade it out over the last 2 s: `afade=t=out:st=<duration − 2>:d=2`. |
| Studio preview | `PreviewSoundtrack` plays the jingle at 0.24 with no sidechain. The ffmpeg mix makes the final audio. |

**Beat sync.** Do not assume a tempo. Measure the beat times of the jingle with a beat tracker, for example `aubio beat` or `librosa.beat.beat_track`. Check the result by ear in Studio. Store the beat times in `timeline.ts` as `JINGLE_BEATS_MS`. The jingle starts at 0 s, so its beat times are also video times. Snap these cues to the nearest beat:
- The Commits in the S4 rhythm.
- The Pins in the S5 time-lapse.
- The S7 start after the S6 freeze.

If a section change in the jingle falls within 1 s of a scene cut, move the cut to the section change.

### 7.4 Sound effects

The tape sounds are the signature. Record them as foley. You need one tape measure, a phone or a small recorder, a quiet room, and 20 minutes. Record the pull-out, the lock click, a slow retract, and a fast retract with a hard stop. If recording is not possible, use Freesound.org with the CC0 filter. Put the files in `public/sfx/`.

| Event | Sound | Level below VO peak |
|---|---|---|
| S1 line draw, Blade pull-out | Tape pull (ratchet) | −8 dB |
| Case click, Head jaws close, S1 cut | Lock click | −10 dB |
| Revert snap | Fast retract + hard stop | −4 dB (the loudest SFX) |
| Tick print | Muted wood tick | −16 dB |
| FAIL | Low muted thud, not a buzzer | −12 dB |
| PASS | Two soft rising notes | −12 dB |
| Commit drop | Paper stamp | −10 dB |
| Tag swing | Paper flutter | −16 dB |
| Pin stamp | Deep thunk | −8 dB |
| Cursor click | Mouse click (foley or Freesound CC0) | −12 dB |
| Head swap | Short magnetic clip | −10 dB |
| Gate deny | Muted clunk | −8 dB |

### 7.5 Mix

`build-mix.sh` follows the chain of `scripts/daily-reel/build_audio.sh`. `export-cues.ts` gives the VO start times and the SFX times in milliseconds.

1. **Voice stem.** Place each VO file at its scene start with `adelay=<ms>|<ms>` and then `asetpts=N/SR/TB`. Without `asetpts`, ffmpeg drops the delay and the lines play early. Mix the ten lines and apply `loudnorm=I=-16:TP=-2:LRA=11`. The voice stem is −16 LUFS.
2. **Jingle.** `volume=0.24`, then `sidechaincompress` keyed by the voice stem (ratio 6), then the 2 s fade at the end.
3. **SFX bus.** Place each SFX file with `adelay` and `asetpts=N/SR/TB`, at the levels in section 7.4.
4. **Sum.** `amix=normalize=0` of the voice stem, the ducked jingle, and the SFX bus.
5. **Master.** Two-pass `loudnorm` to −14 LUFS integrated, −1 dBTP. AAC 320 kbps, 48 kHz, in the mux step (section 6.7).

### 7.6 Captions

- Make the captions from the `--subtitles` data of the selected takes. Add each scene start to its timings. Convert the result to the `Caption` type of `@remotion/captions`.
- Social cut: burn in at the top safe area, Inter 500, 44 px, ink on a paper pill at 72 % opacity.
- YouTube: upload an SRT file. Do not burn in.

## 8. Production effort

This estimate is for one experienced motion developer who knows React and Remotion.

| Phase | Work | Person-days |
|---|---|---|
| Pre-production | 5 styleframes (S2, S4, S7, S8, S10), VO takes after quota approval, timed animatic | 3–4 |
| System | Tokens, fonts, `worldAt` with tests, World layer, Head, Frame, Card, Bars, Chip, Band, Cursor, Gate, Lockup | 4–5 |
| Scenes | S4 and S7: 1.5 days each. The other 8 scenes: 0.5–1 day each. | 7–9 |
| Audio | Take selection, beat measurement, foley, ffmpeg mix | 2 |
| Review | Two rounds of notes | 2–3 |
| Deliverables | Captions, poster, social cut, index entries | 1–2 |
| **Total** | | **19–25** (4–5 weeks elapsed) |

Options:
- **60 s cut** (S1, S2, S4, S7, S8, S10 only): 12–14 days.
- **AI-assisted code.** An agent can write most components and scenes. This can decrease the code work by 30–40 %. Direction, styleframes, review, and audio stay human work.

Build order: styleframes, then the VO and the animatic, then `worldAt` with its tests, then the scenes, S4 and S7 first.

## 9. Rules for accuracy and brand voice

1. **No vendor logos, vendor colors, or real model names on screen.** Models and harnesses appear as abstract stand-ins with letter labels. Harness names appear as plain text only.
2. **Revert adds commits.** The video must not show commits that disappear.
3. **No SF Pro font.** Its license does not allow use in a published video.
4. **Banned words** (`02-brand/brand-guidelines.md`): "guaranteed", "leading", "#1", "best", "revolutionary", "disruptive", "game-changing", and any unsourced percentage claim. They must not appear in the script or in on-screen text. Run `npm run lint` in `advantage-pr` on the final script. Write the Reading Advantage name in full. Never "RA".
