# Measure explainer video: plan

Version 5, 2026-10-19. Status: built and rendered. Deliverables are in `advantage-pr/assets/videos/` (see section 11).

Companion file: `motion-brief-opus-draft-v1.md` is the motion design brief from Opus. It is a draft input. This plan selects from it. Where the two differ, this plan wins. After the owner approves this plan, Opus revises the brief to match.

Brand source: the Reading Advantage brand files in `/home/daniebo/Desktop/advantage-pr`. Section 5 cites them by path.

## 1. Goal

The video explains what Measure does and how it works. It shows one advantage: the same workflow runs on any LLM model and in any agent harness.

| Item | Decision |
| --- | --- |
| Length | Set by the voiceover: about 127 seconds with the recorded takes. No fixed cap. |
| Format | 1920 × 1080, 60 fps, motion graphics with voiceover. |
| Audience | Developers who use an AI coding agent. |
| Thesis | The plan, the memory, and the git history are the constants. The model and the harness are variables. |
| Tone | Calm and factual. Brand words: Adaptive, Honest, Rigorous. |
| Placement | GitHub README, project website, YouTube, and social feeds. |
| File name | `2026-10-19-measure-explainer-1920x1080.mp4`, per the video-assets naming rule. |

## 2. What Measure is, for the script

Measure is markdown files, skill files, and the scripts inside the skills. A harness that supports skills can run it. That is every current agent harness: Claude Code, Gemini CLI, Codex CLI, OpenCode, Pi, and others. The project context lives in a `measure/` folder inside the repository, and the work history lives in git. No part of the core depends on one model or one harness.

What the video shows, with the source for each point:

| Point | Source |
| --- | --- |
| Project context lives in `measure/` inside the repository. Every session reads it first. | README.md, "What Measure adds" |
| A track is a `spec.md` plus a phased `plan.md`. Task markers are `[ ]`, `[~]`, `[x]`, and `[b]`. | skills/measure/SKILL.md |
| One task is one failing test, then the code, then one commit with a git note. | skills/measure/assets/workflow.md, step 8 |
| The agent stops at the end of each phase and waits for a human "yes". | README.md; workflow.md, checkpoint section |
| `lessons-learned.md` and `tech-debt.md` stay at 50 lines or less. | measure/lessons-learned.md:3; measure/tech-debt.md:3 |
| Revert works by track, phase, or task. It uses `git revert`, so the history stays. | skills/measure/references/revert.md |
| The orchestrator runs 13 roles. Each role can use its own model. Red and Green use different model families. | skills/measure-orchestrator/SKILL.md, "Model Selection" |
| A model swap is a one-line edit of a `model:` field in a role file. | agents/measure-*.md; git commit 3ac4340 |
| The skills are plain markdown with no external tool dependency. | measure/tech-stack.md:5, 74-76 |
| The installer copies the skills to `~/.claude/skills` and `~/.agents/skills`, and the roles to `~/.agents/agents`. | bin/install-targets.tsv |
| In Claude Code, the measure-guard mod adds a plan band above the prompt and an edit guard. | mods/measure-guard/README.md |
| Measure is an open-source community fork of Google's Conductor, Apache-2.0. | README.md, "Origin" |

## 3. Rules for accuracy and brand voice

- No vendor logos, vendor colors, or real model names on screen. Models and harnesses appear as abstract stand-ins with letter labels. Harness names appear as plain text only.
- Revert adds commits. The video must not show commits that disappear.
- No SF Pro font. Its license does not allow use in a published video.
- Banned words, from `02-brand/brand-guidelines.md`: "guaranteed", "leading", "#1", "best", "revolutionary", "disruptive", "game-changing", and any unsourced percentage claim. The script in section 6 uses none of them. Run `npm run lint` in `advantage-pr` on the final script to check.
- Write the Reading Advantage name in full. Never "RA".

## 4. Story structure

Ten scenes. The first number is the start time, the second is the length.

| # | Start | Length | Scene | What it shows |
| --- | --- | --- | --- | --- |
| S1 | 0:00 | 12 s | Teaser, then drift | A 2.5 s teaser shows the thesis. Then one agent loses its context between sessions and drifts. |
| S2 | 0:12 | 10 s | The `measure/` folder | Six context files fan out of the folder. A new session reads them first. |
| S3 | 0:22 | 11 s | A track | A request becomes `spec.md` and `plan.md`. The plan unrolls into phases and tasks. |
| S4 | 0:33 | 14 s | Red, Green, Commit, Note | One task at full speed, then three tasks at increasing speed. |
| S5 | 0:47 | 8 s | Phase checkpoint | A gate stops the agent. The human verifies and says yes. A checkpoint commit lands. |
| S6 | 0:55 | 9 s | Memory | The track archives. Lessons and tech debt update under a 50 line meter. The next track reads them. |
| S7 | 1:04 | 18 s | The swap | The model changes, the harness changes, and three roles on three model families work the same plan. The plan, memory, and history do not move. |
| S8 | 1:22 | 11 s | Guard rails | The core is the same in every harness. A harness can add its own guard rails. Claude Code shows the plan band and blocks an edit that no task covers. |
| S9 | 1:33 | 9 s | Revert by meaning | "Revert the last phase." The blade retracts. One new revert commit lands. The history stays. |
| S10 | 1:42 | 10 s | Close | Tagline, thesis line, and the Reading Advantage end lockup. |

Full beat tables for each scene, with timing and easing, are in the Opus brief, section 4.

## 5. Visual direction, on the Reading Advantage brand

The Opus brief proposed its own palette and accent. This section replaces those with the brand rules. The metaphor, the layout, the motion tokens, and the three hard rules from the brief stay.

| Topic | Decision | Source |
| --- | --- | --- |
| Metaphor | The Tape. A flat, geometric tape measure. The case is the `measure/` folder. The blade is the plan of the active track. Ticks are tasks. Commits hang below the blade. Git notes are paper tags. Models are "heads" above the blade. Harnesses are "frames" around the work zone. | Opus brief, section 2 |
| Thesis device | The blade stays on one fixed screen line for the full video. Models and harnesses change above it. | Opus brief, section 2.5 |
| Accent | Sky 400 `#38bdf8`, the Reading Advantage product accent and the corporate default. It is the blade fill, the pin fill, and the `[~]` marker. An accent is a highlight only. It never replaces the neutrals. | `02-brand/visual-identity.md`, "Product accent colors" |
| Accent edge | Sky 600 `#0284c7` for the blade bottom edge, so the blade reads as a strip. | Derived; same color family as the accent |
| Neutrals | The brand files give no neutral hex values. Use: canvas `#F5F5F7`, paper `#FFFFFF`, ink `#1e293b` (Slate 800, the Mastery Advantage mark color), graphite `#64748b`, hairline `#cbd5e1` (Slate 300). | Derived from the Slate family in `assets/logos/README.md` |
| Logo colors | Used only inside the logo: tile `#00aef0`, mark `#2f3192`, word `#272162`. Never used for other elements. | `assets/logos/README.md`, "Colors" |
| Test chips | FAIL `#ef4444`, PASS `#22c55e` (the "mastered" green from the graph state colors). Shape code as well as color: hollow pill with ✕, filled pill with ✓. | `02-brand/visual-identity.md`, graph state colors |
| Typography | Inter Tight 700 for display, Inter 500 for text, JetBrains Mono 500 for files, SHAs, and the band (owner decision, 2026-10-19). The brand type system is open (Q-BR-03); the brand file says "likely a humanist sans like Inter" and names JetBrains Mono for data. | `02-brand/visual-identity.md`, "Typography"; `scripts/daily-reel/README.md` |
| Icons | Lucide, 1.5 px stroke, rounded caps. Six icons only: folder, file, git commit, user, check, x. | `02-brand/visual-identity.md`, "Iconography" |
| Stand-ins | Heads carry one geometric glyph each: ring, triangle, square, pentagon, bars. Frames differ by geometry only: cli, tui, editor, app. All in ink on paper. | Opus brief, section 3.3 |
| Motion | Spring motion for arrivals and stamps. Bezier easing for entrances and camera. The brand has no motion rules, so the Opus motion tokens apply. | Opus brief, section 3.6 |
| End lockup | The Reading Advantage horizontal logo, `assets/logos/vector/horizontal/reading-advantage.svg`, on the light canvas. Clear space equal to the height of the "R" on all sides. Minimum 24 px tall; use 96 px. Do not recolor, stretch, skew, or rotate. The "Measure" wordmark and the GitHub URL sit below it with a clear separator. | `assets/logos/README.md`; `02-brand/visual-identity.md`, "Logo" |

Hard rules from the Opus brief, kept: the blade line never moves, the constant layer has no idle motion, and the accent marks only the plan.

## 6. Voiceover script

About 250 words, one narrator, 140 to 150 words per minute. The voice does not change in S7, because a constant voice supports the thesis.

| Scene | Line |
| --- | --- |
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

## 7. Audio

| Item | Decision | Source |
| --- | --- | --- |
| Voice engine | `mmx speech synthesize --model speech-2.8-hd`, one call per scene line, three takes each, select the best. Output to `public/voiceover/S01.mp3` … `S10.mp3`. `calculateMetadata` sets the scene lengths from the files. | Owner decision; `assets/video-assets/README.md`, rule 8 |
| Voice | `English_Trustworthy_Man` (owner decision, 2026-10-19). Rule 8 names only Thai voices, so this is the first English exception. One narrator for the full video. | `mmx speech voices` |
| Music | The Reading Advantage jingle, `assets/video-assets/music/reading-advantage-jingle.mp3`, 131 s. It covers the full 112 s video. Do not synthesize music. Use the reel mix: jingle at 0.24 from 0 s, sidechain-compressed by the voice (ratio 6), 2 s fade at the end. | `assets/video-assets/README.md`, rule 8; `scripts/daily-reel/README.md` |
| Sound effects | Tape pull, lock click, retract snap, recorded as foley with one real tape measure. Freesound CC0 as the fallback. Levels in the Opus brief, section 7.4. | Opus brief |
| Loudness | Voice stem loudnorm −16 LUFS, as in the reels. Final mix −14 LUFS integrated, −1 dBTP. | `scripts/daily-reel/README.md`; Opus brief |
| Quota | Speech shares the daily MiniMax bucket. Ten lines with three takes each is 30 calls. Get the owner's approval before the first batch. | `assets/video-assets/README.md`, rule 5 |

## 8. Production path

| Item | Decision |
| --- | --- |
| Tool | Remotion 4, React, in the `advantage-pr` repo. It already has a Remotion project (`src/Root.tsx`, `npm run studio`, `npm run render`) with Remotion 4.0.512. The video is a new composition `MeasureExplainer` there, with its code under `src/measure-explainer/`. |
| Architecture | Three layers. A pure, tested function `worldAt(frame)` drives the constant layer (case, blade, history lane). Scenes drive only the changing layer. Tests assert the thesis: a model swap changes no tick, phase mark, or commit. |
| Deliverables | Master 1080p60 mp4 in `assets/videos/`. Captioned social cut. Poster still. Register each file in `assets/video-assets/index.json`. |
| Effort | 19 to 25 person-days for one motion developer. A 60 s cut is 12 to 14 days. AI-assisted code can reduce the code work by 30 to 40 percent. |

Build mode: a one-off build in `advantage-pr`, not a Measure track (owner decision, 2026-10-19).

## 9. Decisions

All decided on 2026-10-19:

- Accent: Sky 400 `#38bdf8`.
- Voice engine: `mmx speech`, model speech-2.8-hd. Voice: `English_Trustworthy_Man`.
- Music: the Reading Advantage jingle.
- Typography: Inter Tight, Inter, JetBrains Mono.
- Build location: the Remotion project in `advantage-pr`, as a one-off, not a Measure track.

## 10. Next steps

1. Opus revises the motion brief to match this plan: the brand palette, the end lockup, the S7 and S10 script, and the audio section. Output: `motion-brief-v2.md`.
2. Make five styleframes: S2, S4, S7, S8, S10.
3. Generate the voiceover with `mmx speech` after quota approval, and build a timed animatic.
4. Add the `MeasureExplainer` composition to `advantage-pr/src/` and write `worldAt` with its tests.
5. Build the scenes, S4 and S7 first.
6. Render to `assets/videos/2026-10-19-measure-explainer-1920x1080.mp4` and register it in the index.

## 11. Build record (2026-10-19)

| Item | Result |
| --- | --- |
| Source | `advantage-pr/src/measure-explainer/` (composition `MeasureExplainer`, registered in `src/Root.tsx`). `BUILD-NOTES.md` there records the API and the deviations from the brief. |
| Master | `advantage-pr/assets/videos/2026-10-19-measure-explainer-1920x1080.mp4`, 127.5 s, 1080p60, H.264 CRF 16, AAC 320k, −14.0 LUFS. |
| Social cut | `advantage-pr/assets/videos/2026-10-19-measure-explainer-captions-1920x1080.mp4`, captions burned in at the top. |
| Poster | `advantage-pr/assets/videos/2026-10-19-measure-explainer-poster-1920x1080.jpg`, from the S7 roles hold. |
| Voiceover | `advantage-pr/public/voiceover/S01.mp3 … S10.mp3`, mmx speech-2.8-hd, English_Trustworthy_Man, one take per line (10 calls). |
| Music | The Reading Advantage jingle, mixed with the daily-reel chain. Beats measured at 120.2 BPM; the S4 commits and S5 pins land on beats; S7 starts on a beat. |
| Sound effects | Synthesized placeholders in `advantage-pr/public/sfx/`. Replace with foley (tape pull, lock click, retracts) and Freesound CC0 files, same names, then rerun `render-all.sh --skip-render`. |
| Index | All four deliverables are registered in `assets/video-assets/index.json`. |
| Re-render | `bash src/measure-explainer/scripts/render-all.sh` (waits on the machine's heavy-job lock). |
| Tests | `node --test src/measure-explainer/world/worldAt.test.ts` (9 pass), also in `tests/run-all.sh`. |

Open items after the owner's review: foley sound effects, a second voiceover take for any line that reads badly, and the optional 2 s screen-capture inset in S8.
