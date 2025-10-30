import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  useMediaQuery,
  createTheme,
  CircularProgress,
  ThemeProvider,
  CssBaseline,
  GlobalStyles,
  Switch,
  FormControlLabel,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import { observer } from 'mobx-react-lite';
import { getScriptJsonUrl, loadScriptJson } from '../data/scriptRepository';
import { generateScript } from '../utils/scriptGenerator';
import ScriptRenderer from '../components/ScriptRenderer';
import { THEME_COLORS, THEME_FONTS } from '../theme/colors';
import { useTranslation } from '../utils/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import type { Script } from '../types';
import { configStore } from '../stores/ConfigStore';
import { uiConfigStore } from '../stores/UIConfigStore';

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
});

const ScriptPreview = observer(() => {
  const { scriptName } = useParams<{ scriptName: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [script, setScript] = useState<Script | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [originalJson, setOriginalJson] = useState<string>('');

  // 在 ScriptPreview 页面，临时启用官方ID解析模式
  useEffect(() => {
    const originalMode = configStore.config.officialIdParseMode;
    configStore.setOfficialIdParseMode(true);

    // 组件卸载时恢复原始设置
    return () => {
      configStore.setOfficialIdParseMode(originalMode);
    };
  }, []);

  useEffect(() => {
    const loadScript = async () => {
      // 优先检查URL参数中的json源
      const jsonParam = searchParams.get('json');

      if (jsonParam) {
        // 从URL参数加载JSON
        try {
          let jsonString = '';

          // 检查是否是HTTP/HTTPS链接
          if (
            jsonParam.startsWith('http://') ||
            jsonParam.startsWith('https://') ||
            jsonParam.startsWith('/') // 同源绝对路径，例如 /scripts/json/official/tb.json
          ) {
            // 从URL下载JSON
            const response = await fetch(jsonParam);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            jsonString = await response.text();
          } else {
            // 直接解码JSON字符串
            jsonString = decodeURIComponent(jsonParam);
          }

          setOriginalJson(jsonString);
          const generatedScript = generateScript(jsonString, language);
          setScript(generatedScript);
        } catch (err) {
          setError(`${t('error.loadFailed')}：${err instanceof Error ? err.message : t('error.unknownError')}`);
        } finally {
          setLoading(false);
        }
        return;
      }

      // 从剧本库加载
      if (!scriptName) {
        setError(t('error.noScriptName'));
        setLoading(false);
        return;
      }

      const decodedName = decodeURIComponent(scriptName);

      // 从映射表中获取JSON URL
      const jsonUrl = getScriptJsonUrl(decodedName);

      if (!jsonUrl) {
        setError(`${t('error.scriptNotFound')}：${decodedName}`);
        setLoading(false);
        return;
      }

      try {
        // 从URL加载JSON
        const jsonString = await loadScriptJson(jsonUrl);
        setOriginalJson(jsonString);
        const generatedScript = generateScript(jsonString, language);
        setScript(generatedScript);
      } catch (err) {
        setError(`${t('error.loadFailed')}：${err instanceof Error ? err.message : t('error.unknownError')}`);
      } finally {
        setLoading(false);
      }
    };

    loadScript();
  }, [scriptName, searchParams, t]);

  // 监听语言变化，重新生成剧本
  useEffect(() => {
    if (originalJson) {
      try {
        const generatedScript = generateScript(originalJson, language);
        setScript(generatedScript);
      } catch (err) {
        console.error('Failed to regenerate script:', err);
      }
    }
  }, [language, originalJson]);

  const handleExportJson = () => {
    if (!originalJson) return;

    try {
      // 直接下载原始JSON文件
      const blob = new Blob([originalJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${script?.title || '剧本'}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出JSON失败:', error);
      alert(t('input.exportJsonFailed'));
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          py: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>{t('common.loading')}</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          py: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => {
                const category = searchParams.get('category');
                const destination = searchParams.get('json') 
                  ? '/' 
                  : (category ? `/repo?category=${category}` : '/repo');
                navigate(destination);
              }}
              variant="contained"
            >
              {t('common.back')}
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  if (!script) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          py: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography>{t('common.loading')}</Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{

          '@media print': {
            // 1. 定义打印页面，去除浏览器默认边距
            '@page': {
              size: 'A4 portrait', // 推荐 A4 纵向
              margin: 0,           // 页面边距设为0，我们在容器内部控制
            },

            // 2. 隐藏页面上所有元素
            'body *': {
              visibility: 'hidden !important',
            },

            // 3. 仅显示你要打印的剧本核心区，以及它的所有子元素
            '#script-preview, #script-preview *, #main_script, #main_script *, #script-preview-2, #script-preview-2 *': {
              visibility: 'visible !important',
            },

            // 3.5. 移除Container的padding和margin
            '.MuiContainer-root': {
              padding: '0 !important',
              margin: '0 !important',
              maxWidth: '100% !important',
            },

            // 4. ⭐ 核心：设置第一页容器高度和布局
            '#script-preview': {
              // --- A. 定位和尺寸 ---
              position: 'relative !important',
              left: '0 !important',
              top: '0 !important',
              width: '100vw !important',  // 100% 打印视口宽度
              height: '100vh !important', // 100% 打印视口高度
              margin: '0 !important',
              padding: '0 !important',

              // --- B. 强制不溢出 ---
              overflow: 'hidden !important', // 关键！裁剪任何超出一页的内容

              // --- C. 分页 ---
              // 注意：只有当第二页存在时才强制分页
              pageBreakInside: 'avoid !important',
            },

            // 4.1 当存在第二页时，第一页强制分页
            '#script-preview:has(~ #script-preview-2)': {
              pageBreakAfter: 'always !important',
            },

            // 5. ⭐ 第二页容器
            '#script-preview-2': {
              position: 'relative !important',
              left: '0 !important',
              top: '0 !important',
              width: '100vw !important',
              height: '100vh !important',
              margin: '0 !important',
              padding: '0 !important',
              overflow: 'hidden !important',
              pageBreakBefore: 'always !important', // 第二页前强制分页
              pageBreakInside: 'avoid !important',
              marginTop: '0 !important', // 确保打印时没有上边距
            },

            // 6. 确保底部头像和文字框在打印时可见
            '#main_script .MuiBox-root': {
              visibility: 'visible !important',
            },

            // 7. 隐藏标题悬浮时的编辑按钮
            '.MuiIconButton-root': {
              display: 'none !important',
            },

            // 8. 隐藏顶部控制栏（返回、下载、打印按钮等）
            '#preview-control-box': {
              display: 'none !important',
            },
          },
        }}
      />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box
          id="preview-control-box"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(254, 250, 240, 0.95)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            py: 1.5,
            '@media print': {
              display: 'none !important',
              visibility: 'hidden !important',
            }
          }}
        >
          <Box sx={{ width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                flexWrap: 'nowrap',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <IconButton
                onClick={() => {
                  // 返回时保持category参数
                  const category = searchParams.get('category');
                  navigate(category ? `/repo?category=${category}` : '/repo');
                }}
                size="small"
                sx={{
                  color: THEME_COLORS.paper.secondary,
                }}
                aria-label="back"
              >
                <ArrowBackIcon />
              </IconButton>
              <IconButton
                onClick={handleExportJson}
                size="small"
                sx={{
                  color: THEME_COLORS.good,
                }}
                aria-label="export-json"
              >
                <DownloadIcon />
              </IconButton>
              <IconButton
                onClick={() => window.print()}
                size="small"
                sx={{
                  color: THEME_COLORS.paper.primary,
                }}
                aria-label="print"
              >
                <PrintIcon />
              </IconButton>
              <Switch
                checked={uiConfigStore.config.enableTwoPageMode}
                onChange={(e) => uiConfigStore.updateConfig({ enableTwoPageMode: e.target.checked })}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: THEME_COLORS.paper.primary,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: THEME_COLORS.paper.primary,
                  },
                }}
                inputProps={{ 'aria-label': 'toggle-two-page' }}
              />
              <LanguageSwitcher />
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            backgroundColor: 'background.default',
            '@media print': {
              minHeight: 'auto',
            }
          }}
        >
          <Box
            sx={{
              width: '100%',
              // maxWidth: '1600px',
              '@media print': {
                maxWidth: '100% !important',
              }
            }}
          >
            {script && (
              <ScriptRenderer
                script={script}
                theme={theme}
                readOnly={true}
              />
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
});

export default ScriptPreview;

