export const SUPPORTED_LANGUAGES = ['zh-CN', 'en', 'es'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'zh-CN';

export const LANGUAGE_LABELS: Record<Language, string> = {
  'zh-CN': '简体中文',
  en: 'English',
  es: 'Español',
};

export const LANGUAGE_SHORT_LABELS: Record<Language, string> = {
  'zh-CN': '中文',
  en: 'English',
  es: 'Español',
};

export function isSupportedLanguage(value: string | null | undefined): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

export function normalizeLanguage(value: unknown): Language {
  return typeof value === 'string' && isSupportedLanguage(value) ? value : DEFAULT_LANGUAGE;
}
