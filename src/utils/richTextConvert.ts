import MarkdownIt from 'markdown-it';
import { normalizeColor, normalizeFontSize, sanitizeAbilitySource, sanitizeRichTextHtml } from './richTextSanitizer';

const LEGACY_FONT_SIZE_MAP: Record<string, string> = {
  '1': '10px',
  '2': '12px',
  '3': '14px',
  '4': '16px',
  '5': '18px',
  '6': '24px',
  '7': '36px',
};

const md = new MarkdownIt('zero', { breaks: true, html: true });
md.enable([
  'emphasis',
  'strikethrough',
  'list',
  'heading',
  'newline',
  'escape',
  'backticks',
  'html_inline',
  'html_block',
]);

/** Trim stray spaces inside emphasis markers so loosely written markers still parse. */
export function normalizeEmphasisMarkers(content: string): string {
  let result = content;
  result = result.replace(/(?<!\*)\*{3}(?!\*)\s*([^*\n]+?)\s*\*{3}(?!\*)/g, (_, word) => `***${word.trim()}***`);
  result = result.replace(/(?<!\*)\*{2}(?!\*)\s*([^*\n]+?)\s*\*{2}(?!\*)/g, (_, word) => `**${word.trim()}**`);
  result = result.replace(/(?<![*])\*(?![*])\s*([^*\n]+?)\s*\*(?![*])/g, (_, word) => `*${word.trim()}*`);
  return result;
}

/** Render stored ability source (markdown + HTML) to safe HTML for WYSIWYG display. */
export function abilitySourceToEditorHtml(source: string): string {
  if (!source) return '';
  const rendered = md.render(normalizeEmphasisMarkers(source));
  return sanitizeRichTextHtml(rendered);
}

/** Convert legacy <font> tags produced by execCommand into safe span styles. */
function normalizeLegacyFontTags(html: string): string {
  return html.replace(/<font\b([^>]*)>([\s\S]*?)<\/font>/gi, (_match, attrs: string, inner: string) => {
    const styles: string[] = [];
    const colorMatch = attrs.match(/color="([^"]+)"/i) ?? attrs.match(/color='([^']+)'/i);
    if (colorMatch) {
      const safeColor = normalizeColor(colorMatch[1]);
      if (safeColor) styles.push(`color: ${safeColor}`);
    }
    const sizeMatch = attrs.match(/size="([^"]+)"/i) ?? attrs.match(/size='([^']+)'/i);
    if (sizeMatch) {
      const mapped = LEGACY_FONT_SIZE_MAP[sizeMatch[1]] ?? null;
      const safeSize = mapped ? normalizeFontSize(mapped) : null;
      if (safeSize) styles.push(`font-size: ${safeSize}`);
    }
    if (styles.length === 0) return inner;
    return `<span style="${styles.join('; ')}">${inner}</span>`;
  });
}

/** Serialize contentEditable DOM output back to stored ability source. */
export function serializeEditorHtml(html: string): string {
  if (!html || html === '<br>' || html === '<div><br></div>') return '';

  let normalized = html
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/<div><br><\/div>/gi, '<br>')
    .replace(/<div>/gi, '<p>')
    .replace(/<\/div>/gi, '</p>');

  normalized = normalizeLegacyFontTags(normalized);
  normalized = sanitizeAbilitySource(normalized);

  return normalized
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<p><br><\/p>/gi, '<br>')
    .trim();
}

export function renderAbilityMarkdown(source: string): string {
  if (!source) return '';
  const rendered = md.render(normalizeEmphasisMarkers(source));
  // Strip single-<p> wrapper: plain text doesn't need a paragraph shell
  const trimmed = rendered.trim();
  if (
    trimmed.startsWith('<p>') &&
    trimmed.endsWith('</p>') &&
    !trimmed.slice(3, -4).includes('<p>') &&
    !trimmed.slice(3, -4).includes('<ul>') &&
    !trimmed.slice(3, -4).includes('<ol>')
  ) {
    return trimmed.slice(3, -4);
  }
  return trimmed;
}
