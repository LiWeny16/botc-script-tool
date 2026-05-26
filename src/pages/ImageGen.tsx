import React, { useEffect, useState } from 'react';
import { Box, IconButton, Typography, Tooltip, alpha, Avatar, Button } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Undo as UndoIcon, Redo as RedoIcon } from '@mui/icons-material';
import { GitHub as GitHubIcon } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../utils/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { imageGenStore } from '../stores/ImageGenStore';
import { supabase, isConfigured } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import ImageGenSidebar from '../components/ImageGen/ImageGenSidebar';
import ImageGenCanvas from '../components/ImageGen/ImageGenCanvas';
import ImageGenInput from '../components/ImageGen/ImageGenInput';

export default observer(function ImageGen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  // Restore session on mount
  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Handle OAuth callback (Supabase redirects back with hash)
  useEffect(() => {
    if (location.hash?.includes('access_token')) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      });
    }
  }, [location.hash]);

  const handleGitHubLogin = () => {
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin + '/#/image-gen' },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

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

        {isConfigured && (
          user ? (
            <Tooltip title={`Sign out — ${user.user_metadata?.user_name || user.email}`} arrow>
              <IconButton size="small" onClick={handleSignOut}>
                <Avatar
                  src={user.user_metadata?.avatar_url}
                  sx={{ width: 26, height: 26, ml: 1, cursor: 'pointer' }}
                >
                  {(user.user_metadata?.user_name || user.email)?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              size="small"
              variant="outlined"
              startIcon={<GitHubIcon sx={{ fontSize: 16 }} />}
              onClick={handleGitHubLogin}
              sx={{ borderRadius: 2, textTransform: 'none', ml: 1, fontSize: '0.75rem', py: 0.25 }}
            >
              Sign in
            </Button>
          )
        )}
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
    </Box>
  );
});
