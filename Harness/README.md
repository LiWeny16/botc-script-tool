# BOTC Script Tool — Harness Router

Purpose: route humans and agents to the smallest useful context.

Default load: `CLAUDE.md`, `Harness/MEMORY.md`, this file, and `Harness/PLAN.md` when work is active. Do not read the whole Harness tree.

## Development Contract

- This file is a router, not a full spec.
- If the task does not clearly match a row below, search by keywords before loading more docs.
- project files are the only durable communication channel; chat/subagent transcript state is non-authoritative.
- Important assumptions, decisions, blockers, evidence, and handoffs must be written to `Harness/PLAN.md`, the current feature doc, `Harness/MEMORY.md`, or `Harness/memory/*` as appropriate.
- Core behavioral rules live in `CLAUDE.md` Sections 2-7.
- Project context lives in `CLAUDE.md` (Project Context section).

## Load By Task

Load the matching row only. Add adjacent docs only when the loaded doc directly names them.

For long, difficult, uncertain, multi-file, or repeated-failure work, prefer `/wf <task>` or `/wf-max [task]` — CEO never writes code directly in `/wf-max` mode.

Routing priority: if a request explicitly says `/wf <task>`, `wf mode`, `workflow mode`, or `wk mode`, or is long, difficult, uncertain, repeated-failure, migration, architecture-heavy, browser-visible, or broad multi-agent implementation work, choose the WF row first. Load `Harness/WF.md` directly, then delegate subagent coordination to `subagent-orchestrator`. In explicit WF/WK mode, explicit WF/WK loads subagent docs immediately — a solo pass is not acceptable unless subagents are unavailable.

| When to Read | Keywords | Load | Output |
| --- | --- | --- | --- |
| Want to contribute | contribute, PR, pull request, fork, branch | [PR_GUIDELINES.md](PR_GUIDELINES.md), [AI_CONTRIBUTING.md](AI_CONTRIBUTING.md) | clean branch, valid PR |
| Using AI to code for this project | AI, vibe coding, prompt, assistant, copilot | [AI_CONTRIBUTING.md](AI_CONTRIBUTING.md) | copy-pasteable AI prompt + conventions |
| Need implementation plan | plan, task, write set, verify, multi-step | [PLAN.md](PLAN.md) | tasks, write sets, verification |
| Need architecture or file map | architecture, key files, component, routing, i18n, store, where is | [Arch.md](Arch.md), `CLAUDE.md` (Project Context section) | file paths, component locations, modification paths |
| Need multi-agent orchestration | dispatch, parallel, subagent, handoff | [dispatch.md](dispatch.md), [context-loading.md](context-loading.md), [PLAN.md](PLAN.md) | dispatch table, agent roles, read/write sets |
| Adding a new language | i18n, language, translation, locale, German | `CLAUDE.md` (i18n section), [extension.md](extension.md) | language type update, i18n keys, data files |
| Adding a new feature | feature, feat, component, new | [lifecycle.md](lifecycle.md), `CLAUDE.md` (Common Modification Paths) | feature plan, touched files |
| Adding stack-specific tooling | extension, agent, skill, rule, hook | [extension.md](extension.md), [dispatch.md](dispatch.md) | compatible agents, skills, rules |
| Need subagent context | subagent, role pack, context, inject | [context-loading.md](context-loading.md) | role-specific context pack |
| Review or release check | review, release, finding, risk, verify | [lifecycle.md](lifecycle.md), [PLAN.md](PLAN.md) | findings, verification evidence |
| Need durable memory or reflection | memory, remember, preference, correction | `Harness/MEMORY.md`, `Harness/memory/tool-usage-reflections.md`, `Harness/memory/user-corrections-preferences.md`, `Harness/memory/agent-lessons-patterns.md` | concise newest-first memory entry |
| Need WF mode | wf, /wf, wf mode, workflow mode, wk mode, long task, difficult, stuck, repeated failure | [WF.md](WF.md), [PLAN.md](PLAN.md) | exploration plan, heartbeat, recovery loop |
| Need peer review | /wf-review, peer review, second opinion, cross-check, stuck | `.claude/skills/wf-review/SKILL.md`, this file | cross-model review via other CLI |
| Need harness update | update, /wf-update, check for updates, harness version | `.claude/skills/wf-update/SKILL.md`, `.harness-version` | update plan, safe incremental update, merge candidates |
| Harness readiness check | validate, readiness, placeholder, missing file, release gate | `Harness/scripts/validate-harness.mjs` | missing files and unresolved project placeholders |

## Keyword Routing

Use this only when the task is ambiguous or the matching row is unclear.

1. Extract 2-5 concrete keywords from the user request.
2. Search the project docs first:
   ```bash
   rg -n "keyword1|keyword2|keyword3" CLAUDE.md Harness/MEMORY.md Harness/
   ```
3. Load only the top matching doc or the smallest matching doc pair.
4. If keyword search conflicts with the table above, follow the table and record the assumption in `Harness/PLAN.md`.

Keywords are retrieval hints, not project facts.

## Gates

- Do not code before scope is clear (read [lifecycle.md](lifecycle.md) if unsure).
- Do not cross architectural boundaries without checking `CLAUDE.md` (Architecture section).
- Do not modify `src/utils/scriptGenerator.ts` without understanding the full JSON → Script pipeline.
- Do not spawn a subagent without role, read boundary, write boundary, and return contract.
- Do not run writing agents in parallel unless write sets are disjoint.
- Do not close work without tests or recorded manual verification.
- Do not mark work verified until evidence is recorded in [PLAN.md](PLAN.md).
- **Contributors: do not commit `docs/`, `pnpm-lock.yaml`, or build artifacts.**
- Run `node Harness/scripts/validate-harness.mjs` after harness updates and before release.

## Doc Map

```text
Harness/README.md                  this router
Harness/MEMORY.md                  resource index
Harness/PLAN.md                    active execution plan
Harness/Arch.md                    architecture, key files, component map, routing, i18n, modification paths
Harness/WF.md                      long-task workflow and recovery loop
Harness/WF-MAX.md                  max-parallelism workflow with wave dispatch
Harness/lifecycle.md               feature contribution lifecycle
Harness/context-loading.md         subagent context packs
Harness/dispatch.md                parallel dispatch protocol
Harness/extension.md               stack-specific asset contract
Harness/subagents.md               controller-led subagent orchestration
Harness/agent-workflow.md          build/review/test loop
Harness/AI_CONTRIBUTING.md         AI prompt templates + conventions
Harness/PR_GUIDELINES.md           PR checklist + common mistakes

CLAUDE.md                          behavioral rules + build + commit + pointer to Arch.md
MEMORY.md                          cross-session resource index (legacy pointer → Harness/MEMORY.md)
Harness/memory/tool-usage-reflections.md
Harness/memory/user-corrections-preferences.md
Harness/memory/agent-lessons-patterns.md

.claude/agents/*                   built-in common agents
.claude/skills/*                   skill-style dynamic loaders
.claude/skills/wf-update/SKILL.md   GitHub-based harness update
.claude/commands/wf-update.md       /wf-update slash command bridge
.claude/commands/wf-max.md          /wf-max slash command bridge
.claude/commands/wf.md              slash command bridge into WF mode
.claude/commands/wf-review.md       /wf-review slash command bridge
Harness/.harness-version            scaffold version and file checksums
Harness/scripts/validate-harness.mjs lightweight harness gate
```
