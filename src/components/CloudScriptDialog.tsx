import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
  List, ListItem, ListItemButton, ListItemText, ListItemIcon,
  Button, alpha, Tooltip, Chip,
} from '@mui/material';
import {
  Close, Delete, CloudDownload, CloudUpload,
} from '@mui/icons-material';
import { Cloud } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import { listScripts, loadScript, deleteScript, getStorageUsage, type CloudScript } from '../lib/cloudScripts';
import { alertSuccess, alertError } from '../utils/alert';

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleString();
}

export default observer(function CloudScriptDialog({
  open, onClose, onLoad,
}: {
  open: boolean; onClose: () => void; onLoad: (json: string, name: string) => void;
}) {
  const [scripts, setScripts] = useState<CloudScript[]>([]);
  const [usage, setUsage] = useState({ used: 0, max: 2 * 1024 * 1024 });

  const refresh = async () => {
    if (!authStore.isLoggedIn) return;
    const [list, u] = await Promise.all([listScripts(), getStorageUsage()]);
    setScripts(list);
    setUsage(u);
  };

  useEffect(() => { if (open) refresh(); }, [open]);

  const handleLoad = async (id: string, name: string) => {
    const json = await loadScript(id);
    if (json) {
      onLoad(json, name);
      onClose();
      alertSuccess(`Loaded "${name}"`);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteScript(id);
    alertSuccess('Deleted');
    refresh();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, maxHeight: '80vh' } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <Cloud size={22} strokeWidth={1.8} />
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>Cloud Scripts</Typography>
        <Chip
          label={`${fmtSize(usage.used)} / ${fmtSize(usage.max)}`}
          size="small"
          sx={{ borderRadius: 2, fontWeight: 600, mr: 1 }}
          color={usage.used > usage.max * 0.8 ? 'warning' : 'default'}
        />
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {!authStore.isLoggedIn ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Cloud size={40} strokeWidth={1} color="#999" />
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Sign in with GitHub to sync scripts to the cloud.
            </Typography>
            <Button variant="outlined" sx={{ mt: 2, borderRadius: 2 }}
              onClick={() => authStore.loginDialogOpen = true}>
              Sign in
            </Button>
          </Box>
        ) : scripts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Cloud size={40} strokeWidth={1} color="#999" />
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No saved scripts. Press Ctrl+S or click Save to upload.
            </Typography>
          </Box>
        ) : (
          <List dense>
            {scripts.map(s => (
              <ListItem key={s.id} disablePadding
                secondaryAction={
                  <Tooltip title="Delete" arrow>
                    <IconButton size="small" onClick={() => handleDelete(s.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemButton onClick={() => handleLoad(s.id, s.name)} sx={{ borderRadius: 3, mr: 5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Cloud size={18} strokeWidth={1.5} />
                  </ListItemIcon>
                  <ListItemText
                    primary={s.name}
                    secondary={`${fmtSize(s.size_bytes)} · ${fmtDate(s.updated_at)}`}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
});
