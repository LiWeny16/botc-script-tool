import { makeAutoObservable } from 'mobx';
import type { Script, Character } from '../types';
import { isSameCharacter } from '../data/utils/characterIdMapping';
import { configStore } from './ConfigStore';
import { loadCachedScriptData, safeJsonParse, saveCachedScriptData } from '../utils/jsonSafety';

class ScriptStore {
  script: Script | null = null;
  originalJson: string = ''; // Raw JSON input from user
  normalizedJson: string = ''; // Complete JSON after official data completion (used for export, sharing, etc.)
  customTitle: string = '';
  customAuthor: string = '';
  
  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  /** Centralized safe parse of originalJson to array — replaces 12+ try/catch blocks */
  private safeParseOriginalJsonArray(): any[] {
    const parsed = safeJsonParse<unknown>(this.originalJson || '[]');
    if (!parsed.ok) {
      throw new Error(parsed.message);
    }
    if (!Array.isArray(parsed.value)) {
      throw new Error('originalJson must be an array');
    }
    return parsed.value;
  }

  // Set script data
  setScript(script: Script | null) {
    // Before setting, try to parse _meta.name_en from originalJson and store in script (does not affect default title)
    if (script) {
      try {
        const meta = this.safeParseOriginalJsonArray().find((it: any) => it && it.id === '_meta');
        const nameEn = meta && (meta.name_en || meta.nameEn);
        if (typeof nameEn === 'string' && nameEn.trim()) {
          (script as any).titleEn = nameEn.trim();
        }
      } catch {
        // Non-critical: keep going even if originalJson is unparseable
      }
    }
    this.script = script;
    // Also generate normalized JSON
    if (script) {
      this.generateNormalizedJson(script);
    }
    this.saveToStorage();
  }

  // Generate complete normalized JSON from Script object
  private generateNormalizedJson(script: Script) {
    try {
      const jsonArray: any[] = [];

      // 1. Add _meta
      const meta: any = {
        id: '_meta',
        name: script.title,
        author: script.author || '',
      };
      if ((script as any).titleEn) meta.name_en = (script as any).titleEn;
      if (script.titleImage) meta.titleImage = script.titleImage;
      if (script.titleImageSize) meta.titleImageSize = script.titleImageSize;
      if (script.useTitleImage !== undefined) meta.use_title_image = script.useTitleImage;
      if (script.showTitleFlourish !== undefined) meta.show_title_flourish = script.showTitleFlourish;
      if (script.playerCount) meta.playerCount = script.playerCount;
      
      // Second page configuration
      if (script.secondPageTitle !== undefined) meta.second_page_title = script.secondPageTitle;
      if (script.secondPageTitleText) meta.second_page_title_text = script.secondPageTitleText;
      if (script.secondPageTitleImage) meta.second_page_title_image = script.secondPageTitleImage;
      if (script.secondPageTitleFontSize) meta.second_page_title_font_size = script.secondPageTitleFontSize;
      if (script.secondPageTitleImageSize) meta.second_page_title_image_size = script.secondPageTitleImageSize;
      if (script.useSecondPageTitleImage !== undefined) meta.use_second_page_title_image = script.useSecondPageTitleImage;
      if (script.secondPagePplTable1 !== undefined) meta.second_page_ppl_table1 = script.secondPagePplTable1;
      if (script.secondPagePplTable2 !== undefined) meta.second_page_ppl_table2 = script.secondPagePplTable2;
      if (script.secondPageOrder && script.secondPageOrder.length > 0) {
        meta.second_page_order = script.secondPageOrder.join(' ');
      }

      // state and status (extracted from specialRules)
      const stateRules: any[] = [];
      const statusRules: any[] = [];
      
      if (script.specialRules && script.specialRules.length > 0) {
        script.specialRules.forEach(rule => {
          if (rule.sourceType === 'state') {
            stateRules.push({
              stateName: rule.title,
              stateDescription: rule.content,
            });
          } else if (rule.sourceType === 'status') {
            statusRules.push({
              name: rule.title,
              skill: rule.content,
            });
          }
        });
      }
      
      // Also check secondPageRules
      if (script.secondPageRules && script.secondPageRules.length > 0) {
        script.secondPageRules.forEach(rule => {
          if (rule.sourceType === 'state' && !stateRules.some(s => s.stateName === rule.title)) {
            stateRules.push({
              stateName: rule.title,
              stateDescription: rule.content,
            });
          } else if (rule.sourceType === 'status' && !statusRules.some(s => s.name === rule.title)) {
            statusRules.push({
              name: rule.title,
              skill: rule.content,
            });
          }
        });
      }

      if (stateRules.length > 0) meta.state = stateRules;
      if (statusRules.length > 0) meta.status = statusRules;

      jsonArray.push(meta);

      // Pre-fetch original JSON array for jinx extraction
      let originalArray: any[] = [];
      try {
        originalArray = this.safeParseOriginalJsonArray();
      } catch { /* keep empty */ }

      // Helper: find original JSON entry for a character ID
      const findOrig = (charId: string) => originalArray?.find((item: any) => {
        if (typeof item === 'string') return isSameCharacter(item, charId);
        if (!item || item.id === '_meta') return false;
        return isSameCharacter(item.id, charId);
      });

      // 2. Add all characters (using script.all to maintain order)
      script.all.forEach(character => {
        const charJson: any = {
          id: character.id,
          name: character.name,
          ability: character.ability,
          team: character.team,
          image: character.image,
        };

        // Add optional fields
        if (character.firstNight) charJson.firstNight = character.firstNight;
        if (character.otherNight) charJson.otherNight = character.otherNight;
        if (character.firstNightReminder) charJson.firstNightReminder = character.firstNightReminder;
        if (character.otherNightReminder) charJson.otherNightReminder = character.otherNightReminder;
        if (character.reminders && character.reminders.length > 0) charJson.reminders = character.reminders;
        if (character.remindersGlobal && character.remindersGlobal.length > 0) charJson.remindersGlobal = character.remindersGlobal;
        if (character.setup) charJson.setup = character.setup;

        // Copy inline jinxes from original JSON (Dante's Code format: jinxes inside character object)
        const origItem = findOrig(character.id);
        if (origItem && typeof origItem === 'object' && origItem.jinxes && Array.isArray(origItem.jinxes) && origItem.jinxes.length > 0) {
          charJson.jinxes = origItem.jinxes;
        }

        jsonArray.push(charJson);
      });

      // 3. Extract jinx rules from originalJson (both legacy team:'a jinxed' and inline)
      try {
        // Legacy format: team === 'a jinxed' entries
        const legacyJinxItems = originalArray.filter((item: any) => {
          const itemObj = typeof item === 'string' ? { id: item } : item;
          return itemObj.team === 'a jinxed';
        });
        legacyJinxItems.forEach((item: any) => jsonArray.push(item));
      } catch (error) {
        console.warn('Failed to extract jinx rules:', error);
      }

      // 4. Add special rules
      if (script.specialRules && script.specialRules.length > 0) {
        script.specialRules.forEach(rule => {
          if (rule.sourceType === 'special_rule') {
            jsonArray.push({
              id: rule.id,
              team: 'special_rule',
              title: rule.title,
              content: rule.content,
            });
          }
        });
      }

      this.normalizedJson = JSON.stringify(jsonArray, null, 2);
      console.log('Normalized JSON generated');
    } catch (error) {
      console.error('Failed to generate normalized JSON:', error);
      // If generation fails, use original JSON as backup
      this.normalizedJson = this.originalJson;
    }
  }

  // Set original JSON
  setOriginalJson(json: string) {
    this.originalJson = json;
    this.saveToStorage();
  }

  // Set custom title
  setCustomTitle(title: string) {
    this.customTitle = title;
    this.saveToStorage();
  }

  // Set custom author
  setCustomAuthor(author: string) {
    this.customAuthor = author;
    this.saveToStorage();
  }

  // Batch update data
  updateScript(data: {
    script?: Script | null;
    originalJson?: string;
    customTitle?: string;
    customAuthor?: string;
  }) {
    if (data.script !== undefined) this.script = data.script;
    if (data.originalJson !== undefined) this.originalJson = data.originalJson;
    if (data.customTitle !== undefined) this.customTitle = data.customTitle;
    if (data.customAuthor !== undefined) this.customAuthor = data.customAuthor;
    this.saveToStorage();
  }

  // Update character info
  updateCharacter(characterId: string, updates: Partial<Character>) {
    if (!this.script) return;

    console.log('ScriptStore.updateCharacter called:', {
      characterId,
      updates,
      hasReminders: 'reminders' in updates,
      remindersValue: updates.reminders,
    });

    // Create new script object to avoid directly modifying observable
    const updatedScript = { ...this.script };
    let updated = false;
    let targetCharacter: Character | null = null;
    let foundTeam: string | null = null;

    // Find the character to update (should only exist in one team)
    for (const team of Object.keys(updatedScript.characters)) {
      const charIndex = updatedScript.characters[team].findIndex(c => isSameCharacter(c.id, characterId));
      if (charIndex !== -1) {
        if (targetCharacter) {
          // If a character was already found, duplicate ID detected — this is a problem
          console.warn(`Duplicate character ID found: ${characterId}, exists in both team ${foundTeam} and ${team}`);
          continue; // Skip duplicate character
        }

        targetCharacter = updatedScript.characters[team][charIndex];
        foundTeam = team;

        // Create updated character
        const updatedCharacter = {
          ...targetCharacter,
          ...updates,
        };

        // Check if character needs to move to a different team
        if (updates.team && updates.team !== team) {
          // Remove from original team
          updatedScript.characters = {
            ...updatedScript.characters,
            [team]: updatedScript.characters[team].filter(c => !isSameCharacter(c.id, characterId))
          };

          // If original team is empty, delete the team
          if (updatedScript.characters[team].length === 0) {
            const { [team]: removed, ...rest } = updatedScript.characters;
            updatedScript.characters = rest as typeof updatedScript.characters;
          }

          // Add to new team
          if (!updatedScript.characters[updates.team]) {
            updatedScript.characters[updates.team] = [];
          }
          updatedScript.characters = {
            ...updatedScript.characters,
            [updates.team]: [...updatedScript.characters[updates.team], updatedCharacter]
          };
        } else {
          // Update within the same team
          updatedScript.characters = {
            ...updatedScript.characters,
            [team]: updatedScript.characters[team].map(c =>
              isSameCharacter(c.id, characterId) ? updatedCharacter : c
            )
          };
        }

        updated = true;
        break; // Exit loop after finding character
      }
    }

    // Update character in all array
    if (targetCharacter && updated) {
      const allIndex = updatedScript.all.findIndex(c => isSameCharacter(c.id, characterId));
      if (allIndex !== -1) {
        updatedScript.all = [...updatedScript.all];
        updatedScript.all[allIndex] = {
          ...targetCharacter,
          ...updates,
        };
      }
    }

    if (updated) {
      this.setScript(updatedScript);
      console.log('ScriptStore - Character updated successfully, preparing JSON sync:', {
        characterId,
        updatedCharacter: updatedScript.all.find(c => isSameCharacter(c.id, characterId)),
      });
      // Use the new precise update method
      this.updateCharacterInJson(characterId, updates);
    } else {
      console.log('Character to update not found:', characterId);
    }
  }

  // Reorder characters
  reorderCharacters(team: string, newOrder: string[]) {
    if (!this.script) return;

    const updatedScript = {
      ...this.script,
      characters: {
        ...this.script.characters,
        [team]: newOrder.map(id => this.script!.characters[team].find(c => isSameCharacter(c.id, id))!),
      },
    };

    // Rebuild all array to maintain consistency
    const newAllArray: Character[] = [];
    Object.values(updatedScript.characters).forEach(teamCharacters => {
      newAllArray.push(...teamCharacters);
    });
    updatedScript.all = newAllArray;

    this.setScript(updatedScript);
    // Use the new reorder method (preserves original format)
    const allIds = updatedScript.all.map(c => c.id);
    this.reorderCharactersInJson(allIds);
  }

  // Add character to script
  addCharacter(character: Character) {
    if (!this.script) return false;

    const updatedScript = { ...this.script };

    // Check if character already exists
    const exists = updatedScript.all.some(c => isSameCharacter(c.id, character.id));
    if (exists) {
      return false; // Return false to indicate character already exists
    }

    // Add to corresponding team
    if (!updatedScript.characters[character.team]) {
      updatedScript.characters[character.team] = [];
    }
    updatedScript.characters = {
      ...updatedScript.characters,
      [character.team]: [...updatedScript.characters[character.team], character]
    };

    // Add to all array
    updatedScript.all = [...updatedScript.all, character];

    this.setScript(updatedScript);
    // Use the new precise add method
    this.addCharacterToJson(character);
    return true; // Return true to indicate add succeeded
  }

  // Remove character from script
  removeCharacter(character: Character) {
    if (!this.script) return;

    const updatedScript = { ...this.script };

    // Remove from corresponding team
    if (updatedScript.characters[character.team]) {
      updatedScript.characters = {
        ...updatedScript.characters,
        [character.team]: updatedScript.characters[character.team].filter(c => !isSameCharacter(c.id, character.id))
      };

      // If team is empty, delete the team
      if (updatedScript.characters[character.team].length === 0) {
        const { [character.team]: removed, ...rest } = updatedScript.characters;
        updatedScript.characters = rest as typeof updatedScript.characters;
      }
    }

    // Remove from all array
    updatedScript.all = updatedScript.all.filter(c => !isSameCharacter(c.id, character.id));

    this.setScript(updatedScript);
    // Use the new precise delete method
    this.removeCharacterFromJson(character.id);
  }

  // Replace character (preserving original position)
  replaceCharacter(oldCharacter: Character, newCharacter: Character) {
    if (!this.script) return false;

    const updatedScript = { ...this.script };
    
    // Check if new character already exists (unless it's the one being replaced)
    const exists = updatedScript.all.some(
      c => isSameCharacter(c.id, newCharacter.id) && !isSameCharacter(c.id, oldCharacter.id),
    );
    if (exists) {
      return false; // Return false to indicate new character already exists
    }

    // Find old character's index in all array
    const allIndex = updatedScript.all.findIndex(c => isSameCharacter(c.id, oldCharacter.id));
    if (allIndex === -1) {
      return false; // Old character does not exist
    }

    // Replace in all array (preserving position)
    updatedScript.all = [...updatedScript.all];
    updatedScript.all[allIndex] = newCharacter;

    // Process team arrays
    // 1. Remove old character from old team
    if (updatedScript.characters[oldCharacter.team]) {
      const oldTeamIndex = updatedScript.characters[oldCharacter.team].findIndex(c =>
        isSameCharacter(c.id, oldCharacter.id),
      );
      if (oldTeamIndex !== -1) {
        updatedScript.characters = {
          ...updatedScript.characters,
          [oldCharacter.team]: updatedScript.characters[oldCharacter.team].filter(
            c => !isSameCharacter(c.id, oldCharacter.id),
          ),
        };
        
        // If old team is empty, delete the team
        if (updatedScript.characters[oldCharacter.team].length === 0) {
          const { [oldCharacter.team]: removed, ...rest } = updatedScript.characters;
          updatedScript.characters = rest as typeof updatedScript.characters;
        }
      }
    }

    // 2. Add to new team
    if (!updatedScript.characters[newCharacter.team]) {
      updatedScript.characters[newCharacter.team] = [];
    }
    updatedScript.characters = {
      ...updatedScript.characters,
      [newCharacter.team]: [...updatedScript.characters[newCharacter.team], newCharacter]
    };

    this.setScript(updatedScript);
    // Use the new precise replace method
    this.replaceCharacterInJson(oldCharacter.id, newCharacter);
    return true; // Return true to indicate replace succeeded
  }

  // Update title info
  updateTitleInfo(data: {
    title?: string;
    titleImage?: string;
    titleImageSize?: number;
    useTitleImage?: boolean;
    showTitleFlourish?: boolean;
    author?: string;
    playerCount?: string;
    textAlignment?: 'left' | 'center' | 'right';
    secondPageTitleText?: string;
    secondPageTitleImage?: string;
    secondPageTitleFontSize?: number;
    secondPageTitleImageSize?: number;
    useSecondPageTitleImage?: boolean;
  }) {
    if (!this.script) return;

    const updatedScript = { ...this.script };
    
    if (data.title !== undefined) updatedScript.title = data.title;
    
    // Handle titleImage: if undefined or empty string, delete the field
    if ('titleImage' in data) {
      if (data.titleImage) {
        updatedScript.titleImage = data.titleImage;
      } else {
        delete updatedScript.titleImage;
      }
    }
    
    if (data.titleImageSize !== undefined) {
      updatedScript.titleImageSize = data.titleImageSize;
    }
    
    if (data.useTitleImage !== undefined) {
      updatedScript.useTitleImage = data.useTitleImage;
    }

    if (data.showTitleFlourish !== undefined) {
      updatedScript.showTitleFlourish = data.showTitleFlourish;
    }

    if (data.author !== undefined) updatedScript.author = data.author;
    if (data.playerCount !== undefined) updatedScript.playerCount = data.playerCount;
    if (data.textAlignment !== undefined) (updatedScript as any).textAlignment = data.textAlignment;

    // Update second page title config
    if (data.secondPageTitleText !== undefined) {
      updatedScript.secondPageTitleText = data.secondPageTitleText;
    }
    if ('secondPageTitleImage' in data) {
      if (data.secondPageTitleImage) {
        updatedScript.secondPageTitleImage = data.secondPageTitleImage;
      } else {
        delete updatedScript.secondPageTitleImage;
      }
    }
    if (data.secondPageTitleFontSize !== undefined) {
      updatedScript.secondPageTitleFontSize = data.secondPageTitleFontSize;
    }
    if (data.secondPageTitleImageSize !== undefined) {
      updatedScript.secondPageTitleImageSize = data.secondPageTitleImageSize;
    }
    if (data.useSecondPageTitleImage !== undefined) {
      updatedScript.useSecondPageTitleImage = data.useSecondPageTitleImage;
    }

    this.setScript(updatedScript);
    this.syncTitleInfoToJson(data);
  }

  // Add second page component
  addSecondPageComponent(componentType: 'title' | 'ppl_table1' | 'ppl_table2') {
    if (!this.script) return;

    const updatedScript = { ...this.script };
    
    switch (componentType) {
      case 'title':
        updatedScript.secondPageTitle = true;
        break;
      case 'ppl_table1':
        updatedScript.secondPagePplTable1 = true;
        break;
      case 'ppl_table2':
        updatedScript.secondPagePplTable2 = true;
        break;
    }

    this.setScript(updatedScript);
    this.syncSecondPageComponentToJson(componentType, true);
  }

  // Remove second page component
  removeSecondPageComponent(componentType: 'title' | 'ppl_table1' | 'ppl_table2') {
    if (!this.script) return;

    const updatedScript = { ...this.script };
    
    switch (componentType) {
      case 'title':
        updatedScript.secondPageTitle = false;
        break;
      case 'ppl_table1':
        updatedScript.secondPagePplTable1 = false;
        break;
      case 'ppl_table2':
        updatedScript.secondPagePplTable2 = false;
        break;
    }

    this.setScript(updatedScript);
    this.syncSecondPageComponentToJson(componentType, false);
  }

  // Update special rule
  updateSpecialRule(rule: any) {
    if (!this.script) return;

    const updatedScript = { ...this.script };

    // Update rule in specialRules
    const firstPageIndex = updatedScript.specialRules.findIndex(r => r.id === rule.id);
    if (firstPageIndex !== -1) {
      updatedScript.specialRules[firstPageIndex] = rule;
    }

    // Update rule in secondPageRules (if exists)
    if (updatedScript.secondPageRules) {
      const secondPageIndex = updatedScript.secondPageRules.findIndex(r => r.id === rule.id);
      if (secondPageIndex !== -1) {
        updatedScript.secondPageRules[secondPageIndex] = rule;
      }
    }

    this.setScript(updatedScript);
    this.syncSpecialRuleUpdateToJson(rule);
  }

  // Delete special rule
  removeSpecialRule(rule: any) {
    if (!this.script) return;

    const updatedScript = { ...this.script };

    // Remove from specialRules
    updatedScript.specialRules = updatedScript.specialRules.filter(r => r.id !== rule.id);

    // Remove from secondPageRules (if exists)
    if (updatedScript.secondPageRules) {
      updatedScript.secondPageRules = updatedScript.secondPageRules.filter(r => r.id !== rule.id);
    }

    this.setScript(updatedScript);
    this.syncSpecialRuleToJson(rule);
  }

  // Add custom jinx relationship
  addCustomJinx(characterA: Character, characterB: Character, description: string) {
    if (!this.script) return;

    const updatedScript = { ...this.script };

    // Update jinx relationship (using character names as keys)
    if (description) {
      if (!updatedScript.jinx[characterA.name]) {
        updatedScript.jinx[characterA.name] = {};
      }
      updatedScript.jinx[characterA.name][characterB.name] = {
        reason: description,
        display: true,
        isOfficial: false,
      };
    }

    // Sync JSON first so generateNormalizedJson (called by setScript) sees updated jinxes
    this.syncCustomJinxToJson(characterA, characterB, description, 'add', true);
    this.setScript(updatedScript);
  }

  // Update official jinx rule (modify display state or custom description)
  updateOfficialJinx(
    characterA: Character,
    characterB: Character,
    updates: { display?: boolean; reason?: string }
  ) {
    if (!this.script) return;

    const updatedScript = { ...this.script };

    // Update bidirectional relationship
    if (updatedScript.jinx[characterA.name]?.[characterB.name]) {
      const currentJinx = updatedScript.jinx[characterA.name][characterB.name];
      updatedScript.jinx[characterA.name][characterB.name] = {
        ...currentJinx,
        ...updates,
      };
    }

    if (updatedScript.jinx[characterB.name]?.[characterA.name]) {
      const currentJinx = updatedScript.jinx[characterB.name][characterA.name];
      updatedScript.jinx[characterB.name][characterA.name] = {
        ...currentJinx,
        ...updates,
      };
    }

    // Sync JSON first so generateNormalizedJson (called by setScript) sees updated jinxes
    if (updates.reason !== undefined) {
      this.syncCustomJinxToJson(characterA, characterB, updates.reason, 'add', updates.display);
    } else if (updates.display !== undefined) {
      // Only update display state
      this.syncJinxDisplayToJson(characterA, characterB, updates.display);
    }
    this.setScript(updatedScript);
  }

  // Delete custom jinx relationship
  removeCustomJinx(characterA: Character, characterB: Character) {
    if (!this.script) return;

    const updatedScript = { ...this.script };

    // Remove from jinx relationships
    if (updatedScript.jinx[characterA.name]) {
      delete updatedScript.jinx[characterA.name][characterB.name];
      
      // If this character has no other jinx relationships, delete the key
      if (Object.keys(updatedScript.jinx[characterA.name]).length === 0) {
        delete updatedScript.jinx[characterA.name];
      }
    }

    // Also check reverse relationship
    if (updatedScript.jinx[characterB.name]) {
      delete updatedScript.jinx[characterB.name][characterA.name];
      
      if (Object.keys(updatedScript.jinx[characterB.name]).length === 0) {
        delete updatedScript.jinx[characterB.name];
      }
    }

    // Sync JSON first so generateNormalizedJson (called by setScript) sees updated jinxes
    this.syncCustomJinxToJson(characterA, characterB, '', 'remove', undefined);
    this.setScript(updatedScript);
  }

  // Sync only the jinx rule display state to JSON (inline jinxes format — Dante's Code style)
  private syncJinxDisplayToJson(
    characterA: Character,
    characterB: Character,
    display: boolean
  ) {
    console.log('Starting to sync jinx rule display state to JSON', { characterA: characterA.name, characterB: characterB.name, display });
    try {
      const jsonArray = this.safeParseOriginalJsonArray();

      // Helper: find a character entry and upgrade string→object if needed
      const ensureCharObject = (char: Character): { idx: number; obj: any } | null => {
        const idx = jsonArray.findIndex((item: any) => {
          if (typeof item === 'string') return isSameCharacter(item, char.id);
          if (!item || item.id === '_meta') return false;
          return isSameCharacter(item.id, char.id);
        });
        if (idx < 0) return null;
        if (typeof jsonArray[idx] === 'string') {
          const full = this.script?.all.find(c => isSameCharacter(c.id, char.id));
          jsonArray[idx] = {
            id: full?.id || char.id,
            name: full?.name || char.name,
            ability: full?.ability || '',
            team: full?.team || '',
            image: full?.image || '',
          };
        }
        return { idx, obj: jsonArray[idx] };
      };

      // Check both inline jinxes and legacy format
      const result = ensureCharObject(characterA);

      // Find existing jinx entry (inline jinxes first, then fallback to legacy)
      const findEntry = (): { container: any[]; entryIdx: number } | null => {
        // Check inline jinxes on character object
        if (result && result.obj.jinxes && Array.isArray(result.obj.jinxes)) {
          const ei = result.obj.jinxes.findIndex((j: any) => j && isSameCharacter(j.id, characterB.id));
          if (ei >= 0) return { container: result.obj.jinxes, entryIdx: ei };
        }
        // Fallback: check legacy team: 'a jinxed' entries
        const legacyIdx = jsonArray.findIndex((item: any) => {
          if (typeof item === 'string') return false;
          return item.team === 'a jinxed' && isSameCharacter(item.id, characterA.id)
            && item.jinx && item.jinx.some((j: any) => isSameCharacter(j.id, characterB.id));
        });
        if (legacyIdx >= 0) {
          const legacyItem = jsonArray[legacyIdx];
          const ei = legacyItem.jinx.findIndex((j: any) => isSameCharacter(j.id, characterB.id));
          // Migrate legacy → inline
          if (result) {
            if (!result.obj.jinxes || !Array.isArray(result.obj.jinxes)) {
              result.obj.jinxes = [];
            }
            result.obj.jinxes.push({ ...legacyItem.jinx[ei] });
            legacyItem.jinx.splice(ei, 1);
            if (legacyItem.jinx.length === 0) jsonArray.splice(legacyIdx, 1);
            const newEi = result.obj.jinxes.length - 1;
            return { container: result.obj.jinxes, entryIdx: newEi };
          }
          return { container: legacyItem.jinx, entryIdx: ei };
        }
        return null;
      };

      const found = findEntry();

      if (found) {
        if (display === true && !found.container[found.entryIdx]?.reason) {
          // Display set to true with no custom reason → remove entry (let official default show)
          found.container.splice(found.entryIdx, 1);
          if (found.container === result?.obj?.jinxes && found.container.length === 0) {
            delete result.obj.jinxes;
          }
        } else {
          // Update display state
          found.container[found.entryIdx].display = display;
        }
      } else if (display === false) {
        // Entry doesn't exist and we want to hide → create inline jinxes entry
        if (result) {
          if (!result.obj.jinxes || !Array.isArray(result.obj.jinxes)) {
            result.obj.jinxes = [];
          }
          result.obj.jinxes.push({ id: characterB.id, display: false });
        }
      }
      // If display=true and entry doesn't exist: do nothing (keep official default)

      const jsonString = JSON.stringify(jsonArray, null, 2);
      console.log('Jinx rule display state sync completed');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('Failed to sync jinx rule display state:', error);
    }
  }

  // Sync custom jinx relationship to JSON (inline jinxes format — Dante's Code style)
  private syncCustomJinxToJson(
    characterA: Character,
    characterB: Character,
    description: string,
    action: 'add' | 'remove',
    display?: boolean
  ) {
    console.log('Starting to sync custom jinx to JSON', { characterA: characterA.name, characterB: characterB.name, action });
    try {
      const jsonArray = this.safeParseOriginalJsonArray();

      // Helper: find a character entry index, upgrade string→object if needed
      const ensureCharObject = (char: Character): number => {
        let idx = jsonArray.findIndex((item: any) => {
          if (typeof item === 'string') return isSameCharacter(item, char.id);
          if (!item || item.id === '_meta') return false;
          return isSameCharacter(item.id, char.id);
        });
        if (idx < 0) return -1;
        // Upgrade simple string ID to full object
        if (typeof jsonArray[idx] === 'string') {
          const full = this.script?.all.find(c => isSameCharacter(c.id, char.id));
          jsonArray[idx] = {
            id: full?.id || char.id,
            name: full?.name || char.name,
            ability: full?.ability || '',
            team: full?.team || '',
            image: full?.image || '',
          };
        }
        return idx;
      };

      // Remove legacy team: 'a jinxed' entries for this pair (migration)
      const cleanLegacy = (char: Character, other: Character) => {
        const legacyIdx = jsonArray.findIndex((item: any) => {
          if (typeof item === 'string') return false;
          return item.team === 'a jinxed' && isSameCharacter(item.id, char.id);
        });
        if (legacyIdx >= 0 && jsonArray[legacyIdx].jinx) {
          jsonArray[legacyIdx].jinx = jsonArray[legacyIdx].jinx.filter(
            (j: any) => !isSameCharacter(j.id, other.id)
          );
          if (jsonArray[legacyIdx].jinx.length === 0) {
            jsonArray.splice(legacyIdx, 1);
          }
        }
      };

      // Apply jinx inline on characterA's entry
      const idx = ensureCharObject(characterA);
      if (idx >= 0) {
        const charObj = jsonArray[idx];

        if (action === 'add') {
          if (!charObj.jinxes || !Array.isArray(charObj.jinxes)) {
            charObj.jinxes = [];
          }
          const existIdx = charObj.jinxes.findIndex((j: any) =>
            j && isSameCharacter(j.id, characterB.id)
          );
          const entry: any = { id: characterB.id };
          if (description) entry.reason = description;
          if (display !== undefined) entry.display = display;
          if (existIdx >= 0) {
            charObj.jinxes[existIdx] = entry;
          } else {
            charObj.jinxes.push(entry);
          }
        } else if (action === 'remove') {
          if (charObj.jinxes && Array.isArray(charObj.jinxes)) {
            charObj.jinxes = charObj.jinxes.filter(
              (j: any) => !isSameCharacter(j.id, characterB.id)
            );
            if (charObj.jinxes.length === 0) delete charObj.jinxes;
          }
        }
      }

      // Clean up any legacy team: 'a jinxed' format entries
      cleanLegacy(characterA, characterB);
      cleanLegacy(characterB, characterA);

      const jsonString = JSON.stringify(jsonArray, null, 2);
      console.log('Custom jinx sync completed');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('Failed to sync custom jinx:', error);
    }
  }

  // Sync title info to JSON
  private syncTitleInfoToJson(data: {
    title?: string;
    titleImage?: string;
    titleImageSize?: number;
    useTitleImage?: boolean;
    showTitleFlourish?: boolean;
    author?: string;
    playerCount?: string;
    textAlignment?: 'left' | 'center' | 'right';
    secondPageTitleText?: string;
    secondPageTitleImage?: string;
    secondPageTitleFontSize?: number;
    secondPageTitleImageSize?: number;
    useSecondPageTitleImage?: boolean;
  }) {
    console.log('Starting to sync title info to JSON', data);
    try {
      const jsonArray = this.safeParseOriginalJsonArray();

      // Check if _meta item exists
      let hasMetaItem = false;
      const newJsonArray = jsonArray.map((item: any) => {
        if (item.id === '_meta') {
          hasMetaItem = true;
          const updatedMeta = { ...item };
          
          if (data.title !== undefined) updatedMeta.name = data.title;
          
          // Handle image title: process titleImage field whenever it exists (even undefined)
          if ('titleImage' in data) {
            console.log('Processing titleImage field:', data.titleImage);
            if (data.titleImage) {
              updatedMeta.titleImage = data.titleImage;
              console.log('Set titleImage:', data.titleImage);
            } else {
              delete updatedMeta.titleImage;
              delete updatedMeta.logo;
              console.log('Deleted titleImage and logo fields');
            }
          }
          
          if (data.titleImageSize !== undefined) {
            updatedMeta.titleImageSize = data.titleImageSize;
          }
          if (data.useTitleImage !== undefined) {
            updatedMeta.use_title_image = data.useTitleImage;
          }
          if (data.showTitleFlourish !== undefined) {
            updatedMeta.show_title_flourish = data.showTitleFlourish;
          }
          if (data.author !== undefined) updatedMeta.author = data.author;
          if (data.playerCount !== undefined) {
            if (data.playerCount) {
              updatedMeta.playerCount = data.playerCount;
            } else {
              delete updatedMeta.playerCount;
            }
          }
          if (data.textAlignment !== undefined) {
            if (data.textAlignment && data.textAlignment !== 'center') {
              updatedMeta.text_alignment = data.textAlignment;
            } else {
              delete updatedMeta.text_alignment;
            }
          }
          
          // Sync second page title config
          if (data.secondPageTitleText !== undefined) {
            updatedMeta.second_page_title_text = data.secondPageTitleText;
          }
          if ('secondPageTitleImage' in data) {
            if (data.secondPageTitleImage) {
              updatedMeta.second_page_title_image = data.secondPageTitleImage;
            } else {
              delete updatedMeta.second_page_title_image;
            }
          }
          if (data.secondPageTitleFontSize !== undefined) {
            updatedMeta.second_page_title_font_size = data.secondPageTitleFontSize;
          }
          if (data.secondPageTitleImageSize !== undefined) {
            updatedMeta.second_page_title_image_size = data.secondPageTitleImageSize;
          }
          if (data.useSecondPageTitleImage !== undefined) {
            updatedMeta.use_second_page_title_image = data.useSecondPageTitleImage;
          }
          
          console.log('Updated _meta:', updatedMeta);
          return updatedMeta;
        }
        return item;
      });

      // If no _meta item, create a new one and insert at the beginning
      if (!hasMetaItem) {
        console.log('_meta item not found, creating new _meta');
        const newMeta: any = {
          id: '_meta',
          name: data.title || 'Custom Your Script!',
          author: data.author || '',
        };
        
        if (data.titleImage) {
          newMeta.titleImage = data.titleImage;
        }
        if (data.titleImageSize !== undefined) {
          newMeta.titleImageSize = data.titleImageSize;
        }
        if (data.playerCount) {
          newMeta.playerCount = data.playerCount;
        }
        if (data.textAlignment && data.textAlignment !== 'center') {
          newMeta.text_alignment = data.textAlignment;
        }
        if (data.secondPageTitleText) {
          newMeta.second_page_title_text = data.secondPageTitleText;
        }
        if (data.secondPageTitleImage) {
          newMeta.second_page_title_image = data.secondPageTitleImage;
        }
        if (data.secondPageTitleFontSize !== undefined) {
          newMeta.second_page_title_font_size = data.secondPageTitleFontSize;
        }
        if (data.secondPageTitleImageSize !== undefined) {
          newMeta.second_page_title_image_size = data.secondPageTitleImageSize;
        }
        
        newJsonArray.unshift(newMeta);
        console.log('Newly created _meta:', newMeta);
      }

      const jsonString = JSON.stringify(newJsonArray, null, 2);
      console.log('Title info sync completed');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('Failed to sync title info:', error);
    }
  }

  // Update second page component order
  updateSecondPageOrder(order: string[]) {
    if (!this.script) return;

    const updatedScript = { ...this.script };
    updatedScript.secondPageOrder = order;

    this.setScript(updatedScript);
    this.syncSecondPageOrderToJson(order);
  }

  // Sync second page component order to JSON
  private syncSecondPageOrderToJson(order: string[]) {
    console.log('Starting to sync second page component order to JSON', order);
    try {
      const jsonArray = this.safeParseOriginalJsonArray();

      // Check if _meta item exists
      let hasMetaItem = false;
      const newJsonArray = jsonArray.map((item: any) => {
        if (item.id === '_meta') {
          hasMetaItem = true;
          const updatedMeta = { ...item };
          updatedMeta.second_page_order = order.join(' ');
          return updatedMeta;
        }
        return item;
      });

      // If no _meta item, create a new one and insert at the beginning
      if (!hasMetaItem) {
        const newMeta: any = {
          id: '_meta',
          name: 'Custom Your Script!',
          author: '',
          second_page_order: order.join(' '),
        };
        newJsonArray.unshift(newMeta);
      }

      const jsonString = JSON.stringify(newJsonArray, null, 2);
      console.log('Second page component order sync completed');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('Failed to sync second page component order:', error);
    }
  }

  // Sync second page component config to JSON
  private syncSecondPageComponentToJson(
    componentType: 'title' | 'ppl_table1' | 'ppl_table2',
    enabled: boolean
  ) {
    console.log('Starting to sync second page component config to JSON', { componentType, enabled });
    try {
      const jsonArray = this.safeParseOriginalJsonArray();

      // Check if _meta item exists
      let hasMetaItem = false;
      const newJsonArray = jsonArray.map((item: any) => {
        if (item.id === '_meta') {
          hasMetaItem = true;
          const updatedMeta = { ...item };
          
          // Update the corresponding config item
          switch (componentType) {
            case 'title':
              updatedMeta.second_page_title = enabled;
              break;
            case 'ppl_table1':
              updatedMeta.second_page_ppl_table1 = enabled;
              break;
            case 'ppl_table2':
              updatedMeta.second_page_ppl_table2 = enabled;
              break;
          }
          
          return updatedMeta;
        }
        return item;
      });

      // If no _meta item, create a new one and insert at the beginning
      if (!hasMetaItem) {
        const newMeta: any = {
          id: '_meta',
          name: 'Custom Your Script!',
          author: '',
        };

        // Set the corresponding config item
        switch (componentType) {
          case 'title':
            newMeta.second_page_title = enabled;
            break;
          case 'ppl_table1':
            newMeta.second_page_ppl_table1 = enabled;
            break;
          case 'ppl_table2':
            newMeta.second_page_ppl_table2 = enabled;
            break;
        }
        
        newJsonArray.unshift(newMeta);
      }

      const jsonString = JSON.stringify(newJsonArray, null, 2);
      console.log('Second page component config sync completed');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('Failed to sync second page component config:', error);
    }
  }

  // Sync special rule update to JSON
  private syncSpecialRuleUpdateToJson(updatedRule: any) {
    console.log('Starting to sync special rule update to JSON', updatedRule);
    try {
      const jsonArray = this.safeParseOriginalJsonArray();

      let newJsonArray: any[] = [];

      if (updatedRule.sourceType === 'state' || updatedRule.sourceType === 'status') {
        // Handle state/status type
        newJsonArray = jsonArray.map((item: any) => {
          if (item.id === '_meta') {
            const updatedMeta = { ...item };
            
            if (updatedRule.sourceType === 'state' && updatedMeta.state) {
              updatedMeta.state = updatedMeta.state.map((state: any, index: number) => {
                if (index === updatedRule.sourceIndex) {
                  return {
                    ...state,
                    stateName: updatedRule.title,
                    stateDescription: updatedRule.content,
                  };
                }
                return state;
              });
            }
            
            if (updatedRule.sourceType === 'status' && updatedMeta.status) {
              updatedMeta.status = updatedMeta.status.map((status: any, index: number) => {
                if (index === updatedRule.sourceIndex) {
                  return {
                    ...status,
                    name: updatedRule.title,
                    skill: updatedRule.content,
                  };
                }
                return status;
              });
            }
            
            return updatedMeta;
          }
          return item;
        });
      } else if (updatedRule.sourceType === 'special_rule') {
        // Handle special_rule type
        newJsonArray = jsonArray.map((item: any) => {
          if (item.id === updatedRule.id) {
            return {
              ...item,
              title: updatedRule.title,
              content: updatedRule.content,
            };
          }
          return item;
        });
      } else {
        // Unknown type, keep as-is
        newJsonArray = jsonArray;
      }

      const jsonString = JSON.stringify(newJsonArray, null, 2);
      console.log('Special rule update sync completed');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('Failed to sync special rule update:', error);
    }
  }

  // Sync special rule deletion to JSON
  private syncSpecialRuleToJson(deletedRule: any) {
    console.log('Starting to sync special rule deletion to JSON', deletedRule);
    try {
      const jsonArray = this.safeParseOriginalJsonArray();

      let newJsonArray: any[] = [];

      if (deletedRule.sourceType === 'state' || deletedRule.sourceType === 'status') {
        // Handle state/status type
        newJsonArray = jsonArray.map((item: any) => {
          if (item.id === '_meta') {
            const updatedMeta = { ...item };

            if (deletedRule.sourceType === 'state' && updatedMeta.state) {
              // Delete state at the corresponding index
              updatedMeta.state = updatedMeta.state.filter(
                (_: any, index: number) => index !== deletedRule.sourceIndex
              );
              // If state array is empty, delete the field
              if (updatedMeta.state.length === 0) {
                delete updatedMeta.state;
              }
            }
            
            if (deletedRule.sourceType === 'status' && updatedMeta.status) {
              // Delete status at the corresponding index
              updatedMeta.status = updatedMeta.status.filter(
                (_: any, index: number) => index !== deletedRule.sourceIndex
              );
              // If status array is empty, delete the field
              if (updatedMeta.status.length === 0) {
                delete updatedMeta.status;
              }
            }
            
            return updatedMeta;
          }
          return item;
        });
      } else if (deletedRule.sourceType === 'special_rule') {
        // Handle special_rule type - delete the entire object
        newJsonArray = jsonArray.filter((item: any) => item.id !== deletedRule.id);
      } else {
        // Unknown type, keep as-is
        newJsonArray = jsonArray;
      }

      const jsonString = JSON.stringify(newJsonArray, null, 2);
      console.log('Special rule deletion sync completed, updating originalJson');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('Failed to sync special rule deletion:', error);
    }
  }

  // ===== New precise JSON update methods =====

  // Update a single character's JSON (only modify that character, preserving original format)
  private updateCharacterInJson(characterId: string, updates: Partial<Character>) {
    console.log('updateCharacterInJson:', { characterId, updates });
    try {
      const jsonArray = this.safeParseOriginalJsonArray();
      
      let updated = false;
      const newJsonArray = jsonArray.map((item: any) => {
        const itemObj = typeof item === 'string' ? { id: item } : item;
        
        if (
          isSameCharacter(String(itemObj.id), characterId) &&
          itemObj.id !== '_meta' &&
          itemObj.team !== 'a jinxed' &&
          itemObj.team !== 'special_rule'
        ) {
          updated = true;
          
          // If simple format (only ID string)
          if (typeof item === 'string') {
            // In official ID mode, keep simple format (don't save custom info to JSON)
            if (configStore.config.officialIdParseMode) {
              // Official ID mode: keep simple format, don't modify JSON
              console.log('Official ID mode: keeping simple format, not saving custom data to JSON');
              return item;
            } else {
              // Normal mode: upgrade to full format, preserving all character fields (avoid losing name/ability/team)
              console.log('Normal mode: upgrading to full format, adding custom fields');
              const fullCharacter = this.script?.all.find(c => isSameCharacter(c.id, characterId));
              const base = fullCharacter
                ? { id: characterId, name: fullCharacter.name, ability: fullCharacter.ability, team: fullCharacter.team, image: fullCharacter.image }
                : { id: characterId };
              return {
                ...base,
                ...updates,
              };
            }
          } else {
            // Full format: only update modified fields
            // In official ID mode, remove night order customizations (use official data)
            if (configStore.config.officialIdParseMode) {
              const updatedItem = { ...item };
              // Remove night order fields, let them be fetched from official library
              if ('firstNight' in updates || 'otherNight' in updates) {
                delete updatedItem.firstNight;
                delete updatedItem.otherNight;
                console.log('Official ID mode: removing night order customization, using official data');
              }
              // Apply other non-night-order updates
              const nonNightUpdates = Object.keys(updates)
                .filter(key => key !== 'firstNight' && key !== 'otherNight')
                .reduce((acc, key) => ({ ...acc, [key]: (updates as any)[key] }), {} as Partial<Character>);
              return {
                ...updatedItem,
                ...nonNightUpdates,
              };
            } else {
              // Normal mode: update normally
              return {
                ...item,
                ...updates,
              };
            }
          }
        }
        return item;
      });
      
      if (updated) {
        this.setOriginalJson(JSON.stringify(newJsonArray, null, 2));
        console.log('Character JSON updated');
      } else {
        console.warn('Character to update not found:', characterId);
      }
    } catch (error) {
      console.error('Failed to update character JSON:', error);
    }
  }
  
  // Add character to JSON
  private addCharacterToJson(character: Character) {
    console.log('addCharacterToJson:', character.id);
    try {
      const jsonArray = this.safeParseOriginalJsonArray();

      // Check if already exists
      const exists = jsonArray.some((item: any) => {
        const id = typeof item === 'string' ? item : item.id;
        return id === character.id;
      });

      if (exists) {
        console.warn('Character already exists, skipping add:', character.id);
        return;
      }

      // Find insertion position (before jinxed and special_rule)
      let insertIndex = jsonArray.length;
      for (let i = jsonArray.length - 1; i >= 0; i--) {
        const item = jsonArray[i];
        const itemObj = typeof item === 'string' ? { id: item } : item;
        if (itemObj.team === 'a jinxed' || itemObj.team === 'special_rule') {
          insertIndex = i;
        } else {
          break;
        }
      }
      
      // Official ID mode: only add ID
      if (configStore.config.officialIdParseMode) {
        jsonArray.splice(insertIndex, 0, character.id);
      } else {
        // Normal mode: add full info
        const newItem: any = {
          id: character.id,
          name: character.name,
          ability: character.ability,
          team: character.team,
          image: character.image,
        };
        
        // Optional fields
        if (character.firstNight) newItem.firstNight = character.firstNight;
        if (character.otherNight) newItem.otherNight = character.otherNight;
        if (character.firstNightReminder) newItem.firstNightReminder = character.firstNightReminder;
        if (character.otherNightReminder) newItem.otherNightReminder = character.otherNightReminder;
        if (character.reminders && character.reminders.length > 0) newItem.reminders = character.reminders;
        if (character.remindersGlobal && character.remindersGlobal.length > 0) newItem.remindersGlobal = character.remindersGlobal;
        if (character.setup) newItem.setup = character.setup;
        
        jsonArray.splice(insertIndex, 0, newItem);
      }
      
      this.setOriginalJson(JSON.stringify(jsonArray, null, 2));
      console.log('Character added to JSON');
    } catch (error) {
      console.error('Failed to add character to JSON:', error);
    }
  }

  // Remove character from JSON
  private removeCharacterFromJson(characterId: string) {
    console.log('removeCharacterFromJson:', characterId);
    try {
      const jsonArray = this.safeParseOriginalJsonArray();
      
      const newJsonArray = jsonArray.filter((item: any) => {
        const id = typeof item === 'string' ? item : item.id;
        return id !== characterId;
      });
      
      this.setOriginalJson(JSON.stringify(newJsonArray, null, 2));
      console.log('Character removed from JSON');
    } catch (error) {
      console.error('Failed to remove character from JSON:', error);
    }
  }
  
  // Replace character in JSON (preserving format and position)
  private replaceCharacterInJson(oldId: string, newCharacter: Character) {
    console.log('replaceCharacterInJson:', { oldId, newId: newCharacter.id });
    try {
      const jsonArray = this.safeParseOriginalJsonArray();

      const index = jsonArray.findIndex((item: any) => {
        const id = typeof item === 'string' ? item : item.id;
        return id === oldId;
      });

      if (index === -1) {
        console.warn('Character to replace not found:', oldId);
        return;
      }
      
      const oldItem = jsonArray[index];
      const wasSimple = typeof oldItem === 'string';
      
      // Official ID mode and original was simple format: keep simple format
      if (wasSimple && configStore.config.officialIdParseMode) {
        jsonArray[index] = newCharacter.id;
      } else {
        // Otherwise use full format
        const newItem: any = {
          id: newCharacter.id,
          name: newCharacter.name,
          ability: newCharacter.ability,
          team: newCharacter.team,
          image: newCharacter.image,
        };
        
        // Optional fields
        if (newCharacter.firstNight) newItem.firstNight = newCharacter.firstNight;
        if (newCharacter.otherNight) newItem.otherNight = newCharacter.otherNight;
        if (newCharacter.firstNightReminder) newItem.firstNightReminder = newCharacter.firstNightReminder;
        if (newCharacter.otherNightReminder) newItem.otherNightReminder = newCharacter.otherNightReminder;
        if (newCharacter.reminders && newCharacter.reminders.length > 0) newItem.reminders = newCharacter.reminders;
        if (newCharacter.remindersGlobal && newCharacter.remindersGlobal.length > 0) newItem.remindersGlobal = newCharacter.remindersGlobal;
        if (newCharacter.setup) newItem.setup = newCharacter.setup;
        
        jsonArray[index] = newItem;
      }
      
      this.setOriginalJson(JSON.stringify(jsonArray, null, 2));
      console.log('Character replaced');
    } catch (error) {
      console.error('Failed to replace character:', error);
    }
  }

  // Reorder characters (preserving original format, only changing order)
  private reorderCharactersInJson(newOrder: string[]) {
    console.log('reorderCharactersInJson:', newOrder);
    try {
      const jsonArray = this.safeParseOriginalJsonArray();
      
      // Categorize: meta, characters, jinxed, special_rule
      let metaItem: any = null;
      const characterItems = new Map<string, any>();
      const jinxedItems: any[] = [];
      const specialRuleItems: any[] = [];
      
      jsonArray.forEach((item: any) => {
        const itemObj = typeof item === 'string' ? { id: item } : item;
        
        if (itemObj.id === '_meta') {
          metaItem = item;
        } else if (itemObj.team === 'a jinxed') {
          jinxedItems.push(item);
        } else if (itemObj.team === 'special_rule') {
          specialRuleItems.push(item);
        } else {
          characterItems.set(itemObj.id, item); // Preserve original format
        }
      });
      
      // Rebuild array: meta -> characters (in new order) -> jinxed -> special_rule
      const newJsonArray: any[] = [];
      
      if (metaItem) newJsonArray.push(metaItem);
      
      newOrder.forEach(id => {
        if (characterItems.has(id)) {
          newJsonArray.push(characterItems.get(id));
        }
      });
      
      newJsonArray.push(...jinxedItems);
      newJsonArray.push(...specialRuleItems);
      
      this.setOriginalJson(JSON.stringify(newJsonArray, null, 2));
      console.log('Character order updated');
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  }

  // Old global sync method (kept as backup, no longer actively used)
  private syncScriptToJson_DEPRECATED(updatedScript: Script) {
    console.warn('Using deprecated syncScriptToJson method');
    // Keep original code as backup...
  }

  // Clear all data
  clear() {
    this.script = null;
    this.originalJson = '';
    this.normalizedJson = '';
    this.customTitle = '';
    this.customAuthor = '';
    // Remove script data from localStorage
    try {
      localStorage.removeItem('botc-script-data');
      console.log('Deleted localStorage key: botc-script-data');
    } catch (error) {
      console.warn('Failed to delete script data:', error);
    }
  }

  // Save to localStorage
  private saveToStorage() {
    saveCachedScriptData({
      originalJson: this.originalJson,
      normalizedJson: this.normalizedJson,
      customTitle: this.customTitle,
      customAuthor: this.customAuthor,
    });
  }

  // Load from localStorage
  private loadFromStorage() {
    const data = loadCachedScriptData();
    if (!data) return;

    // Never restore potentially-corrupt cached script object.
    // Always re-parse from originalJson on next generateScript call.
    this.script = null;
    this.originalJson = data.originalJson;
    this.normalizedJson = data.normalizedJson;
    this.customTitle = data.customTitle;
    this.customAuthor = data.customAuthor;
  }

  // Check if there is stored data
  get hasStoredData(): boolean {
    return !!this.originalJson;
  }

  // Get default example.json data
  async loadDefaultExample(): Promise<string> {
    try {
      const response = await fetch('/scripts/自定义剧本/example.json');
      if (response.ok) {
        const data = await response.json();
        return JSON.stringify(data, null, 2);
      }
    } catch (error) {
      console.warn('Failed to load default example:', error);
    }

    // If loading fails, return a basic example
    return JSON.stringify([
      {"id":"_meta","author":"Onion","name":"Custom Your Script!"},
      "noble","shugenja","pixie","highpriestess","villageidiot",
      "mathematician","oracle","savant","philosopher","huntsman",
      "artist","cannibal","ravenkeeper","recluse","klutz",
      "mutant","damsel","poisoner","cerenovus","marionette",
      "boffin","nodashii","imp","ojo","fanggu"
    ], null, 2);
  }
}

export const scriptStore = new ScriptStore();
