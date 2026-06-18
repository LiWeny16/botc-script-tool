var e=`# Script Design Heuristics\r
\r
Sources: \`tpi-script-wiki\`, \`tpi-scripts-page\`, local role and jinx data.\r
\r
## Script as a Promise\r
\r
A script is not just a list of roles. It is a promise about the kind of puzzle players are entering:\r
\r
- What information can be trusted?\r
- What lies are mechanically plausible?\r
- What deaths are expected?\r
- What bluffs can evil sustain?\r
- What does the Storyteller need to track?\r
\r
AI-generated scripts should state this promise explicitly.\r
\r
## Standard Structure\r
\r
For a normal Ravenswood Bluff style script, use this as the default shape:\r
\r
- 13 Townsfolk\r
- 4 Outsiders\r
- 4 Minions\r
- 4 Demons\r
\r
Other formats:\r
\r
- Teensyville: smaller scripts for small player counts.\r
- Phobos: broad or unrestricted scripts; high complexity and usually not ideal for generated recommendations.\r
\r
## Balance Axes\r
\r
Evaluate scripts across these axes:\r
\r
| Axis | Good Failure Mode | Evil Failure Mode |\r
| --- | --- | --- |\r
| Information | Too much false/noisy data makes solving arbitrary. | Too much clean data exposes evil quickly. |\r
| Death Tempo | Too many deaths remove discussion and agency. | Too few deaths give good too much time. |\r
| Bluff Space | Evil cannot claim safely. | Good cannot distinguish any claim. |\r
| Outsider Pressure | Outsiders feel random or punitive. | Outsiders do not matter. |\r
| Setup Uncertainty | Setup feels impossible to infer. | Setup becomes solved too early. |\r
| Storyteller Load | Too many discretionary interactions. | Script becomes flat or automatic. |\r
\r
## Information Economy\r
\r
A healthy script usually needs:\r
\r
- Several sources of true or mostly reliable information.\r
- Several ways for that information to be wrong.\r
- Reasons for players to compare claims.\r
- At least one path for good to recover from poisoned or false data.\r
- At least one path for evil to survive early information roles.\r
\r
Avoid scripts where every core information role is vulnerable to the same misinformation source. That creates one-note uncertainty.\r
\r
## Evil Bluffing\r
\r
Evil needs plausible claims. Check:\r
\r
- Are there good roles that can remain hidden for multiple days?\r
- Are there roles with subjective, private, or delayed information?\r
- Are Demon bluffs protected by Outsider count uncertainty, registration, or social pressure?\r
- Can Minions coordinate without instantly revealing the Demon?\r
\r
Scripts with many hard-confirming Townsfolk need stronger evil disruption.\r
\r
## Death and Tempo\r
\r
Death tempo shapes how long the puzzle lasts:\r
\r
- Normal Demon tempo supports classic deduction.\r
- Extra-death roles need compensating protection, revival, or strong good info.\r
- Death-prevention roles need enough pressure so the game does not stall.\r
- Execution traps should be legible enough that players can reason about them.\r
\r
## Complexity Budget\r
\r
Track three complexity budgets:\r
\r
- Player complexity: how hard claims, information, and win conditions are to understand.\r
- Storyteller complexity: how many hidden states, timing windows, and rulings are needed.\r
- Interaction complexity: how often role pairs require jinx or non-obvious handling.\r
\r
For beginner or public scripts, avoid combining high-complexity mechanics such as character change, alignment change, madness, and alternate win conditions in the same script.\r
\r
## Jinx Review\r
\r
Before finalizing a script:\r
\r
1. Collect all selected character IDs.\r
2. Query local jinx data for every pair.\r
3. Add required Fabled, usually Djinn, when official jinxes apply.\r
4. Include jinx text in the generated script notes.\r
5. Mark unresolved interactions for human Storyteller review.\r
\r
Local files:\r
\r
- \`src/data/sources/jinxEn.json\`\r
- \`src/data/sources/jinxZh.json\`\r
\r
## Output Requirements for AI Scripts\r
\r
Every generated script proposal should include:\r
\r
- Script name and design thesis.\r
- Character list grouped by type.\r
- Expected player complexity and Storyteller complexity.\r
- Key interactions.\r
- Risks and mitigation.\r
- Required Fabled or jinx notes.\r
- Suggested first playtest player count.\r
- Source-linked assumptions.\r
\r
`;export{e as default};