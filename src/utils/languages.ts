export const SUPPORTED_LANGUAGES = ['cn', 'en', 'es'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

export const LANGUAGE_LABELS: Record<Language, string> = {
  cn: 'Simplified Chinese',
  en: 'English',
  es: 'Español',
};

export const LANGUAGE_SHORT_LABELS: Record<Language, string> = {
  cn: 'Chinese',
  en: 'English',
  es: 'Español',
};

// Internal language code → BCP 47 standard code (for HTML lang attribute)
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
