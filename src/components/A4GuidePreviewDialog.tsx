import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import type { Language } from '../utils/languages';
import type { A4Viewport } from '../utils/a4Layout';
import A4LivePreview from './A4LivePreview';

const COPY = {
  cn: { title: 'A4 布局预览', close: '关闭' },
  en: { title: 'A4 layout preview', close: 'Close' },
  es: { title: 'Vista de diseño A4', close: 'Cerrar' },
  de: { title: 'A4-Layoutvorschau', close: 'Schließen' },
} satisfies Record<Language, Record<string, string>>;

interface Props {
  sourceFrame: HTMLIFrameElement;
  viewport: A4Viewport;
  language: Language;
  initialPage: number;
  onClose: () => void;
}

export default function A4GuidePreviewDialog({ sourceFrame, viewport, language, initialPage, onClose }: Props) {
  const copy = COPY[language];
  return <Dialog open onClose={onClose} disableScrollLock fullWidth maxWidth="lg" aria-labelledby="a4-guide-preview-title" data-a4-live-dialog>
    <DialogTitle id="a4-guide-preview-title">{copy.title}</DialogTitle>
    <DialogContent dividers><A4LivePreview sourceFrame={sourceFrame} viewport={viewport} language={language} initialPage={initialPage} /></DialogContent>
    <DialogActions><Button onClick={onClose}>{copy.close}</Button></DialogActions>
  </Dialog>;
}
