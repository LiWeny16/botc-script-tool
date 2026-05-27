import React, { useState, useEffect } from 'react';
import {
  Avatar, IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
  alpha, Box, Tooltip, Typography, LinearProgress,
} from '@mui/material';
import { Logout, Image, Storage } from '@mui/icons-material';
import { GitHub } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';
import { useTranslation } from '../../utils/i18n';

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default observer(function UserMenu() {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (anchor && authStore.isLoggedIn) {
      authStore.refreshStats();
      authStore.refreshApiQuota();
    }
  }, [anchor]);

  if (authStore.loading) return null;

  if (!authStore.isLoggedIn) {
    return (
      <Tooltip title={t('auth.signInWithGithub')} arrow>
        <IconButton
          size="small"
          onClick={() => authStore.loginDialogOpen = true}
          sx={{ bgcolor: alpha('#24292e', 0.08), '&:hover': { bgcolor: alpha('#24292e', 0.16) } }}
        >
          <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#24292e', 0.6) }}>
            <GitHub sx={{ fontSize: 16, color: 'white' }} />
          </Avatar>
        </IconButton>
      </Tooltip>
    );
  }

  const storagePct = authStore.storageMax > 0 ? (authStore.storageUsed / authStore.storageMax) * 100 : 0;
  const apiPct = (authStore.apiUsed / authStore.apiMax) * 100;

  return (
    <Box>
      <Tooltip title={authStore.displayName} arrow>
        <IconButton size="small" onClick={e => setAnchor(e.currentTarget)}>
          <Avatar
            src={authStore.avatarUrl}
            sx={{ width: 30, height: 30, border: '2px solid', borderColor: alpha('#6366f1', 0.5) }}
          >
            {authStore.displayName?.[0]?.toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { borderRadius: 3, mt: 1, minWidth: 240 } } }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600}>{authStore.displayName}</Typography>
          <Typography variant="caption" color="text.secondary">{authStore.user?.email}</Typography>
        </Box>

        {/* API Quota */}
        <Box sx={{ px: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Image sx={{ fontSize: 14, color: apiPct >= 100 ? 'error.main' : '#6366f1' }} />
            <Typography variant="caption" fontWeight={600}>
              {t('auth.apiGenerations')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {authStore.apiUsed}/{authStore.apiMax} today
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(apiPct, 100)}
            sx={{
              height: 6, borderRadius: 3, mb: 1.5,
              bgcolor: alpha('#6366f1', 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: apiPct >= 100 ? 'error.main' : '#6366f1',
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Storage */}
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Storage sx={{ fontSize: 14, color: storagePct >= 100 ? 'error.main' : '#6366f1' }} />
            <Typography variant="caption" fontWeight={600}>
              {t('auth.cloudStorage')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {fmtSize(authStore.storageUsed)} / {fmtSize(authStore.storageMax)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(storagePct, 100)}
            sx={{
              height: 6, borderRadius: 3,
              bgcolor: alpha('#6366f1', 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: storagePct >= 100 ? 'error.main' : '#6366f1',
                borderRadius: 3,
              },
            }}
          />
        </Box>

        <MenuItem onClick={() => { setAnchor(null); authStore.signOut(); }}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
          <ListItemText>{t('auth.signOut')}</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
});
