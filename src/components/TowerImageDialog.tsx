import { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Slider, Typography } from '@mui/material';
import { Add, DeleteOutline, EditOutlined, ImageOutlined } from '@mui/icons-material';
import type { FooterComponent, RichTextDocument, Script } from '../types';
import { AVAILABLE_TOWERS, uiConfigStore } from '../stores/UIConfigStore';
import { scriptStore } from '../stores/ScriptStore';
import { useTranslation } from '../utils/i18n';
import { footerText } from '../utils/footerText';
import { explanationForPage } from '../utils/explanationRichText';
import { DEFAULT_EXPLANATION_WIDTH, DEFAULT_LEGEND_WIDTH } from '../utils/defaultFooterComponents';

interface Props {
  open: boolean;
  onClose: () => void;
  script: Script | null;
  page: 1 | 2;
  onAddExplanation: (page: 1 | 2) => void;
  onEdit: (item: FooterComponent) => void;
  onEditExplanation: (value: RichTextDocument, layout: FooterComponent) => void;
}

const TowerImageDialog = observer(({ open, onClose, script, page, onAddExplanation, onEdit, onEditExplanation }: Props) => {
  const { language } = useTranslation();
  const s = footerText(language);
  const input = useRef<HTMLInputElement>(null);
  const components = script?.footerComponents || [];
  const onPage = components.filter(item => item.page === page && item.type !== 'stateLayout' && item.type !== 'list');
  const hasLegend = onPage.some(item => item.type === 'nightLegend');
  const add = (type: 'nightLegend' | 'image', url?: string, imageWidth?: number) => {
    if (!script) return;
    const item: FooterComponent = { id: `footer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, page,
      x: type === 'nightLegend' ? (100 - DEFAULT_LEGEND_WIDTH) / 2 : 2, y: 0,
      width: type === 'nightLegend' ? DEFAULT_LEGEND_WIDTH : imageWidth || 10,
      ...(type === 'nightLegend' ? { text: s.legendDefault, autoReserve: true, cloudOnly: true } : {}),
      ...(type === 'image' ? { url, opacity: 1 } : {}),
    };
    scriptStore.setFooterComponents([...components, item]);
  };
  const chooseImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) { alert(s.invalidFile); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result), picture = new Image();
      picture.onload = () => {
        const paper = page === 1 ? document.querySelector<HTMLElement>('#main_script') : document.querySelector<HTMLElement>('#footer-paper-2');
        const paperWidth = paper?.clientWidth || 800;
        const width = Math.max(4, Math.min(20, 110 * picture.naturalWidth / Math.max(1, picture.naturalHeight) / paperWidth * 100));
        add('image', url, width);
      };
      picture.src = url;
    };
    reader.readAsDataURL(file);
  };
  const layout = components.find(item => item.type === 'stateLayout' && item.page === page);
  const explanationLayout: FooterComponent = layout || { id: `state-layout-${page}`, type: 'stateLayout', page, x: 0, y: 0, width: DEFAULT_EXPLANATION_WIDTH };
  const explanation = script ? explanationForPage(script, page, language, uiConfigStore.config.enableTwoPageMode) : null;
  const removeExplanation = () => {
    const next = { ...explanationLayout, hidden: true };
    scriptStore.setFooterComponents(layout ? components.map(item => item.id === layout.id ? next : item) : [...components, next]);
  };
  const cardButton = { justifyContent: 'flex-start', textTransform: 'none', minHeight: 44, borderColor: '#cfc3ae', color: '#3e5949' } as const;
  return <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableScrollLock PaperProps={{ sx: { borderRadius: 2 } }}>
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ImageOutlined sx={{ color: '#526e58' }} />{s.title} · {page}</DialogTitle>
    <DialogContent dividers>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
        {AVAILABLE_TOWERS.map((tower) => {
          const exists = uiConfigStore.activeTowerImages.some(image => image.id === tower.id);
          return <Button key={tower.id} variant="outlined" sx={cardButton} startIcon={<Add />} disabled={exists}
            onClick={() => uiConfigStore.addTowerImage({ ...tower })}>{tower.id === 'back_tower' ? s.tower1 : tower.id === 'back_town' ? s.town : s.tower2}{exists ? ` · ${s.exists}` : ''}</Button>;
        })}
        <Button variant="outlined" sx={cardButton} startIcon={<Add />} onClick={() => input.current?.click()}>{s.image}</Button>
        <input ref={input} type="file" accept="image/*" hidden onChange={chooseImage} />
        <Button variant="outlined" sx={cardButton} startIcon={<Add />} disabled={hasLegend} onClick={() => add('nightLegend')}>{s.legend}{hasLegend ? ` · ${s.exists}` : ''}</Button>
        <Button variant="outlined" sx={cardButton} startIcon={<Add />} disabled={Boolean(explanation)}
          onClick={() => { onClose(); onAddExplanation(page); }}>{s.explanation}{explanation ? ` · ${s.exists}` : ''}</Button>
      </Box>
      <Typography variant="subtitle2" sx={{ mt: 2.5, mb: 1 }}>{s.active}</Typography>
      {uiConfigStore.activeTowerImages.map(image => <Box key={image.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', py: 1, borderBottom: '1px solid #e8e1d5' }}>
        <Box component="img" src={image.url} alt="" sx={{ width: 56, height: 42, objectFit: 'contain', background: '#f5f1e9', borderRadius: 1 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}><Typography variant="body2">{image.id === 'back_tower' ? s.tower1 : image.id === 'back_tower2' ? s.tower2 : image.id === 'back_town' ? s.town : s.image}</Typography>
          <Typography variant="caption">{s.opacity} · {Math.round(image.opacity * 100)}%</Typography>
          <Slider size="small" min={0} max={1} step={.05} value={image.opacity} aria-label={`${s.opacity} ${image.id}`}
            onChange={(_, n) => uiConfigStore.updateTowerImage(image.id, { opacity: n as number })} />
        </Box>
        <IconButton aria-label={`${s.remove} ${image.id}`} onClick={() => uiConfigStore.removeTowerImage(image.id)}><DeleteOutline /></IconButton>
      </Box>)}
      {onPage.map(item => <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, borderBottom: '1px solid #e8e1d5' }}>
        <Typography sx={{ flex: 1 }} variant="body2">{item.type === 'nightLegend' ? s.legend : item.type === 'image' ? s.image : (item.title || s.list)}</Typography>
        <IconButton aria-label={`${s.edit} ${item.id}`} onClick={() => { onClose(); onEdit(item); }}><EditOutlined /></IconButton>
        <IconButton aria-label={`${s.remove} ${item.id}`} onClick={() => scriptStore.setFooterComponents(components.filter(x => x.id !== item.id))}><DeleteOutline /></IconButton>
      </Box>)}
      {explanation && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, borderBottom: '1px solid #e8e1d5' }}>
        <Typography sx={{ flex: 1 }} variant="body2">{s.explanation}</Typography>
        <IconButton aria-label={`${s.edit} ${s.explanation}`} onClick={() => { onClose(); onEditExplanation(explanation, explanationLayout); }}><EditOutlined /></IconButton>
        <IconButton aria-label={`${s.remove} ${s.explanation}`} onClick={removeExplanation}><DeleteOutline /></IconButton>
      </Box>}
    </DialogContent>
    <DialogActions><Button onClick={onClose}>{s.close}</Button></DialogActions>
  </Dialog>;
});
export default TowerImageDialog;
