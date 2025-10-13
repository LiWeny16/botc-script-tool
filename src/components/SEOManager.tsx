import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../utils/i18n';

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
    
  }, [t, language]);

  return null; // 这是一个工具组件，不渲染任何内容
});
