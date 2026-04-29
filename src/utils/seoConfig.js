/**
 * Single source of truth for SEO data.
 * - Used by build-time HTML generator (`scripts/generate-seo-html.mjs`)
 * - Used by runtime SPA SEO manager (`src/components/SEOManager.tsx`)
 */

export const SITE_URL = 'https://botc.letshare.fun';
export const DEFAULT_LANGUAGE = 'zh-CN';
export const LANGUAGES = ['zh-CN', 'en', 'es'];

export const OG_IMAGE = `${SITE_URL}/imgs/images/screenshots/promo-gpt.png`;
export const OG_IMAGE_WIDTH = 1731;
export const OG_IMAGE_HEIGHT = 909;

export const META = {
  'zh-CN': {
    title: 'Onion的钟楼工具 - 血染钟楼板子美化器与自定义剧本工具',
    description:
      '免费血染钟楼板子美化器和自定义剧本工具，支持导入官方 JSON、编辑角色与相克关系、特殊规则、双页排版，并导出 PDF、图片和多语言 JSON。',
    keywords:
      '血染钟楼板子美化器,血染钟楼自定义剧本工具,血染钟楼剧本生成器,BOTC剧本工具,BOTC板子美化器,相克关系怎么定制,自定义相克关系,血染钟楼JSON,Blood on the Clocktower',
    appTitle: 'Onion的钟楼工具',
    ogImageAlt: 'Onion的钟楼工具：血染钟楼板子美化器和自定义剧本工具',
    featureList: [
      '导入官方剧本制作器 JSON',
      '自定义角色、特殊规则和相克关系',
      '双页排版、背景图和字体美化',
      '导出 PDF、图片流程和多语言 JSON',
      '中文、英文、西班牙语界面',
    ],
    faq: [
      {
        question: 'BOTC 剧本工具相克关系怎么定制？',
        answer:
          '导入或生成剧本后，点击添加特殊规则，选择添加自定义相克，选择两个角色并填写规则描述，工具会把相克关系渲染到剧本板子中。',
      },
      {
        question: '血染钟楼板子美化器支持哪些导出？',
        answer:
          '支持 PDF、图片流程、原始 JSON、当前语言完整 JSON、仅官方 ID JSON，方便打印、分享和双语切换。',
      },
      {
        question: '血染钟楼自定义剧本工具能处理官方 JSON 吗？',
        answer:
          '可以导入官方剧本制作器 JSON，也可以保留自定义角色完整 JSON，并切换中文、英文、西班牙语界面和导出。',
      },
    ],
    ogLocale: 'zh_CN',
    ogAlternate: ['en_US', 'es_ES'],
  },
  en: {
    title: "Onion's Clocktower Tool - BOTC Script Generator and Layout Beautifier",
    description:
      'Free BOTC script generator and layout beautifier for Blood on the Clocktower. Import official JSON, edit characters, custom jinxes and special rules, then export PDF, image workflow and multilingual JSON.',
    keywords:
      'Blood on the Clocktower script generator,BOTC script tool,BOTC layout beautifier,Clocktower script maker,custom BOTC script,custom jinx relationships,how to customize BOTC jinx,script JSON,board game tool',
    appTitle: "Onion's Clocktower Tool",
    ogImageAlt: "Onion's Clocktower Tool: BOTC script generator and layout beautifier",
    featureList: [
      'Import official script maker JSON',
      'Customize characters, special rules and jinx relationships',
      'Beautify layouts with two-page mode, backgrounds and fonts',
      'Export PDF, image workflow and multilingual JSON',
      'Chinese, English and Spanish interface',
    ],
    faq: [
      {
        question: 'How do I customize jinx relationships in a BOTC script tool?',
        answer:
          'After importing or generating a script, open Add Special Rule, choose Add Custom Jinx, select two characters and write the rule description. The tool renders the jinx relationship on the script sheet.',
      },
      {
        question: 'What can this Blood on the Clocktower layout beautifier export?',
        answer:
          'It supports PDF, image workflow, original JSON, full JSON in the current language and official-ID-only JSON for printing, sharing and multilingual switching.',
      },
      {
        question: 'Can this custom BOTC script maker use official JSON?',
        answer:
          'Yes. It imports JSON from the official script maker, keeps full JSON for custom characters, and supports Chinese, English and Spanish UI and exports.',
      },
    ],
    ogLocale: 'en_US',
    ogAlternate: ['zh_CN', 'es_ES'],
  },
  es: {
    title: 'Herramienta Clocktower de Onion - Generador y maquetador BOTC',
    description:
      'Generador de guiones y maquetador gratuito para Blood on the Clocktower. Importa JSON oficial, edita personajes, interacciones jinx y reglas especiales, y exporta PDF, flujo de imagen y JSON multilingue.',
    keywords:
      'generador de guiones Blood on the Clocktower,herramienta BOTC,maquetador BOTC,crear guion BOTC,guion personalizado BOTC,interacciones jinx personalizadas,cómo personalizar interacciones BOTC,JSON de guion,juego de mesa',
    appTitle: 'Herramienta para Clocktower de Onion',
    ogImageAlt: 'Herramienta Clocktower de Onion: generador y maquetador de guiones BOTC',
    featureList: [
      'Importar JSON del creador oficial de guiones',
      'Personalizar personajes, reglas especiales e interacciones jinx',
      'Mejorar la maquetación con dos páginas, fondos y fuentes',
      'Exportar PDF, flujo de imagen y JSON multilingue',
      'Interfaz en chino, inglés y español',
    ],
    faq: [
      {
        question: 'Cómo personalizar interacciones jinx en una herramienta BOTC?',
        answer:
          'Después de importar o generar un guion, abre Añadir regla especial, elige Añadir interacción personalizada, selecciona dos personajes y escribe la descripción. La herramienta renderiza la interacción en la hoja del guion.',
      },
      {
        question: 'Qué exporta este maquetador de Blood on the Clocktower?',
        answer:
          'Admite PDF, flujo de imagen, JSON original, JSON completo en el idioma actual y JSON solo con ID oficiales para imprimir, compartir y cambiar de idioma.',
      },
      {
        question: 'Este creador de guiones BOTC acepta JSON oficial?',
        answer:
          'Sí. Importa JSON del creador oficial, conserva JSON completo para personajes personalizados y admite interfaz y exportación en chino, inglés y español.',
      },
    ],
    ogLocale: 'es_ES',
    ogAlternate: ['zh_CN', 'en_US'],
  },
};

function buildStructuredData(lang) {
  const m = META[lang];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: m.appTitle,
        alternateName: m.title,
        description: m.description,
        url: `${SITE_URL}/${lang}/`,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Web',
        author: { '@type': 'Person', name: 'Onion' },
        inLanguage: lang,
        availableLanguage: LANGUAGES,
        image: OG_IMAGE,
        screenshot: OG_IMAGE,
        keywords: m.keywords,
        featureList: m.featureList,
        dateModified: new Date().toISOString().split('T')[0],
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        areaServed: {
          '@type': 'GeoShape',
          name: 'Worldwide',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: m.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
      {
        '@type': 'WebSite',
        name: m.appTitle,
        url: SITE_URL,
        inLanguage: lang,
      },
    ],
  };
}

export const STRUCTURED_DATA = Object.fromEntries(LANGUAGES.map((lang) => [lang, buildStructuredData(lang)]));

export const PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/repo', priority: '0.8', changefreq: 'weekly' },
];
