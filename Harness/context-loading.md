# Context Loading Protocol

Use when context is growing, subagents are needed, or you're unsure which doc applies.

## Routing Authority

`Harness/README.md` is the primary router. This file is a secondary context-splitting protocol for subagents and long tasks.

If this file and `Harness/README.md` disagree, follow `Harness/README.md`, record the assumption in `Harness/PLAN.md`.

## Main Context

Always keep:
- `CLAUDE.md`
- `Harness/README.md`
- `Harness/PLAN.md` when work is active

Load other docs only by trigger.

## Trigger Matrix

| Trigger | Load |
| --- | --- |
| vague idea, scope, MVP | `Harness/lifecycle.md` |
| research, competitors, dependencies | `Harness/lifecycle.md` (Research phase) |
| task split, owner, write set | `Harness/PLAN.md` |
| parallel agents, dispatch | `Harness/dispatch.md`, `Harness/PLAN.md` |
| adding language, feature, tooling | `Harness/extension.md`, `CLAUDE.md` (Common Modification Paths) |
| memory, repeated tool failure, repeated user correction | `MEMORY.md`, the relevant `memory/*.md` file |
| PR, contribution, commit format | `Harness/PR_GUIDELINES.md` |
| AI coding, prompt template | `Harness/AI_CONTRIBUTING.md` |
| i18n, translation, locale | `CLAUDE.md` (i18n + Common Modification Paths) |
| MobX store, state, localStorage | `CLAUDE.md` (Architecture section) |
| JSON parsing, script generation | `src/utils/scriptGenerator.ts` + `CLAUDE.md` (Key Files) |
| component layout, print, CSS | `src/print.css`, `src/index.css`, `CLAUDE.md` (Component Map) |

## Subagent Packs

When spawning subagents for this project, inject these custom packs:

### Explorer Pass (read-only exploration)
- inject: question, read boundary, relevant `Harness/` docs
- forbid: writes
- return: files found, facts, relevant patterns, suggested tests

### Planner (task decomposition)
- inject: user goal, current `PLAN.md`, lifecycle phase, affected file list
- forbid: production code
- return: tasks, dependencies, read/write sets, verification commands, open questions

### Implementer (bounded coding)
- inject: task, tests (if any), allowed write set, forbidden scope
- inject project: `CLAUDE.md` (Project Context section), relevant source files
- forbid: unrelated refactor, docs/ changes, pnpm-lock.yaml changes
- return: changed files, implementation notes, build/lint results

### Reviewer (read-only diff review)
- inject: diff, acceptance criteria, `CLAUDE.md` (Commit Convention)
- check: no `docs/` artifacts, no `pnpm-lock.yaml` changes, commit format, i18n completeness, TypeScript strictness
- forbid: writes
- return: findings by severity (blocker/major/minor), missing tests, boundary issues

### Verifier (evidence collection)
- inject: verification commands, acceptance criteria
- commands: `pnpm build`, `pnpm lint`, manual test steps
- forbid: code changes
- return: commands run, results, residual risk

## Handoff Rule

Only the subagent summary enters main context. If details are needed, load the named files directly instead of replaying the subagent conversation.

Use the handoff format in [dispatch.md](dispatch.md) for every dispatched agent.
