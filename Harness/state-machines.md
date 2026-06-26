# State Machines — botc-script-tool

> **Responsibility**: Define the states, transitions, guard conditions, and boundary behaviors for every stateful component. The majority of bugs in long-running harness pipelines originate from illegal state transitions.
>
> Philosophical source: UML 2.5.1 Section 15.3.14 + "The transition table is the single most important artifact in the document."

---

## State Machine Template

Fill out each stateful component using this format:

### State Enumeration

| State | Description | Entry Condition | Exit Condition |
| --- | --- | --- | --- |
| `{{STATE_1}}` | {{DESCRIPTION}} | {{CONDITION}} | {{CONDITION}} |
| `{{STATE_2}}` | {{DESCRIPTION}} | {{CONDITION}} | {{CONDITION}} |

### State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> {{INITIAL_STATE}}
    {{INITIAL_STATE}} --> {{STATE_2}} : {{TRIGGER}}
    {{STATE_2}} --> {{INITIAL_STATE}} : {{TRIGGER}}
```

### Transition Table (Most Important)

| Current State ↓ / Event → | `{{EVENT_1}}` | `{{EVENT_2}}` | `{{EVENT_3}}` |
| --- | --- | --- | --- |
| **`{{STATE_1}}`** | {{TARGET}} | {{TARGET}} | {{TARGET}} |
| **`{{STATE_2}}`** | {{TARGET}} | {{TARGET}} | {{TARGET}} |

### Guard Conditions

| Transition | Guard Condition | Notes |
| --- | --- | --- |
| `{{SOURCE}} -> {{TARGET}}` | {{GUARD}} | {{NOTE}} |

### Illegal Transitions

| Transition | Why Illegal |
| --- | --- |
| `{{SOURCE}} -> {{TARGET}}` | {{REASON}} |

---

> **Note**: The current state-machines.md is an empty template. Please fill it in according to the project's actual stateful components.
