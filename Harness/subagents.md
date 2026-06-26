# Subagent Orchestration

Purpose: coordinate subagents for speed without losing control of scope, evidence, or integration.

Use this file when work needs multiple roles, parallel reading, independent review, broad context, repeated failures, or `/wf`.

project files are the only durable communication channel; chat/subagent transcript state is non-authoritative. Important assumptions, decisions, blockers, evidence, and handoffs must be written to `Harness/tasks/<task-id>/PROGRESS.md` and `Harness/tasks/<task-id>/PLAN.md`, the current feature doc, `Harness/MEMORY.md`, or `Harness/memory/*` as appropriate.

## Source Attribution

This harness distills ideas from these sources. Keep the protocol local and conservative; do not import external runtimes by default.

| Source | Found By | Adopted Idea |
| --- | --- | --- |
| `superpowers:dispatching-parallel-agents` | local skill | Dispatch one agent per independent problem domain; give focused scope and exact context. |
| `superpowers:subagent-driven-development` | local skill | Fresh implementer per task; spec review before code-quality review; handle `DONE`, `DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, and `BLOCKED`. |
| [`flc1125/skills@subagent-orchestrator`](https://skills.sh/flc1125/skills/subagent-orchestrator) | `npx skills find "subagent orchestration"` | Explicit subagent invocation, role-specific prompts, tool permission awareness. |
| [`davila7/claude-code-templates@parallel-agents`](https://skills.sh/davila7/claude-code-templates/parallel-agents) | `npx skills find "parallel agents"` | Discovery -> domain agents -> synthesis; one unified synthesis instead of scattered reports. |
| [`ruvnet/ruflo@agent-workflow`](https://skills.sh/ruvnet/ruflo/agent-workflow) | `npx skills find "agent workflow"` | Workflow thinking: triggers, agent assignments, parallel processing, and stateful handoffs. |
| [`pcvelz/superpowers@subagent-driven-development`](https://skills.sh/pcvelz/superpowers/subagent-driven-development) | `npx skills find "subagent driven development"` | Implementer plus review gates for spec compliance and code quality. |
| [`oimiragieo/agent-studio`](https://skills.sh/oimiragieo/agent-studio/dispatching-parallel-agents) | Skills CLI / public docs | Router-subordinate architecture and durable handoff discipline. |
| [`subagent-orchestration-skill`](https://skills.rest/rjtaryn/skills/subagent-orchestration-skill) | public docs | Multi-stage executor, spec reviewer, code reviewer, circuit breaker, and escalation pattern. |

## Controller Role

The main agent is the controller. It owns:

- intent confidence and user questions
- task decomposition
- read/write set boundaries
- dispatch table in `Harness/tasks/<task-id>/PLAN.md#Subagent Dispatch`
- integration of returned summaries
- final verification and closeout

Subagents provide bounded work. They do not own final scope, architecture, release claims, or user-facing decisions.

## Built-in Agent Roster

Use the installed roster under `.claude/agents/` before inventing ad hoc roles.

| Agent | Default Use |
| --- | --- |
| `planner` | decompose goals, map unknowns, define success criteria and write sets |
| `researcher` | local/external ecosystem context, comparable projects, current facts |
| `docs-researcher` | official docs, SDK/API behavior, browser/tool constraints |
| `architect` | boundaries, interface decoupling, state ownership, data flow, migration risk |
| `test-writer` | failing tests, manual check contracts, browser/API evidence plan |
| `implementer` | bounded code or doc changes after the second plan |
| `reviewer` | spec compliance, code quality, maintainability, security, missing tests |
| `debugger` | reproduced failures, root cause isolation, smallest safe fix |
| `verifier` | command execution, real browser/API checks, final evidence |
| `memory-master` | write/consolidate memory entries, dedup, cross-project extraction; dispatched on repeated failures, user corrections, and WF closeout |
| `context-master` | analyze context usage, recommend compression at ~85% window, extract durable session knowledge during closeout |

## WF Default Fan-Out

Explicit `/wf`, `wf mode`, `workflow mode`, or `wk mode` requires at least 3 distinct agents from `.claude/agents/` before second planning.

Default starter set:

- `planner` for decomposition and local map
- `architect` for boundaries, interfaces, and state impact
- `researcher` or `docs-researcher` depending whether the unknowns are project/ecosystem facts or official tool/API behavior

Then add phase-specific agents:

- `test-writer` before implementation
- `implementer` for the serial write lane
- `reviewer` for spec and code-quality gates
- `debugger` after a reproduced verification failure
- `verifier` for final command/browser/API evidence
- `context-master` before closeout for knowledge extraction
- `memory-master` after repeated failures and during closeout for consolidation

Collaboration mode is determined by concrete conditions, not a fixed ratio. See `Harness/WF.md#Multi-Subagent Requirement` for the full decision tree. Summary: explicit WF/WK mode → always multi-agent. 3+ files or cross-layer → multi-agent. 1-2 local files, well-understood, not in WF mode → solo acceptable. Repeated failure → stop solo, switch to multi-agent.

## Efficiency Ladder

Choose the cheapest coordination level that is safe.

| Level | Use When | Pattern |
| --- | --- | --- |
| Solo pass | one file, low risk, clear intent | no subagent |
| Single reviewer | small change with meaningful risk | implement, then reviewer |
| Parallel read-only | broad reading, research, architecture, multiple independent failures | 2-3 read-only agents |
| Serial build lane | normal feature or fix | test-writer -> implementer -> reviewers -> verifier |
| Isolated lanes | disjoint write sets or competing approaches | separate worktrees, then review and merge |
| Max parallelism | 5+ disjoint files, fan-out benefit > coordination cost | /wf max: write-set coloring -> wave dispatch -> parallel review |

Default for automatic WF triggers: 3-5 active read-only agents before second planning. For explicit WF/WK mode, never use the solo pass unless subagents are unavailable; use bounded role passes as the recorded fallback.

## WF Orchestration Shape

```text
controller intake
-> parallel planner/researcher/docs-researcher/architect subagents
-> controller synthesis
-> second plan with dependencies and write sets
-> test-writer
-> implementer
-> spec reviewer
-> code/architecture reviewer
-> verifier
-> if failed: debugger/fixer -> review -> verify -> loop
-> close with evidence
```

Use this shape for `/wf`, long tasks, multi-file changes, architecture work, migrations, browser/API behavior, or repeated failures.

```text
/wf max orchestration shape:
controller intake
-> wave 0: max-parallel exploration (4-14 read-only agents)
-> controller synthesis: dependency graph + write-set coloring
-> wave 1: N parallel implementers (disjoint file claims)
-> wave 1 review: parallel spec/code/security reviewers
-> wave 2+: dependent implementers (if any)
-> integration verifier
-> closeout with evidence
```

## Dispatch Pack

Every subagent dispatch must be self-contained:

```text
Role:
Goal:
Mode: read-only | write
Read set:
Write set:
Forbidden scope:
Injected docs:
Dependencies:
Expected evidence:
Stop condition:
Return format:
```

Do not make a subagent rediscover the entire project or read the whole harness. Inject only the docs selected by `Harness/README.md` and `Harness/context-loading.md`.

## Parallelism Rules

- Read-only agents may run in parallel.
- Writing agents run serially unless write sets are disjoint and the controller has chosen an isolated worktree.
- Reviewers may run in parallel after implementation, but spec compliance is evaluated before code-quality approval.
- Subagents are readers and reporters. They return findings and PLAN patch suggestions. Only the controller (main agent) commits state changes to task files.
- Do not let two agents edit `Harness/tasks/<task-id>/PROGRESS.md`, `Harness/tasks/<task-id>/PLAN.md`, `Harness/MEMORY.md`, or `Harness/memory/*` concurrently. The controller writes durable state.
- If two agents disagree, the controller records the conflict in `Harness/tasks/<task-id>/PLAN.md` and chooses the smallest reversible next step.

## Review Gates

Implementation is not complete until both gates pass:

1. **Spec review**: confirms the result matches the user request, PRD, feature doc, acceptance criteria, and non-goals. Extra features are failures.
2. **Code-quality review**: checks correctness, maintainability, architecture, tests, security, and integration risk.

If either reviewer finds issues, the implementer or debugger fixes them and the same gate runs again. Do not move to verifier with open critical/high findings.

## Subagent Status Handling

| Status | Controller Action |
| --- | --- |
| `DONE` | start review gates |
| `DONE_WITH_CONCERNS` | read concerns, decide whether to address before review, record in `Harness/tasks/<task-id>/PROGRESS.md` |
| `NEEDS_CONTEXT` | provide only missing context and re-dispatch |
| `BLOCKED` | change something: add context, split task, upgrade reasoning, use debugger, or ask user |

Never retry the same failed prompt unchanged.

## Failure Recovery

- First failed verification: record evidence, dispatch debugger with the smallest reproduced failure.
- Second same-class failure: narrow scope, update `Harness/tasks/<task-id>/PROGRESS.md#Heartbeat`, and add a reviewer before another fix.
- Third same-class failure: stop blind fixes. Present evidence-backed options to the user.

The recovery loop must preserve the same evidence standard as the main workflow: real commands, real browser/API checks when applicable, and recorded logs or artifacts.

## Synthesis Output

After subagents return, the controller writes one synthesis into `Harness/tasks/<task-id>/PLAN.md`:

```text
Agents used:
Findings accepted:
Findings rejected:
Conflicts:
Decisions:
Next write set:
Verification path:
Residual risk:
```

Only the synthesis and named files enter main context. Do not replay full subagent conversations.
