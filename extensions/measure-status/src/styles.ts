// FR-12: the CSS of the board as one string. The page injects it at start.
// Every colour comes from a host theme variable. The string holds no colour
// literal, no named colour, and no remote URL. The rules sit under the `.mb`
// root class, so the host page keeps its own look.
export const BOARD_CSS: string = `
.mb { font-size: 14px; line-height: 1.45; -webkit-text-size-adjust: 100%; margin: 0; font-family: var(--oc-font); background: var(--oc-bg); color: var(--oc-fg); }
.mb, .mb *, .mb *::before, .mb *::after { box-sizing: border-box; }
.mb [hidden] { display: none !important; }
.mb button { font: inherit; color: inherit; }
.mb :focus-visible { outline: 2px solid var(--oc-focus); outline-offset: 2px; }
.mb .page { max-width: 1400px; margin: 0 auto; padding: 16px; }
.mb .page-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-bottom: 16px; }
.mb .page-title { margin: 0; font-size: 1.35rem; font-weight: 650; flex: 1 1 auto; min-width: 0; }
.mb .page-meta { flex: 1 1 100%; margin: 0; color: var(--oc-muted); font-size: 0.9rem; order: 3; }
.mb .page-summary { display: flex; flex-wrap: wrap; gap: 6px; }
.mb .grant-banner { margin: 0 0 12px; padding: 8px 12px; border: 1px solid var(--oc-warning); border-radius: var(--oc-radius); background: color-mix(in srgb, var(--oc-warning) 16%, transparent); color: var(--oc-warning-text); }
.mb .btn { min-height: 40px; padding: 8px 14px; border: 1px solid var(--oc-border); border-radius: var(--oc-radius); background: var(--oc-elevated); color: var(--oc-elevated-fg); cursor: pointer; }
.mb .btn:hover { background: var(--oc-hover); }
.mb .btn:active { background: var(--oc-active); }
.mb .badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--oc-border); font-size: 0.85rem; font-weight: 600; }
.mb .badge[data-tone="blocked"] { color: var(--oc-error-text); border-color: var(--oc-error); background: color-mix(in srgb, var(--oc-error) 14%, transparent); }
.mb .badge[data-tone="waiting"] { color: var(--oc-warning-text); border-color: var(--oc-warning); background: color-mix(in srgb, var(--oc-warning) 16%, transparent); }
.mb .repo { margin: 0 0 12px; border: 1px solid var(--oc-border); border-radius: var(--oc-radius); background: var(--oc-elevated); color: var(--oc-elevated-fg); }
.mb .repo-head { margin: 0; font-size: 1rem; font-weight: 400; }
.mb .repo-toggle { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; width: 100%; min-height: 44px; padding: 8px 12px; border: 0; border-radius: var(--oc-radius); background: transparent; text-align: left; cursor: pointer; }
.mb .repo-toggle:hover { background: var(--oc-hover); }
.mb .repo-id { display: flex; align-items: center; gap: 8px; flex: 1 1 14rem; min-width: 0; }
.mb .repo-name { font-weight: 650; overflow-wrap: anywhere; }
.mb .chev { display: inline-block; width: 1em; color: var(--oc-muted); transition: transform 120ms; }
.mb .repo-toggle[aria-expanded="true"] .chev { transform: rotate(90deg); }
.mb .counts { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; flex: 0 1 auto; min-width: 0; font-size: 0.9rem; color: var(--oc-muted); }
.mb .count b { font-family: var(--oc-mono); font-weight: 600; color: var(--oc-fg); }
.mb .count[data-zero="true"] b { color: var(--oc-subtle); }
.mb .board { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 12px; padding: 4px 12px 12px; }
.mb .column { flex: 1 1 220px; min-width: 220px; max-width: 320px; border: 1px solid var(--oc-border); border-radius: var(--oc-radius); background: var(--oc-muted-surface); padding: 8px; }
.mb .col-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 28px; padding: 0 2px 6px; }
.mb .col-name { font-size: 0.8rem; font-weight: 650; letter-spacing: 0.04em; text-transform: uppercase; color: var(--oc-muted); }
.mb .col-count { font-family: var(--oc-mono); font-size: 0.85rem; color: var(--oc-muted); }
.mb .col-toggle { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; min-height: 40px; padding: 4px 8px; border: 1px dashed var(--oc-border); border-radius: var(--oc-radius); background: transparent; cursor: pointer; text-align: left; }
.mb .col-toggle:hover { background: var(--oc-hover); }
.mb .col-toggle .col-name { display: inline-flex; align-items: center; gap: 6px; }
.mb .col-toggle[aria-expanded="true"] { margin-bottom: 8px; }
.mb .col-toggle[aria-expanded="true"] .chev { transform: rotate(90deg); }
.mb .cards { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.mb .empty { margin: 4px 2px 6px; color: var(--oc-subtle); font-size: 0.9rem; }
.mb .col-note { margin: 8px 2px 0; color: var(--oc-muted); font-size: 0.8rem; }
.mb .more { display: block; width: 100%; min-height: 40px; margin-top: 8px; padding: 6px 10px; border: 1px solid var(--oc-border); border-radius: var(--oc-radius); background: var(--oc-elevated); cursor: pointer; }
.mb .more:hover { background: var(--oc-hover); }
.mb .stale-toggle { border-style: dashed; background: transparent; color: var(--oc-muted); text-align: left; }
.mb .stale-toggle[aria-expanded="true"] .chev { transform: rotate(90deg); }
.mb .stale-cards { margin-top: 8px; }
.mb .card { padding: 10px; border: 1px solid var(--oc-border); border-left-width: 3px; border-radius: var(--oc-radius); background: var(--oc-elevated); color: var(--oc-elevated-fg); overflow-wrap: anywhere; min-width: 0; }
.mb .card[data-tone="blocked"] { border-left-color: var(--oc-error); }
.mb .card[data-tone="waiting"] { border-left-color: var(--oc-warning); }
.mb .card-title { font-weight: 600; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.mb .card-pos { margin-top: 4px; font-size: 0.85rem; color: var(--oc-muted); }
.mb .card-task { margin-top: 2px; color: var(--oc-fg); overflow-wrap: anywhere; }
.mb .marker { font-family: var(--oc-mono); color: var(--oc-muted); }
.mb .card-note { margin-top: 4px; font-size: 0.85rem; color: var(--oc-muted); font-style: italic; }
.mb .card-line { margin-top: 6px; font-size: 0.85rem; overflow-wrap: anywhere; }
.mb .line-label { display: inline-block; margin-right: 6px; padding: 0 6px; border-radius: 4px; border: 1px solid var(--oc-border); font-size: 0.75rem; font-weight: 650; text-transform: uppercase; letter-spacing: 0.03em; }
.mb .card[data-tone="blocked"] .line-label { color: var(--oc-error-text); border-color: var(--oc-error); }
.mb .card[data-tone="waiting"] .line-label { color: var(--oc-warning-text); border-color: var(--oc-warning); }
.mb .card-flag { margin-top: 6px; font-size: 0.8rem; color: var(--oc-info-text); }
.mb .card-foot { margin-top: 6px; font-size: 0.8rem; color: var(--oc-subtle); }
.mb .card-warn { margin-top: 6px; font-size: 0.8rem; font-weight: 600; color: var(--oc-warning-text); }
.mb .comment { margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--oc-border); }
.mb .comment-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
.mb .comment-open { min-height: 40px; padding: 4px 12px; font-size: 0.8rem; }
.mb .comment-panel { margin-top: 8px; }
.mb .comment-label { display: block; margin-bottom: 4px; font-size: 0.8rem; font-weight: 600; color: var(--oc-muted); }
.mb .comment-input { display: block; width: 100%; max-width: 100%; min-height: 40px; padding: 6px 8px; border: 1px solid var(--oc-border); border-radius: var(--oc-radius); background: var(--oc-bg); color: var(--oc-fg); font: inherit; font-size: 0.85rem; resize: vertical; }
.mb .comment-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; margin-top: 6px; }
.mb .comment-send { min-height: 40px; padding: 6px 12px; font-size: 0.9rem; }
.mb .comment-send[disabled] { opacity: 0.55; cursor: not-allowed; }
.mb .comment-state { font-size: 0.8rem; color: var(--oc-muted); overflow-wrap: anywhere; }
.mb .comment-state[data-tone="sent"] { color: var(--oc-success-text); }
.mb .comment-state[data-tone="error"] { color: var(--oc-error-text); }
.mb .badge[data-tone="not-archived"] { color: var(--oc-warning-text); border-color: var(--oc-warning); background: color-mix(in srgb, var(--oc-warning) 16%, transparent); }
.mb #debug { margin-top: 12px; font-family: var(--oc-mono); font-size: 12px; color: var(--oc-muted); overflow-wrap: anywhere; }
@media (max-width: 639.98px) {
.mb .page { padding: 12px; }
.mb .board { flex-direction: column; flex-wrap: nowrap; align-items: stretch; padding: 4px 8px 8px; }
.mb .column { flex: 0 0 auto; width: 100%; min-width: 0; max-width: none; }
.mb .repo-id, .mb .counts { flex-basis: 100%; }
}`
