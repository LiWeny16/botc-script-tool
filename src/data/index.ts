// Barrel export for src/data
// Re-exports all public APIs from the reorganized subdirectories

// Character data exports (primary source)
export {
  CHARACTERS,
  CHARACTERS_EN,
  CHARACTERS_ES,
  getCharacterDictionary,
  getAllCharacterDictionaries,
  getMergedCharacterDictionary,
  getCharacterInDictionary,
} from './canonicalCharacters';

// Jinx data exports
export { getJinxDictionary, hasJinx, getJinx, parseJinxSource, type JinxSourceEntry } from './jinx';

// Characters subdirectory exports (convenience re-exports)
export { TEAM_COLORS, TEAM_NAMES } from './characters/characters';

// Extras subdirectory exports
export { getFabledCharacters } from './extras/fabled';
export { getLoricCharacters } from './extras/loric';
export { getCustomCharacters } from './extras/custom';

// Utils subdirectory exports
export {
  normalizeCharacterId,
  isSameCharacter,
  toOfficialEnCharacterId,
  toZhCanonicalCharacterId,
} from './utils/characterIdMapping';
export { PINYIN_MAP } from './utils/pinyinMap';
export { CHARACTER_ALIASES, searchAliases, type AliasEntry } from './utils/characterAliases';
export { getSpecialRuleTemplate, getAllSpecialRuleTemplates } from './utils/specialRules';
export {
  type ScriptData,
  SCRIPT_MAP,
  SCRIPT_REPOSITORY,
  getScriptById,
  getScriptByName,
  getScriptJsonUrl,
  loadScriptJson,
  searchScripts,
} from './utils/scriptRepository';
