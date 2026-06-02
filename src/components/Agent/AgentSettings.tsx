import { useState } from 'react';
import {
  Box, Typography, TextField, IconButton, Button, alpha, Alert, Popover, Tooltip,
  ToggleButtonGroup, ToggleButton, Slider, Collapse,
} from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { observer } from 'mobx-react-lite';
import { agentStore } from '../../stores/AgentStore';
import { authStore } from '../../stores/AuthStore';
import { saveApiConfigToCloud, loadApiConfigFromCloud, type AgentApiConfig } from '../../utils/agentApiConfig';
import { agentAccent, agentPanelSurface, agentRadiusLg, agentRadiusSm } from './agentStyles';

// ── Presets ──

interface ProviderPreset {
  id: string;
  name: string;
  icon: string;
  format: AgentApiConfig['format'];
  baseURL: string;
  model: string;
}

const PRESETS: ProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '/imgs/icons/brands/deepseek-color.svg',
    format: 'openai',
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-v4-pro',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '/imgs/icons/brands/openai-color.svg',
    format: 'openai',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '/imgs/icons/brands/anthropic-color.svg',
    format: 'anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-6',
  },
];

function detectPreset(config: AgentApiConfig): string {
  for (const p of PRESETS) {
    if (p.format === config.format && p.baseURL === config.baseURL && p.model === config.model) {
      return p.id;
    }
  }
  return 'custom';
}

function loadStoredNumber(key: string, fallback: number): number {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    const n = Number(v);
    return isNaN(n) ? fallback : n;
  } catch { return fallback; }
}

function saveStoredNumber(key: string, value: number): void {
  try { localStorage.setItem(key, String(value)); } catch { /* */ }
}

// ── Component ──

const AgentSettings = observer(() => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const currentPreset = detectPreset(agentStore.apiConfig);
  const [preset, setPreset] = useState<string>(currentPreset);

  const [apiKey, setApiKey] = useState(agentStore.apiConfig.apiKey);
  const [model, setModel] = useState(agentStore.apiConfig.model);
  const [baseURL, setBaseURL] = useState(agentStore.apiConfig.baseURL);
  const [format, setFormat] = useState(agentStore.apiConfig.format);

  // Advanced params
  const [temperature, setTemperature] = useState(() => loadStoredNumber('botc-agent-temperature', 0.7));
  const [maxTokens, setMaxTokens] = useState(() => loadStoredNumber('botc-agent-max-tokens', 4096));
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    const cfg = agentStore.apiConfig;
    setApiKey(cfg.apiKey);
    setModel(cfg.model);
    setBaseURL(cfg.baseURL);
    setFormat(cfg.format);
    setPreset(detectPreset(cfg));
    setTemperature(loadStoredNumber('botc-agent-temperature', 0.7));
    setMaxTokens(loadStoredNumber('botc-agent-max-tokens', 4096));
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMessage(null);
  };

  const applyPreset = (presetId: string) => {
    setPreset(presetId);
    if (presetId === 'custom') return;
    const p = PRESETS.find(pp => pp.id === presetId)!;
    setFormat(p.format);
    setBaseURL(p.baseURL);
    setModel(p.model);
  };

  const handleSave = () => {
    agentStore.updateApiConfig({ format, apiKey, baseURL, model });
    saveStoredNumber('botc-agent-temperature', temperature);
    saveStoredNumber('botc-agent-max-tokens', maxTokens);
    setMessage('已保存到本地');
    setTimeout(() => setMessage(null), 2000);
  };

  const handleSaveToCloud = async () => {
    setSaving(true);
    const ok = await saveApiConfigToCloud({ format, apiKey, baseURL, model });
    setMessage(ok ? '已同步到云端' : '保存失败，请先登录');
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLoadFromCloud = async () => {
    const cloud = await loadApiConfigFromCloud();
    if (cloud) {
      if (cloud.format !== undefined) setFormat(cloud.format);
      if (cloud.apiKey) setApiKey(cloud.apiKey);
      if (cloud.baseURL) setBaseURL(cloud.baseURL);
      if (cloud.model) setModel(cloud.model);
      const merged = {
        format: cloud.format ?? format,
        apiKey: cloud.apiKey ?? apiKey,
        baseURL: cloud.baseURL ?? baseURL,
        model: cloud.model ?? model,
      };
      agentStore.updateApiConfig(merged);
      setPreset(detectPreset(merged));
      setMessage('已从云端加载');
    } else {
      setMessage('云端暂无配置');
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': { borderRadius: agentRadiusSm, fontSize: '0.82rem' },
    '& .MuiInputLabel-root': { fontSize: '0.8rem' },
  };

  return (
    <>
      <Tooltip title="API 配置">
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
              width: 370,
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#000', 0.12), borderRadius: 2 },
            },
          },
        }}
      >
        <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              API 配置
            </Typography>
            {authStore.isLoggedIn && (
              <Box sx={{ display: 'flex', gap: 0.25 }}>
                <Tooltip title="上传到云端">
                  <IconButton size="small" onClick={handleSaveToCloud} disabled={saving}>
                    <CloudUploadOutlinedIcon sx={{ fontSize: 16, color: alpha('#000', 0.4) }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="从云端加载">
                  <IconButton size="small" onClick={handleLoadFromCloud}>
                    <CloudDownloadOutlinedIcon sx={{ fontSize: 16, color: alpha('#000', 0.4) }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* ── Provider Tabs (icon-only to avoid overflow) ── */}
          <ToggleButtonGroup
            value={preset}
            exclusive
            onChange={(_, v) => v && applyPreset(v)}
            size="small"
            sx={{
              display: 'flex',
              '& .MuiToggleButtonGroup-grouped': { m: 0, border: '1px solid', borderColor: alpha('#000', 0.12) },
              '& .MuiToggleButtonGroup-firstButton': { borderTopLeftRadius: agentRadiusSm, borderBottomLeftRadius: agentRadiusSm },
              '& .MuiToggleButtonGroup-lastButton': { borderTopRightRadius: agentRadiusSm, borderBottomRightRadius: agentRadiusSm },
              '& .MuiToggleButtonGroup-middleButton': { borderRadius: 0, ml: '-1px' },
            }}
          >
            {PRESETS.map(p => (
              <Tooltip key={p.id} title={p.name} placement="top">
                <ToggleButton
                  value={p.id}
                  sx={{
                    flex: 1,
                    py: 0.6,
                    textTransform: 'none',
                    minWidth: 0,
                    bgcolor: preset === p.id ? alpha(agentAccent, 0.07) : 'transparent',
                    '&:hover': { bgcolor: alpha(agentAccent, 0.04) },
                  }}
                >
                  <Box component="img" src={p.icon} sx={{ width: 22, height: 22 }} />
                </ToggleButton>
              </Tooltip>
            ))}
            <Tooltip title="自定义" placement="top">
              <ToggleButton
                value="custom"
                sx={{
                  py: 0.6,
                  minWidth: 0,
                  px: 1.2,
                  color: preset === 'custom' ? agentAccent : alpha('#000', 0.5),
                  bgcolor: preset === 'custom' ? alpha(agentAccent, 0.07) : 'transparent',
                  '&:hover': { bgcolor: alpha(agentAccent, 0.04) },
                }}
              >
                <TuneIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>

          {/* Current provider indicator */}
          <Typography variant="caption" sx={{ color: alpha('#000', 0.45), mt: -0.5, fontSize: '0.7rem' }}>
            {preset === 'custom' ? '手动配置' : `${PRESETS.find(p => p.id === preset)!.name} · ${format === 'anthropic' ? 'Anthropic' : 'OpenAI 兼容'}`}
          </Typography>

          {/* ── API Key ── */}
          <TextField
            size="small"
            label="API Key"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            fullWidth
            placeholder={format === 'anthropic' ? 'sk-ant-api03-...' : 'sk-...'}
            sx={fieldSx}
          />

          {/* ── Model ── */}
          <TextField
            size="small"
            label="模型 ID"
            value={model}
            onChange={e => { setModel(e.target.value); if (preset !== 'custom') setPreset('custom'); }}
            fullWidth
            sx={fieldSx}
          />

          {/* ── Base URL ── */}
          <TextField
            size="small"
            label="Base URL"
            value={baseURL}
            onChange={e => { setBaseURL(e.target.value); if (preset !== 'custom') setPreset('custom'); }}
            fullWidth
            sx={fieldSx}
          />

          {/* ── Advanced Toggle ── */}
          <Box
            onClick={() => setShowAdvanced(!showAdvanced)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              color: alpha('#000', 0.5),
              userSelect: 'none',
              '&:hover': { color: alpha('#000', 0.7) },
            }}
          >
            <ExpandMoreIcon
              sx={{
                fontSize: 16,
                transition: 'transform 0.2s',
                transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
            <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>
              高级参数
            </Typography>
          </Box>

          <Collapse in={showAdvanced}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Temperature */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', color: alpha('#000', 0.6) }}>
                    Temperature
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600, color: alpha('#000', 0.7) }}>
                    {temperature.toFixed(1)}
                  </Typography>
                </Box>
                <Slider
                  size="small"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(_, v) => setTemperature(v as number)}
                  sx={{ py: 0.3, '& .MuiSlider-thumb': { width: 12, height: 12 } }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: alpha('#000', 0.3) }}>精确</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: alpha('#000', 0.3) }}>创意</Typography>
                </Box>
              </Box>

              {/* Max Tokens */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', color: alpha('#000', 0.6) }}>
                    最大输出 Tokens
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600, color: alpha('#000', 0.7) }}>
                    {maxTokens}
                  </Typography>
                </Box>
                <Slider
                  size="small"
                  min={512}
                  max={16384}
                  step={512}
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
            保存本地
          </Button>

          {message && (
            <Alert
              severity={message.includes('失败') || message.includes('暂无') ? 'warning' : 'success'}
              sx={{ py: 0, borderRadius: agentRadiusSm, fontSize: '0.76rem' }}
            >
              {message}
            </Alert>
          )}
        </Box>
      </Popover>
    </>
  );
});

export default AgentSettings;
