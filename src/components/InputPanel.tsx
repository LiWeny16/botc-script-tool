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
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import {
  Upload,
  Download,
  Refresh,
  LibraryBooks,
  RestartAlt,
  Share,
  Tune,
  Add,
  Print,
  Image,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { configStore } from '../stores/ConfigStore';
import { uiConfigStore } from '../stores/UIConfigStore';
import { scriptStore } from '../stores/ScriptStore';
import { useTranslation } from '../utils/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import IOSSwitch from './IOSSwitch';

interface InputPanelProps {
  onGenerate: (json: string, title?: string, author?: string) => void;
  onExportPDF: () => void;
  onExportImage: () => void;
  onExportJson: () => void;
  onShare: () => void;
  onClear?: () => void;
  onOpenUISettings?: () => void;
  onAddCustomRule?: () => void;
  onOpenAboutDialog?: () => void;
  onJsonChange?: (json: string) => void;  // 新增：JSON输入变化回调
  hasScript: boolean;
  currentJson?: string;
  jsonParseError?: string; // 新增：JSON 解析错误信息
}

const InputPanel = observer(({ onGenerate, onExportPDF, onExportImage, onExportJson, onShare, onClear, onOpenUISettings, onAddCustomRule, onOpenAboutDialog, onJsonChange, hasScript, currentJson, jsonParseError }: InputPanelProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [jsonInput, setJsonInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [error, setError] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(200); // JSON编辑框高度
  const [isResizing, setIsResizing] = useState(false);

  // 用于防抖的 ref
  const debounceTimerRef = useRef<number | null>(null);
  const isUpdatingFromPropRef = useRef(false);
  const previousOfficialIdParseModeRef = useRef(configStore.config.officialIdParseMode);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);

  // 监听官方ID解析模式的变化，触发重新解析JSON
  useEffect(() => {
    const currentMode = configStore.config.officialIdParseMode;
    const previousMode = previousOfficialIdParseModeRef.current;

    // 只在模式真正变化时触发，且当前有JSON内容时才重新生成
    if (currentMode !== previousMode && currentJson && currentJson.trim()) {
      console.log('官方ID解析模式变化，重新生成剧本', {
        from: previousMode,
        to: currentMode
      });

      // 触发重新生成剧本
      try {
        onGenerate(currentJson);
      } catch (error) {
        console.error('重新生成剧本失败:', error);
      }
    }

    // 更新 ref
    previousOfficialIdParseModeRef.current = currentMode;
  }, [configStore.config.officialIdParseMode, currentJson, onGenerate]);

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

  // 当 jsonInput 变化时只更新本地状态，不触发自动解析
  const handleJsonInputChange = (value: string) => {
    setJsonInput(value);
    // 移除自动解析，只在点击生成剧本时才解析
  };

  const handleGenerate = () => {
    try {
      setError('');
      if (!jsonInput.trim()) {
        setError(t('input.errorEmpty'));
        return;
      }

      // 点击生成按钮时，先通知父组件更新 JSON（如果有回调）
      if (onJsonChange && !isUpdatingFromPropRef.current) {
        onJsonChange(jsonInput);
      }

      // 然后触发生成剧本
      onGenerate(jsonInput, titleInput, authorInput);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('input.errorParse'));
    }
  };

  const handleResetSettings = () => {
    setResetDialogOpen(true);

  };

  const handleConfirmReset = async () => {
    try {
      // 1. 完全清空 ScriptStore（删除 localStorage）
      scriptStore.clear();

      // 2. 重置所有配置 store（删除 localStorage）
      configStore.resetToDefault();
      await uiConfigStore.resetToDefault(); // 异步清理字体和 localStorage

      // 3. 额外保险：手动清理所有可能的 localStorage 键
      const keysToRemove = [
        'botc-script-data',
        'botc-app-config',
        'botc-ui-config'
      ];

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`✓ 已删除 localStorage 键: ${key}`);
        } catch (error) {
          console.error(`删除 ${key} 失败:`, error);
        }
      });

      // 4. 清空输入框
      setJsonInput('');
      setTitleInput('');
      setAuthorInput('');
      setError('');

      setResetDialogOpen(false);

      console.log('🎉 所有设置和数据已重置！');

      // 5. 刷新页面，让应用重新初始化（作为新用户）
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('重置过程中出现错误:', error);
      alert('重置失败，请刷新页面后重试');
      setResetDialogOpen(false);
    }
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
    // 不清空JSON输入框，保留从父组件传来的默认JSON框架
    // setJsonInput(''); // 注释掉，让父组件控制JSON内容
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

  // 拖动调整大小的处理函数
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = textareaHeight;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizeStartY.current;
      const newHeight = Math.max(100, Math.min(800, resizeStartHeight.current + deltaY));
      setTextareaHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

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
            startIcon={<InfoIcon />}
            onClick={onOpenAboutDialog}
            sx={{
              borderColor: '#4caf50',
              color: '#4caf50',
              '&:hover': {
                borderColor: '#388e3c',
                backgroundColor: 'rgba(76, 175, 80, 0.08)',
              },
            }}
          >
            {t('repo.aboutAndThanks')}
          </Button>
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
        <Box sx={{ position: 'relative' }}>
          <TextField
            multiline
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
                height: `${textareaHeight}px`,
                alignItems: 'flex-start',
              },
              '& .MuiInputBase-input': {
                height: '100% !important',
                overflow: 'auto !important',
              },
            }}
          />
          {/* 拖动手柄 */}
          <Box
            onMouseDown={handleResizeStart}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '12px',
              cursor: 'ns-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isResizing ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
              transition: 'background-color 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
              },
              '&::before': {
                content: '""',
                width: '40px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: isResizing ? '#1976d2' : '#bdbdbd',
                transition: 'background-color 0.2s',
              },
              '&:hover::before': {
                backgroundColor: '#1976d2',
              },
            }}
          />
        </Box>

        {/* 错误提示 */}
        {(error || jsonParseError) && (
          <Alert severity="error" onClose={() => setError('')}>
            {error || jsonParseError}
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
              flex: { xs: '1 1 100%', sm: '1 1 20%' },
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
            startIcon={<Print />}
            onClick={onExportPDF}
            disabled={!hasScript}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              minHeight: 48,
            }}
          >
            {t('input.exportPDF')}
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Image />}
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

        {/* 提示信息和开关设置 */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2.5, md: 40 },
            alignItems: { xs: 'stretch', md: 'center' }
          }}>
            {/* 左侧文字说明 */}
            <Box sx={{
              flex: { xs: '1 1 auto', md: '0 0 auto' },
              maxWidth: { xs: '100%', md: '1000px' }
            }}>
              <Typography variant="body2" sx={{
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                lineHeight: 1.6
              }}>
                {t('info.supportOfficial')}<br />
                {t('info.supportFormats')}<br />
                {t('info.experimentalCharacters')}
              </Typography>
            </Box>

            {/* 右侧开关区域 */}
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              flex: { xs: '1 1 auto', md: '1 1 0' },
              minWidth: { xs: '100%', md: '300px' }
            }}>
              {/* 官方ID解析模式 */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                justifyContent: 'space-between'
              }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    mb: 0.25
                  }}>
                    {t('input.officialIdParseMode')}
                  </Typography>
                  <Typography variant="caption" sx={{
                    fontSize: '0.7rem',
                    color: 'warning.main',
                    display: 'block'
                  }}>
                    {t('input.officialIdParseModeWarning')}
                  </Typography>
                </Box>
                <IOSSwitch
                  checked={configStore.config.officialIdParseMode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => configStore.setOfficialIdParseMode(e.target.checked)}
                />
              </Box>

              {/* 双页模式 */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                justifyContent: 'space-between'
              }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    mb: 0.25
                  }}>
                    {t('input.twoPageMode')}
                  </Typography>
                  <Typography variant="caption" sx={{
                    fontSize: '0.7rem',
                    color: 'text.secondary',
                    display: 'block'
                  }}>
                    {t('input.twoPageModeDesc')}
                  </Typography>
                </Box>
                <IOSSwitch
                  checked={uiConfigStore.config.enableTwoPageMode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    uiConfigStore.updateConfig({ enableTwoPageMode: e.target.checked })
                  }
                />
              </Box>
            </Box>
          </Box>
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
