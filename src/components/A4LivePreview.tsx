import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { a4PageFits, a4PageRoots, type A4Viewport } from '../utils/a4Layout';
import { snapshotA4Page } from '../utils/a4Snapshot';
import { A4_PREVIEW_TEXT } from '../utils/a4PreviewText';
import type { Language } from '../utils/languages';
import A4PreviewToolbar from './A4PreviewToolbar';
import { usePreviewGestures } from './usePreviewGestures';

const COPY = {
  cn: { preview: 'A4 页面预览', preparing: '正在准备预览…', overflow: '本页内容超出 A4 边界，请调整后再导出或打印。' },
  en: { preview: 'A4 page preview', preparing: 'Preparing preview…', overflow: 'This page exceeds A4. Adjust it before exporting or printing.' },
  es: { preview: 'Vista previa de página A4', preparing: 'Preparando vista previa…', overflow: 'Esta página supera A4. Ajústala antes de exportar o imprimir.' },
  de: { preview: 'A4-Seitenvorschau', preparing: 'Vorschau wird vorbereitet…', overflow: 'Diese Seite überschreitet A4. Passe sie vor dem Export oder Druck an.' },
} satisfies Record<Language, Record<string, string>>;

export interface A4PreviewState { index: number; count: number; fits: boolean[]; ready: boolean }
interface Props {
  sourceFrame: HTMLIFrameElement | null;
  viewport: A4Viewport;
  language: Language;
  initialPage?: number;
  onChange?: (state: A4PreviewState) => void;
}

export default function A4LivePreview({ sourceFrame, viewport, language, initialPage = 0, onChange }: Props) {
  const copy = COPY[language];
  const { width: viewportWidth, height: viewportHeight } = viewport;
  const [index, setIndex] = useState(initialPage);
  const [markup, setMarkup] = useState<string | null>(null);
  const [sourceReady, setSourceReady] = useState(false);
  const [info, setInfo] = useState<{ count: number; fits: boolean[] }>({ count: 0, fits: [] });
  const [zoom, setZoom] = useState(100);
  const [size, setSize] = useState({ width: 600, height: 600 });
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [previewNode, setPreviewNode] = useState<HTMLDivElement | null>(null);
  const setPreviewRef = useCallback((node: HTMLDivElement | null) => { previewRef.current = node; setPreviewNode(node); }, []);
  const { panning, ...gestures } = usePreviewGestures(previewRef, Boolean(markup && previewNode), zoom, setZoom);

  useLayoutEffect(() => {
    const element = previewNode;
    if (!element) return;
    const measure = () => setSize(old => old.width === element.clientWidth && old.height === element.clientHeight
      ? old : { width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure); observer.observe(element);
    return () => observer.disconnect();
  }, [previewNode]);

  useEffect(() => {
    if (!sourceFrame) return;
    let timer = 0;
    let activeDoc: Document | null = null;
    let observer: ResizeObserver | null = null;
    const observed = new Set<Element>();
    const refresh = () => {
      const doc = sourceFrame.contentDocument;
      if (sourceFrame.dataset.a4Status === 'pending') { setSourceReady(false); return; }
      if (!doc || Math.abs((sourceFrame.contentWindow?.innerWidth || 0) - viewportWidth) > 1) return;
      const pages = a4PageRoots(doc);
      if (!pages.length) return;
      pages.forEach(page => {
        page.dataset.a4GuidePage = 'true';
        if (observer && !observed.has(page)) { observed.add(page); observer.observe(page); }
      });
      const selected = Math.min(index, pages.length - 1);
      if (selected !== index) setIndex(selected);
      const html = snapshotA4Page(doc, selected);
      const fits = pages.map(page => a4PageFits(page, { width: viewportWidth, height: viewportHeight }));
      setMarkup(old => old === html ? old : html);
      setInfo(old => old.count === pages.length && old.fits.every((fit, i) => fit === fits[i]) ? old : { count: pages.length, fits });
      setSourceReady(Boolean(html));
    };
    const queue = () => { window.clearTimeout(timer); timer = window.setTimeout(refresh, 50); };
    const bind = () => {
      const doc = sourceFrame.contentDocument;
      if (doc !== activeDoc) {
        activeDoc?.removeEventListener('load', queue, true);
        activeDoc?.fonts.removeEventListener('loadingdone', queue);
        observer?.disconnect(); observed.clear(); activeDoc = doc;
        if (doc) {
          observer = new ResizeObserver(queue);
          doc.addEventListener('load', queue, true);
          doc.fonts.addEventListener('loadingdone', queue);
        }
      }
      queue();
    };
    const receive = (event: MessageEvent<{ type?: string }>) => {
      if (event.origin === location.origin && event.source === sourceFrame.contentWindow &&
        (event.data?.type === 'botc-export-layout' || event.data?.type === 'botc-export-rendered')) bind();
    };
    const statusObserver = new MutationObserver(() => {
      if (sourceFrame.dataset.a4Status === 'pending') setSourceReady(false);
      else queue();
    });
    statusObserver.observe(sourceFrame, { attributes: true, attributeFilter: ['data-a4-status'] });
    sourceFrame.addEventListener('load', bind); window.addEventListener('message', receive);
    bind();
    return () => {
      window.clearTimeout(timer); statusObserver.disconnect(); sourceFrame.removeEventListener('load', bind); window.removeEventListener('message', receive);
      activeDoc?.removeEventListener('load', queue, true); activeDoc?.fonts.removeEventListener('loadingdone', queue); observer?.disconnect();
    };
  }, [sourceFrame, index, viewportWidth, viewportHeight]);

  useEffect(() => { onChange?.({ index, count: info.count, fits: info.fits, ready: Boolean(markup) && sourceReady }); }, [index, info, markup, sourceReady, onChange]);

  const availableWidth = Math.max(1, size.width - 32);
  const availableHeight = Math.max(1, size.height - 32);
  const fitScale = Math.min(availableWidth / viewport.width, availableHeight / viewport.height);
  const scale = fitScale * zoom / 100;
  const changePage = (next: number) => {
    setIndex(Math.max(0, Math.min(info.count - 1, next)));
    previewRef.current?.scrollTo({ top: 0, left: 0 });
  };
  const fitWidth = () => setZoom(Math.min(500, Math.round(availableWidth / (viewport.width * fitScale) * 100)));

  if (!markup) return <Stack role="status" alignItems="center" justifyContent="center" spacing={1.5} sx={{ minHeight: 260 }}>
    <CircularProgress size={28} /><Typography variant="body2">{copy.preparing}</Typography>
  </Stack>;
  return <>
    <A4PreviewToolbar language={language} index={index} count={info.count} zoom={zoom} onPage={changePage} onZoom={setZoom} onFitWidth={fitWidth} />
    {info.fits[index] === false && <Alert severity="warning" sx={{ mb: 1.5 }}>{copy.overflow}</Alert>}
    <Box ref={setPreviewRef} role="region" tabIndex={0} aria-label={copy.preview} data-preview-scroll {...gestures}
      sx={{ height: 'min(60vh, 720px)', boxSizing: 'border-box', overflow: 'auto', p: 2, bgcolor: '#eeeae0', borderRadius: 1,
        border: '1px solid rgba(0,0,0,.1)', cursor: panning ? 'grabbing' : zoom > 100 ? 'grab' : 'default', userSelect: 'none',
        '&:focus-visible': { outline: '2px solid #607963', outlineOffset: 2 } }}>
      <Box sx={{ display: 'flex', minWidth: '100%' }}>
        <Box data-preview-content data-export-preview={index + 1} sx={{ position: 'relative', width: viewport.width * scale, height: viewport.height * scale,
          flexShrink: 0, mx: 'auto', outline: '1px solid oklch(0 0 0 / 0.1)', outlineOffset: '-1px', boxShadow: '0 2px 12px rgba(0,0,0,.12)' }}>
          <iframe title={`${copy.preview} ${index + 1}`} srcDoc={markup} sandbox="allow-same-origin" tabIndex={-1}
            style={{ position: 'absolute', top: 0, left: 0, width: viewport.width, height: viewport.height, border: 0,
              transformOrigin: 'top left', transform: `scale(${scale})`, pointerEvents: 'none' }} />
        </Box>
      </Box>
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{A4_PREVIEW_TEXT[language].hint}</Typography>
  </>;
}
