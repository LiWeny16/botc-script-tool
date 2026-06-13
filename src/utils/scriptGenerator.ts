import type { Character, Script } from '../types';
import {
  CHARACTERS,
  getAllCharacterDictionaries,
  getCharacterDictionary,
  getCharacterInDictionary,
  hasJinx,
  getJinx,
} from '../data';
import { THEME_COLORS } from '../theme/colors';
import { isSameCharacter, normalizeCharacterId } from '../data/utils/characterIdMapping';
import { configStore } from '../stores/ConfigStore';
import type { Language } from './languages';
import { safeJsonParse } from './jsonSafety';

/**
 * Normalize an image field from JSON to a single URL string.
 *
 * In some script JSON formats (e.g. klutzbanana), `image` can be an array of
 * URLs instead of a single string. This normalizes it to always be a string
 * (the first URL if array), or undefined if missing/invalid.
 */
function normalizeImageUrl(image: unknown): string | undefined {
  if (Array.isArray(image)) {
    const first = image.find((x): x is string => typeof x === 'string' && x.length > 0);
    return first;
  }
  if (typeof image === 'string' && image.length > 0) {
    return image;
  }
  return undefined;
}

/**
 * Find character ID by character name
 * @param name Character name (Chinese or English)
 * @param charactersDict Character dictionary
 * @param language Current language
 * @param skipCrossLanguageSearch Whether to skip cross-language search (prevents infinite recursion)
 * @returns Found character ID, or null if not found
 */
function findCharacterIdByName(
  name: string,
  charactersDict: Record<string, Character>,
  language: Language = 'cn',
  skipCrossLanguageSearch: boolean = false
): string | null {
  // 1. First search by Name in current language dictionary (core scenario)
  for (const [id, character] of Object.entries(charactersDict)) {
    if (character.name === name) {
      return id;
    }
  }

  // 2. Cross-language reverse lookup (symmetric core) - only on first call to prevent infinite recursion
  if (!skipCrossLanguageSearch) {
    for (const [sourceLanguage, sourceDict] of getAllCharacterDictionaries()) {
      if (sourceLanguage === language) continue;

      const sourceId = findCharacterIdByName(name, sourceDict, sourceLanguage, true);
      if (!sourceId) continue;

      const foundChar = getCharacterInDictionary(charactersDict, sourceId);
      if (foundChar) return foundChar.id;
    }
  }

  return null;
}

/**
 * Get the night order numeric values for a character
 * @param characterId Character ID
 * @param jsonItem JSON character item (may contain custom night order)
 * @param currentLanguage Current language
 * @param officialIdParseMode Whether official ID parse mode is enabled
 * @returns Object containing firstNight and otherNight
 */
function getNightOrderFromChinese(
  characterId: string,
  jsonItem: any,
  currentLanguage: Language,
  officialIdParseMode: boolean = false
): { firstNight: number; otherNight: number } {
  // Get custom night order from JSON (if available)
  const jsonFirstNight = jsonItem.firstNight;
  const jsonOtherNight = jsonItem.otherNight;

  // If official ID parse mode is enabled
  if (officialIdParseMode) {
    // Try to find the official character
    const { dictKey, found } = getCharacterDictKey(
      jsonItem,
      currentLanguage,
      getCharacterDictionary(currentLanguage),
      true
    );

    if (found) {
      // Found official character, use official data (always get night order from Chinese dictionary)
      const ref = getCharacterInDictionary(CHARACTERS, dictKey);
      const officialFirstNight = ref?.firstNight ?? 0;
      const officialOtherNight = ref?.otherNight ?? 0;

      // Official ID parse mode: use official data if found, otherwise fall back to JSON data
      return {
        firstNight: officialFirstNight,
        otherNight: officialOtherNight,
      };
    } else {
      // Official character not found, use custom data from JSON
      return {
        firstNight: jsonFirstNight !== undefined ? (jsonFirstNight || 0) : 0,
        otherNight: jsonOtherNight !== undefined ? (jsonOtherNight || 0) : 0,
      };
    }
  }

  // Normal mode: JSON first, fall back to Chinese official dictionary if missing
  // 1. First try to get default values from Chinese official dictionary (as fallback)
  const ref = getCharacterInDictionary(CHARACTERS, characterId);
  const officialFirstNight = ref?.firstNight ?? 0;
  const officialOtherNight = ref?.otherNight ?? 0;

  // 2. Fields defined in JSON take priority; use official dictionary values otherwise
  return {
    firstNight: jsonFirstNight !== undefined ? (jsonFirstNight || 0) : officialFirstNight,
    otherNight: jsonOtherNight !== undefined ? (jsonOtherNight || 0) : officialOtherNight,
  };
}

/**
 * Get the dictionary key for a character (considering language mode and matching strategy)
 * @param item JSON character item
 * @param language Current language
 * @param charactersDict Character dictionary for current language
 * @param officialIdParseMode Whether official ID parse mode is enabled
 * @returns Dictionary key (or original ID if not found), along with whether a match was found
 */
function getCharacterDictKey(
  item: any,
  language: Language,
  charactersDict: Record<string, Character>,
  officialIdParseMode: boolean = false
): { dictKey: string; found: boolean } {
  // Non-Chinese mode: prefer id, fall back to name (supports cross-language lookup)
  if (language !== 'cn') {
    // 1. Look up by id field (exact match preferred)
    const dictKey = item.id;

    const byId = getCharacterInDictionary(charactersDict, dictKey);
    if (byId) {
      return { dictKey: byId.id, found: true };
    }

    const normalizedKey = normalizeCharacterId(item.id, language);
    const byNorm = getCharacterInDictionary(charactersDict, normalizedKey);
    if (byNorm) {
      return { dictKey: byNorm.id, found: true };
    }

    // 2. If id lookup fails, try name lookup (fallback strategy)
    if (item.name && typeof item.name === 'string') {
      // 2.1 First try name lookup in current language dictionary, then cross-language fallback
      const idByName = findCharacterIdByName(item.name, charactersDict, language);
      if (idByName) {
        return { dictKey: idByName, found: true };
      }

      // 2.2 Try to find by name in Chinese dictionary (may be a Chinese name), then convert to English ID
      const cnId = findCharacterIdByName(item.name, CHARACTERS, 'cn');
      if (cnId) {
        // Convert Chinese ID to English ID
        const enFound = getCharacterInDictionary(charactersDict, cnId);
        if (enFound) {
          return { dictKey: enFound.id, found: true };
        }
      }
    }

    // 3. If neither found, return original ID with not-found flag
    return { dictKey: item.id, found: false };
  }

  // Chinese mode: prefer id, fall back to name
  // 1. Look up by id field (exact match preferred)
  const dictKey = item.id;

  const byIdZh = getCharacterInDictionary(charactersDict, dictKey);
  if (byIdZh) {
    return { dictKey: byIdZh.id, found: true };
  }

  const normalizedKey = normalizeCharacterId(item.id, language);
  const byNormZh = getCharacterInDictionary(charactersDict, normalizedKey);
  if (byNormZh) {
    return { dictKey: byNormZh.id, found: true };
  }

  // 2. If id lookup fails, try name lookup (fallback strategy)
  if (item.name && typeof item.name === 'string') {
    const foundId = findCharacterIdByName(item.name, charactersDict, language);
    if (foundId) {
      return { dictKey: foundId, found: true };
    }
  }

  // 3. If neither found, return original ID with not-found flag
  return { dictKey: item.id, found: false };
}

// Parse JSON and generate script object
export function generateScript(jsonString: string, language: Language = 'cn'): Script {
  const parsed = safeJsonParse<unknown>(jsonString);
  if (!parsed.ok) {
    throw new Error(parsed.message);
  }

  const json = parsed.value;
  if (!Array.isArray(json)) {
    throw new Error('JSON top-level must be an array');
  }

  // Select character dictionary based on language
  const charactersDict = getCharacterDictionary(language);

  // Get official ID parse mode config
  const officialIdParseMode = configStore.config.officialIdParseMode;

  const script: Script = {
    title: 'Custom Script',
    titleImage: undefined,
    author: '',
    playerCount: undefined,
    characters: {
      townsfolk: [],
      outsider: [],
      minion: [],
      demon: [],
      fabled: [],
      traveler: [],
      loric: [],
    },
    firstnight: [
      {
        image: '/imgs/icons/75px-Dusk.png',
        index: 0,
      },
      {
        image: '/imgs/icons/75px-Mi.png',
        index: 0.0001,
      },
      {
        image: '/imgs/icons/75px-Di.png',
        index: 0.0002,
      },
    ],
    othernight: [
      {
        image: '/imgs/icons/75px-Dusk.png',
        index: 0,
      },
    ],
    jinx: {},
    all: [],
    specialRules: [],
    secondPageRules: [],
  };

  // Collect all special rules (state + special_rule) for unified processing
  const allMetaRules: Array<{
    id?: string;
    title: string;
    content: string;
    rules?: any[];
    sourceType: 'state' | 'status' | 'special_rule';
    sourceIndex: number;
  }> = [];

  // Collect all jinx rule items for deferred processing
  const jinxItems: Array<any> = [];

  for (let item of json) {
    // Support simplified format: if item is a string, convert to object
    if (typeof item === 'string') {
      item = { id: item };
    }

    // Normalize image field: it may be a string or array of strings in some
    // JSON formats (e.g. klutzbanana). Convert to single string unconditionally.
    if (item.image !== undefined) {
      item.image = normalizeImageUrl(item.image);
    }

    // Process metadata
    if (item.id === '_meta') {
      script.title = item.name || 'Custom Script';
      script.titleEn = item.titleEn || item.title_en || item.nameEn || item.name_en;  // Parse English title (supports multiple field names)
      script.titleImage = item.titleImage || item.logo;  // Support titleImage or logo field
      script.titleImageSize = item.titleImageSize;  // Parse first page title image size
      script.useTitleImage = item.use_title_image !== false ? !!script.titleImage : false;  // Default based on whether image exists
      script.showTitleFlourish = item.show_title_flourish;  // Parse flourish visibility
      script.author = item.author || '';
      script.playerCount = item.playerCount;  // Parse player count
      // Parse title alignment — only allow valid CSS values
      const rawAlign = (item as any).text_alignment;
      (script as any).textAlignment = (rawAlign === 'left' || rawAlign === 'center' || rawAlign === 'right') ? rawAlign : 'center';

      // Parse column left count (asymmetric 2-col layout)
      if (item.column_left_count && typeof item.column_left_count === 'object') {
        script.columnLeftCount = item.column_left_count;
      }

      // Parse second page config
      script.secondPageTitle = item.second_page_title;
      script.secondPageTitleText = item.second_page_title_text;
      script.secondPageTitleImage = item.second_page_title_image;
      script.secondPageTitleFontSize = item.second_page_title_font_size;
      script.secondPageTitleImageSize = item.second_page_title_image_size;
      script.useSecondPageTitleImage = item.use_second_page_title_image !== false ? !!script.secondPageTitleImage : false;  // Default based on whether image exists
      script.secondPagePplTable1 = item.second_page_ppl_table1;
      script.secondPagePplTable2 = item.second_page_ppl_table2;
      // Parse second page component order
      if (item.second_page_order && typeof item.second_page_order === 'string') {
        script.secondPageOrder = item.second_page_order.split(' ').filter((s: string) => s.length > 0);
      }

      // Process state field
      if (item.state && Array.isArray(item.state)) {
        item.state.forEach((state: any, index: number) => {
          allMetaRules.push({
            id: `_meta_state_${index}`,
            title: state.stateName,
            content: state.stateDescription,
            sourceType: 'state',
            sourceIndex: index,
          });
        });
      }

      // Process status field
      if (item.status && Array.isArray(item.status)) {
        item.status.forEach((status: any, index: number) => {
          allMetaRules.push({
            id: `_meta_status_${index}`,
            title: status.name,
            content: status.skill,
            sourceType: 'status',
            sourceIndex: index,
          });
        });
      }

      continue;
    }

    // Process special rule cards (team = 'special_rule')
    if (item.team === 'special_rule') {
      allMetaRules.push({
        id: item.id,
        title: item.title || item.name,
        content: item.content || item.ability,
        rules: item.rules,
        sourceType: 'special_rule',
        sourceIndex: allMetaRules.length,
      });
      continue;
    }

    // Get character info from dictionary, or use full info from JSON
    let character: Character = item;
    let officialId: string | null = null; // Save official ID for later jinx query

    // Use smart matching function to get dictionary key and match result
    // Chinese mode: prefer name, fall back to id
    // English mode: based on id, but in official parse mode tries Chinese name lookup first
    const { dictKey, found } = getCharacterDictKey(item, language, charactersDict, officialIdParseMode);

    // Decide character info source based on match result and official ID parse mode
    if (found) {
      officialId = dictKey; // Save official ID

      if (officialIdParseMode) {
        // Official ID parse mode: fully use official data, ignore JSON custom info
        character = { ...charactersDict[dictKey] };
        character.id = item.id; // Keep original ID
        // Only preserve team field (if JSON has custom team)
        if (item.team) {
          character.team = item.team;
        }
      } else {
        // Normal mode: JSON custom info takes priority, but use official data if JSON lacks image
        if (!normalizeImageUrl(item.image)) {
          character = { ...charactersDict[dictKey], ...item };
          character.id = item.id; // Keep original ID
        }
      }
    } else {
      // If not found in dictionary, use full info from JSON (custom character)
      // In this case character already equals item, no extra processing needed
      console.warn(`Character "${item.id}" (name: "${item.name || 'N/A'}") not found in dictionary, using JSON custom data`);
    }

    // Save official ID to character object (as internal property for jinx query)
    if (officialId) {
      (character as any)._officialId = officialId;
    }

    // Process jinx rules - collect first, handle later
    if (item.team === 'a jinxed') {
      jinxItems.push(item);
      continue;
    }

    // Process all characters (including unknown team types)
    if (character.team) {
      // Check if a character with the same ID already exists
      const existsInAll = script.all.some(c => c.id === character.id);
      if (existsInAll) {
        console.warn(`Skipping duplicate character ID: ${character.id}`);
        continue;
      }

      // Auto-create array if team doesn't exist
      if (!script.characters[character.team]) {
        script.characters[character.team] = [];
      }

      // Check if a character with the same ID already exists in this team
      const existsInTeam = script.characters[character.team].some(c => c.id === character.id);
      if (existsInTeam) {
        console.warn(`Skipping duplicate character ID: ${character.id} in team ${character.team}`);
        continue;
      }

      // Get night order: decide whether to use JSON custom or official data based on mode
      const nightOrder = getNightOrderFromChinese(character.id, item, language, officialIdParseMode);

      // Unified character field processing: apply same parsing logic as night order
      // Official ID parse mode: use official data if found, otherwise JSON data
      // Normal mode: JSON first, supplement from official data when missing
      let finalCharacter: Character;

      if (officialIdParseMode) {
        if (found) {
          // Found official character: use official data
          finalCharacter = {
            ...charactersDict[dictKey],
            id: character.id, // Keep original ID
            team: item.team || charactersDict[dictKey].team, // JSON team takes priority
            firstNight: 0, // These will be populated from nightOrder later
            otherNight: 0,
          };
        } else {
          // Official character not found: use JSON data
          finalCharacter = {
            ...character, // character is already item
            firstNight: 0, // Ensure these fields exist
            otherNight: 0,
          };
        }
      } else {
        // Normal mode: JSON first, supplement from official data when missing
        if (found) {
          const officialChar = charactersDict[dictKey];
          // Manually merge each field: JSON value if present, otherwise official data
          finalCharacter = {
            id: character.id, // Keep original ID
            name: item.name !== undefined && item.name !== null && item.name !== '' ? item.name : officialChar.name,
            ability: item.ability !== undefined && item.ability !== null && item.ability !== '' ? item.ability : officialChar.ability,
            image: normalizeImageUrl(item.image) || officialChar.image,
            team: item.team !== undefined && item.team !== null ? item.team : officialChar.team,
            teamColor: item.teamColor !== undefined ? item.teamColor : officialChar.teamColor,
            // For potentially empty arrays/strings, just check !== undefined (allow empty values)
            firstNightReminder: item.firstNightReminder !== undefined ? item.firstNightReminder : officialChar.firstNightReminder,
            otherNightReminder: item.otherNightReminder !== undefined ? item.otherNightReminder : officialChar.otherNightReminder,
            reminders: item.reminders !== undefined ? item.reminders : officialChar.reminders,
            remindersGlobal: item.remindersGlobal !== undefined ? item.remindersGlobal : officialChar.remindersGlobal,
            setup: item.setup !== undefined ? item.setup : officialChar.setup,
            // Add firstNight and otherNight (populated from nightOrder later, placeholder 0 here)
            firstNight: 0,
            otherNight: 0,
          };
        } else {
          // Official character not found: fully use JSON data
          finalCharacter = {
            ...character,
            firstNight: 0, // Ensure these fields exist
            otherNight: 0,
          };
        }
      }

      // Save official ID to finalCharacter
      if (officialId) {
        (finalCharacter as any)._officialId = officialId;
      }

      // Push to all array (using processed character data)
      script.all.push(finalCharacter);

      // Push to corresponding team array
      script.characters[finalCharacter.team].push({
        name: finalCharacter.name,
        ability: finalCharacter.ability,
        image: finalCharacter.image,
        id: finalCharacter.id,
        team: finalCharacter.team,
        teamColor: finalCharacter.teamColor,  // Save custom color
        firstNight: nightOrder.firstNight,
        otherNight: nightOrder.otherNight,
        firstNightReminder: finalCharacter.firstNightReminder,
        otherNightReminder: finalCharacter.otherNightReminder,
        reminders: finalCharacter.reminders,
        remindersGlobal: finalCharacter.remindersGlobal,  // Save global reminder flag
        setup: finalCharacter.setup,
      });

      // Fabled and Traveler do not participate in standard teams' night order
      // Unknown team types default to not participating in night order
      const standardTeams: string[] = ['townsfolk', 'outsider', 'minion', 'demon'];
      if (standardTeams.includes(finalCharacter.team)) {
        // Add first night action: use values obtained from Chinese dictionary
        if (nightOrder.firstNight && nightOrder.firstNight > 0) {
          script.firstnight.push({
            image: finalCharacter.image,
            index: nightOrder.firstNight,
          });
        }

        // Add other night action: use values obtained from Chinese dictionary
        if (nightOrder.otherNight && nightOrder.otherNight > 0) {
          script.othernight.push({
            image: finalCharacter.image,
            index: nightOrder.otherNight,
          });
        }
      }
    }

    // Extract inline jinxes from character objects (e.g. Dante's Code format:
    // jinxes field embedded inside character object with [{ id, reason }] array)
    if (item.jinxes && Array.isArray(item.jinxes)) {
      jinxItems.push({
        id: item.id,
        jinx: item.jinxes,
      });
    }
  }

  // Process custom jinx rules (after all characters are parsed)
  for (const item of jinxItems) {
    // Helper: find character name by ID (returns name regardless of language)
    const findCharacterName = (id: string): string | null => {
      // 1. Search in already parsed character list (preferred, contains all mapping relationships)
      // First try by original ID
      let foundChar = script.all.find(c => isSameCharacter(c.id, id));
      if (foundChar) {
        return foundChar.name;
      }

      foundChar = script.all.find(
        c => (c as any)._officialId != null && isSameCharacter(String((c as any)._officialId), id),
      );
      if (foundChar) {
        return foundChar.name;
      }

      const officialChar = getCharacterInDictionary(charactersDict, id);
      if (officialChar) {
        return officialChar.name;
      }

      return null;
    };

    // New format: use jinx array
    if (item.jinx && Array.isArray(item.jinx)) {
      // Get main character name
      const mainCharName = findCharacterName(item.id);
      if (!mainCharName) {
        console.warn(`Main character "${item.id}" in jinx rule not found, skipping jinx relationship`);
        continue;
      }

      item.jinx.forEach((jinxEntry: any) => {
        const targetCharName = findCharacterName(jinxEntry.id);
        if (!targetCharName) {
          console.warn(`Target character "${jinxEntry.id}" in jinx rule not found, skipping jinx relationship`);
          return;
        }

        // Prefer reason, fall back to reasonEn
        const description = jinxEntry.reason || jinxEntry.reasonEn || '';

        // Extract display field from JSON (defaults to true)
        const display = jinxEntry.display !== false;  // Only hide if explicitly set to false

        // Store bidirectional relationship, consistent with official jinx logic
        // Direction 1: mainCharName -> targetCharName
        if (!script.jinx[mainCharName]) {
          script.jinx[mainCharName] = {};
        }
        script.jinx[mainCharName][targetCharName] = {
          reason: description,
          display: display,
          isOfficial: false,  // Custom jinx
        };

        // Direction 2: targetCharName -> mainCharName (reverse relation)
        if (!script.jinx[targetCharName]) {
          script.jinx[targetCharName] = {};
        }
        script.jinx[targetCharName][mainCharName] = {
          reason: description,
          display: display,
          isOfficial: false,  // Custom jinx
        };
      });
    }
    // Old format: use name field with & separator (backward compatible)
    else if (item.name && typeof item.name === 'string' && item.name.includes('&')) {
      const [charA, charB] = item.name.split('&');
      const description = item.ability || '';

      // Store bidirectional relation
      if (!script.jinx[charA]) script.jinx[charA] = {};
      script.jinx[charA][charB] = {
        reason: description,
        display: true,
        isOfficial: false,
      };

      if (!script.jinx[charB]) script.jinx[charB] = {};
      script.jinx[charB][charA] = {
        reason: description,
        display: true,
        isOfficial: false,
      };
    }
  }

  // Unified processing of all special rules (state + status + special_rule)
  // 1. Deduplication: deduplicate by title
  const uniqueRules = allMetaRules.filter((rule, index, self) =>
    index === self.findIndex((r) => r.title === rule.title)
  );

  // 2. First special rule: placed on both first and second pages
  if (uniqueRules.length > 0) {
    const firstRule = uniqueRules[0];
    const firstRuleData = {
      id: firstRule.id || `_meta_${firstRule.sourceType}_${firstRule.sourceIndex}`,
      title: firstRule.title,
      content: firstRule.content,
      rules: firstRule.rules,
      isState: firstRule.sourceType !== 'special_rule',
      sourceType: firstRule.sourceType,
      sourceIndex: firstRule.sourceIndex,
    };

    // First page shows the first rule
    script.specialRules.push(firstRuleData);

    // Second page also shows the first rule
    script.secondPageRules?.push({ ...firstRuleData });
  }

  // 3. Second and subsequent rules: placed only on second page
  if (uniqueRules.length > 1) {
    for (let i = 1; i < uniqueRules.length; i++) {
      const rule = uniqueRules[i];
      script.secondPageRules?.push({
        id: rule.id || `_meta_${rule.sourceType}_${rule.sourceIndex}`,
        title: rule.title,
        content: rule.content,
        rules: rule.rules,
        isState: rule.sourceType !== 'special_rule',
        sourceType: rule.sourceType,
        sourceIndex: rule.sourceIndex,
      });
    }
  }

  // Auto-detect jinx relationships between characters
  for (const charA of script.all) {
    for (const charB of script.all) {
      if (charA.id !== charB.id) {
        // Jinx data dictionary key is uniformly normalizeCharacterId(id, 'cn')
        const keyA = normalizeCharacterId(charA.id, 'cn');
        const keyB = normalizeCharacterId(charB.id, 'cn');

        if (hasJinx(keyA, keyB, language)) {
          // Store jinx relation: uniformly use character name field as key
          const nameA = charA.name;
          const nameB = charB.name;

          if (!script.jinx[nameA]) {
            script.jinx[nameA] = {};
          }
          if (!script.jinx[nameA][nameB]) {
            // Official jinx rule, shown by default
            script.jinx[nameA][nameB] = {
              reason: getJinx(keyA, keyB, language, configStore.config.jinxVersion),
              display: true,
              isOfficial: true,
            };
          }
        }
      }
    }
  }

  // Sort by night order
  script.firstnight.sort((a, b) => a.index - b.index);
  script.othernight.sort((a, b) => a.index - b.index);

  return script;
}

// Highlight keywords in ability text
export function highlightAbilityText(text: string, language: Language = 'cn'): string {
  // Defensive check: if text is undefined or null, return empty string
  if (!text) {
    return '';
  }

  // Chinese keywords (MUST stay in Chinese - these are used to match Chinese game text)
  const redKeywordsCN = [
    '未正常生效', '选择或影响', '死于处决', '恶魔角色', '爪牙角色',
    '邪恶玩家', '邪恶阵营', '邪恶角色', '"是恶魔"', '负面能力',
    '小恶魔', '小怪宝', '维齐尔', '被处决', '杀死',
    '死亡', '邪恶', '落败', '中毒', '爪牙', '恶魔', '处决',
    '错误', '自杀', '暴乱', '军团', '代价', '伪装',
    '作弊',
  ];

  const blueKeywordsCN = [
    '外来者角色', '善良玩家', '善良阵营', '善良角色', '镇民角色',
    '恢复健康', '起死回生', '落难少女', '有且只有', '有多准确',
    '守夜人', '外来者', '农夫', '书生', '疯子', '国王',
    '醉酒', '复活', '反刍', '镇民', '善良', '正确', '存活', '获胜', '大法官', '暗影筹码', '梭哈',
  ];

  const purpleKeywordsCN = ['非旅行者', '旅行者', '疯狂'];

  // English keywords for text highlighting
  const redKeywordsEN = [
    'not work correctly', 'not functioning', 'affect or choose',
    'evil', 'negative ability',
    'executed', 'execution', 'Demon', 'Minion', 'Evil',
    'poisoned', 'poison',
    'Vizier', 'false'
  ];

  const blueKeywordsEN = [
    'drunk', 'good', 'Tea Lady',
    'Outsider', 'Good', 'Townsfolk',
    'healthy', 'sober', 'alive', 'lives', 'survive',
    'resurrect', 'regurgitate',
  ];

  const purpleKeywordsEN = [
    'Travellers', 'Traveler',
    'mad', 'madness',
  ];

  const redKeywordsES = [
    'malvado', 'malvados', 'malo', 'malos', 'Demonio', 'Esbirro',
    'envenenado', 'envenenada', 'veneno', 'ejecutado', 'ejecución',
    'muere', 'morir', 'borracho', 'borracha', 'incorrectamente',
  ];

  const blueKeywordsES = [
    'bueno', 'buenos', 'Aldeano', 'Forastero',
    'vivo', 'viva', 'sano', 'sana', 'sobrio', 'sobria',
    'resucita', 'sobrevive', 'gana',
  ];

  const purpleKeywordsES = ['Viajero', 'Viajeros', 'loco', 'locura'];

  // Select keyword list based on language
  let redKeywords = language === 'cn' ? redKeywordsCN : language === 'es' ? redKeywordsES : redKeywordsEN;
  let blueKeywords = language === 'cn' ? blueKeywordsCN : language === 'es' ? blueKeywordsES : blueKeywordsEN;
  let purpleKeywords = language === 'cn' ? purpleKeywordsCN : language === 'es' ? purpleKeywordsES : purpleKeywordsEN;

  // Helper function to escape regex special characters
  const escapeRegex = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // For non-Chinese languages, sort by length (longest first) to avoid short words being replaced before longer phrases
  if (language !== 'cn') {
    redKeywords = [...redKeywords].sort((a, b) => b.length - a.length);
    blueKeywords = [...blueKeywords].sort((a, b) => b.length - a.length);
    purpleKeywords = [...purpleKeywords].sort((a, b) => b.length - a.length);
  }

  let result = text;

  // Non-Chinese uses word boundary matching; Chinese uses direct replacement
  if (language !== 'cn') {
    // Latin-script languages: use regex to ensure only whole words match
    redKeywords.forEach((keyword) => {
      const escapedKeyword = escapeRegex(keyword);
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
      result = result.replace(regex, (match) =>
        `<span style="color: ${THEME_COLORS.evil}; font-weight: 700;">${match}</span>`
      );
    });

    blueKeywords.forEach((keyword) => {
      const escapedKeyword = escapeRegex(keyword);
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
      result = result.replace(regex, (match) =>
        `<span style="color: ${THEME_COLORS.good}; font-weight: 700;">${match}</span>`
      );
    });

    purpleKeywords.forEach((keyword) => {
      const escapedKeyword = escapeRegex(keyword);
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
      result = result.replace(regex, (match) =>
        `<span style="color: ${THEME_COLORS.purple}; font-weight: 700;">${match}</span>`
      );
    });
  } else {
    // Chinese: direct replacement
    redKeywords.forEach((keyword) => {
      result = result.replaceAll(
        keyword,
        `<span style="color: ${THEME_COLORS.evil}; font-weight: 700;">${keyword}</span>`
      );
    });

    blueKeywords.forEach((keyword) => {
      result = result.replaceAll(
        keyword,
        `<span style="color: ${THEME_COLORS.good}; font-weight: 700;">${keyword}</span>`
      );
    });

    purpleKeywords.forEach((keyword) => {
      result = result.replaceAll(
        keyword,
        `<span style="color: ${THEME_COLORS.purple}; font-weight: 700;">${keyword}</span>`
      );
    });
  }

  return result;
}
