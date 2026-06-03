import { tool } from 'ai';
import { z } from 'zod';
import { scriptStore } from '../stores/ScriptStore';
import { configStore } from '../stores/ConfigStore';
import { uiConfigStore } from '../stores/UIConfigStore';
import { CHARACTERS_EN, getCharacterInDictionary, getCharacterDictionary, getAllCharacterDictionaries } from '../data/canonicalCharacters';
import type { Language } from './languages';
import { searchKnowledge, getKnowledgeTopic } from './agentKnowledge';
import { buildCharacter } from '../data/characterBuilder';
import type { Character } from '../types';
import { isSameCharacter } from '../data/utils/characterIdMapping';
import { getJinx, getJinxDictionary } from '../data/jinx';
import { PINYIN_MAP } from '../data/utils/pinyinMap';
import { searchAliases } from '../data/utils/characterAliases';

// ── Helpers ──

function getLang(): Language { return configStore.language; }

function getDict() { return getCharacterDictionary(getLang()); }

function charSummary(c: Character) {
  return {
    id: c.id,
    name: c.name,
    team: c.team,
    ability: c.ability.slice(0, 80) + (c.ability.length > 80 ? '...' : ''),
    firstNight: c.firstNight,
    otherNight: c.otherNight,
  };
}

function scriptSummary() {
  const s = scriptStore.script;
  if (!s) return { loaded: false, message: 'No script loaded' };
  const teams: Record<string, number> = {};
  for (const [team, chars] of Object.entries(s.characters)) {
    teams[team] = chars.length;
  }
  return {
    loaded: true,
    title: s.title,
    author: s.author,
    playerCount: s.playerCount,
    teams,
    totalCharacters: s.all.length,
    jinxCount: Object.keys(s.jinx).length,
    hasSpecialRules: (s.specialRules?.length ?? 0) > 0,
  };
}

// ── A: Script CRUD ──

export const searchCharacters = tool({
  description:
    '搜索角色库。支持中/英/西语名称、ID、别名、拼音模糊搜索，可按队伍过滤。' +
    '当用户提到任何角色名（中文/英文/西语/简称/昵称）时，必须先用此工具验证角色身份。' +
    '返回三语名字和官方ID，确保后续操作使用正确的角色ID。',
  inputSchema: z.object({
    query: z.string().describe('搜索关键词（名称、ID、别名、拼音均可）'),
    team: z.string().optional().describe('按队伍过滤：townsfolk/outsider/minion/demon/traveler/fabled'),
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
    const allDicts = getAllCharacterDictionaries();
    // Build language-specific name/ability maps (keyed by English compact ID)
    const localeMap = new Map<string, { name_cn: string; name_en: string; name_es: string; ability_cn: string; ability_en: string; ability_es: string }>();
    for (const [dictLang, dict] of allDicts) {
      for (const [enId, c] of Object.entries(dict)) {
        const entry = localeMap.get(enId) || { name_cn: '', name_en: '', name_es: '', ability_cn: '', ability_en: '', ability_es: '' };
        if (dictLang === 'cn') { entry.name_cn = c.name; entry.ability_cn = c.ability; }
        if (dictLang === 'en') { entry.name_en = c.name; entry.ability_en = c.ability; }
        if (dictLang === 'es') { entry.name_es = c.name; entry.ability_es = c.ability; }
        localeMap.set(enId, entry);
      }
    }

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

export const getScriptSummary = tool({
  description: '获取当前剧本的摘要统计（队伍分布、角色数、诅咒数等）。',
  inputSchema: z.object({}),
  execute: async () => scriptSummary(),
});

export const getScriptJson = tool({
  description: '获取当前剧本的完整JSON。仅当用户明确要求导出或查看原始JSON时使用。',
  inputSchema: z.object({}),
  execute: async () => {
    if (!scriptStore.script) return { error: 'No script loaded' };
    return { json: scriptStore.normalizedJson || scriptStore.originalJson };
  },
});

// ── B: Config & UI ──

export const getConfig = tool({
  description: '获取当前应用配置（语言、ID解析模式、诅咒显示设置）。',
  inputSchema: z.object({}),
  execute: async () => ({
    language: configStore.language,
    officialIdParseMode: configStore.config.officialIdParseMode,
    hideDuplicateJinx: configStore.config.hideDuplicateJinx,
  }),
});

export const setConfig = tool({
  description: '修改应用配置。',
  inputSchema: z.object({
    language: z.enum(['cn', 'en', 'es']).optional().describe('语言'),
    officialIdParseMode: z.boolean().optional().describe('官方ID解析模式'),
    hideDuplicateJinx: z.boolean().optional().describe('隐藏重复诅咒文本'),
  }),
  execute: async (updates) => {
    const changes: string[] = [];
    if (updates.language) { configStore.setLanguage(updates.language); changes.push(`language → ${updates.language}`); }
    if (updates.officialIdParseMode !== undefined) { configStore.setOfficialIdParseMode(updates.officialIdParseMode); changes.push(`officialIdParseMode → ${updates.officialIdParseMode}`); }
    if (updates.hideDuplicateJinx !== undefined) { configStore.setHideDuplicateJinx(updates.hideDuplicateJinx); changes.push(`hideDuplicateJinx → ${updates.hideDuplicateJinx}`); }
    return { changed: changes, message: changes.length > 0 ? `Updated: ${changes.join(', ')}` : 'No changes' };
  },
});

export const getUiConfig = tool({
  description: '获取UI配置。可指定 section 来获取特定部分：backgrounds/fonts/card/theme。',
  inputSchema: z.object({
    section: z.string().optional().describe('配置部分：backgrounds, fonts, card, theme。不指定则返回摘要。'),
  }),
  execute: async ({ section }) => {
    const cfg = uiConfigStore.config;
    if (section === 'backgrounds') {
      return {
        mainBackground: cfg.mainBackground,
        mainBackgroundMode: cfg.mainBackgroundMode,
        nightOrderBackground: cfg.nightOrderBackground,
        nightOrderBackgroundMode: cfg.nightOrderBackgroundMode,
      };
    }
    if (section === 'fonts') return { fonts: cfg.fonts };
    if (section === 'card') return { characterCard: cfg.characterCard };
    if (section === 'theme') return { theme: cfg.theme, cornerFlower: cfg.cornerFlower, enableTwoPageMode: cfg.enableTwoPageMode };
    return {
      theme: cfg.theme,
      mainBackground: cfg.mainBackground,
      nightOrderBackground: cfg.nightOrderBackground,
      enableTwoPageMode: cfg.enableTwoPageMode,
      languages: { cn: '中文', en: 'English', es: 'Español' },
    };
  },
});

export const setUiConfig = tool({
  description: '修改UI配置的某个部分。',
  inputSchema: z.object({
    section: z.enum(['backgrounds', 'card', 'theme']).describe('配置部分'),
    updates: z.record(z.string(), z.unknown()).describe('要更新的键值对'),
  }),
  execute: async ({ section, updates }) => {
    if (section === 'theme') {
      const partial: Record<string, unknown> = {};
      if (updates.theme) partial.theme = updates.theme;
      if (updates.cornerFlower) partial.cornerFlower = updates.cornerFlower;
      if (updates.enableTwoPageMode !== undefined) {
        const v = updates.enableTwoPageMode;
        partial.enableTwoPageMode = v === 'true' || v === true;
      }
      uiConfigStore.updateConfig(partial as never);
      return { updated: Object.keys(partial) };
    }
    if (section === 'card') {
      const cardUpdates: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(updates)) {
        const num = Number(v);
        cardUpdates[k] = isNaN(num) ? v : num;
      }
      uiConfigStore.updateCharacterCardConfig(cardUpdates as never);
      return { updated: Object.keys(cardUpdates) };
    }
    if (section === 'backgrounds') {
      const bg: Record<string, unknown> = {};
      if (updates.mainBackground) bg.mainBackground = updates.mainBackground;
      if (updates.nightOrderBackground) bg.nightOrderBackground = updates.nightOrderBackground;
      uiConfigStore.updateConfig(bg as never);
      return { updated: Object.keys(bg) };
    }
    return { error: `Unknown section: ${section}` };
  },
});

export const setTheme = tool({
  description: '快速切换主题。当前支持 "none"（默认）和 "sakura"（樱花）。',
  inputSchema: z.object({
    theme: z.enum(['none', 'sakura']).describe('主题名称'),
  }),
  execute: async ({ theme }) => {
    uiConfigStore.updateConfig({ theme } as never);
    return { theme, message: `Theme set to "${theme}"` };
  },
});

// ── C: Knowledge Base ──

export const searchKnowledgeTool = tool({
  description: '在BOTC知识库中搜索（核心规则、机制、剧本设计启发法、AI生成手册）。返回相关段落摘要。',
  inputSchema: z.object({
    query: z.string().describe('搜索查询'),
  }),
  execute: async ({ query }) => {
    const results = await searchKnowledge(query, 5);
    if (results.length === 0) return { message: 'No relevant knowledge found', results: [] };
    return { count: results.length, results };
  },
});

export const getKnowledgeTopicTool = tool({
  description: '获取特定知识库主题的完整内容。可用主题参见知识库文件标题。',
  inputSchema: z.object({
    topic: z.string().describe('主题名称（如 "Information Economy", "Jinx Review", "Core Loop"）'),
  }),
  execute: async ({ topic }) => {
    const content = await getKnowledgeTopic(topic);
    if (!content) return { error: `Topic not found: ${topic}`, suggestion: 'Use search_knowledge to find relevant topics' };
    return { topic, content: content.slice(0, 2000) + (content.length > 2000 ? '...[truncated]' : '') };
  },
});

// ── D: Night Order & Jinx ──

export const getNightOrder = tool({
  description: '获取当前剧本的夜序（首夜或其他夜）。',
  inputSchema: z.object({
    night: z.enum(['first', 'other']).describe('first=首夜, other=其他夜'),
  }),
  execute: async ({ night }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };
    const order = night === 'first' ? s.firstnight : s.othernight;
    return {
      night,
      count: order.length,
      order: order.map(a => ({ image: a.image, index: a.index })),
    };
  },
});

export const getJinxInfo = tool({
  description: '获取某个角色的所有诅咒关系。',
  inputSchema: z.object({
    character_id: z.string().describe('角色ID'),
  }),
  execute: async ({ character_id }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };
    const c = s.all.find(ch => isSameCharacter(ch.id, character_id));
    if (!c) return { error: `Character not in script: ${character_id}` };
    const jinxData = s.jinx[c.name];
    if (!jinxData || Object.keys(jinxData).length === 0) return { character: c.name, jinx: [], message: 'No jinx relationships' };
    const entries = Object.entries(jinxData).map(([name, info]) => ({
      with: name,
      reason: info.reason?.slice(0, 120) ?? '',
      display: info.display,
    }));
    return { character: c.name, jinx: entries, count: entries.length };
  },
});

export const updateNightOrder = tool({
  description: '更新角色的夜序位置。',
  inputSchema: z.object({
    night: z.enum(['first', 'other']).describe('first=首夜, other=其他夜'),
    character_id: z.string().describe('角色ID'),
    position: z.number().describe('新位置（整数，越大越晚行动）'),
  }),
  execute: async ({ night, character_id, position }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };
    const c = s.all.find(ch => isSameCharacter(ch.id, character_id));
    if (!c) return { error: `Character not in script: ${character_id}` };
    scriptStore.updateCharacter(character_id, {
      [night === 'first' ? 'firstNight' : 'otherNight']: position,
    } as Partial<Character>);
    return { character: c.name, night, newPosition: position };
  },
});

// ── E: Utility ──

export const importJson = tool({
  description: '导入BOTC JSON剧本。会完全替换当前剧本。需要用户在UI中确认。',
  inputSchema: z.object({
    json_string: z.string().describe('完整的BOTC脚本JSON字符串'),
  }),
  execute: async ({ json_string }) => {
    try {
      JSON.parse(json_string);
    } catch {
      return { error: 'Invalid JSON — please check the format' };
    }
    const { generateScript } = await import('./scriptGenerator');
    try {
      const script = generateScript(json_string, getLang());
      scriptStore.setScript(script);
      scriptStore.setOriginalJson(json_string);
      return {
        imported: true,
        title: script.title,
        teams: Object.fromEntries(Object.entries(script.characters).map(([k, v]) => [k, v.length])),
        total: script.all.length,
      };
    } catch (e) {
      return { error: `Failed to parse script: ${(e as Error).message}` };
    }
  },
});

export const exportJson = tool({
  description: '导出当前剧本为JSON（触发下载）。',
  inputSchema: z.object({}),
  execute: async () => {
    if (!scriptStore.script) return { error: 'No script loaded' };
    return {
      json: scriptStore.normalizedJson || scriptStore.originalJson,
      message: 'JSON ready — tell user to save the file',
    };
  },
});

// ── Tool Registry ──

export const ALL_TOOLS = {
  search_characters: searchCharacters,
  get_character_detail: getCharacterDetail,
  add_character: addCharacter,
  remove_character: removeCharacter,
  replace_character: replaceCharacter,
  get_script_summary: getScriptSummary,
  get_script_json: getScriptJson,
  get_config: getConfig,
  set_config: setConfig,
  get_ui_config: getUiConfig,
  set_ui_config: setUiConfig,
  set_theme: setTheme,
  search_knowledge: searchKnowledgeTool,
  get_knowledge_topic: getKnowledgeTopicTool,
  get_night_order: getNightOrder,
  get_jinx_info: getJinxInfo,
  update_night_order: updateNightOrder,
  import_json: importJson,
  export_json: exportJson,
};

export type AgentToolName = keyof typeof ALL_TOOLS;
