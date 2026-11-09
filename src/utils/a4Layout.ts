// The 54% reference is the browser's print scale on 96 CSS pixels per inch.
export const DEFAULT_A4_SCALE = 54;
export const MIN_A4_SCALE = 25;
export const MAX_A4_SCALE = 85;
export const A4_OUTPUT_WIDTH = 2480;
export const A4_OUTPUT_HEIGHT = 3508;

export const A4_LIVE_FRAME_CSS = `
  html, body { margin: 0 !important; overflow: hidden !important; }
  [data-a4-guide-page] { width: 100vw !important; min-width: 100vw !important; min-height: 100vh !important;
    height: auto !important; margin: 0 !important; box-shadow: none !important; overflow: visible !important; }
  [data-a4-guide-page] > div { min-height: 100vh !important; height: auto !important; }
  [data-a4-guide-page] [data-header-layout-item="author"]:not(:has(img)):not([data-header-layout-target*="WithRules"]) { display: none !important; }
`;

export interface A4Viewport { width: number; height: number }

export function normalizeA4Scale(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(MIN_A4_SCALE, Math.min(MAX_A4_SCALE, Math.round(value)))
    : DEFAULT_A4_SCALE;
}

export function a4Viewport(scale: number): A4Viewport {
  const width = Math.round((210 / 25.4 * 96) / (normalizeA4Scale(scale) / 100));
  return { width, height: width * A4_OUTPUT_HEIGHT / A4_OUTPUT_WIDTH };
}

export function a4PageRoots(doc: Document): HTMLElement[] {
  return ['script-preview', 'script-preview-2', 'script-preview-3', 'script-preview-4']
    .map(id => doc.getElementById(id)).filter((node): node is HTMLElement => !!node)
    .filter(node => !node.parentElement?.closest('[id^="script-preview"]'));
}

export function a4PageFits(page: HTMLElement, viewport: A4Viewport): boolean {
  const bounds = page.getBoundingClientRect();
  return Math.max(bounds.height, page.scrollHeight) <= viewport.height + 1
    && Math.max(bounds.width, page.scrollWidth) <= viewport.width + 1;
}

// The empty avatar upload target belongs to the editor, not the output page.
export function hideEmptyAuthorPlaceholder(page: HTMLElement): void {
  const author = page.querySelector<HTMLElement>('[data-header-layout-item="author"]');
  if (author && !author.querySelector('img') && !author.dataset.headerLayoutTarget?.includes('WithRules')) author.style.display = 'none';
}
