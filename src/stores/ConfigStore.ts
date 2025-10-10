import { makeAutoObservable } from 'mobx';

export interface AppConfig {
  language: 'zh-CN' | 'en';
  // 可以在此添加更多配置项
}

const DEFAULT_CONFIG: AppConfig = {
  language: 'zh-CN',
};

const STORAGE_KEY = 'botc-app-config';

class ConfigStore {
  config: AppConfig = DEFAULT_CONFIG;

  constructor() {
    makeAutoObservable(this);
    this.loadConfig();
    this.detectLanguageFromUrl();
  }

  // 从 localStorage 加载配置
  loadConfig() {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        this.config = { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load config from localStorage:', error);
    }
  }

  // 保存配置到 localStorage
  saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
    }
  }

  // 从 URL 检测并设置语言（支持 hash 路由）
  detectLanguageFromUrl() {
    // 从 hash 中提取查询参数
    const hash = window.location.hash;
    const questionMarkIndex = hash.indexOf('?');
    
    if (questionMarkIndex !== -1) {
      const queryString = hash.substring(questionMarkIndex + 1);
      const params = new URLSearchParams(queryString);
      const langParam = params.get('lang');
      
      if (langParam === 'en' || langParam === 'zh-CN') {
        this.setLanguage(langParam);
        return;
      }
    }
    
    // 如果没有 lang 参数，添加当前语言到 URL
    this.updateUrlLanguage(this.config.language);
  }

  // 更新 URL 中的语言参数（支持 hash 路由）
  updateUrlLanguage(lang: 'zh-CN' | 'en') {
    const hash = window.location.hash;
    const questionMarkIndex = hash.indexOf('?');
    
    let path = hash;
    let params = new URLSearchParams();
    
    if (questionMarkIndex !== -1) {
      path = hash.substring(0, questionMarkIndex);
      params = new URLSearchParams(hash.substring(questionMarkIndex + 1));
    }
    
    params.set('lang', lang);
    const newHash = `${path}?${params.toString()}`;
    window.history.replaceState({}, '', newHash);
  }

  // 设置语言
  setLanguage(language: 'zh-CN' | 'en') {
    this.config.language = language;
    this.saveConfig();
    this.updateUrlLanguage(language);
  }

  // 恢复默认设置
  resetToDefault() {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
    this.updateUrlLanguage(DEFAULT_CONFIG.language);
  }

  // 获取当前语言
  get language() {
    return this.config.language;
  }
}

// 创建单例
export const configStore = new ConfigStore();

