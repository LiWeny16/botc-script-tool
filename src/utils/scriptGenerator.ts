import type { Character, Script } from '../types';
import { CHARACTERS } from '../data/characters';
import { CHARACTERS_EN } from '../data/charactersEn';
import { hasJinx, getJinx } from '../data/jinx';
import { THEME_COLORS } from '../theme/colors';
import { normalizeCharacterId } from '../data/characterIdMapping';
import { configStore } from '../stores/ConfigStore';

/**
 * 根据角色名称查找角色ID
 * @param name 角色名称（中文或英文）
 * @param charactersDict 角色字典
 * @param language 当前语言
 * @param skipCrossLanguageSearch 是否跳过跨语言查找（防止无限递归）
 * @returns 找到的角色ID，如果没找到返回 null
 */
function findCharacterIdByName(
  name: string,
  charactersDict: Record<string, Character>,
  language: 'zh-CN' | 'en' = 'zh-CN',
  skipCrossLanguageSearch: boolean = false
): string | null {
  // 1. 优先查找当前语言字典的Name（核心场景）
  for (const [id, character] of Object.entries(charactersDict)) {
    if (character.name === name) {
      return id;
    }
  }

  // 2. 跨语言反向查找（实现对称核心）- 仅在首次调用时执行，防止无限递归
  if (!skipCrossLanguageSearch) {
    if (language === 'en') {
      // 英文模式：Name可能是中文，去中文库找ID再转英文ID
      const cnId = findCharacterIdByName(name, CHARACTERS, 'zh-CN', true);  // 传入 true 防止递归
      if (cnId) {
        const enId = normalizeCharacterId(cnId, 'en');
        return enId in CHARACTERS_EN ? enId : null;
      }
    } else {
      // 中文模式：Name可能是英文，去英文库找ID再转中文ID
      const enId = findCharacterIdByName(name, CHARACTERS_EN, 'en', true);  // 传入 true 防止递归
      if (enId) {
        const cnId = normalizeCharacterId(enId, 'zh-CN');
        return cnId in CHARACTERS ? cnId : null;
      }
    }
  }

  return null;
}

/**
 * 获取角色的行动顺序数值
 * @param characterId 角色ID
 * @param jsonItem JSON中的角色项（可能包含自定义的行动顺序）
 * @param currentLanguage 当前语言
 * @param officialIdParseMode 是否启用官方ID解析模式
 * @returns 包含 firstNight 和 otherNight 的对象
 */
function getNightOrderFromChinese(
  characterId: string,
  jsonItem: any,
  currentLanguage: 'zh-CN' | 'en',
  officialIdParseMode: boolean = false
): { firstNight: number; otherNight: number } {
  // 从JSON中获取自定义的行动顺序（如果有）
  const jsonFirstNight = jsonItem.firstNight;
  const jsonOtherNight = jsonItem.otherNight;

  // 如果开启了官方ID解析模式
  if (officialIdParseMode) {
    // 尝试找到官方角色
    const { dictKey, found } = getCharacterDictKey(
      jsonItem,
      currentLanguage,
      currentLanguage === 'en' ? CHARACTERS_EN : CHARACTERS,
      true
    );

    if (found) {
      // 找到了官方角色，使用官方数据（始终从中文库获取夜间顺序）
      const cnId = normalizeCharacterId(dictKey, 'zh-CN');
      
      let officialFirstNight = 0;
      let officialOtherNight = 0;

      if (CHARACTERS[cnId]) {
        officialFirstNight = CHARACTERS[cnId].firstNight || 0;
        officialOtherNight = CHARACTERS[cnId].otherNight || 0;
      } else if (CHARACTERS[dictKey]) {
        officialFirstNight = CHARACTERS[dictKey].firstNight || 0;
        officialOtherNight = CHARACTERS[dictKey].otherNight || 0;
      }

      // 官方ID解析模式：如果找到了官方角色，使用官方数据；否则回退到JSON数据
      return {
        firstNight: officialFirstNight,
        otherNight: officialOtherNight,
      };
    } else {
      // 找不到官方角色，使用JSON中的自定义数据
      return {
        firstNight: jsonFirstNight !== undefined ? (jsonFirstNight || 0) : 0,
        otherNight: jsonOtherNight !== undefined ? (jsonOtherNight || 0) : 0,
      };
    }
  }

  // 普通模式：JSON优先，JSON缺失时从中文官方库补充
  // 1. 先尝试从中文官方库获取默认值（作为回退）
  const cnId = normalizeCharacterId(characterId, 'zh-CN');
  let officialFirstNight = 0;
  let officialOtherNight = 0;

  // 始终从中文库（CHARACTERS）获取官方数据
  if (CHARACTERS[cnId]) {
    officialFirstNight = CHARACTERS[cnId].firstNight || 0;
    officialOtherNight = CHARACTERS[cnId].otherNight || 0;
  } else if (CHARACTERS[characterId]) {
    officialFirstNight = CHARACTERS[characterId].firstNight || 0;
    officialOtherNight = CHARACTERS[characterId].otherNight || 0;
  }

  // 2. JSON中有定义的字段优先使用JSON的值，否则使用官方库的值
  return {
    firstNight: jsonFirstNight !== undefined ? (jsonFirstNight || 0) : officialFirstNight,
    otherNight: jsonOtherNight !== undefined ? (jsonOtherNight || 0) : officialOtherNight,
  };
}

/**
 * 获取角色的字典键（考虑语言模式和匹配策略）
 * @param item JSON中的角色项
 * @param language 当前语言
 * @param charactersDict 当前语言的角色字典
 * @param officialIdParseMode 是否启用官方ID解析模式
 * @returns 字典中的键，如果找不到返回原始ID；同时返回是否找到
 */
function getCharacterDictKey(
  item: any,
  language: 'zh-CN' | 'en',
  charactersDict: Record<string, Character>,
  officialIdParseMode: boolean = false
): { dictKey: string; found: boolean } {
  // 英文模式：优先基于 id，回退到 name（支持跨语言查找）
  if (language === 'en') {
    // 1. 使用 id 字段查找（精确匹配优先）
    let dictKey = item.id;

    // 1.1 尝试直接匹配
    if (dictKey in charactersDict) {
      return { dictKey, found: true };
    }

    // 1.2 尝试使用ID映射（标准化到英文格式）
    const normalizedKey = normalizeCharacterId(item.id, language);
    if (normalizedKey in charactersDict) {
      return { dictKey: normalizedKey, found: true };
    }

    // 2. 如果 id 查找失败，尝试使用 name 查找（回退策略）
    if (item.name && typeof item.name === 'string') {
      // 2.1 先尝试在英文库中通过 name 查找（可能是英文name）
      const enIdByName = findCharacterIdByName(item.name, charactersDict, 'en');
      if (enIdByName) {
        return { dictKey: enIdByName, found: true };
      }

      // 2.2 尝试在中文库中通过 name 查找（可能是中文name），然后转换为英文ID
      const cnId = findCharacterIdByName(item.name, CHARACTERS, 'zh-CN');
      if (cnId) {
        // 将中文 ID 转换为英文 ID
        const enId = normalizeCharacterId(cnId, 'en');
        // 在英文库中查找
        if (enId in charactersDict) {
          return { dictKey: enId, found: true };
        }
        // 转换后的 ID 也找不到，尝试直接用原 cnId
        if (cnId in charactersDict) {
          return { dictKey: cnId, found: true };
        }
      }
    }

    // 3. 如果都找不到，返回原始ID和未找到标记
    return { dictKey: item.id, found: false };
  }

  // 中文模式：优先基于 id，回退到 name
  // 1. 使用 id 字段查找（精确匹配优先）
  let dictKey = item.id;

  // 1.1 尝试直接匹配
  if (dictKey in charactersDict) {
    return { dictKey, found: true };
  }

  // 1.2 尝试使用ID映射（标准化到中文格式）
  const normalizedKey = normalizeCharacterId(item.id, language);
  if (normalizedKey in charactersDict) {
    return { dictKey: normalizedKey, found: true };
  }

  // 2. 如果 id 查找失败，尝试使用 name 查找（回退策略）
  if (item.name && typeof item.name === 'string') {
    const foundId = findCharacterIdByName(item.name, charactersDict, language);
    if (foundId) {
      return { dictKey: foundId, found: true };
    }
  }

  // 3. 如果都找不到，返回原始ID和未找到标记
  return { dictKey: item.id, found: false };
}

// 解析 JSON 并生成剧本对象
export function generateScript(jsonString: string, language: 'zh-CN' | 'en' = 'zh-CN'): Script {
  const json = JSON.parse(jsonString);

  if (!Array.isArray(json)) {
    throw new Error('JSON 必须是数组格式');
  }

  // 根据语言选择角色字典
  const charactersDict = language === 'en' ? CHARACTERS_EN : CHARACTERS;

  // 获取官方ID解析模式配置
  const officialIdParseMode = configStore.config.officialIdParseMode;

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
      loric: [],
    },
    firstnight: [
      {
        image: '/imgs/icons/75px-Dusk.png',
        index: 0,
      },
      {
        image: '/imgs/icons/75px-Mi.png',
        index: 0.0001,
      },
      {
        image: '/imgs/icons/75px-Di.png',
        index: 0.0002,
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

  // 收集所有的相克规则项，延后处理
  const jinxItems: Array<any> = [];

  for (let item of json) {
    // 支持简化格式：如果 item 是字符串，转换为对象
    if (typeof item === 'string') {
      item = { id: item };
    }

    // 处理元数据
    if (item.id === '_meta') {
      script.title = item.name || '自定义剧本';
      script.titleEn = item.titleEn || item.title_en || item.nameEn || item.name_en;  // 解析英文标题（支持多种字段名）
      script.titleImage = item.titleImage || item.logo;  // 支持 titleImage 或 logo 字段
      script.titleImageSize = item.titleImageSize;  // 解析第一页标题图片大小
      script.useTitleImage = item.use_title_image !== false ? !!script.titleImage : false;  // 默认根据是否有图片判断
      script.author = item.author || '';
      script.playerCount = item.playerCount;  // 解析玩家人数

      // 解析第二页配置
      script.secondPageTitle = item.second_page_title;
      script.secondPageTitleText = item.second_page_title_text;
      script.secondPageTitleImage = item.second_page_title_image;
      script.secondPageTitleFontSize = item.second_page_title_font_size;
      script.secondPageTitleImageSize = item.second_page_title_image_size;
      script.useSecondPageTitleImage = item.use_second_page_title_image !== false ? !!script.secondPageTitleImage : false;  // 默认根据是否有图片判断
      script.secondPagePplTable1 = item.second_page_ppl_table1;
      script.secondPagePplTable2 = item.second_page_ppl_table2;
      // 解析第二页组件顺序
      if (item.second_page_order && typeof item.second_page_order === 'string') {
        script.secondPageOrder = item.second_page_order.split(' ').filter((s: string) => s.length > 0);
      }

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
    let officialId: string | null = null; // 保存官方ID，用于后续查询相克关系

    // 使用新的智能匹配函数获取字典键和匹配结果
    // 中文模式：优先基于 name，回退到 id
    // 英文模式：基于 id，但在官方解析模式下会先尝试通过中文 name 查找
    const { dictKey, found } = getCharacterDictKey(item, language, charactersDict, officialIdParseMode);

    // 根据是否找到和官方ID解析模式决定角色信息来源
    if (found) {
      officialId = dictKey; // 保存官方ID

      if (officialIdParseMode) {
        // 官方ID解析模式：完全使用官方数据，忽略JSON中的自定义信息
        character = { ...charactersDict[dictKey] };
        character.id = item.id; // 保持原始ID
        // 只保留 team 字段（如果JSON中有自定义team）
        if (item.team) {
          character.team = item.team;
        }
      } else {
        // 普通模式：JSON自定义信息优先，但如果JSON中没有image字段，使用官方数据
        if (!item.image) {
          character = { ...charactersDict[dictKey], ...item };
          character.id = item.id; // 保持原始ID
        }
      }
    } else {
      // 如果字典中找不到，使用 JSON 中的完整信息（自定义角色）
      // 这种情况下 character 已经等于 item，不需要额外处理
      console.warn(`角色 "${item.id}" (name: "${item.name || 'N/A'}") 在字典中未找到，使用JSON自定义数据`);
    }

    // 将官方ID保存到角色对象中（作为内部属性，用于相克规则查询）
    if (officialId) {
      (character as any)._officialId = officialId;
    }

    // 处理相克规则 - 先收集，稍后统一处理
    if (item.team === 'a jinxed') {
      jinxItems.push(item);
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

      // ⭐ 获取行动顺序：根据模式决定是否使用JSON自定义或官方数据
      const nightOrder = getNightOrderFromChinese(character.id, item, language, officialIdParseMode);

      // ⭐ 统一处理角色字段：应用与夜间顺序相同的解析逻辑
      // 官方ID解析模式：如果找到官方角色用官方数据，否则用JSON数据
      // 普通模式：JSON优先，缺失时从官方数据补充
      let finalCharacter: Character;
      
      if (officialIdParseMode) {
        if (found) {
          // 找到官方角色：使用官方数据
          finalCharacter = {
            ...charactersDict[dictKey],
            id: character.id, // 保持原始ID
            team: item.team || charactersDict[dictKey].team, // JSON中的team优先
            firstNight: 0, // 这些会在后面从nightOrder获取
            otherNight: 0,
          };
        } else {
          // 没找到官方角色：使用JSON数据
          finalCharacter = {
            ...character, // character已经是item了
            firstNight: 0, // 确保有这些字段
            otherNight: 0,
          };
        }
      } else {
        // 普通模式：JSON优先，缺失时从官方数据补充
        if (found) {
          const officialChar = charactersDict[dictKey];
          // 手动合并每个字段：JSON有则用JSON，没有则用官方数据
          finalCharacter = {
            id: character.id, // 保持原始ID
            name: item.name !== undefined && item.name !== null && item.name !== '' ? item.name : officialChar.name,
            ability: item.ability !== undefined && item.ability !== null && item.ability !== '' ? item.ability : officialChar.ability,
            image: item.image !== undefined && item.image !== null && item.image !== '' ? item.image : officialChar.image,
            team: item.team !== undefined && item.team !== null ? item.team : officialChar.team,
            teamColor: item.teamColor !== undefined ? item.teamColor : officialChar.teamColor,
            // 对于可能为空的数组/字符串，使用 !== undefined 判断即可（允许空值）
            firstNightReminder: item.firstNightReminder !== undefined ? item.firstNightReminder : officialChar.firstNightReminder,
            otherNightReminder: item.otherNightReminder !== undefined ? item.otherNightReminder : officialChar.otherNightReminder,
            reminders: item.reminders !== undefined ? item.reminders : officialChar.reminders,
            remindersGlobal: item.remindersGlobal !== undefined ? item.remindersGlobal : officialChar.remindersGlobal,
            setup: item.setup !== undefined ? item.setup : officialChar.setup,
            // 添加firstNight和otherNight（这些会在后面从nightOrder获取，这里先用0占位）
            firstNight: 0,
            otherNight: 0,
          };
        } else {
          // 没找到官方角色：完全使用JSON数据
          finalCharacter = {
            ...character,
            firstNight: 0, // 确保有这些字段
            otherNight: 0,
          };
        }
      }

      // 保存官方ID到finalCharacter
      if (officialId) {
        (finalCharacter as any)._officialId = officialId;
      }

      // 推送到all数组（使用处理后的角色数据）
      script.all.push(finalCharacter);

      // 推送到对应团队数组
      script.characters[finalCharacter.team].push({
        name: finalCharacter.name,
        ability: finalCharacter.ability,
        image: finalCharacter.image,
        id: finalCharacter.id,
        team: finalCharacter.team,
        teamColor: finalCharacter.teamColor,  // 保存自定义颜色
        firstNight: nightOrder.firstNight,
        otherNight: nightOrder.otherNight,
        firstNightReminder: finalCharacter.firstNightReminder,
        otherNightReminder: finalCharacter.otherNightReminder,
        reminders: finalCharacter.reminders,
        remindersGlobal: finalCharacter.remindersGlobal,  // 保存全局提醒标记
        setup: finalCharacter.setup,
      });

      // 标准团队类型中，传奇角色和旅行者不参与夜晚行动顺序
      // 未知团队类型默认不参与夜晚行动
      const standardTeams: string[] = ['townsfolk', 'outsider', 'minion', 'demon'];
      if (standardTeams.includes(finalCharacter.team)) {
        // ⭐ 添加首夜行动：使用从中文库获取的数值
        if (nightOrder.firstNight && nightOrder.firstNight > 0) {
          script.firstnight.push({
            image: finalCharacter.image,
            index: nightOrder.firstNight,
          });
        }

        // ⭐ 添加其他夜晚行动：使用从中文库获取的数值
        if (nightOrder.otherNight && nightOrder.otherNight > 0) {
          script.othernight.push({
            image: finalCharacter.image,
            index: nightOrder.otherNight,
          });
        }
      }
    }
  }

  // 处理自定义相克规则（在所有角色解析完成后）
  for (const item of jinxItems) {
    // 辅助函数：根据ID查找角色名称（无论中英文都返回name）
    const findCharacterName = (id: string): string | null => {
      // 1. 在已解析的角色列表中查找（优先，因为包含了所有映射关系）
      // 先尝试通过原始ID查找
      let foundChar = script.all.find(c => c.id === id);
      if (foundChar) {
        return foundChar.name;
      }

      // 再尝试通过官方ID查找
      foundChar = script.all.find(c => (c as any)._officialId === id);
      if (foundChar) {
        return foundChar.name;
      }

      // 2. 尝试从官方角色库查找
      const officialChar = charactersDict[id];
      if (officialChar) {
        return officialChar.name;
      }

      // 3. 尝试使用ID映射
      const normalizedId = normalizeCharacterId(id, language);
      const mappedChar = charactersDict[normalizedId];
      if (mappedChar) {
        return mappedChar.name;
      }

      // 4. 都找不到，返回null
      return null;
    };

    // 新格式：使用 jinx 数组
    if (item.jinx && Array.isArray(item.jinx)) {
      // 获取主角色名称
      const mainCharName = findCharacterName(item.id);
      if (!mainCharName) {
        console.warn(`相克规则中的主角色 "${item.id}" 未找到，跳过该相克关系`);
        continue;
      }

      item.jinx.forEach((jinxEntry: any) => {
        const targetCharName = findCharacterName(jinxEntry.id);
        if (!targetCharName) {
          console.warn(`相克规则中的目标角色 "${jinxEntry.id}" 未找到，跳过该相克关系`);
          return;
        }

        // 优先使用 reason，如果没有则使用 reasonEn
        const description = jinxEntry.reason || jinxEntry.reasonEn || '';
        
        // 从JSON中提取 display 字段（默认为true）
        const display = jinxEntry.display !== false;  // 只有显式设置为false才隐藏

        // 存储双向关系，与官方相克逻辑保持一致
        // 方向1: mainCharName -> targetCharName
        if (!script.jinx[mainCharName]) {
          script.jinx[mainCharName] = {};
        }
        script.jinx[mainCharName][targetCharName] = {
          reason: description,
          display: display,
          isOfficial: false,  // 自定义相克
        };

        // 方向2: targetCharName -> mainCharName（反向关系）
        if (!script.jinx[targetCharName]) {
          script.jinx[targetCharName] = {};
        }
        script.jinx[targetCharName][mainCharName] = {
          reason: description,
          display: display,
          isOfficial: false,  // 自定义相克
        };
      });
    }
    // 旧格式：使用 name 字段和 & 分隔符（向后兼容）
    else if (item.name && typeof item.name === 'string' && item.name.includes('&')) {
      const [charA, charB] = item.name.split('&');
      const description = item.ability || '';

      // 存储双向关系
      if (!script.jinx[charA]) script.jinx[charA] = {};
      script.jinx[charA][charB] = {
        reason: description,
        display: true,
        isOfficial: false,
      };

      if (!script.jinx[charB]) script.jinx[charB] = {};
      script.jinx[charB][charA] = {
        reason: description,
        display: true,
        isOfficial: false,
      };
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
        // 获取用于查询相克关系的key
        // 优先使用保存的官方ID，如果没有则回退到原始逻辑
        let keyA: string;
        let keyB: string;

        if (language === 'en') {
          // 英文模式：优先使用官方ID，否则使用原始ID
          keyA = (charA as any)._officialId || charA.id;
          keyB = (charB as any)._officialId || charB.id;
        } else {
          // 中文模式：使用角色名称
          keyA = charA.name;
          keyB = charB.name;
        }

        if (hasJinx(keyA, keyB, language)) {
          // 存储相克关系：统一使用角色的name字段作为key
          const nameA = charA.name;
          const nameB = charB.name;

          if (!script.jinx[nameA]) {
            script.jinx[nameA] = {};
          }
          if (!script.jinx[nameA][nameB]) {
            // 官方相克规则，默认显示
            script.jinx[nameA][nameB] = {
              reason: getJinx(keyA, keyB, language),
              display: true,
              isOfficial: true,
            };
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
export function highlightAbilityText(text: string, language: 'zh-CN' | 'en' = 'zh-CN'): string {
  // 防御性检查：如果 text 为 undefined 或 null，返回空字符串
  if (!text) {
    return '';
  }

  // 中文关键词
  const redKeywordsCN = [
    '未正常生效', '选择或影响', '死于处决', '恶魔角色', '爪牙角色',
    '邪恶玩家', '邪恶阵营', '邪恶角色', '"是恶魔"', '负面能力',
    '小恶魔', '小怪宝', '维齐尔', '被处决', '杀死',
    '死亡', '邪恶', '落败', '中毒', '爪牙', '恶魔', '处决',
    '错误', '自杀', '暴乱', '军团', '代价', '伪装',
    '作弊',
  ];

  const blueKeywordsCN = [
    '外来者角色', '善良玩家', '善良阵营', '善良角色', '镇民角色',
    '恢复健康', '起死回生', '落难少女', '有且只有', '有多准确',
    '守夜人', '外来者', '农夫', '书生', '疯子', '国王',
    '醉酒', '复活', '反刍', '镇民', '善良', '正确', '存活', '获胜', '大法官', '暗影筹码', '梭哈',
  ];

  const purpleKeywordsCN = ['非旅行者', '旅行者', '疯狂'];

  // 英文关键词
  const redKeywordsEN = [
    'not work correctly', 'not functioning', 'affect or choose',
    'evil', 'negative ability',
    'executed', 'execution', 'Demon', 'Minion', 'Evil',
    'poisoned', 'poison',
    'Vizier', 'false'
  ];

  const blueKeywordsEN = [
    'drunk', 'good', 'Tea Lady',
    'Outsider', 'Good', 'Townsfolk',
    'healthy', 'sober', 'alive', 'lives', 'survive',
    'resurrect', 'regurgitate',
  ];

  const purpleKeywordsEN = [
    'Travellers', 'Traveler',
    'mad', 'madness',
  ];

  // 根据语言选择对应的关键词列表
  let redKeywords = language === 'zh-CN' ? redKeywordsCN : redKeywordsEN;
  let blueKeywords = language === 'zh-CN' ? blueKeywordsCN : blueKeywordsEN;
  let purpleKeywords = language === 'zh-CN' ? purpleKeywordsCN : purpleKeywordsEN;

  // 转义正则表达式特殊字符的辅助函数
  const escapeRegex = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // 英文需要按长度排序（长的在前），避免短词先被替换导致长短语无法匹配
  if (language === 'en') {
    redKeywords = [...redKeywords].sort((a, b) => b.length - a.length);
    blueKeywords = [...blueKeywords].sort((a, b) => b.length - a.length);
    purpleKeywords = [...purpleKeywords].sort((a, b) => b.length - a.length);
  }

  let result = text;

  // 英文需要使用单词边界匹配，中文直接替换
  if (language === 'en') {
    // 英文：使用正则表达式确保只匹配完整单词
    redKeywords.forEach((keyword) => {
      const escapedKeyword = escapeRegex(keyword);
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
      result = result.replace(regex, (match) =>
        `<span style="color: ${THEME_COLORS.evil}; font-weight: 700;">${match}</span>`
      );
    });

    blueKeywords.forEach((keyword) => {
      const escapedKeyword = escapeRegex(keyword);
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
      result = result.replace(regex, (match) =>
        `<span style="color: ${THEME_COLORS.good}; font-weight: 700;">${match}</span>`
      );
    });

    purpleKeywords.forEach((keyword) => {
      const escapedKeyword = escapeRegex(keyword);
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
      result = result.replace(regex, (match) =>
        `<span style="color: ${THEME_COLORS.purple}; font-weight: 700;">${match}</span>`
      );
    });
  } else {
    // 中文：直接替换
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
  }

  return result;
}
