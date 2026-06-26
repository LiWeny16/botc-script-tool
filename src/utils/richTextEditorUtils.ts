export interface WrappingMatch {
  wrapperStart: number;
  wrapperEnd: number;
  prefix: string;
  suffix: string;
}

export function findWrapping(
  value: string,
  selStart: number,
  selEnd: number,
  prefixes: string[],
  suffixes: string[],
): WrappingMatch | null {
  const before = value.substring(0, selStart);
  const after = value.substring(selEnd);
  const selected = value.substring(selStart, selEnd);

  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i];
    const suffix = suffixes[i];

    if (before.endsWith(prefix) && after.startsWith(suffix)) {
      return { wrapperStart: selStart - prefix.length, wrapperEnd: selEnd + suffix.length, prefix, suffix };
    }

    if (selStart === selEnd) {
      const prefixPos = before.lastIndexOf(prefix);
      if (prefixPos === -1) continue;
      const between = before.substring(prefixPos + prefix.length);
      if (between.includes(suffix)) continue;
      const suffixPos = after.indexOf(suffix);
      if (suffixPos === -1) continue;
      const afterBetween = after.substring(0, suffixPos);
      if (afterBetween.includes(prefix)) continue;
      return { wrapperStart: prefixPos, wrapperEnd: selEnd + suffixPos + suffix.length, prefix, suffix };
    }

    if (selected.startsWith(prefix) && selected.endsWith(suffix) && selected.length >= prefix.length + suffix.length) {
      return { wrapperStart: selStart, wrapperEnd: selEnd, prefix, suffix };
    }
  }
  return null;
}

const COLOR_SPAN_OPEN =
  /<span\s+style="color:\s*(#[0-9a-fA-F]{3,8}|rgb\([^"]+\)|rgba\([^"]+\))"\s*>/gi;

export function findColorSpanWrapping(value: string, selStart: number, selEnd: number): WrappingMatch | null {
  const before = value.substring(0, selStart);
  let lastOpen: { index: number; match: string } | null = null;
  let match: RegExpExecArray | null;
  COLOR_SPAN_OPEN.lastIndex = 0;
  while ((match = COLOR_SPAN_OPEN.exec(before)) !== null) {
    lastOpen = { index: match.index, match: match[0] };
  }
  if (!lastOpen) return null;

  const after = value.substring(selEnd);
  const closeIdx = after.indexOf('</span>');
  if (closeIdx === -1) return null;

  const suffix = '</span>';
  return {
    wrapperStart: lastOpen.index,
    wrapperEnd: selEnd + closeIdx + suffix.length,
    prefix: lastOpen.match,
    suffix,
  };
}

export function execUndoableReplace(
  el: HTMLTextAreaElement,
  currentValue: string,
  replaceStart: number,
  replaceEnd: number,
  replacement: string,
  afterCursor: [number, number],
  onChange: (v: string) => void,
) {
  el.focus();
  el.setSelectionRange(replaceStart, replaceEnd);

  let succeeded = false;
  try {
    succeeded = document.execCommand('insertText', false, replacement);
  } catch {
    // execCommand may throw in some sandboxed environments
  }

  if (!succeeded) {
    const newValue =
      currentValue.substring(0, replaceStart) + replacement + currentValue.substring(replaceEnd);
    onChange(newValue);
  }

  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(afterCursor[0], afterCursor[1]);
  });
}

export function stripHtmlTags(text: string): string {
  return text.replace(/<\/?[^>\n]+>/g, '');
}

/**
 * Recursively strip HTML tags from all string values in a JSON-serializable structure.
 * Arrays and objects are traversed; strings are cleaned; all other primitives pass through.
 */
export function deepStripHtml<T>(value: T): T {
  if (typeof value === 'string') {
    return stripHtmlTags(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(deepStripHtml) as unknown as T;
  }
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as object)) {
      result[key] = deepStripHtml((value as Record<string, unknown>)[key]);
    }
    return result as unknown as T;
  }
  return value;
}
