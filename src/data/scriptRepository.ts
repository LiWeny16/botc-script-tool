// 剧本仓库数据
export interface ScriptData {
  id: string;
  name: string;
  author: string;
  description: string;
  json?: string; // 剧本的完整JSON字符串（可选，用于已加载的数据）
  jsonUrl: string; // JSON文件的URL路径
}

// 剧本映射表：剧本名 -> JSON文件URL
export const SCRIPT_MAP: Record<string, string> = {
  // 常见剧本
  '7席谜案录': '/scripts/常见剧本/7席谜案录-TrashWarlock.json',
  '三神谜题': '/scripts/常见剧本/三神谜题-华稽.json',
  '公爵夫人的晚宴': '/scripts/常见剧本/公爵夫人的晚宴-Lei.json',
  '嚣张跋扈': '/scripts/常见剧本/嚣张跋扈-刘中奇.json',
  '地狱二重奏2.0': '/scripts/常见剧本/地狱二重奏2.0-钟楼剧本博物馆.json',
  '复活庆典': '/scripts/常见剧本/复活庆典-Zets.json',
  '大师之夜': '/scripts/常见剧本/大师之夜-王鑫.json',
  '奇异人生': '/scripts/常见剧本/奇异人生-海雾&奇异人生推理馆.json',
  '森罗万象': '/scripts/常见剧本/森罗万象-503.json',
  '横行霸道': '/scripts/常见剧本/横行霸道V5.0.json',
  '菜市场': '/scripts/常见剧本/菜市场v4-蓝铃兰.json',
  '飞越疯人院Ⅱ': '/scripts/常见剧本/飞越疯人院2-太一.json',
  'Idiocracy': '/scripts/常见剧本/Idiocracy v1.4 Allen.json',
  '赌徒悖论': '/scripts/自定义剧本/赌徒悖论.json',
  '横行霸道+': '/scripts/常见剧本/鸭镇制作《横行霸道+Ver.4.7》（集石魔典）.json',
  
  // 自定义剧本
  '一夜鱼龙舞': '/scripts/自定义剧本/一夜鱼龙舞3.2-驯鹿&痴愚.json',
  
  // 全员许愿
  '惊弓之鸟': '/scripts/全员许愿/惊弓之鸟.json',
};

// 预设剧本列表（用于展示）
export const SCRIPT_REPOSITORY: ScriptData[] = [
  // 常见剧本
  { id: '7xmyl', name: '7席谜案录', author: 'TrashWarlock', description: '常见剧本', jsonUrl: SCRIPT_MAP['7席谜案录'] },
  { id: 'ssmt', name: '三神谜题', author: '华稽', description: '常见剧本', jsonUrl: SCRIPT_MAP['三神谜题'] },
  { id: 'gfrdwy', name: '公爵夫人的晚宴', author: 'Lei', description: '常见剧本', jsonUrl: SCRIPT_MAP['公爵夫人的晚宴'] },
  { id: 'xzbd', name: '嚣张跋扈', author: '刘中奇', description: '常见剧本', jsonUrl: SCRIPT_MAP['嚣张跋扈'] },
  { id: 'dfecz', name: '地狱二重奏2.0', author: '钟楼剧本博物馆', description: '常见剧本', jsonUrl: SCRIPT_MAP['地狱二重奏2.0'] },
  { id: 'fhqd', name: '复活庆典', author: 'Zets', description: '常见剧本', jsonUrl: SCRIPT_MAP['复活庆典'] },
  { id: 'dsyy', name: '大师之夜', author: '王鑫', description: '常见剧本', jsonUrl: SCRIPT_MAP['大师之夜'] },
  { id: 'qyrs', name: '奇异人生', author: '海雾&奇异人生推理馆', description: '常见剧本', jsonUrl: SCRIPT_MAP['奇异人生'] },
  { id: 'slwx', name: '森罗万象', author: '503', description: '常见剧本', jsonUrl: SCRIPT_MAP['森罗万象'] },
  { id: 'hxbd', name: '横行霸道', author: '官方', description: '常见剧本', jsonUrl: SCRIPT_MAP['横行霸道'] },
  { id: 'csc', name: '菜市场', author: '蓝铃兰', description: '常见剧本', jsonUrl: SCRIPT_MAP['菜市场'] },
  { id: 'fyfry', name: '飞越疯人院Ⅱ', author: '太一', description: '常见剧本', jsonUrl: SCRIPT_MAP['飞越疯人院Ⅱ'] },
  { id: 'idiocracy', name: 'Idiocracy', author: 'Allen', description: '常见剧本', jsonUrl: SCRIPT_MAP['Idiocracy'] },
  { id: 'dtbl', name: '赌徒悖论', author: '未知', description: '常见剧本', jsonUrl: SCRIPT_MAP['赌徒悖论'] },
  { id: 'hxbd-plus', name: '横行霸道+', author: '鸭镇制作', description: '常见剧本', jsonUrl: SCRIPT_MAP['横行霸道+'] },
  
  // 自定义剧本
  { id: 'yylw', name: '一夜鱼龙舞', author: '驯鹿&痴愚', description: '自定义剧本', jsonUrl: SCRIPT_MAP['一夜鱼龙舞'] },
  
  // 全员许愿
  { id: 'jgzn', name: '惊弓之鸟', author: '未知', description: '全员许愿', jsonUrl: SCRIPT_MAP['惊弓之鸟'] },
];

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

