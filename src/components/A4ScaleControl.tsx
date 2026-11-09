import { useEffect, useState } from 'react';
import { Box, Button, Slider, Stack, TextField, Typography } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { uiConfigStore } from '../stores/UIConfigStore';
import { DEFAULT_A4_SCALE, MAX_A4_SCALE, MIN_A4_SCALE, normalizeA4Scale } from '../utils/a4Layout';
import type { Language } from '../utils/languages';

const COPY = {
  cn: { label: 'A4 导出缩放', hint: '比例越大，文字越大，一页能容纳的内容越少。', reset: '恢复 54%' },
  en: { label: 'A4 export scale', hint: 'A larger scale makes text larger and fits less content on a page.', reset: 'Reset to 54%' },
  es: { label: 'Escala de exportación A4', hint: 'Una escala mayor amplía el texto y deja menos espacio en la página.', reset: 'Restablecer al 54 %' },
  de: { label: 'A4-Exportskalierung', hint: 'Eine größere Skalierung vergrößert die Schrift und verringert den Platz auf der Seite.', reset: 'Auf 54 % zurücksetzen' },
} satisfies Record<Language, Record<string, string>>;

const A4ScaleControl = observer(function A4ScaleControl({ language, disabled = false }: { language: Language; disabled?: boolean }) {
  const copy = COPY[language];
  const scale = normalizeA4Scale(uiConfigStore.config.a4ExportScale);
  const [draft, setDraft] = useState(String(scale));
  useEffect(() => { setDraft(String(scale)); }, [scale]);
  const apply = (value: number) => {
    const next = normalizeA4Scale(value);
    setDraft(String(next));
    if (next !== scale) uiConfigStore.updateConfig({ a4ExportScale: next });
  };
  return <Box data-a4-scale-control>
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Typography variant="body2" fontWeight={700}>{copy.label}</Typography>
      <Button size="small" onClick={() => apply(DEFAULT_A4_SCALE)} disabled={disabled || scale === DEFAULT_A4_SCALE} sx={{ minHeight: 40, textTransform: 'none' }}>{copy.reset}</Button>
    </Stack>
    <Stack direction="row" alignItems="center" spacing={2}>
      <Slider size="small" disabled={disabled} min={MIN_A4_SCALE} max={MAX_A4_SCALE} step={1} value={scale}
        aria-label={copy.label} valueLabelDisplay="auto" valueLabelFormat={value => `${value}%`}
        onChange={(_, value) => apply(value as number)} />
      <TextField size="small" disabled={disabled} type="number" value={draft} onChange={event => setDraft(event.target.value)}
        onBlur={() => apply(draft.trim() === '' ? scale : Number(draft))}
        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); (event.target as HTMLInputElement).blur(); } }}
        slotProps={{ htmlInput: { min: MIN_A4_SCALE, max: MAX_A4_SCALE, step: 1, 'aria-label': `${copy.label} (%)` } }}
        sx={{ width: 88, flexShrink: 0 }} />
      <Typography variant="body2" aria-hidden="true">%</Typography>
    </Stack>
    <Typography variant="caption" color="text.secondary">{copy.hint} ({MIN_A4_SCALE}%–{MAX_A4_SCALE}%)</Typography>
  </Box>;
});

export default A4ScaleControl;
