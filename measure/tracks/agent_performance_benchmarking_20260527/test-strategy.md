# Test Strategy: Agent Performance Benchmarking

## 0. Context & Constraints
- `tech-stack.md` declares **no test runners**; verification is workflow-guided. This track introduces an executable CLI (`measure benchmark`, `measure benchmark:report`) — that is a **tech-stack change** and requires a `docs(tech-stack)` update + a minimal scripted verification layer (bash + `jq`) before Phase 1 work begins. Block Phase 1 until that is committed.
- Project is pure Markdown/JSON (`glob **/*.ts` → 0 hits). **build-graph is TypeScript-only**, so Graph-Aware Mode is N/A. `Note: build-graph skipped — project is not TypeScript; no graph.db needed.` (See §6.)
- Two classes of test must stay distinct throughout:
  - **Artifact/contract tests** — assert that a *file* (CLI output JSON, report Markdown, rubric scoring of a fixture plan) matches a schema/snapshot. Cheap, deterministic.
  - **Live-behavior tests** — invoke the *real* CLI as a subprocess against a real (or recorded) track and assert observable side-effects (exit code, file written, metrics non-zero).

## 1. Testing Pyramid Per Phase
| Phase | Unit (artifact/contract) | Integration (subprocess, bounded) | E2E (live) |
|---|---|---|---|
| 1 Harness | CLI arg-parsing snapshot; temp-dir layout schema | `measure benchmark --dry-run <fixture-track>` exits 0, writes expected file paths | one real model, one 2-task fixture track, wall-time captured |
| 2 Scoring | rubric JSON schema; scorer pure-function on canned `plan.md` + `git log` fixtures | scorer CLI on a recorded fixture produces stable JSON | scorer on output of a real Phase 1 run |
| 3 Reporting | report Markdown snapshot from canned `<model>.json` inputs | `measure benchmark:report` reads fixture dir, writes ranking table | report on real Phase 4 multi-model output |
| 4 Verification | n/a (this phase **is** the live proof) | n/a | full pipeline: 2 tracks × 2 models, human-readable report, `tech-stack.md` PR |

Heavy bias to the bottom two rows in Phases 1–3, capped E2E in Phase 4.

## 2. Shared Fixtures & Mocks (place under `measure/tracks/agent_performance_benchmarking_20260527/fixtures/`)
- `fixtures/tracks/mini-feature/` — 2-task plan, deterministic spec, hand-written “golden” git log.
- `fixtures/tracks/mini-bug/` — same shape, bug type, for grouping tests.
- `fixtures/model-runs/<model>.json` — canned harness output for scorer/report tests so Phase 2 & 3 are not blocked on Phase 4.
- `fixtures/expected/report.md`, `fixtures/expected/scorer.json` — snapshot oracles.
- **Fake model adapter** (`fixtures/adapters/echo-model.sh`) — deterministic stub that emits a scripted tool-call trace. **Plumbing-only**, never substitutes for the live-proof gate in §7.

## 3. Cross-Phase Edge Cases & Dependencies
- Temp-dir isolation must survive crashes (Phase 1 must `trap` cleanup or scorer/report read leaked state — Phase 2/3 break silently).
- Wall-clock metric depends on system load; tests assert `> 0`, not absolute values.
- `git log` parsing in Phase 2 depends on Phase 1 producing a real, signed commit history inside the temp dir. Contract: harness writes `run.json` containing `final_sha` + `commits[]`; scorer reads only from that file, not from live `git`. Decouples phases.
- Report (Phase 3) must tolerate **partial runs** (model errored, no JSON). Test with one missing `<model>.json` fixture.
- Phase 4 `tech-stack.md` update is data-driven; snapshot test rejects edits whose “recommended model” doesn’t appear in any `<model>.json`.

## 4. Architecture Guardrails
- **One-way data flow**: harness → JSON files → scorer → JSON files → reporter → Markdown. No phase reaches across.
- Scorer and reporter are **pure** w.r.t. filesystem inputs (no network, no `git` shellouts). Enforce by reviewer checklist.
- All CLI entrypoints accept `--fixtures-dir` so live and contract tests share the same code path.
- `measure/benchmarks/` output dir is git-ignored except for `.gitkeep`; tests assert the ignore rule.
- No model API keys in fixtures or logs; reviewer-gate.

## 5. Per-Phase Test Approach Notes
- **Phase 1**: write the harness CLI’s `--help` snapshot **first** (Red), then `--dry-run`, then add one live adapter behind a flag. Defer real model wiring until §7 P1 gate passes.
- **Phase 2**: TDD the rubric scorer as a pure function over fixtures before any plan-adherence heuristic; commit rubric JSON schema in the same change as the first failing test.
- **Phase 3**: snapshot-driven; freeze the ranking-table format in a fixture before touching format code. Group-by-type test uses 4 canned files, one per type.
- **Phase 4**: explicitly a **live-proof phase** — no new unit tests; instead, executes §7 P1+P2+P3 gates end-to-end and produces the artifact that updates `tech-stack.md`.

## 6. build-graph Findings That Shaped This Strategy
- `which build-graph` → present; `ls graph.db` → absent; `glob **/*.ts` → 0 files. Decision: **do not scan**. Documented Note above. Symbol-level caller checks are inapplicable; reviewer guardrails in §4 substitute.
- Because there is no symbol graph, blast-radius is bounded by **file paths**: any change outside `measure/tracks/agent_performance_benchmarking_20260527/`, `claude-skills/measure/scripts/`, or a new `bin/measure-benchmark*` is out-of-scope and must be flagged in review.

## 7. Live-Proof Plan (Red command → Green/closeout gate)
Each phase has a **targeted Red** that must fail before code exists and a **bounded Green** that proves live behavior without invoking a full suite.

| Phase | Targeted Red (must fail first) | Green / closeout gate (live, bounded) |
|---|---|---|
| 1 | `bin/measure-benchmark --help \| diff - fixtures/expected/help.txt` (cmd not found) | `bin/measure-benchmark run --track fixtures/tracks/mini-feature --models echo --out /tmp/bm.$$ && jq -e '.wall_ms>0 and (.tool_calls\|type=="number")' /tmp/bm.$$/echo.json` |
| 2 | `bin/measure-benchmark score --in fixtures/model-runs/echo.json \| diff - fixtures/expected/scorer.json` (cmd not found) | same command after impl, **exit 0**, plus `jq -e '.tdd_followed\|type=="boolean"'` on a *second*, unseen fixture (`fixtures/model-runs/echo-bug.json`) to prevent snapshot overfitting |
| 3 | `bin/measure-benchmark report --in fixtures/model-runs/ \| diff - fixtures/expected/report.md` (cmd not found) | same command after impl, **exit 0**, plus run on a dir with one **corrupt** JSON to assert non-zero exit + readable stderr (bounded failure mode) |
| 4 | `test -f measure/benchmarks/<sample-track>/<model>.json` (file absent) | run harness on **2 real tracks × 2 real models** (timeout 15 min total), then `bin/measure-benchmark report` produces a Markdown table containing both models; reviewer signs off; `tech-stack.md` diff shows new recommendation lines |

Each Green gate names **exact files and commands** — no `find … -name '*test*' \| xargs` style aggregate discovery, so an intentionally-red file cannot be swept in.

### Fake-harness boundary
`fixtures/adapters/echo-model.sh` is used **only** to exercise Phase 1 runner plumbing and to seed Phase 2/3 fixtures. Every production gate command it touches (P1, P2, P3 Green rows) is **also** covered by a bounded non-fake proof in Phase 4 against real models. The fake adapter is selected by explicit `--models echo` only; the harness must `exit 3` if `--models` is empty, so a missing flag cannot silently fall through into a full-suite run.

## 8. Intentionally-Red Files
- `fixtures/model-runs/echo-bug.json` (Phase 2 Green) and `fixtures/model-runs/corrupt.json` (Phase 3 Green) are **deliberately constructed to fail naive parsers**.
- They live under `fixtures/` which is **never** auto-discovered: every gate command above names the input file explicitly. There is no glob-based runner in this project. Ownership: both files are created by, and remain `[~]`-owned by, the Phase that consumes them until that Phase closes; reviewer must confirm `[x]` flips only after the corresponding Green gate in §7 passes.
