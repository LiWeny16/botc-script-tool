import { useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Stack, Tab, Tabs, Typography } from '@mui/material';
import { DownloadOutlined, ImageOutlined, PrintOutlined, UploadFileOutlined } from '@mui/icons-material';
import { zipSync } from 'fflate';
import { observer } from 'mobx-react-lite';
import type { Script } from '../../types';
import type { Language } from '../../utils/languages';
import { ExportContentTooLargeError, exportScriptImages, type MissingExportImage } from '../../utils/imageExport';
import { openA4PrintWindow, PrintWindowBlockedError, printA4Pages, updateA4PrintProgress } from '../../utils/printA4Pages';
import { a4Viewport, normalizeA4Scale } from '../../utils/a4Layout';
import { uiConfigStore } from '../../stores/UIConfigStore';
import A4ScaleControl from '../A4ScaleControl';
import A4LivePreview, { type A4PreviewState } from '../A4LivePreview';
import A4PreviewSourceFrame from '../A4PreviewSourceFrame';

const COPY = {
  cn: {
    title: '导出与打印', subtitle: 'A4 竖版 · 每页一张 · 2480 × 3508 · 300 DPI', imageMode: '导出图片', printMode: '打印 / PDF',
    preparing: '正在准备图片和字体', rendering: '正在生成页面', packing: '正在打包图片', missing: '以下图片无法读取。请上传对应图片后重试，或者检查图片链接。',
    replace: '选择图片', replaced: '已选择', retry: '重试导出', badFile: '请选择不超过 12 MB 的图片。', failed: '图片生成失败，请重试。',
    overflow: '当前比例下内容超出 A4，暂不能导出或打印。请缩小导出比例、启用双页模式或调整内容后重试。',
    page: '第', pageEnd: '页', download: '下载图片', all: '下载全部（ZIP）', close: '关闭', cancel: '取消', print: '打印 / 另存 PDF',
    printHint: '在系统打印窗口选择 A4 纵向、无边距和 100% 缩放，可选择打印机或另存 PDF。', imageHint: '下载当前页，或将全部页面打包为 ZIP。',
    proxy: '受限制的公开图片链接会发送到图片代理；剧本内容留在浏览器中。', blocked: '浏览器拦截了打印窗口，请允许弹出窗口后重试。', printFailed: '无法打开打印，请重试。',
  },
  en: {
    title: 'Export and print', subtitle: 'A4 portrait · one image per page · 2480 × 3508 · 300 DPI', imageMode: 'Images', printMode: 'Print / PDF',
    preparing: 'Preparing images and fonts', rendering: 'Rendering page', packing: 'Packing images', missing: 'These images could not be read. Upload replacements or check their links, then try again.',
    replace: 'Choose image', replaced: 'Selected', retry: 'Try again', badFile: 'Choose an image of 12 MB or less.', failed: 'Could not generate the images. Please try again.',
    overflow: 'Content exceeds A4 at this scale, so export and print are paused. Reduce the export scale, enable two-page mode or adjust the content, then retry.',
    page: 'Page ', pageEnd: '', download: 'Download image', all: 'Download all (ZIP)', close: 'Close', cancel: 'Cancel', print: 'Print / save PDF',
    printHint: 'In the system print dialog, choose A4 portrait, no margins and 100% scale. Select a printer or save as PDF.', imageHint: 'Download the current page, or download every page in a ZIP.',
    proxy: 'Restricted public image links are sent to the image proxy; your script stays in the browser.', blocked: 'The browser blocked the print window. Allow pop-ups and try again.', printFailed: 'Could not open print. Please try again.',
  },
  es: {
    title: 'Exportar e imprimir', subtitle: 'A4 vertical · una imagen por página · 2480 × 3508 · 300 PPP', imageMode: 'Imágenes', printMode: 'Imprimir / PDF',
    preparing: 'Preparando imágenes y fuentes', rendering: 'Generando página', packing: 'Empaquetando imágenes', missing: 'No se pudieron leer estas imágenes. Sube reemplazos o comprueba los enlaces y vuelve a intentarlo.',
    replace: 'Elegir imagen', replaced: 'Seleccionada', retry: 'Reintentar', badFile: 'Elige una imagen de 12 MB o menos.', failed: 'No se pudieron generar las imágenes. Inténtalo de nuevo.',
    overflow: 'El contenido supera A4 con esta escala. Reduce la escala, activa el modo de dos páginas o ajusta el contenido antes de exportar o imprimir.',
    page: 'Página ', pageEnd: '', download: 'Descargar imagen', all: 'Descargar todo (ZIP)', close: 'Cerrar', cancel: 'Cancelar', print: 'Imprimir / guardar PDF',
    printHint: 'En el diálogo de impresión, elige A4 vertical, sin márgenes y escala del 100 %. Selecciona una impresora o guarda como PDF.', imageHint: 'Descarga la página actual o todas las páginas en un ZIP.',
    proxy: 'Los enlaces de imágenes públicas restringidas se envían al proxy; el guion permanece en el navegador.', blocked: 'El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes y vuelve a intentarlo.', printFailed: 'No se pudo abrir la impresión. Inténtalo de nuevo.',
  },
  de: {
    title: 'Exportieren und drucken', subtitle: 'A4 hochkant · ein Bild pro Seite · 2480 × 3508 · 300 DPI', imageMode: 'Bilder', printMode: 'Drucken / PDF',
    preparing: 'Bilder und Schriften werden vorbereitet', rendering: 'Seite wird erstellt', packing: 'Bilder werden gepackt', missing: 'Diese Bilder konnten nicht gelesen werden. Lade Ersatz hoch oder prüfe die Links und versuche es erneut.',
    replace: 'Bild auswählen', replaced: 'Ausgewählt', retry: 'Erneut versuchen', badFile: 'Wähle ein Bild mit höchstens 12 MB.', failed: 'Die Bilder konnten nicht erstellt werden. Bitte erneut versuchen.',
    overflow: 'Der Inhalt überschreitet A4 bei dieser Skalierung. Verringere die Skalierung, aktiviere den Zwei-Seiten-Modus oder passe den Inhalt vor Export oder Druck an.',
    page: 'Seite ', pageEnd: '', download: 'Bild herunterladen', all: 'Alle herunterladen (ZIP)', close: 'Schließen', cancel: 'Abbrechen', print: 'Drucken / PDF speichern',
    printHint: 'Wähle im Druckdialog A4 hochkant, keine Ränder und 100 % Skalierung. Wähle einen Drucker oder speichere als PDF.', imageHint: 'Lade die aktuelle Seite oder alle Seiten als ZIP herunter.',
    proxy: 'Eingeschränkte öffentliche Bildlinks werden an den Bildproxy gesendet; das Skript bleibt im Browser.', blocked: 'Der Browser hat das Druckfenster blockiert. Erlaube Pop-ups und versuche es erneut.', printFailed: 'Der Druck konnte nicht geöffnet werden. Bitte erneut versuchen.',
  },
} satisfies Record<Language, Record<string, string>>;

export type ExportMode = 'image' | 'print';
type OutputAction = 'page' | 'all' | 'print';
interface Props { open: boolean; onClose: () => void; language: Language; scriptTitle: string; initialMode?: ExportMode; script?: Script; sourceFrame?: HTMLIFrameElement | null }

function safeFilename(value: string) {
  return Array.from(value.replace(/[\\/:*?"<>|]/g, '_'), character => character.charCodeAt(0) < 32 ? '_' : character).join('').trim().slice(0, 80) || 'script';
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

const ImageExportDialog = observer(function ImageExportDialog({ open, onClose, language, scriptTitle, initialMode = 'image', script, sourceFrame }: Props) {
  const copy = COPY[language];
  const scale = normalizeA4Scale(uiConfigStore.config.a4ExportScale);
  const viewport = a4Viewport(scale);
  const [mode, setMode] = useState<ExportMode>(initialMode);
  const [fallbackFrame, setFallbackFrame] = useState<HTMLIFrameElement | null>(null);
  const [preview, setPreview] = useState<A4PreviewState>({ index: 0, count: 0, fits: [], ready: false });
  const [missing, setMissing] = useState<MissingExportImage[]>([]);
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<'idle' | 'resources' | 'render' | 'pack'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fileError, setFileError] = useState(false);
  const [outputError, setOutputError] = useState<'overflow' | 'failed' | 'blocked' | 'printFailed' | null>(null);
  const [overflowPage, setOverflowPage] = useState<number | undefined>();
  const [lastAction, setLastAction] = useState<OutputAction>('page');
  const active = useRef<AbortController | null>(null);
  const printWindow = useRef<Window | null>(null);
  const busy = phase !== 'idle';

  useEffect(() => () => { active.current?.abort(); if (printWindow.current && !printWindow.current.closed) printWindow.current.close(); }, []);
  useEffect(() => { setOutputError(null); setMissing([]); }, [scale]);

  const cancel = () => {
    active.current?.abort();
    if (printWindow.current && !printWindow.current.closed) printWindow.current.close();
    printWindow.current = null;
  };

  const start = (action: OutputAction) => {
    if (busy || active.current) return;
    const controller = new AbortController();
    let reserved: Window | null = null;
    if (action === 'print') {
      try { reserved = openA4PrintWindow(safeFilename(scriptTitle), copy.preparing, copy.cancel, () => controller.abort()); }
      catch (error) { setOutputError(error instanceof PrintWindowBlockedError ? 'blocked' : 'printFailed'); return; }
      printWindow.current = reserved;
    }
    active.current = controller;
    setLastAction(action); setMissing([]); setFileError(false); setOutputError(null); setOverflowPage(undefined);
    setProgress({ current: 0, total: 0 }); setPhase('resources');
    const currentPage = preview.index;
    void (async () => {
      let handedOff = false;
      try {
        const result = await exportScriptImages({ signal: controller.signal, replacements, scale, script,
          onProgress: (step, current, total) => {
            if (controller.signal.aborted) return;
            if (step === 'render' || current === total || current % 5 === 0) {
              setPhase(step); setProgress({ current, total });
              updateA4PrintProgress(reserved, `${step === 'resources' ? copy.preparing : copy.rendering}${total ? ` ${current}/${total}` : ''}`, current, total);
            }
          },
        });
        if (controller.signal.aborted) return;
        if (result.missing.length) { setMissing(result.missing); return; }
        if (action === 'print') {
          if (!reserved || reserved.closed) return;
          const job = printA4Pages(result.pages, safeFilename(scriptTitle), copy.print, reserved);
          handedOff = true; printWindow.current = null;
          await job;
        } else if (action === 'page') {
          const index = Math.min(currentPage, result.pages.length - 1);
          saveBlob(result.pages[index].blob, `${safeFilename(scriptTitle)}-A4-${index + 1}.png`);
        } else {
          setPhase('pack');
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
          const files: Record<string, Uint8Array> = {};
          for (const [index, page] of result.pages.entries()) files[`${safeFilename(scriptTitle)}-A4-${index + 1}.png`] = new Uint8Array(await page.blob.arrayBuffer());
          if (controller.signal.aborted) return;
          const zipped = zipSync(files, { level: 0 });
          saveBlob(new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' }), `${safeFilename(scriptTitle)}-A4.zip`);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          if (error instanceof ExportContentTooLargeError) { setOutputError('overflow'); setOverflowPage(error.pageNumber); }
          else { console.error('A4 output failed:', error); setOutputError(action === 'print' ? 'printFailed' : 'failed'); }
        }
      } finally {
        if (!handedOff && reserved && !reserved.closed) reserved.close();
        if (printWindow.current === reserved) printWindow.current = null;
        if (active.current === controller) { active.current = null; setPhase('idle'); }
      }
    })();
  };

  const upload = (url: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 12 * 1024 * 1024) { setFileError(true); return; }
    setFileError(false);
    const reader = new FileReader();
    reader.onload = () => setReplacements(previous => ({ ...previous, [url]: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const statusText = phase === 'resources' ? copy.preparing : phase === 'render' ? copy.rendering : copy.packing;
  const hasOverflow = preview.ready && preview.fits.some(fit => !fit);
  const disabled = busy || !preview.ready || hasOverflow;
  return <Dialog open={open} onClose={() => { cancel(); onClose(); }} disableScrollLock fullWidth maxWidth="lg" aria-labelledby="image-export-title">
    {!sourceFrame && <A4PreviewSourceFrame script={script} viewport={viewport} onFrame={setFallbackFrame} />}
    <DialogTitle id="image-export-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ImageOutlined color="primary" />{copy.title}
    </DialogTitle>
    <Box sx={{ px: { xs: 2, sm: 3 } }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{copy.subtitle}</Typography>
      <Tabs value={mode} onChange={(_, value: ExportMode) => { setMode(value); setOutputError(null); }} aria-label={copy.title}>
        <Tab value="image" icon={<ImageOutlined />} iconPosition="start" label={copy.imageMode} sx={{ minHeight: 44, textTransform: 'none' }} />
        <Tab value="print" icon={<PrintOutlined />} iconPosition="start" label={copy.printMode} sx={{ minHeight: 44, textTransform: 'none' }} />
      </Tabs>
    </Box>
    <DialogContent dividers>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' }, gap: 3, alignItems: 'stretch' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <A4LivePreview sourceFrame={sourceFrame || fallbackFrame} viewport={viewport} language={language} onChange={setPreview} />
        </Box>
        <Box sx={{ flex: { xs: '0 0 auto', md: '0 0 280px' }, minWidth: 0 }}>
          <A4ScaleControl language={language} disabled={busy} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textWrap: 'pretty' }}>{mode === 'print' ? copy.printHint : copy.imageHint}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textWrap: 'pretty' }}>{copy.proxy}</Typography>
          {busy && <Box role="status" aria-live="polite" sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>{statusText}{progress.total && phase !== 'pack' ? ` ${progress.current}/${progress.total}` : ''}</Typography>
            <LinearProgress variant={progress.total && phase !== 'pack' ? 'determinate' : 'indeterminate'} value={progress.total ? progress.current / progress.total * 100 : 0} />
            <Button onClick={cancel} size="small" sx={{ mt: 0.5, minHeight: 40, textTransform: 'none' }}>{copy.cancel}</Button>
          </Box>}
          {(hasOverflow || outputError === 'overflow') && <Alert severity="warning" sx={{ mt: 2 }}>
            {outputError === 'overflow' && overflowPage ? `${copy.page}${overflowPage}${copy.pageEnd}: ` : ''}{copy.overflow}
          </Alert>}
          {outputError && outputError !== 'overflow' && <Alert severity="error" sx={{ mt: 2 }}>{outputError === 'blocked' ? copy.blocked : outputError === 'printFailed' ? copy.printFailed : copy.failed}</Alert>}
          {missing.length > 0 && <Stack spacing={1.5} sx={{ mt: 2 }}>
            <Alert severity="warning">{copy.missing}</Alert>
            {fileError && <Alert severity="error">{copy.badFile}</Alert>}
            {missing.map(item => <Box key={item.url} sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{item.label}</Typography>
              {item.label !== item.url && <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>{item.url}</Typography>}
              <Button component="label" variant="outlined" size="small" startIcon={<UploadFileOutlined />} sx={{ mt: 0.5, minHeight: 40, textTransform: 'none' }}>
                {replacements[item.url] ? copy.replaced : copy.replace}<input hidden type="file" accept="image/*" onChange={event => upload(item.url, event.target.files?.[0])} />
              </Button>
            </Box>)}
            <Button variant="contained" disabled={busy} onClick={() => start(lastAction)} sx={{ minHeight: 40, textTransform: 'none' }}>{copy.retry}</Button>
          </Stack>}
        </Box>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => { cancel(); onClose(); }}>{copy.close}</Button>
      {mode === 'print' ? <Button variant="contained" startIcon={<PrintOutlined />} disabled={disabled} onClick={() => start('print')}>{copy.print}</Button> : <>
        <Button variant={preview.count <= 1 ? 'contained' : 'outlined'} startIcon={<DownloadOutlined />} disabled={disabled} onClick={() => start('page')}>{copy.download}</Button>
        {preview.count > 1 && <Button variant="contained" startIcon={<DownloadOutlined />} disabled={disabled} onClick={() => start('all')}>{copy.all}</Button>}
      </>}
    </DialogActions>
  </Dialog>;
});

export default ImageExportDialog;
