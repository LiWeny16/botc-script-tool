import rolesData from './roles.json';

// 从 roles.json 创建英文角色字典
const _charactersEn: Record<string, any> = {};

rolesData.forEach((role: any) => {
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
    // 优先使用 roles.json 中定义的 image，否则使用默认格式
    // 这样可以处理特殊情况，如 no_dashii.png
    image: role.image || `https://oss.gstonegames.com/data_file/clocktower/web/icons/${role.id}.png`,
  };
});

export const CHARACTERS_EN: any = _charactersEn;

