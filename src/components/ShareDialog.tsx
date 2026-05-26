import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Typography,
  Box,
  Step,
  Stepper,
  StepLabel,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  ContentCopy,
  Launch,
  Close,
  IosShare,
} from '@mui/icons-material';
import { Cloud } from 'lucide-react';
import { useTranslation } from '../utils/i18n';
import { normalizeCharacterId } from '../data/utils/characterIdMapping';
import { trackShareScript } from '../utils/analytics';
import { authStore } from '../stores/AuthStore';
import { shareScript } from '../lib/cloudScripts';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  script: any;
  originalJson: string; // 保留用于显示原始输入
  normalizedJson: string; // 使用规范化JSON进行分享和压缩
}

const ShareDialog = ({ open, onClose, script, originalJson, normalizedJson }: ShareDialogProps) => {
  const { t } = useTranslation();
  const [gistUrl, setGistUrl] = useState('');
  const [fullUrl, setFullUrl] = useState('');
  const [_compressedUrl, setCompressedUrl] = useState('');
  const [cloudShareUrl, setCloudShareUrl] = useState('');
  const [cloudSharing, setCloudSharing] = useState(false);

  const handleCloudShare = async () => {
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
      const url = `${window.location.origin}/#/shared/${id}`;
      setCloudShareUrl(url);
    }
  };

  const steps = [
    t('share.step1'),
    t('share.step2'),
  ];

  // 生成压缩的JSON格式（只包含ID，使用英文格式）
  const generateCompressedJson = () => {
    try {
      // 使用 normalizedJson，它已经包含了所有补全后的字段
      const parsedJson = JSON.parse(normalizedJson);
      const compressedData: any[] = [];

      // 添加元数据
      const metaItem = parsedJson.find((item: any) => item.id === '_meta');
      if (metaItem) {
        compressedData.push({
          id: '_meta',
          name: metaItem.name || script?.title,
          author: metaItem.author || script?.author || '',
        });
      } else if (script) {
        compressedData.push({
          id: '_meta',
          name: script.title,
          author: script.author || '',
        });
      }

      // 添加角色ID（转换为英文格式）
      if (script) {
        Object.keys(script.characters).forEach(team => {
          script.characters[team].forEach((character: any) => {
            // 转换为英文ID格式
            const englishId = normalizeCharacterId(character.id, 'en');
            compressedData.push(englishId);
          });
        });
      }

      return JSON.stringify(compressedData);
    } catch (error) {
      console.error('Failed to generate compressed JSON:', error);
      return '';
    }
  };

  const handleGistUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setGistUrl(url);

    if (url) {
      // 生成完整剧本链接
      const baseUrl = window.location.origin + window.location.pathname + '#/repo/preview';
      const fullLink = `${baseUrl}?json=${encodeURIComponent(url)}`;
      setFullUrl(fullLink);

      // 生成压缩链接
      const compressedJson = generateCompressedJson();
      if (compressedJson) {
        const compressedLink = `${baseUrl}?json=${encodeURIComponent(compressedJson)}`;
        setCompressedUrl(compressedLink);
      }
    } else {
      setFullUrl('');
      setCompressedUrl('');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      trackShareScript();
    } catch (error) {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const openGist = () => {
    window.open('https://gist.github.com', '_blank');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableScrollLock={true}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {t('share.title')}
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Cloud Share (one-click) */}
        <Box
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 3,
            bgcolor: alpha('#6366f1', 0.05),
            border: '1px solid',
            borderColor: alpha('#6366f1', 0.15),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Cloud size={20} strokeWidth={1.8} style={{ color: '#6366f1' }} />
            <Typography variant="subtitle1" fontWeight={700}>One-Click Share</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Instantly create a public link. No Gist needed.
          </Typography>

          {!cloudShareUrl ? (
            <Button
              variant="contained"
              startIcon={cloudSharing ? <CircularProgress size={16} color="inherit" /> : <IosShare />}
              onClick={handleCloudShare}
              disabled={cloudSharing}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                bgcolor: '#6366f1',
                '&:hover': { bgcolor: '#4f46e5' },
                px: 3,
              }}
            >
              {cloudSharing ? 'Creating link...' : 'Generate Share Link'}
            </Button>
          ) : (
            <Box>
              <TextField
                fullWidth
                value={cloudShareUrl}
                InputProps={{ readOnly: true }}
                size="small"
                sx={{ mb: 1, '& input': { fontSize: '0.85rem' } }}
                autoFocus
                onFocus={e => e.target.select()}
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={() => { navigator.clipboard.writeText(cloudShareUrl); }}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Copy Link
              </Button>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>or manually via Gist</Typography>
        </Divider>

        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={-1} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Step 1 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('share.step1')}
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {t('share.step1Description')}
            </Typography>
          </Alert>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Launch />}
              onClick={openGist}
              size="small"
            >
              {t('share.openGist')}
            </Button>
            <Tooltip title={t('share.copyJsonTooltip')}>
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={() => copyToClipboard(normalizedJson)}
                size="small"
              >
                {t('share.copyJson')}
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Step 2 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('share.step2')}
          </Typography>
          <TextField
            fullWidth
            label={t('share.gistUrlLabel')}
            placeholder="https://gist.githubusercontent.com/username/gist-id/raw/..."
            value={gistUrl}
            onChange={handleGistUrlChange}
            sx={{ mb: 2 }}
          />
        </Box>

        {/* 生成的链接 */}
        {fullUrl && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('share.generatedLinks')}
            </Typography>
            
            {/* 完整剧本链接 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('share.fullScriptLink')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  value={fullUrl}
                  InputProps={{ readOnly: true }}
                  size="small"
                />
                <Tooltip title={t('share.copyLink')}>
                  <IconButton onClick={() => copyToClipboard(fullUrl)} size="small">
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

           
          </Box>
        )}
      </DialogContent>
      
    </Dialog>
  );
};

export default ShareDialog;
