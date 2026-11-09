import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Slider, TextField, Typography } from '@mui/material';
import type { FooterComponent } from '../types';
import { useTranslation } from '../utils/i18n';
import { footerText } from '../utils/footerText';

export default function FooterComponentDialog({ item, onClose, onSave }: { item: FooterComponent; onClose: () => void; onSave: (item: FooterComponent) => void }) {
  const { language } = useTranslation();
  const s = footerText(language);
  const [value, setValue] = useState<FooterComponent>({ ...item });
  return <Dialog open onClose={onClose} fullWidth maxWidth="sm" disableScrollLock>
    <DialogTitle>{s.edit} · {item.type === 'nightLegend' ? s.legend : s.image}</DialogTitle>
    <DialogContent dividers>
      {item.type === 'nightLegend' && <TextField fullWidth label={s.content} value={value.text ?? s.legendDefault} onChange={e => setValue({ ...value, text: e.target.value })} />}
      {item.type === 'image' && <Box><Typography>{s.opacity}: {Math.round((value.opacity ?? 1) * 100)}%</Typography>
        <Slider min={0} max={1} step={.05} value={value.opacity ?? 1} onChange={(_, n) => setValue({ ...value, opacity: n as number })} /></Box>}
    </DialogContent>
    <DialogActions><Button onClick={onClose}>{s.cancel}</Button><Button variant="contained" onClick={() => { onSave(value); onClose(); }}>{s.save}</Button></DialogActions>
  </Dialog>;
}
