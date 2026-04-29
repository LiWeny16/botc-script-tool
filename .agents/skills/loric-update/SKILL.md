---
name: loric-update
description: Add or update Loric characters in the BotC script generator. Scrapes character data from Chinese and English wikis, then updates loric.ts and imagePathMap.ts.
---

# Loric Character Update

Adds new Loric characters to the BotC script generator by scraping wiki data and updating source files.

## When to Use

User requests adding Loric characters (奇遇角色), or asks to sync Loric data with the wiki.

## Data Sources

| Source | URL |
|--------|-----|
| Chinese wiki (all Loric) | `https://clocktower-wiki.gstonegames.com/index.php?title=%E5%A5%87%E9%81%87%E8%A7%92%E8%89%B2` |
| English wiki (all Loric) | `https://wiki.bloodontheclocktower.com/Loric` |
| Chinese char page | `https://clocktower-wiki.gstonegames.com/index.php?title={zh_name}` |
| English char page | `https://wiki.bloodontheclocktower.com/{En_Name}` (spaces = underscores) |

## Workflow

### Step 1: Fetch wiki pages and diff against existing

```bash
# Fetch both index pages
curl -s -L "https://wiki.bloodontheclocktower.com/Loric" -o /tmp/loric_en.html
curl -s -L "https://clocktower-wiki.gstonegames.com/index.php?title=%E5%A5%87%E9%81%87%E8%A7%92%E8%89%B2" -o /tmp/loric_zh.html
```

Extract character names from the English wiki HTML (look for `data-role="..."` in gallery items) and Chinese wiki (look for `title="..."` in `gallerytext`).

Compare against existing IDs in `src/data/extras/loric.ts` to find new characters.

### Step 2: Fetch each new character's ability text

For each new character, fetch its individual page from both wikis:

```bash
# English page - extract first <p> from mw-parser-output
curl -s -L "https://wiki.bloodontheclocktower.com/{En_Name}" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  const b=d.substring(d.indexOf('mw-parser-output'),d.indexOf('mw-parser-output')+8000);
  [...b.matchAll(/<p>(.*?)<\/p>/gs)].forEach(m=>{
    const t=m[1].replace(/<[^>]+>/g,'').trim();
    if(t.length>15)console.log(t.substring(0,500));
  });
});"

# Chinese page - same approach
curl -s -L "https://clocktower-wiki.gstonegames.com/index.php?title={zh_name}" | node -e "..."
```

The **first** result line from each page is the ability text.

### Step 3: Add character entry to loric.ts

File: `src/data/extras/loric.ts`

Add to the array returned by `getLoricCharacters()`, using the `t()` helper for trilingual support:

```typescript
{
    id: '{id}_loric',           // lowercase English name, underscores, _loric suffix
    name: t(language, '{zh_name}', '{en_name}', '{en_name}'),
    ability: t(language, '{zh_ability}', '{en_ability}', '{en_ability}'),
    team: 'loric',
    image: 'https://wiki.bloodontheclocktower.com/images/{hash}/Icon_{id}.png',
    firstNight: 0,
    otherNight: 0,
    firstNightReminder: '',
    otherNightReminder: '',
    reminders: t(language, [], [], []),
    setup: false,
},
```

**ID convention**: lowercase, underscores for spaces, `_loric` suffix. Examples: `godofug_loric`, `knaves_loric`, `ventriloquist_loric`.

**Image URL**: Get from the English wiki page - look for `src="/images/{hash}/Icon_{name}.png"` in the character's gallery thumbnail.

**Spanish**: If no Spanish wiki data available, use English text as placeholder.

### Step 4: Update imagePathMap.ts

File: `src/utils/imagePathMap.ts`

Add entry mapping the image filename to `"Loric"`:

```json
"{id}_loric.png": "Loric"
```

### Step 5: Verify

```bash
npx tsc --noEmit
```

## Character Schema Reference

All Loric characters share these fixed values:

| Field | Value |
|-------|-------|
| team | `'loric'` |
| firstNight | `0` |
| otherNight | `0` |
| firstNightReminder | `''` |
| otherNightReminder | `''` |
| setup | `false` |

Optional fields: `reminders` (string array), `remindersGlobal` (string array), `author` (string).

## Existing Characters (as of 2026-04-30)

gardener, tor, stormcatcher, bigwig, bootlegger, zenomancer, hindu, pope, godofug, knaves, ventriloquist (11 total).
