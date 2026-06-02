import { useState, useRef, useCallback } from 'react';
import { Box, TextField, IconButton, alpha, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import StopIcon from '@mui/icons-material/Stop';
import { motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { agentStore } from '../../stores/AgentStore';
import { PROVIDER_PRESETS } from '../../utils/agentApiConfig';
import { agentAccent, agentBg, agentBgElevated, agentPanelSurface, agentRadiusMd } from './agentStyles';

const AgentInput = observer(() => {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isThinking = agentStore.status === 'thinking';
  const isConfigured = agentStore.isConfigured;
  const provider = PROVIDER_PRESETS.find(p => p.id === agentStore.selectedProvider);

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
      {/* Provider indicator */}
      {provider && isConfigured && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 0.5,
            pb: 0.5,
          }}
        >
          <Box
            component="img"
            src={provider.icon}
            sx={{ width: 14, height: 14, flexShrink: 0 }}
          />
          <Typography
            variant="caption"
            sx={{ fontSize: '0.65rem', color: alpha('#000', 0.38), lineHeight: 1 }}
          >
            {provider.name} · {agentStore.apiConfig.model}
          </Typography>
        </Box>
      )}
      <Box
        component={motion.div}
        animate={{
          boxShadow: focused
            ? `0 0 0 2px ${alpha(agentAccent, 0.22)}, 0 4px 20px ${alpha(agentAccent, 0.1)}`
            : '0 1px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06)',
        }}
        transition={{ duration: 0.22 }}
        sx={{
          ...agentPanelSurface,
          borderRadius: agentRadiusMd,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 0.75,
          p: 0.75,
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
              ? '请先在设置中保存 API Key...'
              : isThinking
                ? '思考中...'
                : '输入消息...'
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
