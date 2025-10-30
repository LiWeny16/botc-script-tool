import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Link,
  Divider,
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { THEME_COLORS } from '../theme/colors';
import { useTranslation } from '../utils/i18n';
import type { ReactNode } from 'react';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
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
