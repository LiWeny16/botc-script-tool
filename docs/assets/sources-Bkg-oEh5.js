var e=`# Sources and Usage Policy\r
\r
This repo should keep a small, auditable knowledge layer and avoid bulk copying official material.\r
\r
## Primary Sources\r
\r
| Source ID | Source | Use |\r
| --- | --- | --- |\r
| \`tpi-script-wiki\` | https://wiki.bloodontheclocktower.com/Script_Tool | Script creation concepts and official script tool workflow. |\r
| \`tpi-scripts-page\` | https://bloodontheclocktower.com/pages/script-and-wiki | Official description of scripts, base editions, custom scripts, and recommended scripts. |\r
| \`tpi-terms\` | https://bloodontheclocktower.com/pages/legal-terms-of-use | Legal and fan-use boundaries, especially digital tools and public distribution. |\r
| \`tpi-app-schema\` | https://github.com/ThePandemoniumInstitute/botc-release/blob/main/script-schema.json | JSON schema reference for scripts and custom characters supported by the official app ecosystem. |\r
| \`local-roles\` | \`src/data/sources/roles.json\` | Local structured role metadata: id, name, team, edition, ability, reminders, night order. |\r
| \`local-jinx-en\` | \`src/data/sources/jinxEn.json\` | Local structured jinx metadata. |\r
| \`local-jinx-zh\` | \`src/data/sources/jinxZh.json\` | Local Chinese jinx metadata. |\r
\r
## Source Handling Rules\r
\r
- Keep source URLs with every derived knowledge topic when practical.\r
- Store summaries, tags, and design interpretations rather than page copies.\r
- Do not scrape the official site or wiki as a bulk ingest job.\r
- Do not copy official visual assets into this knowledge base.\r
- Public-facing tools that include BotC characters, rules, images, or other IP may require permission from The Pandemonium Institute.\r
- Generated scripts and AI advice must be labeled unofficial unless they come from an official source.\r
\r
## Local Data Boundary\r
\r
This project already contains structured character and jinx data. Use those files for machine-readable lookups instead of re-crawling public pages:\r
\r
- Character lookup: \`src/data/sources/roles.json\`\r
- English jinx lookup: \`src/data/sources/jinxEn.json\`\r
- Chinese jinx lookup: \`src/data/sources/jinxZh.json\`\r
\r
This knowledge base is the reasoning layer around those files.\r
\r
`;export{e as default};