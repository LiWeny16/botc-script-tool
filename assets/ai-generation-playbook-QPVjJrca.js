var e=`# AI Generation Playbook

Use this workflow when asking an AI to generate or review an original Blood on the Clocktower script.

Sources: local role data, local jinx data, official script guidance.

## 1. Define the Brief

Ask for:

- Target group: beginner, intermediate, advanced, experimental.
- Target style: information puzzle, social pressure, death-heavy, madness-heavy, bluff-heavy, resurrection-heavy.
- Player count range.
- Allowed character pool.
- Required or banned characters.
- Desired complexity ceiling.

## 2. Build a Candidate

Default to a normal structure:

- 13 Townsfolk
- 4 Outsiders
- 4 Minions
- 4 Demons

For smaller games, use a Teensyville-specific process instead of shrinking a normal script blindly.

## 3. Tag Mechanics

For each selected character, assign mechanics tags from [mechanics-ontology.md](./mechanics-ontology.md).

Then compute rough counts:

- reliable information
- false information sources
- poisoning/drunkenness sources
- death sources
- protection/revival sources
- setup modifiers
- registration effects
- madness/social constraint effects
- character/alignment change effects

## 4. Check Script Health

Ask these questions:

- Can good form a coherent world view by day 3?
- Can evil plausibly bluff at least three Townsfolk/Outsider roles?
- Does the script create more than one possible evil strategy?
- Are there enough reasons for players to talk privately?
- Are there enough public pressure points for nominations?
- Does any role become useless because another role dominates the same space?
- Does any pair create a known jinx or non-obvious interaction?

## 5. Run Jinx and Data Validation

Use local data:

- Character IDs and abilities: \`src/data/sources/roles.json\`
- Jinx data: \`src/data/sources/jinxEn.json\`, \`src/data/sources/jinxZh.json\`
- Canonical dictionary builder: \`src/data/canonicalCharacters.ts\`

Validation should fail if:

- A character ID is unknown.
- A standard script has too many or too few roles in a type.
- Required jinx notes are omitted.
- A setup-modifying role is not reflected in script notes.
- A generated role is not clearly marked as homebrew.

## 6. Ask for a Second-Pass Review

Use a separate AI pass or prompt section:

> Review this script as a skeptical Storyteller. Find balance risks, jinxes, unfun interactions, beginner traps, and places where evil has no plausible bluff. Do not redesign yet; list issues first.

Then ask for a revision only after issues are listed.

## 7. Produce Final Artifacts

The final output should include:

- Human-readable script notes.
- Character IDs grouped by type.
- JSON compatible with this app or the official script schema when possible.
- Required Fabled and jinx notes.
- Playtest checklist.

## Prompt Template

\`\`\`text
You are helping design an unofficial Blood on the Clocktower script.
Use the local BOTC knowledge base as background.
Do not claim official status.
Use local role IDs where possible.
Check jinxes and setup effects.

Brief:
- Audience:
- Style:
- Player count:
- Required characters:
- Banned characters:
- Complexity ceiling:

Return:
1. Design thesis
2. Character list grouped by type
3. Key interactions
4. Jinx/setup notes
5. Balance risks
6. Suggested playtest adjustments
\`\`\`

`;export{e as default};