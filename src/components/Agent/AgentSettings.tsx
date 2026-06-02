import { useState } from 'react';
import {
  Box, Typography, TextField, IconButton, Select, MenuItem,
  FormControl, InputLabel, Button, alpha, Alert, Popover, Tooltip,
} from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import { observer } from 'mobx-react-lite';
import { agentStore } from '../../stores/AgentStore';
import { authStore } from '../../stores/AuthStore';
import { saveApiConfigToCloud, loadApiConfigFromCloud, type AgentApiConfig } from '../../utils/agentApiConfig';
import { agentAccent, agentCompactSelectSx, agentPanelSurface, agentRadiusLg, agentRadiusSm } from './agentStyles';

const FORMAT_OPTIONS: { value: AgentApiConfig['format']; label: string }[] = [
  { value: 'openai', label: 'OpenAI 兼容（DeepSeek / OpenAI 等）' },
  { value: 'anthropic', label: 'Anthropic（Claude）' },
];

const AgentSettings = observer(() => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const [format, setFormat] = useState<AgentApiConfig['format']>(agentStore.apiConfig.format);
  const [apiKey, setApiKey] = useState(agentStore.apiConfig.apiKey);
  const [baseURL, setBaseURL] = useState(agentStore.apiConfig.baseURL);
  const [model, setModel] = useState(agentStore.apiConfig.model);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setFormat(agentStore.apiConfig.format);
    setApiKey(agentStore.apiConfig.apiKey);
    setBaseURL(agentStore.apiConfig.baseURL);
    setModel(agentStore.apiConfig.model);
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMessage(null);
  };

  const handleSave = () => {
    agentStore.updateApiConfig({ format, apiKey, baseURL, model });
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
      if (cloud.format) setFormat(cloud.format);
      if (cloud.apiKey) setApiKey(cloud.apiKey);
      if (cloud.baseURL) setBaseURL(cloud.baseURL);
      if (cloud.model) setModel(cloud.model);
      agentStore.updateApiConfig({
        format: cloud.format ?? format,
        apiKey: cloud.apiKey ?? apiKey,
        baseURL: cloud.baseURL ?? baseURL,
        model: cloud.model ?? model,
      });
      setMessage('已从云端加载');
    } else {
      setMessage('云端暂无配置');
    }
    setTimeout(() => setMessage(null), 3000);
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
              width: 320,
              maxWidth: 'calc(100vw - 32px)',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
            API 配置
          </Typography>

          <FormControl size="small" fullWidth sx={agentCompactSelectSx}>
            <InputLabel>接口格式</InputLabel>
            <Select
              value={format}
              label="接口格式"
              onChange={e => setFormat(e.target.value as AgentApiConfig['format'])}
              MenuProps={{ PaperProps: { sx: { maxWidth: 300 } } }}
            >
              {FORMAT_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.8rem', whiteSpace: 'normal' }}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="API Key"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            fullWidth
            placeholder={format === 'openai' ? 'sk-...' : 'sk-ant-...'}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: agentRadiusSm,
                fontSize: '0.85rem',
              },
            }}
          />

          {format === 'openai' && (
            <TextField
              size="small"
              label="模型 ID"
              value={model}
              onChange={e => setModel(e.target.value)}
              fullWidth
              placeholder="deepseek-v4-pro"
              helperText="DeepSeek 示例：deepseek-v4-pro、deepseek-chat"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: agentRadiusSm,
                  fontSize: '0.85rem',
                },
                '& .MuiFormHelperText-root': { fontSize: '0.7rem', mx: 0 },
              }}
            />
          )}

          <TextField
            size="small"
            label="Base URL（可选）"
            value={baseURL}
            onChange={e => setBaseURL(e.target.value)}
            fullWidth
            placeholder={format === 'openai' ? 'https://api.deepseek.com' : 'https://api.anthropic.com/v1'}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: agentRadiusSm,
                fontSize: '0.85rem',
              },
            }}
          />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="contained"
              onClick={handleSave}
              sx={{
                flex: 1,
                minWidth: 100,
                borderRadius: agentRadiusSm,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #ab47bc, #7b1fa2)',
                boxShadow: 'none',
                '&:hover': { background: 'linear-gradient(135deg, #ba68c8, #8e24aa)', boxShadow: 'none' },
              }}
            >
              保存本地
            </Button>
            {authStore.isLoggedIn && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CloudUploadOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={handleSaveToCloud}
                  disabled={saving}
                  sx={{ borderRadius: agentRadiusSm, textTransform: 'none', fontSize: '0.78rem' }}
                >
                  云端
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CloudDownloadOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={handleLoadFromCloud}
                  sx={{ borderRadius: agentRadiusSm, textTransform: 'none', fontSize: '0.78rem' }}
                >
                  加载
                </Button>
              </>
            )}
          </Box>

          {message && (
            <Alert
              severity={message.includes('失败') || message.includes('暂无') ? 'warning' : 'success'}
              sx={{ py: 0, borderRadius: agentRadiusSm, fontSize: '0.78rem' }}
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
