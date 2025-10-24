import type { Character, Script } from '../types';
import { CHARACTERS } from '../data/characters';
import { CHARACTERS_EN } from '../data/charactersEn';
import { hasJinx, getJinx } from '../data/jinx';
import { THEME_COLORS } from '../theme/colors';
import { normalizeCharacterId } from '../data/characterIdMapping';

// 解析 JSON 并生成剧本对象
export function generateScript(jsonString: string, language: 'zh-CN' | 'en' = 'zh-CN'): Script {
  const json = JSON.parse(jsonString);

  if (!Array.isArray(json)) {
    throw new Error('JSON 必须是数组格式');
  }

  // 根据语言选择角色字典
  const charactersDict = language === 'en' ? CHARACTERS_EN : CHARACTERS;

  const script: Script = {
    title: '自定义剧本',
    titleImage: undefined,
    author: '',
    playerCount: undefined,
    characters: {
      townsfolk: [],
      outsider: [],
      minion: [],
      demon: [],
      fabled: [],
      traveler: [],
    },
    firstnight: [
      {
        image: '/imgs/icons/75px-Dusk.png',
        index: 0,
      },
      {
        image: '/imgs/icons/75px-Mi.png',
        index: 1,
      },
      {
        image: '/imgs/icons/75px-Di.png',
        index: 2,
      },
    ],
    othernight: [
      {
        image: '/imgs/icons/75px-Dusk.png',
        index: 0,
      },
    ],
    jinx: {},
    all: [],
    specialRules: [],
    secondPageRules: [],
  };

  // 收集所有的特殊规则（state + special_rule），用于统一处理
  const allMetaRules: Array<{
    id?: string;
    title: string;
    content: string;
    rules?: any[];
    sourceType: 'state' | 'status' | 'special_rule';
    sourceIndex: number;
  }> = [];

  for (let item of json) {
    // 支持简化格式：如果 item 是字符串，转换为对象
    if (typeof item === 'string') {
      item = { id: item };
    }

    // 处理元数据
    if (item.id === '_meta') {
      script.title = item.name || '自定义剧本';
      script.titleImage = item.titleImage || item.logo;  // 支持 titleImage 或 logo 字段
      script.subtitle = item.subtitle;  // 解析副标题
      script.author = item.author || '';
      script.playerCount = item.playerCount;  // 解析玩家人数
      
      // 处理 state 字段
      if (item.state && Array.isArray(item.state)) {
        item.state.forEach((state: any, index: number) => {
          allMetaRules.push({
            id: `_meta_state_${index}`,
            title: state.stateName,
            content: state.stateDescription,
            sourceType: 'state',
            sourceIndex: index,
          });
        });
      }
      
      // 处理 status 字段
      if (item.status && Array.isArray(item.status)) {
        item.status.forEach((status: any, index: number) => {
          allMetaRules.push({
            id: `_meta_status_${index}`,
            title: status.name,
            content: status.skill,
            sourceType: 'status',
            sourceIndex: index,
          });
        });
      }
      
      continue;
    }

    // 处理特殊说明卡片 (team = 'special_rule')
    if (item.team === 'special_rule') {
      allMetaRules.push({
        id: item.id,
        title: item.title || item.name,
        content: item.content || item.ability,
        rules: item.rules,
        sourceType: 'special_rule',
        sourceIndex: allMetaRules.length,
      });
      continue;
    }

    // 从字典中获取角色信息，或使用 JSON 中的完整信息
    let character: Character = item;

    // 尝试直接匹配ID
    let dictKey = item.id;
    if (!(dictKey in charactersDict)) {
      // 如果直接匹配失败，尝试使用ID映射
      dictKey = normalizeCharacterId(item.id, language);
    }

    if (dictKey in charactersDict && !item.image) {
      character = { ...charactersDict[dictKey], ...item };
      // 保持原始ID，这样用户的JSON格式不会被改变
      character.id = item.id;
    }

    // 处理相克规则
    if (item.team === 'a jinxed') {
      const [charA, charB] = item.name.split('&');
      if (!script.jinx[charA]) script.jinx[charA] = {};
      script.jinx[charA][charB] = item.ability;
      continue;
    }

    // 处理所有角色（包括未知team类型）
    if (character.team) {
      // 检查是否已存在相同ID的角色
      const existsInAll = script.all.some(c => c.id === character.id);
      if (existsInAll) {
        console.warn(`跳过重复的角色ID: ${character.id}`);
        continue;
      }

      script.all.push(character);

      // 如果team不存在，自动创建数组
      if (!script.characters[character.team]) {
        script.characters[character.team] = [];
      }

      // 检查团队中是否已存在相同ID的角色
      const existsInTeam = script.characters[character.team].some(c => c.id === character.id);
      if (existsInTeam) {
        console.warn(`跳过团队 ${character.team} 中重复的角色ID: ${character.id}`);
        continue;
      }

      script.characters[character.team].push({
        name: character.name,
        ability: character.ability,
        image: character.image,
        id: character.id,
        team: character.team,
        teamColor: character.teamColor,  // 保存自定义颜色
        firstNight: character.firstNight || 0,
        otherNight: character.otherNight || 0,
      });

      // 标准团队类型中，传奇角色和旅行者不参与夜晚行动顺序
      // 未知团队类型默认不参与夜晚行动
      const standardTeams: string[] = ['townsfolk', 'outsider', 'minion', 'demon'];
      if (standardTeams.includes(character.team)) {
        // 添加首夜行动
        if (character.firstNight && character.firstNight > 0) {
          script.firstnight.push({
            image: character.image,
            index: character.firstNight,
          });
        }

        // 添加其他夜晚行动
        if (character.otherNight && character.otherNight > 0) {
          script.othernight.push({
            image: character.image,
            index: character.otherNight,
          });
        }
      }
    }
  }

  // 统一处理所有特殊规则（state + status + special_rule）
  // 1. 去重：根据 title 去重
  const uniqueRules = allMetaRules.filter((rule, index, self) => 
    index === self.findIndex((r) => r.title === rule.title)
  );

  // 2. 第一条特殊规则：同时放到第一页和第二页
  if (uniqueRules.length > 0) {
    const firstRule = uniqueRules[0];
    const firstRuleData = {
      id: firstRule.id || `_meta_${firstRule.sourceType}_${firstRule.sourceIndex}`,
      title: firstRule.title,
      content: firstRule.content,
      rules: firstRule.rules,
      isState: firstRule.sourceType !== 'special_rule',
      sourceType: firstRule.sourceType,
      sourceIndex: firstRule.sourceIndex,
    };
    
    // 第一页显示第一条规则
    script.specialRules.push(firstRuleData);
    
    // 第二页也显示第一条规则
    script.secondPageRules?.push({ ...firstRuleData });
  }

  // 3. 第二条及之后的规则：只放到第二页
  if (uniqueRules.length > 1) {
    for (let i = 1; i < uniqueRules.length; i++) {
      const rule = uniqueRules[i];
      script.secondPageRules?.push({
        id: rule.id || `_meta_${rule.sourceType}_${rule.sourceIndex}`,
        title: rule.title,
        content: rule.content,
        rules: rule.rules,
        isState: rule.sourceType !== 'special_rule',
        sourceType: rule.sourceType,
        sourceIndex: rule.sourceIndex,
      });
    }
  }

  // 自动检查角色间的相克关系
  for (const charA of script.all) {
    for (const charB of script.all) {
      if (charA.id !== charB.id) {
        // 英文模式下使用角色ID进行相克检查
        const keyA = language === 'en' ? charA.id : charA.name;
        const keyB = language === 'en' ? charB.id : charB.name;

        if (hasJinx(keyA, keyB, language)) {
          const nameA = charA.name;
          const nameB = charB.name;

          if (!script.jinx[nameA]) {
            script.jinx[nameA] = {};
          }
          if (!script.jinx[nameA][nameB]) {
            script.jinx[nameA][nameB] = getJinx(keyA, keyB, language);
          }
        }
      }
    }
  }

  // 按行动顺序排序
  script.firstnight.sort((a, b) => a.index - b.index);
  script.othernight.sort((a, b) => a.index - b.index);

  return script;
}

// 高亮能力文本中的关键词
export function highlightAbilityText(text: string): string {
  // 防御性检查：如果 text 为 undefined 或 null，返回空字符串
  if (!text) {
    return '';
  }

  const redKeywords = [
    '未正常生效', '选择或影响', '死于处决', '恶魔角色', '爪牙角色',
    '邪恶玩家', '邪恶阵营', '邪恶角色', '"是恶魔"', '负面能力',
    '小恶魔', '小怪宝', '狐媚娘', '维齐尔', '被处决', '杀死',
    '死亡', '邪恶', '落败', '中毒', '爪牙', '恶魔', '处决',
    '错误', '自杀', '暴乱', '军团', '代价', '伪装',
    '作弊',
  ];

  const blueKeywords = [
    '外来者角色', '善良玩家', '善良阵营', '善良角色', '镇民角色',
    '恢复健康', '起死回生', '落难少女', '有且只有', '有多准确',
    '守夜人', '外来者', '农夫', '书生', '疯子', '国王',
    '醉酒', '复活', '反刍', '镇民', '善良', '正确', '存活', '获胜', '大法官','暗影筹码','梭哈',
  ];

  const purpleKeywords = ['非旅行者', '旅行者', '疯狂'];

  let result = text;

  redKeywords.forEach((keyword) => {
    result = result.replaceAll(
      keyword,
      `<span style="color: ${THEME_COLORS.evil}; font-weight: 700;">${keyword}</span>`
    );
  });

  blueKeywords.forEach((keyword) => {
    result = result.replaceAll(
      keyword,
      `<span style="color: ${THEME_COLORS.good}; font-weight: 700;">${keyword}</span>`
    );
  });

  purpleKeywords.forEach((keyword) => {
    result = result.replaceAll(
      keyword,
      `<span style="color: ${THEME_COLORS.purple}; font-weight: 700;">${keyword}</span>`
    );
  });

  return result;
}
