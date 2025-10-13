import { makeAutoObservable } from 'mobx';
import type { Script } from '../types';

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
