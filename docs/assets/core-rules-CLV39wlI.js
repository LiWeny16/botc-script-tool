var e=`# Core Rules Model\r
\r
This file gives an AI the minimum conceptual model needed to reason about Blood on the Clocktower scripts.\r
\r
Sources: \`tpi-script-wiki\`, \`tpi-scripts-page\`, local role and jinx data.\r
\r
## Game Roles\r
\r
Blood on the Clocktower is a hidden-role social deduction game run by a Storyteller. Players receive characters from a selected script. A script defines what characters might be in play and what players can plausibly bluff.\r
\r
The main character types are:\r
\r
- Townsfolk: good characters that usually create information, protection, coordination, or win-condition pressure.\r
- Outsiders: good characters whose abilities usually harm the good team, confuse information, or create execution risk.\r
- Minions: evil characters that support the Demon through misinformation, disruption, extra deaths, voting pressure, or hidden setup effects.\r
- Demons: evil characters that normally kill and define the primary evil win condition.\r
- Travellers: optional characters for players joining late or leaving early.\r
- Fabled: optional rule-modifying characters used by the Storyteller to support balance, accessibility, or unusual script needs.\r
\r
## Core Loop\r
\r
The game alternates between night and day:\r
\r
- Night: characters wake in a defined order. Some receive information, choose targets, modify states, or cause deaths.\r
- Day: players talk publicly and privately, nominate, vote, and may execute one player.\r
- Death: dead players generally remain in the game socially, but lose most mechanical impact except for a limited voting resource and abilities that explicitly work after death.\r
\r
## Win Conditions\r
\r
The good team usually wins if the Demon is executed. The evil team usually wins if only two players remain alive. Some characters can alter or override these defaults.\r
\r
AI script design should treat win-condition-changing characters as high-risk components because they alter player incentives and can create non-obvious endings.\r
\r
## Storyteller Authority\r
\r
The Storyteller is not just a rules executor. They manage hidden information, resolve ambiguous interactions, and choose outcomes for abilities that explicitly give them discretion.\r
\r
For AI reasoning:\r
\r
- Do not assume every interaction has a deterministic answer.\r
- If a character says something might happen, the Storyteller may decide based on game health.\r
- If two abilities conflict, prefer official jinxes first, then known rulings, then a clearly labeled Storyteller ruling.\r
\r
## Information Integrity\r
\r
Information can be true, false, arbitrary, or Storyteller-selected depending on the character and state.\r
\r
Important concepts:\r
\r
- Drunk/poisoned characters have no ability but do not know this.\r
- A player may register as a different alignment or character type.\r
- Some characters receive false information by design.\r
- Some characters learn information only at setup, only once, each night, each day, or after death.\r
\r
Script design must balance reliable information against misinformation. Too much reliable information makes evil collapse; too much misinformation makes good unable to reason.\r
\r
## Setup Effects\r
\r
Some abilities alter the bag or setup:\r
\r
- Add or remove Outsiders.\r
- Add evil characters or change alignments.\r
- Modify Demon bluffs.\r
- Force specific character presence or absence.\r
\r
AI must account for setup effects before evaluating script balance.\r
\r
## Night Order\r
\r
Night order is part of role logic. A script generator should use local structured data rather than inventing order:\r
\r
- \`firstNight\` and \`firstNightReminder\` in \`src/data/sources/roles.json\`\r
- \`otherNight\` and \`otherNightReminder\` in \`src/data/sources/roles.json\`\r
\r
Characters with \`firstNight\` or \`otherNight\` equal to \`0\` do not act in that phase unless custom script data says otherwise.\r
\r
`;export{e as default};