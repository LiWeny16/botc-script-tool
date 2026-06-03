import { tool } from 'ai';
import { z } from 'zod';
import { scriptStore } from '../../stores/ScriptStore';
import { isSameCharacter } from '../../data/utils/characterIdMapping';
import type { Character } from '../../types';
import { getLang } from './helpers';
import { scriptSummary } from './helpers';

// ── F: Script Title & Metadata ──

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

export const updateTitleInfo = tool({
  description:
    '编辑剧本标题、作者、人数、标题图片等元数据。对标 UI 中双击标题区域打开的编辑对话框。',
  inputSchema: z.object({
    title: z.string().optional().describe('剧本标题'),
    author: z.string().optional().describe('剧本作者'),
    playerCount: z.string().optional().describe('建议玩家数（如 "7-12"）'),
    titleImage: z.string().optional().describe('标题图片URL'),
    titleImageSize: z.number().optional().describe('标题图片尺寸（px）'),
    useTitleImage: z.boolean().optional().describe('是否使用标题图片'),
    showTitleFlourish: z.boolean().optional().describe('是否显示标题装饰'),
    secondPageTitleText: z.string().optional().describe('第二页标题文字'),
    secondPageTitleImage: z.string().optional().describe('第二页标题图片URL'),
    secondPageTitleFontSize: z.number().optional().describe('第二页标题字号'),
    secondPageTitleImageSize: z.number().optional().describe('第二页标题图片尺寸'),
    useSecondPageTitleImage: z.boolean().optional().describe('第二页是否使用图片'),
  }),
  execute: async (updates) => {
    if (!scriptStore.script) return { error: 'No script loaded' };
    const filtered: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) filtered[k] = v;
    }
    if (Object.keys(filtered).length === 0) return { error: 'No fields to update' };
    scriptStore.updateTitleInfo(filtered as never);
    return {
      updated: Object.keys(filtered),
      message: `Updated: ${Object.keys(filtered).join(', ')}`,
    };
  },
});

// ── G: Special Rules ──

export const addSpecialRule = tool({
  description:
    '添加特殊规则到当前剧本（即首页或第二页的额外规则说明）。对标 UI 中的添加自定义规则功能。',
  inputSchema: z.object({
    title: z.string().describe('规则标题'),
    content: z.string().describe('规则内容'),
    type: z.enum(['special', 'state']).optional().default('special').describe('special=首页特殊规则, state=第二页状态规则'),
  }),
  execute: async ({ title, content, type }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };

    const newRule = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      content,
      isState: type === 'state',
      sourceType: (type === 'state' ? 'state' : 'special_rule') as 'state' | 'special_rule',
      sourceIndex: -1,
    };

    const updatedScript = { ...s };
    if (type === 'state') {
      updatedScript.secondPageRules = [...(s.secondPageRules || []), newRule];
    } else {
      updatedScript.specialRules = [...s.specialRules, newRule];
    }
    scriptStore.setScript(updatedScript);

    // Sync to original JSON
    try {
      const jsonArray = JSON.parse(scriptStore.originalJson || '[]');
      if (Array.isArray(jsonArray)) {
        if (type === 'state') {
          const meta = jsonArray.find((it: { id?: string }) => it && it.id === '_meta');
          if (meta) {
            meta.state = [...(meta.state || []), { stateName: title, stateDescription: content }];
          }
        } else {
          jsonArray.push({ id: newRule.id, title, content });
        }
        scriptStore.setOriginalJson(JSON.stringify(jsonArray, null, 2));
      }
    } catch { /* best-effort sync — script state is already updated */ }

    return {
      added: title,
      type,
      totalSpecialRules: updatedScript.specialRules.length,
      totalSecondPageRules: updatedScript.secondPageRules?.length ?? 0,
    };
  },
});

export const editSpecialRule = tool({
  description: '编辑剧本中的特殊规则。对标 UI 中双击特殊规则打开的编辑对话框。',
  inputSchema: z.object({
    rule_id: z.string().describe('规则ID。用 get_script_json 查看所有规则及其ID。'),
    title: z.string().optional().describe('新标题'),
    content: z.string().optional().describe('新内容'),
  }),
  execute: async ({ rule_id, title, content }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };

    const allRules = [...s.specialRules, ...(s.secondPageRules || [])];
    const rule = allRules.find(r => r.id === rule_id);
    if (!rule) return { error: `Rule not found: ${rule_id}. Check get_script_json for rule IDs.` };

    const updated = { ...rule };
    const fields: string[] = [];
    if (title !== undefined) { updated.title = title; fields.push('title'); }
    if (content !== undefined) { updated.content = content; fields.push('content'); }
    scriptStore.updateSpecialRule(updated);
    return { updated: rule_id, fields };
  },
});

export const removeSpecialRule = tool({
  description: '删除剧本中的特殊规则。',
  inputSchema: z.object({
    rule_id: z.string().describe('规则ID'),
  }),
  execute: async ({ rule_id }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };

    const allRules = [...s.specialRules, ...(s.secondPageRules || [])];
    const rule = allRules.find(r => r.id === rule_id);
    if (!rule) return { error: `Rule not found: ${rule_id}` };
    scriptStore.removeSpecialRule(rule);
    return {
      removed: rule.title || rule_id,
      totalSpecialRules: scriptStore.script?.specialRules.length ?? 0,
    };
  },
});

// ── I: Second Page ──

export const manageSecondPage = tool({
  description: '管理第二页组件（标题、玩家分布表1、玩家分布表2）。对标 UI 中的第二页添加/删除按钮。',
  inputSchema: z.object({
    action: z.enum(['add', 'remove']).describe('add=添加, remove=删除'),
    component: z.enum(['title', 'ppl_table1', 'ppl_table2']).optional().describe('要操作的组件类型。remove时必须指定。'),
  }),
  execute: async ({ action, component }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };

    if (action === 'add') {
      const comp = component || 'title';
      scriptStore.addSecondPageComponent(comp);
      return { added: comp, currentOrder: scriptStore.script?.secondPageOrder };
    }

    if (action === 'remove') {
      if (!component) return { error: 'Must specify component type when removing' };
      scriptStore.removeSecondPageComponent(component);
      return { removed: component, currentOrder: scriptStore.script?.secondPageOrder };
    }

    // Zod enum guarantees action is 'add' or 'remove', both handled above.
    // This return is unreachable but satisfies TypeScript's exhaustive check.
    return { error: `Unknown action: ${action}` };
  },
});

// ── D: Night Order ──

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

// ── E: Import / Export ──

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
    const { generateScript } = await import('../scriptGenerator');
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
