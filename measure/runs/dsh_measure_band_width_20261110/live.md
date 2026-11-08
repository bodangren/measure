# band width: evidence

Date: 2026-11-08 (track records use the 2026-11-10 track date)

## The cap

`compactBand` caps by terminal columns: wide/fullwidth code points, emoji, and CJK extension planes count 2; combining marks count 0; everything else 1. `BAND_MAX` stays 160 columns, so ASCII behavior is identical to the old character-based contract (the pinned word-boundary test passes unchanged).

```
字 x80  (160 columns)  -> unchanged
字 x100 (200 columns) -> 79 wide chars + …, 80 characters
40 ASCII + 200 combining marks -> unchanged (40 columns)
```

## Detection proof

The pre-fix character-based function returns the 100-character (200-column) line unchanged with no ellipsis; the new test asserts the ellipsis and the 80-character bound, so it fails on the old rule.

## Chips

The secondary chips (`Guards:`, `Mode:`, and `Goal:`) share `whiteSpace: nowrap`, `overflow: hidden`, `textOverflow: ellipsis`, `flexShrink: 0`, and bounded `maxWidth` (33%; goal 40%), so on a narrow viewport they ellipsize instead of clipping; a render test pins every chip style and the goal bound.

## Live check (client-state.js and client.js changed)

```
PASS live: HTTP 200 with a band field; digest sha256:a2a6ee3e7d072c84a matches the installed copy
```

## Gates

- node: 354/354 pass (two new tests)
- srg: 12/12 suites
- CLI: 14/14
- parity: ok (both gates)
