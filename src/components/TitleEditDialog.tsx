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
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { useTranslation } from '../utils/i18n';

interface TitleEditDialogProps {
  open: boolean;
  title: string;
  titleImage?: string;
  subtitle?: string;
  author: string;
  playerCount?: string;
  onClose: () => void;
  onSave: (data: {
    title: string;
    titleImage?: string;
    subtitle?: string;
    author: string;
    playerCount?: string;
  }) => void;
}

const TitleEditDialog = ({
  open,
  title,
  titleImage,
  subtitle,
  author,
  playerCount,
  onClose,
  onSave,
}: TitleEditDialogProps) => {
  const { t } = useTranslation();
  const [useImage, setUseImage] = useState(!!titleImage);
  const [formData, setFormData] = useState({
    title: title || '',
    titleImage: titleImage || '',
    subtitle: subtitle || '',
    author: author || '',
    playerCount: playerCount || '',
  });
  const [dragActive, setDragActive] = useState(false);

  // 当 props 变化时更新表单数据
  useEffect(() => {
    setUseImage(!!titleImage);
    setFormData({
      title: title || '',
      titleImage: titleImage || '',
      subtitle: subtitle || '',
      author: author || '',
      playerCount: playerCount || '',
    });
  }, [open, title, titleImage, subtitle, author, playerCount]);

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
    const dataToSave = {
      ...formData,
      titleImage: useImage ? formData.titleImage : undefined,
    };
    onSave(dataToSave);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">编辑剧本标题</Typography>
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
            label="使用图片标题"
          />

          {useImage ? (
            /* 图片上传区域 */
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                标题图片
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
                        alt="标题预览"
                        style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        点击或拖拽替换图片
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        点击或拖拽上传图片
                      </Typography>
                    </Box>
                  )}
                </label>
              </Paper>
              
              {/* 图片URL输入框 */}
              <TextField
                fullWidth
                label="或输入图片URL"
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
              label="标题"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="请输入剧本标题"
            />
          )}

          {/* 副标题 */}
          <TextField
            fullWidth
            label="副标题（可选）"
            value={formData.subtitle}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, subtitle: e.target.value }))
            }
            placeholder="例如：英文名称或其他说明"
            size="small"
          />

          {/* 作者 */}
          <TextField
            fullWidth
            label="作者"
            value={formData.author}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, author: e.target.value }))
            }
            placeholder="请输入作者名称"
            size="small"
          />

          {/* 玩家人数 */}
          <TextField
            fullWidth
            label="玩家人数（可选）"
            value={formData.playerCount}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, playerCount: e.target.value }))
            }
            placeholder="例如：7-15"
            size="small"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TitleEditDialog;
