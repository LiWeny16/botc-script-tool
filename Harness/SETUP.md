# SETUP.md - Bootstrap This Product Harness

Temporary file. Delete after the first vertical slice is verified.

## What This Is

This scaffold is a 0-1 product harness:

- short agent entry files
- dynamic docs router
- PRD, research protocol, architecture, ports, data-flow, state templates
- active `Harness/PLAN.md`
- `Harness/MEMORY.md` plus a `Harness/memory/` folder for durable self-learning, user corrections, and tool reflections
- built-in common agents
- subagent orchestration and context-loading protocol
- skill-style dynamic loaders in `.claude/skills/`
- lightweight harness validator
- test/review/feedback loop

It does not guess your stack or business domain. Claude Code should fill those through the lifecycle.

## Bootstrap Prompt

Start Claude Code, then say:

```text
Read Harness/SETUP.md. Bootstrap this project as a 0-1 product harness.
Use Harness/README.md as the router. Keep context small.
First clarify the idea, then create PRD, research, architecture, Harness/PLAN.md, and the first vertical-slice task.
```

## Required Bootstrap Sequence

Claude must follow this order:

1. Read `CLAUDE.md`, `Harness/MEMORY.md`, `Harness/README.md`, and `Harness/lifecycle.md`. Load `Harness/memory/*` only when the router or memory trigger applies.
2. Ask up to 3 blocking product questions. If not blocked, record assumptions in `Harness/PLAN.md`.
3. Fill `Harness/research/PRD.md` with MVP, non-goals, and acceptance criteria.
4. Read `Harness/research/README.md`, then fill `Harness/research/research-results.md` with adopted/rejected research choices.
5. Fill minimum architecture: `Harness/architecture.md` and one port in `Harness/domain/ports.md`.
6. Create the first vertical-slice plan in `Harness/PLAN.md`.
7. Use `Harness/subagents.md`, `Harness/context-loading.md`, and `Harness/dispatch.md` when spawning subagents.
8. Fill `Harness/data-flow.md` or `Harness/state-machines.md` only when the slice changes runtime flow, failure behavior, or state.
9. Implement only after a failing test or manual verification step is defined.
10. Run `node Harness/scripts/validate-harness.mjs --strict`.
11. Record final verification and next feedback step in `Harness/PLAN.md`. If repeated tool failures, repeated user corrections, or reusable review/debug lessons appeared, record the concise reflection in the relevant `Harness/memory/` file.

## Existing Project Bootstrap Sequence

When adding this harness to a project that already has source code, docs, CI, or tool configuration, treat the existing project as the source of truth before filling harness docs.

1. Scan existing project facts first: `README.md`, package files (`package.json`, `pyproject.toml`, `go.mod`, etc.), test commands, app entry points, CI files, existing docs, and current run/build scripts.
2. Record discovered facts and open questions in `Harness/PLAN.md` before changing harness docs.
3. Fill `Harness/research/PRD.md`, `Harness/research/research-results.md`, `Harness/architecture.md`, and `Harness/domain/ports.md` from observed project facts plus explicit user input.
4. Existing configuration is project fact. Do not overwrite `CLAUDE.md`, `AGENTS.md`, `.claude/`, `.gitignore`, settings, hooks, package files, CI, docs routers, or workflow docs unless the user explicitly approves that exact overwrite.
5. When a harness file conflicts with an existing file, preserve the existing file and register any missing harness guidance manually using `Harness/extension.md`.
6. Run `node Harness/scripts/validate-harness.mjs` after registration, then run `node Harness/scripts/validate-harness.mjs --strict` only after project-fact placeholders have been resolved or intentionally recorded as open.

### Agent-Link Install Intake

When the user installs by pasting the GitHub link into an agent, ask intake questions before editing. Ask only questions that affect writes, architecture, security, or workflow. Ask at most three blocking questions up front, record safe defaults for the rest, and ask follow-ups only when that choice becomes active.

| Topic | Ask When | Default If Unanswered |
| --- | --- | --- |
| Root agent entry | `CLAUDE.md`, `AGENTS.md`, `.claude/`, or other agent entry files already exist | Preserve files; ask before merging the Harness entry contract |
| Harness location | `docs/` is already used for GitHub Pages, product docs, or generated docs | Use root `Harness/`; do not write harness docs into `docs/` |
| README ownership | root `README.md` is a public product page, package docs, or heavily customized | Preserve existing README and propose a minimal Development section |
| README optimization | existing README is stale, sparse, missing command tables, or the user asks for diagrams/polished docs | Offer `readme-optimizer`; default to append-only Development notes until the user approves a structure pass or full rewrite |
| Extensions | ECC, Superpowers, custom rules, or stack-specific skills may be useful | Recommend first; install only after user approval |
| Skills | stack is known and optional skills could improve testing, frontend, backend, review, or browser evidence | Install 1-2 relevant skills only after user approval |
| CI/CD | CI config exists or the project lacks a test/build gate | Document existing commands first; add CI/CD only after user approval |
| Verification depth | browser-visible, API, database, auth, payment, or deployment behavior is affected | Require real command evidence; require browser/API evidence when relevant |
| Memory/privacy | repo contains sensitive domain data, customer data, secrets, or private workflows | Enable memory index only; never record secrets or private data |
| Branch/worktree | project has uncommitted changes, risky migration, or parallel implementation lanes | Preserve current worktree; propose branch/worktree before broad edits |
| Package manager/stack | multiple package managers, monorepo apps, or unclear stack boundaries exist | Ask which workspace/app is in scope before writing |

### Agent Conflict Resolution Protocol

When `--on-conflict skip` leaves existing files untouched, the agent resolves each conflict with user supervision.

**Workflow:**

1. Run the harness tool in planning mode to get the conflict list:
   ```
   npx create-harness-vibe-coding@latest . . -y --dry-run --json
   ```
   Parse the JSON output. Files in `plan.skip[]` need attention. Files in `plan.create[]` are handled automatically.

2. For each skipped file, locate the harness template counterpart:
   - From npm: `node_modules/create-harness-vibe-coding/templates/common/<path>`
   - From GitHub: `https://raw.githubusercontent.com/zingspark/create-harness-vibe-coding/main/templates/common/<path>`

3. For each skipped file:
   - Read the existing project file.
   - Read the harness template counterpart.
   - Compare sections and headings. Identify structural sections, registration entries, and required text patterns that exist in the template but are missing from the existing file.
   - If the skipped file is `CLAUDE.md`, tell the user that it is the root agent entry contract. Ask whether they consent to refactor or merge it before editing. Preserve project-specific rules while adding the Harness startup, memory, router, workflow, and subagent orchestration contract.
   - If the skipped file is `AGENTS.md`, tell the user that it is part of the root agent entry contract and ask whether they consent to merge or replace it before editing.
   - Present each gap to the user as a choice:
     - **[Merge]** — Edit the existing file to add only the missing sections. Preserve all existing content, ordering, and formatting.
     - **[Overwrite]** — Replace with the template version. Optionally backup the original first (`--on-conflict backup`).
     - **[Keep]** — Leave the existing file as-is. Skip this file.

4. For Merge: use Edit (not Write) to add missing content. Only insert sections, headings, and text that are structurally required. Do not reorder or modify existing content. Do not remove custom project-specific registrations.

5. After all merges, run `node Harness/scripts/validate-harness.mjs`. Fix any remaining validation errors, then run `node Harness/scripts/validate-harness.mjs --strict` only after project-fact placeholders are resolved.

**File-specific gap checklists:**

The harness validator checks for specific structural invariants. When comparing existing files against templates, verify these are present. Most other template content can vary; only the items below are required.

| File | Required check |
|------|----------------|
| `CLAUDE.md` | Must be merged only after user confirmation when it already exists. Required contract: `## 1. Harness Binding & Startup` with the `Harness/SETUP.md` bootstrap contract line; `## 6. Memory & Self-Learning` section; the tool reflection trigger text (`same tool/use pattern fails 3+ times`); the user correction trigger text (`user corrects the same assumption/pattern 2+ times`); `Never bulk-read Harness/` in Startup |
| `AGENTS.md` | Root agent entry points to `CLAUDE.md` and `Harness/README.md`; for existing projects, merge only after explicit user consent |
| `README.md` | Existing README is project-owned. Preserve by default; ask whether to append only Development notes or run `readme-optimizer` for a structure pass with tables/diagrams before broad edits |
| `Harness/MEMORY.md` | All 9 common agents registered under `## Agents`; all common harness skills registered under `## Skills`; all 3 `Harness/memory/` files registered under `## Memory Folder`; `Harness/memory/` folder usage guidance; `Project Resource Index` in title |
| `.claude/rules/ecc/common.md` | `## Context` section with the durable communication invariant (`project files are the only durable communication channel`); `## Memory` section with three reflection file entries; `## Security` section |
| `Harness/README.md` | `## Keyword Routing` heading; `## Load By Task` table with at minimum the rows: "Adding harness to existing project", "Need implementation plan", "Need parallel agents", "Need subagents", "Need durable memory or reflection"; `## Doc Map` with `memory/` and `subagents.md` entries; the durable communication invariant text; `Harness/README.md is the primary router` |
| `Harness/extension.md` | `## Non-Invasive Extension Rules` section with the "Preserve existing" rule; `## Agent Contract` section; `## Registration` section |
| `Harness/dispatch.md` | The durable communication invariant; common agent entries for all 9 agents; `## Handoff Format` heading |
| `Harness/context-loading.md` | The durable communication invariant; `Harness/README.md is the primary router`; all 10 subagent context packs (Explorer Pass, Planner, Researcher, Docs Researcher, Architect, Test Writer, Implementer, Reviewer, Debugger, Verifier) |
| `Harness/subagents.md` | `## Source Attribution`; `Controller Role`; `Efficiency Ladder`; `Review Gates`; source markers for `npx skills find`, `dispatching-parallel-agents`, and `subagent-driven-development` |
| `Harness/PLAN.md` | `## Current Goal`, `## Phase`, `## Success Criteria`, `## Loaded Context`, `## Tasks`, `## Parallel Dispatch`, `## Subagent Synthesis`, `## Verification` headings |
| `Harness/SETUP.md` | Only meaningful for fresh projects. If the project has its own onboarding docs, skip this file entirely (it is temporary). If kept, ensure the "Existing Project Bootstrap Sequence" is present. |
| `Harness/workflows/browser-e2e.md` (if installed as optional) | `data-testid`, `accessible labels/roles`, and `inputs, buttons, filters, rows, empty/error/loading states` requirement |
| `Harness/workflows/ts-react-frontend.md` (if installed as optional) | Same UI selector contract as above |
| `Harness/features/_template.md` | `## 1.5 UI Automation Hooks` with `data-testid` table |

**Files that do NOT need manual merge when the path does not already exist (auto-created by harness):**

- `Harness/memory/tool-usage-reflections.md`, `Harness/memory/user-corrections-preferences.md`, `Harness/memory/agent-lessons-patterns.md` — these are new empty files
- `.claude/agents/*.md` — all 9 common agents
- `.claude/skills/harness-*/SKILL.md`, `.claude/skills/wf-mode/SKILL.md`, and `.claude/skills/subagent-orchestrator/SKILL.md` — core harness skills, WF mode, and subagent orchestration
- `.claude/rules/ecc/common.md` — universal rules (unless the project has custom rules in this file)
- `.claude/settings.json` — harness settings
- `Harness/lifecycle.md`, `Harness/subagents.md`, `Harness/agent-workflow.md`, `Harness/architecture.md`, `Harness/data-flow.md`, `Harness/state-machines.md` — harness runtime docs
- `Harness/research/*.md` — research protocol and templates
- `Harness/domain/ports.md` — port contract template
- `AGENTS.md` — agent registry; if it already exists, ask for user consent before merging or replacing it
- `Harness/scripts/validate-harness.mjs` and `tests/.gitkeep` — tooling

Optional workflow examples:

```bash
npx create-harness-vibe-coding@latest my-app ./my-app -y --with browser-e2e,ts-react-frontend
npx create-harness-vibe-coding@latest my-app ./my-app -y --preset web-app
```

### Template Fill Guide

Each template doc contains `{{PLACEHOLDER}}` markers. Below is what every placeholder expects. Replace all markers in the doc before moving to the next doc. If a section does not apply yet, leave the `{{...}}` but record why in `Harness/PLAN.md`.

**`Harness/research/PRD.md`** — Product scope. Fill with product facts from user input, not guesses:
- `{{WHY_THIS_PROJECT_EXISTS}}`: one-sentence motivation
- `{{MUST_1..3}}`: concrete, testable MVP items (checkbox form)
- `{{NON_GOAL_1..3}}`: explicitly out-of-scope items
- `{{USER_ROLE}}`, `{{SCENARIO}}`, `{{FREQUENCY}}`, `{{PAIN}}`: one row per user type
- `{{ACCEPTANCE_1..3}}`: verifiable project-level acceptance criteria
- `{{DIMENSION}}`, `{{TARGET}}`, `{{MEASUREMENT}}`: non-functional requirements (perf, security, etc.)

**`Harness/research/research-results.md`** — Tech decisions. Research before filling:
- Use `Harness/research/README.md` as the research protocol.
- `{{CANDIDATE_1..3}}`: each candidate (framework, library, architecture style) with Purpose/Strength/Weakness/Decision/Link.
- `{{Architecture Style}}`: the chosen architectural style (e.g., Hexagonal, Modular Monolith).
- `{{CONSTRAINT_1..3}}`: hard technical constraints derived from research.
- `{{ALTERNATIVE_1..2}}`: rejected candidates worth watching for future.

**`Harness/architecture.md`** — Layer structure. Derive from research-results:
- Fill the ASCII layer diagram with actual layer names. Do NOT add layers without a proven need.
- `2.1–2.5`: describe each harness core component (Runner, Permission Policy, Event Bus, State Store, Tool Registry) in project-specific terms.
- `3. Architectural Constraints`: add project-specific non-negotiables. Keep the domain/harness purity rules.

**`Harness/domain/ports.md`** — Cross-layer contracts. One driving port + one driven port from the first slice:
- `{{INBOUND_PORT_1}}`: the first inbound port (e.g., "CreateOrderPort").
- `{{OUTBOUND_PORT_1}}`: the first outbound port (e.g., "OrderRepository").
- For each port: fill Purpose, Preconditions, Postconditions, Error Semantics, Idempotency.
- Leave remaining rows as `{{...}}` until more slices add ports.

**`Harness/PLAN.md`** — Active execution state. Update continuously:
- `## Current Goal`: one sentence, what this iteration achieves.
- `## Phase`: current lifecycle phase (Idea/Research/PRD/Architecture/Plan/Build/Verify/Feedback).
- `## Success Criteria`: verifiable outcomes for this iteration.
- `## Tasks`: numbered tasks with owner, write set, and verify command.
- `## Parallel Dispatch`: only when spawning subagents — fill agent roles, read/write boundaries.
- `## Verification`: record test results, review findings, docs sync checklist.

**`Harness/memory/`** — Durable self-evolution notes:
- `Harness/memory/tool-usage-reflections.md`: repeated tool failures, better command patterns, environment-specific fixes.
- `Harness/memory/user-corrections-preferences.md`: repeated user corrections, durable preferences, common-sense course corrections.
- `Harness/memory/agent-lessons-patterns.md`: reusable lessons from review, debugging, validation, and handoff loops.

**`Harness/data-flow.md`** — Runtime event paths (only when first slice has async/multi-step flow):
- `{{EVENT_1}}`: the first event type with producer, consumers, payload fields, delivery semantics.
- Happy Path: fill the Mermaid sequence diagram with actual ports and actions.
- Failure Paths: for each failure point, document trigger, system behavior, event, caller perception, recovery.
- If the first slice is synchronous and stateless, leave this doc as `{{...}}` and note in PLAN.md.

**`Harness/state-machines.md`** — State transitions (only when first slice has stateful entities):
- Define states, transitions, guards, and illegal transitions for the first stateful entity.
- If no stateful entity exists in the first slice, leave as `{{...}}` and note in PLAN.md.

**General rules for all templates**:
- Replace `botc-script-tool` with the actual project name immediately.
- Never invent content for a `{{...}}` marker. If you lack facts, ask the user or leave the marker.
- `<!-- HTML comments -->` in templates are instructions to you. Read them. Delete them after filling the section.
- After filling all templates in a phase, run `node Harness/scripts/validate-harness.mjs --strict`. Any remaining `{{...}}` in project-fact files will be flagged.

## Architecture Research (Dynamic)

Do not guess the architecture. Use `Harness/research/README.md` as the protocol and the high-star repos below as seed references. Search within them; do not read them whole.

### Seed Repositories (High-Star, High-Trust)

| Repository | Stars | Use For |
|-----------|-------|---------|
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | 266k+ | System design fundamentals, trade-off frameworks |
| [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101) | 65k+ | Visual system design, protocol/DB patterns |
| [DovAmir/awesome-design-patterns](https://github.com/DovAmir/awesome-design-patterns) | 47k+ | General arch, cloud, serverless, microservices, front-end, security |
| [mehdihadeli/awesome-software-architecture](https://github.com/mehdihadeli/awesome-software-architecture) | high | CQRS, Outbox, Saga, Circuit Breaker, BFF, scaling |
| [greatfrontend/awesome-front-end-system-design](https://github.com/greatfrontend/awesome-front-end-system-design) | high | Front-end system design patterns |
| [adr.github.io](https://adr.github.io) | — | ADR templates and tooling |

### Architecture Fill Protocol

After research, fill these docs in order:

1. `Harness/research/research-results.md` — Record candidate architectures with Adopt / Reject / Watch decisions. Use the `## Candidate References` template.
2. `Harness/architecture.md` — Fill the layering diagram, core components, and constraints. Do NOT add speculative layers. One layer per proven need.
3. `Harness/domain/ports.md` — Define ONE driving port and ONE driven port from the first vertical slice. More ports come with more slices.
4. `Harness/data-flow.md` — Fill the happy path for the first slice only. Add failure paths when they differ from the happy path.

**Constraint**: If the research does not give you enough confidence to fill a section, leave the `{{...}}` placeholder and record the open question in `Harness/PLAN.md`. The strict validator will catch it.

## User Confirmation Protocol (Non-Negotiable)

> This harness is a design partner, not a solo builder. The user owns product intent.

When user intent is unclear or ambiguous:

- **Maximum 3 blocking questions per decision point.** Ask the highest-impact questions first.
- **Do not act on assumptions that affect architecture, scope, stack, or user-facing behavior.**
- **You must have ≥95% confidence before writing implementation code.** If below that threshold, stop and ask.
- **Record every assumption explicitly** in `Harness/PLAN.md` so the user can correct it later.
- **Silent picks are forbidden.** If two valid approaches exist and you cannot decide with high confidence, present both to the user with trade-offs.

False confidence is worse than a question. If you catch yourself thinking "this is probably what they want," stop and ask.

## How to Find Proper Skills

After the architecture stage reveals your stack, install matching agent skills. Skills teach Claude Code domain-specific patterns, testing conventions, and design rules.

**Built-in route**: invoke the `/find-skills` skill (or say "help me find skills for X"). Examples:

```text
"Find skills for React TypeScript frontend testing."
"Find skills for Python FastAPI backend development."
"What skills exist for Playwright e2e testing?"
"I need a skill for PostgreSQL schema design."
```

**Superpowers**: [Superpowers](https://github.com/obra/superpowers) is a community skill registry. Search it:

```bash
# If superpowers CLI or MCP is configured
npx skills search "react testing"
npx skills search "python api"
```

**Manual discovery**: search GitHub and npm directly using patterns from `Harness/research/README.md#Architecture Decision References`.

**Priority order**:
1. `/find-skills` first — fastest discovery, respects your tool environment.
2. Superpowers registry — broad community coverage.
3. GitHub search — when the first two miss niche domains.

**What to install**: after finding skills, add them to `.claude/skills/<name>/SKILL.md`. Follow `Harness/extension.md` for compatibility. Start with 1-2 skills per stack area; more is not better.

This scaffold includes built-in harness skills (`.claude/skills/harness-*`). Keep those. Add stack-specific ones alongside them.

## Optional Agent Assets

After the product shape is known, Claude may also install or copy stack-specific agents, rules, and hooks into `.claude/`. Follow `Harness/extension.md` for every added asset.

Examples:

```text
This is a React TypeScript SaaS app. Add frontend testing and review agents.
This is a Python data product. Add data pipeline and pytest workflow agents.
This is a Go service. Add API, security, and integration-test agents.
```

## Cleanup (Isolate & Remove)

This file is designed to be orphaned. When all configuration is complete:

1. Open `CLAUDE.md`. Delete the setup bootstrap line that starts with: ``If `Harness/SETUP.md` exists, follow it before normal project work``.
2. Delete this file.

```bash
rm Harness/SETUP.md
```

After both steps, `Harness/SETUP.md` is fully isolated — no file references it, no trace remains. You are free to delete it at any time. It is a bootstrap scaffold, not a permanent fixture.

---

## For Agents (Self-Bootstrapping)

If you are an AI agent running `create-harness-vibe-coding` to scaffold your own project harness, use non-interactive mode:

```bash
npx create-harness-vibe-coding@latest <project-name> <target-dir> -y
```

Example:

```bash
npx create-harness-vibe-coding@latest my-agent-project ./my-agent-project -y
```

After scaffolding, bootstrap the harness yourself:

1. Read `CLAUDE.md`, `Harness/MEMORY.md`, and `Harness/README.md`.
2. Follow the Required Bootstrap Sequence above.
3. Run `node Harness/scripts/validate-harness.mjs --strict` when done.
4. Delete `Harness/SETUP.md`.
