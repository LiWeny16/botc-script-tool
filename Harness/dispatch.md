# Dispatch Protocol

Purpose: coordinate a small set of subagents without building a scheduler.

Use when work needs parallel reading, independent review, cross-layer analysis, or more than one bounded implementation pass.

## Principles

- Main agent owns the final decision, integration, and verification.
- Project files are the only durable communication channel; chat/subagent transcript state is non-authoritative.
- Important assumptions, decisions, blockers, evidence, and handoffs must be written to `Harness/PLAN.md`, `MEMORY.md`, or `memory/*` as appropriate.
- Prefer three or fewer active agents.
- Read-only agents may run in parallel.
- Writing agents run serially unless write sets are disjoint.
- Use a worktree when two agents may touch overlapping files.
- Only summaries enter main context. Load named files directly when details are needed.

## Dispatch Loop

```text
Goal
→ Fill PLAN tasks and Parallel Dispatch table
→ Run parallel read-only agents (explore, review, research)
→ Main agent integrates findings
→ Write failing test or manual check
→ Implementer makes bounded change
→ Reviewer checks diff
→ Main agent verifies and updates PLAN
→ Close or iterate
```

## Modes

| Mode | Use When | Constraint |
| --- | --- | --- |
| **Parallel Read** | research, exploration, review, docs check | no writes |
| **Serial Write** | tests, implementation, docs sync | one writer at a time |
| **Isolated Worktree** | overlapping write sets or competing approaches | merge only after review |

## Project-Specific Dispatch Rules

- Any writing agent MUST NOT commit `docs/`, `pnpm-lock.yaml`, or build artifacts.
- Any agent touching i18n MUST add keys to ALL supported languages (cn, en, es).
- Any agent modifying `src/utils/scriptGenerator.ts` MUST be reviewed separately.
- Parallel reads on different source directories (e.g., `src/data/` + `src/components/`) are safe.

## Handoff Format

Subagents return summaries in this shape:

```text
Agent:
Task:
Mode:
Files read:
Files changed:
Findings:
Evidence:
Risks:
Next:
PLAN patch:
```

Use `Files changed: none` for read-only agents. Use `PLAN patch: none` when no state update is needed.

If a handoff matters after context loss, write it to `Harness/PLAN.md`, the current feature doc, or `memory/*`; do not rely on chat transcript state.

## Statuses

Allowed dispatch statuses: `Pending` / `In Progress` / `Returned` / `Integrated` / `Blocked` / `Verified`

## Common Agent Roles

| Role | Mode | Purpose |
| --- | --- | --- |
| Explorer | Parallel Read | bounded read-only exploration of codebase |
| Planner | Parallel Read | split goal into tasks, dependencies, write sets |
| Implementer | Serial Write | minimal change inside declared write set |
| Reviewer | Parallel Read | diff review, risks, missing tests, artifact check |
| Debugger | Serial Write | smallest fix for a reproduced failure |
| Verifier | Parallel Read | run checks and record evidence |

## Conflict Rule

If docs, tests, and code disagree:
1. stop implementation
2. record the conflict in `Harness/PLAN.md`
3. choose the smallest reversible decision
4. ask the maintainer when user-visible behavior is affected
