import type { FooterComponent, I18nText, RichTextDocument, RichTextNode, RichTextStyle, RichTextTag, Script, SpecialRule } from '../types';
import type { Language } from './languages';
import { normalizeColor } from './richTextSanitizer';
import { OFFICIAL_STATE_COPY } from './officialStateCopy';

const TAGS = new Set<RichTextTag>(['p', 'div', 'span', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'br', 'h2', 'h3', 'h4']);
const DROP = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'form', 'input', 'textarea', 'button', 'img']);
const FONT_SIZE = /^(\d+(?:\.\d+)?)px$/;
const FONT_FAMILY = /^[\w\s\-,'"\u00a0-\uffff]{1,200}$/;
const ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

function cleanStyle(value: unknown): RichTextStyle | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const input = value as Record<string, unknown>;
  const result: RichTextStyle = {};
  for (const key of ['color', 'backgroundColor'] as const) {
    const color = typeof input[key] === 'string' ? normalizeColor(input[key]) : null;
    if (color) result[key] = color;
  }
  if (typeof input.fontFamily === 'string' && FONT_FAMILY.test(input.fontFamily) && !/url|expression/i.test(input.fontFamily)) result.fontFamily = input.fontFamily;
  if (typeof input.fontSize === 'string') {
    const size = input.fontSize.match(FONT_SIZE);
    if (size && Number(size[1]) >= 8 && Number(size[1]) <= 96) result.fontSize = `${Number(size[1])}px`;
  }
  if (typeof input.fontWeight === 'string' && /^(normal|bold|[1-9]00)$/.test(input.fontWeight)) result.fontWeight = input.fontWeight;
  if (typeof input.fontStyle === 'string' && /^(normal|italic|oblique)$/.test(input.fontStyle)) result.fontStyle = input.fontStyle;
  if (typeof input.textDecoration === 'string' && /^(none|underline|line-through)(\s+(underline|line-through))*$/.test(input.textDecoration)) result.textDecoration = input.textDecoration;
  if (typeof input.textAlign === 'string' && ALIGNMENTS.has(input.textAlign)) result.textAlign = input.textAlign as RichTextStyle['textAlign'];
  return Object.keys(result).length ? result : undefined;
}

/** Validate imported documents without interpreting text as HTML. */
export function normalizeExplanationDocument(value: unknown): RichTextDocument | null {
  if (!value || typeof value !== 'object') return null;
  const doc = value as Record<string, unknown>;
  if (doc.kind !== 'botc-rich-text' || doc.version !== 1 || !Array.isArray(doc.nodes)) return null;
  let count = 0;
  const normalizeNode = (entry: unknown, depth: number): RichTextNode | null => {
    if (!entry || typeof entry !== 'object' || depth > 24 || ++count > 10000) return null;
    const node = entry as Record<string, unknown>;
    const sourcePage = node.sourcePage === 1 || node.sourcePage === 2 ? node.sourcePage : undefined;
    if (node.type === 'text' && typeof node.text === 'string') return { type: 'text', text: node.text.slice(0, 100000), ...(sourcePage ? { sourcePage } : {}) };
    if (node.type !== 'element' || typeof node.tag !== 'string' || !TAGS.has(node.tag as RichTextTag)) return null;
    const children = Array.isArray(node.children)
      ? node.children.map(child => normalizeNode(child, depth + 1)).filter((child): child is RichTextNode => Boolean(child)) : [];
    const style = cleanStyle(node.style);
    return { type: 'element', tag: node.tag as RichTextTag, ...(style ? { style } : {}), ...(children.length ? { children } : {}), ...(sourcePage ? { sourcePage } : {}) };
  };
  return { kind: 'botc-rich-text', version: 1, nodes: doc.nodes.map(node => normalizeNode(node, 0)).filter((node): node is RichTextNode => Boolean(node)) };
}

const text = (value: string): RichTextNode => ({ type: 'text', text: value });
const element = (tag: RichTextTag, children: RichTextNode[], style?: RichTextStyle): RichTextNode => ({
  type: 'element', tag, ...(style ? { style } : {}), ...(children.length ? { children } : {}),
});
const localized = (value: string | I18nText | undefined, language: Language) =>
  typeof value === 'string' ? value : value?.[language] || value?.en || value?.cn || '';
const legacyText = (value: string) => value.replace(/\\n|<br\s*\/?>/gi, '\n').replace(/<\/?[^>\n]+>/g, '');

/** Keep legacy entries as sources; the composed document does not mutate them. */
export function buildExplanationDocument(rules: SpecialRule[], lists: FooterComponent[], language: Language): RichTextDocument {
  const nodes: RichTextNode[] = [];
  for (const rule of rules) {
    const title = legacyText(localized(rule.title, language));
    const content = legacyText(localized(rule.content, language));
    if (title) nodes.push(element('h3', [text(title)], { color: /madness|疯狂|locura|wahnsinn/i.test(title) ? '#715277' : '#7e2927' }));
    if (content) nodes.push(element('p', [text(content)]));
    for (const item of rule.rules || []) {
      const label = legacyText(localized(item.title, language));
      const body = legacyText(localized(item.content, language));
      if (label || body) nodes.push(element('p', [text([label, body].filter(Boolean).join(': '))]));
    }
  }
  for (const list of lists) {
    if (list.title) nodes.push(element('h3', [text(legacyText(list.title))]));
    if (list.text) nodes.push(element('p', [text(legacyText(list.text))]));
    const rows = (list.rows || []).filter(row => row.text).map(row => element('li', [text(legacyText(row.text))]));
    if (rows.length) nodes.push(element('ul', rows));
  }
  return { kind: 'botc-rich-text', version: 1, nodes };
}

export function resolveExplanationDocument(layout: FooterComponent | undefined, rules: SpecialRule[], lists: FooterComponent[], language: Language): RichTextDocument | null {
  if (layout?.hidden) return null;
  const saved = normalizeExplanationDocument(layout?.richTextDocuments?.[language]);
  if (saved) return saved;
  if (layout?.defaultContent) return defaultExplanationDocuments()[language];
  if (rules.length || lists.length) return buildExplanationDocument(rules, lists, language);
  for (const other of Object.values(layout?.richTextDocuments || {})) {
    const fallback = normalizeExplanationDocument(other);
    if (fallback) return fallback;
  }
  return null;
}

/** Single-page mode displays one editor while preserving each paragraph's page for two-page mode. */
export function explanationForPage(script: Script, page: 1 | 2, language: Language, twoPages: boolean): RichTextDocument | null {
  const components = script.footerComponents || [];
  const layout = (number: 1 | 2) => components.find(item => item.type === 'stateLayout' && item.page === number);
  const resolve = (number: 1 | 2) => resolveExplanationDocument(layout(number),
    (script.secondPageRules || []).filter(rule => rule.isState && (rule.footerPage || 2) === number),
    components.filter(item => item.type === 'list' && item.page === number), language);
  if (twoPages) return resolve(page);
  if (page !== 1 || layout(1)?.hidden) return null;
  const first = resolve(1), second = resolve(2);
  if (!first && !second) return null;
  const mark = (doc: RichTextDocument | null, sourcePage: 1 | 2): RichTextNode[] =>
    (doc?.nodes || []).map(node => ({ ...node, sourcePage }));
  return { kind: 'botc-rich-text', version: 1, nodes: [...mark(first, 1), ...mark(second, 2)] };
}

export function splitExplanationDocument(value: RichTextDocument): Record<1 | 2, RichTextDocument> {
  const result: Record<1 | 2, RichTextDocument> = {
    1: { kind: 'botc-rich-text', version: 1, nodes: [] },
    2: { kind: 'botc-rich-text', version: 1, nodes: [] },
  };
  let page: 1 | 2 = 1;
  const findPage = (node: RichTextNode): 1 | 2 | undefined => node.sourcePage
    || (node.type === 'element' ? node.children?.map(findPage).find(Boolean) : undefined);
  for (const node of normalizeExplanationDocument(value)?.nodes || []) {
    page = findPage(node) || page;
    const { sourcePage: _sourcePage, ...rest } = node;
    result[page].nodes.push(rest as RichTextNode);
  }
  return result;
}

export function defaultExplanationDocuments(): Record<Language, RichTextDocument> {
  const rules: SpecialRule[] = [
    { id: 'default-state', title: OFFICIAL_STATE_COPY.poisonedDrunk.title, content: OFFICIAL_STATE_COPY.poisonedDrunk.content },
    { id: 'default-madness', title: OFFICIAL_STATE_COPY.madness.title, content: OFFICIAL_STATE_COPY.madness.content },
  ];
  return Object.fromEntries((['cn', 'en', 'es', 'de'] as const).map(language => [language, buildExplanationDocument(rules, [], language)])) as Record<Language, RichTextDocument>;
}

/** Convert editor or clipboard HTML to a safe structured document. */
export function explanationDocumentFromHtml(html: string): RichTextDocument {
  if (typeof DOMParser === 'undefined') return { kind: 'botc-rich-text', version: 1, nodes: [element('p', [text(html.replace(/<[^>]*>/g, ''))])] };
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const convert = (node: Node): RichTextNode[] => {
    if (node.nodeType === Node.TEXT_NODE) return [text(node.textContent || '')];
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const el = node as HTMLElement;
    const raw = el.tagName.toLowerCase();
    if (DROP.has(raw)) return [];
    const mapped = ({ b: 'strong', i: 'em', strike: 's', del: 's', font: 'span', h1: 'h2' } as Record<string, string>)[raw] || raw;
    const children = [...el.childNodes].flatMap(convert);
    if (!TAGS.has(mapped as RichTextTag)) return children;
    const legacySizes: Record<string, string> = { '1': '10px', '2': '12px', '3': '14px', '4': '16px', '5': '18px', '6': '24px', '7': '36px' };
    const style = cleanStyle({
      color: el.style.color || el.getAttribute('color'), backgroundColor: el.style.backgroundColor,
      fontFamily: el.style.fontFamily || el.getAttribute('face'), fontSize: el.style.fontSize || legacySizes[el.getAttribute('size') || ''],
      fontWeight: el.style.fontWeight, fontStyle: el.style.fontStyle, textDecoration: el.style.textDecorationLine || el.style.textDecoration,
      textAlign: el.style.textAlign || el.getAttribute('align'),
    });
    const source = el.getAttribute('data-explanation-page');
    const result = element(mapped as RichTextTag, children, style);
    return [source === '1' || source === '2' ? { ...result, sourcePage: Number(source) as 1 | 2 } : result];
  };
  return normalizeExplanationDocument({ kind: 'botc-rich-text', version: 1, nodes: [...parsed.body.childNodes].flatMap(convert) })!;
}

/** Construct editor markup with DOM APIs so imported text and styles cannot inject markup. */
export function explanationDocumentToHtml(value: RichTextDocument): string {
  if (typeof document === 'undefined') return '';
  const root = document.createElement('div');
  const append = (parent: HTMLElement, node: RichTextNode) => {
    if (node.type === 'text') {
      if (node.sourcePage) { const span = document.createElement('span'); span.dataset.explanationPage = String(node.sourcePage); span.textContent = node.text; parent.append(span); }
      else parent.append(document.createTextNode(node.text));
      return;
    }
    const child = document.createElement(node.tag);
    if (node.sourcePage) child.dataset.explanationPage = String(node.sourcePage);
    if (node.style) Object.assign(child.style, node.style);
    (node.children || []).forEach(item => append(child, item));
    parent.append(child);
  };
  (normalizeExplanationDocument(value)?.nodes || []).forEach(node => append(root, node));
  return root.innerHTML;
}
