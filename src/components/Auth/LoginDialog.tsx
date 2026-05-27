import React from 'react';
import {
  Dialog, DialogContent, Typography, Box, Button, alpha, IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { GitHub } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { motion, AnimatePresence } from 'framer-motion';
import { authStore } from '../../stores/AuthStore';
import { useTranslation } from '../../utils/i18n';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.45, ease: 'easeOut' as const },
  }),
};

const MotionBox = motion(Box);
const MotionButton = motion(Button);

export default observer(function LoginDialog() {
  const { t } = useTranslation();
  return (
    <Dialog
      open={authStore.loginDialogOpen}
      onClose={() => authStore.loginDialogOpen = false}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 5,
            overflow: 'hidden',
            bgcolor: '#fff',
          },
        },
      }}
    >
      <AnimatePresence>
        {authStore.loginDialogOpen && (
          <DialogContent sx={{ p: 0 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 5,
                px: 4,
                position: 'relative',
              }}
            >
              <IconButton
                onClick={() => authStore.loginDialogOpen = false}
                sx={{ position: 'absolute', right: 8, top: 8, color: alpha('#000', 0.35), zIndex: 1 }}
              >
                <Close />
              </IconButton>

              <MotionBox
                custom={0}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2.5,
                  boxShadow: `0 8px 32px ${alpha('#6366f1', 0.25)}`,
                }}
              >
                <GitHub sx={{ fontSize: 32, color: 'white' }} />
              </MotionBox>

              <MotionBox custom={1} initial="hidden" animate="visible" variants={fadeUp}>
                <Typography variant="h6" fontWeight={700} color="#1a1a1a" sx={{ mb: 0.5 }}>
                  {t('auth.welcome')}
                </Typography>
              </MotionBox>

              <MotionBox custom={2} initial="hidden" animate="visible" variants={fadeUp}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
                  {t('auth.description')}
                </Typography>
              </MotionBox>

              <MotionBox custom={3} initial="hidden" animate="visible" variants={fadeUp} sx={{ width: '100%' }}>
                <MotionButton
                  fullWidth
                  variant="contained"
                  startIcon={<GitHub />}
                  onClick={() => authStore.signInWithOAuth('github')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  sx={{
                    py: 1.5,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                    bgcolor: '#24292e',
                    '&:hover': { bgcolor: '#1a1f23' },
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  }}
                >
                  {t('auth.continueWithGithub')}
                </MotionButton>
              </MotionBox>

              <MotionBox custom={4} initial="hidden" animate="visible" variants={fadeUp}>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 2 }}>
                  {t('auth.privacy')}
                </Typography>
              </MotionBox>
            </Box>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
});
