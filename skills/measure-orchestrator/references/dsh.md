# Measure on the DeepSeek Harness agent team

This reference maps the Measure subagent roles onto DeepSeek Harness (DSH)
subagents. It is the DSH counterpart of the role registry that the Claude Code
mod and the OpenCode plugin install as `agents/measure-*.md`; the role files stay
the single source of the role contracts, and this file fixes only the harness
mechanics.

## 1. What is different on DSH

- DSH has no role registry. A role is a **prompt** given to a subagent, not a
  named agent type. The role file supplies the prompt body; the orchestrator
  supplies the provider and model.
- DSH subagents share the filesystem and the git checkout with the parent. Two
  children that write the same files will race: keep write scopes disjoint, as
  the orchestrator does for phases.
- The guard plugin (`plugins/dsh-measure-guard`) enforces the plan markers at
  the profile level, not per role: a child that edits files outside `measure/`
  without a `[~]` task is denied in `guard` and `strict` modes, exactly like the
  parent.
- Tool access is not restricted by the role file. Each role prompt restates its
  restrictions (section 5), and the guard plus separate write scopes enforce
  them in practice.

## 2. Subagent tools

`subagent` starts a child and returns its id immediately; `subagent_fork`
starts a child seeded with the current conversation (use it only for work that
needs the parent's context). Both take:

```text
description: 3-5 words for the UI
prompt: the complete, self-contained task (the role prompt, section 4)
provider + model: together, the role's model from the table
reasoning_effort: optional, only where the model supports it
cwd: the repository root (relative paths resolve from the parent's directory)
```

The child reports with `send_message`; `send_message` also steers a running
child. Do not start a child and then poll: end the turn and let the runtime wake
you, or wait with `wait_agent` only when another member is running.

## 3. Models available in this installation

The web profile's `subagent-model-selection-settings.allowedModels` names:

| Provider | Model id |
|---|---|
| `deepseek-official` | `deepseek-flash` |
| `minimax-cn` | `MiniMax-M3.1-Flash` |
| `xiaomi` | `mimo-v2.6-flash` |
| `xiaomi` | `mimo-v2.6-pro` |
| `kimi-coding` | `k3.1-pro` |
| `kimi-coding` | `kimi-for-coding` |

A profile that changed that list must change this table and the role table
below; `bin/measure-dsh --check` does not read the profile's model list, so the
operator owns the consistency.

## 4. Role table

The prompt is the body of the named file without its YAML frontmatter.

| Role | Prompt source | Provider/model |
|---|---|---|
| `measure-orchestrator` | `agents/measure-orchestrator.md` | `deepseek-official/deepseek-flash` |
| `measure-spec-review` | `agents/measure-spec-review.md` | `kimi-coding/k3.1-pro` |
| `measure-strategy` | `agents/measure-strategy.md` | `deepseek-official/deepseek-flash` |
| `measure-mid-red` | `agents/measure-mid-red.md` | `deepseek-official/deepseek-flash` |
| `measure-jr-green` | `agents/measure-jr-green.md` | `deepseek-official/deepseek-flash` |
| `measure-review-a-correctness` | `agents/measure-review-a-correctness.md` | `xiaomi/mimo-v2.6-pro` |
| `measure-review-b-security` | `agents/measure-review-b-security.md` | `kimi-coding/k3.1-pro` |
| `measure-review-c-ux-api` | `agents/measure-review-c-ux-api.md` | `minimax-cn/MiniMax-M3.1-Flash` |
| `measure-phase-acceptance` | `agents/measure-phase-acceptance.md` | `xiaomi/mimo-v2.6-pro` |
| `measure-adversarial-testing` | `agents/measure-adversarial-testing.md` | `minimax-cn/MiniMax-M3.1-Flash` |
| `measure-ux-browser-review` | `agents/measure-ux-browser-review.md` | `minimax-cn/MiniMax-M3.1-Flash` |
| `measure-final-acceptance` | `agents/measure-final-acceptance.md` | `kimi-coding/k3.1-pro` |
| `measure-closeout` | `agents/measure-closeout.md` | `deepseek-official/deepseek-flash` |
| `measure-orchestrator-audit` | `agents/measure-orchestrator-audit.md` | `xiaomi/mimo-v2.6-pro` |

## 5. Prompt template

```text
You are <role>. <The role file's description line.>

Project: <repository root>. Measure track: <track id>.
Read <the input files the role names>. Follow your role contract below.
Return the MEASURE_AGENT_RESULT block described below.

<agents/measure-<role>.md body without YAML frontmatter>
```

The result block, at the end of the child's final message:

```text
MEASURE_AGENT_RESULT
role: <role>
phase: <track setup | phase N>
status: <pass | fail | blocked | inconclusive>
findings: <one line per finding, or "none">
evidence: <the commands run and their results>
```

Two roles keep their own formats when the role file defines one (the spec
review role returns the three report subsections; the orchestrator audit returns
its audit schema). The block above is the fallback.

Per-role restrictions, restated for the harness:

- Every role except `measure-closeout` edits only `measure/runs/**`; no role
  runs git write commands.
- Review and acceptance roles never edit source files.
- `measure-closeout` may edit the track documents and `measure/tracks.md`.
- The orchestrator delegates and never implements.
- A role that must write code is a Green or coder role and gets an explicit
  write scope from the orchestrator.

## 6. Independence and the three-family review

Reviewers never share a family, and a reviewer should not share the author's
family where the profile allows it:

| Review role | Family |
|---|---|
| `measure-review-a-correctness` | Xiaomi (MiMo) |
| `measure-review-b-security` | Kimi |
| `measure-review-c-ux-api` | MiniMax |
| `measure-spec-review` | Kimi (author-side families: DeepSeek, MiniMax) |

The orchestrator spawns the three review roles in one message so they run in
parallel, and keeps their reports separate (`measure/runs/<track>/review-*.md`).

## 7. Guard-marker handoffs

The guard plugin is the harness-level contract between roles:

1. Before a role edits a file outside `measure/`, the task line in the track
   plan must be `[~]`. The orchestrator marks it before spawning the writer.
2. A Green role commits the task and the orchestrator records the short SHA on
   the task line. The guard's end-of-turn check reports an `[x]` task without a
   SHA.
3. A phase can start while the previous phase heading has no
   `[checkpoint: <sha>]`, because phases can run at the same time. The closeout
   guard then sends a note that names the checkpoint protocol.
4. A track may be archived only when every task is closed; the closeout guard
   denies `[x]` on `tracks.md` while a plan has an open task.

`/measure-off` (session scope) and `/measure-off repo` are the escape hatches;
`/measure-status` opens the panel.

## 8. Workflow commands in DSH

The guard plugin registers the Measure workflows as commands: `measure-setup`,
`measure-new-track`, `measure-new-track-set`, `measure-implement`,
`measure-review`, `measure-revert`, `measure-doctor`, `measure-orchestrate`.
Each one steers the receiving agent with the matching workflow instruction; the
command line's remaining words are forwarded as `Arguments:`.

## 9. Unverified on this installation

- `subagent_fork` seeding was read from the package README, not exercised in
  this track.
- The `reasoning_effort` values are model-specific; check the model's options
  before passing one.
- The per-role tool restrictions are prompt-level, not enforced by DSH.

## 10. Rehearsal

A rehearsal runs one Measure phase through real DSH subagents with the guard
watching, so the role mapping is proven rather than described. It is the
recommended smoke test after a plugin change.

1. **Build the fixture.**
   `bash tests/dsh/rehearsal/make-project.sh` prints the canonical root of a
   disposable git repository with one `[~]` track, one phase, one `[~]` task,
   and a `metadata.json`. `make-project.sh --cleanup <dir>` removes it later.
2. **Make the fixture strict.** Preferred: a session whose working directory is
   the fixture runs `/measure-mode strict repo`. From the Lead's session (whose
   root is this repository) write the same seam directly:
   `~/.local/state/measure/dsh-guard/repos.json` gains
   `{"<fixture root>": {"mode": "strict"}}`, then `bin/measure-dsh reload`.
3. **The roles must run in a session whose working directory is the fixture.**
   This is the fact a rehearsal run established: a child spawned with the
   `subagent` tool's `cwd` option gets that directory for its shell commands,
   but its **guard root stays the parent session's working directory** (the
   child received the parent repository's plan problems, and its fixture writes
   — outside that root — were allowed). So from a session opened in this
   repository, a child agent cannot rehearse a disposable project under the
   guard. Open a DSH session whose working directory is the fixture and run the
   roles there; only then does the fixture's strict override govern the edits.
4. **In that fixture session, spawn Red and Green** (plain subagents of *that*
   session, or prompts in it): Red writes a failing test and runs it; Green
   runs the failing test itself, then implements until green, commits with a
   git note, and records the short SHA. **The Red record is per agent:** strict
   mode denies a source edit until *that agent* has both a test-file change and
   a failed test run, so a Green agent that only re-runs the Red agent's test is
   still denied: it must **change a test file** (for example add a case) and
   run the tests to see them fail, or keep the rehearsal in `guard` mode.
   An edit under `measure/` skips the edit and TDD guards, so it never needs the
   Red phase — but it is not unconditionally allowed: the closeout guard denies a
   `tracks.md` close with an open task and a plan phase started without a
   checkpoint, and the registry tool and shell writes to `tracks.md`/`plan.md`
   are denied (use the edit/write tools).
   (`dsh --profile headless` cannot host the guard: the plugin's required
   `inject` includes `webServer`, so the entry stays pending in the headless
   app, and the headless profile has no stored LLM credentials.)
5. **Spawn Review** (read-only, `cwd` = the fixture): compare the result with the
   plan and report.
6. **Capture the evidence:** fixture path, the subagent targets, the strict deny
   text observed (if any), the test failure and pass output, and the commit.
7. **Clean up:** clear the *fixture root's* override — in a session whose
   working directory is the fixture `/measure-mode default repo` does that;
   otherwise remove the root's entry from `repos.json` — then
   `bin/measure-dsh reload` and `make-project.sh --cleanup <fixture>`. The
   reload is required in both directions: the plugin caches its repository store
   for the lifetime of the instance.

The integration facts the rehearsal established: the guard applies to a child
agent through the **parent session's** working directory (the `cwd` option
changes only its shell directory); `measure/` edits never need the Red phase but
are not unconditionally allowed (the closeout guard and the registry/shell
denies still apply); and the per-agent Red record makes the role handoff
explicit. The strict deny path is proven in a session whose working directory is the
fixture: open one with the host's session RPC (`POST /api/session/create` with
`{ cwd: <fixture> }`; the GUI's own page context already holds the auth cookie,
and `tests/dsh/rehearsal/host-api.mjs` is the operator form). Set the fixture
root's mode override to `strict`, reload with a **semantic** change (a comment
marker is not enough — the loader ignores it), then prompt a source edit with no
Red phase: the reply carries the strict deny. A subagent of another session
still cannot do this, because its guard root stays that parent session's root.

