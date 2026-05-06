import { makeAutoObservable } from 'mobx';
import { DEFAULT_LANGUAGE, isSupportedLanguage, normalizeLanguage, SUPPORTED_LANGUAGES, type Language } from '../utils/languages';

export interface AppConfig {
  language: Language;
  officialIdParseMode: boolean; // Whether official ID parse mode is enabled
}

const DEFAULT_CONFIG: AppConfig = {
  language: DEFAULT_LANGUAGE,
  officialIdParseMode: false, // Official ID parse mode is disabled by default
};

const STORAGE_KEY = 'botc-app-config';

class ConfigStore {
  config: AppConfig = DEFAULT_CONFIG;

  constructor() {
    makeAutoObservable(this);
    this.loadConfig();
    this.detectLanguageFromUrl();
    this.setupUrlListener(); // Listen for URL changes
  }

  // Load config from localStorage
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

  // Save config to localStorage
  saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
    }
  }

  // Set up URL listener (listen for hash changes)
  setupUrlListener() {
    window.addEventListener('hashchange', () => {
      this.detectLanguageFromUrl();
    });
  }

  // Detect browser language and match to supported language
  detectBrowserLanguage(): Language {
    const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
    // Exact match (e.g. en-US → en, zh-CN → zh-CN)
    for (const lang of SUPPORTED_LANGUAGES) {
      if (browserLang === lang.toLowerCase()) return lang;
    }
    // Prefix match (e.g. fr → no match, zh → zh-CN)
    for (const lang of SUPPORTED_LANGUAGES) {
      if (browserLang.startsWith(lang.split('-')[0])) return lang;
    }
    return DEFAULT_LANGUAGE;
  }

  // Detect and set language from URL
  detectLanguageFromUrl() {
    // 1. Clean ?lang= param before hash (move inside hash)
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

    // 2. Check ?lang= param inside hash
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

    // 3. First visit (no localStorage, no ?lang=): detect browser language
    const browserLang = this.detectBrowserLanguage();
    if (this.config.language !== browserLang) {
      this.config.language = browserLang;
      this.saveConfig();
    }
    this.updateUrlLanguage(browserLang);
  }

  // Update language param in URL
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

  // Set language
  setLanguage(language: Language) {
    this.config.language = language;
    this.saveConfig();
    this.updateUrlLanguage(language);
  }

  // Set official ID parse mode
  setOfficialIdParseMode(enabled: boolean) {
    this.config.officialIdParseMode = enabled;
    this.saveConfig();
  }

  // Reset to default settings
  resetToDefault() {
    this.config = { ...DEFAULT_CONFIG };
    // Remove config from localStorage instead of saving defaults
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Deleted localStorage key:', STORAGE_KEY);
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
    this.updateUrlLanguage(DEFAULT_CONFIG.language);
  }

  // Get current language
  get language() {
    return this.config.language;
  }
}

// Create singleton
export const configStore = new ConfigStore();
