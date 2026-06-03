// ══ Knowledge Base — Lazy-Loaded ══
// Only map.md is statically imported (small, needed for system prompt).
// All other knowledge files use dynamic import() → Vite auto code-splits.
// Files are loaded on first agent interaction, not at app startup.

import knowledgeMap from '../../knowledge/botc/map.md?raw';

// ── Lazy File Registry ──

interface KnowledgeSection {
  file: string;
  title: string;
  content: string;
  /** Priority: 3=critical, 2=high, 1=medium, 0=low */
  priority: number;
}

type LazyLoader = () => Promise<{ default: string }>;

/** All knowledge files with priority metadata. Each has a lazy loader for dynamic import. */
const FILE_REGISTRY: Record<string, { loader: LazyLoader; priority: number; description: string }> = {
  'core-rules': {
    loader: () => import('../../knowledge/botc/core-rules.md?raw'),
    priority: 3,
    description: '核心规则模型 — 角色类型、昼夜循环、胜负条件、信息完整性',
  },
  'mechanics-ontology': {
    loader: () => import('../../knowledge/botc/mechanics-ontology.md?raw'),
    priority: 3,
    description: '机制本体论 — 状态标签、功能分类、交互风险等级',
  },
  'script-design': {
    loader: () => import('../../knowledge/botc/script-design.md?raw'),
    priority: 2,
    description: '剧本设计启发法 — 六轴平衡、信息经济、伪装空间、复杂度预算',
  },
  'ai-generation-playbook': {
    loader: () => import('../../knowledge/botc/ai-generation-playbook.md?raw'),
    priority: 2,
    description: 'AI 生成工作流 — 从 brief 到最终产出的完整流程',
  },
  'sources': {
    loader: () => import('../../knowledge/botc/sources.md?raw'),
    priority: 1,
    description: '来源政策 — 数据来源、归属、法律边界',
  },
  'data-contract': {
    loader: () => import('../../knowledge/botc/data-contract.md?raw'),
    priority: 1,
    description: '数据契约 — 知识库与代码的结构化数据映射',
  },
  'rules-reference': {
    loader: () => import('../../knowledge/botc/rules-reference.md?raw'),
    priority: 3,
    description: '规则参考 — 设置、昼夜阶段、角色能力规则、状态、隐性规则、术语表',
  },
  'storyteller-guide': {
    loader: () => import('../../knowledge/botc/storyteller-guide.md?raw'),
    priority: 2,
    description: '说书人指南 — 操作技巧、趣味建议、可以但不建议(YBD)清单',
  },
  'rules-changelog': {
    loader: () => import('../../knowledge/botc/rules-changelog.md?raw'),
    priority: 1,
    description: '规则变动日志 — 角色能力调整、相克规则更新、华灯初上变动',
  },
  'readme': {
    loader: () => import('../../knowledge/botc/README.md?raw'),
    priority: 0,
    description: '知识库概述 — 用途、阅读顺序、非目标',
  },
};

// ── Load State ──

const loadedFiles = new Map<string, string>();
const SECTION_CACHE: KnowledgeSection[] = [];
let allLoaded = false;

/** Check if all files have been loaded */
export function isKnowledgeLoaded(): boolean {
  return allLoaded;
}

/** Get list of registered files with metadata */
export function getKnowledgeFileList(): Array<{ name: string; priority: number; description: string; loaded: boolean }> {
  return Object.entries(FILE_REGISTRY).map(([name, { priority, description }]) => ({
    name,
    priority,
    description,
    loaded: loadedFiles.has(name),
  }));
}

/** Load a single file by name. Returns the raw content. */
async function loadFile(name: string): Promise<string> {
  if (loadedFiles.has(name)) return loadedFiles.get(name)!;

  const entry = FILE_REGISTRY[name];
  if (!entry) throw new Error(`Unknown knowledge file: ${name}`);

  const mod = await entry.loader();
  const raw = mod.default;
  loadedFiles.set(name, raw);
  return raw;
}

/** Load all registered knowledge files in parallel. Idempotent — skips already loaded. */
async function ensureAllLoaded(): Promise<void> {
  if (allLoaded) return;

  const pending = Object.keys(FILE_REGISTRY).map(name => loadFile(name));
  await Promise.all(pending);
  allLoaded = true;
}

// ── Section Parsing ──

function parseSections(): KnowledgeSection[] {
  if (SECTION_CACHE.length > 0) return SECTION_CACHE;

  for (const [name, { priority }] of Object.entries(FILE_REGISTRY)) {
    const raw = loadedFiles.get(name);
    if (!raw) continue; // Not loaded yet — skip

    const sections = raw.split(/^## /m).filter(Boolean);
    const docTitle = sections[0]?.split('\n')[0]?.replace(/^# /, '') || name;

    for (const sec of sections) {
      const lines = sec.split('\n');
      const secTitle = lines[0]?.trim() || '';
      const secContent = lines.slice(1).join('\n').trim();
      if (secContent.length > 10) {
        SECTION_CACHE.push({ file: name, title: secTitle, content: secContent, priority });
      }
    }

    // Top-level intro (before first ##)
    const introMatch = raw.match(/^#[^\n]*\n\n([\s\S]*?)(?=^## |\n## )/m);
    if (introMatch?.[1]?.trim()) {
      SECTION_CACHE.push({ file: name, title: docTitle, content: introMatch[1].trim(), priority });
    }
  }

  return SECTION_CACHE;
}

// ── BM25-inspired Search ──

const K1 = 1.5;
const B = 0.75;

function getAvgSectionLength(sections: KnowledgeSection[]): number {
  if (sections.length === 0) return 1;
  return sections.reduce((sum, s) => sum + s.content.length, 0) / sections.length;
}

/**
 * Search knowledge base with BM25-inspired ranking + priority boosting.
 * Triggers lazy loading on first call.
 */
export async function searchKnowledge(
  query: string,
  limit = 5,
): Promise<Array<{ title: string; file: string; snippet: string; priority: number }>> {
  await ensureAllLoaded();
  const sections = parseSections();
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 1);
  if (keywords.length === 0) return [];

  const avgLen = getAvgSectionLength(sections);
  const N = sections.length;

  const scored = sections.map(sec => {
    const text = (sec.title + ' ' + sec.content).toLowerCase();
    const titleLower = sec.title.toLowerCase();
    const docLen = sec.content.length;

    let score = 0;
    for (const kw of keywords) {
      const tf = text.split(kw).length - 1;
      if (tf === 0) continue;

      const df = sections.filter(s =>
        (s.title + ' ' + s.content).toLowerCase().includes(kw),
      ).length;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));

      const numerator = tf * (K1 + 1);
      const denominator = tf + K1 * (1 - B + B * (docLen / avgLen));
      const termScore = idf * (numerator / denominator);

      const titleBoost = titleLower.includes(kw) ? 2.0 : 1.0;
      const priorityBoost = 1 + sec.priority * 0.5;

      score += termScore * titleBoost * priorityBoost;
    }

    return { ...sec, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => ({
      title: s.title,
      file: s.file,
      snippet: s.content.slice(0, 600) + (s.content.length > 600 ? '...' : ''),
      priority: s.priority,
    }));
}

// ── Topic Retrieval ──

function formatTopic(sec: KnowledgeSection): string {
  let out = `## ${sec.title}\n*来源: ${sec.file} | 优先级: ${'⭐'.repeat(sec.priority + 1)}*\n\n${sec.content}`;
  if (out.length > 3000) out = out.slice(0, 3000) + '...[truncated]';
  return out;
}

/**
 * Get full content of a knowledge topic by title, section name, or file name.
 * Triggers lazy loading on first call.
 */
export async function getKnowledgeTopic(topic: string): Promise<string | null> {
  await ensureAllLoaded();
  const sections = parseSections();
  const lower = topic.toLowerCase();

  // Exact title match
  const exact = sections.find(s => s.title.toLowerCase() === lower);
  if (exact) return formatTopic(exact);

  // Substring match in title
  const match = sections.find(s =>
    s.title.toLowerCase().includes(lower) || lower.includes(s.title.toLowerCase()),
  );
  if (match) return formatTopic(match);

  // File name match → all sections from that file
  const fileSections = sections.filter(s =>
    s.file.toLowerCase() === lower || s.file.toLowerCase().includes(lower),
  );
  if (fileSections.length > 0) {
    return fileSections.map(formatTopic).join('\n\n---\n\n');
  }

  return null;
}

// ── System Prompts (uses statically-loaded map.md only) ──

/** Extract document catalog from map.md for the system prompt */
function getMapSummary(): string {
  const docDirMatch = knowledgeMap.match(/## 文档目录\n\n([\s\S]*?)(?=\n## 官方百科|\n## Agent|\n## 来源)/);
  if (docDirMatch) {
    const cleaned = docDirMatch[1]
      .replace(/^- \*\*路径\*\*:.*$/gm, '')
      .replace(/^- \*\*大小\*\*:.*$/gm, '')
      .replace(/^- \*\*官方来源\*\*:.*$/gm, '')
      .replace(/^- \*\*官方百科对应页\*\*:[\s\S]*?(?=^### |\n\n|$)/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return `[KNOWLEDGE MAP — use search_knowledge / get_knowledge_topic to explore]\n${cleaned.slice(0, 1200)}`;
  }
  return '';
}

/** Ultra-compact system prompt — only essentials, ~700 tokens */
export function getSystemPrompt(): string {
  return `BOTC AI 说书人。标准剧本 13镇民/4外来者/4爪牙/4恶魔。善良处决恶魔获胜。

## 铁律
1. **用户提到任何角色名时必须先用 search_characters 验证** — 你的训练数据中角色名对应关系可能是错的。永远不要凭记忆判断「X角色是谁」。
   正确：用户问"小怪宝" → search_characters({query:"小怪宝"}) → 拿到 lilmonsta → 用返回的 id/name 回答
   错误：用户问"小怪宝" → 直接说它是 Pukka
2. **禁止凭记忆回答规则/机制/设定问题** → 必须先用 search_knowledge 或 get_knowledge_topic
3. **90%把握才下结论** → 不确定就说"推测，建议查官方"
4. **需求模糊必须反问** → 不问清楚不准动手

## Few-shot：角色问题处理流程示例

用户: "小怪宝和半兽人谁行动顺序先？"
→ search_characters({query:"小怪宝"}) → {id:"lilmonsta", firstNight:20, otherNight:0}
→ search_characters({query:"半兽人"}) → {id:"lycanthrope", firstNight:0, otherNight:22}
→ 回答：首夜小怪宝先行动，其他夜半兽人先行动

用户: "加一个FT"
→ search_characters({query:"FT"}) → 别名匹配 → {id:"fortuneteller", name:"Fortune Teller"}
→ add_character({character_id:"fortuneteller"})

用户: "pukka是什么"
→ search_characters({query:"pukka"}) 或 get_character_detail({character_id:"pukka"})
→ 用返回的 ability 字段回答

## 工具速查
| 需要什么 | 用什么工具 |
|---------|-----------|
| 查找/验证角色(含别名/拼音) | search_characters |
| 角色完整详情 | get_character_detail |
| 编辑角色字段(名称/能力/夜序等) | update_character |
| 添加/删除/替换角色 | add_character / remove_character / replace_character |
| 角色排序 | reorder_characters |
| 剧本标题/作者/人数/标题图 | update_title_info |
| 当前剧本 | get_script_summary / get_script_json |
| 相克关系(读取) | get_jinx_info / list_jinx |
| 相克关系(添加/删除/编辑) | add_custom_jinx / remove_custom_jinx / update_jinx |
| 夜序 | get_night_order / update_night_order |
| 特殊规则(添加/编辑/删除) | add_special_rule / edit_special_rule / remove_special_rule |
| 第二页组件 | manage_second_page |
| BOTC规则/机制/设计 | search_knowledge / get_knowledge_topic |
| 配置/主题/UI/字体 | get_config / set_config / set_theme / get_ui_config / set_ui_config / reset_ui_config |
| 导入/导出 | import_json / export_json |

## Few-shot：编辑操作示例

用户: "把小怪宝和半兽人加一个相克：如果半兽人选到了照看小怪宝的玩家，该玩家不会死亡"
→ add_custom_jinx({character_a_id:"lilmonsta", character_b_id:"lycanthrope", reason:"..."})
→ 返回: added: "小怪宝 ↔ 半兽人"

用户: "把占卜师的名字改成预言家"
→ search_characters({query:"占卜师"}) → id:"fortuneteller"
→ update_character({character_id:"fortuneteller", name:"预言家"})

用户: "把剧本标题改成 紫罗兰之夜"
→ update_title_info({title:"紫罗兰之夜"})

## 其他规则
- 打招呼/问能力→直接答，不调工具
- 修改剧本后必须说明改了什么、为什么
- 角色ID用英文紧凑格式（如 "fortuneteller", "lilmonsta"），中英文名和别名都支持
- search_characters 返回三语名字(name_cn/name_en/name_es)，用 name 字段确认角色身份
- 自制/非官方建议必须标注；角色对有官方相克必须提示；不声称官方身份
- Markdown 格式回复`;}

/** Compact system prompt for session compaction / tight context */
export function getCompactSystemPrompt(): string {
  return `BOTC assistant. 13/4/4/4. Good wins by executing Demon.
CRITICAL: ANY character name → search_characters first (training data may be wrong). Never guess character identity.
Rules: NO rule/mechanic guess — use search_knowledge. 90% confidence. Ask back if unclear.
Edit tools: update_character, update_title_info, add/remove/replace_character, reorder_characters.
Jinx: add_custom_jinx, remove_custom_jinx, update_jinx, list_jinx, get_jinx_info.
Special rules: add/edit/remove_special_rule. Second page: manage_second_page.
UI: get/set_ui_config (fonts/backgrounds/card/theme), set_theme, reset_ui_config.`;
}

/** Pre-warm: load all knowledge files in background. Call when Agent dialog opens. */
export function preloadKnowledge(): void {
  const entries = Object.entries(FILE_REGISTRY);
  Promise.all(entries.map(([, entry]) => entry.loader())).then(mods => {
    for (let i = 0; i < entries.length; i++) {
      const [name] = entries[i];
      if (!loadedFiles.has(name)) {
        loadedFiles.set(name, mods[i].default);
      }
    }
    allLoaded = true;
  }).catch(() => { /* silent — will retry on first search */ });
}
