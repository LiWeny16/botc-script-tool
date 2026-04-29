export const SUPPORTED_LANGUAGES = ['cn', 'en', 'es'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

export const LANGUAGE_LABELS: Record<Language, string> = {
  cn: '简体中文',
  en: 'English',
  es: 'Español',
};

export const LANGUAGE_SHORT_LABELS: Record<Language, string> = {
  cn: '中文',
  en: 'English',
  es: 'Español',
};

// 内部语言码 → BCP 47 标准码（用于 HTML lang 属性）
export const LANG_TO_BCP47: Record<Language, string> = {
  cn: 'zh-CN',
  en: 'en',
  es: 'es',
};

export function isSupportedLanguage(value: string | null | undefined): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

export function normalizeLanguage(value: unknown): Language {
  return typeof value === 'string' && isSupportedLanguage(value) ? value : DEFAULT_LANGUAGE;
}
