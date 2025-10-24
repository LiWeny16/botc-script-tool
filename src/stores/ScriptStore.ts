import { makeAutoObservable } from 'mobx';
import type { Script, Character } from '../types';

class ScriptStore {
  script: Script | null = null;
  originalJson: string = '';
  customTitle: string = '';
  customAuthor: string = '';
  
  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  // 设置剧本数据
  setScript(script: Script | null) {
    this.script = script;
    this.saveToStorage();
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
    
    console.log('ScriptStore.updateCharacter 被调用:', { characterId, updates });

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
      console.log('角色更新成功，开始同步JSON');
      this.syncScriptToJson(updatedScript);
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
    this.syncScriptToJson(updatedScript);
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
    this.syncScriptToJson(updatedScript);
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
    this.syncScriptToJson(updatedScript);
  }

  // 更新标题信息
  updateTitleInfo(data: {
    title?: string;
    titleImage?: string;
    subtitle?: string;
    author?: string;
    playerCount?: string;
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
    
    if (data.subtitle !== undefined) updatedScript.subtitle = data.subtitle;
    if (data.author !== undefined) updatedScript.author = data.author;
    if (data.playerCount !== undefined) updatedScript.playerCount = data.playerCount;

    this.setScript(updatedScript);
    this.syncTitleInfoToJson(data);
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

  // 将标题信息同步到JSON
  private syncTitleInfoToJson(data: {
    title?: string;
    titleImage?: string;
    subtitle?: string;
    author?: string;
    playerCount?: string;
  }) {
    console.log('开始同步标题信息到JSON', data);
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];

      const newJsonArray = jsonArray.map((item: any) => {
        if (item.id === '_meta') {
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
          
          if (data.subtitle !== undefined) {
            if (data.subtitle) {
              updatedMeta.subtitle = data.subtitle;
            } else {
              delete updatedMeta.subtitle;
            }
          }
          if (data.author !== undefined) updatedMeta.author = data.author;
          if (data.playerCount !== undefined) {
            if (data.playerCount) {
              updatedMeta.playerCount = data.playerCount;
            } else {
              delete updatedMeta.playerCount;
            }
          }
          
          console.log('更新后的 _meta:', updatedMeta);
          return updatedMeta;
        }
        return item;
      });

      const jsonString = JSON.stringify(newJsonArray, null, 2);
      console.log('标题信息同步完成');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('同步标题信息失败:', error);
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

  // 将Script同步回JSON
  private syncScriptToJson(updatedScript: Script) {
    console.log('开始同步Script到JSON');
    try {
      const parsedJson = JSON.parse(this.originalJson);
      const jsonArray = Array.isArray(parsedJson) ? parsedJson : [];

      // 创建新的JSON数组
      const newJsonArray: any[] = [];

      // 添加元数据
      const metaItem = jsonArray.find((item: any) => item.id === '_meta');
      if (metaItem) {
        newJsonArray.push(metaItem);
      }

      // 按照script中的顺序添加角色，并更新角色信息
      Object.keys(updatedScript.characters).forEach(team => {
        updatedScript.characters[team].forEach(character => {
          const originalItem = jsonArray.find((item: any) => item.id === character.id);
          if (originalItem) {
            // 合并原始数据和更新后的数据
            const updatedItem = {
              ...originalItem,
              name: character.name,
              ability: character.ability,
              team: character.team,
              image: character.image,
              firstNight: character.firstNight !== undefined ? character.firstNight : (originalItem.firstNight || 0),
              otherNight: character.otherNight !== undefined ? character.otherNight : (originalItem.otherNight || 0),
              firstNightReminder: character.firstNightReminder !== undefined ? character.firstNightReminder : (originalItem.firstNightReminder || ''),
              otherNightReminder: character.otherNightReminder !== undefined ? character.otherNightReminder : (originalItem.otherNightReminder || ''),
              reminders: character.reminders !== undefined ? character.reminders : (originalItem.reminders || []),
              setup: character.setup !== undefined ? character.setup : (originalItem.setup || false),
            };
            newJsonArray.push(updatedItem);
          } else {
            // 如果是新添加的角色，创建新的JSON项
            const newItem = {
              id: character.id,
              name: character.name,
              ability: character.ability,
              team: character.team,
              image: character.image,
              firstNight: character.firstNight || 0,
              otherNight: character.otherNight || 0,
              firstNightReminder: character.firstNightReminder || '',
              otherNightReminder: character.otherNightReminder || '',
              reminders: character.reminders || [],
              setup: character.setup || false,
            };
            newJsonArray.push(newItem);
          }
        });
      });

      // 添加相克规则和特殊规则
      jsonArray.forEach((item: any) => {
        if (item.team === 'a jinxed' || item.team === 'special_rule') {
          newJsonArray.push(item);
        }
      });

      const jsonString = JSON.stringify(newJsonArray, null, 2);
      console.log('JSON同步完成，更新originalJson');
      this.setOriginalJson(jsonString);
    } catch (error) {
      console.error('同步JSON失败:', error);
    }
  }

  // 清空所有数据
  clear() {
    this.script = null;
    this.originalJson = '';
    this.customTitle = '';
    this.customAuthor = '';
    this.saveToStorage();
  }

  // 保存到 localStorage
  private saveToStorage() {
    try {
      const data = {
        script: this.script,
        originalJson: this.originalJson,
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
