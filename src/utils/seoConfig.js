/** Shared, factual metadata for the application and its static landing pages. */
export const SITE_URL = 'https://botc.letshare.fun';
export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGES = ['cn', 'en', 'es'];
export const LANG_TO_BCP47 = { cn: 'zh-CN', en: 'en', es: 'es' };
export const LANGUAGE_URLS = {
  cn: `${SITE_URL}/zh-cn/`,
  en: `${SITE_URL}/`,
  es: `${SITE_URL}/es/`,
};

export const OG_IMAGE = `${SITE_URL}/imgs/images/screenshots/promo-gpt.png`;
export const OG_IMAGE_WIDTH = 1731;
export const OG_IMAGE_HEIGHT = 909;

export const META = {
  cn: {
    title: '血染钟楼剧本工具 — 板子生成、美化与打印',
    description: '免费制作和美化血染钟楼剧本：导入 JSON、编辑角色与相克、调整夜间顺序，并导出图片或打印为 PDF。',
    keywords: '血染钟楼,剧本工具,板子生成器,剧本美化,自定义相克',
    appTitle: '血染钟楼剧本工具',
    ogImageAlt: '血染钟楼剧本工具的剧本编辑与预览界面',
    featureList: [
      '导入兼容的剧本 JSON，或从剧本目录中选择剧本',
      '编辑角色、特殊规则、相克关系和夜间顺序',
      '调整单页或双页排版、背景、字体和图片',
      '导出图片与 JSON，或通过浏览器打印和保存 PDF',
    ],
    faq: [
      { question: '这个剧本工具免费吗？', answer: '核心剧本编辑、预览和导出功能免费，使用时无需注册；部分云端功能需要登录。' },
      { question: '如何导入血染钟楼剧本？', answer: '可以粘贴或上传兼容的剧本 JSON，也可以从剧本目录选择剧本进行预览。' },
      { question: '如何保存或打印剧本？', answer: '可以导出剧本图片或 JSON；选择打印后，可在浏览器的打印对话框中选择打印机或另存为 PDF。' },
      { question: '能自定义角色和相克关系吗？', answer: '可以编辑角色和相克关系，也可以调整夜间行动顺序与页面布局。' },
    ],
    howToSteps: [
      { name: '导入剧本', text: '粘贴或上传剧本 JSON，或从剧本目录选择。' },
      { name: '编辑内容', text: '调整角色、特殊规则、相克关系和夜间顺序。' },
      { name: '调整排版', text: '选择页面布局、背景和字体，并预览效果。' },
      { name: '导出或打印', text: '导出图片或 JSON，或使用浏览器打印并保存为 PDF。' },
    ],
    ogLocale: 'zh_CN',
    ogAlternate: ['en_US', 'es_ES'],
  },
  en: {
    title: 'Blood on the Clocktower Script Tool — Create, Edit & Print',
    description: 'Create and format Blood on the Clocktower scripts. Import JSON, edit characters and jinxes, arrange night order, and export images or print to PDF.',
    keywords: 'Blood on the Clocktower, BOTC script tool, script generator, jinx editor',
    appTitle: 'Blood on the Clocktower Script Tool',
    ogImageAlt: 'Blood on the Clocktower script editing and preview interface',
    featureList: [
      'Import compatible script JSON or choose a script from the directory',
      'Edit characters, special rules, jinxes and night order',
      'Adjust one- or two-page layouts, backgrounds, fonts and images',
      'Export images and JSON, or use the browser to print and save a PDF',
    ],
    faq: [
      { question: 'Is the script tool free?', answer: 'The core editor, preview and export features are free and do not require an account. Some optional cloud features require sign-in.' },
      { question: 'How do I import a Blood on the Clocktower script?', answer: 'Paste or upload compatible script JSON, or choose a script from the directory to preview it.' },
      { question: 'How do I save or print a script?', answer: 'Export an image or JSON, or use the browser print dialog to select a printer or save as PDF.' },
      { question: 'Can I customize characters and jinxes?', answer: 'Yes. You can edit characters and jinxes, reorder night actions, and adjust the page layout.' },
    ],
    howToSteps: [
      { name: 'Import a script', text: 'Paste or upload script JSON, or choose a script from the directory.' },
      { name: 'Edit the content', text: 'Adjust characters, special rules, jinxes and night order.' },
      { name: 'Arrange the layout', text: 'Choose a page layout, background and fonts, then preview the result.' },
      { name: 'Export or print', text: 'Export an image or JSON, or use the browser print dialog to save a PDF.' },
    ],
    ogLocale: 'en_US',
    ogAlternate: ['zh_CN', 'es_ES'],
  },
  es: {
    title: 'Herramienta de guiones Blood on the Clocktower — Crear y editar',
    description: 'Crea y maqueta guiones de Blood on the Clocktower. Importa JSON, edita personajes y jinxes, ordena las noches y exporta imágenes o imprime en PDF.',
    keywords: 'Blood on the Clocktower, herramienta BOTC, guiones, generador de guiones',
    appTitle: 'Herramienta de guiones Blood on the Clocktower',
    ogImageAlt: 'Interfaz de edición y vista previa de guiones Blood on the Clocktower',
    featureList: [
      'Importa JSON compatible o elige un guion del directorio',
      'Edita personajes, reglas especiales, jinxes y orden nocturno',
      'Ajusta el diseño de una o dos páginas, fondos, fuentes e imágenes',
      'Exporta imágenes y JSON, o imprime y guarda un PDF desde el navegador',
    ],
    faq: [
      { question: '¿La herramienta es gratuita?', answer: 'La edición, vista previa y exportación básicas son gratuitas y no requieren cuenta. Algunas funciones opcionales en la nube requieren iniciar sesión.' },
      { question: '¿Cómo importo un guion de Blood on the Clocktower?', answer: 'Pega o sube un JSON compatible, o elige un guion del directorio para verlo.' },
      { question: '¿Cómo guardo o imprimo un guion?', answer: 'Exporta una imagen o un JSON, o usa el diálogo de impresión del navegador para imprimir o guardar como PDF.' },
      { question: '¿Puedo personalizar personajes y jinxes?', answer: 'Sí. Puedes editar personajes y jinxes, ordenar las acciones nocturnas y ajustar el diseño.' },
    ],
    howToSteps: [
      { name: 'Importa un guion', text: 'Pega o sube un JSON, o elige un guion del directorio.' },
      { name: 'Edita el contenido', text: 'Ajusta personajes, reglas especiales, jinxes y orden nocturno.' },
      { name: 'Organiza el diseño', text: 'Elige el diseño, el fondo y las fuentes, y revisa la vista previa.' },
      { name: 'Exporta o imprime', text: 'Exporta una imagen o un JSON, o guarda un PDF desde el diálogo de impresión.' },
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
        '@id': `${SITE_URL}/#webapp`,
        name: m.appTitle,
        description: m.description,
        url: `${SITE_URL}/`,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Web',
        inLanguage: LANG_TO_BCP47[lang],
        availableLanguage: LANGUAGES.map((item) => LANG_TO_BCP47[item]),
        image: OG_IMAGE,
        featureList: m.featureList,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: m.appTitle, url: `${SITE_URL}/` },
    ],
  };
}

export const STRUCTURED_DATA = Object.fromEntries(LANGUAGES.map((lang) => [lang, buildStructuredData(lang)]));

// Only real, indexable paths belong here. Script detail pages are added separately.
export const PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/zh-cn/', priority: '0.9', changefreq: 'monthly' },
  { path: '/es/', priority: '0.8', changefreq: 'monthly' },
  { path: '/scripts/', priority: '0.8', changefreq: 'weekly' },
];
