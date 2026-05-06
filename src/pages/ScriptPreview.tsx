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
import { getScriptJsonUrl, loadScriptJson } from '../data/utils/scriptRepository';
import { generateScript } from '../utils/scriptGenerator';
import ScriptRenderer from '../components/ScriptRenderer';
import { THEME_COLORS, THEME_FONTS } from '../theme/colors';
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

  // Temporarily enable official ID parse mode on ScriptPreview page
  useEffect(() => {
    const originalMode = configStore.config.officialIdParseMode;
    configStore.setOfficialIdParseMode(true);

    // Restore original setting on unmount
    return () => {
      configStore.setOfficialIdParseMode(originalMode);
    };
  }, []);

  useEffect(() => {
    const loadScript = async () => {
      // Check URL parameter for json source first
      const jsonParam = searchParams.get('json');

      if (jsonParam) {
        // Load JSON from URL parameter
        try {
          let jsonString = '';

          // Check if it's an HTTP/HTTPS link
          if (
            jsonParam.startsWith('http://') ||
            jsonParam.startsWith('https://') ||
            jsonParam.startsWith('/') // Same-origin absolute path, e.g. /scripts/json/official/tb.json
          ) {
            // Download JSON from URL
            const response = await fetch(jsonParam);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            jsonString = await response.text();
          } else {
            // Decode JSON string directly
            jsonString = decodeURIComponent(jsonParam);
          }

          setOriginalJson(jsonString);
          const generatedScript = generateScript(jsonString, language);
          setScript(generatedScript);
          trackPreviewScript({ scriptName: scriptName || 'shared' });
        } catch (err) {
          setError(`${t('error.loadFailed')}：${err instanceof Error ? err.message : t('error.unknownError')}`);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Load from script library
      if (!scriptName) {
        setError(t('error.noScriptName'));
        setLoading(false);
        return;
      }

      const decodedName = decodeURIComponent(scriptName);

      // Get JSON URL from mapping table
      const jsonUrl = getScriptJsonUrl(decodedName);

      if (!jsonUrl) {
        setError(`${t('error.scriptNotFound')}：${decodedName}`);
        setLoading(false);
        return;
      }

      try {
        // Load JSON from URL
        const jsonString = await loadScriptJson(jsonUrl);
        setOriginalJson(jsonString);
        const generatedScript = generateScript(jsonString, language);
        setScript(generatedScript);
        trackPreviewScript({ scriptName: decodedName });
      } catch (err) {
        setError(`${t('error.loadFailed')}：${err instanceof Error ? err.message : t('error.unknownError')}`);
      } finally {
        setLoading(false);
      }
    };

    loadScript();
  }, [scriptName, searchParams, t]);

  // Listen for language changes and regenerate script
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
      // Download the original JSON file directly
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
            // 1. Define print page, remove browser default margins
            '@page': {
              size: 'A4 portrait', // Recommended: A4 portrait
              margin: 0,           // Set page margin to 0, we control it within the container
            },

            // 2. Hide all elements on the page
            'body *': {
              visibility: 'hidden !important',
            },

            // 3. Only show the script core area to print, and all its descendants
            '#script-preview, #script-preview *, #main_script, #main_script *, #script-preview-2, #script-preview-2 *': {
              visibility: 'visible !important',
            },

            // 3.5. Remove Container padding and margin
            '.MuiContainer-root': {
              padding: '0 !important',
              margin: '0 !important',
              maxWidth: '100% !important',
            },

            // 4. CORE: Set first page container height and layout
            '#script-preview': {
              // --- A. Position and size ---
              position: 'relative !important',
              left: '0 !important',
              top: '0 !important',
              width: '100vw !important',  // 100% print viewport width
              height: '100vh !important', // 100% print viewport height
              margin: '0 !important',
              padding: '0 !important',

              // --- B. Force no overflow ---
              overflow: 'hidden !important', // Critical! Clip any content beyond one page

              // --- C. Page break ---
              // Note: force page break only when a second page exists
              pageBreakInside: 'avoid !important',
            },

            // 4.1 When a second page exists, force page break after the first page
            '#script-preview:has(~ #script-preview-2)': {
              pageBreakAfter: 'always !important',
            },

            // 5. Second page container
            '#script-preview-2': {
              position: 'relative !important',
              left: '0 !important',
              top: '0 !important',
              width: '100vw !important',
              height: '100vh !important',
              margin: '0 !important',
              padding: '0 !important',
              overflow: 'hidden !important',
              pageBreakBefore: 'always !important', // Force page break before second page
              pageBreakInside: 'avoid !important',
              marginTop: '0 !important', // Ensure no top margin when printing
            },

            // 6. Ensure bottom avatar and text box are visible when printing
            '#main_script .MuiBox-root': {
              visibility: 'visible !important',
            },

            // 7. Hide edit button on title hover
            '.MuiIconButton-root': {
              display: 'none !important',
            },

            // 8. Hide top control bar (back, download, print buttons, etc.)
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
                  // Keep category parameter when navigating back
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

