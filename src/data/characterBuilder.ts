/**
 * Unified Character Data Builder
 *
 * Design rationale:
 * - CanonicalCharacterBase  stores language-independent structural fields (team, image, night order, etc.)
 * - CharacterLocale         stores per-language text fields (name, ability, reminders, etc.)
 * - resolveLocale()         merges text using the es→en→zh-CN fallback chain
 * - buildCharacter()        produces the final Character object from base + language
 * - buildDictionary()       bulk-generates Record<id, Character>
 *
 * The exported getCharacterDictionary() interface remains unchanged; the UI layer requires no modifications.
 */

import type { Language } from '../utils/languages';
import type { Character } from '../types';
import { toZhCanonicalCharacterId } from './utils/characterIdMapping';

// ── Type Definitions ───────────────────────────────────────

/** Text fields for a single language */
export interface CharacterLocale {
  name: string;
  ability: string;
  firstNightReminder?: string;
  otherNightReminder?: string;
  reminders?: string[];
  remindersGlobal?: string[];
}

/** Language-independent character base info + per-language text overrides */
export interface CanonicalCharacterBase {
  /** Use the English/official id uniformly; avoid Chinese ids as keys */
  id: string;
  team: string;
  image?: string;
  firstNight: number;
  otherNight: number;
  setup: boolean;
  edition?: string;
  author?: string;
  teamColor?: string;
  /** Per-language text overrides; fields can be partial, filled in by resolveLocale via language fallback */
  locales: Partial<Record<Language, Partial<CharacterLocale>>>;
}

// ── Internal Utility Functions ─────────────────────────────

/**
 * Merge two locales: primary fields take precedence; missing fields are filled from fallback.
 * undefined is treated as "missing"; an empty string is treated as "has a value (empty)".
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

// ── Public API ─────────────────────────────────────────────

/**
 * Resolve the final text using the fallback chain:
 *   es  → en → zh-CN
 *   en  → zh-CN
 *   zh-CN → en (when zh is undefined)
 */
export function resolveLocale(
  locales: Partial<Record<Language, Partial<CharacterLocale>>>,
  language: Language,
): CharacterLocale {
  if (language === 'es') {
    const enFilled = mergeLocale(locales['en'], locales['cn']);
    return mergeLocale(locales['es'], enFilled);
  }
  if (language === 'en') {
    return mergeLocale(locales['en'], locales['cn']);
  }
  // zh-CN: use Chinese first, fill missing fields from English
  return mergeLocale(locales['cn'], locales['en']);
}

/** Build a runtime Character from a CanonicalCharacterBase for the specified language */
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

/** Bulk-build a character dictionary */
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
