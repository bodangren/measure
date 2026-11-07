# Spec Review: dsh_measure_registry_fix4_20261107

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-08
Reviewer: subagent (fresh context, default model)

### What this track proposes

Closing the precision gaps the fix3 review left in the registry checker: pinning
the empty-description fallback to the **label-stripped bold title**, adding an
empty-metadata fallback mismatch fixture, rejecting non-bold reason entries and
`[~]` entries inside `## Archived Tracks` with fixtures, naming the fix3 evidence
file and the python3 JSON mechanism, delivering fix3's `spec-review.md` with
dispositions plus a dated correction note, and re-running the gates and closeout.

### How the current system works, per this spec

`measure/tracks.md` is a three-section registry (Active, Cancelled, Archived);
Archived entries are title/link/one description matching the archive metadata or,
when empty, the label-stripped bold title. `tests/dsh/test-registry.sh` enforced
section placement for bold entries, own-link, one description, metadata equality,
old-shape rejection, orphans, one entry per directory, and one active track with
isolated fixtures; before this track a reason entry or `[~]` entry inside Archived
still passed, fix3 had no evidence file or review record, and the JSON read uses
python3.

### Findings

- F1 [Major] spec.md FR-4 / plan Task 2.1: "the review's findings F1–F7" was never enumerated or sourced — fix3's `spec-review.md` is itself the deliverable — so a fresh implementer had to reconstruct seven findings and the F7 wording correction.
- F2 [Major] spec.md FR-3 / plan Task 1.2: "the eleven PASS lines" contradicted the post-fixture run, which prints fourteen (the delivered evidence lists fourteen).
- F3 [Major] spec.md FR-3: "the closeout output (manifest-only FAIL)" misstated fix3's closeout at review time — four `[x]` tasks had no commit SHA, so it also reported four missing-SHA failures.
- F4 [Major] plan Task 2.1: the evidence was completed with gate results before Task 2.2 ran them and with the closeout before Task 3.1 ran it.
- F5 [Major] plan Task 3.1 / spec FR-3: fix4's own gates and closeout were told to be "recorded" but the only named file was fix3's; no fix4 evidence file existed.
- F6 [Nit] spec Overview: "four precision items" was followed by five.
- F7 [Nit] plan Task 1.1: the fallback half changed no checker line (the test already stripped the title label), so only the two section rules and the fixtures were new.
- F8 [Nit] spec.md FR-2: the fallback fixture was negative-only, so the exact string was pinned only by `visual_refresh`'s production entry.

### Author Response

- F1: FIX (the fix3 review record is written with F1–F7 verbatim and linked from fix3's index; this track's evidence cites it, and this record names this round's findings)
- F2: FIX (the evidence file lists fourteen PASS lines and states the original eleven plus the three new cases)
- F3: FIX (fix3's plan SHAs were repaired — 2.1/2.2/3.1 and the Phase 3 verification now carry SHAs — and both closeout outputs now report only the expected manifest FAIL, recorded in the evidence)
- F4: FIX (the evidence file was written after the gates and the closeout ran; the plan's task order is noted in the archived plan)
- F5: FIX (`measure/runs/dsh_measure_registry_fix4_20261107/evidence.md` now holds this track's gates, counts, and both closeout outputs; the archived plan names it)
- F6: FIX (the correction note says five items)
- F7: FIX (the record says the fallback was already label-stripped; only the section rules and fixtures were new)
- F8: FIX (the evidence and the correction note state that the fallback string is the label-stripped bold title; the empty-fallback negative fixture pins the mismatch and `visual_refresh` pins the exact production string)
