var e=`# Data Contract\r
\r
This file describes how the knowledge base should connect to existing repo data.\r
\r
## Existing Structured Data\r
\r
### Characters\r
\r
Primary source:\r
\r
\`\`\`text\r
src/data/sources/roles.json\r
\`\`\`\r
\r
Useful fields:\r
\r
- \`id\`: canonical English character id.\r
- \`name\`: English character name.\r
- \`edition\`: source edition or category.\r
- \`team\`: character type.\r
- \`firstNight\`: first-night order, \`0\` means no first-night action.\r
- \`firstNightReminder\`: Storyteller reminder for first-night action.\r
- \`otherNight\`: other-night order, \`0\` means no other-night action.\r
- \`otherNightReminder\`: Storyteller reminder for other-night action.\r
- \`reminders\`: reminder tokens.\r
- \`remindersGlobal\`: global reminder tokens if present.\r
- \`setup\`: whether the character changes setup.\r
- \`ability\`: concise ability text.\r
\r
### Localized Character Dictionaries\r
\r
Primary builder:\r
\r
\`\`\`text\r
src/data/canonicalCharacters.ts\r
\`\`\`\r
\r
This combines:\r
\r
- English data from \`roles.json\`\r
- Chinese data from \`src/data/characters/characters.ts\`\r
- Spanish overrides from \`src/data/sources/rolesEs.json\`\r
- Extras from \`src/data/extras\`\r
\r
Use this path when app-facing behavior needs localized names or abilities.\r
\r
### Jinxes\r
\r
Primary sources:\r
\r
\`\`\`text\r
src/data/sources/jinxEn.json\r
src/data/sources/jinxZh.json\r
src/data/sources/jinxEs.json\r
\`\`\`\r
\r
Use jinxes as hard review inputs for generated scripts. A generated script should not silently include a jinxed pair without notes.\r
\r
## Knowledge Base Files\r
\r
The files under \`knowledge/botc/\` are not app runtime data. They are:\r
\r
- RAG/context input for AI agents.\r
- Human-maintained design notes.\r
- Source-linked summaries.\r
- Future basis for validation scripts.\r
\r
If app code needs this knowledge, add a generator script that produces a compact JSON artifact from these Markdown files rather than importing Markdown directly into UI code.\r
\r
## Suggested Future JSON Artifact\r
\r
If later needed, generate:\r
\r
\`\`\`text\r
knowledge/botc/generated/mechanics-index.json\r
\`\`\`\r
\r
Suggested shape:\r
\r
\`\`\`json\r
{\r
  "version": 1,\r
  "generatedAt": "ISO-8601",\r
  "tags": {\r
    "poisoned": {\r
      "description": "Ability disabled unknowingly by another character.",\r
      "risk": "medium"\r
    }\r
  },\r
  "characterTags": {\r
    "poisoner": ["poisoned", "false_info"],\r
    "recluse": ["registration", "false_info"]\r
  },\r
  "sources": ["local-roles", "local-jinx-en"]\r
}\r
\`\`\`\r
\r
Do not generate this by scraping official pages. Use local structured data plus human-maintained tags.\r
\r
`;export{e as default};