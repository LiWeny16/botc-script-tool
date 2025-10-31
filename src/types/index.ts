// 角色类型定义 - 标准团队类型
export type StandardTeam = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler' | 'fabled' | 'loric';

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
  remindersGlobal?: string[];  // 全局提示标记（可选）
  setup?: boolean;
  author?: string;  // 角色作者（可选）
}

export interface NightAction {
  image: string;
  index: number;
}

// 相克规则详细信息
export interface JinxInfo {
  reason: string;  // 相克规则文本
  display?: boolean;  // 是否显示，默认为true
  isOfficial?: boolean;  // 是否为官方相克规则
}

export interface ScriptMeta {
  name: string;
  author: string;
  use_title_image?: boolean;  // 第一页是否使用图片标题
  // 第二页配置
  second_page_title?: boolean;  // 是否显示第二页标题
  second_page_title_text?: string;  // 第二页标题文本
  second_page_title_image?: string;  // 第二页标题图片
  second_page_title_font_size?: number;  // 第二页标题字体大小
  second_page_title_image_size?: number;  // 第二页标题图片大小
  use_second_page_title_image?: boolean;  // 第二页是否使用图片标题
  second_page_ppl_table1?: boolean;  // 是否显示第一种人数配置表
  second_page_ppl_table2?: boolean;  // 是否显示第二种人数配置表（6-9人）
  second_page_order?: string;  // 第二页组件顺序（空格分隔的字符串）
}

// 特殊说明卡片项
export interface SpecialRuleItem {
  title: string;
  content: string;
}

// state 状态项
export interface StateItem {
  stateName: string;
  stateDescription: string;
}

// 国际化文本内容
export interface I18nText {
  'zh-CN'?: string;
  'en'?: string;
}

// 特殊说明卡片（可包含多个规则项）
export interface SpecialRule {
  id: string;
  title?: string | I18nText;  // 卡片标题（支持国际化）
  rules?: SpecialRuleItem[];  // 多个规则项
  content?: string | I18nText;  // 单个规则内容（支持国际化）
  isState?: boolean;  // 是否是 state 类型的规则
  sourceType?: 'state' | 'status' | 'special_rule';  // 来源类型
  sourceIndex?: number;  // 在来源数组中的索引
}

export interface Script {
  title: string;
  titleEn?: string;  // 英文标题（来自 _meta.name_en）
  titleImage?: string;  // 可选的标题图片链接
  titleImageSize?: number;  // 第一页标题图片大小
  useTitleImage?: boolean;  // 第一页是否使用图片标题
  author: string;
  playerCount?: string;  // 玩家人数范围，如 "7-15"
  characters: {
    [key: string]: Character[];  // 支持动态团队类型，包括标准团队
  };
  firstnight: NightAction[];
  othernight: NightAction[];
  jinx: Record<string, Record<string, JinxInfo>>;
  all: Character[];
  specialRules: SpecialRule[];
  secondPageRules?: SpecialRule[];  // 第二页的特殊规则
  // 第二页配置（来自 _meta）
  secondPageTitle?: boolean;  // 是否显示第二页标题
  secondPageTitleText?: string;  // 第二页标题文本（独立配置）
  secondPageTitleImage?: string;  // 第二页标题图片（独立配置）
  secondPageTitleFontSize?: number;  // 第二页标题字体大小
  secondPageTitleImageSize?: number;  // 第二页标题图片大小
  useSecondPageTitleImage?: boolean;  // 第二页是否使用图片标题
  secondPagePplTable1?: boolean;  // 是否显示第一种人数配置表
  secondPagePplTable2?: boolean;  // 是否显示第二种人数配置表（6-9人）
  secondPageOrder?: string[];  // 第二页组件顺序数组
}

// 第二页组件类型
export type SecondPageComponentType = 'title' | 'ppl_table1' | 'ppl_table2' | 'fabled' | 'traveler' | 'secondPageRules' | string;
