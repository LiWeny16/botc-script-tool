import React, { useEffect } from 'react';
import { Box, IconButton, Typography, Tooltip, alpha } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Undo as UndoIcon, Redo as RedoIcon } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../utils/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import UserMenu from '../components/Auth/UserMenu';
import LoginDialog from '../components/Auth/LoginDialog';
import { imageGenStore } from '../stores/ImageGenStore';
import ImageGenSidebar from '../components/ImageGen/ImageGenSidebar';
import ImageGenCanvas from '../components/ImageGen/ImageGenCanvas';
import ImageGenInput from '../components/ImageGen/ImageGenInput';

export default observer(function ImageGen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      await imageGenStore.refreshProjects();
      if (imageGenStore.projects.length === 0) {
        await imageGenStore.createNewProject('Untitled', false);
      } else {
        const cur = imageGenStore.projects.find(p => p.id === imageGenStore.currentProjectId)
          ?? imageGenStore.projects[0];
        if (cur && imageGenStore.nodes.length === 0) {
          await imageGenStore.loadProject(cur.id, false);
        }
      }
    })();
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f5f5f7', overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          py: 0.5,
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: alpha('#000', 0.06),
          zIndex: 20,
          flexShrink: 0,
          height: 48,
        }}
      >
        <IconButton size="small" onClick={() => navigate('/')} sx={{ mr: 0.5 }}>
          <ArrowBackIcon sx={{ fontSize: 20 }} />
        </IconButton>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem', color: 'text.primary' }}>
          {t('imageGen.title')}
        </Typography>

        <Box sx={{ flex: 1 }} />

        <Tooltip title={t('imageGen.undo')} arrow>
          <span>
            <IconButton size="small" disabled={!imageGenStore.canUndo} onClick={() => imageGenStore.undo()} sx={{ mr: 0.5 }}>
              <UndoIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t('imageGen.redo')} arrow>
          <span>
            <IconButton size="small" disabled={!imageGenStore.canRedo} onClick={() => imageGenStore.redo()} sx={{ mr: 1 }}>
              <RedoIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </span>
        </Tooltip>

        <LanguageSwitcher />
        <UserMenu />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <ImageGenSidebar />

        <Box
          sx={{
            flex: 1,
            position: 'relative',
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <ImageGenCanvas />
          <ImageGenInput />
        </Box>
      </Box>
      <LoginDialog />
    </Box>
  );
});
