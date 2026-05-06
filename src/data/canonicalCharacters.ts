/**
 * Build CanonicalCharacterBase from roles.json + Chinese core + rolesEs.json,
 * then generate per-language Character dictionaries via characterBuilder;
 * expansion packs still retrieve Characters directly by language, consistent with the old logic.
 */

import type { Character } from '../types';
import type { Language } from '../utils/languages';
import rolesData from './sources/roles.json';
import rolesEsData from './sources/rolesEs.json';
import { ZH_CORE_CHARACTERS } from './characters/characters';
import { buildDictionary, type CanonicalCharacterBase, type CharacterLocale } from './characterBuilder';
import { normalizeCharacterId, toOfficialEnCharacterId, toZhCanonicalCharacterId } from './utils/characterIdMapping';
import { getCustomCharacters } from './extras/custom';
import { getFabledCharacters } from './extras/fabled';
import { getLoricCharacters } from './extras/loric';

function partialLocaleFromRole(role: Record<string, unknown>): Partial<CharacterLocale> {
  return {
    name: (role.name as string) || (role.id as string),
    ability: (role.ability as string) || '',
    firstNightReminder: (role.firstNightReminder as string) || '',
    otherNightReminder: (role.otherNightReminder as string) || '',
    reminders: (role.reminders as string[]) || [],
    remindersGlobal: (role.remindersGlobal as string[]) || [],
  };
}

function partialLocaleFromCharacter(c: Character): Partial<CharacterLocale> {
  return {
    name: c.name,
    ability: c.ability,
    firstNightReminder: c.firstNightReminder,
    otherNightReminder: c.otherNightReminder,
    reminders: c.reminders,
    remindersGlobal: c.remindersGlobal,
  };
}

const spanishOverrides = new Map(
  (rolesEsData as Array<{ id: string; name?: string; ability?: string }>).map((r) => [r.id, r]),
);

export function buildCoreCanonicalBases(): CanonicalCharacterBase[] {
  return (rolesData as Record<string, unknown>[]).map((role) => {
    const id = role.id as string;
    const cnId = normalizeCharacterId(id, 'cn');
    // ZH_CORE is a legacy bundle; entries are not guaranteed to satisfy the full Character type
    const zhChar = (ZH_CORE_CHARACTERS as unknown as Record<string, Character | undefined>)[cnId];
    const esRow = spanishOverrides.get(id);

    return {
      id,
      team: role.team as string,
      image: role.image as string | undefined,
      firstNight: (role.firstNight as number) ?? 0,
      otherNight: (role.otherNight as number) ?? 0,
      setup: (role.setup as boolean) ?? false,
      edition: role.edition as string | undefined,
      author: zhChar?.author,
      teamColor: zhChar?.teamColor,
      locales: {
        en: partialLocaleFromRole(role),
        'cn': zhChar ? partialLocaleFromCharacter(zhChar) : undefined,
        es: esRow
          ? {
              ...(esRow.name !== undefined ? { name: esRow.name } : {}),
              ...(esRow.ability !== undefined ? { ability: esRow.ability } : {}),
            }
          : undefined,
      },
    };
  });
}

let coreBasesCache: CanonicalCharacterBase[] | null = null;

function getCoreBases(): CanonicalCharacterBase[] {
  if (!coreBasesCache) coreBasesCache = buildCoreCanonicalBases();
  return coreBasesCache;
}

/** Expansion characters: Spanish UI still uses English text (consistent with old charactersEs) */
function extrasCharacterRecord(language: Language): Record<string, Character> {
  const extraLang: string = language === 'es' ? 'en' : language;
  const toDict = (chars: Character[]) =>
    chars.reduce<Record<string, Character>>((acc, c) => {
      acc[c.id] = c;
      return acc;
    }, {});
  return {
    ...toDict(getCustomCharacters(extraLang)),
    ...toDict(getFabledCharacters(extraLang)),
    ...toDict(getLoricCharacters(extraLang)),
  };
}

const mergedDictCache: Partial<Record<Language, Record<string, Character>>> = {};

export function getMergedCharacterDictionary(language: Language): Record<string, Character> {
  if (mergedDictCache[language]) return mergedDictCache[language]!;

  mergedDictCache[language] = {
    ...buildDictionary(getCoreBases(), language),
    ...extrasCharacterRecord(language),
  };
  return mergedDictCache[language]!;
}

export const CHARACTERS = getMergedCharacterDictionary('cn');
export const CHARACTERS_EN = getMergedCharacterDictionary('en');
export const CHARACTERS_ES = getMergedCharacterDictionary('es');

const CHARACTER_DICTIONARIES: Record<Language, Record<string, Character>> = {
  'cn': CHARACTERS,
  en: CHARACTERS_EN,
  es: CHARACTERS_ES,
};

/** Get the full character table (including expansions) by UI language; equivalent to {@link getMergedCharacterDictionary} */
export function getCharacterDictionary(language: Language): Record<string, Character> {
  return CHARACTER_DICTIONARIES[language] ?? CHARACTER_DICTIONARIES['cn'];
}

export function getAllCharacterDictionaries(): Array<[Language, Record<string, Character>]> {
  return Object.entries(CHARACTER_DICTIONARIES) as Array<[Language, Record<string, Character>]>;
}

/**
 * Look up an entry from a character dictionary using any id format
 * (official compact English / canonical Chinese id).
 * Dictionary keys match the ids in `roles.json`; internally resolves
 * via {@link toOfficialEnCharacterId} first.
 */
export function getCharacterInDictionary(
  dict: Record<string, Character>,
  rawId: string,
): Character | undefined {
  if (!rawId) return undefined;
  const enKey = toOfficialEnCharacterId(rawId);
  if (dict[enKey]) return dict[enKey];
  if (dict[rawId]) return dict[rawId];
  const zhKey = toZhCanonicalCharacterId(rawId);
  if (zhKey !== rawId && dict[zhKey]) return dict[zhKey];
  return undefined;
}
