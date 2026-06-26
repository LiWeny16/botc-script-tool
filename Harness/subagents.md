# Subagent Orchestration

Purpose: coordinate subagents for speed without losing control of scope, evidence, or integration.

Use this file when work needs multiple roles, parallel reading, independent review, broad context, repeated failures, or `/wf`.

project files are the only durable communication channel; chat/subagent transcript state is non-authoritative. Important assumptions, decisions, blockers, evidence, and handoffs must be written to `Harness/PLAN.md`, the current feature doc, `Harness/MEMORY.md`, or `Harness/memory/*` as appropriate.

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
- dispatch table in `Harness/PLAN.md`
- integration of returned summaries
- final verification and closeout

Subagents provide bounded work. They do not own final scope, architecture, release claims, or user-facing decisions.

## Efficiency Ladder

Choose the cheapest coordination level that is safe.

| Level | Use When | Pattern |
| --- | --- | --- |
| Solo pass | one file, low risk, clear intent | no subagent |
| Single reviewer | small change with meaningful risk | implement, then reviewer |
| Parallel read-only | broad reading, research, architecture, multiple independent failures | 2-3 read-only agents |
| Serial build lane | normal feature or fix | test-writer -> implementer -> reviewers -> verifier |
| Isolated lanes | disjoint write sets or competing approaches | separate worktrees, then review and merge |

Default: at most three active subagents. More agents increase coordination cost and conflict risk.

## WF Orchestration Shape

```text
controller intake
-> parallel explorer/researcher/docs-researcher/architect passes
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
- Do not let two agents edit `Harness/PLAN.md`, `Harness/MEMORY.md`, or `Harness/memory/*` concurrently. The controller writes durable state.
- If two agents disagree, the controller records the conflict in `Harness/PLAN.md` and chooses the smallest reversible next step.

## Review Gates

Implementation is not complete until both gates pass:

1. **Spec review**: confirms the result matches the user request, PRD, feature doc, acceptance criteria, and non-goals. Extra features are failures.
2. **Code-quality review**: checks correctness, maintainability, architecture, tests, security, and integration risk.

If either reviewer finds issues, the implementer or debugger fixes them and the same gate runs again. Do not move to verifier with open critical/high findings.

## Subagent Status Handling

| Status | Controller Action |
| --- | --- |
| `DONE` | start review gates |
| `DONE_WITH_CONCERNS` | read concerns, decide whether to address before review, record in `PLAN.md` |
| `NEEDS_CONTEXT` | provide only missing context and re-dispatch |
| `BLOCKED` | change something: add context, split task, upgrade reasoning, use debugger, or ask user |

Never retry the same failed prompt unchanged.

## Failure Recovery

- First failed verification: record evidence, dispatch debugger with the smallest reproduced failure.
- Second same-class failure: narrow scope, update `PLAN.md#Heartbeat`, and add a reviewer before another fix.
- Third same-class failure: stop blind fixes. Present evidence-backed options to the user.

The recovery loop must preserve the same evidence standard as the main workflow: real commands, real browser/API checks when applicable, and recorded logs or artifacts.

## Synthesis Output

After subagents return, the controller writes one synthesis into `Harness/PLAN.md`:

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
