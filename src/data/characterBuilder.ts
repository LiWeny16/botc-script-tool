/**
 * 统一角色数据 Builder
 *
 * 设计思路：
 * - CanonicalCharacterBase  存放语言无关的结构字段（team、image、夜间顺序等）
 * - CharacterLocale         存放每种语言的文本字段（name、ability、reminders 等）
 * - resolveLocale()         按 es→en→zh-CN 的回退链合并文本
 * - buildCharacter()        由 base + language 生成最终 Character 对象
 * - buildDictionary()       批量生成 Record<id, Character>
 *
 * 对外导出的 getCharacterDictionary() 接口不变，UI 层无需修改。
 */

import type { Language } from '../utils/languages';
import type { Character } from '../types';
import { toZhCanonicalCharacterId } from './utils/characterIdMapping';

// ── 类型定义 ───────────────────────────────────────────────

/** 单种语言的文本字段 */
export interface CharacterLocale {
  name: string;
  ability: string;
  firstNightReminder?: string;
  otherNightReminder?: string;
  reminders?: string[];
  remindersGlobal?: string[];
}

/** 语言无关的角色基础信息 + 每语言文本覆盖 */
export interface CanonicalCharacterBase {
  /** 统一使用英文/官方 id，避免中文 id 作为 key */
  id: string;
  team: string;
  image?: string;
  firstNight: number;
  otherNight: number;
  setup: boolean;
  edition?: string;
  author?: string;
  teamColor?: string;
  /** 各语言文本覆盖；字段可部分提供，由 resolveLocale 按语言回退补齐 */
  locales: Partial<Record<Language, Partial<CharacterLocale>>>;
}

// ── 内部工具函数 ──────────────────────────────────────────

/**
 * 合并两个 locale：primary 的字段优先，缺失时从 fallback 补充。
 * undefined 视为"缺失"，空字符串视为"有值（空）"。
 */
function mergeLocale(
  primary: Partial<CharacterLocale> | undefined,
  fallback: Partial<CharacterLocale> | undefined,
): CharacterLocale {
  const base: CharacterLocale = {
    name: fallback?.name ?? '',
    ability: fallback?.ability ?? '',
    firstNightReminder: fallback?.firstNightReminder,
    otherNightReminder: fallback?.otherNightReminder,
    reminders: fallback?.reminders,
    remindersGlobal: fallback?.remindersGlobal,
  };
  if (!primary) return base;
  return {
    name: primary.name || base.name,
    ability: primary.ability || base.ability,
    firstNightReminder:
      primary.firstNightReminder !== undefined ? primary.firstNightReminder : base.firstNightReminder,
    otherNightReminder:
      primary.otherNightReminder !== undefined ? primary.otherNightReminder : base.otherNightReminder,
    reminders: primary.reminders !== undefined ? primary.reminders : base.reminders,
    remindersGlobal:
      primary.remindersGlobal !== undefined ? primary.remindersGlobal : base.remindersGlobal,
  };
}

// ── 公共 API ──────────────────────────────────────────────

/**
 * 按回退链解析最终文本：
 *   es  → en → zh-CN
 *   en  → zh-CN
 *   zh-CN → en（当 zh 未定义时）
 */
export function resolveLocale(
  locales: Partial<Record<Language, Partial<CharacterLocale>>>,
  language: Language,
): CharacterLocale {
  if (language === 'es') {
    const enFilled = mergeLocale(locales['en'], locales['zh-CN']);
    return mergeLocale(locales['es'], enFilled);
  }
  if (language === 'en') {
    return mergeLocale(locales['en'], locales['zh-CN']);
  }
  // zh-CN：先用中文，缺失字段从英文补充
  return mergeLocale(locales['zh-CN'], locales['en']);
}

/** 将 CanonicalCharacterBase 按指定语言构建为运行时 Character */
export function buildCharacter(base: CanonicalCharacterBase, language: Language): Character {
  const locale = resolveLocale(base.locales, language);
  const imageId = toZhCanonicalCharacterId(base.id);
  const defaultImage = `https://oss.gstonegames.com/data_file/clocktower/web/icons/${imageId}.png`;
  return {
    id: base.id,
    name: locale.name,
    ability: locale.ability,
    team: base.team,
    image: base.image || defaultImage,
    firstNight: base.firstNight,
    otherNight: base.otherNight,
    firstNightReminder: locale.firstNightReminder ?? '',
    otherNightReminder: locale.otherNightReminder ?? '',
    reminders: locale.reminders ?? [],
    remindersGlobal: locale.remindersGlobal ?? [],
    setup: base.setup,
    ...(base.edition !== undefined && { edition: base.edition }),
    ...(base.author !== undefined && { author: base.author }),
    ...(base.teamColor !== undefined && { teamColor: base.teamColor }),
  };
}

/** 批量构建角色字典 */
export function buildDictionary(
  bases: CanonicalCharacterBase[],
  language: Language,
): Record<string, Character> {
  const dict: Record<string, Character> = {};
  for (const base of bases) {
    dict[base.id] = buildCharacter(base, language);
  }
  return dict;
}
