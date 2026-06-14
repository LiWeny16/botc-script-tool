/** Focus contentEditable and run a document command, returning whether it succeeded. */
export function execEditorCommand(command: string, value?: string): boolean {
  try {
    if (command === 'foreColor' || command === 'hiliteColor') {
      document.execCommand('styleWithCSS', false, 'true');
    }
    return document.execCommand(command, false, value);
  } catch {
    return false;
  }
}

// ── Span helpers ──────────────────────────────────────────────────────

/**
 * Walk up from `node` within `editor` to find an ancestor <span> that has a
 * non‑empty value for `styleProp`. Returns null when no such span exists.
 */
function findStyleAncestor(node: Node, editor: HTMLElement, styleProp: string): HTMLSpanElement | null {
  let cur: Node | null = node;
  while (cur && cur !== editor) {
    if (cur.nodeType === Node.ELEMENT_NODE) {
      const el = cur as HTMLElement;
      if (el.tagName === 'SPAN' && el.style.getPropertyValue(styleProp)) {
        return el;
      }
    }
    cur = cur.parentNode;
  }
  return null;
}

/** Remove `styleProp` from an element. If no other style remains, unwrap the element. */
function removeStyleOrUnwrap(el: HTMLElement, styleProp: string): void {
  el.style.removeProperty(styleProp);

  // Also clear the attribute if the style object is now empty
  const remaining = el.getAttribute('style')?.trim();
  if (!remaining || remaining === '') {
    el.removeAttribute('style');
  }

  // Unwrap when the span carries no styles and has no other attributes of interest
  if (!el.getAttribute('style') && el.attributes.length === 0) {
    const parent = el.parentNode;
    if (parent) {
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Apply or update a font-size span on the current selection.
 *
 * - Collapsed (no selection): if the cursor sits inside an existing font-size
 *   span, update that span. Otherwise insert a zero‑width placeholder span
 *   so the user can start typing with the chosen size.
 * - Range selection: unwrap any ancestor font‑size span first so we never
 *   produce nested `<span style="font-size:...">` chains, then wrap in a
 *   fresh span.
 */
export function applyFontSizeSpan(editor: HTMLElement, fontSize: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  // ── Collapsed cursor ───────────────────────────────────────────
  if (range.collapsed) {
    const existing = findStyleAncestor(range.commonAncestorContainer, editor, 'font-size');
    if (existing) {
      existing.style.setProperty('font-size', fontSize);
      return;
    }

    const span = document.createElement('span');
    span.style.setProperty('font-size', fontSize);
    span.appendChild(document.createTextNode('​')); // zero‑width placeholder
    range.insertNode(span);
    range.setStart(span.firstChild!, 1);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    return;
  }

  // ── Non‑collapsed selection ────────────────────────────────────
  // Unwrap any ancestor font‑size span from the selection first
  const ancestor = findStyleAncestor(range.commonAncestorContainer, editor, 'font-size');
  if (ancestor) {
    removeStyleOrUnwrap(ancestor, 'font-size');
    // Re‑fetch the range after DOM mutation
    const newSel = window.getSelection();
    if (!newSel || newSel.rangeCount === 0) return;
    const newRange = newSel.getRangeAt(0);
    if (!editor.contains(newRange.commonAncestorContainer)) return;
    return wrapSelectionInSpan(editor, 'font-size', fontSize, newRange);
  }

  wrapSelectionInSpan(editor, 'font-size', fontSize, range);
}

/**
 * Apply or update a color span on the current selection.
 * Same logic as applyFontSizeSpan.
 */
export function applyColorSpan(editor: HTMLElement, color: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  if (range.collapsed) {
    const existing = findStyleAncestor(range.commonAncestorContainer, editor, 'color');
    if (existing) {
      existing.style.setProperty('color', color);
      return;
    }

    const span = document.createElement('span');
    span.style.setProperty('color', color);
    span.appendChild(document.createTextNode('​'));
    range.insertNode(span);
    range.setStart(span.firstChild!, 1);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    return;
  }

  const ancestor = findStyleAncestor(range.commonAncestorContainer, editor, 'color');
  if (ancestor) {
    removeStyleOrUnwrap(ancestor, 'color');
    const newSel = window.getSelection();
    if (!newSel || newSel.rangeCount === 0) return;
    const newRange = newSel.getRangeAt(0);
    if (!editor.contains(newRange.commonAncestorContainer)) return;
    return wrapSelectionInSpan(editor, 'color', color, newRange);
  }

  wrapSelectionInSpan(editor, 'color', color, range);
}

/**
 * Remove font‑size styling from the current selection / ancestor span.
 */
export function removeFontSizeSpan(editor: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  const span = findStyleAncestor(range.commonAncestorContainer, editor, 'font-size');
  if (!span) return;

  removeStyleOrUnwrap(span, 'font-size');
}

/**
 * Remove color styling from the current selection / ancestor span.
 */
export function removeColorSpan(editor: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  const span = findStyleAncestor(range.commonAncestorContainer, editor, 'color');
  if (!span) return;

  removeStyleOrUnwrap(span, 'color');
}

// ── Internal ──────────────────────────────────────────────────────────

function wrapSelectionInSpan(
  _editor: HTMLElement,
  styleProp: string,
  styleValue: string,
  range: Range,
): void {
  const span = document.createElement('span');
  span.style.setProperty(styleProp, styleValue);

  const fragment = range.extractContents();
  span.appendChild(fragment);
  range.insertNode(span);

  // Reselect the span contents
  range.selectNodeContents(span);
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
