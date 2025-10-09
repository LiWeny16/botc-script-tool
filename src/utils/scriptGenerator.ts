import type { Character, Script } from '../types';
import { CHARACTERS } from '../data/characters';
import { hasJinx, getJinx } from '../data/jinx';
import { THEME_COLORS } from '../theme/colors';

// 解析 JSON 并生成剧本对象
export function generateScript(jsonString: string): Script {
  const json = JSON.parse(jsonString);
  
  if (!Array.isArray(json)) {
    throw new Error('JSON 必须是数组格式');
  }

  const script: Script = {
    title: '自定义剧本',
    author: '',
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
        image: 'https://clocktower-wiki.gstonegames.com/images/thumb/5/5d/Dusk.png/75px-Dusk.png',
        index: 0,
      },
      {
        image: 'https://clocktower-wiki.gstonegames.com/images/thumb/8/85/Mi.png/75px-Mi.png',
        index: 1,
      },
      {
        image: 'https://clocktower-wiki.gstonegames.com/images/thumb/1/18/Di.png/75px-Di.png',
        index: 2,
      },
    ],
    othernight: [
      {
        image: 'https://clocktower-wiki.gstonegames.com/images/thumb/5/5d/Dusk.png/75px-Dusk.png',
        index: 0,
      },
    ],
    jinx: {},
    all: [],
    specialRules: [],
  };

  for (const item of json) {
    // 处理元数据
    if (item.id === '_meta') {
      script.title = item.name || '自定义剧本';
      script.author = item.author || '';
      continue;
    }

    // 处理特殊说明卡片
    if (item.team === 'special_rule') {
      script.specialRules.push({
        id: item.id,
        title: item.title || item.name,
        content: item.content || item.ability,
        rules: item.rules,  // 支持多个规则项
      });
      continue;
    }

    // 从字典中获取角色信息，或使用 JSON 中的完整信息
    let character: Character = item;
    if (item.id in CHARACTERS && !item.image) {
      character = { ...CHARACTERS[item.id], ...item };
    }

    // 处理相克规则
    if (item.team === 'a jinxed') {
      const [charA, charB] = item.name.split('&');
      if (!script.jinx[charA]) script.jinx[charA] = {};
      script.jinx[charA][charB] = item.ability;
      continue;
    }

    // 处理普通角色、传奇角色和旅行者
    if (character.team && character.team in script.characters) {
      script.all.push(character);
      
      const teamKey = character.team as keyof typeof script.characters;
      script.characters[teamKey].push({
        name: character.name,
        ability: character.ability,
        image: character.image,
        id: character.id,
        team: character.team,
        firstNight: character.firstNight || 0,
        otherNight: character.otherNight || 0,
      });

      // 传奇角色和旅行者不参与夜晚行动顺序
      if (character.team !== 'fabled' && character.team !== 'traveler') {
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

  // 自动检查角色间的相克关系
  for (const charA of script.all) {
    for (const charB of script.all) {
      if (charA.name !== charB.name && hasJinx(charA.name, charB.name)) {
        if (!script.jinx[charA.name]) {
          script.jinx[charA.name] = {};
        }
        if (!script.jinx[charA.name][charB.name]) {
          script.jinx[charA.name][charB.name] = getJinx(charA.name, charB.name);
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
  const redKeywords = [
    '未正常生效', '选择或影响', '死于处决', '恶魔角色', '爪牙角色',
    '邪恶玩家', '邪恶阵营', '邪恶角色', '"是恶魔"', '负面能力',
    '小恶魔', '小怪宝', '狐媚娘', '维齐尔', '被处决', '杀死',
    '死亡', '邪恶', '落败', '中毒', '爪牙', '恶魔', '处决',
    '错误', '自杀', '暴乱', '军团', '代价', '伪装',
  ];

  const blueKeywords = [
    '外来者角色', '善良玩家', '善良阵营', '善良角色', '镇民角色',
    '恢复健康', '起死回生', '落难少女', '有且只有', '有多准确',
    '守夜人', '外来者', '农夫', '书生', '疯子', '国王',
    '醉酒', '复活', '反刍', '镇民', '善良', '正确', '存活', '获胜',
  ];

  const purpleKeywords = ['非旅行者', '旅行者', '"疯狂"'];

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
