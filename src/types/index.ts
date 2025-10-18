// 角色类型定义 - 标准团队类型
export type StandardTeam = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler' | 'fabled';

// 扩展团队类型 - 包括任意字符串以支持自定义团队
export type Team = StandardTeam | string;

export interface Character {
  id: string;
  name: string;
  ability: string;
  team: Team;
  teamColor?: string;  // 自定义团队颜色（可选）
  image: string;
  firstNight: number;
  otherNight: number;
  firstNightReminder?: string;
  otherNightReminder?: string;
  reminders?: string[];
  setup?: boolean;
}

export interface NightAction {
  image: string;
  index: number;
}

export interface ScriptMeta {
  name: string;
  author: string;
}

// 特殊说明卡片项
export interface SpecialRuleItem {
  title: string;
  content: string;
}

// 特殊说明卡片（可包含多个规则项）
export interface SpecialRule {
  id: string;
  title?: string;  // 卡片标题（可选，如果没有则显示第一个规则项的标题）
  rules?: SpecialRuleItem[];  // 多个规则项
  content?: string;  // 单个规则内容（向后兼容）
}

export interface Script {
  title: string;
  titleImage?: string;  // 可选的标题图片链接
  author: string;
  playerCount?: string;  // 玩家人数范围，如 "7-15"
  characters: {
    [key: string]: Character[];  // 支持动态团队类型，包括标准团队
  };
  firstnight: NightAction[];
  othernight: NightAction[];
  jinx: Record<string, Record<string, string>>;
  all: Character[];
  specialRules: SpecialRule[];
}
