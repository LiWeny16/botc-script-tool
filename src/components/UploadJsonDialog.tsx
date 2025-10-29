import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { Upload, Sync, InfoOutlined } from '@mui/icons-material';
import { useTranslation } from '../utils/i18n';

interface UploadJsonDialogProps {
  open: boolean;
  onClose: () => void;
  onSimpleUpload: (content: string) => void;
  onFileSyncStart: (fileHandle: FileSystemFileHandle, content: string) => void;
}

const UploadJsonDialog = ({
  open,
  onClose,
  onSimpleUpload,
  onFileSyncStart,
}: UploadJsonDialogProps) => {
  const { t } = useTranslation();

  const handleSimpleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onSimpleUpload(content);
        onClose();
      };
      reader.readAsText(file);
    }
  };

  const handleFileSyncStart = async () => {
    try {
      // 检查浏览器支持
      if (!('showOpenFilePicker' in window)) {
        alert('您的浏览器不支持文件同步功能，请使用最新版 Chrome/Edge 浏览器');
        return;
      }

      // 打开文件选择器
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'JSON Files',
            accept: {
              'application/json': ['.json'],
            },
          },
        ],
        multiple: false,
      });

      // 读取文件内容
      const file = await fileHandle.getFile();
      const content = await file.text();

      // 通知父组件
      onFileSyncStart(fileHandle, content);
      onClose();
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('文件同步启动失败:', error);
        alert('文件同步启动失败，请重试');
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableScrollLock={true}
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
        <Upload sx={{ fontSize: 32, color: '#1976d2' }} />
        <Typography variant="h6" component="span" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
          {t('input.uploadJson')}
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, pb: 3 }}>
        <Typography variant="body2" sx={{ color: '#666', mb: 3, lineHeight: 1.7 }}>
          {t('upload.selectMode')}
        </Typography>

        {/* 简单上传卡片 */}
        <Box
          component="label"
          sx={{
            display: 'block',
            mb: 2,
            p: 2.5,
            borderRadius: 2,
            border: '2px solid #e3f2fd',
            backgroundColor: '#f5f5f5',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: '#1976d2',
              backgroundColor: '#e3f2fd',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Upload sx={{ color: '#1976d2', fontSize: 24 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
              {t('upload.simpleMode')}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem' }}>
            {t('upload.simpleDesc')}
          </Typography>
          <input
            type="file"
            accept=".json"
            hidden
            onChange={handleSimpleUpload}
          />
        </Box>

        {/* 文件同步卡片 */}
        <Box
          onClick={handleFileSyncStart}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: '2px solid #fff3e0',
            backgroundColor: '#f5f5f5',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: '#ff9800',
              backgroundColor: '#fff3e0',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Sync sx={{ color: '#ff9800', fontSize: 24 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#ff9800' }}>
              {t('upload.syncMode')}
            </Typography>
            <Chip
              label={t('upload.experimental')}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                backgroundColor: '#ff9800',
                color: '#fff',
                fontWeight: 'bold',
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#666', fontSize: '0.9rem', mb: 1 }}>
            {t('upload.syncDesc')}
          </Typography>
          <Box sx={{ pl: 0.5 }}>
            <Typography variant="body2" sx={{ mb: 0.3, color: '#757575', fontSize: '0.85rem' }}>
              • {t('upload.syncFeature1')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.3, color: '#757575', fontSize: '0.85rem' }}>
              • {t('upload.syncFeature2')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#757575', fontSize: '0.85rem' }}>
              • {t('upload.syncFeature3')}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, backgroundColor: '#fafafa' }}>
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
      </DialogActions>
    </Dialog>
  );
};

export default UploadJsonDialog;

