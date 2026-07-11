import { useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Slider,
  Stack,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  RestartAlt as RestartAltIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { uiConfigStore } from '../stores/UIConfigStore';
import { useTranslation } from '../utils/i18n';

interface TowerImageDialogProps {
  open: boolean;
  onClose: () => void;
}

const TowerImageDialog = observer(({ open, onClose }: TowerImageDialogProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      alert(t('towerImage.invalidFileType'));
      return;
    }

    // 2MB size check
    if (file.size > 2 * 1024 * 1024) {
      alert(t('towerImage.fileTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const id = 'tower_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      uiConfigStore.addTowerImage({
        id,
        url: dataUrl,
        x: 50,
        y: 0,
        scale: 1.0,
        opacity: 0.5,
        isDefault: false,
      });
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Restore default tower images? This will remove all custom images.')) {
      uiConfigStore.resetTowerImages();
    }
  };

  const images = uiConfigStore.activeTowerImages;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableScrollLock
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
        },
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
        <Box
          component="span"
          sx={{
            fontSize: 32,
            lineHeight: 1,
          }}
        >
          <ImageIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        </Box>
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
          Tower Images
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Stack spacing={2}>
          {/* Add Image button */}
          <Button
            variant="outlined"
            component="label"
            startIcon={<AddIcon />}
            fullWidth
          >
            Add Image
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileSelect}
            />
          </Button>

          <Divider />

          {/* Empty state */}
          {images.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No tower images. Add one above or restore defaults.
            </Typography>
          )}

          {/* Image list */}
          {images.map((img) => (
            <Box
              key={img.id}
              sx={{
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box
                  component="img"
                  src={img.url}
                  alt={img.id}
                  sx={{
                    width: 64,
                    height: 64,
                    objectFit: 'contain',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 'medium' }}>
                    {img.isDefault ? 'Default' : 'Custom'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                    {img.id.length > 25 ? img.id.substring(0, 25) + '...' : img.id}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => uiConfigStore.removeTowerImage(img.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              <Box>
                <Typography variant="caption" gutterBottom>
                  Position X: {img.x}%
                </Typography>
                <Slider
                  value={img.x}
                  onChange={(_, value) => uiConfigStore.updateTowerImage(img.id, { x: value as number })}
                  min={0}
                  max={100}
                  step={1}
                  size="small"
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box>
                <Typography variant="caption" gutterBottom>
                  Opacity: {img.opacity.toFixed(2)}
                </Typography>
                <Slider
                  value={img.opacity}
                  onChange={(_, value) => uiConfigStore.updateTowerImage(img.id, { opacity: value as number })}
                  min={0}
                  max={1}
                  step={0.05}
                  size="small"
                  valueLabelDisplay="auto"
                />
              </Box>

              <Box>
                <Typography variant="caption" gutterBottom>
                  Scale: {img.scale.toFixed(2)}
                </Typography>
                <Slider
                  value={img.scale}
                  onChange={(_, value) => uiConfigStore.updateTowerImage(img.id, { scale: value as number })}
                  min={0.2}
                  max={2}
                  step={0.05}
                  size="small"
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, bgcolor: '#fafafa', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<RestartAltIcon />}
          onClick={handleRestoreDefaults}
        >
          Restore Defaults
        </Button>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default TowerImageDialog;
