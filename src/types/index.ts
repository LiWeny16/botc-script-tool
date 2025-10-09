// 角色类型定义
export type Team = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler' | 'fabled';

export interface Character {
  id: string;
  name: string;
  ability: string;
  team: Team;
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
  author: string;
  characters: {
    townsfolk: Character[];
    outsider: Character[];
    minion: Character[];
    demon: Character[];
    fabled: Character[];
    traveler: Character[];
  };
  firstnight: NightAction[];
  othernight: NightAction[];
  jinx: Record<string, Record<string, string>>;
  all: Character[];
  specialRules: SpecialRule[];
}
