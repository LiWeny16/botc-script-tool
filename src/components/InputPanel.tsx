import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  Stack,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Upload,
  Download,
  Refresh,
  Settings,
  ExpandMore,
  ExpandLess,
  LibraryBooks,
  RestartAlt,
  Share,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { configStore } from '../stores/ConfigStore';
import { useTranslation } from '../utils/i18n';
import LanguageSwitcher from './LanguageSwitcher';

interface InputPanelProps {
  onGenerate: (json: string, title?: string, author?: string) => void;
  onExportImage: () => void;
  onExportJson: () => void;
  onShare: () => void;
  onClear?: () => void;
  hasScript: boolean;
  currentJson?: string;
}

const InputPanel = observer(({ onGenerate, onExportImage, onExportJson, onShare, onClear, hasScript, currentJson }: InputPanelProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // 同步currentJson到jsonInput
  useEffect(() => {
    if (currentJson && currentJson !== jsonInput) {
      setJsonInput(currentJson);
    }
  }, [currentJson]);

  const handleGenerate = () => {
    try {
      setError('');
      if (!jsonInput.trim()) {
        setError(t('input.errorEmpty'));
        return;
      }
      onGenerate(jsonInput, titleInput, authorInput);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('input.errorParse'));
    }
  };

  const handleResetSettings = () => {
    setResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    configStore.resetToDefault();
    setResetDialogOpen(false);
    alert(t('dialog.resetSuccess'));
  };

  const handleCancelReset = () => {
    setResetDialogOpen(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJsonInput(content);
      };
      reader.readAsText(file);
    }
  };

  const handleClearClick = () => {
    // 如果有剧本，显示确认对话框
    if (hasScript) {
      setClearDialogOpen(true);
    } else {
      // 如果没有剧本，直接清空输入
      handleClear();
    }
  };

  const handleClear = () => {
    setJsonInput('');
    setTitleInput('');
    setAuthorInput('');
    setError('');
    setClearDialogOpen(false);
    // 调用父组件的清空回调，清空剧本和存储
    if (onClear) {
      onClear();
    }
  };

  const handleCancelClear = () => {
    setClearDialogOpen(false);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        mb: 3,
        backgroundColor: '#fefefe',
        borderRadius: 2,
        '@media print': {
          display: 'none', // 打印时隐藏整个输入面板
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            color: '#333',
            fontSize: { xs: '1.3rem', sm: '1.5rem' },
          }}
        >
          {t('app.title')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LanguageSwitcher />
          <Button
            variant="outlined"
            startIcon={<LibraryBooks />}
            onClick={() => navigate('/repo')}
            sx={{
              borderColor: '#0078ba',
              color: '#0078ba',
              '&:hover': {
                borderColor: '#005a8c',
                backgroundColor: 'rgba(0, 120, 186, 0.08)',
              },
            }}
          >
            {t('app.scriptRepository')}
          </Button>
        </Box>
      </Box>

      <Stack spacing={2}>
        {/* JSON 输入框 */}
        <TextField
          multiline
          rows={6}
          fullWidth
          label={t('input.jsonLabel')}
          placeholder={t('input.jsonPlaceholder')}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              fontFamily: 'monospace',
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
            },
          }}
        />

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* 主要操作按钮 */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="contained"
            size="large"
            startIcon={<Refresh />}
            onClick={handleGenerate}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              minWidth: { sm: 120 },
            }}
          >
            {t('input.generateScript')}
          </Button>

          <Button
            variant="outlined"
            size="large"
            component="label"
            startIcon={<Upload />}
            sx={{
              flex: { xs: '1 1 100%', sm: '0 1 auto' },
            }}
          >
            {t('input.uploadJson')}
            <input
              type="file"
              accept=".json"
              hidden
              onChange={handleFileUpload}
            />
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Download />}
            onClick={onExportImage}
            disabled={!hasScript}
            sx={{
              flex: { xs: '1 1 100%', sm: '0 1 auto' },
            }}
          >
            {t('input.exportImage')}
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Download />}
            onClick={onExportJson}
            disabled={!hasScript}
            sx={{
              flex: { xs: '1 1 100%', sm: '0 1 auto' },
            }}
          >
            {t('input.copyJson')}
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Share />}
            onClick={onShare}
            disabled={!hasScript}
            sx={{
              flex: { xs: '1 1 100%', sm: '0 1 auto' },
            }}
          >
            {t('input.shareScript')}
          </Button>

          <Button
            variant="outlined"
            size="large"
            color="secondary"
            startIcon={<Refresh />}
            onClick={handleClearClick}
            sx={{
              flex: { xs: '1 1 100%', sm: '0 1 auto' },
            }}
          >
            {t('input.clear')}
          </Button>
        </Box>

        {/* 高级选项 */}
        <Box>
          <Button
            size="small"
            onClick={() => setShowAdvanced(!showAdvanced)}
            endIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
            sx={{ mb: 1 }}
          >
            <Settings sx={{ mr: 1, fontSize: 20 }} />
            {t('input.advancedOptions')}
          </Button>

          <Collapse in={showAdvanced}>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label={t('input.titleLabel')}
                placeholder={t('input.titlePlaceholder')}
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                variant="outlined"
                size="small"
              />

              <TextField
                fullWidth
                label={t('input.authorLabel')}
                placeholder={t('input.authorPlaceholder')}
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                variant="outlined"
                size="small"
              />

              <Button
                variant="outlined"
                color="warning"
                startIcon={<RestartAlt />}
                onClick={handleResetSettings}
                size="small"
                fullWidth
              >
                {t('input.resetSettings')}
              </Button>
            </Stack>
          </Collapse>
        </Box>

        {/* 提示信息 */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
            {t('info.supportOfficial')}<br />
            {t('info.supportFormats')}<br />
            {t('info.experimentalCharacters')}
          </Typography>
        </Alert>
      </Stack>

      {/* 重置确认对话框 */}
      <Dialog
        open={resetDialogOpen}
        onClose={handleCancelReset}
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-description"
      >
        <DialogTitle id="reset-dialog-title">
          {t('dialog.resetTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="reset-dialog-description">
            {t('dialog.resetMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReset} color="primary">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirmReset} color="warning" variant="contained" autoFocus>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 清空确认对话框 */}
      <Dialog
        open={clearDialogOpen}
        onClose={handleCancelClear}
        aria-labelledby="clear-dialog-title"
        aria-describedby="clear-dialog-description"
      >
        <DialogTitle id="clear-dialog-title">
          {t('dialog.clearTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-dialog-description">
            {t('dialog.clearMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClear} color="primary">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleClear} color="error" variant="contained" autoFocus>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
});

export default InputPanel;
