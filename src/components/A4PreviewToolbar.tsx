import { Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from '@mui/icons-material';
import type { Language } from '../utils/languages';
import { A4_PREVIEW_TEXT } from '../utils/a4PreviewText';

interface Props {
  language: Language;
  index: number;
  count: number;
  zoom: number;
  onPage: (index: number) => void;
  onZoom: (zoom: number) => void;
  onFitWidth: () => void;
}

export default function A4PreviewToolbar({ language, index, count, zoom, onPage, onZoom, onFitWidth }: Props) {
  const copy = A4_PREVIEW_TEXT[language];
  const iconButtonSx = { width: 40, height: 40 };
  return <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
    <Stack direction="row" alignItems="center" spacing={0.25}>
      <Tooltip title={copy.previous}><span><IconButton aria-label={copy.previous} disabled={index === 0} onClick={() => onPage(index - 1)} sx={iconButtonSx}><ChevronLeft /></IconButton></span></Tooltip>
      <Typography aria-live="polite" data-preview-page-count variant="body2" sx={{ minWidth: 56, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{index + 1} / {count}</Typography>
      <Tooltip title={copy.next}><span><IconButton aria-label={copy.next} disabled={index >= count - 1} onClick={() => onPage(index + 1)} sx={iconButtonSx}><ChevronRight /></IconButton></span></Tooltip>
    </Stack>
    <Stack direction="row" alignItems="center" spacing={0.25}>
      <Tooltip title={copy.zoomOut}><span><IconButton aria-label={copy.zoomOut} disabled={zoom <= 50} onClick={() => onZoom(Math.max(50, zoom - 25))} sx={iconButtonSx}><ZoomOut /></IconButton></span></Tooltip>
      <Typography aria-live="polite" data-preview-zoom variant="body2" sx={{ minWidth: 52, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{zoom}%</Typography>
      <Tooltip title={copy.zoomIn}><span><IconButton aria-label={copy.zoomIn} disabled={zoom >= 500} onClick={() => onZoom(Math.min(500, zoom + 25))} sx={iconButtonSx}><ZoomIn /></IconButton></span></Tooltip>
      <Button size="small" onClick={() => onZoom(100)} sx={{ minHeight: 40, textTransform: 'none' }}>{copy.fitPage}</Button>
      <Button size="small" onClick={onFitWidth} sx={{ minHeight: 40, textTransform: 'none' }}>{copy.fitWidth}</Button>
    </Stack>
  </Stack>;
}
