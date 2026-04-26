import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Divider,
  Button,
  Stack,
  Avatar,
  Snackbar,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useState, useCallback, type ReactNode } from 'react';
import { THEME_COLORS } from '../theme/colors';
import { useTranslation } from '../utils/i18n';
import type { TranslationKey } from '../utils/map';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

const CONTACT_EMAIL = 'a454888395@gmail.com';

async function copyEmailToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

function ContactCallout({
  email,
  t,
}: {
  email: string;
  t: (key: TranslationKey) => string;
}) {
  const [copiedOpen, setCopiedOpen] = useState(false);

  const handleCopyEmail = useCallback(async () => {
    await copyEmailToClipboard(email);
    setCopiedOpen(true);
  }, [email]);

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        border: '2px solid',
        borderColor: 'rgba(99, 102, 241, 0.32)',
        background:
          'linear-gradient(145deg, rgba(238, 242, 255, 0.98) 0%, rgba(224, 231, 255, 0.88) 45%, rgba(199, 210, 254, 0.55) 100%)',
        boxShadow: '0 6px 20px rgba(79, 70, 229, 0.12), inset 0 1px 0 rgba(255,255,255,0.65)',
        px: { xs: 2, sm: 2.5 },
        py: 2.5,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 45%, #a5b4fc 100%)',
        },
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
        <Avatar
          sx={{
            width: 52,
            height: 52,
            alignSelf: { xs: 'center', sm: 'flex-start' },
            mt: { sm: 0.25 },
            background: 'linear-gradient(145deg, #eef2ff 0%, #e0e7ff 100%)',
            color: '#4f46e5',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.15)',
          }}
        >
          <EmailOutlinedIcon sx={{ fontSize: 28 }} />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              letterSpacing: '0.02em',
              color: '#312e81',
              mb: 1,
              fontSize: '1.05rem',
            }}
          >
            {t('about.contactTitle')}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(49, 46, 129, 0.82)',
              lineHeight: 1.75,
              mb: 2,
              fontSize: '0.92rem',
              maxWidth: 420,
              mx: { xs: 'auto', sm: 0 },
            }}
          >
            {t('about.contactHint')}
          </Typography>
          <Button
            type="button"
            variant="contained"
            size="medium"
            onClick={handleCopyEmail}
            startIcon={<ContentCopyIcon sx={{ fontSize: 20 }} />}
            aria-label={t('about.contactHint')}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 2.25,
              py: 1,
              background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              wordBreak: 'break-all',
              '&:hover': {
                background: 'linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)',
                boxShadow: '0 6px 18px rgba(79, 70, 229, 0.42)',
              },
            }}
          >
            {email}
          </Button>
        </Box>
      </Stack>
      <Snackbar
        open={copiedOpen}
        autoHideDuration={2800}
        onClose={() => setCopiedOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopiedOpen(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
          {t('about.emailCopied')}
        </Alert>
      </Snackbar>
    </Box>
  );
}

const AboutDialog = ({ open, onClose }: AboutDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableScrollLock
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundImage: 'linear-gradient(to bottom, #fdfbf7 0%, #f8f6f1 100%)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            color: THEME_COLORS.paper.primary,
          }}
        >
          {t('about.title')}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* 关于项目 */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: THEME_COLORS.good,
              mb: 2,
              fontSize: '1.1rem',
            }}
          >
            {t('about.aboutProject')}
          </Typography>
          <Typography
            sx={{
              color: THEME_COLORS.paper.secondary,
              lineHeight: 1.8,
              mb: 2,
              fontSize: '0.95rem',
            }}
          >
            {t('about.projectDescription')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              my: 3,
            }}
          >
            <Button
              variant="contained"
              startIcon={<FavoriteIcon />}
              href="https://ko-fi.com/bigonion"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                backgroundColor: '#FF5E5B',
                color: 'white',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#ff4543',
                },
              }}
            >
              {t('about.donate')}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 致谢 */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: THEME_COLORS.good,
              mb: 2,
              fontSize: '1.1rem',
            }}
          >
            {t('about.acknowledgments')}
          </Typography>

          {/* Valen 致谢卡片 */}
          <TkxBox title={t('about.artAdviceTest')} content={''} theme="gold" />

          {/* 角色翻译与校对卡片 */}
          <TkxBox title={`${t('about.translationProofreading')}: ${t('about.weedinAllen')} `} content={``} theme="green" />


          {/* 美工设计参考卡片 */}
          <TkxBox title={t('about.designReference')} content={t('about.museum')} theme="pink" />
          {/* 特别鸣谢卡片 */}
          <TkxBox title={t('about.specialThanks')} content={t('about.nusClub')} theme="blue" />

          {/* 落款 */}
          <Typography
            sx={{
              color: THEME_COLORS.paper.secondary,
              lineHeight: 1.9,
              fontSize: '0.9rem',
              textAlign: 'right',
              fontStyle: 'italic',
              mt: 3,
              fontFamily: '"Georgia", "Times New Roman", serif',
            }}
          >
            {t('about.letterClosing')}
          </Typography>

          <Divider sx={{ my: 3 }} />

          <ContactCallout email={CONTACT_EMAIL} t={t} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;

type TkxTheme = 'blue' | 'gold' | 'pink' | 'green';

const TKX_THEMES: Record<TkxTheme, {
  bgGradient: string;
  borderColor: string;
  barGradient: string;
  titleColor: string;
  contentColor: string;
}> = {
  blue: {
    bgGradient: 'linear-gradient(135deg, rgba(240, 248, 255, 0.95) 0%, rgba(230, 245, 255, 0.9) 100%)',
    borderColor: 'rgba(66, 165, 245, 0.3)',
    barGradient: 'linear-gradient(90deg, #42a5f5 0%, #90caf9 50%, #42a5f5 100%)',
    titleColor: '#1565c0',
    contentColor: '#0d47a1',
  },
  gold: {
    bgGradient: 'linear-gradient(135deg, rgba(255, 249, 240, 0.95) 0%, rgba(255, 245, 230, 0.9) 100%)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    barGradient: 'linear-gradient(90deg, #d4af37 0%, #f0e68c 50%, #d4af37 100%)',
    titleColor: '#8b6914',
    contentColor: '#8b6914',
  },
  pink: {
    bgGradient: 'linear-gradient(135deg, rgba(255, 240, 245, 0.95) 0%, rgba(255, 235, 245, 0.9) 100%)',
    borderColor: 'rgba(236, 64, 122, 0.3)',
    barGradient: 'linear-gradient(90deg, #ec407a 0%, #f48fb1 50%, #ec407a 100%)',
    titleColor: '#ad1457',
    contentColor: '#880e4f',
  },
  green: {
    bgGradient: 'linear-gradient(135deg, rgba(245, 255, 245, 0.95) 0%, rgba(235, 255, 235, 0.9) 100%)',
    borderColor: 'rgba(102, 187, 106, 0.3)',
    barGradient: 'linear-gradient(90deg, #66bb6a 0%, #a5d6a7 50%, #66bb6a 100%)',
    titleColor: '#2e7d32',
    contentColor: '#1b5e20',
  },
};

type TkxBoxProps = {
  title: string;
  content: ReactNode;
  theme?: TkxTheme;
};

const TkxBox = ({ title, content, theme = 'blue' }: TkxBoxProps) => {
  const t = TKX_THEMES[theme];
  return (
    <Box
      sx={{
        background: t.bgGradient,
        borderRadius: 3,
        px: 2.5,
        pt: 2,
        mb: 2,
        border: '2px solid',
        borderColor: t.borderColor,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: t.barGradient,
        },
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <Typography
          sx={{
            fontWeight: 'bold',
            fontSize: '0.95rem',
            color: t.titleColor,
            mb: 0.5,
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            fontSize: '1.05rem',
            color: t.contentColor,
            fontWeight: 600,
            pl: 2,
            whiteSpace: 'pre-line',
          }}
        >
          {content}
        </Box>
      </Box>
    </Box>
  );
};
