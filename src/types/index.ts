import type { Language } from '../utils/languages';

// Character type definitions - standard team types
export type StandardTeam = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler' | 'fabled' | 'loric';

// Extended team type - includes any string to support custom teams
export type Team = StandardTeam | string;

export interface Character {
  id: string;
  name: string;
  ability: string;
  team: Team;
  teamColor?: string;  // custom team color (optional)
  image: string;
  firstNight: number;
  otherNight: number;
  firstNightReminder?: string;
  otherNightReminder?: string;
  reminders?: string[];
  remindersGlobal?: string[];  // global reminder markers (optional)
  setup?: boolean;
  author?: string;  // character author (optional)
}

export interface NightAction {
  image: string;
  index: number;
}

// Jinx rule details
export interface JinxInfo {
  reason: string;  // jinx rule text
  display?: boolean;  // whether to display, defaults to true
  isOfficial?: boolean;  // whether this is an official jinx rule
}

export interface ScriptMeta {
  name: string;
  author: string;
  use_title_image?: boolean;  // whether to use an image title on the first page
  // second page configuration
  second_page_title?: boolean;  // whether to show the second page title
  second_page_title_text?: string;  // second page title text
  second_page_title_image?: string;  // second page title image
  second_page_title_font_size?: number;  // second page title font size
  second_page_title_image_size?: number;  // second page title image size
  use_second_page_title_image?: boolean;  // whether to use an image title on the second page
  second_page_ppl_table1?: boolean;  // whether to show the first player count table
  second_page_ppl_table2?: boolean;  // whether to show the second player count table (6-9 players)
  second_page_order?: string;  // second page component order (space-separated string)
}

// Special rule card item
export interface SpecialRuleItem {
  title: string;
  content: string;
}

// State status item
export interface StateItem {
  stateName: string;
  stateDescription: string;
}

// Internationalized text content
export type I18nText = Partial<Record<Language, string>>;

// Special rule card (can contain multiple rule items)
export interface SpecialRule {
  id: string;
  title?: string | I18nText;  // card title (supports i18n)
  rules?: SpecialRuleItem[];  // multiple rule items
  content?: string | I18nText;  // single rule content (supports i18n)
  isState?: boolean;  // whether this is a state-type rule
  sourceType?: 'state' | 'status' | 'special_rule';  // source type
  sourceIndex?: number;  // index in the source array
}

export interface Script {
  title: string;
  titleEn?: string;  // English title (from _meta.name_en)
  titleImage?: string;  // optional title image URL
  titleImageSize?: number;  // first page title image size
  useTitleImage?: boolean;  // whether to use an image title on the first page
  showTitleFlourish?: boolean;  // whether to show the decorative pattern behind the title
  author: string;
  playerCount?: string;  // player count range, e.g. "7-15"
  characters: {
    [key: string]: Character[];  // supports dynamic team types, including standard teams
  };
  firstnight: NightAction[];
  othernight: NightAction[];
  jinx: Record<string, Record<string, JinxInfo>>;
  all: Character[];
  specialRules: SpecialRule[];
  secondPageRules?: SpecialRule[];  // special rules for the second page
  // second page configuration (from _meta)
  secondPageTitle?: boolean;  // whether to show the second page title
  secondPageTitleText?: string;  // second page title text (standalone config)
  secondPageTitleImage?: string;  // second page title image (standalone config)
  secondPageTitleFontSize?: number;  // second page title font size
  secondPageTitleImageSize?: number;  // second page title image size
  useSecondPageTitleImage?: boolean;  // whether to use an image title on the second page
  secondPagePplTable1?: boolean;  // whether to show the first player count table
  secondPagePplTable2?: boolean;  // whether to show the second player count table (6-9 players)
  secondPageOrder?: string[];  // second page component order array
  columnLeftCount?: Record<string, number>;  // per-team left column character count (for asymmetric 2-col layout)
}

// Second page component type
export type SecondPageComponentType = 'title' | 'ppl_table1' | 'ppl_table2' | 'fabled' | 'traveler' | 'secondPageRules' | string;
