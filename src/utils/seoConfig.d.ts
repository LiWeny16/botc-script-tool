export const SITE_URL: string;
export const DEFAULT_LANGUAGE: string;
export const LANGUAGES: readonly string[];
export const LANG_TO_BCP47: Record<string, string>;
export const LANGUAGE_URLS: Record<string, string>;
export const OG_IMAGE: string;
export const OG_IMAGE_WIDTH: number;
export const OG_IMAGE_HEIGHT: number;

export const META: Record<
  string,
  {
    title: string;
    description: string;
    keywords: string;
    appTitle: string;
    ogImageAlt: string;
    featureList: string[];
    faq: Array<{
      question: string;
      answer: string;
    }>;
    howToSteps: Array<{ name: string; text: string }>;
    ogLocale: string;
    ogAlternate: string[];
  }
>;

export const STRUCTURED_DATA: Record<string, Record<string, unknown>>;

export const PAGES: Array<{
  path: string;
  priority: string;
  changefreq: string;
}>;
