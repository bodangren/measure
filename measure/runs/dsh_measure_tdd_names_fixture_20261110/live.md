# TDD names and fixture paths: evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## New rules (shared core, all three adapters)

- test files: `_test.dart`, `_test.rb` (Dart and minitest conventions);
- test commands: `node --run test`, `cargo nextest run`, `dart test`, `flutter test`;
- negatives: `node --run build`, `cargo nextest list`, and non-test Dart/Ruby source files stay non-test.

## Detection proof (the pre-fix rules miss all five)

```
old a_test.dart: false   old b_test.rb: false
old node --run test: false
old dart test: false     old cargo nextest run: false
```

## Fixture paths

`sync-real.sh` reads `measure/archive/agent_performance_benchmarking_20260527/plan.md` and `measure/archive/measure_guard_20261004/plan.md`; both exist and `jq -Rs .` parses each. `real.ts` was not regenerated (the script says to re-run only when a test needs newer real data; it stays a frozen snapshot).

## Live check (core changed; install + reload)

```
PASS live: HTTP 200 with a band field; digest sha256:a430b66932b86b5cc matches the installed copy
```

## Gates

- node: 354/354 pass
- parity: ok (both gates, copies in sync)
- srg: 12/12 suites
- CLI: 14/14
