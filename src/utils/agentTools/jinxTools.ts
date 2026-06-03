import { tool } from 'ai';
import { z } from 'zod';
import { scriptStore } from '../../stores/ScriptStore';
import { isSameCharacter } from '../../data/utils/characterIdMapping';

// ── H: Jinx Management ──

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

export const addCustomJinx = tool({
  description:
    '添加自定义相克规则（诅咒关系）到当前剧本。对标 UI 中 CustomJinxDialog 或角色编辑对话框中的诅咒功能。' +
    '需要两个角色都在当前剧本中。',
  inputSchema: z.object({
    character_a_id: z.string().describe('第一个角色ID（紧凑英文格式）'),
    character_b_id: z.string().describe('第二个角色ID（紧凑英文格式）'),
    reason: z.string().describe('相克规则描述文本'),
  }),
  execute: async ({ character_a_id, character_b_id, reason }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };
    const charA = s.all.find(ch => isSameCharacter(ch.id, character_a_id));
    if (!charA) return { error: `Character not in script: ${character_a_id}` };
    const charB = s.all.find(ch => isSameCharacter(ch.id, character_b_id));
    if (!charB) return { error: `Character not in script: ${character_b_id}` };
    if (isSameCharacter(character_a_id, character_b_id)) return { error: 'Cannot create a jinx between a character and itself' };
    if (!reason.trim()) return { error: 'Jinx reason cannot be empty' };

    scriptStore.addCustomJinx(charA, charB, reason.trim());
    return {
      added: `${charA.name} ↔ ${charB.name}`,
      reason: reason.trim(),
      message: `Custom jinx added between ${charA.name} and ${charB.name}`,
    };
  },
});

export const removeCustomJinx = tool({
  description: '删除自定义相克规则。只能删除非官方的相克（isOfficial=false）。',
  inputSchema: z.object({
    character_a_id: z.string().describe('第一个角色ID'),
    character_b_id: z.string().describe('第二个角色ID'),
  }),
  execute: async ({ character_a_id, character_b_id }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };
    const charA = s.all.find(ch => isSameCharacter(ch.id, character_a_id));
    if (!charA) return { error: `Character not in script: ${character_a_id}` };
    const charB = s.all.find(ch => isSameCharacter(ch.id, character_b_id));
    if (!charB) return { error: `Character not in script: ${character_b_id}` };

    // Check if it's a custom jinx (can't delete official)
    const jinxEntry = s.jinx[charA.name]?.[charB.name];
    if (!jinxEntry) return { error: `No jinx exists between ${charA.name} and ${charB.name}` };
    if (jinxEntry.isOfficial) return { error: `Cannot delete official jinx: ${charA.name} ↔ ${charB.name}. Use update_jinx to toggle display instead.` };

    scriptStore.removeCustomJinx(charA, charB);
    return {
      removed: `${charA.name} ↔ ${charB.name}`,
      message: `Custom jinx removed between ${charA.name} and ${charB.name}`,
    };
  },
});

export const updateJinx = tool({
  description:
    '更新相克规则（切换显示/隐藏、修改描述文本）。可作用于官方和自定义相克。',
  inputSchema: z.object({
    character_a_id: z.string().describe('第一个角色ID'),
    character_b_id: z.string().describe('第二个角色ID'),
    display: z.boolean().optional().describe('是否显示该相克规则'),
    reason: z.string().optional().describe('新的相克规则描述文本（覆盖原文本）'),
  }),
  execute: async ({ character_a_id, character_b_id, display, reason }) => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };
    const charA = s.all.find(ch => isSameCharacter(ch.id, character_a_id));
    if (!charA) return { error: `Character not in script: ${character_a_id}` };
    const charB = s.all.find(ch => isSameCharacter(ch.id, character_b_id));
    if (!charB) return { error: `Character not in script: ${character_b_id}` };

    const jinxEntry = s.jinx[charA.name]?.[charB.name];
    if (!jinxEntry) return { error: `No jinx exists between ${charA.name} and ${charB.name}` };

    const updates: { display?: boolean; reason?: string } = {};
    if (display !== undefined) updates.display = display;
    if (reason !== undefined) updates.reason = reason;
    if (Object.keys(updates).length === 0) return { error: 'No updates provided' };

    scriptStore.updateOfficialJinx(charA, charB, updates);
    return {
      updated: `${charA.name} ↔ ${charB.name}`,
      changes: updates,
      message: `Updated jinx: ${charA.name} ↔ ${charB.name}`,
    };
  },
});

export const listJinx = tool({
  description: '列出当前剧本中所有相克关系（诅咒），包括官方和自定义。返回详细结构化列表。',
  inputSchema: z.object({}),
  execute: async () => {
    const s = scriptStore.script;
    if (!s) return { error: 'No script loaded' };

    const seen = new Set<string>();
    const jinxList: Array<{
      char_a: string;
      char_a_id: string;
      char_b: string;
      char_b_id: string;
      reason: string;
      display: boolean;
      isOfficial: boolean;
    }> = [];

    for (const [nameA, relations] of Object.entries(s.jinx)) {
      const charA = s.all.find(ch => ch.name === nameA);
      for (const [nameB, info] of Object.entries(relations)) {
        const key = [nameA, nameB].sort().join('||');
        if (seen.has(key)) continue;
        seen.add(key);
        const charB = s.all.find(ch => ch.name === nameB);
        jinxList.push({
          char_a: nameA,
          char_a_id: charA?.id ?? '',
          char_b: nameB,
          char_b_id: charB?.id ?? '',
          reason: info.reason?.slice(0, 200) ?? '',
          display: info.display !== false,
          isOfficial: info.isOfficial !== false,
        });
      }
    }

    return {
      count: jinxList.length,
      official: jinxList.filter(j => j.isOfficial).length,
      custom: jinxList.filter(j => !j.isOfficial).length,
      jinx: jinxList,
    };
  },
});
