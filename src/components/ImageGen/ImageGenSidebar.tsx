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
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Divider,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Collections as CollectionsIcon,
  AccountTree as WorkflowIcon,
  PhotoLibrary as GalleryIcon,
  Folder as ProjectIcon,
  PlayArrow as ApplyIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../../utils/i18n';
import { imageGenStore, type SidebarSection } from '../../stores/ImageGenStore';
import { setReferenceDragData, setRefDragFromPanel } from '../../stores/imageGenCanvasTypes';
import { WORKFLOW_TEMPLATES } from '../../data/imageGenWorkflows';
import { CHARACTERS_EN, getCharacterInDictionary } from '../../data/canonicalCharacters';
import { TEAM_COLORS } from '../../theme/colors';
import { IMAGE_PATH_MAP } from '../../utils/imagePathMap';
import type { TranslationKey } from '../../utils/i18n/index';

const TEAM_ORDER = ['townsfolk', 'outsider', 'minion', 'demon', 'traveler', 'fabled', 'loric'];
const PANEL_WIDTH = 300;
const RAIL_WIDTH = 56;

const TEAM_I18N_KEYS: Record<string, TranslationKey> = {
  townsfolk: 'imageGen.teams.townsfolk',
  outsider: 'imageGen.teams.outsider',
  minion: 'imageGen.teams.minion',
  demon: 'imageGen.teams.demon',
  traveler: 'imageGen.teams.traveler',
  fabled: 'imageGen.teams.fabled',
  loric: 'imageGen.teams.loric',
};

const SECTIONS: { id: SidebarSection; icon: React.ReactNode; labelKey: TranslationKey }[] = [
  { id: 'references', icon: <CollectionsIcon sx={{ fontSize: 20 }} />, labelKey: 'imageGen.sidebar.references' },
  { id: 'workflows', icon: <WorkflowIcon sx={{ fontSize: 20 }} />, labelKey: 'imageGen.sidebar.workflows' },
  { id: 'gallery', icon: <GalleryIcon sx={{ fontSize: 20 }} />, labelKey: 'imageGen.sidebar.gallery' },
  { id: 'projects', icon: <ProjectIcon sx={{ fontSize: 20 }} />, labelKey: 'imageGen.sidebar.projects' },
];

const MAX_PER_TEAM = 24;

function buildLocalIconPath(filename: string, team: string) {
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

const ReferencesSection = observer(function ReferencesSection() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const dragDidOccur = useRef(false);
  const activeTeam = imageGenStore.activeTeamTab;

  const characters = useMemo(() => {
    const list = charactersByTeam.get(activeTeam) || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(c => c.name.toLowerCase().includes(q) || c.id.includes(q));
  }, [activeTeam, search]);

  const addToCanvas = useCallback((payload: { sourceId: string; imageUrl: string; name: string; team?: string }) => {
    imageGenStore.addReferenceNode(payload);
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      addToCanvas({
        sourceId: `custom_${Date.now()}`,
        imageUrl: e.target?.result as string,
        name: file.name || t('imageGen.refPanel.custom'),
      });
    };
    reader.readAsDataURL(file);
  }, [addToCanvas, t]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Typography variant="caption" sx={{ px: 1.5, pt: 0.5, color: 'text.disabled', fontSize: '0.68rem' }}>
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
          const payload = { sourceId: c.id, imageUrl: c.image, name: c.name, team: activeTeam };
          return (
            <Paper
              key={c.id}
              elevation={0}
              draggable
              onDragStart={(e) => { dragDidOccur.current = false; startDrag(e, payload); }}
              onDrag={(e) => { e.preventDefault(); dragDidOccur.current = true; }}
              onDragEnd={endDrag}
              onClick={() => {
                if (dragDidOccur.current) { dragDidOccur.current = false; return; }
                addToCanvas(payload);
              }}
              sx={{
                cursor: 'grab',
                borderRadius: 1.5,
                overflow: 'hidden',
                border: '2px solid transparent',
                '&:hover': { borderColor: TEAM_COLORS[activeTeam] || '#9c27b0', transform: 'scale(1.06)' },
                '&:active': { cursor: 'grabbing' },
              }}
            >
              <Box
                component="img"
                src={c.image}
                alt={c.name}
                sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', pointerEvents: 'none' }}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  (e.target as HTMLImageElement).src = '/imgs/icons/75px-Di.png';
                }}
              />
            </Paper>
          );
        })}
      </Box>
      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = '';
        }} />
        <Box
          onClick={() => fileInputRef.current?.click()}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
            py: 1, borderRadius: 2, border: '2px dashed', borderColor: 'divider',
            cursor: 'pointer', fontSize: '0.82rem', color: 'text.secondary',
            '&:hover': { borderColor: '#9c27b0', color: '#9c27b0' },
          }}
        >
          <AddIcon sx={{ fontSize: 18 }} />
          <span>{t('imageGen.uploadCustom')}</span>
        </Box>
      </Box>
    </Box>
  );
});

const WorkflowsSection = observer(function WorkflowsSection() {
  const { t } = useTranslation();
  return (
    <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {t('imageGen.workflow.hint')}
      </Typography>
      {WORKFLOW_TEMPLATES.map(wf => (
        <Paper
          key={wf.id}
          elevation={0}
          sx={{
            p: 1.25,
            mb: 1,
            borderRadius: 2,
            border: '1px solid',
            borderColor: alpha('#9c27b0', 0.15),
            cursor: 'pointer',
            '&:hover': { bgcolor: alpha('#9c27b0', 0.04), borderColor: alpha('#9c27b0', 0.35) },
          }}
          onClick={() => imageGenStore.applyWorkflow(wf.id)}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <ApplyIcon sx={{ fontSize: 18, color: '#9c27b0', mt: 0.25 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                {t(wf.nameKey)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.35 }}>
                {t(wf.descKey)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );
});

const GallerySection = observer(function GallerySection() {
  const { t } = useTranslation();
  const items = imageGenStore.galleryItems;

  return (
    <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1 }}>
      {items.length === 0 ? (
        <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center', display: 'block', py: 3 }}>
          {t('imageGen.gallery.empty')}
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
          {items.map(item => (
            <Paper
              key={item.id}
              elevation={0}
              sx={{ borderRadius: 2, overflow: 'hidden', cursor: 'pointer', border: '1px solid', borderColor: 'divider' }}
              onClick={() => imageGenStore.addGalleryToCanvas(item)}
            >
              <Box component="img" src={item.dataUrl} alt="" sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
              {item.promptSnippet && (
                <Typography variant="caption" noWrap sx={{ display: 'block', px: 0.75, py: 0.5, fontSize: '0.65rem' }}>
                  {item.promptSnippet}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
});

const ProjectsSection = observer(function ProjectsSection() {
  const { t } = useTranslation();
  const [name, setName] = useState(imageGenStore.currentProjectName);

  useEffect(() => {
    setName(imageGenStore.currentProjectName);
  }, [imageGenStore.currentProjectName]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ px: 1.5, py: 1 }}>
        <TextField
          size="small"
          fullWidth
          label={t('imageGen.project.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Button
          fullWidth
          size="small"
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => imageGenStore.saveCurrentProject(name)}
          sx={{ mb: 0.75, borderRadius: 2, textTransform: 'none' }}
        >
          {t('imageGen.project.save')}
        </Button>
        <Button
          fullWidth
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => imageGenStore.createNewProject()}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          {t('imageGen.project.new')}
        </Button>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List dense disablePadding>
          {imageGenStore.projects.map(p => (
            <ListItemButton
              key={p.id}
              selected={p.id === imageGenStore.currentProjectId}
              onClick={() => imageGenStore.loadProject(p.id)}
              sx={{ py: 1 }}
            >
              {p.thumbnail ? (
                <ListItemIcon sx={{ minWidth: 44 }}>
                  <Box component="img" src={p.thumbnail} alt="" sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover' }} />
                </ListItemIcon>
              ) : (
                <ListItemIcon sx={{ minWidth: 44 }}>
                  <ProjectIcon color="disabled" />
                </ListItemIcon>
              )}
              <ListItemText
                primary={p.name}
                secondary={new Date(p.updatedAt).toLocaleString()}
                primaryTypographyProps={{ fontSize: '0.82rem', noWrap: true }}
                secondaryTypographyProps={{ fontSize: '0.68rem' }}
              />
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); void imageGenStore.deleteProjectById(p.id); }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  );
});

export default observer(function ImageGenSidebar() {
  const { t } = useTranslation();
  const collapsed = imageGenStore.leftPanelCollapsed;
  const section = imageGenStore.sidebarSection;
  const width = collapsed ? RAIL_WIDTH : PANEL_WIDTH;

  useEffect(() => {
    const onDragEnd = () => setRefDragFromPanel(false);
    window.addEventListener('dragend', onDragEnd);
    return () => window.removeEventListener('dragend', onDragEnd);
  }, []);

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      if (collapsed || section !== 'references' || !document.hasFocus()) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              imageGenStore.addReferenceNode({
                sourceId: `custom_${Date.now()}`,
                imageUrl: ev.target?.result as string,
                name: file.name,
              });
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [collapsed, section]);

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
        zIndex: 5,
      }}
    >
      {collapsed ? (
        <Box sx={{ width: RAIL_WIDTH, display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1, gap: 0.5 }}>
          <Tooltip title={t('imageGen.refPanel.expand')} placement="right">
            <IconButton size="small" onClick={() => imageGenStore.expandLeftPanel()}>
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
          {SECTIONS.map(s => (
            <Tooltip key={s.id} title={t(s.labelKey)} placement="right">
              <IconButton
                size="small"
                onClick={() => imageGenStore.setSidebarSection(s.id)}
                sx={{ color: section === s.id ? '#9c27b0' : 'text.secondary' }}
              >
                {s.icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
      ) : (
        <Box sx={{ width: PANEL_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, py: 0.75, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem', pl: 0.5 }}>
              {t('imageGen.sidebar.title')}
            </Typography>
            <IconButton size="small" onClick={() => imageGenStore.collapseLeftPanel()}>
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          <List dense sx={{ py: 0.5, borderBottom: 1, borderColor: 'divider' }}>
            {SECTIONS.map(s => (
              <ListItemButton
                key={s.id}
                selected={section === s.id}
                onClick={() => imageGenStore.setSidebarSection(s.id)}
                sx={{ py: 0.75, borderRadius: 1, mx: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{s.icon}</ListItemIcon>
                <ListItemText primary={t(s.labelKey)} primaryTypographyProps={{ fontSize: '0.82rem' }} />
              </ListItemButton>
            ))}
          </List>
          {section === 'references' && <ReferencesSection />}
          {section === 'workflows' && <WorkflowsSection />}
          {section === 'gallery' && <GallerySection />}
          {section === 'projects' && <ProjectsSection />}
        </Box>
      )}
    </Box>
  );
});
