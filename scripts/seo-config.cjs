/**
 * Central SEO configuration for botc.letshare.fun
 * Single source of truth for all SEO data per language.
 * Used by both the build-time HTML generator and the runtime SEOManager.
 */

const SITE_URL = 'https://botc.letshare.fun';
const DEFAULT_LANGUAGE = 'zh-CN';
const LANGUAGES = ['zh-CN', 'en', 'es'];

const META = {
  'zh-CN': {
    title: 'Onion的钟楼工具 - 血染钟楼剧本生成器',
    description: '专业的血染钟楼剧本生成工具，支持自定义角色配置、剧本导出、多种游戏模式。为血染钟楼爱好者提供便捷的剧本制作体验。',
    keywords: '血染钟楼,剧本生成器,BOTC,Blood on the Clocktower,桌游工具',
    appTitle: 'Onion的钟楼工具',
  },
  en: {
    title: "Onion's Clocktower Tool - Blood on the Clocktower Script Generator",
    description: 'Professional Blood on the Clocktower script generation tool with custom character configuration, script export, and multiple game modes. Providing convenient script creation experience for BOTC enthusiasts.',
    keywords: 'Blood on the Clocktower,BOTC,Script Generator,Board Game Tool,Clocktower',
    appTitle: "Onion's Clocktower Tool",
  },
  es: {
    title: 'Herramienta para Clocktower de Onion - Generador de guiones de Blood on the Clocktower',
    description: 'Herramienta profesional para generar guiones de Blood on the Clocktower: configuración personalizada de personajes, exportación de guiones y varios modos de juego. Una experiencia cómoda para los aficionados a BOTC.',
    keywords: 'Blood on the Clocktower,BOTC,Generador de guiones,Juego de mesa,Clocktower',
    appTitle: 'Herramienta para Clocktower de Onion',
  },
};

function buildStructuredData(lang) {
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
  };
}

const STRUCTURED_DATA = {};
for (const lang of LANGUAGES) {
  STRUCTURED_DATA[lang] = buildStructuredData(lang);
}

const PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/repo', priority: '0.8', changefreq: 'weekly' },
];

module.exports = {
  SITE_URL,
  DEFAULT_LANGUAGE,
  LANGUAGES,
  META,
  STRUCTURED_DATA,
  PAGES,
};
