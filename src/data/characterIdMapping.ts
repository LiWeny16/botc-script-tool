// 中英文角色ID映射表
// 用于解决官方中英文导出JSON时ID不一致的问题

// 中文ID -> 英文ID 的映射
export const CN_TO_EN_ID_MAP: Record<string, string> = {
  // 中文使用下划线，英文连在一起的情况
  'fortune_teller': 'fortuneteller',
  'scarlet_woman': 'scarletwoman', 
  'tea_lady': 'tealady',
  'snake_charmer': 'snakecharmer',
  'town_crier': 'towncrier',
  'evil_twin': 'eviltwin',
  'bone_collector': 'bonecollector',
  'bounty_hunter': 'bountyhunter',
  'cult_leader': 'cultleader',
  'poppy_grower': 'poppygrower',
  'devils_advocate': 'devilsadvocate',
  'pit_hag': 'pithag',
  'fang_gu': 'fanggu',
  'no_dashii': 'nodashii',
  'lil_monsta': 'lilmonsta',
  'al_hadikhia': 'alhadikhia',
  'lord_of_typhon': 'lordoftyphon',
};

// 英文ID -> 中文ID 的映射（反向映射）
export const EN_TO_CN_ID_MAP: Record<string, string> = {};
Object.entries(CN_TO_EN_ID_MAP).forEach(([cnId, enId]) => {
  EN_TO_CN_ID_MAP[enId] = cnId;
});

// 统一化角色ID的函数
export function normalizeCharacterId(id: string, targetLanguage: 'zh-CN' | 'en'): string {
  if (targetLanguage === 'en') {
    // 转换为英文ID
    return CN_TO_EN_ID_MAP[id] || id;
  } else {
    // 转换为中文ID
    return EN_TO_CN_ID_MAP[id] || id;
  }
}

// 检查两个ID是否指向同一个角色
export function isSameCharacter(id1: string, id2: string): boolean {
  const normalizedId1En = normalizeCharacterId(id1, 'en');
  const normalizedId2En = normalizeCharacterId(id2, 'en');
  return normalizedId1En === normalizedId2En;
}
