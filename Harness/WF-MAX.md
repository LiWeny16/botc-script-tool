# WF-MAX — Maximum Parallelism Workflow

## Trigger

- Explicit: `/wf-max [task]`
- Auto: WF task with write-set ≥5 files AND clear disjoint boundaries
- parallelismScore = (files × avgLines × 3 / 800) × independenceFactor
  - spawn ≥2.0 | maybe 1.0-2.0 | skip <1.0 (degrade to /wf)

## Companion Docs

- [subagents.md](subagents.md) — agent roster, controller role, efficiency ladder
- [dispatch.md](dispatch.md) — handoff format, File claim, Concurrency group fields
- [agent-workflow.md](agent-workflow.md) — build/test/review loop, cohesion rule, completion gate

## Organization Model

```
CEO(1) ──┬── Manager₁(span) ──┬── Worker₁..ₙ
         │                     └── Sub-Manager(span) → Worker₁..ₙ  [depth ≥3]
         └── Manager₂(span) ── Worker₁..ₙ
```

- CEO: intent, scope, integration, final verification. Direct reports 3-5 Managers. **CEO never writes code directly** — dispatch Workers for all file changes. CEO only synthesizes results and decides next waves.
- Manager: domain partition → parallel dispatch → synthesize → report. Serial across domains; parallel within domain. **Manager agents must be defined by the project** (not shipped by the harness) — create them under `.claude/agents/` with the `Agent` tool enabled for nested spawning.
- Worker: single file per write Worker (implementer, one file_claim). Single dimension/topic per read Worker (reviewer, researcher). File claims must be file-level disjoint. Topic-level splitting within a single file is only allowed for read-only Workers.
- depth ≥3: Manager spawns Sub-Manager (span ≤7) instead of Worker. Recursive until leaf condition met.

## Span Formula

```
span = min(ceil(sqrt(files)), domain_cap)
  Architecture:    cap = 3
  Implementation:  cap = 5-7
  Review:          cap = 7-10
  Research:        cap = 10-12
```

## Total Agents (recursive, scales to 1000)

```
total(depth, span) = Σ span^L for L=0..depth
```

- depth=0: CEO + Workers only (XS)
- depth=1: CEO + Managers + Workers
- depth=2: CEO + Managers + Workers
- depth≥3: CEO + Managers + Sub-Managers + Workers (recursive)
- no hard agent cap; recursion governed by leaf condition + overhead filter

## Sizing Table

| Scale | Files   | Depth | CEO | Mgrs | Workers | Total |
|-------|---------|-------|-----|------|---------|-------|
| XS    | 1-4     | 0     | 1   | 0    | 1-3     | 2-4   |
| S     | 5-12    | 1     | 1   | 2    | 6       | 9     |
| M     | 13-30   | 1     | 1   | 3    | 15      | 19    |
| L     | 31-60   | 2     | 1   | 5    | 35      | 41    |
| XL    | 61-200  | 2     | 1   | 7    | 49      | 57    |
| XXL   | 201-500 | 3     | 1   | 7    | 343     | 351   |
| XXXL  | 501-1000| 3     | 1   | 7    | 686     | 694   |

- depth≥3: Managers spawn Sub-Managers (span≤7). No mixed Worker+Sub-Manager dispatch in same wave.

## Leaf Condition (stop splitting)

- files ≤ span×2
- OR avgLines < 50
- OR overhead > 0.30 (degrade to /wf)

## Manager Types (4)

| Type          | Trigger                       | Span | Worker Roles                                                  |
|---------------|-------------------------------|------|---------------------------------------------------------------|
| Architect-Mgr | cross-file interfaces, new ports | 3  | boundary-researcher, interface-designer, data-flow-mapper     |
| Implement-Mgr | write-set defined             | 5-7  | implementer₁..ₙ (1 file_claim each)                           |
| Review-Mgr    | implementation wave complete  | 3-4  | reviewer-spec, reviewer-code, reviewer-security               |
| Explore-Mgr   | L+ project, uncertain scope   | 5-10 | researcher₁..ₙ, domain-explorer₁..ₙ                           |

## Manager Synthesis Protocol

```
1. COLLECT      → await all Worker returns
2. DEDUPLICATE  → dedupe, merge overlap
3. CONFLICT     → flag contradictions (file_claim overlap, interface mismatch); no silent resolve
4. SYNTHESIZE   → single integrated artifact
5. REPORT       → CEO-actionable synthesis + raw Worker returns (audit)
```

- Worker failure: retry 1× → on 2nd failure, Manager absorbs or escalates to CEO for replan.

## Wave Orchestration

```
W0:  Explore-Mgr    → N parallel researchers → synthesize → CEO
W1:  Architect-Mgr  → 3 parallel → boundary decisions + interface contract → CEO approval
W2:  Implement-Mgr  → write-set coloring → wave dispatch: N parallel implementers (disjoint file_claims) → merge → CEO
W2R: Review-Mgr     → 3-4 parallel reviewers → dedupe + severity → CEO assigns fixes
W3+: Dependent implementation waves (repeat W2 pattern)
INTEGRATION: CEO → verifier → fail → debugger → loop (cap=3)
CLOSEOUT:   CEO → context-master + memory-master (direct, no Manager)
```

- Wave scheduling: Managers serial across domains, Workers parallel within domain.
- CEO validates wave output before starting next wave. No pipelining.

## Overhead & Cost Filter

```
overhead(depth) = 0.10 (depth≤2) | 0.20 (depth=3) | 0.35 (depth≥4)
```

- overhead > 0.30 → degrade to /wf
- independenceFactor: 1.0 (no deps) | 0.3-0.7 (shared imports)

## When NOT to use /wf-max

- files < 5 → use /wf
- all changes share single interface → serial dependency
- import/re-export refactor → global consistency required
- communication overhead > 30% → degrade

## /wf vs /wf-max

| Dimension        | /wf              | /wf-max                          |
|------------------|------------------|----------------------------------|
| Organization     | flat             | CEO → Mgr → Worker (3-tier)      |
| Exploration      | 3-5 serial       | Mgr → 10 parallel                |
| Implementation   | 1 serial         | Mgr → N parallel (span 5-7)      |
| Review           | 1-2 serial gate  | Mgr → 3-4 parallel dimensions    |
| Span formula     | none             | sqrt(files) + domain cap         |
| Recursive depth  | 0                | 1-3 (scales to 1000 agents)      |
| Context threshold| ~85%             | ~70%                             |
| Granularity floor| none             | <50 lines → no split             |
