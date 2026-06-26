# WF Mode - Long Task Workflow

Use this when work is long, difficult, uncertain, multi-file, multi-agent, or user-triggered with `/wf`, `wf mode`, `workflow mode`, or `wk mode`.

This is a Ralph-style harness loop: keep moving through evidence, bounded exploration, second planning, implementation, review, verification, and recovery instead of stalling on the first obstacle.

## Trigger

Enter WF mode when any of these are true:

- The user explicitly says `/wf`, `wf mode`, `workflow mode`, `wk mode`, or asks for the full workflow.
- The task needs more than one step, more than three files, or more than one subsystem.
- The task needs research, architecture judgment, browser/API validation, or migration planning.
- Confidence in intent, architecture, or implementation is below 95%.
- The same command, test, tool, or approach fails twice.
- The user explicitly says `/wf-max [task]` or `wf max` (for maximum-parallelism mode, see [WF-MAX.md](WF-MAX.md)).

**Two distinct trigger classes — do not conflate them:**

- **Explicit invocation** (`/wf`, `wf mode`, `workflow mode`, `wk mode`, `/wf-max`): subagent fan-out is **mandatory and unconditional**. File count, task size, and subsystem count are IRRELEVANT — a 1-file task typed with `/wf` still fans out to ≥3 subagents before the second plan. There is no "too small for WF" exception once the user types the command.
- **Auto-triggering** (the file-count / multi-subsystem / repeated-failure bullets above): these decide whether the harness enters WF mode *on its own*. They are the ONLY place file count matters, and they can only ESCALATE into WF — never downgrade an explicit command out of it.

## Multi-Subagent Requirement

WF mode requires multi-subagent orchestration by default.

- Explicit `/wf`, `wf mode`, `workflow mode`, or `wk mode` MUST spawn at least 3 distinct subagents from `.claude/agents/` before second planning unless the runtime cannot spawn subagents.
- Collaboration decision tree (replaces the old "7:3" heuristic — concrete conditions, not a magic number):
  - **In explicit WF/WK mode** → ALWAYS multi-agent (≥3 subagents before second plan). No exceptions.
  - **3+ files changed** → multi-agent (at minimum: planner + implementer + reviewer).
  - **Cross-layer change** (DB + API + UI) → multi-agent with architect + implementer(s) + reviewer.
  - **Uncertain scope or approach** → multi-agent exploration (planner + researcher + architect).
  - **1-2 files, well-understood, not in WF mode** → solo is acceptable.
  - **Repeated failure on same task** → STOP solo, switch to multi-agent.
- Default initial fan-out: `planner`, `researcher` or `docs-researcher`, and `architect`. Add `test-writer`, `reviewer`, `debugger`, or `verifier` when the phase needs them.
- **Exploration Gate (HARD):**
  - [ ] CEO has NOT read any source files — only `Harness/` docs, `CLAUDE.md`, and subagent returns. This is the #1 rule. **Exception**: if subagents are genuinely unavailable, fall back to bounded-pass emulation and record `Fallback: subagents unavailable` in PLAN.md.
  - [ ] CEO overrides model per-agent: default `sonnet` for real code understanding; `haiku` only for shallow scans (directory listing, file counts); `opus` if user requests.
  - [ ] ≥3 distinct agent types, each with ONE specific question.
  - [ ] All spawned in ONE message block.
  - [ ] Agent count ≥ max(3, ceil(estimated_dirs / 2)) — estimate from prompt/docs; run a second wave if returns reveal more.
- Record every dispatch or bounded-pass fallback in `Harness/tasks/<task-id>/PLAN.md#Subagent Dispatch`.
- If subagents are unavailable, emulate the same roles as separate bounded passes and record why the fallback was used.

For maximum-parallelism mode (write-set coloring, wave dispatch, parallel reviewers), use `/wf-max [task]` and see [WF-MAX.md](WF-MAX.md).

## WF Loop

```text
Intake
-> confidence gate
-> parallel planner / researcher / docs-researcher / architect subagents
-> synthesis
-> second plan
-> test-writer
-> implementer
-> reviewers
-> verifier
-> if failed: debugger -> review -> e2e/API verification -> loop
-> close with evidence
```

## Intake

1. Read `CLAUDE.md`, `Harness/MEMORY.md`, `Harness/README.md`, `Harness/PROGRESS.md`, and the current task's `PROGRESS.md` and `PLAN.md` under `Harness/tasks/<task-id>/`.
2. State the goal, non-goals, confidence level, known risks, and write boundaries.
3. Ask up to three blocking questions only when the next action cannot reach 95% confidence.
4. Update `Harness/tasks/<task-id>/PROGRESS.md#Heartbeat` before dispatching agents or running long commands.
5. Load `Harness/subagents.md` before coordinating multiple agents; explicit WF/WK mode always coordinates multiple roles.

## Exploration

Use parallel read-only subagents first. Explicit WF/WK mode starts with at least three distinct `.claude/agents/` roles before the second plan. For automatic WF triggers, default to 3-5 active agents unless the task is clearly small enough for the solo exception.

| Agent | Purpose | Writes |
| --- | --- | --- |
| `planner` | map local project facts, commands, app entry points, existing docs, and initial decomposition | none |
| `researcher` | product, ecosystem, dependency, and external context | none unless returning a docs patch |
| `docs-researcher` | official docs, SDK/API versions, browser/tool limits | none unless returning a docs patch |
| `architect` | boundaries, ports, data flow, state impact, migration risks | none unless returning a docs patch |

Use local files first. Use web search, Tavily, TinyFish, GitHub, official docs, or user-provided links only when the decision needs current or external evidence. Record tool choice and limitations in `Harness/research/research-results.md` or `Harness/tasks/<task-id>/PLAN.md`.

## Subagent Orchestration

Use `Harness/subagents.md` as the orchestration methodology and `Harness/dispatch.md` as the dispatch table protocol.

- The main agent is the controller and owns synthesis, integration, and final verification.
- Subagents are readers and reporters. Only the main agent writes to task PROGRESS.md and PLAN.md. Subagents return PLAN patch suggestions which the main agent reviews before committing.
- Parallelize read-only exploration; serialize writers unless write sets are disjoint and isolated.
- Every subagent gets a dispatch pack with role, goal, read set, write set, forbidden scope, injected docs, evidence, stop condition, and return format.
- After implementation, run spec review before code-quality or architecture review.
- If subagents are unavailable, emulate the same roles as bounded passes and record the fallback.

## Second Plan

After exploration, synthesize:

- facts found
- assumptions
- risks
- accepted/rejected options
- tasks
- read/write sets
- verification path
- rollback or recovery plan

Write the result to `Harness/tasks/<task-id>/PLAN.md` before implementation. Update `Harness/tasks/<task-id>/PROGRESS.md#Heartbeat`.

## Build And Review

1. `test-writer` defines a failing test or written manual check first.
2. `implementer` changes only the declared write set.
3. At least one `reviewer` checks diff, architecture, risks, and missing tests.
4. For cross-layer or risky work, run separate reviewers for architecture and test adequacy.
5. `verifier` runs the declared checks and records exact evidence.

## Browser And API Evidence

For browser-visible changes, typecheck/build/unit tests are not enough. Use Chrome DevTools, CDP, Playwright, or a documented real-browser run:

- start the app and record URL/port
- click through the critical flow
- capture frontend console/runtime errors
- capture failed network requests
- collect backend logs when the flow crosses an API
- record screenshot, trace, video, or manual evidence path

For API changes, run the project API/integration test path or a documented real request against a local service and record request, response, logs, and failure behavior.

## Recovery Loop

If verification fails:

1. Update `Harness/tasks/<task-id>/PROGRESS.md#Heartbeat` with failure count and blocker.
2. Dispatch `debugger` with the failing command, error output, and smallest relevant files.
3. Fix the smallest reproduced failure.
4. Run reviewer again.
5. Run verifier again.
6. Repeat until verified or blocked by missing user input/external state.

Before asking the user after repeated failures, dispatch `context-master` then `memory-master` (or use `/wf-learn`) to record the failure pattern, attempted paths, and root cause hypothesis. Present evidence-backed options to the user.

## Heartbeat Protocol

Heartbeat is a lightweight recovery protocol, not a background daemon.

Update `Harness/tasks/<task-id>/PROGRESS.md#Heartbeat`:

- before a long command
- after a long command
- before spawning subagents
- after integrating subagent returns
- after each failed verification
- before stopping for user input

The agent may set the next beat interval by event instead of time, such as "after next test run", "after reviewer returns", or "after browser evidence is captured".

When context approaches ~85% of the window, dispatch `context-master` to analyze and append a compression suggestion to `Harness/tasks/<task-id>/PROGRESS.md#Heartbeat`. The suggestion is non-blocking; the controller checks it at the next natural pause point.

## Closeout

Close only when:

- acceptance criteria are satisfied
- reviewer has no unresolved critical/high findings
- test/API/browser evidence is recorded
- affected Harness docs are synced
- `context-master` has analyzed the session and extracted durable knowledge
- `memory-master` has consolidated extracted knowledge into `Harness/memory/*` and `Harness/MEMORY.md`
- Current task PROGRESS.md and PLAN.md are archived under `Harness/tasks/<task-id>/` with Phase set to Verified
- `Harness/PROGRESS.md` task index is updated (Closed column filled, Active Task cleared or set to next task)
- `Harness/tasks/<task-id>/PROGRESS.md#Heartbeat` says the task is verified or lists the exact next recovery action
- `Harness/PROGRESS.md` task index reflects the closed task
