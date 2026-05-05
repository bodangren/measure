AUTONOMOUS MEASURE — UNATTENDED RUN

1. Load Context (skip any missing file silently):
   Use the measure skill.
   Read measure/tracks.md, measure/tech-debt.md, measure/lessons-learned.md.
   Try measure/current_directive.md — if absent, skip it.

2. Workspace & Progress:
   - Dirty? Commit with a brief note, push, continue.
   - In-progress phase exists? Finish it.
   - Nothing in progress? Create ONE new track from current_directive.md (or top tech-debt item if no directive).

2.1 FUNCTIONALITY REVIEW (mandatory before any new phase):
Before starting new work, you MUST verify the previous phase actually works:
a. Start the dev server: `bun run dev` (or appropriate command from package.json)
b. Load the browser-harness skill and connect: `browser-harness-js 'await session.connect()'`
c. Navigate to the app: `browser-harness-js 'await session.Page.navigate({url:"http://localhost:<port>"})'`
d. Check for console errors using browser-harness Runtime.consoleAPICalled
e. Verify the specific feature from the previous phase renders and responds to interaction
f. Take a screenshot and verify visually
g. If anything is broken: FIX IT before proceeding. Do not start new work on top of broken work.
h. Stop the dev server when done

3. Implement ONE phase with TDD:
   Red-Green-Refactor cycle. Run tests, correct build errors.
   After each task:
   a. Run the test suite. All tests must pass.
   b. Run the build. Must succeed with no errors.
   c. Quick smoke test: start dev server, load app in browser via browser-harness, verify no console errors, stop server.
   d. Commit changes and push.

4. Verify (mandatory after every phase):
   a. Full test suite passes: run the project's test command
   b. Build succeeds: run the project's build command
   c. App launches: start dev server, connect via browser-harness, navigate to app
   d. Core journey works: navigate through the main user flows
   e. Phase feature works: test the specific feature you just built
   f. No console errors: check browser-harness Runtime.consoleAPICalled for errors/exceptions
   g. Visual check: take a screenshot, verify layout renders correctly
   h. If ANY check fails: fix the issue before finalizing. Do not mark complete with known failures.
   i. Stop the dev server

5. Finalize:
   a. Enforce memory limits:
   - tech-debt.md: MUST be ≤50 lines. If over, remove resolved items or consolidate.
   - lessons-learned.md: MUST be ≤50 lines. If over, remove stale entries.
     b. Update tech-debt.md and lessons-learned.md with findings from this session.
     c. Commit checkpoint with git note (include your model name in the commit title), push.

CRITICAL UNATTENDED RULES:

- Any prompt asking "Proceed?", "Continue?", or "Shall I?" → answer yes.
- Any prompt asking "What would you like to work on next?" or similar → pick the first sensible option and execute it.
- Use --yes, --no-interactive, --non-interactive flags wherever available.
- Never wait for human input. Always make a decision and continue.

CRITICAL QUALITY RULES:

- NEVER mark a track or phase complete if the app doesn't launch or the feature doesn't work.
- NEVER start a new track while an existing track has known broken functionality.
- Tests passing ≠ feature working. You MUST verify in a real browser.
- If browser-harness is unavailable, fall back to manual verification instructions for the user, but do NOT skip verification entirely.
