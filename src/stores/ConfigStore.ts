import { makeAutoObservable } from 'mobx';
import { DEFAULT_LANGUAGE, isSupportedLanguage, normalizeLanguage, SUPPORTED_LANGUAGES, type Language } from '../utils/languages';

export interface AppConfig {
  language: Language;
  officialIdParseMode: boolean; // 是否开启官方ID解析模式
}

const DEFAULT_CONFIG: AppConfig = {
  language: DEFAULT_LANGUAGE,
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
        this.config = {
          ...DEFAULT_CONFIG,
          ...parsed,
          language: normalizeLanguage(parsed.language),
        };
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

  // 检测浏览器语言，匹配支持的语言
  detectBrowserLanguage(): Language {
    const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
    // 精确匹配（如 en-US → en，zh-CN → zh-CN）
    for (const lang of SUPPORTED_LANGUAGES) {
      if (browserLang === lang.toLowerCase()) return lang;
    }
    // 前缀匹配（如 fr → 无匹配，zh → zh-CN）
    for (const lang of SUPPORTED_LANGUAGES) {
      if (browserLang.startsWith(lang.split('-')[0])) return lang;
    }
    return DEFAULT_LANGUAGE;
  }

  // 从 URL 检测并设置语言
  detectLanguageFromUrl() {
    // 1. 清理 hash 前的 ?lang= 参数（移到 hash 内）
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      const searchLang = searchParams.get('lang');
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);

      if (isSupportedLanguage(searchLang)) {
        this.config.language = searchLang;
        this.saveConfig();
        this.updateUrlLanguage(searchLang);
        return;
      }
    }

    // 2. 检查 hash 内的 ?lang= 参数
    const hash = window.location.hash;
    const questionMarkIndex = hash.indexOf('?');

    if (questionMarkIndex !== -1) {
      const params = new URLSearchParams(hash.substring(questionMarkIndex + 1));
      const hashLang = params.get('lang');

      if (isSupportedLanguage(hashLang)) {
        if (this.config.language !== hashLang) {
          this.config.language = hashLang;
          this.saveConfig();
        }
        return;
      }
    }

    // 3. 首次访问（无 localStorage、无 ?lang=）：检测浏览器语言
    const browserLang = this.detectBrowserLanguage();
    if (this.config.language !== browserLang) {
      this.config.language = browserLang;
      this.saveConfig();
    }
    this.updateUrlLanguage(browserLang);
  }

  // 更新 URL 中的语言参数
  updateUrlLanguage(lang: Language) {
    const hash = window.location.hash;
    const questionMarkIndex = hash.indexOf('?');
    let hashPath = hash;
    let params = new URLSearchParams();

    if (questionMarkIndex !== -1) {
      hashPath = hash.substring(0, questionMarkIndex);
      params = new URLSearchParams(hash.substring(questionMarkIndex + 1));
    }

    params.set('lang', lang);
    const newHash = `${hashPath}?${params.toString()}`;
    window.history.replaceState({}, '', newHash);
  }

  // 设置语言
  setLanguage(language: Language) {
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
