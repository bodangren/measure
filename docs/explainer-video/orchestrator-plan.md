# Measure orchestrator video: plan

Version 2, 2026-10-20. Status: approved; build in progress.

This is the second Measure video. The first video (`plan.md`, built 2026-10-19) explains what Measure does and shows that the same workflow runs on any model and in any harness. It does not show the steps of the `measure-orchestrator` skill. This video does.

Recommendation: make it a separate video, not a longer cut of the first. The first video is 127 s and carries one thesis. The orchestrator needs about 3.5 to 4 minutes on its own. A separate video keeps the first one short for feeds, and a viewer who wants the detail can play the second one. The two videos share the same world, brand, voice, and code, so a combined 6 minute cut is one extra render if the owner wants it later.

Brand source: the Reading Advantage brand files in `/home/daniebo/Desktop/advantage-pr`. The rules in `plan.md` sections 3 and 5 apply unchanged.

## 1. Goal

The video shows how the orchestrator runs one Measure track from "next phase" to "archived": the role order, the handoff contract, the mechanical gate after every role, the review loop, the acceptance gates, and closeout.

| Item | Decision |
| --- | --- |
| Length | Set by the voiceover. The draft script in section 6 is about 580 words, so about 4 min at the recorded pace of the first video. No fixed cap. |
| Format | 1920 × 1080, 60 fps, motion graphics with voiceover. Same as the first video. |
| Audience | Developers who already know what Measure is, or who have seen the first video. |
| Thesis | The orchestrator is a control plane. It delegates every step to one focused role, and a mechanical gate, not the role's own report, decides whether the step passed. |
| Tone | Calm and factual. Brand words: Adaptive, Honest, Rigorous. |
| Placement | GitHub README (next to the first video), project website, YouTube. |
| File name | `2026-10-2x-measure-orchestrator-1920x1080.mp4`, date of the render. |

## 2. What the orchestrator is, for the script

Sources: `skills/measure-orchestrator/SKILL.md`, `skills/measure-orchestrator/references/contracts.md`, `skills/measure-orchestrator/scripts/measure_interphase_checks.py`, `agents/measure-orchestrator.md`, and the twelve `agents/measure-*.md` role files.

| Point | Source |
| --- | --- |
| The orchestrator is a control plane. It classifies, sequences, delegates, records provenance, runs the mechanical gates, and routes remediation. It writes no code, tests, plans, registry entries, audit results, or closeout artifacts. | agents/measure-orchestrator.md, opening and "Delegation Rules" |
| Start: find the repo root with `measure/index.md`, `measure/tracks.md`, `measure/anti-patterns.md`, and `measure/tracks/`. Read the index, the registry, the anti-patterns catalog, the track spec and plan, and `test-strategy.md`. | SKILL.md, "Start Here" |
| `measure_interphase_checks.py status` lists the open phases and the closeout candidates. The first open phase is the default next phase. Completion comes from markers, not prose. | SKILL.md, "Start Here"; script `cmd_status` |
| Markers: `[x]` complete, `[~]` in progress, `[b]` blocked with `deferred:<owner>`. A `[b]` task with an owner does not count as incomplete. The word "deferred" in free text does not. | SKILL.md, "Marker Vocabulary" |
| Capture a `role_base_sha` before every role. The phase baseline is captured after the strategy commit. Every result is bound to a revision. A new commit makes older results stale. | agents/measure-orchestrator.md, "Managed Track Procedure" 5 and 8 |
| Each role gets: absolute repo root, track id, phase heading, baseline SHA, result JSON path, log path, and the gate commands from the environment. Result and log paths are `measure/runs/<track>/<role>-<short-head>.json` and `.log`. The role writes them, never the orchestrator. | SKILL.md, "Delegation" |
| Role order: strategy, Mid Red, Jr Green, Review A correctness, Review B security, Review C UX/API, adversarial testing, UX browser review when applicable, phase acceptance; audit at any time; then final acceptance; then closeout. Reviews A, B, and C can run in parallel. | SKILL.md, "Role Order" |
| Strategy writes `test-strategy.md` for the track and names the review gates that apply. | agents/measure-strategy.md |
| Mid Red writes failing tests for the phase, marks the task `[~]`, and commits. It may change only test files and Measure docs. The gate runs `RED_TEST_COMMAND` and expects failure. | agents/measure-mid-red.md; script `cmd_role_gate`, mid-red branch |
| Jr Green makes the tests pass and commits the implementation first. Then it records the commit SHA in `plan.md` in a separate plan-evidence commit, because a commit cannot contain its own SHA. The committed Red tests are immutable. The gate checks: no incomplete task in the phase, every `[x]` task has a SHA, and `GREEN_TEST_COMMAND` passes. | agents/measure-jr-green.md; script, jr-green branch |
| Every role ends with a `MEASURE_AGENT_RESULT` block: role, status (complete, blocked, partial), track, phase, commits, tests run, files changed, plan updates, known failures, handoff. The gate fails when the block is missing. | references/contracts.md |
| Audit roles write a result JSON: status (pass, fail, inconclusive), blocking findings, non-blocking findings, evidence, commands, violations, retry recommendation, confidence. Status pass only when every blocking list is empty. Inconclusive means a tooling failure, which is not acceptance. | references/contracts.md |
| Reviews A, B, and C are report-only. They write only their result artifact and log. They fix nothing. A blocking finding goes to Jr Green with exact evidence and a bounded remediation brief. | SKILL.md, "Delegation"; agents/measure-review-*.md |
| A remediation commit invalidates every review bound to the older HEAD. The applicable reviews run again on the new HEAD. | SKILL.md, "Role Order" and "Delegation" |
| Adversarial testing adds boundary, failure-path, integration, concurrency, and regression tests. It may commit tests and owns durable Playwright coverage. It fixes no production behavior. | agents/measure-adversarial-testing.md |
| UX browser review runs when user-facing files changed. It needs `PROJECT_DEV_URL` and records screenshots, accessibility snapshots, and interactions as evidence. | agents/measure-ux-browser-review.md; script `ux_paths` |
| Phase acceptance runs last in the phase on an immutable HEAD, by a model from a different family than Red. A blocker routes to the owning role and acceptance runs again on the new HEAD. Then the orchestrator asks the user for the phase checkpoint. | agents/measure-phase-acceptance.md; SKILL.md, "Model Selection" |
| Model rules: the host keeps the role-to-model table. Red and Green use different families. An auditor uses a family other than the one it audits. Review A and B differ. Final acceptance differs from Review A and from phase acceptance. Metered models need explicit user approval. | SKILL.md, "Model Selection" |
| The audit role checks the framework itself: test scripts and plan truthfulness. It consults `measure/anti-patterns.md` (A1 to A10 in the starter catalog) and appends a new entry when it finds a new class of failure. | SKILL.md, "Anti-Patterns Registry"; agents/measure-orchestrator-audit.md |
| Final acceptance runs when every phase passed: no incomplete task in the track, and `PROJECT_LINT`, `PROJECT_CHECKS`, and `PROJECT_TESTS` pass. | script, final-acceptance branch |
| Closeout is the only role that moves files. It archives `measure/tracks/<track>` to `measure/archive/<track>`, removes the track from the active registry, sets `status: "done"` with a date in `metadata.json`, writes the closeout manifest, and commits `measure/runs/<track>/` with the archive. The gate checks each of these. | SKILL.md, "Closeout Standard"; agents/measure-closeout.md |

Not in this video: the host agent's one-off coder lane and its permission allowlist. Those are host configuration, not the skill.

## 3. Rules for accuracy and brand voice

The rules of `plan.md` section 3 apply. Two more for this video:

- Role names on screen are the real skill names, in JetBrains Mono: `measure-strategy`, `measure-mid-red`, `measure-jr-green`, and so on. The voice says the short names: strategy, Red, Green, Review A, and so on.
- The gate output on screen uses the real checker format: `PASS: jr-green gate passed` and `FAIL: <reason>`. The reasons on screen are real strings from the script, for example `expected at least one current phase task marked [~]`.

## 4. Story structure

Sixteen scenes in five chapters. Lengths are estimates from the draft script at the first video's pace. The voiceover sets the final lengths, as in the first video.

| # | Chapter | Scene | What it shows |
| --- | --- | --- | --- |
| O1 | Open | Cold open | The Tape world from the end of the first video. The blade is in the case. A new lane appears above the blade: the control lane. |
| O2 | Open | Control plane | The orchestrator glyph sits in the control lane with a read-only chip. It points at the roles below the blade. It touches nothing on the blade. |
| O3 | Start | Status | A terminal card runs `status`. The open phases list. The next phase lights on the blade. A `[b] deferred:phikul` task stays grey. |
| O4 | Start | Baseline | A SHA stamp drops on the history lane before a role starts. A result tag chains to that commit. |
| O5 | Phase | Strategy | Head A writes `test-strategy.md` into the case. One commit. The phase baseline stamp lands after it. |
| O6 | Phase | The gate | The go/no-go gauge appears at the end of the blade. The `MEASURE_AGENT_RESULT` card slides through it. Checklist lines tick. `PASS: strategy gate passed`. |
| O7 | Phase | Red | Head B. A task goes `[~]`. Test bars turn red. One commit. The gauge: tests fail as required, only test files changed. PASS. |
| O8 | Phase | Green | Head C. Bars turn green. Two commits: the implementation, then the plan evidence with the SHA. Ticks go `[x]` with short SHAs. PASS. |
| O9 | Review | Three reviews | Three heads above the same commit, in parallel. Three result tags drop into the `measure/runs/` tray. The JSON fields show. |
| O10 | Review | The loop | One tag flips to `fail` with a `retry_implementation` line. An arrow back to Green. A new commit. The three older tags grey out with a `stale` mark. Three fresh tags. PASS. |
| O11 | Review | Adversarial and browser | A head pushes edge-case inputs at the test bars. Then a browser frame (the Frame actor from the first video) with screenshot thumbnails as evidence. |
| O12 | Review | Phase acceptance | A head from another family reads a frozen HEAD. The phase pin goes in (the Pin actor). The checkpoint card asks the user for yes. |
| O13 | Rules | Model independence | The roles line up with their family glyphs. Rules show as pairs: Red ≠ Green, auditor ≠ audited, A ≠ B. The heads swap; the blade does not move. |
| O14 | Rules | Audit | The `anti-patterns.md` card with A1 to A10. The audit head appends A11. |
| O15 | Close | Final acceptance and closeout | Every pin is in. The final gauge runs lint, checks, tests. The track card slides from `tracks/` to `archive/`. The registry line moves. `status: "done"`. The runs tray commits with it. |
| O16 | Close | Lockup | The role list rolls up the control lane in order. The Reading Advantage lockup. |

## 5. Visual direction

Same world, same brand tokens, same type, same hard rules as the first video: the blade line never moves, no idle motion in the World layer, the accent marks only the plan.

New elements, each with a real-world anchor in the measuring-tool family:

| Element | Stands for | Design note |
| --- | --- | --- |
| Control lane | The orchestrator | A thin lane above the blade, graphite hairline. The orchestrator glyph is a hollow ring with a dot, read-only chip beside it. It never crosses the blade line. |
| Go/no-go gauge | The role gate (`role-gate`) | A machinist's go/no-go gauge: a bracket with two openings at the blade end. A result card passes through the GO opening or stops at NO GO. Output text in JetBrains Mono. |
| Result card | `MEASURE_AGENT_RESULT` block | A card in the style of the first video's Card actor, with the real field names. |
| Run tag | Audit result JSON in `measure/runs/` | The Tag actor from the first video, with `status` and `retry_recommendation` lines. A stale tag greys to hairline with a diagonal mark. It stays on screen; nothing disappears. |
| Runs tray | `measure/runs/<track>/` | A shallow tray under the history lane. Tags stack in it. |
| Family glyphs | Model families | The Head actor and its glyphs from the first video. Same letters, same abstract shapes, no vendor marks. |
| Archive slot | `measure/archive/` | A second slot in the case, right of the tracks slot. The first video's `archive` cue already moves a track card there. |

## 6. Voiceover script

One narrator, same voice as the first video. About 580 words.

| Scene | Line |
| --- | --- |
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

## 7. Audio

Same chain as the first video: `mmx speech`, speech-2.8-hd, `English_Trustworthy_Man`, one take per line, 16 lines. The jingle, the ducking chain, and the loudness target stay the same.

One difference: the jingle is 131 s and this video is about 240 s. Recommended: loop the jingle once, with a crossfade at a bar boundary from the beat grid in `data/jingle-beats.json`, and end on the natural ending. The alternative is to let the music stop after the first pass and run the last scenes on voice only.

SFX: the placeholder set from the first video plus three new ones: gauge pass (a clean click), gauge fail (a dull stop), and a tag flip. Foley stays the open item for both videos.

## 8. Production path

| Item | Decision |
| --- | --- |
| Tool | Remotion 4 in `advantage-pr`, as a second composition `MeasureOrchestrator` under `src/measure-orchestrator/`, beside the first video. |
| Reuse | `world/`, `actors/`, `theme/`, `captions/`, and `audio/` from `src/measure-explainer/` move to a shared `src/measure-video/` folder, or the second composition imports them in place. The `worldAt` tests keep passing. The scripts in `scripts/` take a composition id and an output prefix instead of the fixed `S01` to `S10` names. |
| New world cues | `baselineStamp`, `gate` (pass, fail), `runTag` (pass, fail, stale), `tray`. The `archive` and `phasePin` cues exist. |
| New tests | A stale tag never leaves the screen. The control lane never crosses the blade line. A gate pass changes no tick. |
| Steps | 1. Owner approves this plan and the decisions in section 9. 2. Opus writes the motion brief from this plan, as input, in the format of `motion-brief-v2.md`. 3. Record the voiceover. 4. Build the shared folder and the scripts change. 5. Build the scenes with Opus agents. 6. Render, mix, caption, poster, register. |
| Deliverables | Master, captions cut, poster, registered in `assets/video-assets/index.json`. |

Build mode: a one-off build in `advantage-pr`, as before.

## 9. Decisions

All decided by the owner on 2026-10-20: separate video; 16 mmx calls, one take per line; loop the jingle at a bar boundary; title "Measure Orchestrator: how a track runs".

1. Separate video (recommended) or a longer single cut. The plan assumes separate.
2. Voiceover quota: 16 `mmx speech` calls, one take per line.
3. Music after 131 s: loop the jingle at a bar boundary (recommended) or voice only after the first pass.
4. Title on screen and in the index: "Measure Orchestrator: how a track runs".

## 10. Build record (2026-10-20)

Built in `advantage-pr` as the composition `MeasureOrchestrator` (`src/measure-orchestrator/`, build notes in `BUILD-NOTES.md` there). The brief is `motion-brief-orchestrator-v1.md`; where the brief and this plan differ, the plan wins, and brief section 10 lists the accepted differences.

| Item | Result |
| --- | --- |
| Deliverables | `assets/videos/2026-10-20-measure-orchestrator-1920x1080.mp4` (master), `2026-10-20-measure-orchestrator-captions-1920x1080.mp4` (social cut, burned-in captions), `2026-10-20-measure-orchestrator-poster-1920x1080.jpg` (poster from O15, the closeout gate). Registered in `assets/video-assets/index.json` with the voiceover entry. The media stays out of git (repo rule). |
| Length | 232.6 s, 16 scenes O01–O16, set by the recorded voiceover (VO + 0.6 s, plus holds in O01, O10, O16). |
| Voiceover | 16 `mmx speech` calls (speech-2.8-hd, English_Trustworthy_Man), one take per line, `public/voiceover-orchestrator/`. |
| Music | The jingle, looped at a bar boundary (`scripts/jingle-loop.sh`): loop point beat 120 at 59.85 s, two loops and the final pass, 0.5 s crossfades at the seams (59.85 s and 119.34 s). The music ends at about 231.5 s. Mix −14 LUFS, −1 dBTP. |
| Tests | 29 tests: `worldAt.test.ts` (first video), `control.test.ts` (control plane; the first video stays pixel-identical, verified on four reference frames), `timeline.test.ts` (orchestrator cues, continuity with the first video, gate invariants). |
| Accuracy | Every gate line on screen is a real checker string from `measure_interphase_checks.py` (`PASS: <role> gate passed`, one `FAIL:` line). Role chips show the real skill names. Family letters follow the role tables of the brief. |

Deviations for the owner to review:

1. The origin line in O16 reads "Open source · Apache-2.0". The first video named the upstream project; the brand rule allows no vendor name on screen.
2. The music has two seams; the level steps down about 6 dB at each seam because the loop returns to the quiet intro. There is no click.
3. No adversarial-testing Commit: O11 shows the role and its gate; the tests it may commit are not drawn (brief 10).
4. The audit role (O14) has no gate on screen: the checker has no audit gate.
5. The SHA label of a stamped Commit moves 10 px right of the ring (not in the brief).
6. The `.log` beside each audit JSON is not drawn.

Open points from the brief (section 10), not decided here: SKILL.md and the checker script disagree on the free-text "deferred" value; the re-plan Commit `4c7e2b9` in the prelude is not in the first video; the first video has no music after about 112 s.
