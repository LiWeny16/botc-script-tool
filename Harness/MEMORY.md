# MEMORY.md - botc-script-tool Project Resource Index

> The project fact source is reached via `CLAUDE.md -> Harness/README.md`. This file persists cross-session context: resource index, user preferences, tool usage standards.
> Detailed memory lives in `Harness/memory/`. Keep entries short, newest first, and free of secrets.

## Agents (Sub-agents)

- [researcher](../.claude/agents/researcher.md) — product, market, open-source, dependency, pricing, policy, and ecosystem research.
- [docs-researcher](../.claude/agents/docs-researcher.md) — official docs, API, SDK, config, limits, errors, and examples verification.
- [planner](../.claude/agents/planner.md) — task split, dependencies, write sets, and dispatch table.
- [architect](../.claude/agents/architect.md) — boundaries, ports, data-flow, and state impact.
- [test-writer](../.claude/agents/test-writer.md) — failing tests or manual verification before implementation.
- [implementer](../.claude/agents/implementer.md) — bounded implementation inside declared write set.
- [debugger](../.claude/agents/debugger.md) — smallest fix for a reproduced failure.
- [reviewer](../.claude/agents/reviewer.md) — read-only diff review and closeout risk.
- [verifier](../.claude/agents/verifier.md) — verification commands and evidence.
- [memory-master](../.claude/agents/memory-master.md) — memory writing, dedup, consolidation, and cross-project knowledge extraction.
- [context-master](../.claude/agents/context-master.md) — context analysis, compression alerts, and session knowledge extraction for memory-master.
- [explore-manager](../.claude/agents/explore-manager.md) — WF-MAX W0 exploration: spawn 5-10 read-only researchers, synthesize, report to CEO.
- [architect-manager](../.claude/agents/architect-manager.md) — WF-MAX W1 architecture: spawn 3 architects, synthesize interface contracts, report to CEO.
- [implement-manager](../.claude/agents/implement-manager.md) — WF-MAX W2 implementation: spawn 5-7 implementers (one file_claim each), merge, report to CEO.
- [review-manager](../.claude/agents/review-manager.md) — WF-MAX W2R review: spawn 3-4 reviewers (spec/code/security/perf), deduplicate, classify severity, report to CEO.

Stack-specific agents can be added after the product shape is known.

## Skills (Workflows)

- [WF Mode](WF.md) — long-task workflow: exploration, second plan, implementation, review, verification, heartbeat, and recovery loop.
- [subagent-orchestrator](../.claude/skills/subagent-orchestrator/SKILL.md) — controller-led subagent orchestration, parallel read-only passes, review gates, and recovery handoffs.
- [wf-readme](../.claude/skills/wf-readme/SKILL.md) — README preservation, append-only development sections, structured tables, and approved architecture diagrams.
- [wf-review](../.claude/skills/wf-review/SKILL.md) — cross-model peer review: invoke the other agent CLI (Codex/Claude) for independent review.
- [wf-update](../.claude/skills/wf-update/SKILL.md) — GitHub-based incremental harness update, checksum comparison, and safe in-place updates.
- [wf-learn](../.claude/skills/wf-learn/SKILL.md) — force memory learning cycle: context-master -> memory-master -> project + global memory.
- [wf-max](../.claude/skills/wf-max/SKILL.md) — maximum-parallelism workflow: write-set coloring, wave dispatch, parallel review per dimension.
- [wf-remove](../.claude/skills/wf-remove/SKILL.md) — Safely remove Harness framework files (SAFE/MODIFIED/USER classes), auto-prune empty directories, backup option.

Stack-specific skills can be added after the product shape is known.

## Rules (Harness Constraints)

Located under `.claude/rules/ecc/`, auto-loaded by the CC engine:

- [common.md](../.claude/rules/ecc/common.md) — universal harness constraints for context loading, verification, subagents, and security (alwaysApply: true)
- Language-specific rules pending Claude Code initialization (e.g. python.md, typescript.md, etc.)

## Harness (Runtime)

- [Docs router](README.md)
- [WF mode](WF.md)
- [WF Max mode](WF-MAX.md)
- [0-1 lifecycle](lifecycle.md)
- [Research protocol](research/README.md)
- [Context loading protocol](context-loading.md)
- [Dispatch protocol](dispatch.md)
- [Subagent orchestration](subagents.md)
- [Extension contract](extension.md)
- [Architecture docs](architecture.md)
- [Agent workflow](agent-workflow.md)
- [Harness validator](scripts/validate-harness.mjs)
- [Version file](.harness-version)

## Memory Folder

- [Tool usage/reflections](memory/tool-usage-reflections.md) - repeated tool failures, better command patterns, environment-specific fixes.
- [User corrections/preferences](memory/user-corrections-preferences.md) - repeated user corrections, durable preferences, common-sense course corrections.
- [Agent lessons/patterns](memory/agent-lessons-patterns.md) - reusable lessons from review, debugging, validation, and handoff loops.

Write to the memory folder when the guidance should survive chat context loss:

- Use `memory/tool-usage-reflections.md` when the same tool/use pattern fails 3+ times, a better command pattern is found, or an environment-specific fix should be reused.
- Use `memory/user-corrections-preferences.md` when the user explicitly asks to remember a preference, or the user corrects the same assumption/pattern 2+ times.
- Use `memory/agent-lessons-patterns.md` when a review/debug loop yields a reusable lesson or regression guard.
- Use this file for the resource index and routing pointers, not long-form lessons.
- Never record secrets, credentials, tokens, or private data. If a memory is ambiguous, ask before writing.
