# Specification: README videos

## Overview

Daniel asked for two YouTube videos in the README (Google Tasks, 2026-11-05 18:37 ICT). The PM sent the request on 2026-11-05. Daniel's words: "Please ask the measure session to add two youtube videos embedded into the Readme".

GitHub does not show a YouTube iframe in a README. Each video gets a linked thumbnail.

## Videos

The titles come from the live YouTube oEmbed answer (`https://www.youtube.com/oembed?url=<video url>&format=json`) on 2026-11-05.

| Order | Video ID | oEmbed title |
| --- | --- | --- |
| 1 | `4QeRkIH2gSs` | Measure Framework Orchestrator |
| 2 | `AP6-63xSUXM` | Measure Framework Explainer |

## Functional requirements

1. FR-1: `README.md` has one short section `## Videos` directly before `## Why use Measure?`.
2. FR-2: The section has one linked thumbnail for each video, in Daniel's order. The format is `[![<title>](https://img.youtube.com/vi/<id>/hqdefault.jpg)](https://www.youtube.com/watch?v=<id>)`.
3. FR-3: Each `<title>` is the oEmbed title in the table above.

## Acceptance criteria

1. One commit changes only `README.md`.
2. Each thumbnail URL returns HTTP 200 with an image content type.
3. Each link points to the video with the same ID as its thumbnail.

## Out of scope

- Other README text, `CHANGELOG.md`, and the skill bundles.
- A push of `main` when `main` has other unpushed commits. The PM rule: list those commits in the reply.

## Spec review

The fresh-agent spec review did not run. The PM set a cap of 2 subagents for the machine, and Storytime work has the slots tonight. The change is one Markdown section with no code.
