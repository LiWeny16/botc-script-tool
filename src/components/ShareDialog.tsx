import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Button, TextField,
  Typography, Box, IconButton, CircularProgress, alpha, Tooltip,
} from '@mui/material';
import { ContentCopy, Close, IosShare } from '@mui/icons-material';
import { Cloud } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import { authStore } from '../stores/AuthStore';
import { shareScript } from '../lib/cloudScripts';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  script: any;
  originalJson: string;
  normalizedJson: string;
}

const ShareDialog = ({ open, onClose, script, originalJson, normalizedJson }: ShareDialogProps) => {
  const { t } = useTranslation();
  const [cloudShareUrl, setCloudShareUrl] = useState('');
  const [cloudSharing, setCloudSharing] = useState(false);

  const handleShare = async () => {
    if (!authStore.isLoggedIn) {
      authStore.loginDialogOpen = true;
      return;
    }
    setCloudSharing(true);
    const json = normalizedJson || originalJson;
    const name = script?.title || 'Untitled Script';
    const id = await shareScript(name, json);
    setCloudSharing(false);
    if (id) {
      setCloudShareUrl(`${window.location.origin}/#/shared/${id}`);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4 } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Cloud size={20} strokeWidth={1.8} />
        <Typography fontWeight={700} sx={{ flex: 1 }}>{t('share.title')}</Typography>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!authStore.isLoggedIn ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Cloud size={36} strokeWidth={1} color="#999" />
            <Typography color="text.secondary" sx={{ mt: 1.5, mb: 2 }}>
              {t('share.loginPrompt')}
            </Typography>
            <Button variant="outlined" onClick={() => authStore.loginDialogOpen = true}
              sx={{ borderRadius: 2, textTransform: 'none' }}>
              {t('auth.signIn')}
            </Button>
          </Box>
        ) : !cloudShareUrl ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box sx={{ py: 3 }}>
              <Cloud size={44} strokeWidth={1} style={{ color: alpha('#6366f1', 0.6) }} />
            </Box>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create a public link anyone can open. No login required for viewers.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={cloudSharing ? <CircularProgress size={18} color="inherit" /> : <IosShare />}
              onClick={handleShare}
              disabled={cloudSharing}
              sx={{
                borderRadius: 3, textTransform: 'none', fontWeight: 700, px: 4, py: 1.25,
                bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' },
              }}
            >
              {cloudSharing ? 'Creating...' : 'Generate Share Link'}
            </Button>
          </Box>
        ) : (
          <Box>
            <Box
              sx={{
                p: 2, borderRadius: 3, bgcolor: alpha('#22c55e', 0.08),
                border: '1px solid', borderColor: alpha('#22c55e', 0.2),
                display: 'flex', alignItems: 'center', gap: 1.5, mb: 2,
              }}
            >
              <Box
                sx={{
                  width: 10, height: 10, borderRadius: '50%',
                  bgcolor: '#22c55e', flexShrink: 0,
                }}
              />
              <Typography variant="body2" fontWeight={600} color="#16a34a">
                Link created! Anyone can view this script.
              </Typography>
            </Box>
            <TextField
              fullWidth
              value={cloudShareUrl}
              InputProps={{ readOnly: true }}
              size="small"
              sx={{ mb: 1.5, '& input': { fontSize: '0.85rem' } }}
              autoFocus
              onFocus={e => e.target.select()}
            />
            <Tooltip title="Copied!" arrow>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={() => { navigator.clipboard.writeText(cloudShareUrl); }}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Copy Link
              </Button>
            </Tooltip>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
