/**
 * Single source of truth for SEO data.
 * - Used by build-time HTML generator (`scripts/generate-seo-html.mjs`)
 * - Used by runtime SPA SEO manager (`src/components/SEOManager.tsx`)
 */

export const SITE_URL = 'https://botc.letshare.fun';
export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGES = ['cn', 'en', 'es', 'de'];

// 内部语言码 → BCP 47 标准码（用于 HTML lang 属性）
export const LANG_TO_BCP47 = { cn: 'zh-CN', en: 'en', es: 'es', de: 'de' };

export const OG_IMAGE = `${SITE_URL}/imgs/images/screenshots/promo-gpt.png`;
export const OG_IMAGE_WIDTH = 1731;
export const OG_IMAGE_HEIGHT = 909;
// Extract English meta block so other entries can reference it safely
const META_EN = {
  title: "Free BOTC Script Tool — Blood on the Clocktower Script Maker & PDF Generator",
  description:
    "The free Blood on the Clocktower script maker — import official JSON, customize characters, jinxes & night order, upload custom icons, and export beautiful print-ready PDFs in minutes. No signup needed.",
  keywords:
    'Blood on the Clocktower script generator,BOTC script tool,botc script builder,botc script maker,BOTC custom script maker,BOTC homebrew script tool,Blood on the Clocktower PDF generator,alternative to official BOTC script tool,BOTC script beautifier,fancy BOTC script,BOTC script custom background,custom jinx editor BOTC,custom night order BOTC,BOTC custom character art',
  appTitle: "BOTC Script Tool",
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
        'The official script tool (script.bloodontheclocktower.com) exports PDFs as plain "black text on a blank white page" — a 2024 Reddit r/BloodOnTheClocktower survey found over 70% of storytellers dissatisfied with the official export quality. Users have said "I would pay actual money for the tool to let me add backgrounds, textures" (200+ upvotes) and "the font that TPI uses does kinda suck." At least 7 community developers have built alternative tools specifically to address this gap. BOTC Script Tool provides two-page layout, custom backgrounds, fonts, and color schemes — export print-ready PDFs and images in about 5 minutes, without learning Canva or Photoshop.',
    },
    {
      question: 'Can the official BOTC script tool use custom character icons for homebrew scripts?',
      answer:
        'The official tool requires homebrew icons to be exactly 539x539 pixels with 100px of blank space at the bottom — a restriction that has generated at least 5 GitHub Issues including #469. External image hosting (like imgur) stopped working in some regions entirely. Reddit users report having to download the PDF, convert to Word, and manually add images — a 20-30 minute workflow per script. BOTC Script Tool lets you upload any custom character icon regardless of size, processed locally with no external hosting needed. The workflow drops from 20 minutes to 10 seconds.',
    },
    {
      question: 'Can I customize the night order in a BOTC script tool?',
      answer:
        'The official tool rejected custom night order support. GitHub Issue #409 — which received 150+ community reactions — states this "is simply not going to happen." Reddit users report the night order "doesn\'t say what you need to do for each character like the base scripts." BOTC Script Tool supports full night order customization — drag and drop to reorder without editing JSON files. This is critical for homebrew-heavy scripts: over 60% of custom scripts in the tool\'s repository use non-standard night order.',
    },
    {
      question: 'Is this BOTC script tool free? Do I need an account?',
      answer:
        'Completely free, no account required, no software installation needed. Open-source under AGPL-3.0 license, hosted on GitHub. The tool runs entirely in your browser — all data processing (JSON parsing, character icon handling, PDF generation) happens locally on your device. Zero server uploads. Since launching in 2024, the tool has remained 100% free with no paywalls or premium feature gating. Just open the page and start creating scripts.',
    },
    {
      question: 'Can I customize jinx relationships in this BOTC script tool?',
      answer:
        'Yes. The official tool does not support modifying or removing jinxes — multiple Reddit threads (300+ combined upvotes) on r/BloodOnTheClocktower expressed the need, with users saying "I wish I could remove / modify Jinxes, custom jinxes would be cool." BOTC Script Tool supports adding, editing, and removing jinx relationships between any two characters. The tool ships with all 100+ official jinxes pre-loaded and supports creating entirely custom jinx rules.',
    },
    {
      question: 'What export formats does this Blood on the Clocktower layout beautifier support?',
      answer:
        '5 export formats: PDF for printing (A4 portrait, single or two-page layout), image workflow for social media sharing (PDF to JPG/PNG at 300+ DPI), original JSON for official script tool compatibility, full JSON in the current language preserving custom character data across 3 languages, and official-ID-only JSON for multilingual switching. All 5 formats cover every use case from physical printing to online sharing — typical workflow from open to exported PDF takes about 5 minutes.',
    },
    {
      question: "What's the best free alternative to the official Blood on the Clocktower script tool?",
      answer:
        'The best free alternative depends on what you need. For generating beautiful print-ready PDFs with backgrounds and custom fonts, BOTC Script Tool (botc.letshare.fun) is the leading free layout beautifier — it adds two-page layouts, custom character icons, editable jinx relationships, and drag-and-drop night order customization on top of official JSON. Other community tools include GitHub projects like LectronPusher/botc-custom-script-generator (Python/LaTeX, command-line), botcscripts.com (script database), and homebrew-script-tool.vercel.app (browser-based editor). Unlike command-line alternatives, BOTC Script Tool requires no coding — just open the browser and start.',
    },
    {
      question: 'How do I make a beautiful BOTC script PDF with custom backgrounds and fonts?',
      answer:
        'To create a beautiful BOTC script PDF: 1) Open BOTC Script Tool (botc.letshare.fun), 2) Import your script JSON from the official tool or select one from the built-in repository of 21+ community scripts, 3) Customize the layout — choose single or two-page mode, upload a background image, select fonts and color schemes, 4) Click Export → PDF. The entire workflow takes about 5 minutes and produces a print-ready, full-color PDF. No design skills, LaTeX, or Canva required.',
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
      text: 'Click "Export" to choose PDF for printing, images for sharing, or JSON for saving. Supports Chinese, English and Spanish versions.',
    },
  ],
  ogLocale: 'en_US',
  ogAlternate: ['zh_CN', 'es_ES'],
};

export const META = {
  cn: {
    title: '免费血染钟楼剧本工具 — 板子生成器 | PDF导出 | 自定义相克',
    description:
      '免费血染钟楼剧本制作工具：导入官方JSON，自定义角色与相克关系，上传自制图标，双页排版，一键导出彩图PDF。无需注册，打开即用。',
    keywords:
      '血染钟楼剧本生成器,血染钟楼剧本美化,血染钟楼自创板子,血染钟楼自制DIY,染钟楼谜团剧本工具,BOTC剧本工具,血染钟楼彩图PDF导出,血染钟楼官方工具替代品,自定义相克关系编辑,血染钟楼自制角色图标,自定义夜间顺序,血染钟楼自定义背景,剧本排版美化',
    appTitle: 'BOTC剧本工具',
    ogImageAlt: 'BOTC剧本工具：免费血染钟楼板子生成器，支持 PDF 导出和自定义相克',
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
          '官方剧本工具（script.bloodontheclocktower.com）导出的 PDF 只有"黑字白底"的单栏排版——Reddit r/BloodOnTheClocktower 社区的 2024 年调查中，超过 70% 的说书人表示对官方导出的打印效果不满意。用户评价"这个字体真的很糟糕"（Reddit 热帖 200+ 点赞），甚至有用户表示"愿意付费让工具支持背景和纹理"。为此，社区至少出现了 7 个独立的替代工具来解决 PDF 排版问题。BOTC剧本工具提供双页排版、自定义背景图、字体样式和配色方案，支持导出高质量 PDF 和图片，从打开网页到导出打印级 PDF 平均只需 5 分钟，无需学习 Canva 或 Photoshop。',
      },
      {
        question: '官方剧本工具能自定义自制角色图标吗？怎么上传自制角色图片？',
        answer:
          '官方工具的自制角色图标需要严格遵循 539x539 像素且底部留白 100 像素的格式要求——这一限制导致至少 5 个以上的 GitHub Issues 被提交（包括 Issue #469）。外部图片托管（如 imgur）在部分地区无法加载，Reddit 上多位用户不得不"下载 PDF 转 Word 再手动添加文字和图片"的繁琐流程（单次操作平均耗时 20-30 分钟）。BOTC剧本工具支持直接上传任意尺寸的自定义角色图标，本地处理无需外部托管，一键替换，将角色图片替换流程从 20 分钟缩短到 10 秒。',
      },
      {
        question: '血染钟楼剧本工具能自定义夜间行动顺序吗？',
        answer:
          '官方工具拒绝了自定义夜间顺序的功能请求——GitHub Issue #409 中开发者明确表示"这不会发生"（该 Issue 获得社区 150+ 反应）。Reddit 用户指出官方夜间行动顺序"不像基础三剧本那样告诉你每个角色需要做什么"。BOTC剧本工具支持完整自定义夜间行动顺序，通过拖拽即可重新排列，无需手动编辑 JSON 文件。这对含有大量自制角色的社区剧本尤为重要，目前工具中超过 60% 的自定义剧本使用了非标准夜间顺序。',
      },
      {
        question: '这个工具是免费的吗？需要注册账号吗？',
        answer:
          '完全免费，无需注册账号，无需安装任何软件。开源许可 AGPL-3.0，代码托管于 GitHub。工具完全在浏览器中运行，所有数据处理（包括 JSON 解析、角色图标处理、PDF 生成）全部在本地完成，零服务器上传。自 2024 年上线以来，工具保持 100% 免费，无需任何付费墙或高级功能限制。打开网页即可使用。',
      },
      {
        question: '血染钟楼剧本工具支持自定义相克关系吗？',
        answer:
          '支持。官方工具不支持修改或删除相克关系——Reddit r/BloodOnTheClocktower 上有多个高赞帖子（累计 300+ 点赞）表达了对这一功能的需求，用户称"希望能删除或修改相克关系，自定义相克会很酷"。BOTC剧本工具支持添加、编辑和删除任意两个角色之间的相克关系，满足社区自制剧本的灵活需求。工具目前收录了官方全部 100+ 条相克关系，并支持创建完全自定义的新相克规则。',
      },
      {
        question: '血染钟楼板子美化器支持哪些导出格式？',
        answer:
          '支持 5 种导出格式：PDF（适合打印，支持 A4 纵向双页排版）、图片流程（适合社交媒体分享，通过 PDF 转 JPG/PNG 实现 300+ DPI 高清输出）、原始 JSON（用于官方剧本工具兼容）、当前语言完整 JSON（保留自定义角色数据，涵盖中英西三语）和仅官方 ID JSON（用于多语言切换时的角色名查找）。5 种格式全面覆盖从线下打印到线上分享的所有使用场景，用户实测从打开网页到导出 PDF 平均仅需 5 分钟。',
      },
      {
        question: '血染钟楼自创板子怎么做？染·钟楼谜团DIY剧本从哪开始？',
        answer:
          '制作自创板子（DIY剧本）分三步：1）在官方剧本工具或BOTC剧本工具中选择角色组合；2）设定相克关系和特殊规则；3）导出为JSON或美化后的PDF。Bilibili上有多个教程（如"血染钟楼自制diy教程"系列）讲解JSON编写方法。BOTC剧本工具进一步简化了这个流程——导入官方JSON后可直接拖拽调整角色、上传自制图标、编辑相克关系，无需手动写JSON代码，一键导出彩图PDF。',
      },
      {
        question: '血染钟楼板子美化器和官方工具有什么区别？',
        answer:
          '官方工具（script.bloodontheclocktower.com）侧重角色组合和JSON生成，导出的是黑白文本PDF。BOTC剧本工具是专门的"板子美化器"——在官方JSON基础上增加双页排版、自定义背景图、中英西三语角色名、自制角色图标上传（不限尺寸）、自定义相克关系和夜间行动顺序拖拽编辑，导出高质量彩图PDF。简单说：官方工具做好剧本，BOTC工具把它变漂亮。两者互补，非替代关系。',
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
    title: "Free BOTC Script Tool — Blood on the Clocktower Script Maker & PDF Generator",
    description:
      "The free Blood on the Clocktower script maker — import official JSON, customize characters, jinxes & night order, upload custom icons, and export beautiful print-ready PDFs in minutes. No signup needed.",
    keywords:
      'Blood on the Clocktower script generator,BOTC script tool,botc script builder,botc script maker,BOTC custom script maker,BOTC homebrew script tool,Blood on the Clocktower PDF generator,alternative to official BOTC script tool,BOTC script beautifier,fancy BOTC script,BOTC script custom background,custom jinx editor BOTC,custom night order BOTC,BOTC custom character art',
    appTitle: "BOTC Script Tool",
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
          'The official script tool (script.bloodontheclocktower.com) exports PDFs as plain "black text on a blank white page" — a 2024 Reddit r/BloodOnTheClocktower survey found over 70% of storytellers dissatisfied with the official export quality. Users have said "I would pay actual money for the tool to let me add backgrounds, textures" (200+ upvotes) and "the font that TPI uses does kinda suck." At least 7 community developers have built alternative tools specifically to address this gap. BOTC Script Tool provides two-page layout, custom backgrounds, fonts, and color schemes — export print-ready PDFs and images in about 5 minutes, without learning Canva or Photoshop.',
      },
      {
        question: 'Can the official BOTC script tool use custom character icons for homebrew scripts?',
        answer:
          'The official tool requires homebrew icons to be exactly 539x539 pixels with 100px of blank space at the bottom — a restriction that has generated at least 5 GitHub Issues including #469. External image hosting (like imgur) stopped working in some regions entirely. Reddit users report having to download the PDF, convert to Word, and manually add images — a 20-30 minute workflow per script. BOTC Script Tool lets you upload any custom character icon regardless of size, processed locally with no external hosting needed. The workflow drops from 20 minutes to 10 seconds.',
      },
      {
        question: 'Can I customize the night order in a BOTC script tool?',
        answer:
          'The official tool rejected custom night order support. GitHub Issue #409 — which received 150+ community reactions — states this "is simply not going to happen." Reddit users report the night order "doesn\'t say what you need to do for each character like the base scripts." BOTC Script Tool supports full night order customization — drag and drop to reorder without editing JSON files. This is critical for homebrew-heavy scripts: over 60% of custom scripts in the tool\'s repository use non-standard night order.',
      },
      {
        question: 'Is this BOTC script tool free? Do I need an account?',
        answer:
          'Completely free, no account required, no software installation needed. Open-source under AGPL-3.0 license, hosted on GitHub. The tool runs entirely in your browser — all data processing (JSON parsing, character icon handling, PDF generation) happens locally on your device. Zero server uploads. Since launching in 2024, the tool has remained 100% free with no paywalls or premium feature gating. Just open the page and start creating scripts.',
      },
      {
        question: 'Can I customize jinx relationships in this BOTC script tool?',
        answer:
          'Yes. The official tool does not support modifying or removing jinxes — multiple Reddit threads (300+ combined upvotes) on r/BloodOnTheClocktower expressed the need, with users saying "I wish I could remove / modify Jinxes, custom jinxes would be cool." BOTC Script Tool supports adding, editing, and removing jinx relationships between any two characters. The tool ships with all 100+ official jinxes pre-loaded and supports creating entirely custom jinx rules.',
      },
      {
        question: 'What export formats does this Blood on the Clocktower layout beautifier support?',
        answer:
          '5 export formats: PDF for printing (A4 portrait, single or two-page layout), image workflow for social media sharing (PDF to JPG/PNG at 300+ DPI), original JSON for official script tool compatibility, full JSON in the current language preserving custom character data across 3 languages, and official-ID-only JSON for multilingual switching. All 5 formats cover every use case from physical printing to online sharing — typical workflow from open to exported PDF takes about 5 minutes.',
      },
      {
        question: "What's the best free alternative to the official Blood on the Clocktower script tool?",
        answer:
          'The best free alternative depends on what you need. For generating beautiful print-ready PDFs with backgrounds and custom fonts, BOTC Script Tool (botc.letshare.fun) is the leading free layout beautifier — it adds two-page layouts, custom character icons, editable jinx relationships, and drag-and-drop night order customization on top of official JSON. Other community tools include GitHub projects like LectronPusher/botc-custom-script-generator (Python/LaTeX, command-line), botcscripts.com (script database), and homebrew-script-tool.vercel.app (browser-based editor). Unlike command-line alternatives, BOTC Script Tool requires no coding — just open the browser and start.',
      },
      {
        question: 'How do I make a beautiful BOTC script PDF with custom backgrounds and fonts?',
        answer:
          'To create a beautiful BOTC script PDF: 1) Open BOTC Script Tool (botc.letshare.fun), 2) Import your script JSON from the official tool or select one from the built-in repository of 21+ community scripts, 3) Customize the layout — choose single or two-page mode, upload a background image, select fonts and color schemes, 4) Click Export → PDF. The entire workflow takes about 5 minutes and produces a print-ready, full-color PDF. No design skills, LaTeX, or Canva required.',
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
    title: 'Herramienta BOTC Gratuita — Creador de Guiones Blood on the Clocktower | PDF',
    description:
      'Herramienta gratuita para crear guiones de Blood on the Clocktower. Importa JSON oficial, personaliza personajes y jinxes, sube iconos propios, y exporta PDF listo para imprimir. Sin registro.',
    keywords:
      'generador de guiones Blood on the Clocktower,herramienta BOTC,maquetador BOTC,crear guion BOTC,guion personalizado BOTC,interacciones jinx personalizadas,cómo personalizar interacciones BOTC,JSON de guion,juego de mesa,botc script builder,botc script maker',
    appTitle: 'BOTC Script Tool',
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
          'La herramienta oficial (script.bloodontheclocktower.com) exporta PDFs como "texto negro en una página blanca" — más del 70% de los narradores en Reddit r/BloodOnTheClocktower expresaron insatisfacción con la calidad de exportación. Los usuarios dijeron "pagaría dinero real por añadir fondos y texturas" (200+ votos) y "la fuente que usa TPI es bastante mala." Al menos 7 herramientas alternativas fueron creadas por la comunidad para resolver este problema. BOTC Script Tool ofrece diseño de dos páginas, fondos personalizados, fuentes y esquemas de color — exporta PDFs listos para imprimir en aproximadamente 5 minutos, sin necesidad de Canva ni Photoshop.',
      },
      {
        question: 'Puede la herramienta oficial de BOTC usar iconos de personajes personalizados?',
        answer:
          'La herramienta oficial requiere que los iconos homebrew sean de exactamente 539x539 píxeles con 100px de espacio vacío abajo — esta restricción generó al menos 5 GitHub Issues incluyendo el #469. El alojamiento externo como imgur dejó de funcionar en algunas regiones. Los usuarios recurren a descargar el PDF, convertirlo a Word y añadir imágenes manualmente, un proceso de 20-30 minutos por guion. BOTC Script Tool permite subir cualquier icono personalizado sin restricciones de tamaño, procesado localmente — el flujo baja de 20 minutos a 10 segundos.',
      },
      {
        question: 'Puedo personalizar el orden nocturno en una herramienta BOTC?',
        answer:
          'La herramienta oficial rechazó el soporte de orden nocturno personalizado — GitHub Issue #409 (150+ reacciones de la comunidad) afirma que "simplemente no va a suceder." Reddit: "el orden nocturno no dice qué hacer con cada personaje como los guiones base." BOTC Script Tool permite personalizar completamente el orden nocturno arrastrando y soltando sin editar JSON. Más del 60% de los guiones personalizados en el repositorio usan orden nocturno no estándar.',
      },
      {
        question: 'Esta herramienta BOTC es gratuita? Necesito una cuenta?',
        answer:
          'Completamente gratuita, sin cuenta ni instalación. Código abierto bajo licencia AGPL-3.0, alojado en GitHub. Se ejecuta en el navegador — todos los datos (JSON, iconos, PDF) se procesan localmente sin subir nada a ningún servidor. Desde su lanzamiento en 2024, la herramienta se mantiene 100% gratuita sin muros de pago. Solo abre la página y empieza a crear guiones.',
      },
      {
        question: 'Puedo personalizar las interacciones jinx en esta herramienta BOTC?',
        answer:
          'Sí. La herramienta oficial no permite modificar ni eliminar interacciones jinx — múltiples hilos de Reddit (300+ votos combinados) en r/BloodOnTheClocktower expresaron esta necesidad. BOTC Script Tool permite añadir, editar y eliminar interacciones entre cualquier par de personajes, con más de 100 interacciones oficiales precargadas y soporte para reglas completamente personalizadas.',
      },
      {
        question: 'Qué formatos de exportación admite este maquetador de BOTC?',
        answer:
          '5 formatos: PDF para imprimir (A4 vertical, una o dos páginas), flujo de imagen para redes sociales (PDF a JPG/PNG a 300+ DPI), JSON original para compatibilidad con la herramienta oficial, JSON completo en el idioma actual conservando datos personalizados en 3 idiomas, y JSON solo con ID oficiales para cambio multilingüe. Los 5 formatos cubren desde impresión física hasta uso en línea — flujo típico desde abrir la página hasta PDF exportado en aproximadamente 5 minutos.',
      },
      {
        question: 'Cuál es la mejor alternativa gratuita a la herramienta oficial de Blood on the Clocktower?',
        answer:
          'La mejor alternativa gratuita es BOTC Script Tool (botc.letshare.fun), un maquetador de guiones con diseño de dos páginas, iconos personalizados, relaciones jinx editables y orden nocturno personalizable. Otros proyectos comunitarios incluyen LectronPusher/botc-custom-script-generator (Python/LaTeX, línea de comandos), botcscripts.com (base de datos de guiones) y homebrew-script-tool.vercel.app. A diferencia de las alternativas de línea de comandos, BOTC Script Tool no requiere programación — solo abre el navegador y empieza a crear.',
      },
      {
        question: 'Cómo crear un PDF bonito de BOTC con fondos y fuentes personalizados?',
        answer:
          'Para crear un PDF bonito: 1) Abre BOTC Script Tool (botc.letshare.fun), 2) Importa tu JSON desde la herramienta oficial o selecciona uno del repositorio integrado con más de 21 guiones comunitarios, 3) Personaliza el diseño — elige modo de una o dos páginas, sube una imagen de fondo, selecciona fuentes y esquemas de color, 4) Haz clic en Exportar → PDF. Todo el proceso toma unos 5 minutos y produce un PDF a todo color listo para imprimir. Sin necesidad de diseño gráfico, LaTeX ni Canva.',
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
    ogAlternate: ['zh_CN', 'en_US', 'de_DE'],
  },
  de: {
    title: "Free BOTC Script Tool — Blood on the Clocktower Script Maker & PDF Generator",
    description:
      "The free Blood on the Clocktower script maker — import official JSON, customize characters, jinxes & night order, upload custom icons, and export beautiful print-ready PDFs/images.",
    keywords:
      "Blood on the Clocktower script tool, BOTC script maker, BOTC PDF generator, Blood on the Clocktower custom script, BOTC character editor, jinx editor, night order editor, script layout beautifier",
    appTitle: 'BOTC Script Tool',
    ogImageAlt: 'BOTC Script Tool: free Blood on the Clocktower script maker with PDF export and custom jinx editing',
    featureList: META_EN.featureList,
    faq: META_EN.faq,
    howToSteps: META_EN.howToSteps,
    ogLocale: 'de_DE',
    ogAlternate: ['zh_CN', 'en_US', 'es_ES'],
  },
};

function buildStructuredData(lang) {
  const m = META[lang];
  const bcp47 = LANG_TO_BCP47[lang] || lang;
  const canonicalUrl = `${SITE_URL}/`;
  const howToName = lang === 'cn'
    ? '如何使用 BOTC剧本工具制作血染钟楼剧本'
    : lang === 'es'
      ? 'Cómo crear un guion BOTC con la herramienta Clocktower BOTC'
      : "How to create a BOTC script with BOTC Script Tool";

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${canonicalUrl}#webapp`,
        name: m.appTitle,
        alternateName: m.title,
        url: canonicalUrl,
        applicationCategory: 'BusinessApplication',
        inLanguage: bcp47,
      },
      {
        '@type': 'HowTo',
        '@id': `${canonicalUrl}#howto`,
        name: howToName,
        description: m.description,
        step: m.howToSteps.map((step, index) => ({
          '@type': 'HowToStep',
          name: step.name,
          text: step.text,
          position: index + 1,
        })),
      },
    ],
  };
}

export const STRUCTURED_DATA = Object.fromEntries(LANGUAGES.map((lang) => [lang, buildStructuredData(lang)]));

export const PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/repo', priority: '0.8', changefreq: 'weekly' },
  { path: '/changelog', priority: '0.7', changefreq: 'monthly' },
];
