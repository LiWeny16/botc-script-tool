# BOTC Script Tool — CLAUDE.md

## 1. Startup

- Every session: read `Harness/README.md` (the doc router). Never bulk-read `Harness/`.
- If work spans more than one step, update `Harness/PLAN.md`.
- All routing and per-task doc loads live in `Harness/README.md`. Not here.

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

- `MEMORY.md` is the index. Detailed durable memory lives in `memory/`.
- **Tool reflection trigger**: record a lightweight reflection when the same tool/use pattern fails 3+ times, or when a better command pattern/environment fix is found. Write it newest-first in `memory/tool-usage-reflections.md`.
- **User correction trigger**: record a lightweight preference/correction when the user asks to remember it, or when the user corrects the same assumption/pattern 2+ times. Write it newest-first in `memory/user-corrections-preferences.md`.
- **Agent lesson trigger**: record reusable lessons from review/debug loops in `memory/agent-lessons-patterns.md` when they would prevent recurrence.
- Update old entries instead of duplicating them. Never record secrets, credentials, tokens, or private data. If a memory is ambiguous, ask before writing.

---

## Project Context

Blood on the Clocktower script editor & layout beautifier. React 19 + Vite 7 + TypeScript SPA → GitHub Pages (`botc.letshare.fun`). No backend. Data in `public/scripts/`.

**Build, commit convention, architecture, key files, component map, routing, i18n → read [`Harness/Arch.md`](Harness/Arch.md).**
