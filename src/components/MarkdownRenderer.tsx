import { useMemo } from 'react';
import Box from '@mui/material/Box';
import { configStore } from '../stores/ConfigStore';
import { highlightAbilityText } from '../utils/scriptGenerator';
import { sanitizeRichTextHtml } from '../utils/richTextSanitizer';
import { renderAbilityMarkdown } from '../utils/richTextConvert';
import { markdownRichTextSx } from '../utils/richTextStyles';
import { observer } from 'mobx-react-lite';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default observer(function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const language = configStore.language;
  const html = useMemo(() => {
    if (!content) return '';
    const rendered = renderAbilityMarkdown(content);
    return sanitizeRichTextHtml(highlightAbilityText(rendered, language));
  }, [content, language]);

  if (!content) return null;

  return (
    <Box
      component="span"
      className={className}
      sx={markdownRichTextSx}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
