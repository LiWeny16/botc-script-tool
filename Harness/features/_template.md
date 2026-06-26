# {{FEATURE_NAME}}

> **When to use**: Every PRD scope item in `Harness/research/PRD.md` Section 2 must have a feature doc — either a new one from this template, or an iteration on an existing one. Do not code a PRD scope item without a corresponding features doc.
>
> **New vs iterate**: If the scope item has ≥85% overlap with an existing feature doc, iterate the existing doc (bump `Version`, add a `## Changelog` entry). If overlap is below 85%, create a new file from this template. When in doubt, ask the user.

> **Status**: Draft / In Progress / Blocked / Done
> **Created**: {{YYYY-MM-DD}}
> **Version**: 1
> **Owner**: {{OWNER_OR_AGENT}}
> **Related Docs**: {{PRD_OR_ARCH_DOC_LINKS}}

---

## 1. Requirements

### 1.1 Background

{{WHY_THIS_FEATURE_EXISTS}}

### 1.2 Goals

- {{GOAL_1}}
- {{GOAL_2}}

### 1.3 Non-Goals

- {{NON_GOAL_1}}
- {{NON_GOAL_2}}

### 1.4 Acceptance Criteria

- [ ] {{ACCEPTANCE_CRITERION_1}}
- [ ] {{ACCEPTANCE_CRITERION_2}}
- [ ] {{ACCEPTANCE_CRITERION_3}}

### 1.5 UI Automation Hooks

For TS/React or browser workflows, define required stable accessible labels/roles and stable test hooks such as `data-testid` before implementation. These selectors must cover critical UI controls and states so CDP, Playwright, and manual verification can target inputs, buttons, filters, rows, empty/error/loading states, dialogs, navigation, and submitted/saved/error feedback without brittle DOM paths.

| Element / State | Accessible Role / Label | `data-testid` | Verification Target |
| --- | --- | --- | --- |
| {{INPUT_OR_CONTROL}} | {{ROLE_OR_LABEL}} | {{DATA_TESTID}} | {{PLAYWRIGHT_OR_MANUAL_CHECK}} |
| {{EMPTY_ERROR_LOADING_OR_ROW_STATE}} | {{ROLE_OR_LABEL}} | {{DATA_TESTID}} | {{PLAYWRIGHT_OR_MANUAL_CHECK}} |
| Not UI-facing | N/A | N/A | N/A |

---

## 2. Design

### 2.1 Impact Scope

| Area | Impacted? | Notes |
| --- | --- | --- |
| `Harness/architecture.md` | {{YES_NO}} | {{NOTE}} |
| `Harness/domain/ports.md` | {{YES_NO}} | {{NOTE}} |
| `Harness/data-flow.md` | {{YES_NO}} | {{NOTE}} |
| `Harness/state-machines.md` | {{YES_NO}} | {{NOTE}} |
| tests | {{YES_NO}} | {{NOTE}} |

### 2.2 Allowed Write Set

- `{{PATH_OR_GLOB_1}}`
- `{{PATH_OR_GLOB_2}}`

### 2.3 Forbidden Scope

- `{{PATH_OR_BEHAVIOR_1}}`
- `{{PATH_OR_BEHAVIOR_2}}`

### 2.4 Approach

#### Candidate Approaches

| Approach | Pros | Cons | Decision |
| --- | --- | --- | --- |
| {{OPTION_A}} | {{PROS_A}} | {{CONS_A}} | {{ACCEPT_REJECT}} |
| {{OPTION_B}} | {{PROS_B}} | {{CONS_B}} | {{ACCEPT_REJECT}} |

#### Rationale

{{SELECTED_DESIGN_AND_RATIONALE}}

### 2.5 Edge Cases

- {{EDGE_CASE_1}} -> {{EXPECTED_BEHAVIOR_1}}
- {{EDGE_CASE_2}} -> {{EXPECTED_BEHAVIOR_2}}

---

## 3. Tasks

> Every task must have a verification method. When a subagent is needed, define its role and write set first.

| # | Task | Owner | Write Set | Verify |
| --- | --- | --- | --- | --- |
| 1 | {{WRITE_FAILING_TEST_OR_DOC_CHECK}} | {{OWNER}} | `{{PATH}}` | `{{COMMAND_OR_CHECK}}` |
| 2 | {{IMPLEMENT_MINIMAL_CHANGE}} | {{OWNER}} | `{{PATH}}` | `{{COMMAND_OR_CHECK}}` |
| 3 | {{SYNC_DOCS_OR_BOUNDARIES}} | {{OWNER}} | `{{PATH}}` | `{{COMMAND_OR_CHECK}}` |

### Subagent Plan (required — justify if all No)

Estimate the context budget for this feature. If the main agent would need to read >5 files or modify >3 files, subagents are mandatory per `.claude/rules/ecc/common.md`.

| Agent / Pass | Required? | Mode | Read Boundary | Write Set | Verify |
| --- | --- | --- | --- | --- | --- |
| Planner | {{YES_NO}} | Parallel Read | `{{SCOPE}}` | none | `{{CHECK}}` |
| Researcher / Docs Researcher | {{YES_NO}} | Parallel Read | `{{SCOPE}}` | none | `{{CHECK}}` |
| Architect | {{YES_NO}} | Parallel Read | `{{SCOPE}}` | none | `{{CHECK}}` |
| Explorer Pass | {{YES_NO}} | Parallel Read | `{{SCOPE}}` | none | `{{CHECK}}` |
| Test Writer | {{YES_NO}} | Serial Write | `{{SCOPE}}` | `{{PATH}}` | `{{COMMAND}}` |
| Implementer / Debugger | {{YES_NO}} | Serial Write | `{{SCOPE}}` | `{{PATH}}` | `{{COMMAND}}` |
| Reviewer | {{YES_NO}} | Parallel Read | `{{SCOPE}}` | none | `{{CHECK}}` |
| Verifier | {{YES_NO}} | Parallel Read | `{{SCOPE}}` | none | `{{COMMANDS}}` |

**If all roles are No, justify:** {{WHY_MAIN_AGENT_CAN_HANDLE_ALONE}}

---

## 4. Verification

### 4.1 Test Results

| Command | Result | Notes |
| --- | --- | --- |
| `{{TEST_COMMAND}}` | {{PASS_FAIL_NOT_RUN}} | {{NOTES}} |
| `{{OTHER_COMMAND}}` | {{PASS_FAIL_NOT_RUN}} | {{NOTES}} |

### 4.2 Review Findings

- {{FINDING_OR_NONE}}

### 4.3 Docs Sync

- [ ] `Harness/architecture.md`
- [ ] `Harness/domain/ports.md`
- [ ] `Harness/data-flow.md`
- [ ] `Harness/state-machines.md`
- [ ] `Harness/research/research-results.md`
- [ ] Not needed because {{REASON}}

### 4.4 Decision Log

| Date | Decision | Reason |
| --- | --- | --- |
| {{YYYY-MM-DD}} | {{DECISION}} | {{REASON}} |

### 4.5 Closeout

- [ ] Acceptance criteria satisfied.
- [ ] Tests or manual verification recorded.
- [ ] Boundary impact documented.
- [ ] Remaining risks listed or explicitly none.
- [ ] If docs/code/tests conflicted, Decision Log records how it was resolved.

Remaining risks:
- {{RISK_OR_NONE}}

---

## 5. Changelog

> Only populate when iterating an existing feature doc (Version ≥ 2).

| Version | Date | What Changed | Reason |
| --- | --- | --- | --- |
| 1 | {{YYYY-MM-DD}} | Initial version | — |
