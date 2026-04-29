import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../utils/i18n';
import {
  SITE_URL,
  LANGUAGES,
  DEFAULT_LANGUAGE,
  STRUCTURED_DATA,
  OG_IMAGE,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  META,
} from '../utils/seoConfig';

function setMeta(attr: string, key: string, value: string) {
  const sel = `meta[${attr}="${key}"]`;
  let el = document.querySelector(sel) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

export const SEOManager = observer(() => {
  const { language } = useTranslation();

  useEffect(() => {
    const m = META[language as keyof typeof META] ?? META[DEFAULT_LANGUAGE];

    // 更新页面标题
    document.title = m.title;

    // 更新HTML lang属性
    document.documentElement.lang = language;

    // 更新meta描述
    setMeta('name', 'description', m.description);

    // 更新meta关键词
    setMeta('name', 'keywords', m.keywords);

    // 更新Open Graph标签
    setMeta('property', 'og:title', m.title);
    setMeta('property', 'og:description', m.description);
    setMeta('property', 'og:url', `${SITE_URL}/${language}/`);
    setMeta('property', 'og:image', OG_IMAGE);
    setMeta('property', 'og:image:width', String(OG_IMAGE_WIDTH));
    setMeta('property', 'og:image:height', String(OG_IMAGE_HEIGHT));
    setMeta('property', 'og:image:alt', m.ogImageAlt);

    // 更新Twitter标签
    setMeta('name', 'twitter:title', m.title);
    setMeta('name', 'twitter:description', m.description);
    setMeta('name', 'twitter:image', OG_IMAGE);
    setMeta('name', 'twitter:image:alt', m.ogImageAlt);

    // 更新 Hreflang 链接
    updateHreflangLinks(language);

    // 更新 Canonical URL
    updateCanonical(language);

    // 更新 JSON-LD 结构化数据
    updateJsonLd(language);

  }, [language]);

  return null; // 这是一个工具组件，不渲染任何内容
});

function updateHreflangLinks(currentLang: string) {
  // Remove existing hreflang links
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

  for (const lang of LANGUAGES) {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.setAttribute('hreflang', lang);
    link.href = `${SITE_URL}/${lang}/`;
    document.head.appendChild(link);
  }

  const xDefault = document.createElement('link');
  xDefault.rel = 'alternate';
  xDefault.setAttribute('hreflang', 'x-default');
  xDefault.href = `${SITE_URL}/${DEFAULT_LANGUAGE}/`;
  document.head.appendChild(xDefault);
}

function updateCanonical(lang: string) {
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = `${SITE_URL}/${lang}/`;
}

function updateJsonLd(lang: string) {
  // Remove existing JSON-LD
  const existing = document.querySelector('script[type="application/ld+json"]');
  if (existing) {
    existing.remove();
  }

  const data = STRUCTURED_DATA[lang];
  if (data) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data, null, 2);
    document.head.appendChild(script);
  }
}
