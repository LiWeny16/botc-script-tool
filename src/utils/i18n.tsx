import React, { createContext, useContext, type ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { configStore } from '../stores/ConfigStore';
import { translations, type TranslationKey } from './map';
import type { Language } from './languages';

// Create i18n context
interface I18nContextType {
  t: (key: TranslationKey) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

// i18n Provider component
export const I18nProvider: React.FC<{ children: ReactNode }> = observer(({ children }) => {
  const t = (key: TranslationKey): string => {
    const lang = configStore.language;
    return translations[lang]?.[key] || translations.en[key] || translations.cn[key] || key;
  };

  const setLanguage = (lang: Language) => {
    configStore.setLanguage(lang);
  };

  const value: I18nContextType = {
    t,
    language: configStore.language,
    setLanguage,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
});

// Custom hook for accessing i18n
export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
};

