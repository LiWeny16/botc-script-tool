import { a4PageRoots } from './a4Layout';

/** Freeze the displayed read-only page without rerendering or exporting it. */
export function snapshotA4Page(source: Document, index: number): string | null {
  const page = a4PageRoots(source)[index];
  if (!page) return null;
  const copy = document.implementation.createHTMLDocument('A4');
  const base = copy.createElement('base'); base.href = source.baseURI; copy.head.appendChild(base);
  for (const sheet of Array.from(source.styleSheets)) {
    try {
      const style = copy.createElement('style');
      style.textContent = Array.from(sheet.cssRules, rule => rule.cssText).join('\n');
      copy.head.appendChild(style);
    } catch {
      if (sheet.href) { const link = copy.createElement('link'); link.rel = 'stylesheet'; link.href = sheet.href; copy.head.appendChild(link); }
    }
  }
  const clone = page.cloneNode(true) as HTMLElement;
  clone.dataset.a4GuidePage = 'true';
  clone.querySelectorAll('script, iframe').forEach(node => node.remove());
  clone.querySelectorAll('img').forEach(image => { image.loading = 'eager'; });
  const root = copy.createElement('div'); root.id = 'root'; root.appendChild(clone); copy.body.appendChild(root);
  return `<!doctype html>${copy.documentElement.outerHTML}`;
}
