import { Box, Typography, IconButton, Chip } from '@mui/material';
import { Close, Sync } from '@mui/icons-material';
import { useTranslation } from '../utils/i18n';

interface FileSyncBannerProps {
  fileName: string;
  onClose: () => void;
}

const FileSyncBanner = ({ fileName, onClose }: FileSyncBannerProps) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1976d2',
        color: '#fff',
        px: 2,
        py: 1.5,
        borderRadius: '4px 4px 0 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
        <Sync
          sx={{
            animation: 'rotate 2s linear infinite',
            '@keyframes rotate': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
            flexShrink: 0,
          }}
        />
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: '0.9rem',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t('fileSync.syncing')}: <strong>{fileName}</strong>
        </Typography>
        <Chip
          label={t('fileSync.experimental')}
          size="small"
          sx={{
            height: 24,
            fontSize: '0.7rem',
            backgroundColor: '#ff9800',
            color: '#fff',
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        />
      </Box>
      <IconButton
        size="small"
        onClick={onClose}
        sx={{
          color: '#fff',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          },
          flexShrink: 0,
        }}
        aria-label={t('common.close')}
      >
        <Close />
      </IconButton>
    </Box>
  );
};

export default FileSyncBanner;

