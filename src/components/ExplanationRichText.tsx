import { createElement, type CSSProperties, type ReactNode } from 'react';
import { Box } from '@mui/material';
import { observer } from 'mobx-react-lite';
import type { RichTextDocument, RichTextNode } from '../types';
import { uiConfigStore } from '../stores/UIConfigStore';
import { normalizeExplanationDocument } from '../utils/explanationRichText';

const renderNode = (node: RichTextNode, key: string, first = false): ReactNode => {
  if (node.type === 'text') return first ? createElement('span', { key, 'data-explanation-first': true }, node.text) : node.text;
  const children = (node.children || []).map((child, index) => renderNode(child, `${key}-${index}`));
  return createElement(node.tag, { key, style: node.style as CSSProperties | undefined, 'data-explanation-first': first || undefined }, ...children);
};

const ExplanationRichText = observer(({ document: value, reserveActions = false }: { document: RichTextDocument; reserveActions?: boolean }) => {
  const safe = normalizeExplanationDocument(value);
  return <Box className="explanation-rich-text" sx={{
    fontFamily: uiConfigStore.stateRuleContentFont,
    fontSize: uiConfigStore.specialRuleContentFontSize,
    color: '#302b25', lineHeight: 1.4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
    '& p, & div': { m: 0, '&:not(:last-child)': { mb: 0.5 } },
    '& h2, & h3, & h4': { m: 0, fontFamily: uiConfigStore.stateRuleTitleFont,
      fontSize: uiConfigStore.specialRuleTitleFontSize, lineHeight: 1.2, fontWeight: 700 },
    '& h2:not(:first-of-type), & h3:not(:first-of-type), & h4:not(:first-of-type)': { mt: 0.75 },
    '& ul, & ol': { my: 0.5, pl: 2.5 },
    '& > [data-explanation-first]': reserveActions ? { pr: '68px', '@media print': { pr: 0 } } : {},
  }}>
    {safe?.nodes.map((node, index) => renderNode(node, String(index), index === 0))}
  </Box>;
});

export default ExplanationRichText;
