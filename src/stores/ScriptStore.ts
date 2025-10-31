import { makeAutoObservable } from 'mobx';
import type { Script, Character } from '../types';
import { configStore } from './ConfigStore';

class ScriptStore {
  script: Script | null = null;
  originalJson: string = ''; // 用户输入的原始JSON
  normalizedJson: string = ''; // 经过官方数据补全后的完整JSON（用于导出、分享等）
  customTitle: string = '';
  customAuthor: string = '';
  
  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  // 设置剧本数据
  setScript(script: Script | null) {
    // 在设置前，尝试从 originalJson 解析 _meta.name_en 存入脚本（不影响默认标题）
    if (script) {
      try {
        const parsed = JSON.parse(this.originalJson || '[]');
        const meta = Array.isArray(parsed) ? parsed.find((it: any) => it && it.id === '_meta') : (parsed && parsed._meta);
        const nameEn = meta && (meta.name_en || meta.nameEn);
        if (typeof nameEn === 'string' && nameEn.trim()) {
          (script as any).titleEn = nameEn.trim();
        }
      } catch {}
    }
    this.script = script;
    // 同时生成规范化的JSON
    if (script) {
      this.generateNormalizedJson(script);
    }
    this.saveToStorage();
  }

  // 从 Script 对象生成规范化的完整 JSON
  private generateNormalizedJson(script: Script) {
    try {
      const jsonArray: any[] = [];

      // 1. 添加 _meta
      const meta: any = {
        id: '_meta',
        name: script.title,
        author: script.author || '',
      };
      if ((script as any).titleEn) meta.name_en = (script as any).titleEn;
      if (script.titleImage) meta.titleImage = script.titleImage;
      if (script.titleImageSize) meta.titleImageSize = script.titleImageSize;
      if (script.useTitleImage !== undefined) meta.use_title_image = script.useTitleImage;
      if (script.playerCount) meta.playerCount = script.playerCount;
      
      // 第二页配置
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

      // state 和 status（从 specialRules 中提取）
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
      
      // 同时检查 secondPageRules
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

      // 2. 添加所有角色（使用 script.all 保持顺序）
      script.all.forEach(character => {
        const charJson: any = {
          id: character.id,
          name: character.name,
          ability: character.ability,
          team: character.team,
          image: character.image,
        };

        // 添加可选字段
        if (character.firstNight) charJson.firstNight = character.firstNight;
        if (character.otherNight) charJson.otherNight = character.otherNight;
        if (character.firstNightReminder) charJson.firstNightReminder = character.firstNightReminder;
        if (character.otherNightReminder) charJson.otherNightReminder = character.otherNightReminder;
        if (character.reminders && character.reminders.length > 0) charJson.reminders = character.reminders;
        if (character.remindersGlobal && character.remindersGlobal.length > 0) charJson.remindersGlobal = character.remindersGlobal;
        if (character.setup) charJson.setup = character.setup;

        jsonArray.push(charJson);
      });

      // 3. 添加相克规则（从 originalJson 中提取）
      try {
        const originalParsed = JSON.parse(this.originalJson);
        const originalArray = Array.isArray(originalParsed) ? originalParsed : [];
        
        // 找出所有 team === 'a jinxed' 的项
        const jinxItems = originalArray.filter((item: any) => {
          const itemObj = typeof item === 'string' ? { id: item } : item;
          return itemObj.team === 'a jinxed';
        });
        
        // 添加到规范化JSON中
        jinxItems.forEach((item: any) => jsonArray.push(item));
      } catch (error) {
        console.warn('提取相克规则失败:', error);
      }

      // 4. 添加特殊规则
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
      console.log('✅ 已生成规范化JSON');
    } catch (error) {
      console.error('生成规范化JSON失败:', error);
      // 如果生成失败，使用原始JSON作为备份
      this.normalizedJson = this.originalJson;
    }
  }

  // 设置原始 JSON
  setOriginalJson(json: string) {
    this.originalJson = json;
    this.saveToStorage();
  }

  // 设置自定义标题
  setCustomTitle(title: string) {
    this.customTitle = title;
    this.saveToStorage();
  }

  // 设置自定义作者
  setCustomAuthor(author: string) {
    this.customAuthor = author;
    this.saveToStorage();
  }

  // 批量更新数据
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

  // 更新角色信息
  updateCharacter(characterId: string, updates: Partial<Character>) {
    if (!this.script) return;
    
    console.log('ScriptStore.updateCharacter 被调用:', { 
      characterId, 
      updates,
      hasReminders: 'reminders' in updates,
      remindersValue: updates.reminders,
    });

    // 创建新的script对象，避免直接修改observable
    const updatedScript = { ...this.script };
    let updated = false;
    let targetCharacter: Character | null = null;
    let foundTeam: string | null = null;

    // 找到要更新的角色（只应该在一个团队中）
    for (const team of Object.keys(updatedScript.characters)) {
      const charIndex = updatedScript.characters[team].findIndex(c => c.id === characterId);
      if (charIndex !== -1) {
        if (targetCharacter) {
          // 如果已经找到了一个角色，说明有重复ID，这是个问题
          console.warn(`发现重复的角色ID: ${characterId}，在团队 ${foundTeam} 和 ${team} 中都存在`);
          continue; // 跳过重复的角色
        }
        
        targetCharacter = updatedScript.characters[team][charIndex];
        foundTeam = team;
        
        // 创建更新后的角色
        const updatedCharacter = {
          ...targetCharacter,
          ...updates,
        };

        // 检查是否需要移动到不同的团队
        if (updates.team && updates.team !== team) {
          // 从原团队中删除
          updatedScript.characters = {
            ...updatedScript.characters,
            [team]: updatedScript.characters[team].filter(c => c.id !== characterId)
          };
          
          // 如果原团队为空，删除该团队
          if (updatedScript.characters[team].length === 0) {
            const { [team]: removed, ...rest } = updatedScript.characters;
            updatedScript.characters = rest as typeof updatedScript.characters;
          }
          
          // 添加到新团队
          if (!updatedScript.characters[updates.team]) {
            updatedScript.characters[updates.team] = [];
          }
          updatedScript.characters = {
            ...updatedScript.characters,
            [updates.team]: [...updatedScript.characters[updates.team], updatedCharacter]
          };
        } else {
          // 在同一团队内更新
          updatedScript.characters = {
            ...updatedScript.characters,
            [team]: updatedScript.characters[team].map(c => 
              c.id === characterId ? updatedCharacter : c
            )
          };
        }
        
        updated = true;
        break; // 找到角色后退出循环
      }
    }

    // 更新all数组中的角色
    if (targetCharacter && updated) {
      const allIndex = updatedScript.all.findIndex(c => c.id === characterId);
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
      console.log('ScriptStore - 角色更新成功，准备同步JSON:', {
        characterId,
        updatedCharacter: updatedScript.all.find(c => c.id === characterId),
      });
      // 使用新的精准更新方法
      this.updateCharacterInJson(characterId, updates);
    } else {
      console.log('没有找到要更新的角色:', characterId);
    }
  }

  // 重新排序角色
  reorderCharacters(team: string, newOrder: string[]) {
    if (!this.script) return;

    const updatedScript = {
      ...this.script,
      characters: {
        ...this.script.characters,
        [team]: newOrder.map(id => this.script!.characters[team].find(c => c.id === id)!),
      },
    };

    // 重新构建 all 数组以保持一致性
    const newAllArray: Character[] = [];
    Object.values(updatedScript.characters).forEach(teamCharacters => {
      newAllArray.push(...teamCharacters);
    });
    updatedScript.all = newAllArray;

    this.setScript(updatedScript);
    // 使用新的重排序方法（保留原格式）
    const allIds = updatedScript.all.map(c => c.id);
    this.reorderCharactersInJson(allIds);
  }

  // 添加角色到剧本
  addCharacter(character: Character) {
    if (!this.script) return false;

    const updatedScript = { ...this.script };
    
    // 检查角色是否已存在
    const exists = updatedScript.all.some(c => c.id === character.id);
    if (exists) {
      return false; // 返回false表示角色已存在
    }

    // 添加到对应团队
    if (!updatedScript.characters[character.team]) {
      updatedScript.characters[character.team] = [];
    }
    updatedScript.characters = {
      ...updatedScript.characters,
      [character.team]: [...updatedScript.characters[character.team], character]
    };
    
    // 添加到all数组
    updatedScript.all = [...updatedScript.all, character];

    this.setScript(updatedScript);
    // 使用新的精准添加方法
    this.addCharacterToJson(character);
    return true; // 返回true表示添加成功
  }

  // 从剧本中删除角色
  removeCharacter(character: Character) {
    if (!this.script) return;

    const updatedScript = { ...this.script };
    
    // 从对应团队中删除
    if (updatedScript.characters[character.team]) {
      updatedScript.characters = {
        ...updatedScript.characters,
        [character.team]: updatedScript.characters[character.team].filter(c => c.id !== character.id)
      };
      
      // 如果团队为空，删除该团队
      if (updatedScript.characters[character.team].length === 0) {
        const { [character.team]: removed, ...rest } = updatedScript.characters;
        updatedScript.characters = rest as typeof updatedScript.characters;
      }
    }
    
    // 从all数组中删除
    updatedScript.all = updatedScript.all.filter(c => c.id !== character.id);

    this.setScript(updatedScript);
    // 使用新的精准删除方法
    this.removeCharacterFromJson(character.id);
  }

  // 替换角色（保持原位置）
  replaceCharacter(oldCharacter: Character, newCharacter: Character) {
    if (!this.script) return false;

    const updatedScript = { ...this.script };
    
    // 检查新角色是否已存在（除非它就是要被替换的角色）
    const exists = updatedScript.all.some(c => c.id === newCharacter.id && c.id !== oldCharacter.id);
    if (exists) {
      return false; // 返回false表示新角色已存在
    }

    // 在all数组中找到旧角色的索引
    const allIndex = updatedScript.all.findIndex(c => c.id === oldCharacter.id);
    if (allIndex === -1) {
      return false; // 旧角色不存在
    }

    // 在all数组中替换（保持位置）
    updatedScript.all = [...updatedScript.all];
    updatedScript.all[allIndex] = newCharacter;

    // 处理团队数组
    // 1. 从旧团队中删除旧角色
    if (updatedScript.characters[oldCharacter.team]) {
      const oldTeamIndex = updatedScript.characters[oldCharacter.team].findIndex(c => c.id === oldCharacter.id);
      if (oldTeamIndex !== -1) {
        updatedScript.characters = {
          ...updatedScript.characters,
          [oldCharacter.team]: updatedScript.characters[oldCharacter.team].filter(c => c.id !== oldCharacter.id)
        };
        
        // 如果旧团队为空，删除该团队
        if (updatedScript.characters[oldCharacter.team].length === 0) {
          const { [oldCharacter.team]: removed, ...rest } = updatedScript.characters;
          updatedScript.characters = rest as typeof updatedScript.characters;
        }
      }
    }

    // 2. 添加到新团队
    if (!updatedScript.characters[newCharacter.team]) {
      updatedScript.characters[newCharacter.team] = [];
    }
    updatedScript.characters = {
      ...updatedScript.characters,
      [newCharacter.team]: [...updatedScript.characters[newCharacter.team], newCharacter]
    };

    this.setScript(updatedScript);
    // 使用新的精准替换方法
    this.replaceCharacterInJson(oldCharacter.id, newCharacter);
    return true; // 返回true表示替换成功
  }

  // 更新标题信息
  updateTitleInfo(data: {
    title?: string;
    titleImage?: string;
    titleImageSize?: number;
    useTitleImage?: boolean;
    author?: string;
    playerCount?: string;
    secondPageTitleText?: string;
    secondPageTitleImage?: string;
    secondPageTitleFontSize?: number;
    secondPageTitleImageSize?: number;
    useSecondPageTitleImage?: boolean;
  }) {
    if (!this.script) return;

    const updatedScript = { ...this.script };
    
    if (data.title !== undefined) updatedScript.title = data.title;
    
    // 处理 titleImage：如果是 undefined 或空字符串，删除该字段
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
    
    if (data.author !== undefined) updatedScript.author = data.author;
    if (data.playerCount !== undefined) updatedScript.playerCount = data.playerCount;
    
    // 更新第二页标题配置
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

  // 添加第二页组件
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

  // 删除第二页组件
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

  // 更新特殊规则
  updateSpecialRule(rule: any) {
    if (!this.script) return;

    const updatedScript = { ...this.script };
    
    // 更新 specialRules 中的规则
    const firstPageIndex = updatedScript.specialRules.findIndex(r => r.id === rule.id);
    if (firstPageIndex !== -1) {
      updatedScript.specialRules[firstPageIndex] = rule;
    }
    
    // 更新 secondPageRules 中的规则（如果存在）
    if (updatedScript.secondPageRules) {
      const secondPageIndex = updatedScript.secondPageRules.findIndex(r => r.id === rule.id);
      if (secondPageIndex !== -1) {
        updatedScript.secondPageRules[secondPageIndex] = rule;
      }
    }

    this.setScript(updatedScript);
    this.syncSpecialRuleUpdateToJson(rule);
  }

  // 删除特殊规则
  removeSpecialRule(rule: any) {
    if (!this.script) return;

    const updatedScript = { ...this.script };
    
    // 从 specialRules 中删除
    updatedScript.specialRules = updatedScript.specialRules.filter(r => r.id !== rule.id);
    
    // 从 secondPageRules 中删除（如果存在）
    if (updatedScript.secondPageRules) {
      updatedScript.secondPageRules = updatedScript.secondPageRules.filter(r => r.id !== rule.id);
    }

    this.setScript(updatedScript);
    this.syncSpecialRuleToJson(rule);
  }

  // 添加自定义相克关系
  addCustomJinx(characterA: Character, characterB: Character, description: string) {
    if (!this.script) return;

    const updatedScript = { ...this.script };
    
    // 更新相克关系（使用角色名称作为主键）
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

    this.setScript(updatedScript);
    this.syncCustomJinxToJson(characterA, characterB, description, 'add', true);
  }

  // 更新官方相克规则（修改显示状态或自定义描述）
  updateOfficialJinx(
    characterA: Character,
    characterB: Character,
    updates: { display?: boolean; reason?: string }
  ) {
    if (!this.script) return;

    const updatedScript = { ...this.script };
    
    // 更新双向关系
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

    this.setScript(updatedScript);
    
    // 同步到JSON
    if (updates.reason !== undefined) {
      this.syncCustomJinxToJson(characterA, characterB, updates.reason, 'add', updates.display);
    } else if (updates.display !== undefined) {
      // 只更新display状态
      this.syncJinxDisplayToJson(characterA, characterB, updates.display);
    }
  }

  // 删除自定义相克关系
  removeCustomJinx(characterA: Character, characterB: Character) {
    if (!this.script) return;

    const updatedScript = { ...this.script };
    
    // 从中文相克关系中删除
    if (updatedScript.jinx[characterA.name]) {
      delete updatedScript.jinx[characterA.name][characterB.name];
      
      // 如果该角色没有其他相克关系，删除该键
      if (Object.keys(updatedScript.jinx[characterA.name]).length === 0) {
        delete updatedScript.jinx[characterA.name];
      }
    }

    // 同时检查反向关系
    if (updatedScript.jinx[characterB.name]) {
      delete updatedScript.jinx[characterB.name][characterA.name];
      
      if (Object.keys(updatedScript.jinx[characterB.name]).length === 0) {
        delete updatedScript.jinx[characterB.name];
      }
    }

    this.setScript(updatedScript);
    this.syncCustomJinxToJson(characterA, characterB, '', 'remove', undefined);
  }

  // 仅更新相克规则的display状态到JSON
  private syncJinxDisplayToJson(
    characterA: Character,
    characterB: Character,
    display: boolean
  ) {
    console.log('开始同步相克规则display状态到JSON', { characterA: characterA.name, characterB: characterB.name, display });
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];

      // 查找现有的相克关系
      const existingJinxIndex = jsonArray.findIndex((item: any) => {
        if (typeof item === 'string') return false;
        return item.team === 'a jinxed' && 
               item.id === characterA.id && 
               item.jinx && 
               item.jinx.some((j: any) => j.id === characterB.id);
      });

      if (existingJinxIndex >= 0) {
        // 找到了现有的相克关系条目
        const jinxItem = jsonArray[existingJinxIndex];
        const jinxEntry = jinxItem.jinx.find((j: any) => j.id === characterB.id);
        
        if (jinxEntry) {
          if (display === true && !jinxEntry.reason) {
            // 如果设置为显示，且没有自定义reason，说明是纯粹的官方相克
            // 应该删除这个条目，让它回归官方默认显示
            jinxItem.jinx = jinxItem.jinx.filter((j: any) => j.id !== characterB.id);
            
            // 如果该角色没有其他相克关系，删除整个对象
            if (jinxItem.jinx.length === 0) {
              jsonArray.splice(existingJinxIndex, 1);
            }
          } else {
            // 否则更新display状态
            jinxEntry.display = display;
          }
        }
      } else if (display === false) {
        // 如果不存在，且要设置为隐藏，才创建条目
        // 如果是设置为显示（true），则不需要创建条目，保持官方默认即可
        const characterJinxIndex = jsonArray.findIndex((item: any) => {
          if (typeof item === 'string') return false;
          return item.team === 'a jinxed' && item.id === characterA.id;
        });

        const newJinxEntry: any = {
          id: characterB.id,
          display: false,  // 只在隐藏时创建条目
        };

        if (characterJinxIndex >= 0) {
          // 该角色已有jinx对象，添加到jinx数组中
          jsonArray[characterJinxIndex].jinx.push(newJinxEntry);
        } else {
          // 创建新的jinx对象
          const newJinxObject: any = {
            id: characterA.id,
            team: 'a jinxed',
            jinx: [newJinxEntry],
          };
          jsonArray.push(newJinxObject);
        }
      }
      // 如果不存在且display为true，什么都不做，保持官方默认显示

      const jsonString = JSON.stringify(jsonArray, null, 2);
      console.log('相克规则display状态同步完成');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('同步相克规则display状态失败:', error);
    }
  }

  // 将自定义相克关系同步到JSON
  private syncCustomJinxToJson(
    characterA: Character,
    characterB: Character,
    description: string,
    action: 'add' | 'remove',
    display?: boolean
  ) {
    console.log('开始同步自定义相克关系到JSON', { characterA: characterA.name, characterB: characterB.name, action });
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];

      if (action === 'add') {
        // 添加相克关系
        // 检查是否已存在相克关系
        const existingJinxIndex = jsonArray.findIndex((item: any) => {
          if (typeof item === 'string') return false;
          return item.team === 'a jinxed' && 
                 item.id === characterA.id && 
                 item.jinx && 
                 item.jinx.some((j: any) => j.id === characterB.id);
        });

        if (existingJinxIndex >= 0) {
          // 更新现有的相克关系
          const jinxItem = jsonArray[existingJinxIndex];
          const jinxEntry = jinxItem.jinx.find((j: any) => j.id === characterB.id);
          if (jinxEntry && description) {
            // 更新描述
            jinxEntry.reason = description;
            if (display !== undefined) {
              jinxEntry.display = display;
            }
          }
        } else {
          // 添加新的相克关系
          // 查找是否已有该角色的jinx对象
          const characterJinxIndex = jsonArray.findIndex((item: any) => {
            if (typeof item === 'string') return false;
            return item.team === 'a jinxed' && item.id === characterA.id;
          });

          const newJinxEntry: any = {
            id: characterB.id,
          };
          if (description) newJinxEntry.reason = description;
          if (display !== undefined) {
            newJinxEntry.display = display;
          }

          if (characterJinxIndex >= 0) {
            // 该角色已有jinx对象，添加到jinx数组中
            jsonArray[characterJinxIndex].jinx.push(newJinxEntry);
          } else {
            // 创建新的jinx对象
            const newJinxObject: any = {
              id: characterA.id,
              team: 'a jinxed',
              jinx: [newJinxEntry],
            };
            jsonArray.push(newJinxObject);
          }
        }
      } else if (action === 'remove') {
        // 删除相克关系
        const characterJinxIndex = jsonArray.findIndex((item: any) => {
          if (typeof item === 'string') return false;
          return item.team === 'a jinxed' && item.id === characterA.id;
        });

        if (characterJinxIndex >= 0) {
          const jinxItem = jsonArray[characterJinxIndex];
          jinxItem.jinx = jinxItem.jinx.filter((j: any) => j.id !== characterB.id);
          
          // 如果该角色没有其他相克关系，删除整个对象
          if (jinxItem.jinx.length === 0) {
            jsonArray.splice(characterJinxIndex, 1);
          }
        }

        // 同时检查反向关系
        const reverseJinxIndex = jsonArray.findIndex((item: any) => {
          if (typeof item === 'string') return false;
          return item.team === 'a jinxed' && item.id === characterB.id;
        });

        if (reverseJinxIndex >= 0) {
          const jinxItem = jsonArray[reverseJinxIndex];
          jinxItem.jinx = jinxItem.jinx.filter((j: any) => j.id !== characterA.id);
          
          if (jinxItem.jinx.length === 0) {
            jsonArray.splice(reverseJinxIndex, 1);
          }
        }
      }

      const jsonString = JSON.stringify(jsonArray, null, 2);
      console.log('自定义相克关系同步完成');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('同步自定义相克关系失败:', error);
    }
  }

  // 将标题信息同步到JSON
  private syncTitleInfoToJson(data: {
    title?: string;
    titleImage?: string;
    titleImageSize?: number;
    useTitleImage?: boolean;
    author?: string;
    playerCount?: string;
    secondPageTitleText?: string;
    secondPageTitleImage?: string;
    secondPageTitleFontSize?: number;
    secondPageTitleImageSize?: number;
    useSecondPageTitleImage?: boolean;
  }) {
    console.log('开始同步标题信息到JSON', data);
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];

      // 检查是否存在 _meta 项
      let hasMetaItem = false;
      const newJsonArray = jsonArray.map((item: any) => {
        if (item.id === '_meta') {
          hasMetaItem = true;
          const updatedMeta = { ...item };
          
          if (data.title !== undefined) updatedMeta.name = data.title;
          
          // 处理图片标题：只要 titleImage 字段存在（即使是 undefined），就处理它
          if ('titleImage' in data) {
            console.log('处理 titleImage 字段:', data.titleImage);
            if (data.titleImage) {
              updatedMeta.titleImage = data.titleImage;
              console.log('✅ 设置 titleImage:', data.titleImage);
            } else {
              delete updatedMeta.titleImage;
              delete updatedMeta.logo;
              console.log('✅ 删除 titleImage 和 logo 字段');
            }
          }
          
          if (data.titleImageSize !== undefined) {
            updatedMeta.titleImageSize = data.titleImageSize;
          }
          if (data.useTitleImage !== undefined) {
            updatedMeta.use_title_image = data.useTitleImage;
          }
          if (data.author !== undefined) updatedMeta.author = data.author;
          if (data.playerCount !== undefined) {
            if (data.playerCount) {
              updatedMeta.playerCount = data.playerCount;
            } else {
              delete updatedMeta.playerCount;
            }
          }
          
          // 同步第二页标题配置
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
          
          console.log('更新后的 _meta:', updatedMeta);
          return updatedMeta;
        }
        return item;
      });

      // 如果没有 _meta 项，则创建一个新的并插入到数组开头
      if (!hasMetaItem) {
        console.log('未找到 _meta 项，创建新的 _meta');
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
        console.log('新创建的 _meta:', newMeta);
      }

      const jsonString = JSON.stringify(newJsonArray, null, 2);
      console.log('标题信息同步完成');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('同步标题信息失败:', error);
    }
  }

  // 更新第二页组件顺序
  updateSecondPageOrder(order: string[]) {
    if (!this.script) return;

    const updatedScript = { ...this.script };
    updatedScript.secondPageOrder = order;

    this.setScript(updatedScript);
    this.syncSecondPageOrderToJson(order);
  }

  // 同步第二页组件顺序到JSON
  private syncSecondPageOrderToJson(order: string[]) {
    console.log('开始同步第二页组件顺序到JSON', order);
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];

      // 检查是否存在 _meta 项
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

      // 如果没有 _meta 项，则创建一个新的并插入到数组开头
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
      console.log('第二页组件顺序同步完成');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('同步第二页组件顺序失败:', error);
    }
  }

  // 将第二页组件配置同步到JSON
  private syncSecondPageComponentToJson(
    componentType: 'title' | 'ppl_table1' | 'ppl_table2',
    enabled: boolean
  ) {
    console.log('开始同步第二页组件配置到JSON', { componentType, enabled });
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];

      // 检查是否存在 _meta 项
      let hasMetaItem = false;
      const newJsonArray = jsonArray.map((item: any) => {
        if (item.id === '_meta') {
          hasMetaItem = true;
          const updatedMeta = { ...item };
          
          // 更新对应的配置项
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

      // 如果没有 _meta 项，则创建一个新的并插入到数组开头
      if (!hasMetaItem) {
        const newMeta: any = {
          id: '_meta',
          name: 'Custom Your Script!',
          author: '',
        };
        
        // 设置对应的配置项
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
      console.log('第二页组件配置同步完成');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('同步第二页组件配置失败:', error);
    }
  }

  // 将特殊规则的更新同步到JSON
  private syncSpecialRuleUpdateToJson(updatedRule: any) {
    console.log('开始同步更新特殊规则到JSON', updatedRule);
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];

      let newJsonArray: any[] = [];

      if (updatedRule.sourceType === 'state' || updatedRule.sourceType === 'status') {
        // 处理 state/status 类型
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
        // 处理 special_rule 类型
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
        // 未知类型，保持原样
        newJsonArray = jsonArray;
      }

      const jsonString = JSON.stringify(newJsonArray, null, 2);
      console.log('特殊规则更新同步完成');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('同步特殊规则更新失败:', error);
    }
  }

  // 将特殊规则的删除同步到JSON
  private syncSpecialRuleToJson(deletedRule: any) {
    console.log('开始同步删除特殊规则到JSON', deletedRule);
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];

      let newJsonArray: any[] = [];

      if (deletedRule.sourceType === 'state' || deletedRule.sourceType === 'status') {
        // 处理 state/status 类型
        newJsonArray = jsonArray.map((item: any) => {
          if (item.id === '_meta') {
            const updatedMeta = { ...item };
            
            if (deletedRule.sourceType === 'state' && updatedMeta.state) {
              // 删除对应索引的 state
              updatedMeta.state = updatedMeta.state.filter(
                (_: any, index: number) => index !== deletedRule.sourceIndex
              );
              // 如果 state 数组为空，删除该字段
              if (updatedMeta.state.length === 0) {
                delete updatedMeta.state;
              }
            }
            
            if (deletedRule.sourceType === 'status' && updatedMeta.status) {
              // 删除对应索引的 status
              updatedMeta.status = updatedMeta.status.filter(
                (_: any, index: number) => index !== deletedRule.sourceIndex
              );
              // 如果 status 数组为空，删除该字段
              if (updatedMeta.status.length === 0) {
                delete updatedMeta.status;
              }
            }
            
            return updatedMeta;
          }
          return item;
        });
      } else if (deletedRule.sourceType === 'special_rule') {
        // 处理 special_rule 类型 - 删除整个对象
        newJsonArray = jsonArray.filter((item: any) => item.id !== deletedRule.id);
      } else {
        // 未知类型，保持原样
        newJsonArray = jsonArray;
      }

      const jsonString = JSON.stringify(newJsonArray, null, 2);
      console.log('特殊规则删除同步完成，更新originalJson');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('同步特殊规则删除失败:', error);
    }
  }

  // ===== 新的精准JSON更新方法 =====
  
  // 更新单个角色的JSON（只修改该角色，保留原格式）
  private updateCharacterInJson(characterId: string, updates: Partial<Character>) {
    console.log('updateCharacterInJson:', { characterId, updates });
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];
      
      let updated = false;
      const newJsonArray = jsonArray.map((item: any) => {
        const itemObj = typeof item === 'string' ? { id: item } : item;
        
        if (itemObj.id === characterId && itemObj.id !== '_meta' && itemObj.team !== 'a jinxed' && itemObj.team !== 'special_rule') {
          updated = true;
          
          // 如果是简化格式（只有ID字符串）
          if (typeof item === 'string') {
            // 在官方ID模式下，保持简化格式（不保存自定义信息到JSON）
            if (configStore.config.officialIdParseMode) {
              // 官方ID模式：保持简化格式，不修改JSON
              console.log('官方ID模式：保持简化格式，不保存自定义到JSON');
              return item;
            } else {
              // 普通模式：升级为完整格式，只添加被修改的字段
              console.log('普通模式：升级为完整格式，添加自定义字段');
              return {
                id: characterId,
                ...updates,
              };
            }
          } else {
            // 完整格式：只更新修改的字段
            // 在官方ID模式下，删除夜间顺序的自定义（使用官方数据）
            if (configStore.config.officialIdParseMode) {
              const updatedItem = { ...item };
              // 移除夜间顺序字段，让它们从官方库获取
              if ('firstNight' in updates || 'otherNight' in updates) {
                delete updatedItem.firstNight;
                delete updatedItem.otherNight;
                console.log('官方ID模式：移除夜间顺序自定义，使用官方数据');
              }
              // 应用其他非夜间顺序的更新
              const nonNightUpdates = Object.keys(updates)
                .filter(key => key !== 'firstNight' && key !== 'otherNight')
                .reduce((acc, key) => ({ ...acc, [key]: (updates as any)[key] }), {} as Partial<Character>);
              return {
                ...updatedItem,
                ...nonNightUpdates,
              };
            } else {
              // 普通模式：正常更新
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
        console.log('✅ 角色JSON已更新');
      } else {
        console.warn('⚠️ 未找到要更新的角色:', characterId);
      }
    } catch (error) {
      console.error('❌ 更新角色JSON失败:', error);
    }
  }
  
  // 添加角色到JSON
  private addCharacterToJson(character: Character) {
    console.log('addCharacterToJson:', character.id);
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];
      
      // 检查是否已存在
      const exists = jsonArray.some((item: any) => {
        const id = typeof item === 'string' ? item : item.id;
        return id === character.id;
      });
      
      if (exists) {
        console.warn('⚠️ 角色已存在，跳过添加:', character.id);
        return;
      }
      
      // 找到插入位置（在jinxed和special_rule之前）
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
      
      // 官方ID模式：只添加ID
      if (configStore.config.officialIdParseMode) {
        jsonArray.splice(insertIndex, 0, character.id);
      } else {
        // 普通模式：添加完整信息
        const newItem: any = {
          id: character.id,
          name: character.name,
          ability: character.ability,
          team: character.team,
          image: character.image,
        };
        
        // 可选字段
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
      console.log('✅ 角色已添加到JSON');
    } catch (error) {
      console.error('❌ 添加角色到JSON失败:', error);
    }
  }
  
  // 从JSON中删除角色
  private removeCharacterFromJson(characterId: string) {
    console.log('removeCharacterFromJson:', characterId);
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];
      
      const newJsonArray = jsonArray.filter((item: any) => {
        const id = typeof item === 'string' ? item : item.id;
        return id !== characterId;
      });
      
      this.setOriginalJson(JSON.stringify(newJsonArray, null, 2));
      console.log('✅ 角色已从JSON删除');
    } catch (error) {
      console.error('❌ 从JSON删除角色失败:', error);
    }
  }
  
  // 替换角色在JSON中的位置（保持格式和位置）
  private replaceCharacterInJson(oldId: string, newCharacter: Character) {
    console.log('replaceCharacterInJson:', { oldId, newId: newCharacter.id });
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];
      
      const index = jsonArray.findIndex((item: any) => {
        const id = typeof item === 'string' ? item : item.id;
        return id === oldId;
      });
      
      if (index === -1) {
        console.warn('⚠️ 未找到要替换的角色:', oldId);
        return;
      }
      
      const oldItem = jsonArray[index];
      const wasSimple = typeof oldItem === 'string';
      
      // 官方ID模式且原来是简化格式：保持简化格式
      if (wasSimple && configStore.config.officialIdParseMode) {
        jsonArray[index] = newCharacter.id;
      } else {
        // 否则使用完整格式
        const newItem: any = {
          id: newCharacter.id,
          name: newCharacter.name,
          ability: newCharacter.ability,
          team: newCharacter.team,
          image: newCharacter.image,
        };
        
        // 可选字段
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
      console.log('✅ 角色已替换');
    } catch (error) {
      console.error('❌ 替换角色失败:', error);
    }
  }
  
  // 重排序角色（保持原格式，只改变顺序）
  private reorderCharactersInJson(newOrder: string[]) {
    console.log('reorderCharactersInJson:', newOrder);
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];
      
      // 分类：meta、角色、jinxed、special_rule
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
          characterItems.set(itemObj.id, item); // 保留原格式
        }
      });
      
      // 重建数组：meta -> 角色（按新顺序） -> jinxed -> special_rule
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
      console.log('✅ 角色顺序已更新');
    } catch (error) {
      console.error('❌ 重排序失败:', error);
    }
  }
  
  // 旧的全局同步方法（保留作为备用，但不再主动使用）
  private syncScriptToJson_DEPRECATED(updatedScript: Script) {
    console.warn('⚠️ 使用了已废弃的 syncScriptToJson 方法');
    // 保留原代码作为备份...
  }

  // 清空所有数据
  clear() {
    this.script = null;
    this.originalJson = '';
    this.normalizedJson = '';
    this.customTitle = '';
    this.customAuthor = '';
    // 删除 localStorage 中的剧本数据
    try {
      localStorage.removeItem('botc-script-data');
      console.log('已删除 localStorage 键: botc-script-data');
    } catch (error) {
      console.warn('删除剧本数据失败:', error);
    }
  }

  // 保存到 localStorage
  private saveToStorage() {
    try {
      const data = {
        script: this.script,
        originalJson: this.originalJson,
        normalizedJson: this.normalizedJson,
        customTitle: this.customTitle,
        customAuthor: this.customAuthor,
        timestamp: Date.now(),
      };
      localStorage.setItem('botc-script-data', JSON.stringify(data));
    } catch (error) {
      console.warn('保存到 localStorage 失败:', error);
    }
  }

  // 从 localStorage 加载
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('botc-script-data');
      if (stored) {
        const data = JSON.parse(stored);
        this.script = data.script || null;
        this.originalJson = data.originalJson || '';
        this.normalizedJson = data.normalizedJson || '';
        this.customTitle = data.customTitle || '';
        this.customAuthor = data.customAuthor || '';
      }
    } catch (error) {
      console.warn('从 localStorage 加载失败:', error);
    }
  }

  // 检查是否有存储的数据
  get hasStoredData(): boolean {
    return !!this.originalJson;
  }

  // 获取默认 example.json 数据
  async loadDefaultExample(): Promise<string> {
    try {
      const response = await fetch('/scripts/自定义剧本/example.json');
      if (response.ok) {
        const data = await response.json();
        return JSON.stringify(data, null, 2);
      }
    } catch (error) {
      console.warn('加载默认示例失败:', error);
    }
    
    // 如果加载失败，返回一个基本的示例
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
