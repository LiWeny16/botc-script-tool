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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
} from '@mui/icons-material';
import { useTranslation } from '../utils/i18n';
import { uiConfigStore } from '../stores/UIConfigStore';

interface TitleEditDialogProps {
  open: boolean;
  title: string;
  titleImage?: string;
  titleImageSize?: number;
  useTitleImage?: boolean;
  showTitleFlourish?: boolean;
  author: string;
  playerCount?: string;
  textAlignment?: 'left' | 'center' | 'right';
  onClose: () => void;
  onSave: (data: {
    title: string;
    titleImage?: string;
    titleImageSize?: number;
    useTitleImage: boolean;
    showTitleFlourish?: boolean;
    author: string;
    playerCount?: string;
    textAlignment?: 'left' | 'center' | 'right';
  }) => void;
}

const TitleEditDialog = ({
  open,
  title,
  titleImage,
  titleImageSize,
  useTitleImage,
  showTitleFlourish,
  author,
  playerCount,
  textAlignment,
  onClose,
  onSave,
}: TitleEditDialogProps) => {
  const { t, language } = useTranslation();
  const [useImage, setUseImage] = useState(useTitleImage !== undefined ? useTitleImage : !!titleImage);
  const [showFlourish, setShowFlourish] = useState(showTitleFlourish !== undefined ? showTitleFlourish : true);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>(textAlignment || 'center');
  const [formData, setFormData] = useState({
    title: title || '',
    titleImage: titleImage || '',
    author: author || '',
    playerCount: playerCount || '',
  });
  const [firstPageImageSize, setFirstPageImageSize] = useState(titleImageSize || 160);
  const [dragActive, setDragActive] = useState(false);
  const [fontSizes, setFontSizes] = useState({
    xs: parseFloat(uiConfigStore.config.titleFontSize.xs),
    sm: parseFloat(uiConfigStore.config.titleFontSize.sm),
    md: parseFloat(uiConfigStore.config.titleFontSize.md),
  });

  // 判断是否是base64图片
  const isBase64Image = (str: string) => {
    return str.startsWith('data:image');
  };

  // 当 props 变化时更新表单数据
  useEffect(() => {
    setUseImage(useTitleImage !== undefined ? useTitleImage : !!titleImage);
    setFormData({
      title: title || '',
      titleImage: titleImage || '',
      author: author || '',
      playerCount: playerCount || '',
    });
    setShowFlourish(showTitleFlourish !== undefined ? showTitleFlourish : true);
    setAlignment(textAlignment || 'center');
    setFirstPageImageSize(titleImageSize || 160);
    setFontSizes({
      xs: parseFloat(uiConfigStore.config.titleFontSize.xs),
      sm: parseFloat(uiConfigStore.config.titleFontSize.sm),
      md: parseFloat(uiConfigStore.config.titleFontSize.md),
    });
  }, [open, title, titleImage, titleImageSize, useTitleImage, showTitleFlourish, author, playerCount]);

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
      ...formData,
      // 如果不使用图片且是base64，删除；如果是URL，保留
      titleImage: useImage ? formData.titleImage : (isBase64 ? undefined : formData.titleImage),
      titleImageSize: firstPageImageSize,
      useTitleImage: useImage,
      showTitleFlourish: showFlourish,
      textAlignment: alignment,
    };
    
    // 保存字体大小到 UIConfigStore
    uiConfigStore.updateConfig({
      titleFontSize: {
        xs: `${fontSizes.xs}rem`,
        sm: `${fontSizes.sm}rem`,
        md: `${fontSizes.md}rem`,
      },
    });
    
    onSave(dataToSave);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{t('title.editFirstPage')}</Typography>
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

          {/* 标题印花开关 */}
          {!useImage && (
            <FormControlLabel
              control={
                <Switch
                  checked={showFlourish}
                  onChange={(e) => setShowFlourish(e.target.checked)}
                />
              }
              label={t('title.showFlourish')}
            />
          )}

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
                  id="title-image-upload"
                />
                <label htmlFor="title-image-upload" style={{ cursor: 'pointer' }}>
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
              multiline
              minRows={1}
              maxRows={6}
              label={t('title.title')}
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder={t('input.titlePlaceholder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
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
                  {t('title.imageSize')}: {firstPageImageSize}px
                </Typography>
                <Slider
                  value={firstPageImageSize}
                  onChange={(_, value) => setFirstPageImageSize(value as number)}
                  min={80}
                  max={300}
                  step={10}
                  valueLabelDisplay="auto"
                />
              </Box>
            ) : (
              <Box>
                <Typography variant="caption" gutterBottom>
                  {t('title.fontSizeMd')}: {fontSizes.md}rem
                </Typography>
                <Slider
                  value={fontSizes.md}
                  onChange={(_, value) => setFontSizes(prev => ({ ...prev, md: value as number }))}
                  min={2.0}
                  max={7.0}
                  step={0.1}
                  valueLabelDisplay="auto"
                />
              </Box>
            )}
          </Box>

          {/* 作者 */}
          <TextField
            fullWidth
            label={t('title.author')}
            value={formData.author}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, author: e.target.value }))
            }
            placeholder={t('input.authorPlaceholder')}
            size="small"
          />

          {/* 玩家人数 */}
          <TextField
            fullWidth
            label={t('title.playerCount')}
            value={formData.playerCount}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, playerCount: e.target.value }))
            }
            placeholder={t('title.playerCount')}
            size="small"
          />

          {/* Title + Author text alignment */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {t('title.textAlignment')}
            </Typography>
            <ToggleButtonGroup
              value={alignment}
              exclusive
              onChange={(_, val) => val && setAlignment(val)}
              size="small"
              fullWidth
            >
              <ToggleButton value="left">
                <AlignLeftIcon sx={{ mr: 0.5 }} /> {t('title.alignLeft')}
              </ToggleButton>
              <ToggleButton value="center">
                <AlignCenterIcon sx={{ mr: 0.5 }} /> {t('title.alignCenter')}
              </ToggleButton>
              <ToggleButton value="right">
                <AlignRightIcon sx={{ mr: 0.5 }} /> {t('title.alignRight')}
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('title.cancel')}</Button>
        <Button onClick={handleSave} variant="contained">
          {t('title.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TitleEditDialog;
