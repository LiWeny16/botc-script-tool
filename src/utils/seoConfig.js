/**
 * Single source of truth for SEO data.
 * - Used by build-time HTML generator (`scripts/generate-seo-html.mjs`)
 * - Used by runtime SPA SEO manager (`src/components/SEOManager.tsx`)
 */

export const SITE_URL = 'https://botc.letshare.fun';
export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGES = ['cn', 'en', 'es'];

// 内部语言码 → BCP 47 标准码（用于 HTML lang 属性）
export const LANG_TO_BCP47 = { cn: 'zh-CN', en: 'en', es: 'es' };

export const OG_IMAGE = `${SITE_URL}/imgs/images/screenshots/promo-gpt.png`;
export const OG_IMAGE_WIDTH = 1731;
export const OG_IMAGE_HEIGHT = 909;

export const META = {
  cn: {
    title: 'Onion的钟楼工具 - 免费血染钟楼剧本美化器 | 自定义相克·双页排版·PDF导出',
    description:
      '免费血染钟楼板子美化器，自定义角色、相克关系和特殊规则，双页排版一键导出 PDF 或图片。无需注册，打开即用。',
    keywords:
      '血染钟楼板子美化器,血染钟楼自定义剧本工具,血染钟楼剧本生成器,BOTC剧本工具,BOTC板子美化器,相克关系怎么定制,自定义相克关系,血染钟楼JSON,Blood on the Clocktower',
    appTitle: 'Onion的钟楼工具',
    ogImageAlt: 'Onion的钟楼工具：免费血染钟楼剧本美化器，支持自定义相克、双页排版和 PDF 导出',
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
          '导入或生成剧本后，点击"添加特殊规则"，选择"添加自定义相克"，选中两个角色并填写规则描述，工具会自动将相克关系渲染到剧本板子中。支持自定义任意两个角色之间的相克关系，满足社区自制剧本的灵活需求。',
      },
      {
        question: '血染钟楼板子美化器支持哪些导出格式？',
        answer:
          '支持 5 种导出格式：PDF（适合打印）、图片流程（适合社交媒体分享）、原始 JSON（用于官方剧本工具）、当前语言完整 JSON（保留自定义角色数据）和仅官方 ID JSON（用于多语言切换），全面覆盖从打印到线上的所有使用场景。',
      },
      {
        question: '血染钟楼自定义剧本工具能处理官方 JSON 吗？',
        answer:
          '可以。直接导入官方剧本制作器（script tool）导出的 JSON 文件，工具自动解析角色列表、相克关系和特殊规则，并支持在中文、英文、西班牙语界面之间自由切换，导出对应语言版本。',
      },
      {
        question: '这个工具是免费的吗？需要注册账号吗？',
        answer:
          '完全免费，无需注册账号，无需安装任何软件。工具完全在浏览器中运行，所有数据处理都在本地完成，不上传到服务器。打开网页即可使用。',
      },
      {
        question: '如何导入剧本到工具中？',
        answer:
          '点击导入按钮，选择从官方 BOTC 剧本制作器导出的 JSON 文件，或任何兼容格式的 JSON 文件。工具会自动解析并显示剧本中的所有角色、相克关系和特殊规则。也支持从剧本仓库直接选择社区共享的热门剧本。',
      },
      {
        question: '双页排版模式是什么？怎么使用？',
        answer:
          '双页排版模式将剧本内容分成两页显示，第一页为角色列表和阵营信息，第二页为相克关系和特殊规则说明。适合打印为 A3 或 A4 双面。在设置中切换"双页模式"即可开启，支持自定义背景图和字体样式。',
      },
    ],
    howToSteps: [
      {
        name: '打开工具并选择剧本',
        text: '访问 botc.letshare.fun，点击"导入"按钮选择官方剧本 JSON 文件，或从剧本仓库中选择社区热门剧本。',
      },
      {
        name: '编辑角色和规则',
        text: '在角色面板中添加或移除角色，点击"添加特殊规则"编辑相克关系，自定义任意两个角色之间的交互规则。',
      },
      {
        name: '美化排版和样式',
        text: '选择单页或双页排版模式，自定义背景图片、字体样式和配色方案，预览剧本板子效果。',
      },
      {
        name: '导出和分享',
        text: '点击"导出"选择 PDF 打印、图片分享或 JSON 文件保存，支持中文、英文和西班牙语版本。',
      },
    ],
    ogLocale: 'zh_CN',
    ogAlternate: ['en_US', 'es_ES'],
  },
  en: {
    title: "Free BOTC Script Tool - Blood on the Clocktower Layout Beautifier & Script Generator",
    description:
      'The free Blood on the Clocktower script tool. Import official JSON, customize characters and jinxes, choose two-page layout, then export print-ready PDF or images. No signup needed — open and create.',
    keywords:
      'Blood on the Clocktower script generator,BOTC script tool,BOTC layout beautifier,Clocktower script maker,custom BOTC script,custom jinx relationships,how to customize BOTC jinx,script JSON,board game tool',
    appTitle: "Onion's Clocktower Tool",
    ogImageAlt: "Free BOTC Script Tool: Blood on the Clocktower layout beautifier with custom jinxes and PDF export",
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
          'After importing or generating a script, open "Add Special Rule", choose "Add Custom Jinx", select two characters and write the rule description. The tool automatically renders the jinx relationship on the script sheet. You can define custom jinxes between any two characters to support community-designed homebrew scripts.',
      },
      {
        question: 'What export formats does this Blood on the Clocktower layout beautifier support?',
        answer:
          'It supports 5 export formats: PDF for printing, image workflow for social media sharing, original JSON for the official script tool, full JSON in the current language to preserve custom character data, and official-ID-only JSON for multilingual switching. This covers all use cases from physical printing to online sharing.',
      },
      {
        question: 'Can this custom BOTC script maker use official JSON?',
        answer:
          'Yes. Import JSON exported from the official BOTC script tool and the generator automatically parses the character list, jinx relationships and special rules. It supports freely switching between Chinese, English and Spanish interfaces, and exporting localized versions.',
      },
      {
        question: 'Is this BOTC script tool free? Do I need to create an account?',
        answer:
          'Completely free, no account required, no software installation needed. The tool runs entirely in your browser with all data processing done locally on your device. Nothing is uploaded to any server. Just open the page and start creating scripts.',
      },
      {
        question: 'How do I import a script into the tool?',
        answer:
          'Click the Import button and select a JSON file exported from the official BOTC script maker or any compatible JSON file. The tool automatically parses and displays all characters, jinx relationships and special rules. You can also browse the script repository to select popular community-shared scripts directly.',
      },
      {
        question: 'What is two-page layout mode and how do I use it?',
        answer:
          'Two-page layout mode splits the script content across two pages: page one shows the character list and team information, page two displays jinx relationships and special rules. Ideal for printing on A3 or A4 double-sided paper. Toggle "Two-page mode" in settings to enable it, with custom background images and font styles.',
      },
    ],
    howToSteps: [
      {
        name: 'Open the tool and select a script',
        text: 'Visit botc.letshare.fun, click "Import" to select an official script JSON file, or choose a popular community script from the script repository.',
      },
      {
        name: 'Edit characters and rules',
        text: 'Add or remove characters in the character panel, click "Add Special Rule" to edit jinx relationships, and customize interaction rules between any two characters.',
      },
      {
        name: 'Beautify layout and styling',
        text: 'Choose single-page or two-page layout mode, customize background images, font styles and color schemes, then preview the script sheet.',
      },
      {
        name: 'Export and share',
        text: 'Click "Export" to choose PDF for printing, images for sharing, or JSON file for saving. Supports Chinese, English and Spanish versions.',
      },
    ],
    ogLocale: 'en_US',
    ogAlternate: ['zh_CN', 'es_ES'],
  },
  es: {
    title: 'Herramienta BOTC gratuita - Generador y maquetador de guiones Blood on the Clocktower',
    description:
      'La herramienta gratuita para guiones de Blood on the Clocktower. Importa JSON oficial, personaliza personajes e interacciones jinx, y exporta PDF listo para imprimir. Sin registro, abre y crea.',
    keywords:
      'generador de guiones Blood on the Clocktower,herramienta BOTC,maquetador BOTC,crear guion BOTC,guion personalizado BOTC,interacciones jinx personalizadas,cómo personalizar interacciones BOTC,JSON de guion,juego de mesa',
    appTitle: 'Herramienta para Clocktower de Onion',
    ogImageAlt: 'Herramienta BOTC gratuita: maquetador de guiones Blood on the Clocktower con jinxes personalizados y exportación PDF',
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
          'Después de importar o generar un guion, abre "Añadir regla especial", elige "Añadir interacción personalizada", selecciona dos personajes y escribe la descripción. La herramienta renderiza automáticamente la interacción en la hoja del guion. Puedes definir interacciones personalizadas entre cualquier par de personajes para guiones homebrew de la comunidad.',
      },
      {
        question: 'Qué formatos de exportación admite este maquetador de BOTC?',
        answer:
          'Admite 5 formatos: PDF para imprimir, flujo de imagen para compartir en redes sociales, JSON original para la herramienta oficial, JSON completo en el idioma actual para conservar datos de personajes personalizados, y JSON solo con ID oficiales para cambiar de idioma.',
      },
      {
        question: 'Este creador de guiones BOTC acepta JSON oficial?',
        answer:
          'Sí. Importa JSON del creador oficial de guiones BOTC y la herramienta analiza automáticamente la lista de personajes, interacciones jinx y reglas especiales. Admite cambiar libremente entre chino, inglés y español, y exportar versiones localizadas.',
      },
      {
        question: 'Esta herramienta BOTC es gratuita? Necesito crear una cuenta?',
        answer:
          'Completamente gratuita, sin necesidad de cuenta ni instalación de software. La herramienta se ejecuta íntegramente en el navegador, procesando todos los datos localmente en tu dispositivo. Solo abre la página y empieza a crear guiones.',
      },
      {
        question: 'Cómo importo un guion en la herramienta?',
        answer:
          'Haz clic en Importar y selecciona un archivo JSON exportado del creador oficial de guiones BOTC o cualquier JSON compatible. La herramienta analiza y muestra todos los personajes, interacciones y reglas. También puedes explorar el repositorio de guiones para seleccionar guiones populares de la comunidad.',
      },
    ],
    howToSteps: [
      {
        name: 'Abrir la herramienta y seleccionar un guion',
        text: 'Visita botc.letshare.fun, haz clic en "Importar" para seleccionar un archivo JSON oficial o elige un guion popular del repositorio.',
      },
      {
        name: 'Editar personajes y reglas',
        text: 'Añade o elimina personajes, haz clic en "Añadir regla especial" para editar interacciones jinx y personaliza las reglas entre cualquier par de personajes.',
      },
      {
        name: 'Mejorar la maquetación',
        text: 'Elige modo de una o dos páginas, personaliza imágenes de fondo, estilos de fuente y esquemas de color, y previsualiza el resultado.',
      },
      {
        name: 'Exportar y compartir',
        text: 'Haz clic en "Exportar" para elegir PDF para imprimir, imágenes para compartir o JSON para guardar. Admite versiones en chino, inglés y español.',
      },
    ],
    ogLocale: 'es_ES',
    ogAlternate: ['zh_CN', 'en_US'],
  },
};

function buildStructuredData(lang) {
  const m = META[lang];
  const howToName = lang === 'cn'
    ? '如何使用 Onion的钟楼工具制作血染钟楼剧本'
    : lang === 'es'
      ? 'Cómo crear un guion BOTC con la herramienta Clocktower de Onion'
      : "How to create a BOTC script with Onion's Clocktower Tool";

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: m.appTitle,
        alternateName: m.title,
        description: m.description,
        url: `${SITE_URL}/`,
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
          availability: 'https://schema.org/InStock',
        },
        areaServed: {
          '@type': 'GeoShape',
          name: 'Worldwide',
        },
        speakable: {
          '@type': 'SpeakableSpecification',
          xpath: ['/html/head/title', '/html/head/meta[@name="description"]/@content'],
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
        '@type': 'HowTo',
        name: howToName,
        description: m.description,
        image: OG_IMAGE,
        totalTime: 'PT5M',
        estimatedCost: {
          '@type': 'MonetaryAmount',
          currency: 'USD',
          value: '0',
        },
        step: m.howToSteps.map((step, i) => ({
          '@type': 'HowToStep',
          name: step.name,
          text: step.text,
          url: `${SITE_URL}/#step${i + 1}`,
        })),
      },
      {
        '@type': 'WebSite',
        name: m.appTitle,
        url: SITE_URL,
        inLanguage: lang,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: m.appTitle,
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: lang === 'cn' ? '剧本仓库' : lang === 'es' ? 'Repositorio' : 'Script Repository',
            item: `${SITE_URL}/#/repo`,
          },
        ],
      },
    ],
  };
}

export const STRUCTURED_DATA = Object.fromEntries(LANGUAGES.map((lang) => [lang, buildStructuredData(lang)]));

export const PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/repo', priority: '0.8', changefreq: 'weekly' },
];
