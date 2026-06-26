# Port Contracts — botc-script-tool

> **Responsibility**: Define cross-layer interface contracts. These are the "legal contracts" of a layered architecture. Each port documents not only its signature, but also preconditions, postconditions, and error semantics.
>
> **Principle**: Port documentation != API reference documentation. It is a contract that specifies caller obligations and implementer guarantees.
>
> Philosophical origins: Bertrand Meyer's Design by Contract (Eiffel) + Alistair Cockburn's hexagonal architecture port documentation.

---

## 1. Port Classification

### 1.1 Driving Ports (Inbound — external calls application)

| Port | Definition Location | Purpose |
| --- | --- | --- |
| `{{INBOUND_PORT_1}}` | `{{LOCATION}}` | {{DESCRIPTION}} |

### 1.2 Driven Ports (Outbound — application calls external)

| Port | Definition Location | Purpose |
| --- | --- | --- |
| `{{OUTBOUND_PORT_1}}` | `{{LOCATION}}` | {{DESCRIPTION}} |

---

## 2. Port Definition Template

Fill in each port using the format below:

- **Category**: Driving / Driven
- **Definition Location**: `{{FILE_PATH}}`
- **Contract Class**: `{{CLASS_OR_INTERFACE}}`

### Purpose

{{WHAT_THIS_PORT_DOES}}

### Methods

**Preconditions** (caller must guarantee):
- {{PRECONDITION_1}}
- {{PRECONDITION_2}}

**Postconditions** (implementer guarantees):
- {{POSTCONDITION_1}}
- {{POSTCONDITION_2}}

**Error Semantics**:

| Exception Type | Trigger Condition | Caller Should |
| --- | --- | --- |
| `{{EXCEPTION_TYPE}}` | {{CONDITION}} | {{CALLER_ACTION}} |

**Idempotency**: {{YES_NO_AND_DETAILS}}

### Known Implementations

| Adapter | Location | Purpose |
| --- | --- | --- |
| `{{ADAPTER_NAME}}` | `{{LOCATION}}` | {{PURPOSE}} |

---

## 3. Cross-Port Invariants

- {{INVARIANT_1}}
- {{INVARIANT_2}}
- New ports must be defined in `domain/ports`; adapters go in `infrastructure/`.

---

> **Note**: The current ports.md is a template. Replace `{{...}}` placeholders with your project's domain details. Refer to `Harness/data-flow.md` to understand how ports are orchestrated.
