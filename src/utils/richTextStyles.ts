export const markdownRichTextSx = {
  '& em, & i': { fontStyle: 'italic', fontSynthesis: 'style' },
  '& strong, & b': { fontWeight: 700, fontSynthesis: 'weight' },
  '& em strong, & strong em, & i b, & b i, & i strong, & strong i, & em b, & b em': {
    fontStyle: 'italic',
    fontWeight: 700,
    fontSynthesis: 'style weight',
  },
  '& del, & s, & strike': { textDecoration: 'line-through', opacity: 0.7 },
  '& u': { textDecoration: 'underline' },
  '& span[style*="color"]': { fontSynthesis: 'style weight' },
  '& span[style*="font-size"]': { lineHeight: 1.4 },
  '& div[style*="color"]': { display: 'inline', fontSynthesis: 'style weight' },
  '& p': { m: 0, '&:not(:last-child)': { mb: 0.5 } },
  '& ul, & ol': { m: 0, pl: 2.5, '&:not(:last-child)': { mb: 0.5 } },
  '& li': { '&:not(:last-child)': { mb: 0.25 } },
} as const;
