# Mechanics Ontology

Use these tags to classify characters and interactions for script generation and review.

Sources: local role data, local jinx data, official script guidance.

## Core State Tags

| Tag | Meaning | Design Impact |
| --- | --- | --- |
| `death` | Causes, prevents, delays, or reacts to death. | Affects tempo and final-three pressure. |
| `execution` | Triggers on nomination, voting, or execution. | Shapes day play and public incentives. |
| `drunk` | Good or evil ability is disabled unknowingly. | Adds misinformation without direct lies. |
| `poisoned` | Ability is disabled by another character. | Enables targeted misinformation. |
| `false_info` | Character can receive false information. | Needs enough truth anchors to stay solvable. |
| `registration` | Character may register as another alignment/type/character. | Enables bluffing and corrupts detection roles. |
| `alignment_change` | Player alignment may change. | High complexity; can destabilize win incentives. |
| `character_change` | Player character may change. | High complexity; requires jinx and night-order checks. |
| `madness` | Player is rewarded or punished for claims. | Adds social constraint; needs clear Storyteller handling. |
| `extra_evil` | Adds evil players or evil advantage. | Requires compensating good power or Fabled support. |
| `outsider_modification` | Changes Outsider count. | Supports bluff space and setup uncertainty. |
| `demon_bluff` | Alters Demon bluff knowledge. | Strongly affects evil team's ability to survive. |
| `public_claim` | Requires or encourages public declaration. | Good for loud scripts and social puzzles. |
| `private_info` | Gives targeted hidden information. | Core solving resource. |
| `global_info` | Gives information about the whole town or broad game state. | Strong, often needs misinformation pressure. |
| `st_choice` | Storyteller chooses result or target. | Flexible but increases Storyteller burden. |

## Team Function Tags

### Townsfolk Functions

- `washerwoman_like`: learns one of two players is a specific good character.
- `alignment_detector`: learns information about good/evil alignment.
- `character_detector`: learns information about exact or possible characters.
- `death_protection`: prevents or changes death.
- `execution_control`: changes nomination, voting, or execution outcomes.
- `once_per_game_power`: creates a timing puzzle.
- `post_death_info`: rewards night deaths or executions.
- `social_coordination`: encourages specific conversations or claims.

### Outsider Functions

- `misregistration`: corrupts detection.
- `hidden_liability`: creates unknown harm.
- `execution_liability`: makes execution dangerous.
- `evil_tool`: gives evil plausible cover or mechanical advantage.
- `outsider_as_puzzle`: gives good a solvable but costly task.

### Minion Functions

- `poisoning`: disables information or protection.
- `extra_death`: adds kill pressure.
- `claim_pressure`: punishes claims or forces madness.
- `setup_distortion`: changes starting assumptions.
- `hidden_information`: learns grimoire, character, or alignment info.
- `execution_trap`: makes executing or nominating dangerous.

### Demon Functions

- `single_kill`: normal one-kill Demon tempo.
- `multi_kill`: can kill multiple players.
- `delayed_death`: death happens later or is obscured.
- `misinformation_aura`: passively poisons or corrupts information.
- `demon_jump`: Demon can move or be replaced.
- `alternate_endgame`: changes endgame logic.

## Interaction Risk Levels

Use these labels when reviewing generated scripts:

- `low`: Familiar interaction; no special review needed.
- `medium`: Needs Storyteller awareness but likely playable.
- `high`: Can break information economy, win condition, or player agency.
- `requires_jinx`: Check official/local jinx data before recommending.
- `avoid_for_new_players`: Playable, but too complex for beginner scripts.

