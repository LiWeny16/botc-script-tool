import React, { useEffect, useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
  Button, alpha, Tooltip, Chip, TextField, InputAdornment, Paper,
  Pagination,
} from '@mui/material';
import { Close, Delete, Search } from '@mui/icons-material';
import { Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import { listScripts, loadScript, deleteScript, getStorageUsage, type CloudScript } from '../lib/cloudScripts';
import { alertSuccess } from '../utils/alert';
import { useTranslation } from '../utils/i18n';

const PAGE_SIZE = 10;
const MotionPaper = motion.create(Paper);

const cardVariant: Record<string, any> = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' },
  }),
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function fmtDate(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default observer(function CloudScriptDialog({
  open, onClose, onLoad,
}: {
  open: boolean; onClose: () => void; onLoad: (json: string, name: string) => void;
}) {
  const { t } = useTranslation();
  const [scripts, setScripts] = useState<CloudScript[]>([]);
  const [usage, setUsage] = useState({ used: 0, max: 2 * 1024 * 1024 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const refresh = async () => {
    if (!authStore.isLoggedIn) return;
    const [list, u] = await Promise.all([listScripts(), getStorageUsage()]);
    setScripts(list);
    setUsage(u);
  };

  useEffect(() => { if (open) { refresh(); setSearch(''); setPage(1); } }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return scripts;
    const q = search.toLowerCase();
    return scripts.filter(s => s.name.toLowerCase().includes(q));
  }, [scripts, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const handleLoad = async (id: string, name: string) => {
    const json = await loadScript(id);
    if (json) {
      onLoad(json, name);
      onClose();
      alertSuccess(`${t('cloudScripts.loaded')} "${name}"`);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await deleteScript(id);
    setDeleting(null);
    refresh();
  };

  const emptyView = (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <Cloud size={48} strokeWidth={1} color="#bbb" />
      </motion.div>
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        {search ? t('cloudScripts.emptySearch') : t('cloudScripts.empty')}
      </Typography>
      {!search && (
        <Typography variant="caption" color="text.disabled">
          {t('cloudScripts.uploadHint')}
        </Typography>
      )}
    </Box>
  );

  const loginView = (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <Cloud size={48} strokeWidth={1} color="#bbb" />
      </motion.div>
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        {t('cloudScripts.loginPrompt')}
      </Typography>
      <Button variant="outlined" sx={{ mt: 2, borderRadius: 2 }}
        onClick={() => authStore.loginDialogOpen = true}>
        {t('auth.signIn')}
      </Button>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            height: 520,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, flexShrink: 0 }}>
        <Cloud size={22} strokeWidth={1.8} />
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1, fontSize: '1.05rem' }}>
          {t('cloudScripts.title')}
        </Typography>
        <Chip
          label={`${fmtSize(usage.used)} / ${fmtSize(usage.max)}`}
          size="small"
          sx={{ borderRadius: 2, fontWeight: 600, mr: 0.5 }}
          color={usage.used > usage.max * 0.8 ? 'warning' : 'default'}
        />
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>

      {/* Search */}
      {authStore.isLoggedIn && (
        <Box sx={{ px: 3, pb: 1, flexShrink: 0 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={t('cloudScripts.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              sx: { borderRadius: 3, fontSize: '0.85rem' },
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}

      {/* Content */}
      <DialogContent sx={{ flex: 1, overflow: 'auto', pt: 1, pb: 1 }}>
        {!authStore.isLoggedIn ? loginView : (
          filtered.length === 0 ? emptyView : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1.5 }}>
              <AnimatePresence mode="wait">
                {paged.map((s, i) => (
                  <MotionPaper
                    key={s.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={cardVariant}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      cursor: 'pointer',
                      bgcolor: alpha('#6366f1', 0.04),
                      border: '1px solid',
                      borderColor: alpha('#6366f1', 0.1),
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: alpha('#6366f1', 0.1),
                        borderColor: alpha('#6366f1', 0.25),
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 16px ${alpha('#6366f1', 0.12)}`,
                      },
                    }}
                    onClick={() => handleLoad(s.id, s.name)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Cloud size={18} strokeWidth={1.5} style={{ marginTop: 2, flexShrink: 0, color: '#6366f1' }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.82rem',
                          }}
                        >
                          {s.name}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                          {fmtSize(s.size_bytes)} · {fmtDate(s.updated_at)}
                        </Typography>
                      </Box>
                      <Tooltip title="Delete" arrow>
                        <IconButton
                          size="small"
                          onClick={e => { e.stopPropagation(); handleDelete(s.id); }}
                          sx={{
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            '.MuiBox-root:hover &': { opacity: 1 },
                            '&:hover': { opacity: '1 !important' },
                            mt: -0.5,
                            mr: -0.5,
                          }}
                        >
                          <Delete sx={{ fontSize: 14, color: 'text.disabled' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </MotionPaper>
                ))}
              </AnimatePresence>
            </Box>
          )
        )}
      </DialogContent>

      {/* Pagination */}
      {authStore.isLoggedIn && pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pb: 2, flexShrink: 0 }}>
          <Pagination
            count={pages}
            page={page}
            onChange={(_, v) => setPage(v)}
            size="small"
            shape="rounded"
            siblingCount={0}
          />
        </Box>
      )}
    </Dialog>
  );
});
