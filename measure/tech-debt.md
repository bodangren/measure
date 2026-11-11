# Tech Debt Registry

> This file is curated working memory, not an append-only log. Keep it at or below **50 lines**.
> Remove or summarize resolved items when they no longer need to influence near-term planning.
>
> **Severity:** `Critical` | `High` | `Medium` | `Low`
> **Status:** `Open` | `Resolved`

| Date | Track | Item | Severity | Status | Notes |
|------|-------|------|----------|--------|-------|
| 2026-11-09 | guard_session_track_20261109 | `plugins/opencode-measure-guard/tests/allow-adversarial.test.ts` case V18 expects the old CR-only folder `scripts/daily-report/work/\rsrc`, but `6d2fdcf` (dsh_measure_allow_parse_20261109) made `parseAllowList` ignore an entry with a control character, so `bun test` fails 1 of 151 | Low | Open | Found in the Green run of guard_session_track_20261109; the same failure occurs on a clean copy of `8882405` (`measure/runs/guard_session_track_20261109/green-p3-v18-preexisting.log`). `6d2fdcf` changed V6 and V7 and missed V18. |
| 2026-10-04 | measure_guard_20261004, dsh_measure_apply_patch_visibility_20261110, dsh_measure_shell_visibility_adapters_20261110, dsh_measure_limits_docs_20261110, dsh_measure_tdd_name_rules_20261110 | Resolved guard rows (summarized): the shell-write grammar and after-text visibility, the subagent-root/headless constraint, and the TDD name-rule residuals are fixed and documented in the DSH README Known limits | Low | Resolved | Details stay in the named track archives; summarized here to keep the line limit. |
| 2026-10-30 | spec_review_gate_20261030 and its fix tracks | Resolved gate/contract rows (summarized): suite runner hardening, rename scope, the audit contract, gate robustness, checker parser hardening, contract scope/clarity, the A11 recipe, phase acceptance, and skill-text clarity are fixed and pinned by their doc tests | Low | Resolved | Details stay in the named track archives and the spec-review-gate suite. |
| 2026-11-02 | guard_allow_list_20261101, dsh_measure_allow_parse_20261109 | Resolved allow-list rows (summarized): linear dedupe, the control-character rule, and the documented memory limit; the broken README span is fixed and linted | Low | Resolved | Summarized for the line limit. |
| 2026-11-07 | dsh_measure_evolve_20261107, dsh_measure_band_20261107, dsh_measure_band_poll_pause_20261110, dsh_measure_band_render_test_20261110, dsh_measure_band_strip_20261110 | Resolved band/route rows (summarized): the setup-answer transport, route identity, the poll pause, the render tests, and the one-row band with the problem count | Low | Resolved | Details stay in the named track archives. |
| 2026-11-07 | dsh_measure_dev_20261107, dsh_measure_installer_atomic_20261110, dsh_measure_reload_20261107, dsh_measure_isolated_session_20261107 | Resolved installer/reload rows (summarized): atomic skill installs, the reloadNonce recompose proof, and the headless/root constraints | Low | Resolved | Summarized for the line limit. |
| 2026-11-08 | dsh_measure_gate_timing_20261110, dsh_measure_route_identity_20261110, dsh_measure_red_scope_gates_20261110 | Resolved timing/identity/scope rows (summarized): the calibrated adversarial budgets, every-response route identity, and the track-scoped gate reads | Low | Resolved | Summarized for the line limit. |
