import React, { createContext, useContext, type ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { configStore } from '../stores/ConfigStore';
import { translations, type TranslationKey } from './map';

// 创建 i18n 上下文
interface I18nContextType {
  t: (key: TranslationKey) => string;
  language: 'zh-CN' | 'en';
  setLanguage: (lang: 'zh-CN' | 'en') => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

// i18n Provider 组件
export const I18nProvider: React.FC<{ children: ReactNode }> = observer(({ children }) => {
  const t = (key: TranslationKey): string => {
    const lang = configStore.language;
    return translations[lang][key] || key;
  };

  const setLanguage = (lang: 'zh-CN' | 'en') => {
    configStore.setLanguage(lang);
  };

  const value: I18nContextType = {
    t,
    language: configStore.language,
    setLanguage,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
});

// 自定义 hook 用于访问 i18n
export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
};

