import { makeAutoObservable } from 'mobx';

export interface AppConfig {
  language: 'zh-CN' | 'en';
  officialIdParseMode: boolean; // 是否开启官方ID解析模式
  // 可以在此添加更多配置项
}

const DEFAULT_CONFIG: AppConfig = {
  language: 'zh-CN',
  officialIdParseMode: false, // 默认关闭官方ID解析模式
};

const STORAGE_KEY = 'botc-app-config';

class ConfigStore {
  config: AppConfig = DEFAULT_CONFIG;

  constructor() {
    makeAutoObservable(this);
    this.loadConfig();
    this.detectLanguageFromUrl();
    this.setupUrlListener(); // 监听 URL 变化
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

  // 设置 URL 监听器（监听 hash 变化）
  setupUrlListener() {
    window.addEventListener('hashchange', () => {
      this.detectLanguageFromUrl();
    });
  }

  // 从 URL 检测并设置语言（支持 hash 路由）
  detectLanguageFromUrl() {
    let langParam: string | null = null;

    // 1. 先检查 hash 前面的查询参数（如 ?lang=en#/）
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      langParam = searchParams.get('lang');
      
      if (langParam === 'en' || langParam === 'zh-CN') {
        // 找到语言参数，更新配置并清理 hash 前的参数，移到 hash 后面
        this.config.language = langParam;
        this.saveConfig();
        
        // 清理 hash 前的参数，移到 hash 后面
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', newUrl);
        this.updateUrlLanguage(langParam);
        return;
      }
    }

    // 2. 再检查 hash 后面的查询参数（如 #/?lang=en）
    const hash = window.location.hash;
    const questionMarkIndex = hash.indexOf('?');
    
    if (questionMarkIndex !== -1) {
      const queryString = hash.substring(questionMarkIndex + 1);
      const params = new URLSearchParams(queryString);
      langParam = params.get('lang');
      
      if (langParam === 'en' || langParam === 'zh-CN') {
        // 从 URL 读取语言，直接更新配置，不再更新 URL（避免循环）
        if (this.config.language !== langParam) {
          this.config.language = langParam;
          this.saveConfig();
        }
        return;
      }
    }
    
    // 3. 如果没有 lang 参数，添加当前语言到 URL
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

  // 设置官方ID解析模式
  setOfficialIdParseMode(enabled: boolean) {
    this.config.officialIdParseMode = enabled;
    this.saveConfig();
  }

  // 恢复默认设置
  resetToDefault() {
    this.config = { ...DEFAULT_CONFIG };
    // 删除 localStorage 中的配置，而不是保存默认值
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('已删除 localStorage 键:', STORAGE_KEY);
    } catch (error) {
      console.error('删除配置失败:', error);
    }
    this.updateUrlLanguage(DEFAULT_CONFIG.language);
  }

  // 获取当前语言
  get language() {
    return this.config.language;
  }
}

// 创建单例
export const configStore = new ConfigStore();

