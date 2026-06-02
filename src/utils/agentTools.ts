import { tool } from 'ai';
import { z } from 'zod';
import { scriptStore } from '../stores/ScriptStore';
import { configStore } from '../stores/ConfigStore';
import { uiConfigStore } from '../stores/UIConfigStore';
import { CHARACTERS_EN, getCharacterInDictionary, getCharacterDictionary } from '../data/canonicalCharacters';
import type { Language } from './languages';
import { searchKnowledge, getKnowledgeTopic } from './agentKnowledge';
import { buildCharacter } from '../data/characterBuilder';
import type { Character } from '../types';
import { isSameCharacter } from '../data/utils/characterIdMapping';
import { getJinx, getJinxDictionary } from '../data/jinx';

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
  description: '搜索角色库。支持中文/英文名称、ID 模糊匹配，可按队伍过滤。返回压缩摘要列表（最多10条）。',
  inputSchema: z.object({
    query: z.string().describe('搜索关键词（名称或ID）'),
    team: z.string().optional().describe('按队伍过滤：townsfolk/outsider/minion/demon/traveler/fabled'),
    limit: z.number().optional().default(10).describe('最大返回数量'),
  }),
  execute: async ({ query, team, limit }) => {
    const dict = getDict();
    const q = query.toLowerCase();
    const results: Array<{ id: string; name: string; team: string; ability: string }> = [];

    for (const [id, c] of Object.entries(dict)) {
      if (results.length >= limit) break;
      const nameLower = c.name?.toLowerCase() ?? '';
      const idLower = id.toLowerCase();
      if (idLower.includes(q) || nameLower.includes(q) || q.includes(idLower.slice(0, 4))) {
        if (team && c.team !== team) continue;
        results.push({
          id,
          name: c.name,
          team: c.team,
          ability: c.ability?.slice(0, 80) ?? '',
        });
      }
    }
    return { count: results.length, characters: results };
  },
});

export const getCharacterDetail = tool({
  description: '获取单个角色的完整信息（名称、能力、队伍、夜序、提醒标记）。仅在用户明确要求或需要详细信息时使用。',
  inputSchema: z.object({
    character_id: z.string().describe('角色ID（紧凑英文格式，如 "imp", "washerwoman"）'),
  }),
  execute: async ({ character_id: cid }) => {
    const dict = getDict();
    const c = getCharacterInDictionary(dict, cid);
    if (!c) return { error: `Character not found: ${cid}` };
    return {
      id: c.id,
      name: c.name,
      team: c.team,
      ability: c.ability,
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
