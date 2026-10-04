# Plan: Daily Automation Dashboard

## Phase 1: Parser
- [ ] Task: Build `scripts/generate-dashboard.ts` with Markdown frontmatter parser
- [ ] Task: Extract portfolio pulse metrics, project health board, and action logs
- [ ] Task: Handle missing or malformed summary files gracefully

## Phase 2: HTML Generator
- [ ] Task: Generate static HTML with Tailwind CSS CDN
- [ ] Task: Build sidebar with date navigation and color indicators
- [ ] Task: Render Markdown content to HTML (use marked or similar)
- [ ] Task: Add portfolio pulse chart (simple bar chart with inline SVG)

## Phase 3: Integration
- [ ] Task: Add `npm run dashboard` script to package.json
- [ ] Task: Update `~/bin/generate-dashboard.sh` to call the script
- [ ] Task: Ensure output path is `~/Desktop/daily-dashboard.html`

## Phase 4: Verification
- [ ] Task: Run against existing daily summaries
- [ ] Task: Verify responsive layout in browser
- [ ] Task: Commit and push
