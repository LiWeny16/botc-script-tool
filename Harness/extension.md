# Extension Contract

Purpose: keep stack-specific agents, skills, rules, and hooks compatible with this harness.

Use during setup whenever adding assets from ECC, SuperClaude, toolboxes, or local project conventions.

## Non-Invasive Extension Rules

Extensions must preserve project and harness ownership boundaries.

- Preserve existing `.claude/`, `CLAUDE.md`, `AGENTS.md`, `.gitignore`, `Harness/README.md`, `Harness/workflows/*.md`, settings, hooks, and local rules unless the user explicitly requests an overwrite.
- Treat existing project config as project fact. Read it before adding assets, then adapt new assets to the project instead of replacing the project.
- Register added agents, skills, workflows, rules, and hooks in `Harness/MEMORY.md` and this docs router where applicable.
- Added assets may extend `.claude/skills/`, `.claude/agents/`, `.claude/rules/`, or `Harness/workflows/`, but they must not replace core harness docs.
- Core harness docs are `Harness/README.md`, `Harness/PROGRESS.md`, `Harness/subagents.md`, `Harness/context-loading.md`, `Harness/dispatch.md`, `Harness/agent-workflow.md`, and this file.
- If an optional workflow needs a new command or tool, document the command and fallback in `Harness/workflows/<name>.md` instead of changing core harness behavior.

## Agent Contract

Every added agent must have frontmatter:

```yaml
---
name: stack-agent-name
description: Use when ...
tools: Read, Grep, Glob
model: sonnet
---
```

Agent body must state:

- load first
- inputs required
- allowed write set or read-only
- forbidden scope
- verification or evidence
- return format from [subagents.md](subagents.md) and [dispatch.md](dispatch.md)

## Skill Contract

Every added skill must state:

- when to use
- docs to load
- required inputs
- allowed writes
- output format
- whether to update `Harness/PROGRESS.md` and task files
- whether to use [subagents.md](subagents.md) and [dispatch.md](dispatch.md)

Skills should extend the harness. They should not replace `Harness/README.md`, `Harness/PROGRESS.md`, `subagents.md`, `context-loading.md`, `dispatch.md`, or `agent-workflow.md`.

## Rules

- Do not add broad agents that can write anywhere.
- Do not add agents whose role overlaps an existing common agent without naming the difference.
- Do not add tools that bypass project permissions or user approval.
- Do not run stack-specific writing agents in parallel unless write sets are disjoint.
- If an added asset conflicts with this harness, adapt the asset instead of changing the core contract.

## Registration

After adding assets:

- list agents in `Harness/MEMORY.md#Agents`
- list skills in `Harness/MEMORY.md#Skills`
- list workflows by path in `Harness/MEMORY.md` or `Harness/README.md`
- update `Harness/PROGRESS.md` and `Harness/tasks/<task-id>/PROGRESS.md` when the asset affects current work
- run `node Harness/scripts/validate-harness.mjs`
