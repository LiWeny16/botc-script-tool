import { getFontEmbedCSS, toSvg } from 'html-to-image';
import { toJS } from 'mobx';
import { IMAGE_PATH_MAP } from './imagePathMap';
import { configStore } from '../stores/ConfigStore';
import { scriptStore } from '../stores/ScriptStore';
import { uiConfigStore } from '../stores/UIConfigStore';
import type { Script } from '../types';
import { a4PageFits, a4PageRoots, a4Viewport, A4_OUTPUT_HEIGHT, A4_OUTPUT_WIDTH, hideEmptyAuthorPlaceholder, type A4Viewport } from './a4Layout';

const OUTPUT_WIDTH = A4_OUTPUT_WIDTH;
const OUTPUT_HEIGHT = A4_OUTPUT_HEIGHT;
const IMAGE_PROXY = 'https://ecs.zingspark.tech/botc-image-proxy';
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

// These canonical OSS files were compared byte-for-byte with the bundled assets.
// Never substitute arbitrary user images just because their filenames match.
const VERIFIED_LOCAL_ICONS = new Set([
  'amnesiac.png', 'barber.png', 'bounty_hunter.png', 'cerenovus.png', 'djinn.png',
  'drunk.png', 'empath.png', 'goblin.png', 'godfather.png', 'gossip.png',
  'lil_monsta.png', 'lunatic.png', 'magician.png', 'marionette.png', 'mutant.png',
  'pixie.png', 'savant.png', 'snake_charmer.png', 'spirit_of_ivory.png', 'vigormortis.png',
]);
const VERIFIED_ROLE_ICONS = new Set(['marionette.png', 'lil_monsta.png']);

export interface MissingExportImage { url: string; label: string }
export interface ExportPage { blob: Blob; width: number; height: number }
export interface ImageExportResult { pages: ExportPage[]; missing: MissingExportImage[] }

export class ExportContentTooLargeError extends Error {
  pageNumber?: number;
  constructor(pageNumber?: number) { super('Content does not fit on an A4 page'); this.name = 'ExportContentTooLargeError'; this.pageNumber = pageNumber; }
}

type PageViewport = A4Viewport;

interface ExportOptions {
  signal: AbortSignal;
  replacements: Record<string, string>;
  scale?: number;
  script?: Script;
  onProgress?: (step: 'resources' | 'render', current: number, total: number) => void;
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('Export cancelled', 'AbortError');
}

function waitFor<T>(promise: Promise<T>, signal: AbortSignal, stage: string, timeoutMs = 45000): Promise<T> {
  return new Promise((resolve, reject) => {
    const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', cancel); };
    const cancel = () => { finish(); reject(new DOMException('Export cancelled', 'AbortError')); };
    const timer = window.setTimeout(() => { finish(); reject(new Error(`Export timed out while ${stage}`)); }, timeoutMs);
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) { cancel(); return; }
    promise.then(value => { finish(); resolve(value); }, error => { finish(); reject(error); });
  });
}

function asDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('Cannot read image'));
    reader.readAsDataURL(blob);
  });
}

async function fetchImage(url: string, signal: AbortSignal, timeoutMs = 12000): Promise<string> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  const timeout = window.setTimeout(cancel, timeoutMs);
  signal.addEventListener('abort', cancel, { once: true });
  try {
    throwIfAborted(signal);
    const response = await fetch(url, { mode: 'cors', credentials: 'omit', signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const type = response.headers.get('content-type') || '';
    const declaredLength = Number(response.headers.get('content-length'));
    if (!type.startsWith('image/') || declaredLength > MAX_IMAGE_BYTES || !response.body) throw new Error('Invalid image');
    const reader = response.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = []; let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_IMAGE_BYTES) { await reader.cancel(); throw new Error('Image too large'); }
        chunks.push(value.slice());
      }
    } finally { reader.releaseLock(); }
    if (!size) throw new Error('Empty image');
    const blob = new Blob(chunks, { type });
    return await asDataUrl(blob);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
  }
}

function verifiedLocalUrl(source: URL): string | null {
  if (source.hostname === 'botc.letshare.fun' && source.pathname.startsWith('/imgs/')) {
    return `${location.origin}${source.pathname}`;
  }
  const match = source.pathname.match(/^\/data_file\/clocktower\/(web\/icons|role_icon)\/([^/]+)$/);
  if (source.hostname !== 'oss.gstonegames.com' || !match || source.search) return null;
  const filename = match[2];
  if (!(match[1] === 'web/icons' ? VERIFIED_LOCAL_ICONS : VERIFIED_ROLE_ICONS).has(filename)) return null;
  const folder = IMAGE_PATH_MAP[filename];
  if (folder === undefined) return null;
  return `${location.origin}/imgs/icons/${folder ? `${folder}/` : ''}${filename}`;
}

function imageResolver(options: ExportOptions) {
  const cache = new Map<string, Promise<string>>();
  const waiting: (() => void)[] = [];
  let active = 0;
  const limit = async <T>(work: () => Promise<T>): Promise<T> => {
    if (active >= 6) await new Promise<void>(resolve => waiting.push(resolve));
    active++;
    try { return await work(); } finally { active--; waiting.shift()?.(); }
  };
  return (input: string): Promise<string> => {
    const url = new URL(input, location.href).href;
    if (options.replacements[url]) return Promise.resolve(options.replacements[url]);
    if (url.startsWith('data:')) return Promise.resolve(url);
    if (!cache.has(url)) cache.set(url, limit(async () => {
      throwIfAborted(options.signal);
      const parsed = new URL(url);
      const local = verifiedLocalUrl(parsed);
      if (local) {
        try { return await fetchImage(local, options.signal); } catch { throwIfAborted(options.signal); }
      }
      try { return await fetchImage(url, options.signal); } catch { throwIfAborted(options.signal); }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Unsupported image URL');
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        try { return await fetchImage(`${IMAGE_PROXY}?url=${encodeURIComponent(url)}`, options.signal, 25000); }
        catch (error) {
          throwIfAborted(options.signal);
          lastError = error;
          if (error instanceof Error && /^HTTP (400|403|404|415)$/.test(error.message)) break;
          if (attempt < 2) await new Promise(resolve => window.setTimeout(resolve, 300 * (attempt + 1)));
        }
      }
      throw lastError;
    }));
    return cache.get(url)!;
  };
}

function copyStyles(source: Document, target: Document) {
  const base = target.createElement('base'); base.href = location.href; target.head.appendChild(base);
  for (const sheet of Array.from(source.styleSheets)) {
    try {
      const style = target.createElement('style');
      style.textContent = Array.from(sheet.cssRules, rule => rule.cssText).join('\n');
      target.head.appendChild(style);
    } catch {
      if (sheet.href) { const link = target.createElement('link'); link.rel = 'stylesheet'; link.href = sheet.href; target.head.appendChild(link); }
    }
  }
  const style = target.createElement('style');
  style.textContent = `
    html, body { margin: 0 !important; padding: 0 !important; width: 100vw !important; background: #f6f1dc; }
    *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
    .layout-frame, .layout-actions, .script-canvas-add-button, .MuiIconButton-root, .MuiFab-root,
    .header-alignment-guides, .footer-drag-guides, [data-layout-control], [data-script-add-page],
    input, textarea { display: none !important; }
    [data-header-gap-divider] { height: 2px !important; }
    [data-export-page] { width: 100vw !important; min-width: 100vw !important;
      min-height: 100vh !important; height: auto !important; margin: 0 !important;
      box-shadow: none !important; overflow: visible !important; }
    [data-export-page] > div { min-height: 100vh !important; height: auto !important; }
  `;
  target.head.appendChild(style);
}

function createExportFrame(source: Document, viewport: PageViewport): HTMLIFrameElement {
  const frame = document.createElement('iframe');
  frame.title = 'A4 export layout';
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('sandbox', 'allow-same-origin');
  Object.assign(frame.style, { position: 'fixed', left: '-20000px', top: '0', width: `${viewport.width}px`, height: `${viewport.height}px`, border: '0', pointerEvents: 'none' });
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) { frame.remove(); throw new Error('Cannot create export layout'); }
  doc.open(); doc.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>'); doc.close();
  copyStyles(source, doc);
  return frame;
}

async function createRenderFrame(signal: AbortSignal, initial: PageViewport, scriptOverride?: Script): Promise<HTMLIFrameElement> {
  const script = scriptOverride ?? scriptStore.script;
  if (!script) throw new Error('No script pages');
  // Freeze all state before starting the separate React tree. Custom fonts and
  // tower images are included in the in-memory UI configuration snapshot.
  const snapshot = { script: toJS(script), uiConfig: toJS(uiConfigStore.config), appConfig: toJS(configStore.config) };
  const frame = document.createElement('iframe');
  frame.title = 'A4 render layout'; frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  Object.assign(frame.style, { position: 'fixed', left: '-20000px', top: '0', width: `${initial.width}px`, height: `${initial.height}px`, border: '0', pointerEvents: 'none' });
  frame.src = new URL(`${import.meta.env.BASE_URL}export-render.html`, location.origin).href;
  return new Promise((resolve, reject) => {
    let sent = false;
    const cleanup = () => { clearTimeout(timeout); window.removeEventListener('message', receive); signal.removeEventListener('abort', cancel); };
    const cancel = () => { cleanup(); frame.remove(); reject(new DOMException('Export cancelled', 'AbortError')); };
    const timeout = window.setTimeout(() => { cleanup(); frame.remove(); reject(new Error(`Export layout timed out during ${sent ? 'rendering' : 'startup'}`)); }, 45000);
    const receive = (event: MessageEvent<{ type: string }>) => {
      if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
      if (event.data?.type === 'botc-export-ready' && !sent) {
        sent = true; frame.contentWindow?.postMessage({ type: 'botc-export-snapshot', snapshot }, location.origin);
      } else if (event.data?.type === 'botc-export-rendered' && sent) {
        cleanup(); resolve(frame);
      }
    };
    window.addEventListener('message', receive);
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) { cancel(); return; }
    document.body.appendChild(frame);
  });
}

async function checkPageViewport(page: HTMLElement, viewport: PageViewport, signal: AbortSignal, pageNumber: number): Promise<void> {
  throwIfAborted(signal);
  // Allow responsive title fitting and anchored decorations to settle.
  await waitFor(new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))), signal, 'checking A4 layout');
  if (!a4PageFits(page, viewport)) throw new ExportContentTooLargeError(pageNumber);
}

function replaceCssUrls(value: string, resolve: (url: string) => Promise<string>, missing: (url: string) => void): Promise<string> {
  const matches = [...value.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g)];
  if (!matches.length) return Promise.resolve(value);
  return Promise.all(matches.map(async match => {
    const raw = (match[1] || match[2] || match[3] || '').trim();
    if (!raw || raw.startsWith('#')) return match[0];
    try { return `url("${await resolve(raw)}")`; } catch { missing(raw); return 'none'; }
  })).then(parts => {
    let result = '', index = 0;
    matches.forEach((match, i) => { result += value.slice(index, match.index) + parts[i]; index = match.index! + match[0].length; });
    return result + value.slice(index);
  });
}

async function prepareResources(frame: HTMLIFrameElement, pairs: Array<[HTMLElement, HTMLElement]>, options: ExportOptions, resolve: ReturnType<typeof imageResolver>): Promise<MissingExportImage[]> {
  const view = frame.contentWindow!;
  const pseudoStyle = frame.contentDocument!.createElement('style');
  frame.contentDocument!.head.appendChild(pseudoStyle);
  let pseudoId = 0;
  const missing = new Map<string, MissingExportImage>();
  const record = (raw: string, label = '') => {
    try { const url = new URL(raw, location.href).href; missing.set(url, { url, label: label || url }); } catch { /* ignore invalid empty URLs */ }
  };
  const jobs: Promise<void>[] = [];
  for (const [original, page] of pairs) {
    const sourceImages = Array.from(original.querySelectorAll<HTMLImageElement>('img'));
    const copiedImages = Array.from(page.querySelectorAll<HTMLImageElement>('img'));
    copiedImages.forEach((image, index) => {
      const source = sourceImages[index];
      const url = source?.currentSrc || source?.src || image.src;
      image.removeAttribute('srcset'); image.removeAttribute('sizes'); image.loading = 'eager';
      if (image.getClientRects().length === 0) { image.remove(); return; }
      if (!url) return;
      jobs.push(resolve(url).then(data => { image.src = data; }).catch(() => { record(url, image.alt); }));
    });
    for (const node of [page, ...Array.from(page.querySelectorAll<HTMLElement>('*'))]) {
      if (!node.style || node.getClientRects().length === 0) continue;
      const computed = view.getComputedStyle(node);
      const imageProperties = ['background-image', 'mask-image', '-webkit-mask-image', 'border-image-source', 'list-style-image'];
      for (const property of imageProperties) {
        const value = computed.getPropertyValue(property);
        if (!value.includes('url(')) continue;
        jobs.push(replaceCssUrls(value, resolve, url => record(url)).then(result => { node.style.setProperty(property, result); }));
      }
      for (const pseudo of ['::before', '::after']) {
        const style = view.getComputedStyle(node, pseudo);
        if (style.content === 'none' || style.content === 'normal') continue;
        for (const property of [...imageProperties, 'content']) {
          const value = style.getPropertyValue(property);
          if (!value.includes('url(')) continue;
          if (!node.dataset.exportPseudo) node.dataset.exportPseudo = String(++pseudoId);
          const selector = `[data-export-pseudo="${node.dataset.exportPseudo}"]${pseudo}`;
          jobs.push(replaceCssUrls(value, resolve, url => record(url)).then(result => {
            pseudoStyle.sheet?.insertRule(`${selector} { ${property}: ${result} !important; }`);
          }));
        }
      }
    }
  }
  let finished = 0;
  await Promise.all(jobs.map(job => job.finally(() => options.onProgress?.('resources', ++finished, jobs.length))));
  throwIfAborted(options.signal);
  await waitFor(Promise.all(pairs.flatMap(([, page]) => Array.from(page.querySelectorAll('img'), image => image.decode().catch(() => undefined)))), options.signal, 'loading images');
  return [...missing.values()];
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function pngWithPrintResolution(blob: Blob): Promise<Blob> {
  const input = new Uint8Array(await blob.arrayBuffer());
  if (input.length < 33 || input[0] !== 137 || input[1] !== 80 || input[2] !== 78 || input[3] !== 71) return blob;
  const chunk = new Uint8Array(21); const view = new DataView(chunk.buffer);
  view.setUint32(0, 9); chunk.set([112, 72, 89, 115], 4); // pHYs
  view.setUint32(8, 11811); view.setUint32(12, 11811); chunk[16] = 1; // 300 DPI in pixels per metre
  view.setUint32(17, crc32(chunk.subarray(4, 17)));
  const parts: Uint8Array[] = [input.slice(0, 33), chunk];
  let offset = 33;
  while (offset + 12 <= input.length) {
    const length = new DataView(input.buffer, input.byteOffset + offset, 4).getUint32(0);
    const end = offset + length + 12;
    if (end > input.length) return blob;
    if (String.fromCharCode(...input.subarray(offset + 4, offset + 8)) !== 'pHYs') parts.push(input.slice(offset, end));
    offset = end;
  }
  return new Blob(parts.map(part => part.buffer as ArrayBuffer), { type: 'image/png' });
}

async function renderPage(page: HTMLElement, viewport: PageViewport, fontEmbedCSS: string, signal: AbortSignal): Promise<ExportPage> {
  const view = page.ownerDocument.defaultView!;
  page.style.setProperty('min-height', `${viewport.height}px`, 'important');
  (page.firstElementChild as HTMLElement | null)?.style.setProperty('min-height', `${viewport.height}px`, 'important');
  if (!a4PageFits(page, viewport)) {
    throw new ExportContentTooLargeError();
  }
  for (const node of [page, ...Array.from(page.querySelectorAll<HTMLElement>('*'))]) {
    if (node.style) node.setAttribute('data-export-font-size', view.getComputedStyle(node).fontSize);
  }
  const data = await waitFor(toSvg(page, { width: viewport.width, height: viewport.height, fontEmbedCSS, cacheBust: false, fetchRequestInit: { signal } }), signal, 'laying out a page');
  const xml = new DOMParser().parseFromString(decodeURIComponent(data.slice(data.indexOf(',') + 1)), 'image/svg+xml');
  if (xml.querySelector('parsererror')) throw new Error('Cannot render page');
  // html-to-image 1.11.x rounds every px font down; restore the measured size.
  xml.querySelectorAll<HTMLElement>('[data-export-font-size]').forEach(node => {
    node.style.setProperty('font-size', node.getAttribute('data-export-font-size') || '');
    node.removeAttribute('data-export-font-size');
  });
  // Chromium treats a Blob URL containing foreignObject as non-origin-clean.
  // A data URL keeps the embedded, self-contained SVG readable by Canvas.
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(xml))}`;
  {
    const image = new Image(); image.decoding = 'async'; image.src = svgUrl;
    await waitFor(image.decode(), signal, 'rendering a page');
    const canvas = document.createElement('canvas'); canvas.width = OUTPUT_WIDTH; canvas.height = OUTPUT_HEIGHT;
    const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable');
    context.fillStyle = '#f6f1dc'; context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    // The layout itself is A4-shaped, so the artwork reaches every edge.
    context.drawImage(image, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    const blob = await waitFor(new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Cannot create PNG')), 'image/png')), signal, 'encoding PNG');
    canvas.width = 0; canvas.height = 0;
    return { blob: await pngWithPrintResolution(blob), width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT };
  }
}

async function collectFontCss(documents: Document[], signal: AbortSignal): Promise<string> {
  // html-to-image's font discovery uses `instanceof HTMLElement`, which does
  // not match elements belonging to an iframe. Collect the iframe's actual
  // font stacks into a parent-document surrogate so every used face is embedded.
  const families = new Set<string>();
  for (const doc of documents) {
    const view = doc.defaultView!;
    for (const element of Array.from(doc.body.querySelectorAll<HTMLElement>('*'))) {
      const family = view.getComputedStyle(element).fontFamily;
      if (family) families.add(family);
    }
  }
  const surrogate = document.createElement('div');
  Object.assign(surrogate.style, { position: 'fixed', left: '-20000px', top: '0' });
  for (const family of families) {
    const item = document.createElement('span'); item.style.fontFamily = family; surrogate.appendChild(item);
  }
  document.body.appendChild(surrogate);
  try {
    const externalFaces = await getFontEmbedCSS(surrogate, { fetchRequestInit: { signal } });
    // html-to-image intentionally skips already-inlined font URLs. User fonts
    // are stored as data URLs, so carry those @font-face rules across as well.
    const customFaces = uiConfigStore.config.customFonts
      .filter(font => font.dataUrl.startsWith('data:'))
      .map(font => `@font-face { font-family: ${JSON.stringify(font.fontFamily)}; src: url(${JSON.stringify(font.dataUrl)}); }`)
      .join('\n');
    return `${externalFaces}\n${customFaces}`;
  } finally { surrogate.remove(); }
}

/** Render a detached, non-interactive copy; the editable page is never modified. */
export async function exportScriptImages(options: ExportOptions): Promise<ImageExportResult> {
  throwIfAborted(options.signal);
  await waitFor(document.fonts.ready, options.signal, 'loading fonts');
  const viewport = a4Viewport(options.scale ?? uiConfigStore.config.a4ExportScale);
  const renderedFrame = await createRenderFrame(options.signal, viewport, options.script);
  const frames: HTMLIFrameElement[] = [];
  try {
    const source = renderedFrame.contentDocument;
    if (!source) throw new Error('Cannot read export layout');
    const roots = a4PageRoots(source);
    if (!roots.length) throw new Error('No script pages');
    const resolve = imageResolver(options);
    const missing = new Map<string, MissingExportImage>();
    const prepared: Array<{ page: HTMLElement; viewport: PageViewport; document: Document }> = [];
    for (const [index, root] of roots.entries()) {
      hideEmptyAuthorPlaceholder(root);
      await checkPageViewport(root, viewport, options.signal, index + 1);
      const frame = createExportFrame(source, viewport); frames.push(frame);
      const doc = frame.contentDocument!;
      const copy = root.cloneNode(true) as HTMLElement;
      copy.dataset.exportPage = 'true';
      hideEmptyAuthorPlaceholder(copy);
      doc.body.appendChild(copy);
      await waitFor(doc.fonts.ready, options.signal, 'loading fonts');
      const failed = await waitFor(prepareResources(frame, [[root, copy]], options, resolve), options.signal, 'loading image resources', 90000);
      failed.forEach(item => missing.set(item.url, item));
      if (failed.length) continue;
      // Replacement images can change layout: check again without changing scale.
      await checkPageViewport(copy, viewport, options.signal, index + 1);
      prepared.push({ page: copy, viewport, document: doc });
    }
    if (missing.size) return { pages: [], missing: [...missing.values()] };
    throwIfAborted(options.signal);
    const fontEmbedCSS = await waitFor(collectFontCss(prepared.map(item => item.document), options.signal), options.signal, 'embedding fonts');
    const pages: ExportPage[] = [];
    for (const { page, viewport } of prepared) {
      options.onProgress?.('render', pages.length + 1, prepared.length);
      pages.push(await renderPage(page, viewport, fontEmbedCSS, options.signal));
      throwIfAborted(options.signal);
    }
    return { pages, missing: [] };
  } finally { frames.forEach(frame => frame.remove()); renderedFrame.remove(); }
}
