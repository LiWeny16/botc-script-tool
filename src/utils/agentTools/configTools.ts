import { tool } from 'ai';
import { z } from 'zod';
import { configStore } from '../../stores/ConfigStore';
import { uiConfigStore } from '../../stores/UIConfigStore';
import { searchKnowledge, getKnowledgeTopic } from '../agentKnowledge';

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
  description: '修改UI配置的某个部分（背景/卡片/主题/字体）。',
  inputSchema: z.object({
    section: z.enum(['backgrounds', 'card', 'theme', 'fonts']).describe('配置部分：backgrounds=背景, card=角色卡片, theme=主题, fonts=字体'),
    updates: z.record(z.string(), z.unknown()).describe('要更新的键值对。fonts支持: scriptTitle/teamDivider/characterName/characterAbility/jinxText/specialRuleTitle/specialRuleContent/stateRuleTitle/stateRuleContent'),
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
      if (updates.mainBackgroundMode) bg.mainBackgroundMode = updates.mainBackgroundMode;
      if (updates.nightOrderBackgroundMode) bg.nightOrderBackgroundMode = updates.nightOrderBackgroundMode;
      uiConfigStore.updateConfig(bg as never);
      return { updated: Object.keys(bg) };
    }
    if (section === 'fonts') {
      const fontUpdates: Record<string, string> = {};
      for (const [k, v] of Object.entries(updates)) {
        if (typeof v === 'string') fontUpdates[k] = v;
      }
      if (Object.keys(fontUpdates).length === 0) return { error: 'No valid font values provided' };
      uiConfigStore.updateFontConfig(fontUpdates as never);
      return { updated: Object.keys(fontUpdates) };
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

export const resetUiConfig = tool({
  description: '重置所有UI配置到默认值（包括字体、背景、卡片布局、主题）。注意：这是全量重置，无法只重置部分配置。',
  inputSchema: z.object({}),
  execute: async () => {
    uiConfigStore.resetToDefault();
    return { reset: 'all', message: 'All UI config (fonts, backgrounds, card, theme) reset to defaults' };
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
