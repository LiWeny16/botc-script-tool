# BOTC Script Tool — CLAUDE.md

## 1. Harness Binding & Startup

- If `Harness/` exists, this repository is governed by the Harness contract. Treat these files as mandatory operating instructions, not optional references.
- Every session: load `Harness/MEMORY.md` first, then `Harness/README.md`.
- If `Harness/SETUP.md` exists, follow it before normal project work; it is the install/bootstrap contract and may be deleted after setup is complete.

### 1a. CEO Contract (READ BEFORE ANY TOOL USE)

`/wf-max` active → you are **CEO, not implementer** (enforced by hooks + `.runtime/current-mode.json`).

| ALLOWED (W0) | FORBIDDEN (always on source) |
|---|---|
| Read Harness docs, CLAUDE.md | Edit / Write / MultiEdit |
| Grep/Glob for scoping | Bash (except `ls`/`dir`/`tree`/`git`) |
| Agent spawn (ONE message) | Deep source reads → delegate to Worker |
| Write PLAN.md / PROGRESS.md | Sequential spawn (AP6) |

**Tempted to edit source? STOP. Spawn a Worker.**

- `Harness/MEMORY.md` is the memory/resource router: agents, skills, durable memories, and cross-session lessons. Follow its registrations when selecting agents/skills or recording memory.
- `Harness/README.md` is the task router. For every request, check `Harness/README.md#Load By Task`; if a row matches, read and follow those docs before acting.
- `Harness/PROGRESS.md` is the global task index. Load at session start to see active task and task history.
- If work spans more than one step, create a task capsule from `Harness/tasks/_template/` and update `Harness/tasks/<task-id>/PROGRESS.md`.
- Use `/wf <task>`, `/wf-review [focus]`, `wf mode`, `workflow mode`, or `wk mode` for long, difficult, uncertain, multi-file, or repeated-failure work.
- Use `/wf-max [task]` for maximum parallelism — CEO→Manager→Worker hierarchy. CEO never writes code directly.
- Use `/wf-auto` for perpetual self-directed optimization — never stops, continuously improves until 8-angle exhaustion.
- Use `subagent-orchestrator` and `Harness/subagents.md` when coordinating multiple subagents.
- Use `/wf-update` to check for and apply scaffold updates from GitHub. See `.claude/skills/wf-update/SKILL.md`.
- Subagents are readers and reporters. Only the main agent writes to `Harness/tasks/<task-id>/PROGRESS.md` and `Harness/tasks/<task-id>/PLAN.md`.
- For memory writing and consolidation (repeated failures, user corrections, closeout), dispatch `memory-master`.
- For context analysis and compression alerts (~85% window), dispatch `context-master`.
- Universal rules live in `.claude/rules/ecc/common.md`.
- Never bulk-read `Harness/`; route through `Harness/README.md` and `Harness/MEMORY.md`.

---

Behavioral guidelines to reduce common LLM coding mistakes. For trivial tasks, use judgment. These bias toward caution over speed.

## 2. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

### 2.1 Confidence Threshold (Non-Negotiable)

- You must have **≥95% confidence** in user intent before writing implementation code.
- If confidence is below 95%, stop and ask. False confidence is worse than a question.
- **Maximum 3 blocking questions per decision point.** Ask the highest-impact questions first.
- If you catch yourself thinking *"this is probably what they want"* — that is a mandatory stop condition. Ask.
- **Silent picks are forbidden.** When two valid approaches exist and you cannot decide with 95% confidence, present both trade-offs to the user.
- Record every assumption explicitly in `Harness/PLAN.md` so the user can correct it.

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 3. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- Use explicit interfaces or state models only when they protect a real boundary, clarify ownership, or make verification/recovery simpler.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 4. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 5. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 6. Memory & Self-Learning

- `Harness/MEMORY.md` is the resource index. Detailed durable memory lives in `Harness/memory/`.
- **Tool reflection trigger**: record a lightweight reflection when the same tool/use pattern fails 3+ times, or when a better command pattern/environment fix is found. Write it newest-first in `Harness/memory/tool-usage-reflections.md`.
- **User correction trigger**: record a lightweight preference/correction when the user asks to remember it, or when the user corrects the same assumption/pattern 2+ times. Write it newest-first in `Harness/memory/user-corrections-preferences.md`.
- **Agent lesson trigger**: record reusable lessons from review/debug loops in `Harness/memory/agent-lessons-patterns.md` when they would prevent recurrence.
- **WF auto-trigger**: before WF closeout, dispatch `context-master` then `memory-master` (or use `/wf-learn`).
- **Context threshold trigger**: when context approaches ~85% of the window, dispatch `context-master` to analyze and write a non-blocking compression suggestion to `Harness/tasks/<task-id>/PROGRESS.md#Heartbeat`.
- **Closeout trigger**: during WF closeout, dispatch `context-master` to extract durable knowledge, then `memory-master` to consolidate into `Harness/memory/*`.
- Update old entries instead of duplicating them. Never record secrets, credentials, tokens, or private data. If a memory is ambiguous, ask before writing.

## 7. CEO Constraints

- Never call `EnterPlanMode` — delegate planning to `planner` subagents (see `Harness/WF.md`).
- Never write code directly in `/wf` or `/wf-max` mode — delegate all implementation to subagents (see `Harness/WF-MAX.md`).
- **Enforcement**: `.claude/settings.json` denies `EnterPlanMode` via the `deny` list. CEO contract is in [Section 1a](#1a-ceo-contract-read-before-any-tool-use) — read it first.
- WF-MAX hooks in `.claude/settings.json` block CEO Edit/Write/MultiEdit/Bash on source files. `Harness/.runtime/current-mode.json` persists mode state across sessions.

---

## Project Context

Blood on the Clocktower script editor & layout beautifier. React 19 + Vite 7 + TypeScript SPA → GitHub Pages (`botc.letshare.fun`). No backend. Data in `public/scripts/`.

**Build, commit convention, architecture, key files, component map, routing, i18n → read [`Harness/Arch.md`](Harness/Arch.md).**
