# PLAN.md — Active Execution Plan

Use this file when work spans more than one step, one file, or one agent.

## Current Goal

<!-- One sentence: what this iteration achieves -->

## Phase

Choose one: Idea / Research / Plan / Build / Verify / Review / Feedback

Current: **Plan**

## Progress Rules

- Phase tracks lifecycle progress.
- Task status tracks execution progress.
- Update before handoff, after verification, and when blocked.

Allowed task statuses: `Pending` / `In Progress` / `Blocked` / `Done` / `Verified`

- **Pending**: not started
- **In Progress**: active work
- **Blocked**: needs user input or external change
- **Done**: task complete, evidence not final
- **Verified**: verification evidence is recorded

## Success Criteria

- [ ] <!-- Criterion 1 -->
- [ ] <!-- Criterion 2 -->
- [ ] <!-- Criterion 3 -->

## Scope

Allowed write set:
- `<!-- paths or globs -->`

Forbidden:
- `docs/` (build artifacts — not in source control scope for contributors)
- `pnpm-lock.yaml` (unless adding a dependency)

## Loaded Context

Keep this list short. Add only docs/files used for the current phase.

- `CLAUDE.md`
- `Harness/README.md`
- `<!-- additional docs/files -->`

## Tasks

| # | Task | Owner | Verify | Status |
| --- | --- | --- | --- | --- |
| 1 | <!-- task description --> | <!-- agent/role --> | `<!-- command or check -->` | Pending |

## Parallel Dispatch

Use [dispatch.md](dispatch.md) when more than one agent or bounded pass is useful.

| Task | Agent | Mode | Read Set | Write Set | Depends On | Output | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <!-- task --> | <!-- agent --> | Parallel Read / Serial Write / Isolated Worktree | `<!-- read set -->` | `<!-- write set or none -->` | <!-- dependency or none --> | <!-- expected output --> | Pending |

## Agent Handoffs

| Agent | Role | Context Pack | Result |
| --- | --- | --- | --- |
| <!-- agent --> | <!-- role --> | <!-- docs/files --> | <!-- outcome summary --> |

## Decisions

| Date | Decision | Reason |
| --- | --- | --- |
| <!-- YYYY-MM-DD --> | <!-- decision --> | <!-- reason --> |

## Verification

| Check | Result | Notes |
| --- | --- | --- |
| `pnpm build` | Not run | |
| `pnpm lint` | Not run | |
| Manual test in dev | Not run | |
