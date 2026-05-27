import { useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import { configStore } from '../stores/ConfigStore';
import { highlightAbilityText } from '../utils/scriptGenerator';
import { observer } from 'mobx-react-lite';

const md = new MarkdownIt('zero', { breaks: true, html: true });
md.enable(['emphasis', 'strikethrough', 'list', 'heading', 'newline', 'escape', 'backticks']);

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default observer(function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const language = configStore.language;
  const html = useMemo(() => {
    if (!content) return '';
    const rendered = md.render(content);
    return highlightAbilityText(rendered, language);
  }, [content, language]);

  if (!content) return null;

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
