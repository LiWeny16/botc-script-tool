import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress, alpha, IconButton, Tooltip } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Cloud } from 'lucide-react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { loadSharedScript } from '../lib/cloudScripts';
import ScriptRenderer from '../components/ScriptRenderer';
import { generateScript } from '../utils/scriptGenerator';
import type { Script } from '../types';

const theme = createTheme();

export default function SharedScriptView() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [script, setScript] = useState<Script | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shareId) return;
    (async () => {
      const result = await loadSharedScript(shareId);
      if (!result) {
        setError('Shared script not found or link expired.');
        setLoading(false);
        return;
      }
      setName(result.name);
      setScript(generateScript(result.json));
      setLoading(false);
    })();
  }, [shareId]);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#F6F1DC', pb: 4 }}>
        <Box
          sx={{
            display: 'flex', alignItems: 'center', px: 2, py: 1,
            bgcolor: 'white', borderBottom: '1px solid', borderColor: alpha('#000', 0.06),
          }}
        >
          <Tooltip title="Back to Editor" arrow>
            <IconButton size="small" onClick={() => navigate('/')}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Cloud size={18} strokeWidth={1.8} style={{ marginLeft: 8, color: '#6366f1' }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ ml: 1 }}>
            {loading ? 'Loading...' : name || 'Shared Script'}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.disabled">
            Shared via BotC Script Tool
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary" sx={{ mt: 2 }}>Loading shared script...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Cloud size={48} strokeWidth={1} color="#ccc" />
            <Typography color="text.secondary" sx={{ mt: 2 }}>{error}</Typography>
          </Box>
        ) : script ? (
          <ScriptRenderer script={script} theme={theme} readOnly />
        ) : null}
      </Box>
    </ThemeProvider>
  );
}
