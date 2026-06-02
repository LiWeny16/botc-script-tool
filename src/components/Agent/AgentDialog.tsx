import { useRef, useEffect } from 'react';
import { Box, Typography, IconButton, alpha, CircularProgress, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { motion, AnimatePresence } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../../utils/i18n';
import { agentStore } from '../../stores/AgentStore';
import { preloadKnowledge } from '../../utils/agentKnowledge';
import AgentBubble from './AgentBubble';
import AgentInput from './AgentInput';
import AgentSettings from './AgentSettings';
import { agentAccent, agentBg, agentBgHeader, agentPanelSurface, agentRadiusLg } from './agentStyles';

const dialogVariants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.94,
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 420, damping: 32 },
  },
};

const AgentDialog = observer(() => {
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOpen = agentStore.dialogOpen;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      preloadKnowledge(); // warm knowledge cache while user reads intro
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentStore.messages, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Box
          component={motion.div}
          variants={dialogVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          sx={{
            position: 'fixed',
            bottom: 88,
            left: 24,
            width: 400,
            maxWidth: 'calc(100vw - 48px)',
            height: 'min(520px, calc(100vh - 120px))',
            zIndex: 1198,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: agentRadiusLg,
            overflow: 'hidden',
            ...agentPanelSurface,
            boxShadow: '0 8px 40px rgba(0,0,0,0.14), 0 2px 12px rgba(0,0,0,0.08)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 1,
              flexShrink: 0,
              borderBottom: '1px solid',
              borderColor: alpha('#000', 0.06),
              bgcolor: agentBgHeader,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #ce93d8, #8e24aa)',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 15 }} />
              </Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap' }}
              >
                {t('agent.title')}
              </Typography>
              {agentStore.status === 'thinking' && (
                <CircularProgress size={14} sx={{ color: agentAccent, flexShrink: 0 }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0 }}>
              <AgentSettings />
              <IconButton
                size="small"
                onClick={() => agentStore.clearHistory()}
                sx={{ color: alpha('#000', 0.4), '&:hover': { color: '#ef5350' } }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => agentStore.setDialogOpen(false)}
                sx={{ color: alpha('#000', 0.4) }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              px: 1.5,
              py: 1.5,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: agentBg,
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: alpha('#000', 0.12), borderRadius: 2 },
            }}
          >
            {agentStore.messages.length === 0 && (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 4,
                  px: 2,
                  gap: 1,
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 36, color: alpha(agentAccent, 0.25) }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center', fontSize: '0.82rem', lineHeight: 1.6, maxWidth: 280 }}
                >
                  {agentStore.isConfigured
                    ? t('agent.welcomeConfigured')
                    : t('agent.welcomeNotConfigured')}
                </Typography>
              </Box>
            )}

            {agentStore.error && agentStore.messages.length > 0 && (
              <Alert
                severity="error"
                onClose={() => agentStore.clearError()}
                sx={{ mb: 1, py: 0.25, fontSize: '0.78rem', borderRadius: 1.5 }}
              >
                {agentStore.error}
              </Alert>
            )}

            {agentStore.messages.map(msg => (
              <AgentBubble key={msg.id} message={msg} />
            ))}

            {agentStore.status === 'thinking' && agentStore.messages.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1, py: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 0.4 }}>
                  {[0, 1, 2].map(i => (
                    <Box
                      key={i}
                      component={motion.div}
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: agentAccent }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          <AgentInput />
        </Box>
      )}
    </AnimatePresence>
  );
});

export default AgentDialog;
