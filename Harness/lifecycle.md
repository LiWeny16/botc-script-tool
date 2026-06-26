# Feature Contribution Lifecycle

Use when starting a new feature, fixing a bug, or deciding the next step in a multi-step change.

## Phase Contract

| Phase | Input | Output | Gate |
| --- | --- | --- | --- |
| **Idea** | user request or issue | clarified problem, affected files | unclear points asked or assumptions recorded in PLAN.md |
| **Research** | problem + codebase | understanding of affected code paths, existing patterns | at least 3 relevant files read; existing conventions noted |
| **Plan** | research findings | `PLAN.md` with tasks, write sets, verification | tasks have owners and verification commands |
| **Build** | plan + tests | minimal implementation | `pnpm build` passes; lint clean |
| **Verify** | implementation | review findings, test evidence | no unresolved issues; manual test on real script JSON |
| **Review** | verified slice | PR or merge decision | PR checklist passed (see [PR_GUIDELINES.md](PR_GUIDELINES.md)) |
| **Feedback** | merged/released | next iteration or close | learnings recorded |

## Operating Rules

- Move one phase at a time unless the task is a trivial single-file fix.
- Start coding only after Plan gate passes.
- Prefer one thin vertical slice over broad scaffolding.
- If implementation reveals a boundary problem, update the plan before continuing.
- If feedback changes scope, update PLAN.md before implementation.

## Fast Lane

Small edits may skip full lifecycle when ALL are true:
- user intent is clear
- one file or one narrow behavior
- no architecture, i18n, data-flow, or public API change
- `pnpm build` + `pnpm lint` is enough verification
- no new dependencies

## Feature Packet

For features touching 3+ files:
1. Create a brief feature doc in `Harness/PLAN.md` (fill the ## Current Goal and ## Tasks)
2. List every file in the write set
3. Define verification before first commit

For bug fixes:
1. Write reproduction steps in `PLAN.md`
2. Verify the bug exists before fixing
3. Verify the fix + verify no regression

## Completion Gate

Close only when:
- `pnpm build` passes with zero errors
- `pnpm lint` passes with zero warnings
- Manual test on at least one real script JSON passes
- No `docs/` or `pnpm-lock.yaml` changes in diff (unless intentional)
- `Harness/PLAN.md` states the final status

## For External Contributors

See [PR_GUIDELINES.md](PR_GUIDELINES.md) for the full PR checklist.
See [AI_CONTRIBUTING.md](AI_CONTRIBUTING.md) for AI prompt templates.
