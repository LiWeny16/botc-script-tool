import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import {
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import React from 'react';

// 定义Props
interface UnlockModeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: string) => string;
}

const UnlockModeDialog: React.FC<UnlockModeDialogProps> = ({ open, onClose, onConfirm, t }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableScrollLock={true}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 2,
          pt: 3,
          px: 3,
        }}
      >
        <InfoIcon sx={{ fontSize: 32, color: '#ff9800' }} />
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
          {t('dialog.unlockModeTitle')}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            p: 2.5,
            backgroundColor: '#fff8e1',
            borderRadius: 2,
            border: '1px solid #ffe0b2',
          }}
        >
          <Typography variant="body2" sx={{ color: '#e65100', lineHeight: 1.7, fontSize: '0.95rem' }}>
            {t('dialog.unlockModeMessage')}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#757575', mt: 2, fontSize: '0.9rem' }}>
          {t('dialog.unlockModeNote')}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5, backgroundColor: '#fafafa' }}>
        <Button
          onClick={onClose}
          sx={{
            px: 3,
            py: 1,
            fontWeight: 500,
            color: '#757575',
            '&:hover': {
              backgroundColor: '#eeeeee',
            }
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          autoFocus
          sx={{
            px: 3.5,
            py: 1,
            fontWeight: 600,
            backgroundColor: '#ff9800',
            boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
            '&:hover': {
              backgroundColor: '#f57c00',
              boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)',
            }
          }}
        >
          {t('dialog.unlockAndEdit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnlockModeDialog;