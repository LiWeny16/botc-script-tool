# Harness Architecture — botc-script-tool

> **Responsibility**: Defines the system layering structure, component overview, and key design decisions.
> **Does NOT cover**: Code details (AI can read code), API documentation (placed in docstrings).
>
> Philosophical sources: arc42 Chapter 5 (Building Block View) + C4 Model Level 3 (Component) + matklad's lightweight ARCHITECTURE.md.

---

## 1. Layering Rules

<!-- This is the hardest constraint in the entire architecture. Each layer's "allowed dependencies" must be explicit. -->

```
┌──────────────────────────┐
│     interfaces/          │  ← User entry (CLI / API / UI)
│     May depend on: harness│
├──────────────────────────┤
│     harness/             │  ← Generic runtime shell: orchestration,
│     May depend on:        │     security, auditing, scheduling
│       application         │     Contains no business rules
├──────────────────────────┤
│     application/         │  ← Business use-case orchestration
│     May depend on: domain │
├──────────────────────────┤
│     domain/              │  ← Pure business objects + port protocols
│     Only depends on:      │     Depends on no external implementations
│       standard library    │
├──────────────────────────┤
│     infrastructure/      │  ← Adapter implementations (data sources,
│     Implements domain     │     external services)
│       ports               │
└──────────────────────────┘
```

**Hard Constraints**:
- domain must never import infrastructure/ or interfaces/
- application only depends on domain
- harness coordinates workflows but contains no domain business rules
- All cross-layer communication goes through port protocols defined in domain

---

## 2. Harness Core Components

### 2.1 Runner / Loop

- **Responsibility**: Drives a task from input to completion: loading context, calling application use-cases, handling stop conditions.
- **Design Decision**:
  - Runner only orchestrates, does not interpret domain meaning — Rationale: keeps harness reusable across different business domains
  - Stop conditions are explicitly modeled — Rationale: prevents agent loops from running indefinitely or silently half-completing
- **Does NOT handle**: Business rules, domain object creation details, external service implementations

### 2.2 Permission Policy

- **Responsibility**: Decides whether a given tool, file, network, or external action is allowed to execute.
- **Design Decision**:
  - High-risk actions are denied by default, allow rules are explicitly declared — Rationale: the platform must first guarantee security boundaries
- **Does NOT handle**: Judging whether a business action is correct

### 2.3 Event Bus / Audit Trail

- **Responsibility**: Records task lifecycle, tool invocations, failures, human approvals, and final results.
- **Design Decision**:
  - Events are append-only, audit records cannot be overwritten in place — Rationale: facilitates replay, debugging, and post-mortem analysis
- **Does NOT handle**: Saving final data on behalf of business systems

### 2.4 State / Checkpoint Store

- **Responsibility**: Saves recoverable state, context summaries, task progress, and interrupt points.
- **Design Decision**:
  - State format must be serializable — Rationale: enables replay, resume, testing, and migration
- **Does NOT handle**: Long-term business database modeling

### 2.5 Tool Registry

- **Responsibility**: Registers callable tools along with their input/output contracts, permission labels, and error semantics.
- **Design Decision**:
  - Tool contracts explicitly specify input, output, errors, and side effects — Rationale: reduces the probability of agent tool misuse
- **Does NOT handle**: Internal business implementation of tools

---

## 3. Architectural Constraints (Non-Negotiable)

- `domain/` only defines business models, business invariants, and port protocols; does not import `harness/`, `infrastructure/`, or `interfaces/`.
- `harness/` may orchestrate workflows, security gates, auditing, and stop conditions, but must not determine business meaning.
- All cross-layer external capabilities are expressed through `domain` ports; adapter implementations live in `infrastructure/`.
- Rejections and failures must be testable or documented with manual verification steps in the feature doc.
- Audit events are append-only, never overwritten in place.
