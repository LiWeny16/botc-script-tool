# PRD: botc-script-tool

> **Audience**: AI + future you. Not for PM approval — for implementation and review.
> **Principle**: One page max. Use checkboxes, not prose. Negative definitions > positive definitions.
>
> Philosophy source: Miqdad Jaffer (OpenAI)'s lean PRD template for the AI era.

---

## 1. Why

{{WHY_THIS_PROJECT_EXISTS}}

## 2. MVP Scope

### v0.1 Must Be Able To

> Each item below must be split into a separate `Harness/features/<name>.md` created from `Harness/features/_template.md` before implementation begins. One feature = one doc = one implementation unit.

- [ ] {{MUST_1}}
- [ ] {{MUST_2}}
- [ ] {{MUST_3}}

### Explicitly Out of Scope

- {{NON_GOAL_1}}
- {{NON_GOAL_2}}
- {{NON_GOAL_3}}

## 3. Decision Priorities

1. **Security Boundary** — No bypassing permissions, security gates, or audit.
2. **Architecture Boundary** — Domain must not depend on harness/infrastructure/interfaces, and harness must not make domain judgments.
3. **Verifiability** — New behavior must have tests or explicit manual verification records.
4. **Correctness** — Behavior must match design docs, port contracts, data flows, and state machines.
5. **Simplicity** — Minimum code to solve the current MVP. No abstractions pre-built for future scenarios.

## 4. Users & Usage Scenarios

| User Role | Core Scenario | Frequency | Pain Point |
| --- | --- | --- | --- |
| {{USER_ROLE_1}} | {{SCENARIO}} | {{FREQUENCY}} | {{PAIN}} |
| {{USER_ROLE_2}} | {{SCENARIO}} | {{FREQUENCY}} | {{PAIN}} |

## 5. Acceptance Criteria

- [ ] {{ACCEPTANCE_1}}
- [ ] {{ACCEPTANCE_2}}
- [ ] {{ACCEPTANCE_3}}

## 6. Non-Functional Requirements

| Dimension | Target | Measurement |
| --- | --- | --- |
| {{DIMENSION_1}} | {{TARGET}} | {{MEASUREMENT}} |
| {{DIMENSION_2}} | {{TARGET}} | {{MEASUREMENT}} |

---

## Fill Completion Standard

- [ ] MVP and Non-goals are project facts; no `{{...}}` placeholders remain.
- [ ] Decision priorities guide tradeoffs, not generic platitudes.
- [ ] Every acceptance criterion is verifiable by test, command, or manual step.
- [ ] If implementation diverges from the PRD, update this file before changing code.
