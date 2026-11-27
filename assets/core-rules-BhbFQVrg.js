var e=`# Core Rules Model

This file gives an AI the minimum conceptual model needed to reason about Blood on the Clocktower scripts.

Sources: \`tpi-script-wiki\`, \`tpi-scripts-page\`, local role and jinx data.

## Game Roles

Blood on the Clocktower is a hidden-role social deduction game run by a Storyteller. Players receive characters from a selected script. A script defines what characters might be in play and what players can plausibly bluff.

The main character types are:

- Townsfolk: good characters that usually create information, protection, coordination, or win-condition pressure.
- Outsiders: good characters whose abilities usually harm the good team, confuse information, or create execution risk.
- Minions: evil characters that support the Demon through misinformation, disruption, extra deaths, voting pressure, or hidden setup effects.
- Demons: evil characters that normally kill and define the primary evil win condition.
- Travellers: optional characters for players joining late or leaving early.
- Fabled: optional rule-modifying characters used by the Storyteller to support balance, accessibility, or unusual script needs.

## Core Loop

The game alternates between night and day:

- Night: characters wake in a defined order. Some receive information, choose targets, modify states, or cause deaths.
- Day: players talk publicly and privately, nominate, vote, and may execute one player.
- Death: dead players generally remain in the game socially, but lose most mechanical impact except for a limited voting resource and abilities that explicitly work after death.

## Win Conditions

The good team usually wins if the Demon is executed. The evil team usually wins if only two players remain alive. Some characters can alter or override these defaults.

AI script design should treat win-condition-changing characters as high-risk components because they alter player incentives and can create non-obvious endings.

## Storyteller Authority

The Storyteller is not just a rules executor. They manage hidden information, resolve ambiguous interactions, and choose outcomes for abilities that explicitly give them discretion.

For AI reasoning:

- Do not assume every interaction has a deterministic answer.
- If a character says something might happen, the Storyteller may decide based on game health.
- If two abilities conflict, prefer official jinxes first, then known rulings, then a clearly labeled Storyteller ruling.

## Information Integrity

Information can be true, false, arbitrary, or Storyteller-selected depending on the character and state.

Important concepts:

- Drunk/poisoned characters have no ability but do not know this.
- A player may register as a different alignment or character type.
- Some characters receive false information by design.
- Some characters learn information only at setup, only once, each night, each day, or after death.

Script design must balance reliable information against misinformation. Too much reliable information makes evil collapse; too much misinformation makes good unable to reason.

## Setup Effects

Some abilities alter the bag or setup:

- Add or remove Outsiders.
- Add evil characters or change alignments.
- Modify Demon bluffs.
- Force specific character presence or absence.

AI must account for setup effects before evaluating script balance.

## Night Order

Night order is part of role logic. A script generator should use local structured data rather than inventing order:

- \`firstNight\` and \`firstNightReminder\` in \`src/data/sources/roles.json\`
- \`otherNight\` and \`otherNightReminder\` in \`src/data/sources/roles.json\`

Characters with \`firstNight\` or \`otherNight\` equal to \`0\` do not act in that phase unless custom script data says otherwise.

`;export{e as default};