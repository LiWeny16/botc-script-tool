import React, { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  IconButton,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../../utils/i18n';
import { imageGenStore } from '../../stores/ImageGenStore';
import { setReferenceDragData, setRefDragFromPanel } from '../../stores/imageGenCanvasTypes';
import { CHARACTERS_EN, getCharacterInDictionary } from '../../data/canonicalCharacters';
import { TEAM_COLORS } from '../../theme/colors';
import { IMAGE_PATH_MAP } from '../../utils/imagePathMap';
import type { TranslationKey } from '../../utils/i18n/index';

const TEAM_ORDER = ['townsfolk', 'outsider', 'minion', 'demon', 'traveler', 'fabled', 'loric'];
const PANEL_WIDTH = 280;
const RAIL_WIDTH = 52;

const TEAM_I18N_KEYS: Record<string, TranslationKey> = {
  townsfolk: 'imageGen.teams.townsfolk',
  outsider: 'imageGen.teams.outsider',
  minion: 'imageGen.teams.minion',
  demon: 'imageGen.teams.demon',
  traveler: 'imageGen.teams.traveler',
  fabled: 'imageGen.teams.fabled',
  loric: 'imageGen.teams.loric',
};

const MAX_PER_TEAM = 24;

function buildLocalIconPath(filename: string, team: string): string {
  return `/imgs/icons/${team}/${filename}`;
}

function buildCharactersByTeam() {
  const map = new Map<string, Array<{ id: string; name: string; image: string }>>();
  for (const [filename, team] of Object.entries(IMAGE_PATH_MAP)) {
    const normalizedTeam = team.toLowerCase();
    if (!team || !TEAM_ORDER.includes(normalizedTeam)) continue;
    if (!map.has(normalizedTeam)) map.set(normalizedTeam, []);
    if (map.get(normalizedTeam)!.length >= MAX_PER_TEAM) continue;
    const charId = filename.replace(/\.(png|webp)$/, '');
    const char = getCharacterInDictionary(CHARACTERS_EN, charId);
    map.get(normalizedTeam)!.push({
      id: charId,
      name: char?.name ?? charId.replace(/_/g, ' '),
      image: buildLocalIconPath(filename, team),
    });
  }
  return map;
}

const charactersByTeam = buildCharactersByTeam();

function startDrag(e: React.DragEvent, payload: { sourceId: string; imageUrl: string; name: string; team?: string }) {
  setRefDragFromPanel(true);
  setReferenceDragData(e.dataTransfer, payload);
}

function endDrag() {
  setRefDragFromPanel(false);
}

export default observer(function ReferencePanel() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  const collapsed = imageGenStore.leftPanelCollapsed;
  const width = collapsed ? RAIL_WIDTH : PANEL_WIDTH;

  const activeTeam = imageGenStore.activeTeamTab;
  const characters = useMemo(() => {
    const list = charactersByTeam.get(activeTeam) || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(c => c.name.toLowerCase().includes(q) || c.id.includes(q));
  }, [activeTeam, search]);

  const dragDidOccur = useRef(false);

  const addToCanvas = useCallback((payload: { sourceId: string; imageUrl: string; name: string; team?: string }) => {
    imageGenStore.addReferenceNode(payload);
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      addToCanvas({
        sourceId: `custom_${Date.now()}`,
        imageUrl: dataUrl,
        name: file.name || t('imageGen.refPanel.custom'),
      });
    };
    reader.readAsDataURL(file);
  }, [addToCanvas, t]);

  useEffect(() => {
    const onDragEnd = () => setRefDragFromPanel(false);
    window.addEventListener('dragend', onDragEnd);
    return () => window.removeEventListener('dragend', onDragEnd);
  }, []);

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      if (collapsed || !document.hasFocus()) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleFileUpload(file);
          break;
        }
      }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [handleFileUpload, collapsed]);

  return (
    <Box
      component={motion.div}
      animate={{ width }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      sx={{
        flexShrink: 0,
        height: '100%',
        overflow: 'hidden',
        bgcolor: 'white',
        borderRight: '1px solid',
        borderColor: alpha('#000', 0.06),
        display: 'flex',
        flexDirection: 'column',
        zIndex: 5,
      }}
    >
      {collapsed ? (
        <Box
          sx={{
            width: RAIL_WIDTH,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 1.5,
            gap: 1,
          }}
        >
          <Tooltip title={t('imageGen.refPanel.expand')} placement="right" arrow>
            <IconButton size="small" onClick={() => imageGenStore.expandLeftPanel()}>
              <ChevronRightIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box sx={{ width: PANEL_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {t('imageGen.referenceImages')}
            </Typography>
            <Tooltip title={t('imageGen.refPanel.collapse')} arrow>
              <IconButton size="small" onClick={() => imageGenStore.collapseLeftPanel()}>
                <ChevronLeftIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Typography variant="caption" sx={{ px: 1.5, pt: 0.75, color: 'text.disabled', fontSize: '0.68rem' }}>
            {t('imageGen.refPanel.dragHint')}
          </Typography>

          <Box sx={{ px: 1.5, pt: 0.75 }}>
            <TextField
              size="small"
              fullWidth
              placeholder={t('imageGen.refPanel.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, fontSize: '0.82rem' },
              }}
            />
          </Box>

          <Tabs
            value={activeTeam}
            onChange={(_, v) => imageGenStore.setActiveTeamTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 36,
              px: 1,
              '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: '0.7rem', textTransform: 'none', px: 1.25 },
            }}
          >
            {TEAM_ORDER.map(team => (
              <Tab key={team} label={t(TEAM_I18N_KEYS[team]!)} value={team} />
            ))}
          </Tabs>

          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              px: 1.5,
              pb: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 0.75,
              alignContent: 'start',
            }}
          >
            {characters.map(c => {
              const payload = {
                sourceId: c.id,
                imageUrl: c.image,
                name: c.name,
                team: activeTeam,
              };
              return (
                <Paper
                  key={c.id}
                  elevation={0}
                  draggable
                  onDragStart={(e) => {
                    dragDidOccur.current = false;
                    startDrag(e, payload);
                  }}
                  onDrag={(e) => {
                    e.preventDefault();
                    dragDidOccur.current = true;
                  }}
                  onDragEnd={endDrag}
                  onClick={() => {
                    if (dragDidOccur.current) {
                      dragDidOccur.current = false;
                      return;
                    }
                    addToCanvas(payload);
                  }}
                  sx={{
                    cursor: 'grab',
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    border: '2px solid transparent',
                    transition: 'all 0.15s',
                    '&:hover': {
                      borderColor: TEAM_COLORS[activeTeam] || '#9c27b0',
                      transform: 'scale(1.06)',
                    },
                    '&:active': { cursor: 'grabbing' },
                  }}
                >
                  <Box
                    component="img"
                    src={c.image}
                    alt={c.name}
                    sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      (e.target as HTMLImageElement).src = '/imgs/icons/75px-Di.png';
                    }}
                  />
                </Paper>
              );
            })}
          </Box>

          <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                py: 1.25,
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'divider',
                cursor: 'pointer',
                color: 'text.secondary',
                fontSize: '0.82rem',
                transition: 'all 0.15s',
                '&:hover': { borderColor: '#9c27b0', color: '#9c27b0', bgcolor: alpha('#9c27b0', 0.04) },
              }}
            >
              <AddIcon sx={{ fontSize: 18 }} />
              <span>{t('imageGen.uploadCustom')}</span>
            </Box>
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.75, color: 'text.disabled' }}>
              {t('imageGen.pasteToUpload')}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
});
