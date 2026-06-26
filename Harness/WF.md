# WF Mode - Long Task Workflow

Use this when work is long, difficult, uncertain, multi-file, multi-agent, or user-triggered with `/wf`, `wf mode`, or `workflow mode`.

This is a Ralph-style harness loop: keep moving through evidence, bounded exploration, second planning, implementation, review, verification, and recovery instead of stalling on the first obstacle.

## Trigger

Enter WF mode when any of these are true:

- The user explicitly says `/wf`, `wf mode`, or asks for the full workflow.
- The task needs more than one step, more than three files, or more than one subsystem.
- The task needs research, architecture judgment, browser/API validation, or migration planning.
- Confidence in intent, architecture, or implementation is below 95%.
- The same command, test, tool, or approach fails twice.

## WF Loop

```text
Intake
-> confidence gate
-> parallel explorer / researcher / docs-researcher / architect passes
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

1. Read `CLAUDE.md`, `Harness/MEMORY.md`, `Harness/README.md`, and `Harness/PLAN.md`.
2. State the goal, non-goals, confidence level, known risks, and write boundaries.
3. Ask up to three blocking questions only when the next action cannot reach 95% confidence.
4. Update `Harness/PLAN.md#Heartbeat` before dispatching agents or running long commands.
5. Load `Harness/subagents.md` before coordinating multiple agents.

## Exploration

Use parallel read-only passes first. Prefer three or fewer active agents.

| Agent | Purpose | Writes |
| --- | --- | --- |
| Explorer Pass | map local project facts, commands, app entry points, existing docs | none |
| `researcher` | product, ecosystem, dependency, and external context | none unless returning a docs patch |
| `docs-researcher` | official docs, SDK/API versions, browser/tool limits | none unless returning a docs patch |
| `architect` | boundaries, ports, data flow, state impact, migration risks | none unless returning a docs patch |

Use local files first. Use web search, Tavily, TinyFish, GitHub, official docs, or user-provided links only when the decision needs current or external evidence. Record tool choice and limitations in `Harness/research/research-results.md` or `Harness/PLAN.md`.

## Subagent Orchestration

Use `Harness/subagents.md` as the orchestration methodology and `Harness/dispatch.md` as the dispatch table protocol.

- The main agent is the controller and owns synthesis, integration, and final verification.
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

Write the result to `Harness/PLAN.md` before implementation.

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

1. Update `Harness/PLAN.md#Heartbeat` with failure count and blocker.
2. Dispatch `debugger` with the failing command, error output, and smallest relevant files.
3. Fix the smallest reproduced failure.
4. Run reviewer again.
5. Run verifier again.
6. Repeat until verified or blocked by missing user input/external state.

If the same failure class happens three times, stop blind fixes. Record evidence, likely root causes, attempted paths, and ask the user to choose among clear options.

## Heartbeat Protocol

Heartbeat is a lightweight recovery protocol, not a background daemon.

Update `Harness/PLAN.md#Heartbeat`:

- before a long command
- after a long command
- before spawning subagents
- after integrating subagent returns
- after each failed verification
- before stopping for user input

The agent may set the next beat interval by event instead of time, such as "after next test run", "after reviewer returns", or "after browser evidence is captured".

## Closeout

Close only when:

- acceptance criteria are satisfied
- reviewer has no unresolved critical/high findings
- test/API/browser evidence is recorded
- affected Harness docs are synced
- `Harness/PLAN.md#Heartbeat` says the task is verified or lists the exact next recovery action
