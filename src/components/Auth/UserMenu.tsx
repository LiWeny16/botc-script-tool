import React, { useState } from 'react';
import {
  Avatar, IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
  alpha, Box, Tooltip, Typography,
} from '@mui/material';
import { Logout, Key } from '@mui/icons-material';
import { GitHub } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';

export default observer(function UserMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (authStore.loading) return null;

  if (!authStore.isLoggedIn) {
    return (
      <Tooltip title="Sign in with GitHub" arrow>
        <IconButton
          size="small"
          onClick={() => authStore.loginDialogOpen = true}
          sx={{
            bgcolor: alpha('#24292e', 0.08),
            '&:hover': { bgcolor: alpha('#24292e', 0.16) },
          }}
        >
          <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#24292e', 0.6) }}>
            <GitHub sx={{ fontSize: 16, color: 'white' }} />
          </Avatar>
        </IconButton>
      </Tooltip>
    );
  }

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
        slotProps={{ paper: { sx: { borderRadius: 3, mt: 1, minWidth: 200 } } }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {authStore.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {authStore.user?.email}
          </Typography>
        </Box>
        <MenuItem disabled>
          <ListItemIcon><Key fontSize="small" /></ListItemIcon>
          <ListItemText>API Keys</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setAnchor(null); authStore.signOut(); }}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
          <ListItemText>Sign out</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
});
