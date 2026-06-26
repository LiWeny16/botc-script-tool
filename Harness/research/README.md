# Research Protocol

Purpose: guide agent research. Record conclusions in [research-results.md](research-results.md); do not put raw search notes there.

## When To Research

Use this before PRD, stack choice, external API use, public dependency choice, pricing/legal/security assumptions, or any fact likely to change.

Skip only when the task is local, narrow, and fully answerable from existing project files. Record the skip reason in `Harness/PLAN.md`.

## Research Agent

Spawn a Research Agent, or emulate one in a bounded pass, when any are true:

- more than two external sources are needed
- the answer depends on current docs, releases, pricing, policy, or community practice
- a framework, API, architecture, or dependency choice affects implementation

Built-in agents:

- `.claude/agents/researcher.md`: product, market, open-source, dependency, pricing, policy, and ecosystem research.
- `.claude/agents/docs-researcher.md`: official docs, API, SDK, config, limits, errors, and examples verification.

For multi-agent research plus build work, create the dispatch table in `Harness/PLAN.md` and follow `Harness/dispatch.md`.

Research Agent input:

- question
- decision needed
- source boundaries
- allowed tools
- output format

Research Agent output:

- searched queries and tools used
- source list with links and source type
- adopted / rejected / watch decisions
- risks, unknowns, and follow-up questions
- patch-ready updates for [research-results.md](research-results.md)

## Tool Order

1. Local first: inspect this repo, existing docs, lockfiles, tests, and package metadata.
2. GitHub / open source: prefer official repos, docs folders, examples, issues with maintainer answers, releases, and active forks.
3. Tavily: use when configured for broad web search or source discovery.
4. TinyFish: use when configured for rendered pages, dynamic sites, browser workflows, or structured extraction.
5. Built-in web search: free fallback when no external research tool is configured; expect less structure and verify more carefully.
6. Ask the user for sources when network or tool access is unavailable.

Do not require paid tools. If Tavily or TinyFish is unavailable, use the fallback and record the limitation.

## Optional Tool Setup

Tavily:

```text
# Optional: requires a Tavily API key or configured CLI/tool.
tvly search "query" --depth advanced --max-results 10 --json
tvly search "query" --include-domains github.com,docs.github.com --json
```

TinyFish:

```bash
# Optional: requires TINYFISH_API_KEY or tinyfish auth login.
npm install -g @tiny-fish/cli
tinyfish auth login
tinyfish agent run --url "https://example.com" "Extract product data. Return JSON."
```

GitHub CLI:

```bash
gh search repos "topic keywords" --archived=false --json fullName,url,description,stargazersCount,pushedAt
gh search code "symbol or config" --repo owner/name
```

Fallback web search examples:

```text
site:github.com <framework> starter template
site:github.com <library> examples
site:docs.<vendor>.com <api> limits errors
<product category> alternatives pricing docs
```

## Source Rules

- Prefer primary sources: official docs, official GitHub repos, standards, papers, release notes.
- Use community sources for pitfalls and adoption signals only; label them as community evidence.
- Check dates for unstable facts.
- Compare at least three sources, or record why fewer are enough.
- Do not copy large source text. Summarize the decision-relevant facts.

## Requirement Quality

Use these patterns when turning research into PRD or feature docs:

- PRD: why, target user, MVP, non-goals, success measures, acceptance criteria.
- EARS: `When <trigger>, the <system> shall <response>` for precise requirements.
- Gherkin: `Given / When / Then` for testable behavior scenarios.
- Spec-first: requirements before plan, plan before tasks, tasks before implementation.

## Write Target

- Research process, queries, and limitations: this file or `Harness/PLAN.md`.
- Final research decisions: [research-results.md](research-results.md).
- Product scope: [PRD.md](PRD.md).
- Architecture consequences: `Harness/architecture.md` and `Harness/domain/ports.md`.

## Architecture Decision References

When filling `Harness/architecture.md`, `Harness/domain/ports.md`, and `Harness/research/research-results.md`, use these high-trust sources as starting points. Search within them; do not read them whole.

### System Design & Architecture Patterns

| Source | Stars | What To Use It For |
|--------|-------|--------------------|
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | 266k+ | System design fundamentals, trade-off frameworks, scalability patterns |
| [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101) | 65k+ | Visual system design concepts, communication protocols, database patterns |
| [DovAmir/awesome-design-patterns](https://github.com/DovAmir/awesome-design-patterns) | 47k+ | Curated design patterns: general arch, cloud, serverless, microservices, front-end, security |
| [mehdihadeli/awesome-software-architecture](https://github.com/mehdihadeli/awesome-software-architecture) | high | Design patterns deep-dive: CQRS, Outbox, Saga, Circuit Breaker, BFF, scaling, caching |
| [ashishps1/awesome-system-design-resources](https://github.com/ashishps1/awesome-system-design-resources) | 30k+ | System design interview prep: networking, API design, database, caching, distributed systems |

### Front-End Architecture

| Source | Stars | What To Use It For |
|--------|-------|--------------------|
| [greatfrontend/awesome-front-end-system-design](https://github.com/greatfrontend/awesome-front-end-system-design) | high | Front-end system design: news feed, e-commerce, chat, video streaming, SDUI |

### Architecture Decision Records (ADR)

| Source | Purpose |
|--------|---------|
| [adr.github.io](https://adr.github.io) | ADR overview, templates (MADR, Nygard, Y-Statement), tooling |
| [architecture-decision-record/architecture-decision-record](https://github.com/architecture-decision-record/architecture-decision-record) | Canonical ADR repo with git-based workflow |
| [adr/madr](https://github.com/adr/madr) | Markdown Architectural Decision Records template |

### Agent Skills (Stack-Specific)

> When the architecture stage reveals a specific stack, search for matching agent skills. Skills extend Claude Code / Codex with stack-aware patterns, testing conventions, and design rules.

| Source | Purpose |
|--------|---------|
| [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) | Curated Claude Skills directory |
| [Composio — Top Design Skills](https://composio.dev/content/top-design-skills) | UI/UX design skills for Claude Code and Codex |
| `npx skills search "<stack>"` | Built-in skill discovery (if available) |

Search patterns for agent skill discovery:

```text
site:github.com "claude code" OR codex skill <stack> architecture
site:github.com SKILL.md <framework> design patterns
site:npmjs.com "claude-code" OR "codex" skill <domain>
```

---

## Method References

- GitHub Spec Kit: spec-first phases and AI coding-agent workflow: https://github.github.com/spec-kit/
- Atlassian PRD guidance: goals, assumptions, user stories, out-of-scope, success criteria: https://www.atlassian.com/agile/requirements
- EARS: structured textual requirements: https://alistairmavin.com/ears/
- Cucumber Gherkin: `Given / When / Then` executable examples: https://cucumber.io/docs/gherkin/reference
- Tavily search docs: search depth, domain filters, max results, raw content: https://docs.tavily.com/documentation/api-reference/endpoint/search
- Tavily CLI docs: `tvly search`, crawl, map, extract: https://docs.tavily.com/documentation/tavily-cli
- TinyFish CLI docs: web search and browser-agent runs: https://docs.tinyfish.ai/cli
- GitHub CLI search docs: repository and code search from terminal: https://cli.github.com/manual/gh_search_repos
