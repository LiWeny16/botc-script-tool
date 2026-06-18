var e=`# BOTC Knowledge Base\r
\r
This is a personal, source-linked knowledge base for helping AI reason about Blood on the Clocktower script design.\r
\r
It is intentionally not a scraped copy of the official wiki. The goal is to keep a compact rules ontology, design heuristics, and pointers to authoritative sources and local structured data.\r
\r
## Use Cases\r
\r
- Give an AI enough baseline context to design original scripts.\r
- Evaluate whether a proposed script has enough information, misinformation, bluff space, and evil pressure.\r
- Convert AI output into data that can be checked against the app's local character and jinx datasets.\r
- Preserve source links so generated reasoning can be audited.\r
\r
## Reading Order\r
\r
1. [sources.md](./sources.md) - Source policy, attribution, and legal boundaries.\r
2. [core-rules.md](./core-rules.md) - Minimal game model the AI should know.\r
3. [mechanics-ontology.md](./mechanics-ontology.md) - Terms and tags for classifying roles and interactions.\r
4. [script-design.md](./script-design.md) - Script construction and balance heuristics.\r
5. [ai-generation-playbook.md](./ai-generation-playbook.md) - Recommended generation/review workflow.\r
6. [data-contract.md](./data-contract.md) - How this wiki maps to local repo data.\r
\r
## Non-Goals\r
\r
- Do not mirror official character pages or official rulebooks.\r
- Do not use official art, token images, or long copied text inside the knowledge base.\r
- Do not present generated scripts, homebrew rules, or AI rulings as official.\r
\r
## Recommended AI Instruction\r
\r
When using this knowledge base, instruct the AI to:\r
\r
1. Treat Storyteller judgment as part of the game, not as an error to eliminate.\r
2. Prefer source-linked summaries over unsourced certainty.\r
3. Generate scripts as proposals that require human playtesting.\r
4. Check local character metadata and jinx data before finalizing a script.\r
5. Clearly label any homebrew or inferred design rule as unofficial.\r
\r
`;export{e as default};