# BOTC Knowledge Base

This is a personal, source-linked knowledge base for helping AI reason about Blood on the Clocktower script design.

It is intentionally not a scraped copy of the official wiki. The goal is to keep a compact rules ontology, design heuristics, and pointers to authoritative sources and local structured data.

## Use Cases

- Give an AI enough baseline context to design original scripts.
- Evaluate whether a proposed script has enough information, misinformation, bluff space, and evil pressure.
- Convert AI output into data that can be checked against the app's local character and jinx datasets.
- Preserve source links so generated reasoning can be audited.

## Reading Order

1. [sources.md](./sources.md) - Source policy, attribution, and legal boundaries.
2. [core-rules.md](./core-rules.md) - Minimal game model the AI should know.
3. [mechanics-ontology.md](./mechanics-ontology.md) - Terms and tags for classifying roles and interactions.
4. [script-design.md](./script-design.md) - Script construction and balance heuristics.
5. [ai-generation-playbook.md](./ai-generation-playbook.md) - Recommended generation/review workflow.
6. [data-contract.md](./data-contract.md) - How this wiki maps to local repo data.

## Non-Goals

- Do not mirror official character pages or official rulebooks.
- Do not use official art, token images, or long copied text inside the knowledge base.
- Do not present generated scripts, homebrew rules, or AI rulings as official.

## Recommended AI Instruction

When using this knowledge base, instruct the AI to:

1. Treat Storyteller judgment as part of the game, not as an error to eliminate.
2. Prefer source-linked summaries over unsourced certainty.
3. Generate scripts as proposals that require human playtesting.
4. Check local character metadata and jinx data before finalizing a script.
5. Clearly label any homebrew or inferred design rule as unofficial.

