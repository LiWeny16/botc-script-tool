import { useState, useRef, useCallback } from 'react';
import {
  Box, TextField, IconButton, alpha, Typography, Select, MenuItem,
  FormControl,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import StopIcon from '@mui/icons-material/Stop';
import { motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { agentStore } from '../../stores/AgentStore';
import { PROVIDER_PRESETS } from '../../utils/agentApiConfig';
import { useTranslation } from '../../utils/i18n';
import { agentAccent, agentBg, agentBgElevated, agentPanelSurface } from './agentStyles';

const INPUT_RADIUS = '20px';

const AgentInput = observer(() => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isThinking = agentStore.status === 'thinking';
  const isConfigured = agentStore.isConfigured;
  const provider = PROVIDER_PRESETS.find(p => p.id === agentStore.selectedProvider);
  const providerId = agentStore.selectedProvider;
  const models = provider?.models ?? [];
  const currentModel = agentStore.apiConfig.model;

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isThinking) return;
    const sent = await agentStore.sendMessage(text);
    if (sent) setInput('');
  }, [input, isThinking]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleStop = useCallback(() => {
    agentStore.cancelGeneration();
  }, []);

  const handleModelSwitch = (newModel: string) => {
    agentStore.updateApiConfig({ model: newModel });
  };

  return (
    <Box
      sx={{
        flexShrink: 0,
        px: 1.5,
        pb: 1.5,
        pt: 0.5,
        bgcolor: agentBg,
      }}
    >
      {/* Provider + Model selector bar */}
      {provider && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1,
            pb: 0.75,
          }}
        >
          <Box
            component="img"
            src={provider.icon}
            sx={{ width: 15, height: 15, flexShrink: 0, opacity: isConfigured ? 0.6 : 0.3 }}
          />
          {isConfigured ? (
            <FormControl size="small" sx={{ minWidth: 0, flex: '0 1 auto' }}>
              <Select
                value={currentModel}
                onChange={e => handleModelSwitch(e.target.value)}
                variant="standard"
                disableUnderline
                MenuProps={{
                  PaperProps: { sx: { maxHeight: 240 } },
                }}
                sx={{
                  fontSize: '0.68rem',
                  color: alpha('#000', 0.42),
                  py: 0,
                  '& .MuiSelect-select': { py: 0, pr: 2.5, pl: 0 },
                  '& .MuiSvgIcon-root': { fontSize: 16, right: 0, color: alpha('#000', 0.3) },
                }}
              >
                {models.map(m => (
                  <MenuItem key={m} value={m} dense sx={{ fontSize: '0.76rem', py: 0.5 }}>
                    {m}
                  </MenuItem>
                ))}
                {!models.includes(currentModel) && (
                  <MenuItem value={currentModel} dense sx={{ fontSize: '0.76rem', py: 0.5, color: agentAccent }}>
                    {currentModel}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          ) : (
            <Typography
              variant="caption"
              sx={{ fontSize: '0.65rem', color: alpha('#000', 0.35), lineHeight: 1 }}
            >
              {t('agent.configureApiKeyHint')}
            </Typography>
          )}
        </Box>
      )}

      {/* Input box */}
      <Box
        component={motion.div}
        animate={{
          boxShadow: focused
            ? `0 0 0 2px ${alpha(agentAccent, 0.22)}, 0 4px 24px ${alpha(agentAccent, 0.12)}`
            : '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.08)',
        }}
        transition={{ duration: 0.22 }}
        sx={{
          ...agentPanelSurface,
          borderRadius: INPUT_RADIUS,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          p: 1,
          bgcolor: agentBgElevated,
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder={
            !isConfigured
              ? t('agent.configureApiKeyPlaceholder')
              : isThinking
                ? t('agent.thinking')
                : t('agent.inputPlaceholder')
          }
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={isThinking || !isConfigured}
          variant="standard"
          InputProps={{ disableUnderline: true }}
          inputProps={{
            style: {
              fontSize: '0.88rem',
              padding: '6px 4px',
              lineHeight: 1.5,
              transition: 'height 0.18s ease',
            },
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            '& .MuiInputBase-root': { alignItems: 'flex-end' },
          }}
        />
        {isThinking ? (
          <IconButton
            onClick={handleStop}
            size="small"
            sx={{
              flexShrink: 0,
              bgcolor: '#ef5350',
              color: '#fff',
              width: 34,
              height: 34,
              borderRadius: '50%',
              '&:hover': { bgcolor: '#e53935' },
            }}
          >
            <StopIcon sx={{ fontSize: 18 }} />
          </IconButton>
        ) : (
          <IconButton
            onClick={handleSend}
            size="small"
            disabled={!isConfigured || !input.trim()}
            sx={{
              flexShrink: 0,
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ab47bc, #7b1fa2)',
              color: '#fff',
              '&:hover': {
                background: 'linear-gradient(135deg, #ba68c8, #8e24aa)',
              },
              '&:disabled': {
                background: alpha(agentAccent, 0.2),
                color: alpha('#fff', 0.6),
              },
            }}
          >
            <ArrowUpwardIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
});

export default AgentInput;
