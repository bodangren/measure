# Spec Review: heavy_run_guard_20261123

Author model: opencode-go/muse-spark-1.3-contributor

## Spec Review

### Round 1

- Commit: 7e29f5d. Model: openai/gpt-6.1-terra#high. Verdict: fail.
- F1 (Blocker): FR-3 whole-command heavy-run pass conflicts with FR-5. Disposition: accepted, fixed in the amendment commit.
- F2 (Blocker): a segment fits two classes; `playwright test` sits in the full-suite list. Disposition: accepted, fixed in the amendment commit.
- F3 (Blocker): the matcher misses direct forms (`CI=1 vite`, `npm run test`, `node --test`). Disposition: accepted, fixed in the amendment commit.
- F4 (Blocker): file operand is undefined. Disposition: accepted, fixed in the amendment commit.
- F5 (Blocker): installer verification proves nothing because the installer reads main. Disposition: accepted, fixed in the amendment commit.

### Round 2

- Commit: 31de549. Model: openai/gpt-6.1-terra#high. Verdict: fail.
- F3 (Blocker): `env CI=1 vite` passes because argv[0] is `env`. Disposition: accepted, fixed in the amendment commit.
- F4 (Blocker): `pytest -k expression` reads as a file operand. Disposition: accepted, fixed in the amendment commit.
- F5 (Blocker): `diff -r` fails on the installer stamp. Disposition: accepted, fixed in the amendment commit.
- F6 (Blocker): basename-only heavy-run form lets `./heavy-run.sh` pass. Disposition: accepted, fixed in the amendment commit.

### Round 3

(empty)
