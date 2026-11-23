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

- Commit: 2b1b0b2. Model: openai/gpt-6.1-terra#high. Verdict: fail.
- F6 (Blocker): `./heavy-run.sh -c vite` is required refused but no rule matches it. Disposition: accepted, fixed in the amendment commit.
- F7 (Blocker): wrapper option parsing is undefined. Disposition: accepted, fixed in the amendment commit.
- F3 to F5 are closed.

### Round 4

- Commit: 22cfbad. Model: openai/gpt-6.1-terra#high. Verdict: fail.
- F8 (Blocker): `env -S 'vite --port 3000'` passes because `-S` consumes the string as an option value. Disposition: accepted, fixed in the amendment commit.
- F6 and F7 are closed.

### Round 5

- Commit: 15a20f0. Model: openai/gpt-6.1-terra#high (same reviewer session as Rounds 1 to 4). Verdict: pass.
- F8 is closed.
- F9 [Nit]: the `env -S` rule ignores the arguments after the `-S` string, so `env -S 'tsc' --noEmit` is allowed. Disposition: declined for this track (a limited wrapper form beyond the contract); the closeout records it as a tech-debt row.
- Gate: role-gate spec-review exit 0 (evidence `measure/runs/heavy_run_guard_20261123/spec-review-15a20f0.json`).
