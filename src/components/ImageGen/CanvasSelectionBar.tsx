import React from 'react';
import { Box, Typography, IconButton, Tooltip, alpha } from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../../utils/i18n';
import { imageGenStore } from '../../stores/ImageGenStore';

export default observer(function CanvasSelectionBar() {
  const { t } = useTranslation();
  const count = imageGenStore.selectedNodeIds.length;
  if (count === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.75,
        borderRadius: 3,
        bgcolor: alpha('#fff', 0.9),
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        pointerEvents: 'auto',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {t('imageGen.selection.count').replace('{count}', String(count))}
      </Typography>
      <Tooltip title={t('imageGen.selection.delete')} arrow>
        <IconButton size="small" onClick={() => imageGenStore.removeSelectedNodes()} color="error">
          <DeleteIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('imageGen.selection.clear')} arrow>
        <IconButton size="small" onClick={() => imageGenStore.clearSelection()}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
});
