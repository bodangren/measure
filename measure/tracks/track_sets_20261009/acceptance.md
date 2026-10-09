# Acceptance criteria by task

Each section is written before the edits of its phase (workflow.md, step 3: Red phase).

## Task 1.1: The track set path

### Detection rule (new-track.md §2.1, new step 4, at the end of the list)

Offer a track set when one of these is true:

1. The user asks for more than one track (for example "a set of tracks", "tracks for each", "one track per").
2. The agent's reading of the scope gives 3 or more units of work that each close on their own acceptance criteria (for example one per module, service, family, or game).

In all other cases, ask nothing and continue with §2.2. The step does not renumber §2.1 steps 1 to 3.

The question (exclusive choice):

- Header: `Track scope`
- Question: "This request covers several units of work. Should I create one track or a track set?"
- Options: **Track set (Recommended)**, "Several tracks from one set of shared decisions, with an overview page, two review gates, and one commit." **One track**, "One spec and one plan for the whole request." Then "Type your own answer".
- On **Track set**: read `references/new-track-set.md`, follow it, and stop this workflow.

### Sections of `references/new-track-set.md`

| Section | Content |
| --- | --- |
| Prerequisites, 1.0 Setup Check | The same core-context check as new-track 1.0. |
| 2.1 Confirm the Set Goal | One sentence. |
| 2.2 Shared Questioning | One questioning phase, batches of 4 or fewer. Required topics: scope and order, split rule, shared decisions, start gate. Graph probe and brownfield rules by reference to new-track §2.2. Summary before drafting. |
| 2.3 Draft the Member List | Columns: order, short name, type, scope, depends on. Rules: each member closes on its own; a dependency has a lower order or is outside the set; more than 20 members needs a confirmation. |
| 2.4 Choose Spec Formats | One choice for the set, with an override per member. |
| 2.5 Draft the Set Overview | Review gate 1: the overview with the member list. |
| 2.6 Surface Relevant Tech Debt | Once for the set. |
| 2.7 Draft Member Templates and Samples | Template groups; one full sample per group and every unique member; review gate 2; generation from the approved templates; structural exceptions shown alone. |
| 2.8 Skill Recommendation | Once for the set, by reference to new-track §2.4 and §2.4.1. |

### Review gates

- Exactly two Approve/Revise gates: gate 1 (§2.5) and gate 2 (§2.7). A Revise answer repeats the same gate; it does not add a gate.
- The agent shows no per-member Approve/Revise for members that the template produces without a structural change.

## Task 2.1: The overview, the `set` key, and the order rule

### Location

- Resolve **Track Sets Directory** through the index. If the index has no such link, use `measure/sets/`, create it, and add a link labeled **Track Sets Directory** to `./sets/` next to the **Tracks Directory** link in `measure/index.md`. The skill has no default-path list, so the index link is the record.
- The overview file is `<Track Sets Directory>/<set_id>.md`. `set_id` is `<shortname>_YYYYMMDD` and differs from every member track ID.

### Overview template (section 2.9 step 3)

Headings, in this order: `# Track Set: <set title>`, a fact list (Set ID, Status, Created, Goal), `## Shared Decisions` (table: Date, Question, Decision), `## Members` (table: Order, Track, Type, Scope, Depends on, Status), `## Shared Rules`, `## Open Questions`.

- The Track cell links the track folder relative to the overview: `../tracks/<track_id>/`, or `../archive/<track_id>/` after an archive.
- Status values for the set and for each member: `new`, `in_progress`, `completed`. These are the `metadata.json` status values.

### `set` key in member `metadata.json`

```json
"set": { "id": "<set_id>", "order": 1, "depends_on": ["<track_id>"] }
```

- Present only on members. Absent on standalone tracks. Not written as `null` or `{}`.
- `depends_on` is an array (empty when there is no dependency).
- Order rule: each `depends_on` entry is a member with a lower `order`, or a track outside the set. No tool checks this; section 2.9 verifies it once at creation.

### Member files

- `spec.md`: a `## Track Set` section directly after the overview section, with the set title, a link to the overview, the order, the dependencies, and one sentence: the shared decisions in the overview apply to this track.
- `index.md`: one more link, `[Track Set](<relative path to the overview>)`. From `measure/tracks/<id>/` the path is `../../sets/<set_id>.md`; the same path works after an archive to `measure/archive/<id>/`.
- Registry: members in order, each in its own `---` section, with one more line under the link: `*Set: <set title> (`<set_id>`), order <n>*`.

### Verification and commit (section 2.9 steps 8 and 9)

- Every member folder has `index.md`, `spec.md`, `plan.md`, and `metadata.json`; every `metadata.json` parses as JSON; every `depends_on` ID exists in the **Tracks Directory** or `measure/archive/`, and obeys the order rule.
- One commit with explicit paths: `chore(measure): Add track set '<set title>' (<n> tracks)`.

### Read-side rules (section 3.0)

- A track without `set` is a standalone track. No workflow warns about the absence.
- A missing overview file, or a member that the overview does not list, is a warning, never a HALT.
