import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  createTheme,
  CircularProgress,
  ThemeProvider,
  CssBaseline,
  GlobalStyles,
  Switch,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import { Cloud } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { getScriptJsonUrl, loadScriptJson } from '../data/utils/scriptRepository';
import { loadSharedScript } from '../lib/cloudScripts';
import { generateScript } from '../utils/scriptGenerator';
import ScriptRenderer from '../components/ScriptRenderer';
import { THEME_COLORS } from '../theme/colors';
import { useTranslation } from '../utils/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { trackPreviewScript } from '../utils/analytics';
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
  components: {
    MuiDialog: { defaultProps: { disableScrollLock: true } },
    MuiDrawer: { defaultProps: { disableScrollLock: true } },
    MuiMenu: { defaultProps: { disableScrollLock: true } },
    MuiPopover: { defaultProps: { disableScrollLock: true } },
  },
});

const ScriptPreview = observer(() => {
  const { scriptName, shareId } = useParams<{ scriptName?: string; shareId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [script, setScript] = useState<Script | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [originalJson, setOriginalJson] = useState<string>('');
  const [sharedName, setSharedName] = useState<string>('');
  const tRef = useRef(t);
  tRef.current = t;

  const isShared = Boolean(shareId);

  // Temporarily enable official ID parse mode on preview pages
  useEffect(() => {
    const originalMode = configStore.config.officialIdParseMode;
    configStore.setOfficialIdParseMode(true);
    return () => {
      configStore.setOfficialIdParseMode(originalMode);
    };
  }, []);

  useEffect(() => {
    const loadScript = async () => {
      // 1) Shared via Supabase
      if (shareId) {
        try {
          const result = await loadSharedScript(shareId);
          if (!result) {
            setError('Shared script not found or link expired.');
            setLoading(false);
            return;
          }
          setSharedName(result.name);
          setOriginalJson(result.json);
          setScript(generateScript(result.json, language));
          trackPreviewScript({ scriptName: result.name });
        } catch (err) {
          setError(`${tRef.current('error.loadFailed')}：${err instanceof Error ? err.message : tRef.current('error.unknownError')}`);
        } finally {
          setLoading(false);
        }
        return;
      }

      // 2) JSON from ?json= query param
      const jsonParam = searchParams.get('json');
      if (jsonParam) {
        try {
          let jsonString = '';
          if (
            jsonParam.startsWith('http://') ||
            jsonParam.startsWith('https://') ||
            jsonParam.startsWith('/')
          ) {
            const response = await fetch(jsonParam);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            jsonString = await response.text();
          } else {
            jsonString = decodeURIComponent(jsonParam);
          }
          setOriginalJson(jsonString);
          setScript(generateScript(jsonString, language));
          trackPreviewScript({ scriptName: scriptName || 'shared' });
        } catch (err) {
          setError(`${tRef.current('error.loadFailed')}：${err instanceof Error ? err.message : tRef.current('error.unknownError')}`);
        } finally {
          setLoading(false);
        }
        return;
      }

      // 3) Legacy: script name lookup
      if (!scriptName) {
        setError(tRef.current('error.noScriptName'));
        setLoading(false);
        return;
      }

      const decodedName = decodeURIComponent(scriptName);
      const jsonUrl = getScriptJsonUrl(decodedName);
      if (!jsonUrl) {
        setError(`${tRef.current('error.scriptNotFound')}：${decodedName}`);
        setLoading(false);
        return;
      }

      try {
        const jsonString = await loadScriptJson(jsonUrl);
        setOriginalJson(jsonString);
        setScript(generateScript(jsonString, language));
        trackPreviewScript({ scriptName: decodedName });
      } catch (err) {
        setError(`${tRef.current('error.loadFailed')}：${err instanceof Error ? err.message : tRef.current('error.unknownError')}`);
      } finally {
        setLoading(false);
      }
    };

    loadScript();
  }, [scriptName, shareId, searchParams]);

  // Regenerate on language change
  useEffect(() => {
    if (originalJson) {
      try {
        setScript(generateScript(originalJson, language));
      } catch (err) {
        console.error('Failed to regenerate script:', err);
      }
    }
  }, [language, originalJson]);

  const handleExportJson = () => {
    if (!originalJson) return;
    try {
      const blob = new Blob([originalJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${script?.title || t('export.defaultScriptName')}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export JSON:', error);
      alert(t('input.exportJsonFailed'));
    }
  };

  const handleBack = () => {
    if (isShared) {
      navigate('/');
    } else {
      const category = searchParams.get('category');
      navigate(category ? `/repo?category=${category}` : '/repo');
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
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
            <Button startIcon={<ArrowBackIcon />} onClick={handleBack} variant="contained">
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
            '@page': {
              size: 'A4 portrait',
              margin: 0,
            },
            'body *': {
              visibility: 'hidden !important',
            },
            '#script-preview, #script-preview *, #main_script, #main_script *, #script-preview-2, #script-preview-2 *': {
              visibility: 'visible !important',
            },
            '.MuiContainer-root': {
              padding: '0 !important',
              margin: '0 !important',
              maxWidth: '100% !important',
            },
            '#script-preview': {
              position: 'relative !important',
              left: '0 !important',
              top: '0 !important',
              width: '100vw !important',
              height: '100vh !important',
              margin: '0 !important',
              padding: '0 !important',
              overflow: 'hidden !important',
              pageBreakInside: 'avoid !important',
            },
            '#script-preview:has(~ #script-preview-2)': {
              pageBreakAfter: 'always !important',
            },
            '#script-preview-2': {
              position: 'relative !important',
              left: '0 !important',
              top: '0 !important',
              width: '100vw !important',
              height: '100vh !important',
              margin: '0 !important',
              padding: '0 !important',
              overflow: 'hidden !important',
              pageBreakBefore: 'always !important',
              pageBreakInside: 'avoid !important',
              marginTop: '0 !important',
            },
            '#main_script .MuiBox-root': {
              visibility: 'visible !important',
            },
            '.MuiIconButton-root': {
              display: 'none !important',
            },
            '#preview-control-box': {
              display: 'none !important',
            },
          },
        }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
            },
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
                onClick={handleBack}
                size="small"
                sx={{ color: THEME_COLORS.paper.secondary }}
                aria-label="back"
              >
                <ArrowBackIcon />
              </IconButton>

              {isShared && (
                <>
                  <Cloud size={18} strokeWidth={1.8} style={{ color: '#6366f1', flexShrink: 0 }} />
                  <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                    {sharedName || 'Shared Script'}
                  </Typography>
                </>
              )}

              <IconButton
                onClick={handleExportJson}
                size="small"
                sx={{ color: THEME_COLORS.good }}
                aria-label="export-json"
              >
                <DownloadIcon />
              </IconButton>
              <IconButton
                onClick={() => window.print()}
                size="small"
                sx={{ color: THEME_COLORS.paper.primary }}
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
            },
          }}
        >
          <Box
            sx={{
              width: '100%',
              '@media print': {
                maxWidth: '100% !important',
              },
            }}
          >
            <ScriptRenderer script={script} theme={theme} readOnly />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
});

export default ScriptPreview;
