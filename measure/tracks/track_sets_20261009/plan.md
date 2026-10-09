# Implementation Plan: Track Sets (create related tracks in one pass)

Track: `track_sets_20261009`
Spec: [./spec.md](./spec.md)

> Work on the branch `feat/track-sets`. The installer copies skills from `main`, so the change reaches the agents after the merge. Edit `skills/measure/` first, then copy each changed file to `claude-skills/measure/`.

---

## Phase S1: Track set path in new-track
_Story ref: spec.md#story-s1_

- [x] Task 1.1: Define acceptance criteria for the track set path `91c30ea`
    - [x] Write the detection rule (when to offer a set) and the exact question with its options
    - [x] Write the section list of `new-track-set.md` and the two review gates
- [x] Task 1.2: Write `skills/measure/references/new-track-set.md` sections 1.0 to 2.8 (setup, questioning, member list, spec format, overview gate, tech debt, templates and sample gate, skills) `c48ef5e`
- [ ] Task 1.3: Add the set detection step at the end of `new-track.md` §2.1 (no renumbering)
- [ ] Task: Measure - User Manual Verification 'Phase S1: Track set path in new-track' (Protocol in workflow.md)

---

## Phase S2: Set overview and member metadata
_Story ref: spec.md#story-s2_

- [ ] Task 2.1: Define acceptance criteria for the overview template, the `set` key, and the order rule
- [ ] Task 2.2: Write `new-track-set.md` section 2.9 (artifacts: IDs, overview template, index link, member files, `set` schema, registry line, verification, one commit) and section 3.0 (read-side rules)
- [ ] Task 2.3: Add the optional `set` key note to the `metadata.json` schema in `new-track.md` §2.5
- [ ] Task: Measure - User Manual Verification 'Phase S2: Set overview and member metadata' (Protocol in workflow.md)

---

## Phase S3: Keep a set current during implement, archive, and revert
_Story ref: spec.md#story-s3_

- [ ] Task 3.1: Define acceptance criteria for the dependency warning and the overview updates
- [ ] Task 3.2: Edit `implement.md`: dependency check in §2.0, overview load in §3.2, status sync in §3.1 and §3.4, link update in the §5.0 archive
- [ ] Task 3.3: Edit `review.md` §3.3 (archive link) and `revert.md` (overview status after a revert)
- [ ] Task: Measure - User Manual Verification 'Phase S3: Keep a set current' (Protocol in workflow.md)

---

## Phase S4: Documentation and bundle parity
_Story ref: spec.md#story-s4_

- [ ] Task 4.1: Edit `SKILL.md`: description triggers, "Track Sets (optional)" subsection, `sets/` in the directory tree, "New Track Set" command
- [ ] Task 4.2: Edit `README.md` (commands table, optional features) and `measure/product.md` (key features)
- [ ] Task 4.3: Copy the changed skill files to `claude-skills/measure/`; `diff -r skills/measure claude-skills/measure` shows no difference; audit cross-references (§ numbers, file names)
- [ ] Task: Measure - User Manual Verification 'Phase S4: Documentation and bundle parity' (Protocol in workflow.md)

---

## Phase S5: Dry run against a real set
_Story ref: spec.md#story-s5_

- [ ] Task 5.1: A fresh agent follows `new-track-set.md` for the Riven Lands request (read-only, output to a scratch folder) and reports its artifact list and every guess
- [ ] Task 5.2: Correct the reference for each ambiguity; record the report and the corrections in `dry-run.md`; copy to `claude-skills/measure/`
- [ ] Task: Measure - User Manual Verification 'Phase S5: Dry run against a real set' (Protocol in workflow.md)
