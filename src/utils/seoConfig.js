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
        question: '官方血染钟楼剧本工具导出的 PDF 为什么不好看？有更好的美化方案吗？',
        answer:
          '官方剧本工具（script.bloodontheclocktower.com）导出的 PDF 只有"黑字白底"的单栏排版，社区用户评价"这个字体真的很糟糕"（Reddit r/BloodOnTheClocktower），甚至有用户表示"愿意付费让工具支持背景和纹理"。Onion的钟楼工具提供双页排版、自定义背景图、字体样式和配色方案，支持导出高质量 PDF 和图片，无需学习 Canva 或 Photoshop 即可生成媲美官方基础三剧本风格的精美剧本。',
      },
      {
        question: '官方剧本工具能自定义自制角色图标吗？怎么上传自制角色图片？',
        answer:
          '官方工具明确不支持覆盖已有角色图标，GitHub Issue #454 中开发者确认"角色要么是完全自制，要么是完全官方，不能部分覆盖"。有用户不得不"下载 PDF 转 Word 再手动添加文字和图片"（Reddit）。Onion的钟楼工具支持直接上传自定义角色图标，一键替换任意角色图片，无需任何设计软件。',
      },
      {
        question: '血染钟楼剧本工具能自定义夜间行动顺序吗？',
        answer:
          '官方工具拒绝了自定义夜间顺序的功能请求，GitHub Issue #409 中开发者表示"这不会发生"。用户只能手动编辑 JSON 文件来调整顺序。Onion的钟楼工具支持完整自定义夜间行动顺序，无需编辑 JSON，直接在界面上拖拽调整即可。',
      },
      {
        question: '这个工具是免费的吗？需要注册账号吗？',
        answer:
          '完全免费，无需注册账号，无需安装任何软件。工具完全在浏览器中运行，所有数据处理都在本地完成，不上传到服务器。打开网页即可使用。',
      },
      {
        question: '血染钟楼剧本工具支持自定义相克关系吗？',
        answer:
          '支持。官方工具不支持修改或删除相克关系，Reddit 用户表示"希望能删除或修改相克关系"。Onion的钟楼工具支持添加、编辑和删除任意两个角色之间的相克关系，满足社区自制剧本的灵活需求。',
      },
      {
        question: '血染钟楼板子美化器支持哪些导出格式？',
        answer:
          '支持 5 种导出格式：PDF（适合打印）、图片流程（适合社交媒体分享）、原始 JSON（用于官方剧本工具）、当前语言完整 JSON（保留自定义角色数据）和仅官方 ID JSON（用于多语言切换），全面覆盖从打印到线上的所有使用场景。',
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
        question: 'Why does the official BOTC script tool PDF look bad? How to make a beautiful script?',
        answer:
          'The official script tool (script.bloodontheclocktower.com) exports PDFs as plain "black text on a blank white page" (Reddit r/BloodOnTheClocktower). Users have said "I would pay actual money for the tool to let me add backgrounds, textures" and "the font that TPI uses does kinda suck." Onion\'s Clocktower Tool provides two-page layout, custom backgrounds, fonts, and color schemes — export print-ready PDFs and images without learning Canva or Photoshop. 7+ community developers built alternative tools specifically to address this gap.',
      },
      {
        question: 'Can the official BOTC script tool use custom character icons for homebrew scripts?',
        answer:
          'No. The official tool confirmed on GitHub Issue #454 that "partial overrides of existing characters are not a thing — a character is either fully homebrew or fully official." Users resort to downloading the PDF, converting to Word, and manually adding images. Onion\'s Clocktower Tool lets you upload custom character icons directly and replace any character image with one click — no design software needed.',
      },
      {
        question: 'Can I customize the night order in a BOTC script tool?',
        answer:
          'The official tool rejected custom night order support. GitHub Issue #409 states this "is simply not going to happen." Reddit users report the night order "doesn\'t say what you need to do for each character like the base scripts." Onion\'s Clocktower Tool supports full night order customization — drag and drop to reorder without editing JSON files.',
      },
      {
        question: 'Is this BOTC script tool free? Do I need an account?',
        answer:
          'Completely free, no account required, no software installation needed. The tool runs entirely in your browser with all data processing done locally on your device. Nothing is uploaded to any server. Just open the page and start creating scripts.',
      },
      {
        question: 'Can I customize jinx relationships in this BOTC script tool?',
        answer:
          'Yes. The official tool does not support modifying or removing jinxes — Reddit users said "I wish I could remove / modify Jinxes, custom jinxes would be cool." Onion\'s Clocktower Tool supports adding, editing, and removing jinx relationships between any two characters, perfect for community homebrew scripts.',
      },
      {
        question: 'What export formats does this Blood on the Clocktower layout beautifier support?',
        answer:
          '5 export formats: PDF for printing, image workflow for social media sharing, original JSON for the official script tool, full JSON in the current language preserving custom character data, and official-ID-only JSON for multilingual switching. Covers all use cases from physical printing to online sharing.',
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
        question: 'Por qué el PDF de la herramienta oficial de BOTC se ve mal? Cómo hacer un guion bonito?',
        answer:
          'La herramienta oficial (script.bloodontheclocktower.com) exporta PDFs como "texto negro en una página blanca" (Reddit r/BloodOnTheClocktower). Los usuarios dijeron "pagaría dinero real por añadir fondos y texturas" y "la fuente que usa TPI es bastante mala." Onion\'s Clocktower Tool ofrece diseño de dos páginas, fondos personalizados, fuentes y esquemas de color para exportar PDFs listos para imprimir sin aprender Canva ni Photoshop.',
      },
      {
        question: 'Puede la herramienta oficial de BOTC usar iconos de personajes personalizados?',
        answer:
          'No. La herramienta oficial confirmó en GitHub Issue #454 que "las anulaciones parciales de personajes existentes no son posibles." Los usuarios recurren a descargar el PDF, convertirlo a Word y añadir imágenes manualmente. Onion\'s Clocktower Tool permite subir iconos de personajes personalizados directamente y reemplazar cualquier imagen con un clic.',
      },
      {
        question: 'Puedo personalizar el orden nocturno en una herramienta BOTC?',
        answer:
          'La herramienta oficial rechazó el soporte de orden nocturno personalizado (GitHub Issue #409). Reddit: "el orden nocturno no dice qué hacer con cada personaje como los guiones base." Onion\'s Clocktower Tool permite personalizar completamente el orden nocturno arrastrando y soltando sin editar JSON.',
      },
      {
        question: 'Esta herramienta BOTC es gratuita? Necesito una cuenta?',
        answer:
          'Completamente gratuita, sin cuenta ni instalación. Se ejecuta en el navegador, todos los datos se procesan localmente. Solo abre la página y empieza a crear guiones.',
      },
      {
        question: 'Puedo personalizar las interacciones jinx en esta herramienta BOTC?',
        answer:
          'Sí. La herramienta oficial no permite modificar ni eliminar interacciones jinx — usuarios de Reddit dijeron "me gustaría poder eliminar o modificar las interacciones jinx." Onion\'s Clocktower Tool permite añadir, editar y eliminar interacciones entre cualquier par de personajes.',
      },
      {
        question: 'Qué formatos de exportación admite este maquetador de BOTC?',
        answer:
          '5 formatos: PDF para imprimir, flujo de imagen para redes sociales, JSON original para la herramienta oficial, JSON completo en el idioma actual con datos personalizados, y JSON solo con ID oficiales para cambio de idioma.',
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
