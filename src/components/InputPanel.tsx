import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Upload,
  Download,
  Refresh,
  LibraryBooks,
  RestartAlt,
  Share,
  Tune,
  Add,
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
  onOpenUISettings?: () => void;
  onAddCustomRule?: () => void;
  onJsonChange?: (json: string) => void;  // 新增：JSON输入变化回调
  hasScript: boolean;
  currentJson?: string;
}

const InputPanel = observer(({ onGenerate, onExportImage, onExportJson, onShare, onClear, onOpenUISettings, onAddCustomRule, onJsonChange, hasScript, currentJson }: InputPanelProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [error, setError] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // 用于防抖的 ref
  const debounceTimerRef = useRef<number | null>(null);
  const isUpdatingFromPropRef = useRef(false);

  // 同步currentJson到jsonInput（只在外部更新时）
  useEffect(() => {
    if (currentJson && currentJson !== jsonInput) {
      isUpdatingFromPropRef.current = true;
      setJsonInput(currentJson);
      // 短暂延迟后重置标记，避免影响后续用户输入
      setTimeout(() => {
        isUpdatingFromPropRef.current = false;
      }, 100);
    }
  }, [currentJson]);

  // 防抖处理 JSON 变化
  const debouncedOnJsonChange = useCallback((value: string) => {
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 设置新的定时器
    debounceTimerRef.current = setTimeout(() => {
      if (onJsonChange && !isUpdatingFromPropRef.current) {
        onJsonChange(value);
      }
    }, 500); // 500ms 防抖延迟
  }, [onJsonChange]);

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 当 jsonInput 变化时通知父组件（带防抖）
  const handleJsonInputChange = (value: string) => {
    setJsonInput(value);

    // 只在用户主动输入时才触发防抖更新
    if (!isUpdatingFromPropRef.current) {
      debouncedOnJsonChange(value);
    }
  };

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
    handleClear()

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
        handleJsonInputChange(content);
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
          onChange={(e) => handleJsonInputChange(e.target.value)}
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

        {/* 第一行：生成剧本、上传JSON、导出JSON、分享剧本、导出PDF */}
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
              flex: { xs: '1 1 100%', sm: '1 1 30%' },
              minHeight: 48,
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
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              minHeight: 48,
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
            onClick={onExportJson}
            disabled={!hasScript}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              minHeight: 48,
            }}
          >
            {t('input.exportJson')}
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Share />}
            onClick={onShare}
            disabled={!hasScript}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              minHeight: 48,
            }}
          >
            {t('input.shareScript')}
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Download />}
            onClick={onExportImage}
            disabled={!hasScript}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              minHeight: 48,
            }}
          >
            {t('input.exportImage')}
          </Button>
        </Box>

        {/* 第二行：清空、添加特殊规则、PDF导出设置 */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="outlined"
            size="large"
            color="error"
            startIcon={<Refresh />}
            onClick={handleClearClick}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 44%' },
              minHeight: 48,
            }}
          >
            {t('input.clear')}
          </Button>

          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<Add />}
            onClick={onAddCustomRule}
            disabled={!hasScript}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              minHeight: 48,
            }}
          >
            {t('specialRules.add')}
          </Button>

          <Button
            variant="contained"
            size="large"
            startIcon={<SettingsIcon />}
            onClick={onOpenUISettings}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              minHeight: 48,
              // backgroundColor: '#0078BA',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#005583ff',
              },
            }}
          >
            {t('ui.adjustUI')}
          </Button>
        </Box>

        {/* 第三行：重置所有设置 */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<RestartAlt />}
            onClick={handleResetSettings}
            sx={{
              flex: { xs: '1 1 100%' },
              minHeight: 48,
            }}
          >
            {t('ui.resetAllSettings')}
          </Button>
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
        disableScrollLock={true}
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
        disableScrollLock={true}
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
