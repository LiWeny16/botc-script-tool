import { Fab, Zoom, Badge, Box } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../../utils/i18n';
import { keyframes } from '@mui/material';
import { agentStore } from '../../stores/AgentStore';
import { agentGradient } from './agentStyles';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(156, 39, 176, 0.45); }
  70% { box-shadow: 0 0 0 14px rgba(156, 39, 176, 0); }
  100% { box-shadow: 0 0 0 0 rgba(156, 39, 176, 0); }
`;

const AgentFAB = observer(() => {
  const { t } = useTranslation();
  const isThinking = agentStore.status === 'thinking';

  return (
    <Zoom in>
      <Fab
        aria-label={t('agent.title')}
        onClick={() => agentStore.toggleDialog()}
        sx={{
          position: 'fixed',
          bottom: { xs: 20, sm: 24 },
          left: { xs: 20, sm: 24 },
          zIndex: 1199,
          width: 52,
          height: 52,
          background: agentGradient,
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.35)',
          animation: isThinking ? `${pulse} 1.8s infinite` : 'none',
          boxShadow: isThinking
            ? '0 6px 28px rgba(142, 36, 170, 0.45)'
            : '0 4px 20px rgba(106, 27, 154, 0.32)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, #ba68c8 0%, #9c27b0 45%, #7b1fa2 100%)',
            boxShadow: '0 8px 32px rgba(142, 36, 170, 0.5)',
            transform: 'scale(1.06)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
          '@media print': { display: 'none' },
        }}
      >
        <Badge
          color="error"
          variant="dot"
          invisible={!agentStore.error}
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 26 }} />
          </Box>
        </Badge>
      </Fab>
    </Zoom>
  );
});

export default AgentFAB;
