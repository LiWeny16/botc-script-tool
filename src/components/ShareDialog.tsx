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
} from '@mui/material';
import {
  ContentCopy,
  Launch,
  Close,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../utils/i18n';
import { normalizeCharacterId } from '../data/characterIdMapping';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  script: any;
  originalJson: string;
}

const ShareDialog = observer(({ open, onClose, script, originalJson }: ShareDialogProps) => {
  const { t } = useTranslation();
  const [gistUrl, setGistUrl] = useState('');
  const [fullUrl, setFullUrl] = useState('');
  const [_compressedUrl, setCompressedUrl] = useState('');

  const steps = [
    t('share.step1'),
    t('share.step2'),
  ];

  // 生成压缩的JSON格式（只包含ID，使用英文格式）
  const generateCompressedJson = () => {
    try {
      const parsedJson = JSON.parse(originalJson);
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
      const baseUrl = window.location.origin + window.location.pathname + '#/shared';
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
      // 可以添加一个成功提示
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
                onClick={() => copyToClipboard(originalJson)}
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
});

export default ShareDialog;
