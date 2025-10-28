import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Paper,
  Slider,
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { useTranslation } from '../utils/i18n';

interface SecondPageTitleEditDialogProps {
  open: boolean;
  title: string;
  titleImage?: string;
  fontSize?: number;
  imageSize?: number;
  useImage?: boolean;  // 是否使用图片标题
  defaultImageUrl?: string;  // 从meta获取的默认图片URL
  onClose: () => void;
  onSave: (data: {
    title: string;
    titleImage?: string;
    fontSize?: number;
    imageSize?: number;
    useImage: boolean;
  }) => void;
}

const SecondPageTitleEditDialog = ({
  open,
  title,
  titleImage,
  fontSize,
  imageSize,
  useImage: propUseImage,
  defaultImageUrl,
  onClose,
  onSave,
}: SecondPageTitleEditDialogProps) => {
  const { t, language } = useTranslation();
  const [useImage, setUseImage] = useState(propUseImage !== undefined ? propUseImage : !!titleImage);
  const [formData, setFormData] = useState({
    title: title || '',
    titleImage: titleImage || defaultImageUrl || '',
  });
  const [dragActive, setDragActive] = useState(false);
  const [formFontSize, setFormFontSize] = useState(fontSize || 48);
  const [formImageSize, setFormImageSize] = useState(imageSize || 200);

  // 判断是否是base64图片
  const isBase64Image = (str: string) => {
    return str.startsWith('data:image');
  };

  // 当 props 变化时更新表单数据
  useEffect(() => {
    setUseImage(propUseImage !== undefined ? propUseImage : !!titleImage);
    setFormData({
      title: title || '',
      titleImage: titleImage || defaultImageUrl || '',
    });
    setFormFontSize(fontSize || 48);
    setFormImageSize(imageSize || 200);
  }, [open, title, titleImage, fontSize, imageSize, propUseImage, defaultImageUrl]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          setFormData((prev) => ({ ...prev, titleImage: imageUrl }));
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          setFormData((prev) => ({ ...prev, titleImage: imageUrl }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSave = () => {
    // 判断是否是base64图片
    const isBase64 = formData.titleImage.startsWith('data:image');
    
    const dataToSave = {
      title: formData.title,
      // 如果不使用图片且是base64，删除；如果是URL，保留
      titleImage: useImage ? formData.titleImage : (isBase64 ? undefined : formData.titleImage),
      fontSize: formFontSize,
      imageSize: formImageSize,
      useImage: useImage,  // 保存使用图片的标志
    };
    
    onSave(dataToSave);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {t('title.editSecondPage')}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* 标题类型切换 */}
          <FormControlLabel
            control={
              <Switch
                checked={useImage}
                onChange={(e) => setUseImage(e.target.checked)}
              />
            }
            label={t('title.useImage')}
          />

          {useImage ? (
            /* 图片上传区域 */
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('title.titleImage')}
              </Typography>
              <Paper
                variant="outlined"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: dragActive ? 'action.hover' : 'background.paper',
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  borderColor: dragActive ? 'primary.main' : 'divider',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                  id="second-page-title-image-upload"
                />
                <label htmlFor="second-page-title-image-upload" style={{ cursor: 'pointer' }}>
                  {formData.titleImage ? (
                    <Box>
                      <img
                        src={formData.titleImage}
                        alt={t('preview')}
                        style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {t('input.reuploadImage')}
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        {t('input.uploadImage')}
                      </Typography>
                    </Box>
                  )}
                </label>
              </Paper>
              
              {/* 图片URL输入框 */}
              <TextField
                fullWidth
                label={t('title.imageUrl')}
                value={formData.titleImage}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, titleImage: e.target.value }))
                }
                sx={{ mt: 2 }}
                size="small"
              />
            </Box>
          ) : (
            /* 文本标题输入 */
            <TextField
              fullWidth
              label={t('title.titleText')}
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder={t('input.titlePlaceholder')}
            />
          )}

          {/* 统一的大小滑块 - 图片模式控制图片大小，文本模式控制字体大小 */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {useImage ? t('title.imageSize') : t('title.fontSize')}
            </Typography>
            {useImage ? (
              <Box>
                <Typography variant="caption" gutterBottom>
                  {t('title.imageSize')}: {formImageSize}px
                </Typography>
                <Slider
                  value={formImageSize}
                  onChange={(_, value) => setFormImageSize(value as number)}
                  min={50}
                  max={500}
                  step={10}
                  valueLabelDisplay="auto"
                />
              </Box>
            ) : (
              <Box>
                <Typography variant="caption" gutterBottom>
                  {t('title.fontSize')}: {(formFontSize / 16).toFixed(1)}rem ({formFontSize}px)
                </Typography>
                <Slider
                  value={formFontSize}
                  onChange={(_, value) => setFormFontSize(value as number)}
                  min={32}
                  max={128}
                  step={4}
                  valueLabelDisplay="auto"
                />
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} variant="contained">
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SecondPageTitleEditDialog;

