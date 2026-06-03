import { tool } from 'ai';
import { z } from 'zod';
import { scriptStore } from '../../stores/ScriptStore';
import { CHARACTERS_EN, getCharacterInDictionary, getCharacterDictionary } from '../../data/canonicalCharacters';
import type { Character } from '../../types';
import { isSameCharacter } from '../../data/utils/characterIdMapping';
import { PINYIN_MAP } from '../../data/utils/pinyinMap';
import { searchAliases } from '../../data/utils/characterAliases';
import { getLang, getDict, buildLocaleMap } from './helpers';

// ── A1: Character Search ──

export const searchCharacters = tool({
  description:
    '搜索角色库。支持中/英/西语名称、ID、别名、拼音模糊搜索，可按队伍过滤。' +
    '当用户提到任何角色名（中文/英文/西语/简称/昵称）时，必须先用此工具验证角色身份。' +
    '返回三语名字和官方ID，确保后续操作使用正确的角色ID。',
  inputSchema: z.object({
    query: z.string().describe('搜索关键词（名称、ID、别名、拼音均可）'),
    team: z.enum(['townsfolk', 'outsider', 'minion', 'demon', 'traveler', 'fabled']).optional().describe('按队伍过滤'),
    lang: z.enum(['cn', 'en', 'es']).optional().describe('返回语言，不指定则使用当前应用语言'),
    limit: z.number().optional().default(10).describe('最大返回数量'),
  }),
  execute: async ({ query, team, lang, limit }) => {
    const q = query.toLowerCase().trim();
    if (!q) return { count: 0, characters: [] };

    const targetLang = lang || getLang();
    const seen = new Set<string>();
    const results: Array<{
      id: string;
      name: string;
      name_cn: string;
      name_en: string;
      name_es: string;
      team: string;
      ability: string;
      firstNight: number;
      otherNight: number;
    }> = [];

    // helper: collect a character if not already seen
    function collect(id: string, c: Character) {
      if (seen.has(id) || results.length >= limit) return;
      if (team && c.team !== team) return;
      seen.add(id);
      results.push({
        id,
        name: c.name,
        name_cn: c.name,
        name_en: c.name,
        name_es: '',
        team: c.team,
        ability: c.ability?.slice(0, 100) ?? '',
        firstNight: c.firstNight,
        otherNight: c.otherNight,
      });
    }

    // ── Step 1: Alias search ──
    const aliasIds = searchAliases(query);
    if (aliasIds.length > 0) {
      const targetDict = getCharacterDictionary(targetLang);
      for (const aid of aliasIds) {
        if (results.length >= limit) break;
        const c = getCharacterInDictionary(targetDict, aid);
        if (c) collect(c.id, c);
      }
    }

    // ── Step 2: Cross-language dictionary search ──
    const localeMap = buildLocaleMap();

    // Use English dict as iteration base (most complete)
    for (const [enId, c] of Object.entries(CHARACTERS_EN)) {
      if (results.length >= limit) break;
      if (seen.has(enId)) continue;

      const locales = localeMap.get(enId);
      const nameCn = locales?.name_cn ?? '';
      const nameEn = locales?.name_en ?? c.name ?? '';
      const nameEs = locales?.name_es ?? '';
      const abilityCn = locales?.ability_cn ?? '';
      const abilityEn = locales?.ability_en ?? c.ability ?? '';
      const abilityEs = locales?.ability_es ?? '';

      // Four-way match (same pattern as CharacterLibraryCard)
      const nameMatch = nameCn.toLowerCase().includes(q) || nameEn.toLowerCase().includes(q) || nameEs.toLowerCase().includes(q);
      const abilityMatch = abilityCn.toLowerCase().includes(q) || abilityEn.toLowerCase().includes(q) || abilityEs.toLowerCase().includes(q);
      const pinyinCn = PINYIN_MAP[nameCn];
      const pinyinMatch = pinyinCn ? pinyinCn.includes(q) : false;
      const idMatch = enId.toLowerCase().includes(q) || q.includes(enId.toLowerCase().slice(0, 4));

      if (!nameMatch && !abilityMatch && !pinyinMatch && !idMatch) continue;
      if (team && c.team !== team) continue;

      seen.add(enId);

      // Get the character in the target language for name/ability
      const targetDict = getCharacterDictionary(targetLang);
      const targetChar = getCharacterInDictionary(targetDict, enId) ?? c;
      // Fallback: if target dict doesn't have this char, use English
      const fallbackEn = getCharacterInDictionary(CHARACTERS_EN, enId);

      results.push({
        id: enId,
        name: targetChar.name || fallbackEn?.name || nameEn || nameCn,
        name_cn: nameCn || fallbackEn?.name || '',
        name_en: nameEn || nameCn,
        name_es: nameEs || '',
        team: c.team,
        ability: (targetChar.ability || fallbackEn?.ability || c.ability || '').slice(0, 100),
        firstNight: c.firstNight,
        otherNight: c.otherNight,
      });
    }

    return { count: results.length, characters: results };
  },
});

// ── A2: Character Detail & CRUD ──

export const getCharacterDetail = tool({
  description: '获取单个角色的完整信息（三语名称、能力、队伍、夜序、提醒标记）。仅在需要完整信息时使用。任何角色操作前建议先用 search_characters 确认ID。',
  inputSchema: z.object({
    character_id: z.string().describe('角色ID（紧凑英文格式，如 "imp", "washerwoman", "lilmonsta"）'),
    lang: z.enum(['cn', 'en', 'es']).optional().describe('返回语言，不指定则使用当前应用语言'),
  }),
  execute: async ({ character_id: cid, lang }) => {
    const targetLang = lang || getLang();
    const targetDict = getCharacterDictionary(targetLang);
    const c = getCharacterInDictionary(targetDict, cid);
    if (!c) return { error: `Character not found: ${cid}`, hint: 'Try search_characters with the character name to find the correct ID.' };

    // Collect trilingual names
    const cnDict = getCharacterDictionary('cn');
    const enDict = CHARACTERS_EN;
    const esDict = getCharacterDictionary('es');
    const cnChar = getCharacterInDictionary(cnDict, cid);
    const enChar = getCharacterInDictionary(enDict, cid);
    const esChar = getCharacterInDictionary(esDict, cid);

    return {
      id: c.id,
      name: c.name,
      name_cn: cnChar?.name ?? '',
      name_en: enChar?.name ?? c.name,
      name_es: esChar?.name ?? '',
      team: c.team,
      ability: c.ability,
      ability_cn: cnChar?.ability ?? '',
      ability_en: enChar?.ability ?? '',
      ability_es: esChar?.ability ?? '',
      firstNight: c.firstNight,
      firstNightReminder: c.firstNightReminder,
      otherNight: c.otherNight,
      otherNightReminder: c.otherNightReminder,
      reminders: c.reminders,
      setup: c.setup,
    };
  },
});

export const addCharacter = tool({
  description: '添加角色到当前剧本。使用角色ID（紧凑英文格式）。',
  inputSchema: z.object({
    character_id: z.string().describe('角色ID'),
  }),
  execute: async ({ character_id }) => {
    const dict = getDict();
    const c = getCharacterInDictionary(dict, character_id);
    if (!c) return { error: `Character not found: ${character_id}` };
    const ok = scriptStore.addCharacter(c);
    if (!ok) return { error: `Character already exists: ${character_id}` };
    const team = scriptStore.script?.characters[c.team]?.length ?? 0;
    return { added: `${c.name} (${c.team})`, team: c.team, teamCount: team, total: scriptStore.script?.all.length };
  },
});

export const removeCharacter = tool({
  description: '从当前剧本移除角色。',
  inputSchema: z.object({
    character_id: z.string().describe('角色ID'),
  }),
  execute: async ({ character_id }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };
    const c = s.all.find(ch => isSameCharacter(ch.id, character_id));
    if (!c) return { error: `Character not in script: ${character_id}` };
    scriptStore.removeCharacter(c);
    return { removed: `${c.name} (${c.team})`, team: c.team, total: scriptStore.script?.all.length };
  },
});

export const replaceCharacter = tool({
  description: '替换剧本中的角色（保留原位置）。',
  inputSchema: z.object({
    old_id: z.string().describe('要移除的角色ID'),
    new_id: z.string().describe('要添加的角色ID'),
  }),
  execute: async ({ old_id, new_id }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };
    const old = s.all.find(ch => isSameCharacter(ch.id, old_id));
    if (!old) return { error: `Character not in script: ${old_id}` };
    const dict = getDict();
    const newChar = getCharacterInDictionary(dict, new_id);
    if (!newChar) return { error: `Character not found: ${new_id}` };
    const ok = scriptStore.replaceCharacter(old, newChar);
    if (!ok) return { error: `Replace failed — ${new_id} may already exist` };
    return { removed: old.name, added: newChar.name, team: newChar.team };
  },
});

export const updateCharacter = tool({
  description:
    '编辑剧本中已有角色的字段（名称、能力、队伍、图片、夜序、提醒标记等）。' +
    '对标 UI 中双击角色卡片打开的编辑对话框。修改后角色在原位置保持不变。',
  inputSchema: z.object({
    character_id: z.string().describe('角色ID（紧凑英文格式，如 "imp", "fortuneteller"）'),
    name: z.string().optional().describe('新名称'),
    ability: z.string().optional().describe('新能力描述'),
    team: z.enum(['townsfolk', 'outsider', 'minion', 'demon', 'traveler', 'fabled']).optional().describe('新队伍'),
    image: z.string().optional().describe('新图片URL'),
    firstNight: z.number().optional().describe('首夜序号（0=不在首夜行动）'),
    otherNight: z.number().optional().describe('其他夜序号（0=不在其他夜行动）'),
    firstNightReminder: z.string().optional().describe('首夜说书人提醒文本'),
    otherNightReminder: z.string().optional().describe('其他夜说书人提醒文本'),
    reminders: z.array(z.string()).optional().describe('标准提醒标记列表'),
    remindersGlobal: z.array(z.string()).optional().describe('全局提醒标记列表'),
    setup: z.boolean().optional().describe('是否初始设置角色'),
  }),
  execute: async ({ character_id, ...updates }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };
    const c = s.all.find(ch => isSameCharacter(ch.id, character_id));
    if (!c) return { error: `Character not in script: ${character_id}` };

    // Filter out undefined fields
    const filtered: Partial<Character> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) filtered[k as keyof typeof updates] = v as never;
    }
    if (Object.keys(filtered).length === 0) return { error: 'No fields to update' };

    scriptStore.updateCharacter(character_id, filtered);
    return {
      updated: c.name,
      fields: Object.keys(filtered),
      message: `Updated ${c.name}: ${Object.keys(filtered).join(', ')}`,
    };
  },
});

// ── Reorder ──

export const reorderCharacters = tool({
  description: '重新排序某队伍中的角色（改变角色在剧本展示中的前后顺序）。对标 UI 中的拖拽排序。',
  inputSchema: z.object({
    team: z.enum(['townsfolk', 'outsider', 'minion', 'demon', 'traveler', 'fabled']).describe('目标队伍'),
    character_ids: z.array(z.string()).describe('按新顺序排列的角色ID列表（必须包含该队伍所有角色，只改顺序不增删）'),
  }),
  execute: async ({ team, character_ids }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };
    const teamChars = s.characters[team];
    if (!teamChars) return { error: `Team "${team}" has no characters in script` };

    // Validate that all IDs are in the team
    const missing = character_ids.filter(id => !teamChars.find(c => isSameCharacter(c.id, id)));
    if (missing.length > 0) return { error: `IDs not in team ${team}: ${missing.join(', ')}` };
    // Validate no IDs are missing from the list
    const extra = teamChars.filter(c => !character_ids.find(id => isSameCharacter(c.id, id)));
    if (extra.length > 0) return { error: `Missing character IDs from list: ${extra.map(c => `${c.name}(${c.id})`).join(', ')}` };

    scriptStore.reorderCharacters(team, character_ids);
    const newOrder = scriptStore.script?.characters[team].map(c => c.name);
    return { team, newOrder, message: `Reordered ${team}: ${newOrder?.join(', ')}` };
  },
});
