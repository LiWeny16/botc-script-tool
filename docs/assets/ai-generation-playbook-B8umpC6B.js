var e=`# AI Generation Playbook\r
\r
Use this workflow when asking an AI to generate or review an original Blood on the Clocktower script.\r
\r
Sources: local role data, local jinx data, official script guidance.\r
\r
## 1. Define the Brief\r
\r
Ask for:\r
\r
- Target group: beginner, intermediate, advanced, experimental.\r
- Target style: information puzzle, social pressure, death-heavy, madness-heavy, bluff-heavy, resurrection-heavy.\r
- Player count range.\r
- Allowed character pool.\r
- Required or banned characters.\r
- Desired complexity ceiling.\r
\r
## 2. Build a Candidate\r
\r
Default to a normal structure:\r
\r
- 13 Townsfolk\r
- 4 Outsiders\r
- 4 Minions\r
- 4 Demons\r
\r
For smaller games, use a Teensyville-specific process instead of shrinking a normal script blindly.\r
\r
## 3. Tag Mechanics\r
\r
For each selected character, assign mechanics tags from [mechanics-ontology.md](./mechanics-ontology.md).\r
\r
Then compute rough counts:\r
\r
- reliable information\r
- false information sources\r
- poisoning/drunkenness sources\r
- death sources\r
- protection/revival sources\r
- setup modifiers\r
- registration effects\r
- madness/social constraint effects\r
- character/alignment change effects\r
\r
## 4. Check Script Health\r
\r
Ask these questions:\r
\r
- Can good form a coherent world view by day 3?\r
- Can evil plausibly bluff at least three Townsfolk/Outsider roles?\r
- Does the script create more than one possible evil strategy?\r
- Are there enough reasons for players to talk privately?\r
- Are there enough public pressure points for nominations?\r
- Does any role become useless because another role dominates the same space?\r
- Does any pair create a known jinx or non-obvious interaction?\r
\r
## 5. Run Jinx and Data Validation\r
\r
Use local data:\r
\r
- Character IDs and abilities: \`src/data/sources/roles.json\`\r
- Jinx data: \`src/data/sources/jinxEn.json\`, \`src/data/sources/jinxZh.json\`\r
- Canonical dictionary builder: \`src/data/canonicalCharacters.ts\`\r
\r
Validation should fail if:\r
\r
- A character ID is unknown.\r
- A standard script has too many or too few roles in a type.\r
- Required jinx notes are omitted.\r
- A setup-modifying role is not reflected in script notes.\r
- A generated role is not clearly marked as homebrew.\r
\r
## 6. Ask for a Second-Pass Review\r
\r
Use a separate AI pass or prompt section:\r
\r
> Review this script as a skeptical Storyteller. Find balance risks, jinxes, unfun interactions, beginner traps, and places where evil has no plausible bluff. Do not redesign yet; list issues first.\r
\r
Then ask for a revision only after issues are listed.\r
\r
## 7. Produce Final Artifacts\r
\r
The final output should include:\r
\r
- Human-readable script notes.\r
- Character IDs grouped by type.\r
- JSON compatible with this app or the official script schema when possible.\r
- Required Fabled and jinx notes.\r
- Playtest checklist.\r
\r
## Prompt Template\r
\r
\`\`\`text\r
You are helping design an unofficial Blood on the Clocktower script.\r
Use the local BOTC knowledge base as background.\r
Do not claim official status.\r
Use local role IDs where possible.\r
Check jinxes and setup effects.\r
\r
Brief:\r
- Audience:\r
- Style:\r
- Player count:\r
- Required characters:\r
- Banned characters:\r
- Complexity ceiling:\r
\r
Return:\r
1. Design thesis\r
2. Character list grouped by type\r
3. Key interactions\r
4. Jinx/setup notes\r
5. Balance risks\r
6. Suggested playtest adjustments\r
\`\`\`\r
\r
`;export{e as default};