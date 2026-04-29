# Script Design Heuristics

Sources: `tpi-script-wiki`, `tpi-scripts-page`, local role and jinx data.

## Script as a Promise

A script is not just a list of roles. It is a promise about the kind of puzzle players are entering:

- What information can be trusted?
- What lies are mechanically plausible?
- What deaths are expected?
- What bluffs can evil sustain?
- What does the Storyteller need to track?

AI-generated scripts should state this promise explicitly.

## Standard Structure

For a normal Ravenswood Bluff style script, use this as the default shape:

- 13 Townsfolk
- 4 Outsiders
- 4 Minions
- 4 Demons

Other formats:

- Teensyville: smaller scripts for small player counts.
- Phobos: broad or unrestricted scripts; high complexity and usually not ideal for generated recommendations.

## Balance Axes

Evaluate scripts across these axes:

| Axis | Good Failure Mode | Evil Failure Mode |
| --- | --- | --- |
| Information | Too much false/noisy data makes solving arbitrary. | Too much clean data exposes evil quickly. |
| Death Tempo | Too many deaths remove discussion and agency. | Too few deaths give good too much time. |
| Bluff Space | Evil cannot claim safely. | Good cannot distinguish any claim. |
| Outsider Pressure | Outsiders feel random or punitive. | Outsiders do not matter. |
| Setup Uncertainty | Setup feels impossible to infer. | Setup becomes solved too early. |
| Storyteller Load | Too many discretionary interactions. | Script becomes flat or automatic. |

## Information Economy

A healthy script usually needs:

- Several sources of true or mostly reliable information.
- Several ways for that information to be wrong.
- Reasons for players to compare claims.
- At least one path for good to recover from poisoned or false data.
- At least one path for evil to survive early information roles.

Avoid scripts where every core information role is vulnerable to the same misinformation source. That creates one-note uncertainty.

## Evil Bluffing

Evil needs plausible claims. Check:

- Are there good roles that can remain hidden for multiple days?
- Are there roles with subjective, private, or delayed information?
- Are Demon bluffs protected by Outsider count uncertainty, registration, or social pressure?
- Can Minions coordinate without instantly revealing the Demon?

Scripts with many hard-confirming Townsfolk need stronger evil disruption.

## Death and Tempo

Death tempo shapes how long the puzzle lasts:

- Normal Demon tempo supports classic deduction.
- Extra-death roles need compensating protection, revival, or strong good info.
- Death-prevention roles need enough pressure so the game does not stall.
- Execution traps should be legible enough that players can reason about them.

## Complexity Budget

Track three complexity budgets:

- Player complexity: how hard claims, information, and win conditions are to understand.
- Storyteller complexity: how many hidden states, timing windows, and rulings are needed.
- Interaction complexity: how often role pairs require jinx or non-obvious handling.

For beginner or public scripts, avoid combining high-complexity mechanics such as character change, alignment change, madness, and alternate win conditions in the same script.

## Jinx Review

Before finalizing a script:

1. Collect all selected character IDs.
2. Query local jinx data for every pair.
3. Add required Fabled, usually Djinn, when official jinxes apply.
4. Include jinx text in the generated script notes.
5. Mark unresolved interactions for human Storyteller review.

Local files:

- `src/data/sources/jinxEn.json`
- `src/data/sources/jinxZh.json`

## Output Requirements for AI Scripts

Every generated script proposal should include:

- Script name and design thesis.
- Character list grouped by type.
- Expected player complexity and Storyteller complexity.
- Key interactions.
- Risks and mitigation.
- Required Fabled or jinx notes.
- Suggested first playtest player count.
- Source-linked assumptions.

