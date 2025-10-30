// 剧本仓库数据
export interface ScriptData {
  id: string;
  name: string;
  author: string;
  description: string;
  category: 'official' | 'official_mix' | 'custom';
  logo?: string;
  json?: string; // 剧本的完整JSON字符串（可选，用于已加载的数据）
  jsonUrl: string; // JSON文件的URL路径
}

// 剧本映射表：剧本名 -> JSON文件URL
// 仅保留官方三剧本（从 public/scripts/json/official 下读取固定文件）
const OFFICIAL_DIR = '/scripts/json/official';
const OFFICIAL_FILES: Array<{ file: string; name: string }> = [
  { file: 'tb.json', name: 'Trouble Brewing' },
  { file: 'Sects&Violets.json', name: 'Sects & Violets' },
  { file: 'BMR.json', name: 'Bad Moon Rising' },
];

export const SCRIPT_MAP: Record<string, string> = OFFICIAL_FILES.reduce((acc, item) => {
  acc[item.name] = `${OFFICIAL_DIR}/${item.file}`;
  return acc;
}, {} as Record<string, string>);

// 预设剧本列表（用于展示）
export const SCRIPT_REPOSITORY: ScriptData[] = OFFICIAL_FILES.map((item) => {
  const id = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    id,
    name: item.name,
    author: '官方',
    description: '官方剧本',
    category: 'official',
    jsonUrl: SCRIPT_MAP[item.name],
  };
});

// 根据ID查找剧本
export function getScriptById(id: string): ScriptData | undefined {
  return SCRIPT_REPOSITORY.find(script => script.id === id);
}

// 根据名称查找剧本
export function getScriptByName(name: string): ScriptData | undefined {
  return SCRIPT_REPOSITORY.find(script => script.name === name);
}

// 根据名称获取JSON URL
export function getScriptJsonUrl(name: string): string | undefined {
  return SCRIPT_MAP[name];
}

// 从URL加载剧本JSON
export async function loadScriptJson(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`加载剧本失败: ${response.statusText}`);
    }
    const jsonData = await response.json();
    return JSON.stringify(jsonData, null, 2);
  } catch (error) {
    console.error('加载剧本JSON失败:', error);
    throw error;
  }
}

// 搜索剧本
export function searchScripts(query: string): ScriptData[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) {
    return SCRIPT_REPOSITORY;
  }
  
  return SCRIPT_REPOSITORY.filter(script => 
    script.name.toLowerCase().includes(lowerQuery) ||
    script.author.toLowerCase().includes(lowerQuery) ||
    script.description.toLowerCase().includes(lowerQuery)
  );
}

