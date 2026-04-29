/**
 * Runtime SEO data for the SEOManager component.
 * Mirrors scripts/seo-config.cjs but as an ES module for TypeScript import.
 */

export const SITE_URL = 'https://botc.letshare.fun';
export const OG_IMAGE = `${SITE_URL}/imgs/screenshots/promo.png`;
export const DEFAULT_LANGUAGE = 'zh-CN';
export const LANGUAGES = ['zh-CN', 'en', 'es'] as const;

const META: Record<string, { appTitle: string; description: string; ogLocale: string; ogAlternate: string[] }> = {
  'zh-CN': {
    appTitle: 'Onion的钟楼工具',
    description: '专业的血染钟楼剧本生成工具，支持自定义角色配置、剧本导出、多种游戏模式。为血染钟楼爱好者提供便捷的剧本制作体验。',
    ogLocale: 'zh_CN',
    ogAlternate: ['en_US', 'es_ES'],
  },
  en: {
    appTitle: "Onion's Clocktower Tool",
    description: 'Professional Blood on the Clocktower script generation tool with custom character configuration, script export, and multiple game modes. Providing convenient script creation experience for BOTC enthusiasts.',
    ogLocale: 'en_US',
    ogAlternate: ['zh_CN', 'es_ES'],
  },
  es: {
    appTitle: 'Herramienta para Clocktower de Onion',
    description: 'Herramienta profesional para generar guiones de Blood on the Clocktower: configuración personalizada de personajes, exportación de guiones y varios modos de juego. Una experiencia cómoda para los aficionados a BOTC.',
    ogLocale: 'es_ES',
    ogAlternate: ['zh_CN', 'en_US'],
  },
};

function buildStructuredData(lang: string) {
  const m = META[lang];
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: m.appTitle,
    description: m.description,
    url: `${SITE_URL}/${lang}/`,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    author: { '@type': 'Person', name: 'Onion' },
    inLanguage: LANGUAGES,
    image: OG_IMAGE,
    dateModified: new Date().toISOString().split('T')[0],
    areaServed: {
      '@type': 'GeoShape',
      name: 'Worldwide',
    },
  };
}

export const STRUCTURED_DATA: Record<string, Record<string, unknown>> = {};
for (const lang of LANGUAGES) {
  STRUCTURED_DATA[lang] = buildStructuredData(lang);
}
