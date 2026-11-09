import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { CheckCircleOutline, ErrorOutline } from '@mui/icons-material';
import { reaction, toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { configStore } from '../stores/ConfigStore';
import type { AppConfig } from '../stores/ConfigStore';
import { scriptStore } from '../stores/ScriptStore';
import { uiConfigStore } from '../stores/UIConfigStore';
import type { UIConfig } from '../stores/UIConfigStore';
import type { Script } from '../types';
import { a4PageFits, a4PageRoots, a4Viewport, A4_LIVE_FRAME_CSS, A4_OUTPUT_HEIGHT, A4_OUTPUT_WIDTH, normalizeA4Scale } from '../utils/a4Layout';
import type { Language } from '../utils/languages';
import A4ScaleControl from './A4ScaleControl';
import A4GuidePreviewDialog from './A4GuidePreviewDialog';

const COPY = {
  cn: { title: 'A4 布局预览', checking: '正在检查页面…', fit: '在 A4 范围内', overflow: '超出 A4，请调整后再导出', page: '第', pageEnd: '页', openPreview: '放大查看 A4 预览', previewTip: '双击放大预览',
    hint: '预览框显示当前比例下的一张 A4。可切换页面查看；超出时可缩小比例、调整内容或启用双页模式。' },
  en: { title: 'A4 layout preview', checking: 'Checking pages…', fit: 'Fits on A4', overflow: 'Exceeds A4; adjust before exporting', page: 'Page ', pageEnd: '', openPreview: 'Open larger A4 preview', previewTip: 'Double-click to enlarge',
    hint: 'The frame shows one A4 page at the selected scale. Select a page to inspect it; reduce the scale, adjust content or enable two-page mode if it overflows.' },
  es: { title: 'Vista de diseño A4', checking: 'Comprobando páginas…', fit: 'Cabe en A4', overflow: 'Supera A4; ajusta antes de exportar', page: 'Página ', pageEnd: '', openPreview: 'Ampliar vista A4', previewTip: 'Doble clic para ampliar',
    hint: 'El marco muestra una página A4 a la escala elegida. Selecciona una página; si se desborda, reduce la escala, ajusta el contenido o activa el modo de dos páginas.' },
  de: { title: 'A4-Layoutvorschau', checking: 'Seiten werden geprüft…', fit: 'Passt auf A4', overflow: 'Überschreitet A4; vor dem Export anpassen', page: 'Seite ', pageEnd: '', openPreview: 'A4-Vorschau vergrößern', previewTip: 'Doppelklick zum Vergrößern',
    hint: 'Der Rahmen zeigt eine A4-Seite in der gewählten Skalierung. Wähle eine Seite; bei Überlauf Skalierung oder Inhalt anpassen oder den Zwei-Seiten-Modus aktivieren.' },
} satisfies Record<Language, Record<string, string>>;

const PREVIEW_WIDTH = 156;
const PREVIEW_HEIGHT = PREVIEW_WIDTH * A4_OUTPUT_HEIGHT / A4_OUTPUT_WIDTH;

const A4LayoutGuide = observer(function A4LayoutGuide({ language, previewFrameRef }: { language: Language; previewFrameRef?: RefObject<HTMLIFrameElement | null> }) {
  const copy = COPY[language];
  const scale = normalizeA4Scale(uiConfigStore.config.a4ExportScale);
  const viewport = a4Viewport(scale);
  const ownFrameRef = useRef<HTMLIFrameElement>(null);
  const frameRef = previewFrameRef || ownFrameRef;
  const openTimer = useRef<number | null>(null);
  const [fits, setFits] = useState<boolean[]>([]);
  const [checking, setChecking] = useState(true);
  const [selected, setSelected] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => () => { if (openTimer.current !== null) window.clearTimeout(openTimer.current); }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let ready = false;
    let disposed = false;
    let requestId = 0;
    let timer = 0;
    let pending: { script: Script | null; uiConfig: UIConfig; appConfig: AppConfig } | null = null;

    const send = () => {
      if (!ready || !pending?.script || disposed) return;
      const snapshot = pending;
      const id = ++requestId;
      frame.dataset.a4RequestId = String(id);
      frame.contentWindow?.postMessage({ type: 'botc-export-snapshot', snapshot, requestId: id }, location.origin);
    };
    const schedule = () => { window.clearTimeout(timer); timer = window.setTimeout(send, 350); };
    const receive = (event: MessageEvent<{ type: string; requestId?: number }>) => {
      if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
      if (event.data?.type === 'botc-export-ready') {
        const doc = frame.contentDocument;
        if (!doc) return;
        const style = doc.createElement('style');
        style.textContent = A4_LIVE_FRAME_CSS;
        doc.head.appendChild(style);
        ready = true;
        schedule();
      } else if (event.data?.type === 'botc-export-layout' && event.data.requestId === requestId) {
        frame.dataset.a4Status = 'layout';
      } else if (event.data?.type === 'botc-export-rendered' && event.data.requestId === requestId) {
        const id = requestId;
        const doc = frame.contentDocument;
        if (!doc || !pending) return;
        const pages = a4PageRoots(doc);
        pages.forEach(page => { page.dataset.a4GuidePage = 'true'; });
        // The same page width, height and fit check are used by image export.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (disposed || id !== requestId) return;
          const pageViewport = a4Viewport(pending!.uiConfig.a4ExportScale);
          setFits(pages.map(page => a4PageFits(page, pageViewport)));
          setSelected(previous => Math.min(previous, Math.max(0, pages.length - 1)));
          frame.dataset.a4Status = 'ready';
          setChecking(false);
        }));
      }
    };
    window.addEventListener('message', receive);
    const stop = reaction(
      () => ({ script: toJS(scriptStore.script), uiConfig: toJS(uiConfigStore.config), appConfig: toJS(configStore.config) }),
      snapshot => { pending = snapshot; requestId++; frame.dataset.a4Status = 'pending'; setChecking(true); schedule(); },
      { fireImmediately: true },
    );
    return () => { disposed = true; stop(); window.clearTimeout(timer); window.removeEventListener('message', receive); };
  }, [frameRef]);

  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    const page = doc && a4PageRoots(doc)[selected];
    if (page && doc?.defaultView) doc.defaultView.scrollTo(0, page.getBoundingClientRect().top + doc.defaultView.scrollY);
  }, [selected, fits, frameRef]);

  const selectedFits = fits[selected];
  const openPreview = () => {
    if (openTimer.current !== null) { window.clearTimeout(openTimer.current); openTimer.current = null; }
    if (!checking && fits.length) setPreviewOpen(true);
  };
  return <Paper variant="outlined" data-a4-layout-guide sx={{ mb: 2, p: 2, borderColor: '#c8bba3', bgcolor: 'rgba(251, 246, 231, .97)', '@media print': { display: 'none' } }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={700}>{copy.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>{copy.hint}</Typography>
        <Box sx={{ maxWidth: 440 }}><A4ScaleControl language={language} /></Box>
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }} aria-live="polite">
          {checking ? <Typography variant="body2" color="text.secondary">{copy.checking}</Typography> : fits.map((fit, index) => <Button
            key={index} size="small" variant={selected === index ? 'outlined' : 'text'}
            color={fit ? 'success' : 'error'} onClick={() => setSelected(index)}
            startIcon={fit ? <CheckCircleOutline /> : <ErrorOutline />}
            aria-pressed={selected === index} data-a4-page-status={fit ? 'fit' : 'overflow'}>
            {copy.page}{index + 1}{copy.pageEnd} · {fit ? copy.fit : copy.overflow}
          </Button>)}
        </Stack>
      </Box>
      <Box role="button" tabIndex={checking || !fits.length ? -1 : 0} aria-label={copy.openPreview} aria-disabled={checking || !fits.length} title={copy.previewTip}
        onClick={event => {
          if (event.detail >= 2) openPreview();
          else { if (openTimer.current !== null) window.clearTimeout(openTimer.current); openTimer.current = window.setTimeout(openPreview, 250); }
        }} onDoubleClick={openPreview}
        onMouseDown={event => { if (event.button === 0) { event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); } }}
        onDragStart={event => event.preventDefault()}
        onKeyDown={event => { if (!checking && fits.length && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openPreview(); } }} data-a4-guide-preview
        sx={{ position: 'relative', flexShrink: 0, width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, p: 0,
        boxSizing: 'content-box', overflow: 'hidden', alignSelf: { xs: 'center', sm: 'flex-start' }, bgcolor: '#f6f1dc', cursor: checking ? 'default' : 'zoom-in', userSelect: 'none', WebkitUserSelect: 'none',
        border: '2px solid', borderColor: !checking && selectedFits === false ? '#b3261e' : '#9b927e', boxShadow: '0 2px 8px rgba(0,0,0,.12)',
        '&:focus-visible': { outline: '2px solid #607963', outlineOffset: 3 } }}>
        <iframe ref={frameRef} title={copy.title} aria-hidden="true" sandbox="allow-scripts allow-same-origin" tabIndex={-1}
          src={`${import.meta.env.BASE_URL}export-render.html`}
          style={{ position: 'absolute', top: 0, left: 0, width: viewport.width, height: viewport.height, border: 0,
            transformOrigin: 'top left', transform: `scale(${PREVIEW_WIDTH / viewport.width})`, pointerEvents: 'none' }} />
      </Box>
    </Stack>
    {previewOpen && frameRef.current && <A4GuidePreviewDialog sourceFrame={frameRef.current} viewport={viewport}
      language={language} initialPage={selected} onClose={() => setPreviewOpen(false)} />}
  </Paper>;
});

export default A4LayoutGuide;
