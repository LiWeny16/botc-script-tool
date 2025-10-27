import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Alert,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { uiConfigStore } from '../stores/UIConfigStore';
import { useTranslation } from '../utils/i18n';
import type { CustomFont } from '../stores/UIConfigStore';

interface FontUploaderProps {
  open: boolean;
  onClose: () => void;
}

const FontUploader = observer(({ open, onClose }: FontUploaderProps) => {
  const { t } = useTranslation();
  const [fontName, setFontName] = useState('');
  const [fontFamily, setFontFamily] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const validTypes = ['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/x-font-ttf', 'application/x-font-otf'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['ttf', 'otf', 'woff', 'woff2'];

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension || '')) {
      setError(t('fontUploader.errorInvalidFile'));
      return;
    }

    // 检查文件大小（限制为 15MB）
    if (file.size > 15 * 1024 * 1024) {
      setError(t('fontUploader.errorFileSize'));
      return;
    }

    setSelectedFile(file);
    setError('');

    // 如果用户没有输入字体名称，使用文件名
    if (!fontName) {
      const name = file.name.replace(/\.[^/.]+$/, '');
      setFontName(name);
      setFontFamily(name.replace(/\s+/g, '-'));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !fontName.trim() || !fontFamily.trim()) {
      setError(t('fontUploader.errorAllFields'));
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 读取文件为 base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string;

          const newFont: CustomFont = {
            id: `custom-${Date.now()}`,
            name: fontName.trim(),
            fontFamily: fontFamily.trim(),
            dataUrl,
          };

          await uiConfigStore.addCustomFont(newFont);

          // 重置表单
          setFontName('');
          setFontFamily('');
          setSelectedFile(null);
          setUploading(false);
        } catch (err) {
          console.error('Failed to save font:', err);
          setError(t('fontUploader.errorUpload'));
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError(t('fontUploader.errorReadFile'));
        setUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setError(t('fontUploader.errorUpload'));
      setUploading(false);
    }
  };

  const handleDelete = async (fontId: string) => {
    if (window.confirm(t('fontUploader.deleteConfirm'))) {
      try {
        await uiConfigStore.removeCustomFont(fontId);
      } catch (err) {
        console.error('Failed to delete font:', err);
        setError(t('fontUploader.errorUpload'));
      }
    }
  };

  const handleClose = () => {
    setFontName('');
    setFontFamily('');
    setSelectedFile(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('fontUploader.title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* 上传新字体 */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {t('fontUploader.uploadNew')}
          </Typography>

          <TextField
            label={t('fontUploader.fontName')}
            value={fontName}
            onChange={(e) => setFontName(e.target.value)}
            fullWidth
            size="small"
            helperText={t('fontUploader.fontNameHelper')}
          />

          <TextField
            label={t('fontUploader.fontFamily')}
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            fullWidth
            size="small"
            helperText={t('fontUploader.fontFamilyHelper')}
          />

          <Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
            >
              {selectedFile ? selectedFile.name : t('fontUploader.selectFile')}
              <input
                type="file"
                hidden
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleFileSelect}
              />
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {t('fontUploader.fileHelper')}
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleUpload}
            disabled={!selectedFile || !fontName.trim() || !fontFamily.trim() || uploading}
          >
            {uploading ? t('fontUploader.uploading') : t('fontUploader.addFont')}
          </Button>

          {/* 已上传的字体列表 */}
          {uiConfigStore.config.customFonts.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>
                {t('fontUploader.uploadedFonts')} ({uiConfigStore.config.customFonts.length}{t('fontUploader.fontCount')})
              </Typography>

              <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                {uiConfigStore.config.customFonts.map((font) => (
                  <ListItem key={font.id}>
                    <ListItemText
                      primary={font.name}
                      secondary={`Font Family: ${font.fontFamily}`}
                      primaryTypographyProps={{
                        sx: { fontFamily: font.fontFamily },
                      }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(font.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('fontUploader.close')}</Button>
      </DialogActions>
    </Dialog>
  );
});

export default FontUploader;
