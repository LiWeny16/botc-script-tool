import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Box, Typography, TextField, IconButton, Button, alpha, Alert, Popover, Tooltip,
  Slider, Collapse, MenuItem,
  InputAdornment,
} from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../../utils/i18n';
import { agentStore } from '../../stores/AgentStore';
import { authStore } from '../../stores/AuthStore';
import {
  PROVIDER_PRESETS, getProviderConfig, saveProviderConfig,
  saveApiConfigToCloud, loadApiConfigFromCloud, getSelectedProvider,
  type ProviderConfig,
} from '../../utils/agentApiConfig';
import { agentAccent, agentPanelSurface, agentRadiusLg, agentRadiusSm } from './agentStyles';

type ProviderId = string;

function loadNum(key: string, fallback: number): number {
  try {
    const v = sessionStorage.getItem(key);
    if (v === null) return fallback;
    const n = Number(v);
    return isNaN(n) ? fallback : n;
  } catch { return fallback; }
}

function saveNum(key: string, value: number): void {
  try { sessionStorage.setItem(key, String(value)); } catch { /* */ }
}

const AgentSettings = observer(() => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  // Which provider tab is selected
  const [providerId, setProviderId] = useState<ProviderId>(() => getSelectedProvider());

  // Per-provider fields loaded from localStorage
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Advanced
  const [temperature, setTemperature] = useState(() => loadNum('botc-agent-temperature', 0.7));
  const [maxTokens, setMaxTokens] = useState(() => loadNum('botc-agent-max-tokens', 4096));
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; severity: 'success' | 'warning' } | null>(null);

  // Load provider config into local state
  const loadProvider = useCallback((pid: ProviderId) => {
    const cfg = getProviderConfig(pid);
    setApiKey(cfg.apiKey);
    setModel(cfg.model);
    setBaseURL(cfg.baseURL);
  }, []);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    // Sync from MobX store (single source of truth) + localStorage
    const current = getSelectedProvider();
    setProviderId(current);
    const cfg = { ...getProviderConfig(current), ...agentStore.apiConfig };
    setApiKey(cfg.apiKey);
    setModel(cfg.model);
    setBaseURL(cfg.baseURL);
    setTemperature(loadNum('botc-agent-temperature', 0.7));
    setMaxTokens(loadNum('botc-agent-max-tokens', 4096));
    setMessage(null);
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMessage(null);
  };

  const applyConfig = (pid: ProviderId, cfg: { apiKey?: string; model?: string; baseURL?: string }) => {
    saveProviderConfig(pid, cfg);
    if (agentStore.selectedProvider === pid || pid === providerId) {
      agentStore.setProvider(pid);
      agentStore.refreshApiConfig();
    }
  };

  const switchProvider = (pid: ProviderId) => {
    // Save current + switch → auto-apply
    saveProviderConfig(providerId, { apiKey, model, baseURL });
    setProviderId(pid);
    loadProvider(pid);
    // Auto-apply new provider
    const cfg = getProviderConfig(pid);
    agentStore.setProvider(pid);
    agentStore.refreshApiConfig();
    // Also update local state from freshly loaded config
    setApiKey(cfg.apiKey);
    setModel(cfg.model);
    setBaseURL(cfg.baseURL);
  };

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    applyConfig(providerId, { model: newModel });
  };

  const handleSave = () => {
    saveProviderConfig(providerId, { apiKey, model, baseURL });
    saveNum('botc-agent-temperature', temperature);
    saveNum('botc-agent-max-tokens', maxTokens);
    agentStore.setProvider(providerId);
    agentStore.refreshApiConfig();
    setMessage({ text: t('agent.saved'), severity: 'success' });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleSaveToCloud = async () => {
    setSaving(true);
    const preset = PROVIDER_PRESETS.find(p => p.id === providerId);
    const ok = await saveApiConfigToCloud({
      format: preset?.format ?? 'openai',
      apiKey,
      baseURL,
      model,
    });
    setMessage({
      text: ok ? t('agent.syncedToCloud') : t('agent.saveFailed'),
      severity: ok ? 'success' : 'warning',
    });
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLoadFromCloud = async () => {
    const cloud = await loadApiConfigFromCloud();
    if (cloud) {
      if (cloud.apiKey) setApiKey(cloud.apiKey);
      if (cloud.baseURL) setBaseURL(cloud.baseURL);
      if (cloud.model) setModel(cloud.model);
      saveProviderConfig(providerId, {
        apiKey: cloud.apiKey ?? apiKey,
        baseURL: cloud.baseURL ?? baseURL,
        model: cloud.model ?? model,
      });
      agentStore.refreshApiConfig();
      setMessage({ text: t('agent.loadedFromCloud'), severity: 'success' });
    } else {
      setMessage({ text: t('agent.noCloudConfig'), severity: 'warning' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const preset = PROVIDER_PRESETS.find(p => p.id === providerId);
  const isCustom = providerId === 'custom';
  const presetModels = preset?.models ?? [];
  const isCustomModel = !isCustom && model && !presetModels.includes(model);

  const sharedFieldSx = {
    '& .MuiOutlinedInput-root': { borderRadius: agentRadiusSm, fontSize: '0.82rem' },
    '& .MuiInputLabel-root': { fontSize: '0.78rem' },
  };

  return (
    <>
      <Tooltip title={t('agent.apiConfig')}>
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{
            color: open ? agentAccent : alpha('#000', 0.45),
            bgcolor: open ? alpha(agentAccent, 0.08) : 'transparent',
            '&:hover': { bgcolor: alpha(agentAccent, 0.06), color: agentAccent },
          }}
        >
          <SettingsOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              ...agentPanelSurface,
              borderRadius: agentRadiusLg,
              mt: 0.5,
              width: 380,
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#000', 0.12), borderRadius: 2 },
            },
          },
        }}
      >
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {t('agent.apiConfig')}
            </Typography>
            {authStore.isLoggedIn && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title={t('agent.saveToCloud')}>
                  <IconButton size="small" onClick={handleSaveToCloud} disabled={saving}>
                    <CloudUploadOutlinedIcon sx={{ fontSize: 15, color: alpha('#000', 0.4) }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('agent.loadFromCloud')}>
                  <IconButton size="small" onClick={handleLoadFromCloud}>
                    <CloudDownloadOutlinedIcon sx={{ fontSize: 15, color: alpha('#000', 0.4) }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* ── Provider Tabs ── */}
          <Box
            sx={{
              display: 'flex',
              border: '1px solid',
              borderColor: alpha('#000', 0.12),
              borderRadius: agentRadiusSm,
              overflow: 'hidden',
            }}
          >
            {PROVIDER_PRESETS.map((p, i) => (
              <Tooltip key={p.id} title={p.name} placement="top">
                <Box
                  onClick={() => switchProvider(p.id)}
                  sx={{
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 0.65,
                    cursor: 'pointer',
                    borderRight: i < PROVIDER_PRESETS.length - 1 ? '1px solid' : 'none',
                    borderRightColor: alpha('#000', 0.12),
                    '&:hover': { bgcolor: alpha(agentAccent, 0.04) },
                  }}
                >
                  {providerId === p.id && (
                    <motion.div
                      layoutId="provider-tab-bg"
                      style={{ position: 'absolute', inset: 0, background: alpha(agentAccent, 0.09) }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Box
                    component="img"
                    src={p.icon}
                    sx={{ width: 22, height: 22, position: 'relative', zIndex: 1 }}
                  />
                </Box>
              </Tooltip>
            ))}
            <Tooltip title={t('agent.custom')} placement="top">
              <Box
                onClick={() => switchProvider('custom')}
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 0.65,
                  px: 1.2,
                  cursor: 'pointer',
                  borderLeft: '1px solid',
                  borderLeftColor: alpha('#000', 0.12),
                  color: isCustom ? agentAccent : alpha('#000', 0.5),
                  '&:hover': { bgcolor: alpha(agentAccent, 0.04) },
                }}
              >
                {isCustom && (
                  <motion.div
                    layoutId="provider-tab-bg"
                    style={{ position: 'absolute', inset: 0, background: alpha(agentAccent, 0.09) }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <TuneIcon sx={{ fontSize: 18, position: 'relative', zIndex: 1 }} />
              </Box>
            </Tooltip>
          </Box>

          {/* Provider status line */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: -0.5 }}>
            <FiberManualRecordIcon
              sx={{
                fontSize: 8,
                color: agentStore.selectedProvider === providerId ? '#4caf50' : alpha('#000', 0.2),
              }}
            />
            <Typography variant="caption" sx={{ color: alpha('#000', 0.45), fontSize: '0.7rem' }}>
              {isCustom
                ? t('agent.manualConfig')
                : `${preset?.name ?? ''} · ${preset?.format === 'anthropic' ? t('agent.anthropicApi') : t('agent.openaiCompatible')}`}
              {agentStore.selectedProvider === providerId ? t('agent.currentlyActive') : ''}
            </Typography>
          </Box>

          {/* ── API Key ── */}
          <TextField
            size="small"
            label={t('agent.apiKey')}
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            fullWidth
            placeholder={preset?.format === 'anthropic' ? 'sk-ant-api03-...' : 'sk-...'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowKey(!showKey)}
                    edge="end"
                    sx={{ p: 0.25 }}
                  >
                    {showKey
                      ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                      : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                    }
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={sharedFieldSx}
          />

          {/* ── Model ── */}
          <TextField
            size="small"
            label={t('agent.model')}
            value={model}
            onChange={e => handleModelChange(e.target.value)}
            fullWidth
            select={!isCustom && presetModels.length > 0}
            sx={sharedFieldSx}
          >
            {!isCustom && presetModels.map(m => (
              <MenuItem key={m} value={m} sx={{ fontSize: '0.82rem' }}>
                {m}
              </MenuItem>
            ))}
            {isCustomModel && (
              <MenuItem value={model} sx={{ fontSize: '0.82rem', color: agentAccent }}>
                {model}{t('agent.customModelSuffix')}
              </MenuItem>
            )}
          </TextField>

          {/* ── Base URL ── */}
          <TextField
            size="small"
            label={t('agent.baseUrl')}
            value={baseURL}
            onChange={e => setBaseURL(e.target.value)}
            fullWidth
            sx={sharedFieldSx}
          />

          {/* ── Advanced ── */}
          <Box
            onClick={() => setShowAdvanced(!showAdvanced)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer',
              color: alpha('#000', 0.5), userSelect: 'none',
              '&:hover': { color: alpha('#000', 0.7) },
            }}
          >
            <ExpandMoreIcon sx={{
              fontSize: 16,
              transition: 'transform 0.2s',
              transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
            }} />
            <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>
              {t('agent.advanced')}
            </Typography>
          </Box>

          <Collapse in={showAdvanced}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Temperature */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', color: alpha('#000', 0.6) }}>
                    {t('agent.temperature')}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                    {temperature.toFixed(1)}
                  </Typography>
                </Box>
                <Slider
                  size="small" min={0} max={2} step={0.1}
                  value={temperature}
                  onChange={(_, v) => setTemperature(v as number)}
                  sx={{ py: 0.3, '& .MuiSlider-thumb': { width: 12, height: 12 } }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: alpha('#000', 0.3) }}>{t('agent.precise')}</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: alpha('#000', 0.3) }}>{t('agent.creative')}</Typography>
                </Box>
              </Box>

              {/* Max Tokens */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', color: alpha('#000', 0.6) }}>
                    {t('agent.maxTokens')}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                    {maxTokens}
                  </Typography>
                </Box>
                <Slider
                  size="small" min={512} max={16384} step={512}
                  value={maxTokens}
                  onChange={(_, v) => setMaxTokens(v as number)}
                  sx={{ py: 0.3, '& .MuiSlider-thumb': { width: 12, height: 12 } }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: alpha('#000', 0.3) }}>512</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: alpha('#000', 0.3) }}>16384</Typography>
                </Box>
              </Box>
            </Box>
          </Collapse>

          {/* ── Save ── */}
          <Button
            size="small"
            variant="contained"
            onClick={handleSave}
            fullWidth
            sx={{
              mt: 0.5,
              borderRadius: agentRadiusSm,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              py: 0.7,
              background: 'linear-gradient(135deg, #ab47bc, #7b1fa2)',
              boxShadow: 'none',
              '&:hover': { background: 'linear-gradient(135deg, #ba68c8, #8e24aa)', boxShadow: 'none' },
            }}
          >
            {t('agent.saveLocal')}
          </Button>

          {message && (
            <Alert severity={message.severity}
              sx={{ py: 0, borderRadius: agentRadiusSm, fontSize: '0.76rem' }}>
              {message.text}
            </Alert>
          )}

          {/* ── Privacy Notice ── */}
          <Typography
            variant="caption"
            sx={{
              textAlign: 'center',
              color: alpha('#000', 0.3),
              fontSize: '0.65rem',
              mt: -0.25,
              lineHeight: 1.4,
            }}
          >
            {t('agent.privacyNotice')}
          </Typography>
        </Box>
      </Popover>
    </>
  );
});

export default AgentSettings;
