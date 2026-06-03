import type { Language } from '../languages';
import type { Character } from '../../types';
import { scriptStore } from '../../stores/ScriptStore';
import { configStore } from '../../stores/ConfigStore';
import { getCharacterDictionary, getAllCharacterDictionaries } from '../../data/canonicalCharacters';

export function getLang(): Language {
  return configStore.language;
}

export function getDict() {
  return getCharacterDictionary(getLang());
}

export function scriptSummary() {
  const s = scriptStore.script;
  if (!s) return { loaded: false, message: 'No script loaded' };
  const teams: Record<string, number> = {};
  for (const [team, chars] of Object.entries(s.characters)) {
    teams[team] = chars.length;
  }
  return {
    loaded: true,
    title: s.title,
    author: s.author,
    playerCount: s.playerCount,
    teams,
    totalCharacters: s.all.length,
    jinxCount: Object.keys(s.jinx).length,
    hasSpecialRules: (s.specialRules?.length ?? 0) > 0,
  };
}

/**
 * Build a map of English compact ID → trilingual names & abilities.
 * Used by searchCharacters to avoid cross-language dict lookups inside the hot loop.
 */
export function buildLocaleMap() {
  const localeMap = new Map<string, {
    name_cn: string;
    name_en: string;
    name_es: string;
    ability_cn: string;
    ability_en: string;
    ability_es: string;
  }>();

  for (const [dictLang, dict] of getAllCharacterDictionaries()) {
    for (const [enId, c] of Object.entries(dict)) {
      const entry = localeMap.get(enId) ?? {
        name_cn: '',
        name_en: '',
        name_es: '',
        ability_cn: '',
        ability_en: '',
        ability_es: '',
      };
      if (dictLang === 'cn') { entry.name_cn = c.name; entry.ability_cn = c.ability; }
      if (dictLang === 'en') { entry.name_en = c.name; entry.ability_en = c.ability; }
      if (dictLang === 'es') { entry.name_es = c.name; entry.ability_es = c.ability; }
      localeMap.set(enId, entry);
    }
  }

  return localeMap;
}
