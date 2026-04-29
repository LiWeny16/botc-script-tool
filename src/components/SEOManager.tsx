import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../utils/i18n';
import { SITE_URL, LANGUAGES, DEFAULT_LANGUAGE, STRUCTURED_DATA } from '../utils/seoData';

export const SEOManager = observer(() => {
  const { t, language } = useTranslation();

  useEffect(() => {
    // 更新页面标题
    document.title = t('seo.title');

    // 更新HTML lang属性
    document.documentElement.lang = language;

    // 更新meta描述
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', t('seo.description'));
    }

    // 更新meta关键词
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
      keywordsMeta.setAttribute('content', t('seo.keywords'));
    }

    // 更新Open Graph标签
    const ogTitleMeta = document.querySelector('meta[property="og:title"]');
    if (ogTitleMeta) {
      ogTitleMeta.setAttribute('content', t('seo.title'));
    }

    const ogDescriptionMeta = document.querySelector('meta[property="og:description"]');
    if (ogDescriptionMeta) {
      ogDescriptionMeta.setAttribute('content', t('seo.description'));
    }

    // 更新Twitter标签
    const twitterTitleMeta = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitleMeta) {
      twitterTitleMeta.setAttribute('content', t('seo.title'));
    }

    const twitterDescriptionMeta = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescriptionMeta) {
      twitterDescriptionMeta.setAttribute('content', t('seo.description'));
    }

    // 更新 Hreflang 链接
    updateHreflangLinks(language);

    // 更新 Canonical URL
    updateCanonical(language);

    // 更新 JSON-LD 结构化数据
    updateJsonLd(language);

  }, [t, language]);

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
