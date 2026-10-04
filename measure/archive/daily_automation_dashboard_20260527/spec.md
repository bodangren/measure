# Spec: Daily Automation Dashboard

## Problem
Daily summaries are Markdown files. Humans must read each day's report individually. There is no visual overview of portfolio health over time.

## Solution
Generate a styled HTML dashboard from all daily summaries with: sidebar date navigation, health trend charts, project RAG status history, and automation action logs.

## Acceptance Criteria
- [ ] `scripts/generate-dashboard.ts` parses all `daily-reports/daily-summary-*.md` files
- [ ] Single HTML output at `daily-dashboard.html` with Tailwind CSS (CDN)
- [ ] Sidebar: date list with color indicators (🔴 any project stalled that day)
- [ ] Main view: summary content rendered from Markdown
- [ ] Portfolio pulse chart: commits and active projects over last 30 days
- [ ] Project health timeline: one row per project, colored by day
- [ ] Responsive layout (mobile-friendly)

## Out of Scope
- Real-time data (static daily rebuild only)
- Authentication
- External hosting/deployment
