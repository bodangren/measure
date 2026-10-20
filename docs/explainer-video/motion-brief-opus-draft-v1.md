The brief is below. I read README.md, measure/product.md, measure/product-guidelines.md, measure/workflow.md, skills/measure/SKILL.md, skills/measure-orchestrator/SKILL.md, all agents/*.md headers, the measure-guard mod (README, DESIGN.md, parse.ts, guards.ts), an archived plan.md, lessons-learned.md, and the git notes. I changed no files.

Findings that affected the brief:
- The project already has a brand in `measure/product-guidelines.md` ("Measure Cinematic"): canvas `#F5F5F7`, ink `#1D1D1F`, accent `#0071E3`, SF Pro, spring motion. The brief keeps the canvas, the ink, the glass and the spring motion. It changes two things. SF Pro's license does not allow its use in a video. The accent changes for the metaphor and to stay neutral to all vendors. The accent is one token, so it is easy to set back to blue.
- `git revert` creates new commits, so the video must show that the history stays. It must not show commits that disappear.
- The band string and the deny text are quoted exactly from `parse.ts` and `guards.ts`.
- The orchestrator rule "Red and Green use different model families" gives the strongest proof of the thesis.
- There is one mismatch in the repo. The orchestrator SKILL.md says role files do not pin a model, but each `agents/measure-*.md` has a `model:` line.
- `extensions/measure-status/` (an OpenChamber band) is untracked. The video must not show it yet.

---

# Measure explainer: motion design brief

Version 1, 2026-10-19. Length 112 s. 1920 × 1080, 60 fps. Light canvas, one accent.

## 0. Decisions in brief

| Topic | Decision |
|---|---|
| Central metaphor | **The Tape**: a flat, geometric tape measure. The case is the `measure/` folder. The yellow blade is the plan of the active track. |
| Thesis device | The blade stays on one fixed screen line for the full video. Models and harnesses change above it. Nothing on that line moves vertically. |
| Look | Light canvas `#F5F5F7`, ink `#1D1D1F`, one accent: blade yellow `#F2BE22`. Only the plan uses the accent. |
| Type | Inter Tight (display), Inter (text), JetBrains Mono (files, hashes, the band). All OFL. |
| Structure | 10 scenes, 112 s, about 250 words of voiceover. |
| Build | Remotion 4. A pure, tested function `worldAt(frame)` drives the constant layer. Scenes drive only the changing layer. |
| Effort | 19–25 person-days for one motion developer. 4–5 weeks elapsed with two review rounds. |

## 1. Repository facts that the video shows

The video must show only true behavior. This table links each on-screen claim to its source.

| On-screen claim | Source | Visual treatment |
|---|---|---|
| Context lives in `measure/` inside the repo | README.md, "What Measure adds" | The Case and its Cards |
| Track = `spec.md` + phased `plan.md`; ID format `shortname_YYYYMMDD` | README.md, product-guidelines.md | Two Cards; the plan unrolls into Ticks |
| Task markers `[ ]` `[~]` `[x]` `[b]` | SKILL.md, measure-guard README | Tick states |
| One Red–Green cycle, one commit, one git note per task | workflow.md step 8 (`git notes add -m`) | Chip, Commit, Tag |
| A done task gets its 7-character SHA; a phase heading gets `[checkpoint: <sha>]` | workflow.md, archived plan.md | Commit SHA, Pin label |
| The agent stops at each phase and waits for a human "yes" | README.md, workflow.md | Gate, Cursor, Pin |
| measure-guard denies a phase start with no checkpoint | measure-guard README, "Closeout guard" | Optional label in S5 |
| lessons-learned.md and tech-debt.md stay under 50 lines | README.md | Line meter on two Cards |
| Revert by track, phase, or task with `git revert` (new commits, history kept) | references/revert.md section 4 | Blade snap, gray Commits, one new revert Commit |
| Red and Green roles use different model families | measure-orchestrator SKILL.md, "Model Selection" | Three Heads in S7c |
| Skills install to `~/.claude/skills` and `~/.agents/skills`; roles install to `~/.agents/agents` | bin/install-targets.tsv | Copy slots in S7b |
| Band format and deny text | `mods/measure-guard/hooks/parse.ts` `bandLine()`, `guards.ts` line 58 | S8 terminal |

## 2. Visual concept and metaphor system

### 2.1 Candidate metaphors

**A. The Tape (recommended).** The video draws a tape measure with flat shapes. The Case holds the project context. The Blade pulls out to show the plan. Ticks on the Blade are tasks. Commits hang below the Blade on thin lines. Models and harnesses work above the Blade and can change at any time. A revert retracts the Blade to a phase mark.
- Strengths: it uses the product name and the tagline. A blade is linear and ordered, like phases, tasks, and commits. The retract gives revert a clear physical action and a strong sound.
- Risk: the object can look childish. Control: never draw a realistic tape measure, a hand, or a carpenter. Use only rounded rectangles and lines.

**B. The Blueprint.** The `measure/` folder is a blueprint sheet on a drafting table. Models are drafting tools. Harnesses are different tables.
- Strengths: "spec first" is clear at once. The style is precise.
- Weaknesses: a sheet has no time axis, so tasks and commits have no natural place. Revert has no physical action. Blueprint blue moves the palette toward Google blue. Many developer tools already use this look.

**C. The Railway.** The plan is the rails in front of a train. The model is the locomotive. The harness is the carriage.
- Strengths: progress and stations (phases) are easy to read.
- Weaknesses: "track" already means a unit of work in Measure, so "rail" and "track" will confuse viewers. Locomotive and carriage do not map clearly to model and harness. A train moves backward slowly, but a revert must be fast and exact.

### 2.2 Why The Tape

1. One object shows the thesis. The Blade sits on a fixed screen line from the end of S1 to the last frame. Everything that changes moves above it. The viewer sees the constant because it does not move.
2. All ten required topics map to a part or an action of the tape (table below).
3. The tape gives a sound signature: pull, lock click, retract snap. These sounds are cheap to record.
4. No AI vendor owns the object.

| Measure concept | Part or action of the Tape |
|---|---|
| `measure/` folder | Case (rounded square with a folder tab) |
| Track plan | Blade (yellow strip) |
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
| Blade | The plan of the active track. A yellow strip. |
| Blade line | The screen line y = 704 px. The top edge of the Blade. |
| Tick | One task on the Blade. |
| Phase mark | One phase boundary on the Blade, with its number. |
| Pin | A checkpoint on a Phase mark. |
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
| Beat | One short timed part of a scene. |

### 2.4 Screen zones

The frame has three horizontal zones. Each zone has one job.

| Zone | y range (px) | Contents | Changes? |
|---|---|---|---|
| Work zone | 96–656 | Heads, Frames, Cards, Chips, text | Yes. Everything here can change. |
| Blade | 704–752 | Case, Blade, Ticks, Phase marks, Pins | Only state changes. No idle motion. |
| History lane | 784–984 | Commits, Tags, SHAs | Only additions. Nothing goes away. |

### 2.5 Three hard rules

1. **The Blade line never moves.** It stays at y = 704 px from the end of S1 to the last frame. Zooms and pull-backs use a transform origin on the Blade line. The Blade can scroll horizontally.
2. **The World layer has no idle motion.** Heads and Frames have a small idle motion (2 px float at 0.5 Hz). The World layer is fully still between state changes. Viewers read the still layer as the constant layer.
3. **Yellow marks only the plan.** The accent appears on the Blade, on Pins, on the `[~]` in the Band, and as keyword tints in Cards. Heads, Frames, and the Cursor never use yellow.

## 3. Visual language

### 3.1 Palette: light background

Use a light canvas, for three reasons:
- The brand in `measure/product-guidelines.md` ("Measure Cinematic") uses canvas `#F5F5F7` and ink `#1D1D1F`. The video keeps both.
- A dark terminal interior then means "harness" (it changes), and the light canvas means "Measure" (it stays).
- Most AI tool videos use dark screens. A light video looks different in a feed.

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F5F5F7` | Background (from product-guidelines.md) |
| `paper` | `#FFFFFF` | Card fill, Tag fill |
| `glass` | `rgba(255,255,255,0.72)` + 24 px backdrop blur | Cards over the Blade, Frame chrome (from product-guidelines.md) |
| `ink` | `#1D1D1F` | Text, Ticks, strokes, Commits (from product-guidelines.md) |
| `graphite` | `#6E6E73` | Secondary text, SHAs, inactive labels |
| `hairline` | `#D2D2D7` | Card borders, Bars, grid |
| `mist` | `#E8E8ED` | Ghost Heads, reverted Commits, disabled state |
| `blade` (accent) | `#F2BE22` | Blade fill, Pin fill, Band `[~]` |
| `blade-edge` | `#C99A12` | Bottom edge of the Blade |
| `blade-tint` | `#FBEBB5` | Highlight behind one keyword in a Card |
| `fail` | `#C93C3C` | FAIL Chip only |
| `pass` | `#23845A` | PASS Chip only |
| `term-bg` | `#1D1D1F` | Terminal interior |
| `term-text` | `#F5F5F7` | Terminal text |
| `term-dim` | `#8E8E93` | Band text (the real band uses dim text) |

**Accent argument.** The product guidelines name `#0071E3` ("Apple Blue") as the primary color. The video changes the accent for two reasons. First, blade yellow is part of the tape metaphor. Second, a blue that is close to Google blue weakens a vendor-neutral message from a fork of Google's Conductor. The accent is one token. For strict brand continuity, set `blade` to `#0071E3` and `blade-edge` to `#0058B0`.

Contrast:
- Ink on blade yellow: 9.8:1. Use ink for all text and Ticks on the Blade.
- Blade yellow on canvas: 1.6:1. This is too low for lines. Use yellow only as a fill that is 24 px or taller. The Blade gets a 2 px ink top edge.
- White on `fail`: 5.0:1. White on `pass`: 4.6:1. Graphite on canvas: 4.6:1. `term-dim` on `term-bg`: 5.2:1.
- Red and green also use a shape code for color-blind viewers. FAIL is a hollow pill with ✕. PASS is a filled pill with ✓.

Do not use colors that look like vendor colors: coral orange (Anthropic), blue-to-violet gradients (Gemini), black with teal (OpenAI).

### 3.2 Typography

The guidelines name SF Pro. The SF Pro license allows use only in mock-ups of Apple platform interfaces, so a published video cannot use it. Inter Tight and Inter are the closest open fonts.

| Role | Font | Weight | Size at 1080p | Tracking | Line height |
|---|---|---|---|---|---|
| Tagline | Inter Tight | 700 | 144 px | −0.03 em | 1.0 |
| Scene title | Inter Tight | 700 | 96 px | −0.02 em | 1.05 |
| Support line | Inter | 500 | 64 px | −0.01 em | 1.15 |
| Label | Inter | 500 | 44 px | 0 | 1.2 |
| File names, SHAs, Band | JetBrains Mono | 500 | 36–44 px (32 px inside a terminal) | 0 | 1.3 |
| Detail (decoration only) | JetBrains Mono | 400 | 28 px | 0 | 1.3 |

Rules:
- Text that the viewer must read is 44 px or larger. Use 28–36 px only for decoration, for example SHAs.
- Disable ligatures in JetBrains Mono (`fontVariantLigatures: 'none'`). If you do not, `->` becomes an arrow.
- File names stay lowercase: `measure/`, `plan.md`. Titles use sentence case. Only Chip labels use capitals.
- Show one support line at a time.
- Alternative pair for a developer-tool look: Geist and Geist Mono (OFL).

### 3.3 Iconography and stand-ins

**Icons.** Outline style, rounded caps and joins, 24-unit grid. Use Lucide (ISC license) with `strokeWidth={1.5}`. Use icons only for: folder, file, git commit, user, check, x.

**Heads (model stand-ins).** A Head is a paper capsule, 144 × 88 px, with a 4 px ink stroke. A 3 px ink stem goes down from the Head to the active Tick. Two small jaws at the bottom of the Head hold the stem. One 48 px glyph in the center identifies the model.

| Head | Glyph | Label |
|---|---|---|
| A | Ring | `model A` |
| B | Triangle | `model B` |
| C | Rounded square | `model C` |
| D | Pentagon | `model D` |
| E | Three horizontal bars | `model E` |

Do not use glyphs that look like vendor marks: no starbursts or asterisks (Anthropic), no four-point sparkles (Gemini), no knots or hexagonal rosettes (OpenAI), no animals, no letter marks. All Heads are ink on paper. Labels use letters, not real model names.

**Frames (harness stand-ins).** A Frame is the window around the work zone, 1280 × 520 px. The four types differ by geometry, not by color.

| Frame | Corner radius | Chrome | Prompt glyph | Label |
|---|---|---|---|---|
| F1 | 8 px | Ink title strip, 40 px, three hollow dots | `$` | `cli` |
| F2 | 24 px | Double 2 px border, left rail with three squares | `›` | `tui` |
| F3 | 16 px | Two tabs on top, file-tree column of Bars, bottom terminal strip | `▸` | `editor` |
| F4 | 32 px | Glass chrome, right rail panel, prompt pill at the bottom | none | `app` |

Do not copy real harness details: no orange accent or star spinner (Claude Code), no gradient ASCII banner (Gemini CLI), no `>_` mark (Codex CLI), no block wordmark (OpenCode). Scene 8 names Claude Code in a text label only.

**Cards (markdown files).** White, 2 px hairline border, 16 px radius, 280 × 200 px by default. The file name is at the top in JetBrains Mono 32 px. Bars are below. Section 5.4 gives the rules.

**Cursor (human).** A plain ink arrow pointer, 48 px, with a 24 px circle badge that holds the Lucide `user` icon. It moves on curved paths.

### 3.4 Grid and layout

- Canvas 1920 × 1080. Margins: 120 px left and right, 96 px top and bottom.
- 12 columns: 118 px column, 24 px gutter.
- 8 px base unit for all spacing.
- Case: 176 × 176 px, 32 px radius, x 120–296, centered on y 728 (the Blade center).
- Blade: starts at x 296. Maximum end x 1800 (1504 px). Height 48 px, y 704–752.
- Commit: 24 px square, 4 px radius, center at y 820, on a 2 px plumb line from the Blade bottom edge.
- Tag: 96 × 60 px. It hangs on a thread from its Commit to about y 900.
- Captions (social cut only): top safe area, y 96–176. The History lane uses the bottom of the frame.

### 3.5 Line weights

| Element | Weight |
|---|---|
| Hairline (grid, Card border, Bar fill) | 2 px |
| Icon stroke at 64 px | 3 px |
| Head and Frame outline | 4 px |
| Open Tick `[ ]` | 3 × 16 px |
| Done Tick `[x]` | 5 × 24 px |
| In-progress Tick `[~]` | 2 px ink rounded box around the Tick, 40 × 56 px |
| Phase mark | 5 × 32 px; number in Inter Tight 700, 28 px |
| Blade top edge | 2 px ink |
| Plumb line, Tag thread | 2 px ink at 60 % opacity |
| Head glyph | 5 px stroke |
| Accent | Never as a line. Fill only, 24 px or taller. |

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

| # | Scene | In | Out | Seconds | Frames at 60 fps |
|---|---|---|---|---|---|
| S1 | Teaser and drift | 0:00 | 0:12 | 12 | 0–720 |
| S2 | The Case (`measure/`) | 0:12 | 0:22 | 10 | 720–1320 |
| S3 | A track: spec and plan | 0:22 | 0:33 | 11 | 1320–1980 |
| S4 | Red, Green, Commit, Tag | 0:33 | 0:47 | 14 | 1980–2820 |
| S5 | Phase checkpoint | 0:47 | 0:55 | 8 | 2820–3300 |
| S6 | Memory | 0:55 | 1:04 | 9 | 3300–3840 |
| S7 | Swap: model, harness, roles | 1:04 | 1:22 | 18 | 3840–4920 |
| S8 | The Band in Claude Code | 1:22 | 1:33 | 11 | 4920–5580 |
| S9 | Revert by meaning | 1:33 | 1:42 | 9 | 5580–6120 |
| S10 | Close | 1:42 | 1:52 | 10 | 6120–6720 |

Total: 112 s, 6720 frames. The final voiceover sets the exact scene lengths (section 6.1). In the beat tables, times are seconds from the start of the scene.

### S1. Teaser and drift (12 s)

On screen: a 2.5 s teaser that shows the thesis, then one agent that loses its context between sessions and drifts off course.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–2.5 | Teaser | A finished Blade at the Blade line. Heads A, B, C swap on one Tick, one every 0.6 s. Text: "Change the model. Keep the plan." | Head drop `spring.drop`; text `ease.ui` |
| 2.5 | Cut | Hard cut to an empty canvas. One music hit. | 0 frames |
| 2.5–3.5 | Frame F1 | The outline draws. The title dots fade in. | `evolvePath` 0→1, `ease.ui`, 40 frames |
| 3.5–6.5 | Head A, drift path | Head A moves toward a target ring with the label "the goal". The path wanders more as it goes. It misses the target by 160 px. Three gray context Cards float next to the Head. | Path draw linear; wander from `noise2D`; the amplitude increases with x |
| 6.5–7.1 | Session end | The Frame blinks off and on. The context Cards fall 120 px and fade. Label `session 2` in mono. | Blink with `posterize: 2`; fall `Easing.in(Easing.cubic)`, 30 frames |
| 7.1–10.0 | Head A again | The same Head A starts again from a wrong point. A second path wanders the other way. The two paths cross. | As above |
| 3.5–10.0 | Support line | "Fast code." → "Lost context." → "Drift." | `ease.ui` in, `ease.exit` out |
| 10.0–12.0 | Transition | All content changes to `mist` and blurs 6 px. An ink line draws from left to right across the full width at y 704. | Line `ease.camera`, 48 frames; ratchet sound |

Use the same Head in both sessions. The problem is the lost session, not the model. A model change in S1 would contradict the thesis.

Transition out: the ink line becomes the top edge of the Blade. From this frame on, the Blade line does not move.

VO: "Agents write code fast. But each session starts from zero. The plan was in the chat. Now the chat is gone, and the work drifts."

### S2. The Case (10 s)

On screen: the Case appears at the left end of the line. The project context Cards fan out of it, and a new session reads them.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–0.8 | Case | Scales in at the left end of the line. Label `measure/` above it. | Scale 0.6→1, `spring.drop` |
| 0.8–3.5 | Six Cards | Fan out of the Case into the work zone, in two rows of three: `product.md`, `product-guidelines.md`, `tech-stack.md`, `workflow.md`, `code_styleguides/`, `index.md`. Each Card turns from −6° to 0°. One keyword per Card has a `blade-tint` highlight. | `Easing.spring({damping: 14})`, 30 frames each, stagger 4 frames |
| 3.5–6.0 | Commit | The Case drops one Commit into the History lane. Label: "versioned with your code". Support line: "Project context, in your repo." | `spring.drop` |
| 6.0–8.5 | Head A | Head A drops in with the label `session 3`. Six thin lines draw from the Cards to the Head. Support line: "Every session reads it first." | Lines `evolvePath`, stagger 4 frames |
| 8.5–10.0 | Cards | The Cards go back into the Case in reverse order. The Case clicks. | `ease.exit`, stagger 3 frames; click scale 1→0.94→1, 8 frames |

Transition out: the Case click starts the Blade pull-out in S3.

VO: "Measure puts the context in your repository. A measure folder holds the product, the tech stack, the workflow, and the style guides. Every session reads it first."

### S3. A track: spec and plan (11 s)

On screen: a request goes into the Case. A spec and a plan come out. The plan unrolls onto the Blade as Phase marks and Ticks.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–1.5 | Request pill | "Add OAuth login" drops into the work zone. | `ease.ui` |
| 1.5–2.5 | Request pill | Moves on an arc into the tab of the Case and shrinks. The Case clicks. | `Easing.in(Easing.cubic)`, 30 frames |
| 2.5–4.5 | Two Cards | The Case ejects `spec.md` (left) and `plan.md` (right). The spec shows the keyword "Acceptance criteria" and four checkbox Bars. The plan shows three heading Bars, with 3–4 task Bars under each. Track ID label: `oauth_login_20261019`. | `ease.ui`, stagger 6 frames |
| 4.5–5.4 | Blade | Pulls out of the Case to x 1800. | `spring.blade`, 54 frames |
| 5.0–8.0 | Bars → Ticks | Each plan Bar moves on an arc to its place on the Blade. Heading Bars become Phase marks 1, 2, 3. Task Bars become Ticks. In flight, each Bar changes from horizontal (120 × 12 px) to vertical (3 × 16 px). | `ease.ui`, 30 frames each, stagger 3 frames |
| 8.0–11.0 | Labels, Head A | Labels: "spec.md — what and why", "plan.md — phases and tasks". Head A drops above Tick 1.1. Tick 1.1 changes to `[~]`. | `spring.drop` |

Transition out: the camera zooms to Tick 1.1, scale 1→1.8, with the origin at (Tick 1.1 x, 704). The Blade line stays at y 704. `ease.camera`, 48 frames.

VO: "Each piece of work is a track. The spec says what to build, and why. The plan splits it into phases and tasks."

### S4. Red, Green, Commit, Tag (14 s)

On screen: at 1.8× zoom, Head A is above Tick 1.1. The test Card `auth.test.ts` is on the left. The code Card `auth.ts` is on the right. The Chip is between them.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–2.5 | Red | The test Card Bars type on. The Chip appears: hollow `fail` outline, ✕, "FAIL". The test Card shakes once. | Bars `scaleX` 0→1 from the left, stagger 4 frames; shake `8·sin(f·0.7)·e^(−f/6)` px, 20 frames |
| 2.5–5.0 | Green | The code Card Bars type on. The Chip flips to filled `pass`, ✓, "PASS". | Flip `rotateY` 0→180°, 18 frames; face change at 90° |
| 5.0–7.0 | Commit | Both Cards shrink and move together to the Tick x. They merge into one Commit. The Commit drops behind the Blade into the History lane. The SHA types on: `a1c9e30`. The message is below in 28 px mono: `feat(auth): add token exchange`. | Merge `Easing.in(Easing.cubic)`, 24 frames; drop `spring.drop`, 36 frames; SHA 1 character per frame |
| 7.0–8.5 | Tag | The thread draws from the Commit. The Tag swings in and settles. The Tag flips once to show two lines: "Task 1.1 · what changed" and "why". Label: "git note: what changed, and why". | Thread `evolvePath`, 18 frames; swing −28°→0° with `spring.swing` |
| 8.5–9.5 | Tick | Tick 1.1 changes from `[~]` to `[x]`. | `ease.ui`, 12 frames |
| 9.5–10.1 | Camera | Zoom back to 1.0, with the origin on the Blade line. | `ease.camera`, 36 frames |
| 10.1–14.0 | Rhythm | The loop runs for Ticks 1.2, 1.3, 1.4. Each cycle is shorter: 1.6 s, 1.0 s, 0.7 s. Each Commit arrives on a music downbeat. The Commits and Tags make an even row. | Same motions, time-scaled |

Transition out: Head A reaches Phase mark 1 and stops hard.

VO: "The agent works one task at a time. First, a failing test. Then, the code that makes it pass. Then one commit, with a git note that says what changed and why."

### S5. Phase checkpoint (8 s)

On screen: a gate stops Head A at the end of Phase 1. The human checks the work, says yes, and a Pin marks the checkpoint.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–1.0 | Gate | Phase mark 1 rises into a 4 px ink gate bar, 200 px tall. Head A touches it and recoils 12 px. | Gate `ease.ui`, 18 frames; recoil `spring.stamp` |
| 1.0–3.5 | Verification Card | Card "Verify Phase 1" with three checkbox Bars. The Cursor enters on a curve from the lower right. The three boxes tick, 12 frames apart. | Card scale 0.9→1, `ease.ui`; Cursor path `ease.camera`, 48 frames |
| 3.5–5.0 | Yes | The Cursor clicks a "Yes" pill. A ring ripples out. The gate bar goes down. | Press scale 0.92, 4 frames; ripple scale 1→2.2, opacity 0.6→0, 24 frames; gate 15 frames |
| 5.0–6.5 | Pin | A yellow Pin stamps on Phase mark 1. Label: `[checkpoint: 5d2b7e1]`. A checkpoint Commit drops with the Tag "verified: user". | Pin scale 1.4→1, `spring.stamp` |
| 6.5–8.0 | Head A | Moves on to Phase 2. Support line: "You stay in the loop." | `ease.camera` |

Optional label at 1.0 s, 28 px mono: "measure-guard blocks Phase 2 until Phase 1 has a checkpoint." This statement is true in `guard` mode.

Transition out: a fast pan to the right. The World scrolls 1200 px to the left in 48 frames, `Easing.bezier(0.7, 0, 0.3, 1)`. The Ticks get a short motion trail. Phases 2 and 3 complete in a time-lapse: Ticks change to `[x]`, Commits fill the History lane, and Pins stamp on marks 2 and 3.

VO: "At the end of each phase, the agent stops, shows you how to check the work, and waits for your yes."

### S6. Memory (9 s)

On screen: the finished track goes into the archive. The two memory Cards update, and the next track reads them before it starts.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–2.0 | Archive | The finished Blade lifts 16 px, folds into a thin Card `archive/oauth_login_20261019/`, and slides into the Case. The Commits stay in the History lane at 30 % opacity. | Fold: width to Card size, `ease.ui`, 36 frames |
| 2.0–5.0 | Memory Cards | `lessons-learned.md` and `tech-debt.md` rise from the Case. Each has a line meter on its right edge: "41 / 50". A new Bar writes into lessons-learned with a `blade-tint` highlight. The meter rises to 44 / 50. One old Bar shrinks to half length and fades to 50 %. Support line: "Under 50 lines each." | Meter linear; shrink `ease.ui`, 24 frames |
| 5.0–7.0 | New track | Request pill "Add password reset". The Blade pulls out again, shorter. | `spring.blade`, 36 frames |
| 6.0–8.0 | Connectors | Two lines draw from the memory Cards to the new `plan.md` Card. Small dots move along them. One new Tick gets a small dot with the label "lesson applied". | `evolvePath`, 24 frames; dots `getPointAtLength`, 48 frames |
| 8.0–9.0 | Freeze | Head A works two Ticks at 4× speed. Then all motion stops. Text, 96 px: "Now change the model." | All motions ease out within 12 frames |

Transition out: the freeze holds for 0.5 s with no music. S7 starts on the next downbeat.

VO: "When a track closes, Measure keeps what it learned: lessons and known debt, under fifty lines each. The next track reads them first."

### S7. Swap: model, harness, roles (18 s)

On screen: the model changes, then the harness changes, then three roles on different models work on the same plan. The Blade, the Case, and the History lane do not change. This scene shows the thesis. It has three beats.

**7a. Model swap (0–6 s)**

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–0.6 | Constant brackets | Three thin ink brackets draw, with mono labels: `plan` (around the Blade), `memory` (around the Case), `history` (around the History lane). They stay to the end of S7 and never move. | `evolvePath`, 24 frames, stagger 6 frames |
| 0.6–1.6 | Head A out | The jaws open 20°. Head A rises 220 px and leaves the frame. The `[~]` box on Tick 2.2 stays on. It does not blink. | Jaws 9 frames; rise `Easing.in(Easing.cubic)`, 24 frames |
| 1.6–2.4 | Head B in | Head B drops onto the same stem. The jaws close with a click. The label rolls from `model A` to `model B`. | `spring.drop`, 30 frames; label roll 15 frames |
| 2.4–4.0 | Work | Head B completes Tick 2.2 with a short loop. The new Tag has a 16 px triangle glyph of its Head. Everything else about the Tag is identical. | S4 loop at 3× |
| 4.0–6.0 | Fast swaps | Heads C, D, E swap in, one per Tick, 0.6 s each. Each makes one Commit and one Tag. The History lane stays one even row. Support line: "Change the model. The plan stays." | Same motions |

**7b. Harness swap (6–11 s)**

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 6.0–7.2 | F1 → F2 | The F1 outline un-draws while the F2 outline draws. The Head, the Cards, and the `[~]` box do not move. The label rolls from `cli` to `tui`. | Un-draw `evolvePath` 1→0, 18 frames; draw 0→1, 24 frames, offset 6 frames |
| 7.2–9.0 | F2 → F3 → F4 | Same technique, 0.6 s each. The Head continues to work on Tick 2.3 during every swap. | Same |
| 9.0–11.0 | Install slots | A `SKILL.md` Card makes two copies. They slide into the slots `~/.claude/skills` and `~/.agents/skills`. A `measure-*.md` role Card slides into `~/.agents/agents`. A roster line in Inter 500, 44 px, graphite: "Claude Code · Gemini CLI · Codex CLI · OpenCode". Support line: "Plain markdown. Any harness." | Copies: offset clones, `ease.ui`, 18 frames, stagger 4 frames |

**7c. Roles (11–18 s)**

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 11.0–12.5 | Three Heads | The camera pulls back to 0.9×, with the origin on the Blade line. Three Heads drop above three Ticks of Phase 3: "Red · model B", "Green · model A", "Review · model C". | `spring.drop`, stagger 9 frames |
| 12.5–15.5 | Relay | Red writes a test, and the Chip shows FAIL. A small Card moves on an arc to Green. Green changes the Chip to PASS. A scan line from the Review Head moves across the Card. One Commit with a Tag drops. Support line: "Red and Green use different model families." | Arc 24 frames; scan 30 frames, linear |
| 15.5–18.0 | Hold | The Heads fade to 25 % and change glyphs slowly. The World layer and the brackets stay at full strength. Title, 96 px: "Swap the model. Swap the harness." Second line, 64 px: "The plan stays." | `ease.ui` |

Transition out: the work-zone content fades in 18 frames. One Frame stays, and its interior fills with the dark terminal for S8.

VO (7a and 7b only): "Now, change the model. The plan stays, and the next task starts where the last one stopped. Change the harness. Same skills, same files, same history. It is plain markdown, so it runs in Claude Code, Gemini CLI, Codex CLI, and OpenCode." In 7c, on-screen text and music replace the VO.

### S8. The Band in Claude Code (11 s)

On screen: a terminal Frame, 1280 × 520 px, with a `term-bg` interior. The label above is "Claude Code + measure-guard", 44 px. A prompt line with a block cursor is at the bottom. The Band is one line above the prompt, in JetBrains Mono 32 px, `term-dim`.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–2.5 | Band assembly | Five chips lift from the Blade and move up into the Band slot: the track name, "Phase 2/3", "Task 2/4", "[~]", and the task title. The `·` separators fade in. A dotted line stays between the Band `[~]` and the active Tick. | Arcs `ease.ui`, 30 frames, stagger 5 frames |
| 2.5–3.5 | No task | The `[~]` box leaves the Tick. The Band changes to the "no task in progress" form. | Text cross-fade, 12 frames |
| 3.5–6.5 | Deny | A tool-call Card slides in: `Edit src/billing.ts`. A gate bar drops in front of it. The Card hits the gate and recoils 24 px. The deny text types into the terminal. | Slide `ease.ui`; gate 9 frames; recoil `spring.stamp`; text 2 characters per frame |
| 6.5–9.0 | Allow | The Tick gets its `[~]` box again. The Band updates. The gate lifts. The Edit Card goes through. | Gate 12 frames; Card 24 frames |
| 9.0–11.0 | Proof | Support line: "The plan, above the prompt." Optional: a 2 s inset of a real screen capture, cropped to the Band and the prompt. | `ease.ui` |

Exact strings, from `mods/measure-guard/hooks/parse.ts` and `guards.ts`:

```text
Measure · Add password reset · Phase 2/3 · Task 2/4 [~] Add reset token expiry
Measure · Add password reset · Phase 2/3 · Task 2/4 [ ] Add reset token expiry · no task in progress
```

```text
measure-guard: no task in the track "Add password reset" is in progress. Mark the next task `[~]` in measure/tracks/password_reset_20261019/plan.md (Add reset token expiry). Then do the edit again. If this block is wrong, the user can run /measure-off.
```

The Band shows `[b] n` only when n is more than 0, so do not show `[b] 0`. To keep it readable, type only the first two sentences of the deny text.

Transition out: the terminal Frame moves up 40 px and fades in 24 frames. The camera shows the full Blade and the History lane.

VO: "In Claude Code, the measure-guard mod puts the plan above the prompt, and it stops any edit that no task covers."

### S9. Revert by meaning (9 s)

On screen: the user asks to revert the last phase. Measure selects the commits for that phase. The Blade retracts, and one revert Commit is added to the history.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–1.5 | Request | Prompt pill: "revert the last phase" (the phrase is from README.md). | `ease.ui` |
| 1.5–3.0 | Contrast | A row of SHAs types in at the left, in graphite mono: `9c4e1a2 77b0d3f 3e91c55 d02aa6b …`. A strike line draws through them. "Phase 3" in ink replaces them. | Strike 18 frames; cross-fade 12 frames |
| 3.0–5.0 | Selection | An ink outline marks the Phase 3 part of the Blade. Brackets mark every Commit under it, including one plan-update Commit that is out of order. A pill: "Revert 6 commits for Phase 3?" The Cursor clicks "Yes". | `ease.ui`; Cursor as in S5 |
| 5.0–7.0 | Snap | The Blade retracts from its end to Phase mark 3. It stops hard and recoils. The Phase 3 Ticks change to `[ ]`. The Phase 3 Commits change to `mist` but stay in place. One new revert Commit drops at the end of the History lane with the Tag "Revert Phase 3". | Retract `Easing.in(Easing.quad)`, 15 frames; recoil ±10 px, `spring.stamp`; drop `spring.drop` |
| 7.0–9.0 | Lines | Support line: "Undo by task, phase, or track." Label, 44 px: "git revert — the history stays." | `ease.ui` |

Transition out: pull back to 0.7×, with the origin on the Blade line. `ease.camera`, 48 frames. The work zone empties.

VO: "Need to undo? Ask by meaning: a task, a phase, or a whole track. Measure finds the commits and reverts them as one unit."

### S10. Close (10 s)

On screen: the Case and a short Blade with ghost Heads and Frames above them. The tagline and the thesis line appear. The Blade retracts into the Case for the end lockup.

| Time | Element | Motion | Easing / timing |
|---|---|---|---|
| 0.0–2.0 | Wide | The Case and a short Blade move to the horizontal center. The Blade line stays at y 704. Five ghost Heads at 20 % and four ghost Frame outlines are above, and they change slowly. | Horizontal move `ease.camera` |
| 2.0–5.0 | Tagline | "Measure twice, code once." at 144 px. The words rise 24 px and fade in. Two ticks draw under "twice". One tick draws under "once". | `ease.ui`, stagger 4 frames per word; ticks 9 frames each |
| 5.0–7.5 | Thesis line | "Same plan. Any model. Any harness." Each phrase appears on a downbeat. | `ease.ui` |
| 7.5–10.0 | Lockup | The Blade retracts fully into the Case with a final click. The ghosts fade out. Lockup: Case + "Measure" (Inter Tight 700, 120 px) + `github.com/bodangren/measure` (mono, 44 px) + "Open source · Apache-2.0 · a community fork of Google's Conductor" (Inter, 32 px, graphite). Hold 1.5 s. | Retract `Easing.in(Easing.cubic)`, 30 frames |

End: hold the lockup. Fade the audio out over the last 0.5 s. Do not fade to black. The light canvas stays.

VO: "Measure. Same plan. Any model. Any harness. Measure twice, code once."

## 5. Motion techniques

### 5.1 The swap

Goal: the viewer must see that a swap changes nothing in the World layer.

1. **Socket.** The stem and the `[~]` box are part of the World layer. The Head is part of the scene layer. A swap replaces only the Head. The stem stays, so the next Head continues at the same Tick.
2. **Stillness contrast.** During a swap, the World layer has zero motion. The outgoing Head moves fast (`Easing.in(Easing.cubic)`, 24 frames). The incoming Head arrives with `spring.drop`.
3. **Constant brackets.** Three ink brackets label `plan`, `memory`, and `history`. They draw once and stay still through every swap.
4. **Signature on the Tag.** Each Tag has a 16 px glyph of the Head that made it. The shape, size, and position of the Tag do not change. The viewer sees that the history records who did the work, and that the format stays the same.
5. **Frame swap by redraw.** Un-draw the old Frame outline and draw the new one, in 24 frames. The center and the size stay the same, so the content stays in place. Do not slide or scale the content inside the Frame.
6. **Sound.** Only the Head makes a sound during a swap: a short magnetic clip. The music does not change during swaps. The World layer makes no sound.

### 5.2 The Red → Green → Commit loop

1. **Stations.** Three stations are in the work zone: the test Card, the Chip, and the code Card. The Commit forms under the active Tick. The eye moves left, center, right, then down.
2. **Red.** The Bars type on, the Chip shows FAIL, and the test Card shakes once. Use a damped sine, not a spring, so that the shake is exact and short.
3. **Green.** The Chip flips on the Y axis. Change the face at 90°. The shape change (hollow to filled) and the color change occur together.
4. **Commit.** The two Cards merge into the Commit, and the Commit drops through the Blade. Render the Commit under the World layer during the drop, so that it goes behind the Blade.
5. **Rhythm.** After one full-speed cycle, repeat the loop at 1.6 s, 1.0 s, and 0.7 s per cycle. Put each Commit on a downbeat. The increasing speed tells the viewer that this loop is the normal rhythm of the work.

### 5.3 The Band

1. **The Band is the Blade, seen through a harness.** Labels lift off the Blade and move into the Band slot. A dotted line connects the Band `[~]` to the active Tick for the whole scene.
2. **Use the real string format** from `bandLine()`. Do not add colors that the real Band does not have. The real Band uses dim text, and it uses yellow only for errors. The only stylization in the video is the yellow `[~]`.
3. **Fit the line.** Use `measureText()` from `@remotion/layout-utils` to fit the Band into 1180 px at 32 px. If the Band does not fit, use a shorter task title.
4. **Show the deny as physics.** The tool-call Card hits a gate and recoils. Then the deny text types in. The viewer sees the block before reading it.

### 5.4 Markdown without walls of text

1. **Bars, not text.** Each markdown line is a rounded Bar, 14 px tall, with a `hairline` fill. Headings are 20 px ink Bars. Checkbox lines get a 20 px square in front of the Bar.
2. **Real silhouettes.** A build script reads a real file, for example `measure/archive/measure_guard_20261004/plan.md`. It writes a JSON list of line types and lengths. The Bar lengths follow the real lines, so each Card has a true shape.
3. **Three real words at most.** Each Card shows at most three real words: the file name and one keyword with a `blade-tint` highlight. Each Card shows at most eight Bars.
4. **Typing.** The Bars grow from the left with `scaleX` 0→1, stagger 4 frames.
5. **Bar-to-text resolve.** To show one real line, size a Bar to the real text width with `measureText()`. Cross-fade the Bar into the text at the same position, over 12 frames.
6. **Bar-to-Tick morph.** For the plan unroll in S3, animate the width, the height, and the position of each Bar together on an arc. A horizontal Bar becomes a vertical Tick.

### 5.5 Git notes

1. **Commit.** A 24 px ink square on a 2 px plumb line below its Tick. The 7-character SHA is to the right, in 28 px graphite mono.
2. **Tag.** A white paper tag, 96 × 60 px, with a 2 px hairline border and a punched hole at the top left. A thread connects it to the Commit. The thread is a quadratic curve with a 12 px sag.
3. **Attach.** Draw the thread with `evolvePath` in 18 frames. Then swing the Tag from −28° to 0° with `spring.swing`. The rotation origin is the punched hole.
4. **Read.** During a zoom, flip the Tag (`rotateY`, 18 frames) to show two lines of a real note. Example source: the note on commit `25a653b` ("Verification report: Phase S5 …").
5. **Message versus note.** The short commit message prints under the Commit. The long note is on the Tag. This difference shows what a git note adds.

### 5.6 The revert snap

1. The selection outline and the brackets come first, so the viewer knows the unit before the action.
2. The Blade retracts in 15 frames with `Easing.in(Easing.quad)`. It stops hard at the Phase mark and recoils with `spring.stamp`.
3. The reverted Commits change to `mist` and stay. One new revert Commit appears. The History lane only gets longer. This matches `git revert`.

## 6. Remotion implementation

### 6.1 Composition settings

| Setting | Value | Reason |
|---|---|---|
| Size | 1920 × 1080 | Main delivery: YouTube, README, website |
| fps | 60 | At 30 fps, thin Ticks strobe during horizontal pans. Vector scenes render fast, so 60 fps costs little. |
| Duration | About 6720 frames | `calculateMetadata` sets the final value from the voiceover files |
| Codec | H.264, CRF 16, `yuv420p`, AAC 320 kbps | Plays everywhere |
| Poster still | One frame from S7, 15.5–18.0 s | Thumbnail |

Write every time as `seconds * fps`. Then a change from 60 fps to 30 fps does not change the timing.

License: Remotion is free for individuals and for companies with up to 3 people. A larger company needs a Remotion company license.

### 6.2 Architecture: three layers

The World layer must not move during scene transitions, so it renders outside the scene sequences.

1. **Scenes, back layer.** The work-zone content of each scene.
2. **World layer.** The Case, the Blade, and the History lane. It reads only `worldAt(frame)`.
3. **Scenes, front layer.** Content that must pass in front of the Blade, for example the Bars that move onto the Blade in S3, and the Band chips in S8.

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
export const MeasureExplainer: React.FC = () => {
  const frame = useCurrentFrame();
  const world = worldAt(frame);
  return (
    <AbsoluteFill style={{ backgroundColor: T.canvas }}>
      <ScenesLayer slot="back" />
      <WorldLayer world={world} />
      <ScenesLayer slot="front" />
      <Soundtrack />
    </AbsoluteFill>
  );
};
```

### 6.3 Component tree

```text
src/
  Root.tsx                 # <Folder> with one Composition per scene + MeasureExplainer
  MeasureExplainer.tsx
  timeline.ts              # SCENES (from, duration) and CUES, in frames
  theme/
    tokens.ts              # colors, sizes, BLADE_Y = 704
    fonts.ts               # loadFont: Inter Tight, Inter, JetBrains Mono
    motion.ts              # ease.ui, ease.exit, ease.camera, spring configs
  world/
    worldAt.ts             # pure function, unit-tested; exports toScreen()
    WorldLayer.tsx
    Case.tsx  Blade.tsx  Tick.tsx  PhaseMark.tsx  Pin.tsx
    HistoryLane.tsx  Commit.tsx  Tag.tsx
  actors/
    Head.tsx               # prop glyph: 'ring' | 'triangle' | 'square' | 'pentagon' | 'bars'
    Frame.tsx              # prop variant: 'cli' | 'tui' | 'editor' | 'app'
    Card.tsx  Bars.tsx  Chip.tsx  Band.tsx  Cursor.tsx  Gate.tsx  Bracket.tsx
  scenes/
    S01Teaser.tsx ... S10Close.tsx   # each exports Back and Front
  audio/
    Soundtrack.tsx         # VO per scene, music with ducking, SFX cues
  data/
    plan-silhouette.json   # from scripts/silhouette.ts
scripts/
  silhouette.ts            # markdown file -> Bar data
  generate-voiceover.ts
test/
  worldAt.test.ts
```

Register each scene as its own `Composition` inside a `<Folder>`. A scene composition renders the World layer with its scene offset: `worldAt(SCENES.s4.from + frame)` gives the correct state.

### 6.4 `spring()` versus `interpolate()`

The installed Remotion skill (version 4.0.526) recommends `interpolate()` with `Easing.bezier()` or `Easing.spring()`. It also recommends inline values in `style`, the `scale`, `translate`, and `rotate` CSS properties, and `output: 'perceptual-scale'` for scale. Follow that pattern. Use raw `spring()` only where the natural settle time is acceptable.

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

If the project uses an older Remotion 4 release without `Easing.spring()`, use `spring({ frame, fps, config, durationInFrames })`. The `durationInFrames` option fits a spring into a fixed length.

### 6.5 Libraries

Install each package with `npx remotion add <package>`, so that the versions match.

| Package | Use |
|---|---|
| `@remotion/paths` | `evolvePath` (outlines, threads, brackets), `getPointAtLength` (dots, arcs), `interpolatePath` (Head glyph morph in the teaser) |
| `@remotion/shapes` | `makeCircle`, `makeTriangle`, `makeRect`, `makePolygon` for Head glyphs |
| `@remotion/noise` | `noise2D` for the S1 drift path |
| `@remotion/google-fonts` | Inter Tight, Inter, JetBrains Mono. Load only weights 400, 500, 700 and the latin subset. |
| `@remotion/layout-utils` | `measureText` for the Band fit and the Bar-to-text resolve |
| `@remotion/media` | `<Audio>` for VO and music |
| `@remotion/sfx` | Neutral built-in sounds only: `whoosh`, `switch`, `mouse-click`, `page-turn` |
| `@remotion/motion-blur` | `<Trail>` for the S5 → S6 fast pan only |
| `@remotion/transitions` | Optional, work zone only |
| `@remotion/captions` + `@remotion/install-whisper-cpp` | Captions for the social cut |
| `lucide-react` | Six icons |
| `vitest` | `worldAt` tests |

Do not use:
- **Lottie.** All shapes are simple vectors in React. Lottie adds a round trip through After Effects. Use it only if an After Effects artist delivers the Head animations.
- **`@remotion/rough-notation`.** Its hand-drawn style conflicts with the flat style.
- **Three.js.** The video has no 3D.

### 6.6 Tests and check frames

Put the thesis into tests:
- The Blade top edge is at y 704 at every cue frame after S1.
- A Head swap cue changes no Tick, Phase mark, or Commit.
- In each phase, the number of `[x]` Ticks is equal to the number of non-revert Commits.
- A revert cue adds one Commit and removes none.

Render a check still at the key frame of each scene:

```bash
npx remotion still MeasureExplainer --frame=2400 --scale=0.25
```

### 6.7 Deliverables

1. Master: 1920 × 1080, 60 fps, H.264.
2. Captioned social cut: same size, captions burned in at the top.
3. Poster still.
4. Optional square cut, 1080 × 1080. In this layout, the Blade line moves to y 640 and the Frame gets smaller. About 2 extra days.
5. Optional vertical cut, 1080 × 1920. This cut needs a new layout. About 3–4 extra days.
6. Optional: use `Blade`, `Band`, and `Card` again in a `<Player>` on the project website.

## 7. Voiceover and sound

### 7.1 Script

About 250 words. The average rate is 2.2 words per second, which leaves time for music and holds.

| Scene | Line |
|---|---|
| S1 | Teaser: no VO. Then: "Agents write code fast. But each session starts from zero. The plan was in the chat. Now the chat is gone, and the work drifts." |
| S2 | "Measure puts the context in your repository. A measure folder holds the product, the tech stack, the workflow, and the style guides. Every session reads it first." |
| S3 | "Each piece of work is a track. The spec says what to build, and why. The plan splits it into phases and tasks." |
| S4 | "The agent works one task at a time. First, a failing test. Then, the code that makes it pass. Then one commit, with a git note that says what changed and why." |
| S5 | "At the end of each phase, the agent stops, shows you how to check the work, and waits for your yes." |
| S6 | "When a track closes, Measure keeps what it learned: lessons and known debt, under fifty lines each. The next track reads them first." |
| S7 | "Now, change the model. The plan stays, and the next task starts where the last one stopped. Change the harness. Same skills, same files, same history. It is plain markdown, so it runs in Claude Code, Gemini CLI, Codex CLI, and OpenCode." |
| S8 | "In Claude Code, the measure-guard mod puts the plan above the prompt, and it stops any edit that no task covers." |
| S9 | "Need to undo? Ask by meaning: a task, a phase, or a whole track. Measure finds the commits and reverts them as one unit." |
| S10 | "Measure. Same plan. Any model. Any harness. Measure twice, code once." |

Direction: use one narrator for the full video. Calm, low-to-mid pitch, neutral accent, 140–150 words per minute. A plain, factual read, with no sales tone. The voice must not change during S7. A constant voice supports the thesis.

### 7.2 Voice source

1. **Scratch read first.** Record a phone read of the script. Use it to build the animatic and to lock the timing.
2. **Final, option A (recommended): a human narrator.** Budget about USD 150–400 for 250 words from a freelance marketplace. Ask for one WAV file per scene, 48 kHz, 24-bit, dry, with 0.5 s of room tone at each end.
3. **Final, option B: TTS.** The installed Remotion skill describes an ElevenLabs flow: one MP3 per scene in `public/voiceover/`, and `calculateMetadata` sets the scene lengths. The user also has two TTS skills installed: `create-speech-mmx` (MiniMax, `mmx speech synthesize`) and `mimo-v2-5-tts` (English voices Mia, Chloe, Milo). Each of them can make the per-scene files. Make 3 takes per scene and select the best.
4. Add 0.4 s after each VO line before the transition of the scene starts.

### 7.3 Music

- Tempo: 120 BPM. One beat is 30 frames at 60 fps. Put Tick prints, Commits, and Pins on beats.
- Style: a minimal muted pluck or marimba pattern with a soft kick. No melody under the VO. No vocals.
- Structure: start at S1 2.5 s. Add a rhythm layer at S4. Stop for one bar at the S6 freeze. Start again with a lift at S7 beat 7b. Drop to a pad at S9 for the snap. Resolve on the S10 tagline.
- Sources: a licensed library (Artlist, Musicbed, Epidemic Sound), or a free source (Pixabay Music, YouTube Audio Library). Make sure that the license allows use outside YouTube, because the video can also appear in the GitHub README.

### 7.4 Sound effects

The tape sounds are the signature. Record them as foley. You need one tape measure, a phone or a small recorder, a quiet room, and 20 minutes. Record the pull-out, the lock click, a slow retract, and a fast retract with a hard stop. If recording is not possible, use Freesound.org with the CC0 filter.

| Event | Sound | Level below VO peak |
|---|---|---|
| S1 line draw, Blade pull-out | Tape pull (ratchet) | −8 dB |
| Case click, Head jaws close | Lock click | −10 dB |
| Revert snap | Fast retract + hard stop | −4 dB (the loudest SFX) |
| Tick print | Muted wood tick | −16 dB |
| FAIL | Low muted thud, not a buzzer | −12 dB |
| PASS | Two soft rising notes | −12 dB |
| Commit drop | Paper stamp | −10 dB |
| Tag swing | Paper flutter | −16 dB |
| Pin stamp | Deep thunk | −8 dB |
| Cursor click | `mouse-click` from `@remotion/sfx` | −12 dB |
| Head swap | Short magnetic clip | −10 dB |
| Gate deny | Muted clunk | −8 dB |

Do not use the meme sounds in the `@remotion/sfx` list.

### 7.5 Mix

- Final loudness: −14 LUFS integrated, −1 dBTP true peak.
- Duck the music 12 dB under the VO. Use the `volume` callback of `<Audio>` with a frame-based curve from the VO cue times.
- After the render, run a two-pass `ffmpeg loudnorm` to get the target values.

### 7.6 Captions

- Make captions from the final VO with Whisper through `@remotion/captions`.
- Social cut: burn them in at the top safe area, Inter 500, 44 px, ink on a `glass` pill.
- YouTube: upload an SRT file. Do not burn in.

## 8. Production effort

This estimate is for one experienced motion developer who knows React and Remotion.

| Phase | Work | Person-days |
|---|---|---|
| Pre-production | Script lock, scratch VO, 5 styleframes (S2, S4, S7, S8, S10), timed animatic | 3–4 |
| System | Tokens, fonts, `worldAt` with tests, World layer, Head, Frame, Card, Bars, Chip, Band, Cursor, Gate | 4–5 |
| Scenes | S4 and S7: 1.5 days each. The other 8 scenes: 0.5–1 day each. | 7–9 |
| Audio | Final VO (vendor lead time of 2–3 days runs in parallel), foley, music edit, mix | 2 |
| Review | Two rounds of notes | 2–3 |
| Deliverables | Captions, poster, social cut | 1–2 |
| **Total** | | **19–25** (4–5 weeks elapsed) |

Options:
- **After Effects instead of Remotion.** The first build takes about the same time, 15–20 days. Later changes to text, track names, and timing cost more, and you cannot use the components on the web. Recommendation: use Remotion.
- **60 s cut** (S1, S2, S4, S7, S8, S10 only): 12–14 days.
- **AI-assisted code.** An agent can write most components and scenes. This can decrease the code work by 30–40 %. Direction, styleframes, review, and audio stay human work.

Recommendation: build the video as a Measure track. Write a `spec.md` from this brief, and a `plan.md` with one phase for each two or three scenes. Run Red and Green on different model families, and use two harnesses. Then the end card can say "This video was built with Measure." Use that line only if it is true.

## 9. Accuracy notes and open decisions

1. **Only Claude Code has the Band.** The untracked folder `extensions/measure-status/` adds a similar band to OpenChamber, but it is not on `main`. Do not show it until it ships.
2. **Band format.** Use the exact format from `bandLine()` in `mods/measure-guard/hooks/parse.ts`. `[b] n` appears only when n is more than 0.
3. **Revert keeps the history.** `references/revert.md` runs `git revert --no-edit` in reverse order. The video must not delete Commits.
4. **Role models.** `skills/measure-orchestrator/SKILL.md` says that role files do not pin a model. But each `agents/measure-*.md` file has a `model:` line in its front matter. The video says only safe things: roles can use different models, and Red and Green use different model families. The owner can fix the mismatch in a separate track.
5. **Orchestration harness.** The role files use OpenCode front matter (`mode`, `steps`, `permission`). The orchestrator SKILL.md says that the roles are "registered as opencode subagent types". Do not show orchestration inside a Frame with a Claude Code label.
6. **Harness roster.** The repository installs to `~/.claude/skills`, `~/.agents/skills`, and `~/.agents/agents`. It does not name Gemini CLI or Codex CLI. Before you lock the VO, test that each named harness loads the skill from one of these folders.
7. **Brand change.** The brief keeps the canvas, the ink, the glass, and the spring motion from `measure/product-guidelines.md`. It changes the font (license) and the accent (metaphor, vendor neutrality). The owner must approve this change, or set the accent back to `#0071E3`.
8. **Names and logos.** Real product names appear only as plain text in S7, S8, and S10. No vendor logos, marks, or brand colors appear.
9. **Example data.** "Add OAuth login" and "Add password reset" are examples. `oauth_login_20261019` follows the documented ID format. All SHAs in the scenes are fictional.

Decisions for the owner:
- Accent: blade yellow `#F2BE22` (recommended) or brand blue `#0071E3`.
- Teaser at the start of S1: keep it (recommended), or start directly with the drift.
- VO: human narrator (recommended) or TTS.
- Harness names in the VO: keep them after the test in note 6, or replace them with "any harness that reads skill files".

---

This brief is for a production team. The caller can publish it as a private, shareable page if the user wants one.