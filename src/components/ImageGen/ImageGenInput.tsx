import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Popover,
  Button,
  Typography,
  InputAdornment,
  CircularProgress,
  alpha,
  Collapse,
  Alert,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  ArrowUpward as ArrowUpwardIcon,
  Link as LinkIcon,
  Collections as CollectionsIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../../utils/i18n';
import { imageGenStore } from '../../stores/ImageGenStore';
import { MODEL_LABELS, MODEL_SIZES, type GenerationMode } from '../../utils/imageGenApi';
import { alertError } from '../../utils/alert';
import type { TranslationKey } from '../../utils/i18n/index';

const MODE_OPTIONS: { value: GenerationMode; labelKey: TranslationKey }[] = [
  { value: 'text-to-image', labelKey: 'imageGen.mode.textToImage' },
  { value: 'image-to-image', labelKey: 'imageGen.mode.imageToImage' },
  { value: 'multi-image-fusion', labelKey: 'imageGen.mode.multiImageFusion' },
  { value: 'group-generation', labelKey: 'imageGen.mode.groupGeneration' },
];

const SUGGESTION_KEYS: TranslationKey[] = [
  'imageGen.suggestion.1',
  'imageGen.suggestion.2',
  'imageGen.suggestion.3',
];

const glassSurface = {
  bgcolor: alpha('#fff', 0.72),
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid',
  borderColor: alpha('#fff', 0.8),
  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
};

const compactSelectSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: alpha('#000', 0.03),
    fontSize: '0.75rem',
    height: 32,
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: alpha('#000', 0.12) },
    '&.Mui-focused fieldset': { borderColor: alpha('#9c27b0', 0.5), borderWidth: 1 },
  },
  '& .MuiSelect-select': { py: 0.5, pr: '24px !important' },
  minWidth: 0,
};

export default observer(function ImageGenInput() {
  const { t } = useTranslation();
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const [paramsAnchor, setParamsAnchor] = useState<HTMLElement | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState(imageGenStore.apiKey);
  const [proxyUrlInput, setProxyUrlInput] = useState(imageGenStore.proxyUrl);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const focused = imageGenStore.inputFocused;

  const handleGenerate = async () => {
    if (!imageGenStore.canGenerate) return;
    try {
      await imageGenStore.runGeneration();
    } catch {
      alertError(t('imageGen.error.generationFailed'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleSaveApiKey = () => {
    imageGenStore.setApiKey(apiKeyInput);
    imageGenStore.setProxyUrl(proxyUrlInput);
    setSettingsAnchor(null);
  };

  const openReferences = useCallback(() => {
    imageGenStore.expandLeftPanel();
  }, []);

  const applySuggestion = (key: TranslationKey) => {
    imageGenStore.setPrompt(t(key));
    textareaRef.current?.focus();
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        px: 2,
        pb: 2.5,
        pt: 0,
        bgcolor: 'transparent',
        background: 'none',
      }}
    >
      <Box
        sx={{
          pointerEvents: 'auto',
          width: 'calc(100% - 32px)',
          maxWidth: 720,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {/* Suggestion chips */}
        {!imageGenStore.prompt && !imageGenStore.isGenerating && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {SUGGESTION_KEYS.map((key, i) => (
              <Chip
                key={key}
                label={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box
                      component="span"
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        bgcolor: alpha('#9c27b0', 0.12),
                        color: '#9c27b0',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </Box>
                    <Typography component="span" sx={{ fontSize: '0.78rem', maxWidth: 220 }} noWrap>
                      {t(key)}
                    </Typography>
                  </Box>
                }
                onClick={() => applySuggestion(key)}
                sx={{
                  height: 'auto',
                  py: 0.75,
                  px: 1.25,
                  ...glassSurface,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: alpha('#9c27b0', 0.35),
                    boxShadow: `0 0 0 1px ${alpha('#9c27b0', 0.2)}, 0 4px 12px ${alpha('#9c27b0', 0.12)}`,
                    transform: 'translateY(-1px)',
                  },
                }}
              />
            ))}
          </Box>
        )}

        <Collapse in={!imageGenStore.hasApiKey}>
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={(e) => {
                  setApiKeyInput(imageGenStore.apiKey);
                  setProxyUrlInput(imageGenStore.proxyUrl);
                  setSettingsAnchor(e.currentTarget);
                }}
              >
                {t('imageGen.openSettings')}
              </Button>
            }
            sx={{
              borderRadius: 2,
              py: 0,
              ...glassSurface,
              bgcolor: alpha('#fff', 0.8),
            }}
          >
            {t('imageGen.apiKeyBanner')}
          </Alert>
        </Collapse>

        <Collapse in={!!imageGenStore.error}>
          <Alert
            severity="error"
            onClose={() => imageGenStore.setError(null)}
            sx={{ borderRadius: 2, ...glassSurface, bgcolor: alpha('#fff', 0.85) }}
          >
            {imageGenStore.error}
          </Alert>
        </Collapse>

        {/* Main input card */}
        <Box
          component={motion.div}
          layout
          animate={{
            boxShadow: focused
              ? `0 0 0 2px ${alpha('#9c27b0', 0.25)}, 0 8px 32px ${alpha('#9c27b0', 0.12)}, 0 2px 12px rgba(0,0,0,0.06)`
              : '0 2px 16px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)',
          }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          sx={{
            ...glassSurface,
            bgcolor: alpha('#fff', 0.88),
            borderRadius: 5,
            overflow: 'hidden',
            position: 'relative',
            '&::before': focused ? {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              padding: '1px',
              background: `linear-gradient(135deg, ${alpha('#9c27b0', 0.5)}, ${alpha('#2196f3', 0.35)}, ${alpha('#9c27b0', 0.3)})`,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            } : {},
          }}
        >
          <Box
            component={motion.div}
            layout
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          >
            <TextField
              inputRef={textareaRef}
              placeholder={t('imageGen.promptPlaceholder')}
              value={imageGenStore.prompt}
              onChange={(e) => imageGenStore.setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => imageGenStore.setInputFocused(true)}
              onBlur={() => imageGenStore.setInputFocused(false)}
              multiline
              minRows={focused ? 2 : 1}
              maxRows={6}
              fullWidth
              variant="standard"
              InputProps={{ disableUnderline: true }}
              inputProps={{
                maxLength: 4000,
                style: {
                  fontSize: '0.92rem',
                  padding: '14px 16px 8px',
                  color: '#1a1a1a',
                  lineHeight: 1.5,
                },
              }}
              sx={{
                '& .MuiInputBase-root': {
                  bgcolor: 'transparent',
                  alignItems: 'flex-start',
                  transition: 'min-height 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                '& textarea': {
                  transition: 'height 0.28s cubic-bezier(0.4, 0, 0.2, 1), min-height 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden !important',
                },
              }}
            />
          </Box>

          {/* Toolbar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.25,
              pb: 1.25,
              flexWrap: 'wrap',
            }}
          >
            <Tooltip title={t('imageGen.referenceImages')} arrow>
              <IconButton
                size="small"
                onClick={openReferences}
                sx={{
                  bgcolor: alpha('#000', 0.04),
                  '&:hover': { bgcolor: alpha('#9c27b0', 0.08), color: '#9c27b0' },
                }}
              >
                <CollectionsIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title={t('imageGen.params')} arrow>
              <IconButton
                size="small"
                onClick={(e) => setParamsAnchor(e.currentTarget)}
                sx={{
                  bgcolor: alpha('#000', 0.04),
                  '&:hover': { bgcolor: alpha('#9c27b0', 0.08) },
                }}
              >
                <TuneIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Box sx={{ flex: 1, minWidth: 8 }} />

            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', mr: 0.5 }}>
              {imageGenStore.modelLabel}
            </Typography>

            <Tooltip title={t('imageGen.settings')} arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  setApiKeyInput(imageGenStore.apiKey);
                  setProxyUrlInput(imageGenStore.proxyUrl);
                  setSettingsAnchor(e.currentTarget);
                }}
                sx={{
                  color: imageGenStore.hasApiKey ? 'text.secondary' : 'warning.main',
                }}
              >
                <SettingsIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title={t('imageGen.send')} arrow>
              <span>
                <IconButton
                  disabled={!imageGenStore.canGenerate}
                  onClick={handleGenerate}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: imageGenStore.canGenerate ? '#9c27b0' : alpha('#9c27b0', 0.25),
                    color: 'white',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#7b1fa2',
                      transform: imageGenStore.canGenerate ? 'scale(1.05)' : 'none',
                    },
                    '&:disabled': { color: alpha('#fff', 0.7) },
                  }}
                >
                  {imageGenStore.isGenerating ? (
                    <CircularProgress size={18} sx={{ color: 'white' }} />
                  ) : (
                    <ArrowUpwardIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Params popover */}
      <Popover
        open={Boolean(paramsAnchor)}
        anchorEl={paramsAnchor}
        onClose={() => setParamsAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 3, p: 2, minWidth: 280 } } }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
          {t('imageGen.params')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              {t('imageGen.model')}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={imageGenStore.selectedModel}
              onChange={(e) => imageGenStore.setModel(e.target.value)}
              sx={compactSelectSx}
            >
              {Object.entries(MODEL_LABELS).map(([id, label]) => (
                <MenuItem key={id} value={id} sx={{ fontSize: '0.8rem' }}>{label}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              {t('imageGen.mode')}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={imageGenStore.generationMode}
              onChange={(e) => imageGenStore.setMode(e.target.value as GenerationMode)}
              sx={compactSelectSx}
            >
              {MODE_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.8rem' }}>{t(opt.labelKey)}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              {t('imageGen.size')}
            </Typography>
            <Select
              fullWidth
              size="small"
              value={imageGenStore.selectedSize}
              onChange={(e) => imageGenStore.setSize(e.target.value)}
              sx={compactSelectSx}
            >
              {MODEL_SIZES[imageGenStore.selectedModel]?.map(sz => (
                <MenuItem key={sz} value={sz} sx={{ fontSize: '0.8rem' }}>{sz}</MenuItem>
              )) ?? <MenuItem value="2K">2K</MenuItem>}
            </Select>
          </Box>
        </Box>
      </Popover>

      {/* Settings Popover */}
      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{ paper: { sx: { borderRadius: 3, mt: -1 } } }}
      >
        <Box sx={{ p: 2.5, width: 360, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('imageGen.settings')}</Typography>
          <TextField
            label={t('imageGen.apiKey')}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            size="small"
            fullWidth
            type="password"
            placeholder={t('imageGen.apiKeyPlaceholder')}
            InputProps={{
              sx: { borderRadius: 2 },
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={t('imageGen.getApiKey')} arrow>
                    <IconButton
                      size="small"
                      component="a"
                      href="https://www.volcengine.com/docs/82379/1399008"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LinkIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label={t('imageGen.proxyUrl')}
            value={proxyUrlInput}
            onChange={(e) => setProxyUrlInput(e.target.value)}
            size="small"
            fullWidth
            placeholder={t('imageGen.proxyUrlPlaceholder')}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button size="small" onClick={() => setSettingsAnchor(null)} sx={{ borderRadius: 2 }}>
              {t('imageGen.cancel')}
            </Button>
            <Button size="small" variant="contained" onClick={handleSaveApiKey} sx={{ borderRadius: 2 }}>
              {t('imageGen.save')}
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
});
