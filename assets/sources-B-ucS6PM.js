var e=`# Sources and Usage Policy

This repo should keep a small, auditable knowledge layer and avoid bulk copying official material.

## Primary Sources

| Source ID | Source | Use |
| --- | --- | --- |
| \`tpi-script-wiki\` | https://wiki.bloodontheclocktower.com/Script_Tool | Script creation concepts and official script tool workflow. |
| \`tpi-scripts-page\` | https://bloodontheclocktower.com/pages/script-and-wiki | Official description of scripts, base editions, custom scripts, and recommended scripts. |
| \`tpi-terms\` | https://bloodontheclocktower.com/pages/legal-terms-of-use | Legal and fan-use boundaries, especially digital tools and public distribution. |
| \`tpi-app-schema\` | https://github.com/ThePandemoniumInstitute/botc-release/blob/main/script-schema.json | JSON schema reference for scripts and custom characters supported by the official app ecosystem. |
| \`local-roles\` | \`src/data/sources/roles.json\` | Local structured role metadata: id, name, team, edition, ability, reminders, night order. |
| \`local-jinx-en\` | \`src/data/sources/jinxEn.json\` | Local structured jinx metadata. |
| \`local-jinx-zh\` | \`src/data/sources/jinxZh.json\` | Local Chinese jinx metadata. |

## Source Handling Rules

- Keep source URLs with every derived knowledge topic when practical.
- Store summaries, tags, and design interpretations rather than page copies.
- Do not scrape the official site or wiki as a bulk ingest job.
- Do not copy official visual assets into this knowledge base.
- Public-facing tools that include BotC characters, rules, images, or other IP may require permission from The Pandemonium Institute.
- Generated scripts and AI advice must be labeled unofficial unless they come from an official source.

## Local Data Boundary

This project already contains structured character and jinx data. Use those files for machine-readable lookups instead of re-crawling public pages:

- Character lookup: \`src/data/sources/roles.json\`
- English jinx lookup: \`src/data/sources/jinxEn.json\`
- Chinese jinx lookup: \`src/data/sources/jinxZh.json\`

This knowledge base is the reasoning layer around those files.

`;export{e as default};