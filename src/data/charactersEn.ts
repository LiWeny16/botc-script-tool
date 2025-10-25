import rolesData from './roles.json';
import { normalizeCharacterId } from './characterIdMapping';

// 从 roles.json 创建英文角色字典
const _charactersEn: Record<string, any> = {};

rolesData.forEach((role: any) => {
  // 获取中文格式的ID用于图片URL（所有图片都使用中文ID格式，即带下划线的格式）
  const imageId = normalizeCharacterId(role.id, 'zh-CN');
  
  _charactersEn[role.id] = {
    id: role.id,
    name: role.name || role.id,
    edition: role.edition || 'custom',
    team: role.team,
    ability: role.ability || '',
    firstNight: role.firstNight || 0,
    otherNight: role.otherNight || 0,
    firstNightReminder: role.firstNightReminder || '',
    otherNightReminder: role.otherNightReminder || '',
    reminders: role.reminders || [],
    remindersGlobal: role.remindersGlobal || [],
    setup: role.setup || false,
    // 优先使用 roles.json 中定义的 image，否则使用中文ID格式生成默认图片链接
    // 所有图片都使用中文ID规范（带下划线），如 fortune_teller.png, no_dashii.png
    image: role.image || `https://oss.gstonegames.com/data_file/clocktower/web/icons/${imageId}.png`,
  };
});

// 导入传奇角色
import { getFabledCharacters } from './fabled';

// 将传奇角色整合到角色字典中
const fabledCharacters = getFabledCharacters('en');
const fabledDict = fabledCharacters.reduce((acc, char) => {
  acc[char.id] = char;
  return acc;
}, {} as any);

export const CHARACTERS_EN: any = { ..._charactersEn, ...fabledDict };

