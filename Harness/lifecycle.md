# 0-1 Product Lifecycle

Use when starting a new product, clarifying a vague idea, or deciding the next phase.

## Phase Contract

| Phase | Input | Output | Gate |
| --- | --- | --- | --- |
| Idea | user intent | problem, target user, non-goals | unclear points asked or assumptions recorded |
| Research | problem and constraints | `research/research-results.md` | `research/README.md` followed; at least 3 references or explicit reason not possible |
| PRD | research decision | `research/PRD.md` | MVP, non-goals, acceptance criteria are verifiable |
| Architecture | PRD | `Harness/architecture.md` | boundaries and first ports are defined |
| Plan | PRD and architecture | `Harness/tasks/<task-id>/PLAN.md`, optional `Harness/dispatch.md` | tasks have owners, write sets, verification |
| Build | plan and tests | minimal vertical slice | tests or manual checks prove behavior |
| Verify | implementation | review findings, test evidence | no unresolved critical/high findings |
| Feedback | verified slice | next iteration or release decision | learnings recorded in PRD, PLAN, or MEMORY |

## Operating Rules

- Move one phase at a time unless the user explicitly asks for a fast lane.
- Start coding only after PRD and minimum architecture gates pass.
- Prefer one thin vertical slice over broad scaffolding.
- If feedback changes scope, update PRD before implementation.
- If implementation reveals a boundary problem, update architecture or ports before continuing.

## Fast Lane

Small edits may skip full lifecycle when all are true:

- user intent is clear
- one file or one narrow behavior
- no architecture, permission, or public API change
- one verification command or one manual check is enough
