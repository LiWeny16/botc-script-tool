var e=`# Data Contract

This file describes how the knowledge base should connect to existing repo data.

## Existing Structured Data

### Characters

Primary source:

\`\`\`text
src/data/sources/roles.json
\`\`\`

Useful fields:

- \`id\`: canonical English character id.
- \`name\`: English character name.
- \`edition\`: source edition or category.
- \`team\`: character type.
- \`firstNight\`: first-night order, \`0\` means no first-night action.
- \`firstNightReminder\`: Storyteller reminder for first-night action.
- \`otherNight\`: other-night order, \`0\` means no other-night action.
- \`otherNightReminder\`: Storyteller reminder for other-night action.
- \`reminders\`: reminder tokens.
- \`remindersGlobal\`: global reminder tokens if present.
- \`setup\`: whether the character changes setup.
- \`ability\`: concise ability text.

### Localized Character Dictionaries

Primary builder:

\`\`\`text
src/data/canonicalCharacters.ts
\`\`\`

This combines:

- English data from \`roles.json\`
- Chinese data from \`src/data/characters/characters.ts\`
- Spanish overrides from \`src/data/sources/rolesEs.json\`
- Extras from \`src/data/extras\`

Use this path when app-facing behavior needs localized names or abilities.

### Jinxes

Primary sources:

\`\`\`text
src/data/sources/jinxEn.json
src/data/sources/jinxZh.json
src/data/sources/jinxEs.json
\`\`\`

Use jinxes as hard review inputs for generated scripts. A generated script should not silently include a jinxed pair without notes.

## Knowledge Base Files

The files under \`knowledge/botc/\` are not app runtime data. They are:

- RAG/context input for AI agents.
- Human-maintained design notes.
- Source-linked summaries.
- Future basis for validation scripts.

If app code needs this knowledge, add a generator script that produces a compact JSON artifact from these Markdown files rather than importing Markdown directly into UI code.

## Suggested Future JSON Artifact

If later needed, generate:

\`\`\`text
knowledge/botc/generated/mechanics-index.json
\`\`\`

Suggested shape:

\`\`\`json
{
  "version": 1,
  "generatedAt": "ISO-8601",
  "tags": {
    "poisoned": {
      "description": "Ability disabled unknowingly by another character.",
      "risk": "medium"
    }
  },
  "characterTags": {
    "poisoner": ["poisoned", "false_info"],
    "recluse": ["registration", "false_info"]
  },
  "sources": ["local-roles", "local-jinx-en"]
}
\`\`\`

Do not generate this by scraping official pages. Use local structured data plus human-maintained tags.

`;export{e as default};