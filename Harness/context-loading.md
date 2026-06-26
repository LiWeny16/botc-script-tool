# Context Loading Protocol

Use when context is growing, subagents are needed, or an agent is unsure which harness doc applies.

## Routing Authority

`Harness/README.md` is the primary router. This file is a secondary context-splitting protocol for subagents and long tasks.

If this file and `Harness/README.md` disagree, follow `Harness/README.md`, record the assumption in `Harness/tasks/<task-id>/PROGRESS.md`, and update this file later.

project files are the only durable communication channel; chat/subagent transcript state is non-authoritative. Important assumptions, decisions, blockers, evidence, and handoffs must be written to `Harness/tasks/<task-id>/PROGRESS.md` and `Harness/tasks/<task-id>/PLAN.md`, the current feature doc, `Harness/MEMORY.md`, or `Harness/memory/*` as appropriate.

## Main Context

Always keep:

- `CLAUDE.md`
- `Harness/MEMORY.md`
- `Harness/README.md`
- `Harness/PROGRESS.md` when active
- `Harness/tasks/<task-id>/PROGRESS.md` when active
- `Harness/tasks/<task-id>/PLAN.md` when active
- current feature doc when active

Load other docs only by trigger.

## Trigger Matrix

| Trigger | Load |
| --- | --- |
| idea, scope, MVP | `Harness/lifecycle.md`, `Harness/research/PRD.md` |
| research, competitors, stack choice | `Harness/research/README.md`, `Harness/research/research-results.md` |
| task split, owner, write set | `Harness/tasks/<task-id>/PROGRESS.md`, `Harness/tasks/<task-id>/PLAN.md`, `Harness/agent-workflow.md` |
| parallel agents, dispatch, worktree decision | `Harness/subagents.md`, `Harness/dispatch.md`, `Harness/tasks/<task-id>/PLAN.md` |
| memory, repeated tool failure, repeated user correction, reusable lesson | `Harness/MEMORY.md`, the relevant `Harness/memory/*.md` file |
| subagent spawn | `Harness/subagents.md`, this file plus the role pack below |

## Subagent Packs

Explorer Pass:
- inject: question, read boundary, relevant docs
- forbid: writes
- return: files found, facts, risks, suggested tests

Planner:
- inject: user goal, lifecycle phase, PRD or PLAN section, dispatch constraints
- forbid: production code
- return: tasks, dependencies, read/write sets, dispatch table, gates, open questions

Researcher:
- inject: question, decision needed, source boundaries, tool options
- forbid: production code
- return: sources, adopted/rejected/watch decisions, risks, research-results.md patch

Docs Researcher:
- inject: library/API/config, implementation question, version/date constraints
- forbid: production code
- return: official links, constraints, errors, examples, affected docs

Architect:
- inject: PRD, current architecture, ports
- forbid: implementation
- return: boundary decision, affected docs, risks

Test Writer:
- inject: acceptance criteria, feature doc, test write set
- forbid: production code
- return: failing tests and test intent

Implementer:
- inject: task, tests, allowed write set, forbidden scope
- forbid: unrelated refactor and test loosening
- return: changed files and implementation notes

Reviewer:
- inject: diff, acceptance criteria, architecture docs
- forbid: writes
- return: findings by severity, missing tests, boundary issues

Debugger:
- inject: failing command, error output, related files
- forbid: broad rewrites
- return: root cause, fix, proof

Verifier:
- inject: verification commands and acceptance criteria
- forbid: code changes
- return: commands run, results, residual risk

Memory Master:
- inject: trigger reason, current failure/user-correction/closeout context, task PROGRESS.md section
- forbid: source code, unrelated Harness docs
- return: memory action summary, files written, cross-project flag

Context Master:
- inject: trigger reason (threshold % or closeout), current task PROGRESS.md, task phase
- forbid: source code, memory files, MEMORY.md writes
- return: context usage %, stale blocks, compressible blocks, durable knowledge candidates, compression suggestion

## Handoff Rule

Only the subagent summary enters main context. If details are needed, load the named files directly instead of replaying the subagent conversation.

Use the handoff format in [dispatch.md](dispatch.md) for every dispatched agent.
