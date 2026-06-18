/** Tags removed entirely (including their text content). */
const DROP_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base',
  'form', 'input', 'textarea', 'button', 'svg', 'math',
]);

/** Allowed rich-text tags for ability descriptions (markdown-it output + toolbar HTML). */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'span', 'div',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4',
]);

const ALLOWED_STYLE_PROPS = new Set([
  'color',
  'font-size',
  'font-weight',
  'font-style',
  'text-decoration',
]);

const SAFE_COLOR =
  /^(#[0-9a-fA-F]{3,8}|rgb\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*\)|rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*\))$/;

const SAFE_FONT_WEIGHT = /^(normal|bold|bolder|lighter|[1-9]00)$/;
const SAFE_FONT_STYLE = /^(normal|italic|oblique)$/;
const SAFE_FONT_SIZE = /^(\d{1,2})px$/;
const SAFE_TEXT_DECORATION = /^(none|underline|line-through|overline)(\s+(none|underline|line-through|overline))*$/;

const MIN_FONT_SIZE_PX = 10;
const MAX_FONT_SIZE_PX = 36;

/** Normalize and validate a CSS color value for inline styles. */
export function normalizeColor(color: string): string | null {
  const trimmed = color.trim();
  if (SAFE_COLOR.test(trimmed)) return trimmed;
  return null;
}

/** Normalize and validate font-size in px (10–36). */
export function normalizeFontSize(size: string): string | null {
  const trimmed = size.trim().toLowerCase();
  const match = trimmed.match(SAFE_FONT_SIZE);
  if (!match) return null;
  const px = Number(match[1]);
  if (px < MIN_FONT_SIZE_PX || px > MAX_FONT_SIZE_PX) return null;
  return `${px}px`;
}

function sanitizeStyleValue(prop: string, value: string): string | null {
  const normalized = value.trim().toLowerCase();
  switch (prop) {
    case 'color':
      return normalizeColor(normalized) ?? normalizeColor(value.trim());
    case 'font-size':
      return normalizeFontSize(normalized) ?? normalizeFontSize(value.trim());
    case 'font-weight':
      return SAFE_FONT_WEIGHT.test(normalized) ? normalized : null;
    case 'font-style':
      return SAFE_FONT_STYLE.test(normalized) ? normalized : null;
    case 'text-decoration':
      return SAFE_TEXT_DECORATION.test(normalized) ? normalized : null;
    default:
      return null;
  }
}

function sanitizeStyleAttribute(style: string): string {
  const safe: string[] = [];
  for (const chunk of style.split(';')) {
    const decl = chunk.trim();
    if (!decl) continue;
    const colon = decl.indexOf(':');
    if (colon === -1) continue;
    const prop = decl.slice(0, colon).trim().toLowerCase();
    const value = decl.slice(colon + 1).trim();
    if (!ALLOWED_STYLE_PROPS.has(prop)) continue;
    const safeValue = sanitizeStyleValue(prop, value);
    if (safeValue) safe.push(`${prop}: ${safeValue}`);
  }
  return safe.join('; ');
}

function sanitizeElement(el: Element): void {
  const tag = el.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    if (DROP_TAGS.has(tag)) {
      el.remove();
      return;
    }
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
    return;
  }

  for (const attr of [...el.attributes]) {
    const name = attr.name.toLowerCase();
    if (name === 'style') {
      const cleaned = sanitizeStyleAttribute(attr.value);
      if (cleaned) el.setAttribute('style', cleaned);
      else el.removeAttribute('style');
      continue;
    }
    el.removeAttribute(attr.name);
  }

  for (const child of [...el.children]) sanitizeElement(child);
}

/** Sanitize rendered HTML before injecting via dangerouslySetInnerHTML. */
export function sanitizeRichTextHtml(html: string): string {
  if (!html) return '';
  if (typeof DOMParser === 'undefined') return html;

  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const child of [...doc.body.childNodes]) {
    if (child.nodeType === Node.ELEMENT_NODE) sanitizeElement(child as Element);
  }
  return doc.body.innerHTML;
}

/** Strip dangerous markup from raw ability source on edit/paste. Keeps plain text + allowed tags. */
export function sanitizeAbilitySource(content: string): string {
  if (!content) return '';
  if (typeof DOMParser === 'undefined') return content;

  const doc = new DOMParser().parseFromString(content, 'text/html');
  for (const child of [...doc.body.childNodes]) {
    if (child.nodeType === Node.ELEMENT_NODE) sanitizeElement(child as Element);
  }
  return doc.body.innerHTML;
}

/** Build a safe inline color span wrapper used by the editor toolbar. */
export function buildColorSpan(color: string, inner = ''): string | null {
  const safeColor = normalizeColor(color);
  if (!safeColor) return null;
  return `<span style="color: ${safeColor}">${inner}</span>`;
}
